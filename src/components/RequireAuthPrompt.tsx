import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { colors } from "../constants/theme";

interface Props {
  message: string;
}

const RequireAuthPrompt = ({ message }: Props) => {
  const navigation = useNavigation();

  return (
    <View style={styles.page}>
      <View style={styles.cardWrapper}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <Text style={styles.title}>Sign in required</Text>
          <Text style={styles.subtitle}>{message}</Text>

          <Pressable style={styles.button} onPress={() => navigation.navigate("Account" as never)}>
            <Text style={styles.buttonText}>Go to Account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default RequireAuthPrompt;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", padding: 20 },
  // BlurView on Android doesn't reliably clip to its own borderRadius, so
  // the radius + clipping live on this plain wrapper instead.
  cardWrapper: { width: "100%", borderRadius: 24, overflow: "hidden" },
  card: { padding: 24, backgroundColor: "rgba(255,255,255,0.9)" },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6, color: colors.ink },
  subtitle: { textAlign: "center", color: colors.inkSoft, marginBottom: 20 },
  button: { paddingVertical: 16, borderRadius: 14, alignItems: "center", backgroundColor: colors.stamp },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});
