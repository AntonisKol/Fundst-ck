import { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation, StackActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import ItemCard from "../../components/ItemCard";
import TopBar from "../../components/TopBar";
import { fetchMyItems } from "../../utils/items";
import { colors } from "../../constants/theme";
import { ListItem } from "../../types/items";
import { RootStackParamList } from "../../types/navigation";
import { styles } from "./styled";

const MyPostsScreen = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await fetchMyItems(userId);
    if (data) setItems(data);
    setLoadError(error);
    setLoading(false);
  }, [userId]);

  // Reload on focus, so changes made on the details screen show up here.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderList = () => {
    if (loading) return <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />;

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            showStatus
            onPress={() => navigation.dispatch(StackActions.push("ItemDetails", item))}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          // With posts already listed, keep them and flag the failed refresh.
          loadError && items.length > 0 ? (
            <Text style={styles.refreshError}>Couldn't refresh. Pull down to try again.</Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loadError
              ? "Couldn't load your posts.\nPull down to try again."
              : "You haven't posted anything yet.\nUse the Post tab to report a found or lost item."}
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          />
        }
      />
    );
  };

  return (
    <View style={styles.page}>
      <TopBar title="My posts" />
      {renderList()}
    </View>
  );
};

export default MyPostsScreen;
