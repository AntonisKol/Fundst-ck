import { Text, Pressable, StyleSheet, Linking, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

// Opens the phone's maps app searching near the user's current location.
const openMapsSearch = (query: string) => {
  const q = encodeURIComponent(query);
  const url = Platform.OS === "ios" ? `https://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
  Linking.openURL(url)
    .catch(() => Linking.openURL(`https://www.google.com/maps/search/${q}`))
    .catch((err) => console.error("Open maps error:", err));
};

const showDetails = () =>
  Alert.alert(
    "Consider handing it in",
    "Items like this are often valuable or hold personal data. The safest way back to the owner is the police " +
      "or a Fundbüro - and in Germany, finds worth over €10 must be reported to one (§ 965 BGB).\n\n" +
      "You can still post it here so the owner knows where to look.",
    [
      { text: "Find police station", onPress: () => openMapsSearch("Polizei") },
      { text: "Find Fundbüro", onPress: () => openMapsSearch("Fundbüro") },
      { text: "Close", style: "cancel" },
    ]
  );

// A small inline link (it sits beside the Category label) so the form's
// layout doesn't shift; the explanation and map links live in the alert.
const HandInNotice = () => (
  <Pressable
    style={styles.link}
    onPress={showDetails}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel="Consider handing it in to the police or a Fundbüro"
  >
    <Ionicons name="shield-checkmark-outline" size={15} color={colors.stamp} />
    <Text style={styles.text}>Hand it in?</Text>
    <Ionicons name="chevron-forward" size={13} color={colors.stamp} />
  </Pressable>
);

export default HandInNotice;

const styles = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center", gap: 4 },
  text: { fontSize: 13, fontWeight: "700", color: colors.stamp },
});
