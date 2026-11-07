import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../supabase/supabase";
import { useNavigation, StackActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ItemRecord, ItemType, ListItem } from "../../types/items";
import { RootStackParamList } from "../../types/navigation";
import { CATEGORIES as ITEM_CATEGORIES } from "../../constants/categories";
import { colors } from "../../constants/theme";
import ScreenHeader from "../../components/ScreenHeader";
import ItemCard from "../../components/ItemCard";
import { styles } from "./styled";

const CATEGORIES = ["All", ...ITEM_CATEGORIES];

const TYPES: { label: string; value: "All" | ItemType }[] = [
  { label: "All", value: "All" },
  { label: "Found", value: "found" },
  { label: "Lost", value: "lost" },
];

const FoundItemsFeed = () => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<"All" | ItemType>("All");

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const fetchItems = async () => {
    setLoading(true);

    const [foundRes, lostRes] = await Promise.all([
      supabase.from("found_items").select("*").order("created_at", { ascending: false }),
      supabase.from("lost_items").select("*").order("created_at", { ascending: false }),
    ]);

    if (foundRes.error) console.error("Error fetching found items:", foundRes.error);
    if (lostRes.error) console.error("Error fetching lost items:", lostRes.error);

    const found: ListItem[] = (foundRes.data || []).map((item: ItemRecord) => ({ ...item, type: "found" }));
    const lost: ListItem[] = (lostRes.data || []).map((item: ItemRecord) => ({ ...item, type: "lost" }));

    const merged = [...found, ...lost].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setItems(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "found_items" }, () => fetchItems())
      .on("postgres_changes", { event: "*", schema: "public", table: "lost_items" }, () => fetchItems())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = selectedType === "All" || item.type === selectedType;
      const matchesCategory =
        selectedCategory === "All" || (item.category?.trim() || "Other") === selectedCategory;
      return matchesType && matchesCategory;
    });
  }, [items, selectedCategory, selectedType]);

  const renderItem = ({ item }: { item: ListItem }) => (
    <ItemCard
      item={item}
      onPress={() =>
        navigation.dispatch(
          StackActions.push("ItemDetails", { ...item, category: item.category?.trim() || "Other" })
        )
      }
    />
  );

  return (
    <View style={styles.page}>
      <ScreenHeader title="Feed" />
      {loading ? (
        <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No items found yet.</Text>}
          ListHeaderComponent={
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categories}
              >
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setSelectedType(t.value)}
                    style={[
                      styles.categoryButton,
                      selectedType === t.value && styles.categoryButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedType === t.value && styles.categoryTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categories}
              >
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextActive,
                      ]}
                    >
                      {category === "All" ? "Any category" : category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
        />
      )}
    </View>
  );
};

 export default FoundItemsFeed;
