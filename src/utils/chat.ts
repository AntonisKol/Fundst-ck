import { supabase } from "../supabase/supabase";
import { NETWORK_ERROR_MESSAGE } from "./items";

export type ItemType = "found" | "lost";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationSummary {
  id: string;
  item_id: string;
  item_type: ItemType;
  owner_id: string;
  requester_id: string;
  last_message_at: string;
  lastMessage: Pick<Message, "body" | "sender_id" | "created_at"> | null;
  unreadCount: number;
  item: { category: string | null; location: string; image_url: string | null } | null;
}

type Result<T> = { data: T; error: null } | { data: null; error: string };

// Conversations never show emails - the other person is named by their role.
// The poster of a found item is the finder; the poster of a lost item is the owner.
export const otherPartyLabel = (itemType: ItemType, iAmPoster: boolean) =>
  (itemType === "found") !== iAmPoster ? "Finder" : "Owner";

export const chatTitle = (role: string, category: string | null, location?: string) =>
  [role, category || "Other", location].filter(Boolean).join(" · ");

const run = async <T>(label: string, fn: () => Promise<Result<T>>): Promise<Result<T>> => {
  try {
    return await fn();
  } catch (err) {
    console.error(`Supabase ${label} error:`, err);
    return { data: null, error: NETWORK_ERROR_MESSAGE };
  }
};

export const startConversation = (itemType: ItemType, itemId: string) =>
  run("start_conversation", async () => {
    const { data, error } = await supabase.rpc("start_conversation", { p_item_type: itemType, p_item_id: itemId });
    if (error) {
      console.error("Supabase start_conversation error:", error);
      return { data: null, error: error.message };
    }
    return { data: data as string, error: null };
  });

export const fetchMessages = (conversationId: string) =>
  run("fetch messages", async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Supabase fetch messages error:", error);
      return { data: null, error: error.message };
    }
    return { data: data as Message[], error: null };
  });

export const sendMessage = (conversationId: string, senderId: string, body: string) =>
  run("send message", async () => {
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select()
      .single();
    if (error) {
      console.error("Supabase send message error:", error);
      return { data: null, error: error.message };
    }
    return { data: data as Message, error: null };
  });

export const markConversationRead = async (conversationId: string) => {
  const { error } = await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
  if (error) console.error("Supabase mark_conversation_read error:", error);
};

export const fetchConversations = (userId: string) =>
  run("fetch conversations", async () => {
    const [convRes, unreadRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("*, messages(body, sender_id, created_at)")
        .order("last_message_at", { ascending: false })
        .order("created_at", { referencedTable: "messages", ascending: false })
        .limit(1, { referencedTable: "messages" }),
      supabase.from("messages").select("conversation_id").is("read_at", null).neq("sender_id", userId),
    ]);
    if (convRes.error || unreadRes.error) {
      console.error("Supabase fetch conversations error:", convRes.error || unreadRes.error);
      return { data: null, error: (convRes.error || unreadRes.error)!.message };
    }

    const unread = new Map<string, number>();
    unreadRes.data.forEach(({ conversation_id }) => unread.set(conversation_id, (unread.get(conversation_id) || 0) + 1));

    // Item details live in two tables; fetch each table's items in one query.
    const idsByType = (type: ItemType) => convRes.data.filter((c) => c.item_type === type).map((c) => c.item_id);
    const [foundRes, lostRes] = await Promise.all(
      (["found", "lost"] as ItemType[]).map((type) =>
        supabase.from(`${type}_items`).select("id, category, location, image_url").in("id", idsByType(type))
      )
    );
    const items = new Map([...(foundRes.data || []), ...(lostRes.data || [])].map((item) => [item.id, item]));

    const conversations: ConversationSummary[] = convRes.data.map(({ messages, ...conv }) => ({
      ...conv,
      lastMessage: messages?.[0] || null,
      unreadCount: unread.get(conv.id) || 0,
      item: items.get(conv.item_id) || null,
    }));
    return { data: conversations, error: null };
  });
