import { ReactNode, useState } from "react";
import {
  View,
  Text,
  Alert,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { supabase } from "../../supabase/supabase";
import { NETWORK_ERROR_MESSAGE } from "../../utils/items";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/theme";
import { germanZipExists, isGermanZipFormat } from "../../utils/geocode";
import DismissKeyboardOnTap from "../../components/DismissKeyboardOnTap";
import SettingsView from "./SettingsView";
import ScreenHeader from "../../components/ScreenHeader";
import { styles } from "./styled";

const AccountScreen = () => {
  const { session, loading } = useAuth();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zip, setZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean; zip?: boolean }>({});

  const validate = () => {
    const newErrors: { email?: boolean; password?: boolean; zip?: boolean } = {};
    if (!email.trim()) newErrors.email = true;
    if (!password.trim()) newErrors.password = true;
    if (mode === "signUp" && !zip.trim()) newErrors.zip = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setZip("");
    setErrors({});
  };

  const submit = async () => {
    Keyboard.dismiss();
    if (!validate()) {
      Alert.alert("Missing info", "Please fill all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErrors({ email: true });
      Alert.alert("Invalid email", `"${email.trim()}" isn't a valid email address.`);
      return;
    }

    if (password.length < 6) {
      setErrors({ password: true });
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }

    const zipCode = zip.trim();
    if (mode === "signUp" && !isGermanZipFormat(zipCode)) {
      setErrors({ zip: true });
      Alert.alert("Invalid ZIP code", "Enter a 5-digit German ZIP code, like 10115.");
      return;
    }

    setSubmitting(true);
    try {
      // Only a definite "not found" stops sign-up: if the lookup service can't
      // be reached, the ZIP is just profile info and shouldn't block anyone.
      if (mode === "signUp" && (await germanZipExists(zipCode)) === false) {
        setErrors({ zip: true });
        Alert.alert("ZIP code not found", `We couldn't find ZIP code ${zipCode} in Germany. Check it and try again.`);
        return;
      }

      const { data, error } =
        mode === "signIn"
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: { data: { zip_code: zipCode } },
            });

      if (error) {
        console.error(`Supabase ${mode} error:`, error);
        Alert.alert(mode === "signIn" ? "Sign in failed" : "Sign up failed", error.message);
        return;
      }

      // With email confirmation off, signUp returns a session and the user is
      // already signed in - only ask them to check email when there's none.
      if (mode === "signUp" && !data.session) {
        Alert.alert("Check your email", "Confirm your email address, then sign in.");
        setMode("signIn");
      }
      resetForm();
    } catch (err) {
      console.error(`Supabase ${mode} error:`, err);
      Alert.alert("Error", NETWORK_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  // Every state of this tab sits under the same header.
  const withHeader = (content: ReactNode) => (
    <View style={styles.screen}>
      <ScreenHeader title="Settings" />
      {content}
    </View>
  );

  if (loading) {
    return withHeader(<ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />);
  }

  if (session) return withHeader(<SettingsView session={session} />);

  return withHeader(
    <DismissKeyboardOnTap>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.cardWrapper}>
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.card}>
            <Text style={styles.title}>{mode === "signIn" ? "Sign In" : "Sign Up"}</Text>
            <Text style={styles.subtitle}>
              {mode === "signIn" ? "Sign in to post found or lost items" : "Create an account to post items"}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email*</Text>
              <TextInput
                style={[styles.input, errors.email && styles.errorInput]}
                placeholder="you@example.com"
                value={email}
                onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((prev) => ({ ...prev, email: false })); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password*</Text>
              <TextInput
                style={[styles.input, errors.password && styles.errorInput]}
                placeholder="At least 6 characters"
                value={password}
                onChangeText={(text) => { setPassword(text); if (errors.password) setErrors((prev) => ({ ...prev, password: false })); }}
                secureTextEntry
              />
            </View>

            {mode === "signUp" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>ZIP Code*</Text>
                <TextInput
                  style={[styles.input, errors.zip && styles.errorInput]}
                  placeholder="e.g. 10115"
                  value={zip}
                  onChangeText={(text) => { setZip(text); if (errors.zip) setErrors((prev) => ({ ...prev, zip: false })); }}
                  keyboardType="number-pad"
                  maxLength={5}
                  textContentType="postalCode"
                  autoComplete="postal-code"
                />
              </View>
            )}

            <Pressable disabled={submitting} style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={submit}>
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitText}>{mode === "signIn" ? "Sign In" : "Sign Up"}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); resetForm(); }}>
              <Text style={styles.switchModeText}>
                {mode === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DismissKeyboardOnTap>
  );
};

export default AccountScreen;
