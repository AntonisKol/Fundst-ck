import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  switch: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    padding: 4,
  },
  option: { paddingVertical: 8, paddingHorizontal: 28, borderRadius: 16 },
  optionFound: { backgroundColor: colors.found },
  optionLost: { backgroundColor: colors.lost },
  optionText: { color: colors.ink, fontWeight: "600" },
  optionTextActive: { color: "white", fontWeight: "700" },
  form: { flex: 1 },
  hidden: { display: "none" },
});
