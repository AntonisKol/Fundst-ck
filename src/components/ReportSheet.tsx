import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { REPORT_NOTE_MAX_LENGTH, REPORT_REASONS, ReportReason, reportUser } from "../utils/chat";
import { colors } from "../constants/theme";

interface Props {
  visible: boolean;
  reporterId: string;
  reportedUserId: string;
  // Set when reporting one message; otherwise the report is about the person.
  message: { id: string; body: string } | null;
  onClose: () => void;
}

const ReportSheet = ({ visible, reporterId, reportedUserId, message, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setReason(null);
    setNote("");
    onClose();
  };

  const submit = async () => {
    if (!reason) return;

    setSubmitting(true);
    const error = await reportUser({ reporterId, reportedUserId, messageId: message?.id ?? null, reason, note });
    setSubmitting(false);

    if (error) {
      Alert.alert("Report not sent", error);
      return;
    }
    Alert.alert("Report sent", "Thanks for letting us know. The other person won't find out you reported them.");
    close();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title} accessibilityRole="header">{message ? "Report this message" : "Report this person"}</Text>
          <Text style={styles.subtitle}>Your report is anonymous.</Text>

          {message && (
            <View style={styles.quote}>
              <Text style={styles.quoteText} numberOfLines={4}>{message.body}</Text>
            </View>
          )}

          <Text style={styles.label}>What's wrong?</Text>
          {REPORT_REASONS.map((option) => {
            const selected = reason === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.reason, selected && styles.reasonSelected]}
                onPress={() => setReason(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{option.label}</Text>
                {selected && <Ionicons name="checkmark" size={20} color={colors.stamp} />}
              </Pressable>
            );
          })}

          <Text style={styles.label}>Add a note (optional)</Text>
          <TextInput
            style={styles.note}
            placeholder="Anything that helps us understand"
            placeholderTextColor={colors.inkSoft}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={REPORT_NOTE_MAX_LENGTH}
          />

          <Pressable
            disabled={!reason || submitting}
            style={[styles.submit, (!reason || submitting) && styles.submitDisabled]}
            onPress={submit}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Send report</Text>}
          </Pressable>
          <Pressable style={styles.cancel} onPress={close}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ReportSheet;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink },
  subtitle: { marginTop: 4, marginBottom: 16, color: colors.ink },
  quote: { padding: 12, marginBottom: 8, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  quoteText: { color: colors.ink, fontStyle: "italic" },
  label: { marginTop: 12, marginBottom: 8, fontWeight: "700", color: colors.ink },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
  },
  reasonSelected: { borderColor: colors.stamp, backgroundColor: colors.stampTint },
  reasonText: { fontSize: 15, color: colors.ink },
  reasonTextSelected: { fontWeight: "700", color: colors.stamp },
  note: {
    minHeight: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: "top",
  },
  submit: { marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: "center", backgroundColor: colors.lost },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },
  cancel: { paddingVertical: 16, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "600", color: colors.stamp },
});
