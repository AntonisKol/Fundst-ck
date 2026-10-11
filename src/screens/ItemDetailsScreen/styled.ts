import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  container: { padding: 20, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.9)" },
  image: { width: "100%", aspectRatio: 4 / 3, borderRadius: 16, marginBottom: 16 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted },
  badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  badgeFound: { backgroundColor: colors.found },
  badgeLost: { backgroundColor: colors.lost },
  badgeText: { color: "white", fontWeight: "700", fontSize: 12, letterSpacing: 0.5 },
  // Same label/value pattern as the Settings screen.
  label: { marginTop: 12, fontWeight: "700", fontSize: 14, color: colors.inkSoft },
  value: { fontSize: 16, marginTop: 2, color: colors.ink },
  actionButton: { marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  actionButtonFound: { backgroundColor: colors.found },
  actionButtonLost: { backgroundColor: colors.lost },
  actionButtonText: { color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  ownPostNote: { marginTop: 24, color: colors.inkSoft, fontStyle: "italic", textAlign: "center" },
});
