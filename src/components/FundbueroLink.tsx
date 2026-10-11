import { ComponentProps } from "react";
import { Text, Pressable, StyleSheet, Linking, Platform, Alert, AlertButton } from "react-native";
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

const FIND_POLICE: AlertButton = { text: "Find police station", onPress: () => openMapsSearch("Polizei") };
const FIND_FUNDBUERO: AlertButton = { text: "Find Fundbüro", onPress: () => openMapsSearch("Fundbüro") };
const CLOSE: AlertButton = { text: "Close", style: "cancel" };

type Variant = "found" | "lost";

interface VariantConfig {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  a11y: string;
  title: string;
  message: string;
  buttons: AlertButton[];
}

const VARIANTS: Record<Variant, VariantConfig> = {
  // Finders of sensitive items: hand it in.
  found: {
    icon: "shield-checkmark-outline",
    label: "Hand it in?",
    a11y: "Consider handing it in to the police or a Fundbüro",
    title: "Consider handing it in",
    message:
      "Items like this are often valuable or hold personal data. The safest way back to the owner is the police " +
      "or a Fundbüro - and in Germany, finds worth over €10 must be reported to one (§ 965 BGB).\n\n" +
      "You can still post it here so the owner knows where to look.",
    buttons: [FIND_POLICE, FIND_FUNDBUERO, CLOSE],
  },
  // Owners of lost items: it may already be waiting at a Fundbüro.
  lost: {
    icon: "search-outline",
    label: "Check the Fundbüro",
    a11y: "Check the Fundbüro for your lost item",
    title: "Check the Fundbüro too",
    message:
      "Many found items never get posted online: finders often hand them in to a Fundbüro or the police, " +
      "and things left on buses, trains or the U-Bahn go to the transport operator's lost property office.\n\n" +
      "Ask there as well - found items are only kept for a limited time.",
    buttons: [FIND_FUNDBUERO, FIND_POLICE, CLOSE],
  },
};

// A small inline link (it sits beside the Category label) so the form's
// layout doesn't shift; the explanation and map links live in the alert.
const FundbueroLink = ({ variant }: { variant: Variant }) => {
  const { icon, label, a11y, title, message, buttons } = VARIANTS[variant];
  return (
    <Pressable
      style={styles.link}
      onPress={() => Alert.alert(title, message, buttons)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <Ionicons name={icon} size={15} color={colors.stamp} />
      <Text style={styles.text}>{label}</Text>
      <Ionicons name="chevron-forward" size={13} color={colors.stamp} />
    </Pressable>
  );
};

export default FundbueroLink;

const styles = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center", gap: 4 },
  text: { fontSize: 13, fontWeight: "700", color: colors.stamp },
});
