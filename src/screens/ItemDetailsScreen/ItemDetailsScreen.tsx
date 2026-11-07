import { useState } from "react";
import { Text, Image, ScrollView, View, Alert, Pressable, ActivityIndicator } from "react-native";
import { useNavigation, StackActions } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import TopBar from "../../components/TopBar";
import { CATEGORY_ICONS } from "../../constants/categories";
import { BERLIN_ZIP_CODES } from "../../constants/berlinZipCodes";
import { colors } from "../../constants/theme";
import { startConversation, otherPartyLabel, chatTitle } from "../../utils/chat";
import { deleteItem, setItemStatus } from "../../utils/items";
import { SAFETY_TIPS } from "../../constants/safety";
import { styles } from "./styled";
import { RootStackParamList } from "../../types/navigation";

const SAFETY_TIPS_SEEN_KEY = "safetyTipsSeen";

// Shows the safety tips the first time a user starts a chat on this device.
// Resolves once they've acknowledged them (or straight away if seen before).
const acknowledgeSafetyTipsOnce = async () => {
  try {
    if (await AsyncStorage.getItem(SAFETY_TIPS_SEEN_KEY)) return;
  } catch {
    // Storage unavailable - just show the tips.
  }

  const acknowledged = await new Promise<boolean>((resolve) =>
    Alert.alert("Before you chat", SAFETY_TIPS.map((tip) => `• ${tip}`).join("\n\n"), [
      { text: "I understand", onPress: () => resolve(true) },
    ], { cancelable: false, onDismiss: () => resolve(false) })
  );
  // Only an explicit "I understand" counts - a dismissed alert shows again next time.
  if (acknowledged) AsyncStorage.setItem(SAFETY_TIPS_SEEN_KEY, "1").catch(() => {});
};

const ItemDetailsScreen = ({ route }: NativeStackScreenProps<RootStackParamList, "ItemDetails">) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const [starting, setStarting] = useState(false);
  const { id, user_id, type, image_url, category, location, notes } = route.params;
  const [status, setStatus] = useState(route.params.status);
  const [deleting, setDeleting] = useState(false);

  const isFound = type === "found";
  const isReturned = status === "returned";
  const isMine = !!session && session.user.id === user_id;

  const contact = async () => {
    if (!session) {
      navigation.navigate("MainTabs", { screen: "Settings" });
      return;
    }

    await acknowledgeSafetyTipsOnce();

    setStarting(true);
    const { data: conversationId, error } = await startConversation(type, id);
    setStarting(false);

    if (error !== null) {
      Alert.alert("Couldn't start chat", error);
      return;
    }
    const title = chatTitle(otherPartyLabel(type, false), category, location);
    navigation.dispatch(StackActions.push("Chat", { conversationId, title }));
  };

  // Optimistic: the screen updates straight away and reverts if the server refuses.
  const toggleReturned = async () => {
    const previous = status;
    const next = isReturned ? "open" : "returned";
    setStatus(next);

    const error = await setItemStatus(type, id, next);
    if (error === null) return;

    setStatus(previous);
    Alert.alert("Couldn't update post", error);
  };

  const removePost = async () => {
    setDeleting(true);
    const error = await deleteItem(type, id);
    setDeleting(false);

    if (error !== null) {
      Alert.alert("Couldn't delete post", error);
      return;
    }
    navigation.goBack();
  };

  const confirmDelete = () =>
    Alert.alert("Delete this post?", "It will disappear for everyone. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: removePost },
    ]);

  const renderOwnerActions = () => (
    <>
      <Text style={styles.ownPostNote}>This is your post</Text>
      <Pressable style={[styles.actionButton, styles.actionButtonFound]} onPress={toggleReturned}>
        <Text style={styles.actionButtonText}>{isReturned ? "Mark as open again" : "Mark as returned"}</Text>
      </Pressable>
      <Pressable
        disabled={deleting}
        style={[styles.deleteButton, deleting && { opacity: 0.6 }]}
        onPress={confirmDelete}
      >
        {deleting ? <ActivityIndicator color={colors.lost} /> : <Text style={styles.deleteButtonText}>Delete post</Text>}
      </Pressable>
    </>
  );

  const renderAction = () => {
    if (isMine) return renderOwnerActions();
    if (isReturned) return <Text style={styles.ownPostNote}>This item has been returned</Text>;
    // Posts from before accounts existed have no poster to contact.
    if (!user_id) return <Text style={styles.ownPostNote}>The poster of this item can't be contacted</Text>;

    return (
      <Pressable
        disabled={starting}
        style={[styles.actionButton, isFound ? styles.actionButtonFound : styles.actionButtonLost, starting && { opacity: 0.6 }]}
        onPress={contact}
      >
        {starting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.actionButtonText}>
            {!session
              ? "Sign in to contact"
              : isFound ? "This is mine · Contact finder" : "I found this · Contact owner"}
          </Text>
        )}
      </Pressable>
    );
  };

  const area = BERLIN_ZIP_CODES.find((z) => z.zip === location)?.area;

  return (
    <View style={styles.page}>
      <TopBar title="Item details" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {image_url ? (
            <Image source={{ uri: image_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name={CATEGORY_ICONS[category || "Other"] ?? "cube-outline"} size={56} color={colors.inkSoft} />
            </View>
          )}

          <View style={styles.badges}>
            <View style={[styles.badge, isFound ? styles.badgeFound : styles.badgeLost]}>
              <Text style={styles.badgeText}>{isFound ? "FOUND" : "LOST"}</Text>
            </View>
            {isReturned && (
              <View style={[styles.badge, styles.badgeReturned]}>
                <Text style={[styles.badgeText, styles.badgeReturnedText]}>RETURNED</Text>
              </View>
            )}
          </View>

          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{category || "Other"}</Text>

          <Text style={styles.label}>{isFound ? "Found near" : "Last seen near"}</Text>
          <Text style={styles.value}>{area ? `${location} · ${area}` : location}</Text>

          {notes ? (
            <>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{notes}</Text>
            </>
          ) : null}
        </View>

        {renderAction()}
      </ScrollView>
    </View>
  );
};

export default ItemDetailsScreen;
