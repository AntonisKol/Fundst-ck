import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation, StackActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../context/AuthContext";
import RequireAuthPrompt from "../../components/RequireAuthPrompt";
import { fetchConversations, otherPartyLabel, chatTitle, ConversationSummary } from "../../utils/chat";
import { colors } from "../../constants/theme";
import { styles } from "./styled";

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "numeric", month: "short" });
};

const MessagesScreen = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await fetchConversations(userId);
    if (data) setConversations(data);
    setLoading(false);
  }, [userId]);

  // Refresh when returning from a chat (read state changed) ...
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ... and live, when any of my conversations gets a message. RLS limits
  // these events to conversations I'm part of.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("messages_list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  if (!session) {
    return <RequireAuthPrompt message="Sign in to message finders and owners." />;
  }

  const renderConversation = ({ item: conv }: { item: ConversationSummary }) => {
    const title = chatTitle(otherPartyLabel(conv.item_type, conv.owner_id === userId), conv.item?.category ?? null, conv.item?.location);
    const unread = conv.unreadCount > 0;
    const preview = conv.lastMessage
      ? `${conv.lastMessage.sender_id === userId ? "You: " : ""}${conv.lastMessage.body}`
      : "No messages yet";

    return (
      <Pressable
        style={styles.row}
        onPress={() => navigation.dispatch(StackActions.push("Chat", { conversationId: conv.id, title }))}
      >
        {conv.item?.image_url ? <Image source={{ uri: conv.item.image_url }} style={styles.image} /> : <View style={styles.image} />}
        <View style={styles.body}>
          <Text style={styles.rowTitle} numberOfLines={1}>{conv.item ? title : "Item removed"}</Text>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>{preview}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.time}>{formatWhen(conv.lastMessage?.created_at || conv.last_message_at)}</Text>
          {unread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.page}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: insets.top + 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderConversation}
          contentContainerStyle={[styles.list, { paddingTop: insets.top + 16 }]}
          ListHeaderComponent={<Text style={styles.title}>Messages</Text>}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No conversations yet.{"\n"}Open an item and tap the contact button to start one.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            />
          }
        />
      )}
    </View>
  );
};

export default MessagesScreen;
