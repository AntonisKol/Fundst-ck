import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  list: { padding: 20, paddingBottom: 40 },
  empty: { textAlign: "center", color: colors.inkSoft, marginTop: 40, lineHeight: 22 },
  refreshError: { marginBottom: 12, color: colors.lost, fontWeight: "600" },
});
