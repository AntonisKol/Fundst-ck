import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORY_ICONS } from "../constants/categories";
import { colors } from "../constants/theme";
import { ListItem } from "../types/items";
import Skeleton, { SkeletonBlock, SkeletonLine } from "./Skeleton";

interface Props {
  item: ListItem;
  onPress: () => void;
  // My posts flags returned posts; the Feed doesn't need to.
  showStatus?: boolean;
}

const ItemCard = ({ item, onPress, showStatus = false }: Props) => {
  const category = item.category?.trim() || "Other";

  return (
    // testID: the screenshot flow (.maestro/) taps the first card, whatever post it is.
    <Pressable style={styles.card} onPress={onPress} testID="item-card">
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name={CATEGORY_ICONS[category] ?? "cube-outline"} size={32} color={colors.inkSoft} />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.badges}>
          <View style={[styles.badge, item.type === "found" ? styles.badgeFound : styles.badgeLost]}>
            <Text style={styles.badgeText}>{item.type === "found" ? "FOUND" : "LOST"}</Text>
          </View>
          {showStatus && item.status === "returned" && (
            <View style={[styles.badge, styles.statusReturned]}>
              <Text style={[styles.badgeText, styles.statusReturnedText]}>RETURNED</Text>
            </View>
          )}
        </View>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.location}>{item.location}</Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </View>
    </Pressable>
  );
};

// Placeholder cards for the first load. They reuse the card's own styles so
// nothing shifts when the real cards replace them.
export const ItemCardSkeletonList = ({ count = 5 }: { count?: number }) => (
  <Skeleton>
    {Array.from({ length: count }, (_, index) => (
      <View key={index} style={styles.card}>
        <SkeletonBlock style={styles.image} />
        <View style={styles.body}>
          <SkeletonBlock style={styles.badgeSkeleton} />
          <SkeletonLine width="55%" style={styles.categorySkeleton} />
          <SkeletonLine width="30%" />
        </View>
      </View>
    ))}
  </Skeleton>
);

export default ItemCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  image: { width: 80, height: 80, borderRadius: 12 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted },
  body: { flex: 1, marginLeft: 12 },
  badges: { flexDirection: "row", gap: 6, marginBottom: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  badgeFound: { backgroundColor: colors.found },
  badgeLost: { backgroundColor: colors.lost },
  badgeText: { color: "white", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  statusReturned: { backgroundColor: colors.foundTint },
  statusReturnedText: { color: colors.found },
  category: { fontWeight: "700", fontSize: 16, marginBottom: 2, color: colors.ink },
  location: { color: colors.inkSoft },
  notes: { marginTop: 4, fontStyle: "italic", color: colors.inkSoft },
  badgeSkeleton: { width: 52, height: 17, borderRadius: 12, marginBottom: 8 },
  categorySkeleton: { height: 14, marginBottom: 8 },
});
