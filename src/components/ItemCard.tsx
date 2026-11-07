import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORY_ICONS } from "../constants/categories";
import { colors } from "../constants/theme";
import { ListItem } from "../types/items";

interface Props {
  item: ListItem;
  onPress: () => void;
  // My posts shows Open/Returned; the Feed doesn't need to.
  showStatus?: boolean;
}

const ItemCard = ({ item, onPress, showStatus = false }: Props) => {
  const category = item.category?.trim() || "Other";
  const returned = item.status === "returned";

  return (
    <Pressable style={styles.card} onPress={onPress}>
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
          {showStatus && (
            <View style={[styles.badge, returned ? styles.statusReturned : styles.statusOpen]}>
              <Text style={[styles.badgeText, returned ? styles.statusReturnedText : styles.statusOpenText]}>
                {returned ? "RETURNED" : "OPEN"}
              </Text>
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
  statusOpen: { backgroundColor: colors.stampTint },
  statusOpenText: { color: colors.stamp },
  statusReturned: { backgroundColor: colors.foundTint },
  statusReturnedText: { color: colors.found },
  category: { fontWeight: "700", fontSize: 16, marginBottom: 2, color: colors.ink },
  location: { color: colors.inkSoft },
  notes: { marginTop: 4, fontStyle: "italic", color: colors.inkSoft },
});
