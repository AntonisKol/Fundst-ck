import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import { useEffect } from "react";
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from "@react-navigation/native";
import LandingPage from "../screens/LandingPage/LandingPage";
import ItemDetailsScreen from "../screens/ItemDetailsScreen/ItemDetailsScreen";
import ChatScreen from "../screens/ChatScreen/ChatScreen";
import MyPostsScreen from "../screens/MyPostsScreen/MyPostsScreen";
import { colors } from "../constants/theme";
import { onNotificationTapped } from "../utils/notifications";
import { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Screens sit on this background, so anything not covered by a screen's own
// background (e.g. the gap KeyboardAvoidingView leaves as the keyboard
// hides) shows the app grey instead of the default white.
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.paper } };

const RootNavigator = () => {
  // Tapping a message banner opens that chat (or Messages, if it has none).
  useEffect(
    () =>
      onNotificationTapped((conversationId) => {
        if (!navigationRef.isReady()) return;
        // navigate (not push) finds the root stack that owns Chat from inside a tab.
        if (conversationId) navigationRef.navigate("Chat", { conversationId });
        else navigationRef.navigate("MainTabs", { screen: "Messages" });
      }),
    []
  );

  return (
  <NavigationContainer ref={navigationRef} theme={theme}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  </NavigationContainer>
  );
}

export default RootNavigator;