import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation, StackActions } from "@react-navigation/native";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../context/AuthContext";
import RequireAuthPrompt from "../../components/RequireAuthPrompt";
import ScreenHeader from "../../components/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORY_ICONS } from "../../constants/categories";
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

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await fetchConversations(userId);
    if (data) setConversations(data);
    setLoadError(error);
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
    return (
      <View style={styles.page}>
        <ScreenHeader title="Messages" />
        <RequireAuthPrompt message="Sign in to message finders and owners." />
      </View>
    );
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
        {conv.item?.image_url ? (
          <Image source={{ uri: conv.item.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name={CATEGORY_ICONS[conv.item?.category || "Other"] ?? "cube-outline"} size={26} color={colors.inkSoft} />
          </View>
        )}
        <View style={styles.body}>
          <View style={[styles.badge, conv.item_type === "found" ? styles.badgeFound : styles.badgeLost]}>
            <Text style={styles.badgeText}>{conv.item_type === "found" ? "FOUND" : "LOST"}</Text>
          </View>
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
      <ScreenHeader title="Messages" />
      {loading ? (
        <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            // With chats already listed, keep them and flag the failed refresh.
            loadError && conversations.length > 0 ? (
              <Text style={styles.refreshError}>Couldn't refresh. Pull down to try again.</Text>
            ) : null
          }
          ListEmptyComponent={
            loadError ? (
              <Text style={styles.empty}>
                Couldn't load your messages.{"\n"}Pull down to try again.
              </Text>
            ) : (
              <Text style={styles.empty}>
                No conversations yet.{"\n"}Open an item and tap the contact button to start one.
              </Text>
            )
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
