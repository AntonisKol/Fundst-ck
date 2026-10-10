import { useEffect } from "react";
import { AppState } from "react-native";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import RootNavigator from "./navigation/RootNavigator";
import { AuthProvider } from "./context/AuthContext";
import { UnreadProvider } from "./context/UnreadContext";
import { supabase } from "./supabase/supabase";

// Keeps the auth token refreshed while the app is foregrounded, and stops
// wasting refresh calls while backgrounded, per Supabase's RN guidance.
const useSupabaseAuthRefresh = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);
};

const App = () => {
  useSupabaseAuthRefresh();
  // Preload the tab bar icon font so icons don't flash in empty.
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <UnreadProvider>
        <RootNavigator />
      </UnreadProvider>
    </AuthProvider>
  );
}

export default App;
