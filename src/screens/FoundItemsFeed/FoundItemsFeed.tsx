import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { supabase } from "../../supabase/supabase";
import { useNavigation, StackActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CATEGORIES as ITEM_CATEGORIES } from "../../constants/categories";
import { colors } from "../../constants/theme";
import { styles } from "./styled";

type ItemType = "found" | "lost";

interface FeedItem {
  id: string;
  user_id: string | null;
  image_url: string | null;
  category: string | null;
  location: string;
  notes?: string;
  created_at: string;
  type: ItemType;
}

type RootStackParamList = {
  ItemDetails: {
    id: string;
    user_id: string | null;
    type: ItemType;
    image_url: string | null;
    category: string;
    location: string;
    notes?: string;
    created_at: string;
  };
};

const CATEGORIES = ["All", ...ITEM_CATEGORIES];

const TYPES: { label: string; value: "All" | ItemType }[] = [
  { label: "All", value: "All" },
  { label: "Found", value: "found" },
  { label: "Lost", value: "lost" },
];

const FoundItemsFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
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

    const found: FeedItem[] = (foundRes.data || []).map((item: any) => ({ ...item, type: "found" }));
    const lost: FeedItem[] = (lostRes.data || []).map((item: any) => ({ ...item, type: "lost" }));

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

  const renderItem = ({ item }: { item: FeedItem }) => {
    const realCategory = item.category?.trim() || "Other";

    return (
      <Pressable
        style={styles.item}
        onPress={() => navigation.dispatch(StackActions.push("ItemDetails", {
          id: item.id,
          user_id: item.user_id,
          type: item.type,
          image_url: item.image_url,
          category: realCategory,
          location: item.location,
          notes: item.notes,
          created_at: item.created_at,
        }))}
      >
        {item.image_url && <Image source={{ uri: item.image_url }} style={styles.image} />}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={[styles.badge, item.type === "found" ? styles.badgeFound : styles.badgeLost]}>
            <Text style={styles.badgeText}>{item.type === "found" ? "FOUND" : "LOST"}</Text>
          </View>
          <Text style={styles.category}>{realCategory}</Text>
          <Text style={styles.location}>{item.location}</Text>
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        </View>
      </Pressable>
    );
  };

  if (loading)
    return (
      <View style={[styles.page, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );

  return (
    <FlatList
      style={styles.page}
      data={filteredItems}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, paddingTop: 60, paddingBottom: 120 }}
      ListEmptyComponent={<Text>No items found yet.</Text>}
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
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      }
    />
  );
};

 export default FoundItemsFeed;
