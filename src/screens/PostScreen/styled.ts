import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  switch: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    padding: 4,
  },
  option: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 16 },
  optionFound: { backgroundColor: colors.found },
  optionLost: { backgroundColor: colors.lost },
  optionText: { color: colors.ink, fontWeight: "600" },
  optionTextActive: { color: "white", fontWeight: "700" },
  forms: { flex: 1 },
  hidden: { opacity: 0 },
});
