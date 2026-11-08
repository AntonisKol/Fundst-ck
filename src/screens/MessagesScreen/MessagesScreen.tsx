import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Image, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation, StackActions } from "@react-navigation/native";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../context/AuthContext";
import RequireAuthPrompt from "../../components/RequireAuthPrompt";
import ScreenHeader from "../../components/ScreenHeader";
import Skeleton, { SkeletonBlock, SkeletonLine } from "../../components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORY_ICONS } from "../../constants/categories";
import { fetchConversations, otherPartyLabel, chatTitle, ConversationSummary } from "../../utils/chat";
import { colors } from "../../constants/theme";
import { styles } from "./styled";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "numeric", month: "short" });
};

// Placeholder rows for the first load, built from the real row's styles so
// the list doesn't jump when the conversations replace them.
const ConversationSkeletonList = () => (
  <Skeleton style={styles.list}>
    {Array.from({ length: 6 }, (_, index) => (
      <View key={index} style={styles.row}>
        <SkeletonBlock style={styles.image} />
        <View style={styles.body}>
          <SkeletonBlock style={styles.badgeSkeleton} />
          <SkeletonLine width="65%" style={styles.titleSkeleton} />
          <SkeletonLine width="85%" />
        </View>
        <View style={styles.meta}>
          <SkeletonLine width={36} />
        </View>
      </View>
    ))}
  </Skeleton>
);

const MessagesScreen = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);

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

  const blockedCount = conversations.filter((conversation) => conversation.blocked).length;

  const renderConversation = ({ item: conv }: { item: ConversationSummary }) => {
    const title = chatTitle(otherPartyLabel(conv.item_type, conv.owner_id === userId), conv.item?.category ?? null, conv.item?.location);
    const unread = conv.unreadCount > 0;
    const preview = conv.blocked
      ? "You blocked this person"
      : conv.lastMessage
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
        <ConversationSkeletonList />
      ) : (
        <FlatList
          data={showBlocked ? conversations : conversations.filter((conversation) => !conversation.blocked)}
          keyExtractor={(c) => c.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            // With chats already listed, keep them and flag the failed refresh.
            loadError && conversations.length > 0 ? (
              <Text style={styles.refreshError}>Couldn’t refresh. Pull down to try again.</Text>
            ) : null
          }
          // Blocked chats stay reachable: Unblock lives inside the chat.
          ListFooterComponent={
            blockedCount > 0 ? (
              <Pressable style={styles.blockedToggle} onPress={() => setShowBlocked(!showBlocked)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.blockedToggleText}>
                  {showBlocked ? "Hide blocked chats" : `Show blocked chats (${blockedCount})`}
                </Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            loadError ? (
              <Text style={styles.empty}>
                Couldn’t load your messages.{"\n"}Pull down to try again.
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
