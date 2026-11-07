import { useEffect, useState } from "react";
import { View, Text, Alert, Pressable, ScrollView, StyleSheet, Switch, Linking, AppState } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../supabase/supabase";
import { colors } from "../../constants/theme";
import {
  messageNotificationsEnabled,
  setMessageNotificationsEnabled,
  notificationPermissionGranted,
  requestNotificationPermission,
} from "../../utils/notifications";
import { RootStackParamList } from "../../types/navigation";
import { styles } from "./styled";

const SettingsView = ({ session }: { session: Session }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const zipCode = session.user.user_metadata?.zip_code;
  const savedEnabled = messageNotificationsEnabled(session);

  // Optimistic so the switch responds instantly; synced back from the session.
  const [enabled, setEnabled] = useState(savedEnabled);
  const [osAllowed, setOsAllowed] = useState(true);

  useEffect(() => setEnabled(savedEnabled), [savedEnabled]);

  // Re-check when returning from the phone's Settings app.
  useEffect(() => {
    notificationPermissionGranted().then(setOsAllowed);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") notificationPermissionGranted().then(setOsAllowed);
    });
    return () => subscription.remove();
  }, []);

  const toggleNotifications = async (value: boolean) => {
    setEnabled(value);
    if (value) setOsAllowed(await requestNotificationPermission());

    const error = await setMessageNotificationsEnabled(value);
    if (error) {
      setEnabled(!value);
      Alert.alert("Couldn't save setting", error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error", error.message);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable style={styles.myPostsCard} onPress={() => navigation.navigate("MyPosts")} accessibilityRole="button">
        <View style={styles.myPostsIcon}>
          <Ionicons name="albums-outline" size={22} color="white" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>My posts</Text>
          <Text style={styles.settingHint}>See and manage the items you've reported.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} />
      </Pressable>

      <View style={styles.cardWrapper}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, styles.firstSection]}>Account</Text>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{session.user.email}</Text>
          {zipCode ? (
            <>
              <Text style={styles.profileLabel}>ZIP Code</Text>
              <Text style={styles.profileValue}>{zipCode}</Text>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Message notifications</Text>
              <Text style={styles.settingHint}>Show a banner when someone messages you.</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggleNotifications}
              trackColor={{ true: colors.found, false: colors.border }}
            />
          </View>
          {enabled && !osAllowed && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>Notifications are turned off for Fundstück in your phone's settings.</Text>
              <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
                <Text style={styles.warningLink}>Open phone settings</Text>
              </Pressable>
            </View>
          )}

          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsView;
