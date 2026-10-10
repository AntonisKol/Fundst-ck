import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  list: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 16 },
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
