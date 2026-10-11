import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  refreshError: { marginBottom: 12, color: colors.lost, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.inkSoft, marginTop: 40, lineHeight: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  // Same badge as the Feed.
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10, marginBottom: 3 },
  badgeFound: { backgroundColor: colors.found },
  badgeLost: { backgroundColor: colors.lost },
  badgeText: { color: "white", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  body: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  preview: { marginTop: 2, color: colors.inkSoft },
  previewUnread: { color: colors.ink, fontWeight: "600" },
  meta: { alignItems: "flex-end", marginLeft: 8 },
  time: { fontSize: 12, color: colors.inkSoft },
  unreadBadge: {
    marginTop: 6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.stamp,
  },
  unreadText: { color: "white", fontSize: 12, fontWeight: "700" },
});
