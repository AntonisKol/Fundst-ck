import { useState } from "react";
import { View, Text, Pressable } from "react-native";
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

      {/* Both forms stay mounted so switching doesn't wipe a half-filled form. */}
      <View style={[styles.form, type !== "found" && styles.hidden]}>
        <FoundItemScreen />
      </View>
      <View style={[styles.form, type !== "lost" && styles.hidden]}>
        <LostItemScreen />
      </View>
    </View>
  );
};

export default PostScreen;
