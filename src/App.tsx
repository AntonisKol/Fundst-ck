import { useEffect } from "react";
import { AppState } from "react-native";
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

  return (
    <AuthProvider>
      <UnreadProvider>
        <RootNavigator />
      </UnreadProvider>
    </AuthProvider>
  );
}

export default App;
