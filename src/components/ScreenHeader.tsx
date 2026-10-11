import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";

interface Props {
  title: string;
  right?: ReactNode;
}

// Large left-aligned title used by every tab screen. Owns the top safe-area
// spacing, so screens below it never hardcode a status bar height.
const ScreenHeader = ({ title, right }: Props) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {right}
    </View>
  );
};

export default ScreenHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
});
