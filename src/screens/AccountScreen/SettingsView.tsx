import { useEffect, useState } from "react";
import { View, Text, Alert, Pressable, ScrollView, StyleSheet, Switch, Linking, AppState } from "react-native";
import { BlurView } from "expo-blur";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../supabase/supabase";
import { colors } from "../../constants/theme";
import {
  messageNotificationsEnabled,
  setMessageNotificationsEnabled,
  notificationPermissionGranted,
  requestNotificationPermission,
} from "../../utils/notifications";
import { styles } from "./styled";

const SettingsView = ({ session }: { session: Session }) => {
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
      <View style={styles.cardWrapper}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.sectionTitle}>Account</Text>
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
