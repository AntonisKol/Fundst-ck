import { Text, Image, ScrollView, View, Alert, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { styles } from "./styled";
import React from "react";

export type ItemType = "found" | "lost";

type RootStackParamList = {
  ItemDetails: {
    id: string;
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
  const { type, image_url, category, location, notes } =
    route.params as RootStackParamList["ItemDetails"];

  const isFound = type === "found";

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

      <Pressable
        style={[styles.actionButton, isFound ? styles.actionButtonFound : styles.actionButtonLost]}
        onPress={() => Alert.alert("Coming soon", "This feature isn't available yet.")}
      >
        <Text style={styles.actionButtonText}>
          {isFound ? "Claim / Contact Finder" : "This is mine / Contact reporter"}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default ItemDetailsScreen;
