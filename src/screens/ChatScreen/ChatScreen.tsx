import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../context/AuthContext";
import { useUnread } from "../../context/UnreadContext";
import {
  blockUser,
  fetchConversationPartner,
  fetchMessages,
  hasBlocked,
  markConversationRead,
  Message,
  sendMessage,
  unblockUser,
} from "../../utils/chat";
import { blockedContentReason, CHAT_INPUT_PLACEHOLDER } from "../../constants/safety";
import SafetyNotice from "../../components/SafetyNotice";
import TopBar from "../../components/TopBar";
import ReportSheet from "../../components/ReportSheet";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { styles } from "./styled";
import { RootStackParamList } from "../../types/navigation";

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatScreen = ({ route }: NativeStackScreenProps<RootStackParamList, "Chat">) => {
  const { conversationId, title } = route.params;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { setActiveConversation } = useUnread();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportedMessage, setReportedMessage] = useState<Message | null>(null);

  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (userId) fetchConversationPartner(conversationId, userId).then(setPartnerId);
  }, [conversationId, userId]);

  useEffect(() => {
    if (userId && partnerId) hasBlocked(userId, partnerId).then(setBlocked);
  }, [userId, partnerId]);

  const block = async () => {
    if (!userId || !partnerId) return;
    const error = await blockUser(userId, partnerId);
    if (error) {
      Alert.alert("Couldn't block this person", error);
      return;
    }
    setBlocked(true);
  };

  const unblock = async () => {
    if (!userId || !partnerId) return;
    const error = await unblockUser(userId, partnerId);
    if (error) {
      Alert.alert("Couldn't unblock this person", error);
      return;
    }
    setBlocked(false);
  };

  const confirmBlock = () =>
    Alert.alert(
      "Block this person?",
      "Neither of you will be able to send messages in your chats. They won't be told you blocked them.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: block },
      ]
    );

  const openMenu = () =>
    Alert.alert("Chat options", undefined, [
      { text: "Report", onPress: () => openReport(null) },
      blocked ? { text: "Unblock", onPress: unblock } : { text: "Block", style: "destructive", onPress: confirmBlock },
      { text: "Cancel", style: "cancel" },
    ]);

  const openReport = (message: Message | null) => {
    setReportedMessage(message);
    setReporting(true);
  };

  // No banners for the chat that's already on screen.
  useFocusEffect(
    useCallback(() => {
      setActiveConversation(conversationId);
      return () => setActiveConversation(null);
    }, [conversationId, setActiveConversation])
  );

  // Realtime and our own insert can both deliver the same message.
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  useEffect(() => {
    fetchMessages(conversationId).then(({ data, error }) => {
      setLoading(false);
      markConversationRead(conversationId);
      if (!data) {
        Alert.alert("Error", error);
        return;
      }
      setMessages(data);
    });

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        ({ new: message }) => {
          addMessage(message as Message);
          if ((message as Message).sender_id !== userId) markConversationRead(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, addMessage]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !userId || sending) return;

    const blockedReason = blockedContentReason(body);
    if (blockedReason) {
      Alert.alert("Message not sent", blockedReason);
      return;
    }

    setSending(true);
    const { data, error } = await sendMessage(conversationId, userId, body);
    setSending(false);

    if (!data) {
      Alert.alert("Message not sent", error);
      return;
    }
    setDraft("");
    addMessage(data);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const mine = item.sender_id === userId;
    return (
      <Pressable
        style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}
        // Long-press someone else's message to report it.
        onLongPress={mine ? undefined : () => openReport(item)}
        accessibilityHint={mine ? undefined : "Long press to report this message"}
      >
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
        <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(item.created_at)}</Text>
      </Pressable>
    );
  };

  const canSend = draft.trim().length > 0 && !sending;

  // The list is inverted - the standard chat layout - so it opens at the
  // newest message and stays there as messages arrive. It wants newest first.
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);

  const renderMessages = () => {
    if (loading) return <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />;

    if (messages.length === 0) {
      // Rendered outside the inverted list, which would flip it upside down.
      return (
        <View style={[styles.list, styles.emptyContainer]}>
          <SafetyNotice />
          <Text style={styles.empty}>No messages yet. Say hi!</Text>
        </View>
      );
    }

    return (
      <FlatList
        inverted
        data={newestFirst}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        // In an inverted list the footer sits above the oldest message.
        ListFooterComponent={<SafetyNotice />}
      />
    );
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TopBar
        title={title ?? "Chat"}
        right={
          partnerId ? (
            <Pressable onPress={openMenu} hitSlop={12} accessibilityRole="button" accessibilityLabel="Chat options">
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.stamp} />
            </Pressable>
          ) : undefined
        }
      />

      {renderMessages()}

      {blocked ? (
        <View style={[styles.blockedBar, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.blockedText}>You blocked this person.</Text>
          <Pressable onPress={unblock} hitSlop={8} accessibilityRole="button">
            <Text style={styles.unblockText}>Unblock</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder={CHAT_INPUT_PLACEHOLDER}
            placeholderTextColor={colors.inkSoft}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={2000}
          />
          <Pressable onPress={send} disabled={!canSend} style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
            {sending ? <ActivityIndicator color="white" /> : <Text style={styles.sendText}>Send</Text>}
          </Pressable>
        </View>
      )}

      {partnerId && userId ? (
        <ReportSheet
          visible={reporting}
          reporterId={userId}
          reportedUserId={partnerId}
          message={reportedMessage}
          onClose={() => setReporting(false)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
