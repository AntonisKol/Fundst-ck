import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";

// Back button + centered title for screens pushed on top of the tabs.
const TopBar = ({ title }: { title: string }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: 16, color: colors.stamp, fontWeight: "600" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: colors.ink, marginHorizontal: 8 },
  // Same width as the back button so the title stays centered.
  spacer: { width: 50 },
});
