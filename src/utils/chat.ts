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

// Postgres's code for `raise exception`: our own rules refusing a message (a block,
// a link, the spam limit). Expected, and the user is shown the reason, so not logged.
const REFUSED_BY_RULE = "P0001";

export const sendMessage = (conversationId: string, senderId: string, body: string) =>
  run("send message", async () => {
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select()
      .single();
    if (error) {
      if (error.code !== REFUSED_BY_RULE) console.error("Supabase send message error:", error);
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

    // Item details live in two tables; fetch each table's items in one query,
    // skipping tables with no items to look up.
    const fetchItems = async (type: ItemType) => {
      const ids = convRes.data.filter((c) => c.item_type === type).map((c) => c.item_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from(`${type}_items`).select("id, category, location, image_url").in("id", ids);
      // Missing item details aren't fatal - the row shows "Item removed".
      if (error) console.error(`Supabase fetch ${type}_items for conversations error:`, error);
      return data || [];
    };
    const [found, lost] = await Promise.all([fetchItems("found"), fetchItems("lost")]);
    const items = new Map([...found, ...lost].map((item) => [item.id, item]));

    const conversations: ConversationSummary[] = convRes.data.map(({ messages, ...conv }) => ({
      ...conv,
      lastMessage: messages?.[0] || null,
      unreadCount: unread.get(conv.id) || 0,
      item: items.get(conv.item_id) || null,
    }));
    return { data: conversations, error: null };
  });

export const REPORT_REASONS = [
  { value: "scam", label: "Scam or fraud" },
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export const REPORT_NOTE_MAX_LENGTH = 1000;

const UNIQUE_VIOLATION = "23505";

// Returns an error message to show the user, or null on success.
export const reportUser = async ({
  reporterId,
  reportedUserId,
  messageId,
  reason,
  note,
}: {
  reporterId: string;
  reportedUserId: string;
  messageId: string | null;
  reason: ReportReason;
  note: string;
}): Promise<string | null> => {
  try {
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      message_id: messageId,
      reason,
      note: note.trim() || null,
    });
    if (!error) return null;
    if (error.code === UNIQUE_VIOLATION) {
      return messageId ? "You've already reported this message." : "You've already reported this person.";
    }

    console.error("Supabase report error:", error);
    return error.message;
  } catch (err) {
    console.error("Supabase report error:", err);
    return NETWORK_ERROR_MESSAGE;
  }
};

// The other person in a conversation, or null if it can't be loaded.
export const fetchConversationPartner = async (conversationId: string, userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("owner_id, requester_id")
      .eq("id", conversationId)
      .single();
    if (error) {
      console.error("Supabase fetch conversation error:", error);
      return null;
    }
    return data.owner_id === userId ? data.requester_id : data.owner_id;
  } catch (err) {
    console.error("Supabase fetch conversation error:", err);
    return null;
  }
};

// Blocks are private: this only ever sees blocks the user made, never one
// made against them. Those surface as a refused message instead.
export const hasBlocked = async (userId: string, otherId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId)
      .eq("blocked_id", otherId)
      .maybeSingle();
    if (error) {
      console.error("Supabase fetch block error:", error);
      return false;
    }
    return data !== null;
  } catch (err) {
    console.error("Supabase fetch block error:", err);
    return false;
  }
};

// These return an error message to show the user, or null on success.
export const blockUser = async (userId: string, otherId: string): Promise<string | null> => {
  try {
    const { error } = await supabase.from("blocks").insert({ blocker_id: userId, blocked_id: otherId });
    // Already blocked is what the user wanted anyway.
    if (!error || error.code === UNIQUE_VIOLATION) return null;

    console.error("Supabase block error:", error);
    return error.message;
  } catch (err) {
    console.error("Supabase block error:", err);
    return NETWORK_ERROR_MESSAGE;
  }
};

export const unblockUser = async (userId: string, otherId: string): Promise<string | null> => {
  try {
    const { error } = await supabase.from("blocks").delete().eq("blocker_id", userId).eq("blocked_id", otherId);
    if (!error) return null;

    console.error("Supabase unblock error:", error);
    return error.message;
  } catch (err) {
    console.error("Supabase unblock error:", err);
    return NETWORK_ERROR_MESSAGE;
  }
};
