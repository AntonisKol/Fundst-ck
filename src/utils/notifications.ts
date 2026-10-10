import * as Notifications from "expo-notifications";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase/supabase";

// Show notifications as banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Stored in the user's Supabase metadata so it follows them across devices
// (and so a server-side push sender can respect it later). On by default.
export const messageNotificationsEnabled = (session: Session | null) =>
  session?.user.user_metadata?.notify_messages !== false;

export const setMessageNotificationsEnabled = async (enabled: boolean) => {
  const { error } = await supabase.auth.updateUser({ data: { notify_messages: enabled } });
  if (error) console.error("Supabase update notification setting error:", error);
  return error?.message ?? null;
};

export const notificationPermissionGranted = async () => {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch (err) {
    console.error("Notification permission check error:", err);
    return false;
  }
};

// The OS only shows its permission prompt once; later calls just return the
// stored answer, so this is safe to call on every sign-in.
export const requestNotificationPermission = async () => {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || !current.canAskAgain) return current.granted;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch (err) {
    console.error("Notification permission request error:", err);
    return false;
  }
};

export const showMessageNotification = (body: string, conversationId: string) =>
  Notifications.scheduleNotificationAsync({
    content: { title: "New message", body, data: { conversationId } },
    trigger: null,
  }).catch((err) => console.error("Show notification error:", err));

export const onNotificationTapped = (handler: (conversationId: string | undefined) => void) => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handler(response.notification.request.content.data?.conversationId as string | undefined);
  });
  return () => subscription.remove();
};
