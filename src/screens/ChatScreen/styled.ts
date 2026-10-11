import { StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  list: { paddingHorizontal: 16, paddingVertical: 12 },
  emptyContainer: { flex: 1 },
  empty: { textAlign: "center", color: colors.inkSoft, marginTop: 40, paddingHorizontal: 20 },
  bubble: { maxWidth: "80%", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, marginVertical: 3 },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: colors.stamp, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: "flex-start", backgroundColor: "white", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: colors.ink },
  bubbleTextMine: { color: "white" },
  time: { fontSize: 11, marginTop: 4, color: colors.inkSoft },
  timeMine: { color: colors.stampTint, textAlign: "right" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.ink,
  },
  sendButton: { marginLeft: 8, marginBottom: 2, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.stamp },
  sendButtonDisabled: { opacity: 0.4 },
  sendText: { color: "white", fontWeight: "700" },
});
