import { ComponentProps } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import FoundItemsFeed from "../screens/FoundItemsFeed/FoundItemsFeed";
import PostScreen from "../screens/PostScreen/PostScreen";
import MapScreen from "../screens/MapScreen/MapScreen";
import MessagesScreen from "../screens/MessagesScreen/MessagesScreen";
import AccountScreen from "../screens/AccountScreen/AccountScreen";
import { colors } from "../constants/theme";
import { useUnread } from "../context/UnreadContext";

const Tab = createBottomTabNavigator();

type IconName = ComponentProps<typeof Ionicons>["name"];

// Outline when inactive, filled when the tab is selected.
const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Feed: { active: "newspaper", inactive: "newspaper-outline" },
  Post: { active: "add-circle", inactive: "add-circle-outline" },
  Map: { active: "map", inactive: "map-outline" },
  Messages: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  Settings: { active: "settings", inactive: "settings-outline" },
};

const TabNavigator = () => {
  const { unreadCount } = useUnread();

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
          <Ionicons
            name={TAB_ICONS[route.name][focused ? "active" : "inactive"]}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor: colors.stamp,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
        },
      })}
    >
      <Tab.Screen name="Feed" component={FoundItemsFeed} />
      <Tab.Screen name="Post" component={PostScreen} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "Map" }} />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.lost, color: "white", fontSize: 11 },
        }}
      />
      <Tab.Screen name="Settings" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default TabNavigator;