import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  empty: { textAlign: "center", color: colors.inkSoft, marginTop: 40 },
  categories: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: colors.stamp,
  },
  categoryText: {
    color: colors.ink,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#fff",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeFound: {
    backgroundColor: colors.found,
  },
  badgeLost: {
    backgroundColor: colors.lost,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  category: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
    color: colors.ink,
  },
  location: {
    color: colors.inkSoft,
  },
  notes: {
    marginTop: 4,
    fontStyle: "italic",
    color: colors.inkSoft,
  },
});
