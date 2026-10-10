import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FoundItemScreen from "../FoundItemScreen/FoundItemScreen";
import LostItemScreen from "../LostItemScreen/LostItemScreen";
import RequireAuthPrompt from "../../components/RequireAuthPrompt";
import { useAuth } from "../../context/AuthContext";
import { styles } from "./styled";

type PostType = "found" | "lost";

const OPTIONS: { label: string; value: PostType }[] = [
  { label: "Found", value: "found" },
  { label: "Lost", value: "lost" },
];

const FORMS = [
  { value: "found" as const, Form: FoundItemScreen },
  { value: "lost" as const, Form: LostItemScreen },
];

const PostScreen = () => {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<PostType>("found");

  if (!session) {
    return <RequireAuthPrompt message="Sign in to post a lost or found item." />;
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <View style={styles.switch}>
        {OPTIONS.map((option) => {
          const active = type === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setType(option.value)}
              style={[styles.option, active && (option.value === "found" ? styles.optionFound : styles.optionLost)]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Both forms stay mounted and laid out, stacked on top of each other,
          so switching neither wipes a half-filled form nor re-lays out a
          collapsed ScrollView (which iOS offset under the switch). */}
      <View style={styles.forms}>
        {FORMS.map(({ value, Form }) => {
          const active = type === value;
          return (
            <View
              key={value}
              style={[StyleSheet.absoluteFill, !active && styles.hidden]}
              pointerEvents={active ? "auto" : "none"}
              importantForAccessibility={active ? "auto" : "no-hide-descendants"}
              accessibilityElementsHidden={!active}
            >
              <Form />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default PostScreen;
