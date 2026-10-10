import { useState } from "react";
import { Text, Image, ScrollView, View, Alert, Pressable, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, StackActions } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { startConversation, otherPartyLabel, chatTitle } from "../../utils/chat";
import { styles } from "./styled";

export type ItemType = "found" | "lost";

type RootStackParamList = {
  ItemDetails: {
    id: string;
    user_id: string | null;
    type: ItemType;
    image_url: string | null;
    category: string | null;
    location: string;
    notes?: string;
    created_at: string;
  };
};

const ItemDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { session } = useAuth();
  const [starting, setStarting] = useState(false);
  const { id, user_id, type, image_url, category, location, notes } =
    route.params as RootStackParamList["ItemDetails"];

  const isFound = type === "found";
  const isMine = !!session && session.user.id === user_id;

  const contact = async () => {
    if (!session) {
      navigation.navigate("MainTabs" as never, { screen: "Account" } as never);
      return;
    }

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

  const renderAction = () => {
    if (isMine) return <Text style={styles.ownPostNote}>This is your post</Text>;
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

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Item Details</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={[styles.badge, isFound ? styles.badgeFound : styles.badgeLost]}>
        <Text style={styles.badgeText}>{isFound ? "FOUND" : "LOST"}</Text>
      </View>

      {image_url && <Image source={{ uri: image_url }} style={styles.image} />}

      <Text style={styles.label}>Category:</Text>
      <Text style={styles.text}>{category || "Other"}</Text>

      <Text style={styles.label}>{isFound ? "Location found:" : "Last seen near:"}</Text>
      <Text style={styles.text}>{location}</Text>

      {notes && (
        <>
          <Text style={styles.label}>Notes:</Text>
          <Text style={styles.text}>{notes}</Text>
        </>
      )}

      {renderAction()}
    </ScrollView>
  );
};

export default ItemDetailsScreen;
