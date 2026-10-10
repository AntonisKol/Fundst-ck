import { View, Text, StyleSheet } from "react-native";
import { SAFETY_TIPS } from "../constants/safety";
import { colors } from "../constants/theme";

const SafetyNotice = () => (
  <View style={styles.card}>
    <Text style={styles.title}>Stay safe</Text>
    {SAFETY_TIPS.map((tip) => (
      <View key={tip} style={styles.row}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.tip}>{tip}</Text>
      </View>
    ))}
  </View>
);

export default SafetyNotice;

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: colors.stampTint },
  title: { fontWeight: "800", color: colors.stamp, marginBottom: 6 },
  row: { flexDirection: "row", marginTop: 4 },
  bullet: { color: colors.stamp, marginRight: 6, lineHeight: 19 },
  tip: { flex: 1, color: colors.stamp, fontSize: 13, lineHeight: 19 },
});
