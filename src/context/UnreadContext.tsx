import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "../supabase/supabase";
import { useAuth } from "./AuthContext";
import { Message } from "../utils/chat";
import {
  messageNotificationsEnabled,
  requestNotificationPermission,
  showMessageNotification,
} from "../utils/notifications";

interface UnreadContextValue {
  unreadCount: number;
  // The chat on screen right now - its messages don't trigger a banner.
  setActiveConversation: (conversationId: string | null) => void;
}

const UnreadContext = createContext<UnreadContextValue>({ unreadCount: 0, setActiveConversation: () => {} });

export const UnreadProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const notificationsOn = messageNotificationsEnabled(session);

  const [unreadCount, setUnreadCount] = useState(0);
  const activeConversation = useRef<string | null>(null);
  const notificationsOnRef = useRef(notificationsOn);
  notificationsOnRef.current = notificationsOn;

  const refreshCount = useCallback(async () => {
    if (!userId) return;
    // RLS limits this to messages in my own conversations.
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)
      .neq("sender_id", userId);
    if (error) console.error("Supabase unread count error:", error);
    else setUnreadCount(count ?? 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    requestNotificationPermission();
    refreshCount();

    const channel = supabase
      .channel("unread_count")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ({ new: row }) => {
        const message = row as Message;
        refreshCount();
        if (
          message.sender_id !== userId &&
          message.conversation_id !== activeConversation.current &&
          notificationsOnRef.current
        ) {
          showMessageNotification(message.body, message.conversation_id);
        }
      })
      // Read receipts arrive as updates.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => refreshCount())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshCount]);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    activeConversation.current = conversationId;
  }, []);

  return (
    <UnreadContext.Provider value={{ unreadCount, setActiveConversation }}>{children}</UnreadContext.Provider>
  );
};

export const useUnread = () => useContext(UnreadContext);
