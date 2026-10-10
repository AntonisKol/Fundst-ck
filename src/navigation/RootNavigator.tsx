import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import LandingPage from "../screens/LandingPage/LandingPage";
import ItemDetailsScreen from "../screens/ItemDetailsScreen/ItemDetailsScreen";
import { colors } from "../constants/theme";

const Stack = createNativeStackNavigator();

// Screens sit on this background, so anything not covered by a screen's own
// background (e.g. the gap KeyboardAvoidingView leaves as the keyboard
// hides) shows the app grey instead of the default white.
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.paper } };

 const RootNavigator = () => {
  return (
  <NavigationContainer theme={theme}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
  );
}

export default RootNavigator;