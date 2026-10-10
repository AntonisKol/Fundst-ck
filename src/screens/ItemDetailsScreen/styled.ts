import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 40, alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginBottom: 16,
  },
  backText: { fontSize: 16, color: colors.stamp, fontWeight: "600" },
  topBarTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  topBarSpacer: { width: 50 },
  image: { width: 300, height: 300, borderRadius: 12, marginBottom: 20 },
  badge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  badgeFound: { backgroundColor: colors.found },
  badgeLost: { backgroundColor: colors.lost },
  badgeText: { color: "white", fontWeight: "700", letterSpacing: 0.5 },
  label: { fontWeight: "700", fontSize: 16, marginTop: 10, color: colors.ink },
  text: { fontSize: 16, marginBottom: 5, color: colors.inkSoft },
  actionButton: { alignSelf: "stretch", marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  actionButtonFound: { backgroundColor: colors.found },
  actionButtonLost: { backgroundColor: colors.lost },
  ownPostNote: { marginTop: 24, color: colors.inkSoft, fontStyle: "italic", textAlign: "center" },
  actionButtonText: { color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});
