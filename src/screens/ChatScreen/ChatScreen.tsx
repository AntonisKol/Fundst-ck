import { useCallback, useEffect, useRef, useState } from "react";
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
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../context/AuthContext";
import { useUnread } from "../../context/UnreadContext";
import { fetchMessages, sendMessage, markConversationRead, Message } from "../../utils/chat";
import { blockedContentReason, CHAT_INPUT_PLACEHOLDER } from "../../constants/safety";
import SafetyNotice from "../../components/SafetyNotice";
import { colors } from "../../constants/theme";
import { styles } from "./styled";

export interface ChatParams {
  conversationId: string;
  title: string;
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatScreen = () => {
  const { conversationId, title } = useRoute().params as ChatParams;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const { setActiveConversation } = useUnread();

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
      if (data) setMessages(data);
      else Alert.alert("Error", error);
      setLoading(false);
      markConversationRead(conversationId);
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
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
        <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(item.created_at)}</Text>
      </View>
    );
  };

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={<SafetyNotice />}
          ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi!</Text>}
        />
      )}

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
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
