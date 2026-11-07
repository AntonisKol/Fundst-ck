import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  empty: { textAlign: "center", color: colors.inkSoft, marginTop: 40 },
  myPostsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.stamp,
  },
  myPostsText: { color: "white", fontWeight: "700" },
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
});
