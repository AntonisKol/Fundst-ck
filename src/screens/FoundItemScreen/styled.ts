import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", padding: 20 },
  // BlurView on Android doesn't reliably clip to its own borderRadius, so
  // the radius + clipping live on this plain wrapper instead.
  cardWrapper: { width: "100%", borderRadius: 24, overflow: "hidden" },
  card: { padding: 24, backgroundColor: "rgba(255,255,255,0.9)" },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 4, color: colors.ink },
  subtitle: { textAlign: "center", color: colors.inkSoft, marginBottom: 16 },
  imageBox: { width: "100%", height: 220, backgroundColor: colors.surfaceMuted, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 20, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  imageText: { color: colors.inkSoft, fontSize: 16, fontWeight: "600" },
  loadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, color: "white", fontWeight: "600" },
  formGroup: { marginBottom: 12 },
  label: { marginBottom: 6, fontWeight: "600", color: colors.ink },
  chipContainer: { flexDirection: "row", marginVertical: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: colors.surfaceMuted, borderRadius: 20, marginRight: 10 },
  chipSelected: { backgroundColor: colors.stamp },
  chipText: { color: colors.inkSoft, fontWeight: "500" },
  chipTextSelected: { color: "white", fontWeight: "700" },
  input: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 15 },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  errorInput: { borderColor: colors.lost },
  saveButton: { marginTop: 15, paddingVertical: 16, borderRadius: 14, alignItems: "center", backgroundColor: colors.found },
  saveText: { color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});
