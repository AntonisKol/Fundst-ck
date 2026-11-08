import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, StackActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ItemType, ListItem } from "../../types/items";
import { useOpenItems } from "../../hooks/useOpenItems";
import { RootStackParamList } from "../../types/navigation";
import { CATEGORIES as ITEM_CATEGORIES } from "../../constants/categories";
import ScreenHeader from "../../components/ScreenHeader";
import ItemCard, { ItemCardSkeletonList } from "../../components/ItemCard";
import { useAuth } from "../../context/AuthContext";
import { styles } from "./styled";

const CATEGORIES = ["All", ...ITEM_CATEGORIES];

const TYPES: { label: string; value: "All" | ItemType }[] = [
  { label: "All", value: "All" },
  { label: "Found", value: "found" },
  { label: "Lost", value: "lost" },
];

const FoundItemsFeed = () => {
  const { session } = useAuth();
  const { items, loading } = useOpenItems("items_changes");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<"All" | ItemType>("All");

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      <ScreenHeader
        title="Feed"
        right={
          session ? (
            <Pressable style={styles.myPostsButton} onPress={() => navigation.navigate("MyPosts")} accessibilityRole="button">
              <Ionicons name="albums-outline" size={16} color="white" />
              <Text style={styles.myPostsText}>My posts</Text>
            </Pressable>
          ) : undefined
        }
      />
      {/* The list renders from the start so the filters show right away and
          skeleton cards hold the space until the posts arrive. */}
      <FlatList
        data={loading ? [] : filteredItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? <ItemCardSkeletonList /> : <Text style={styles.empty}>No items found yet.</Text>
        }
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
    </View>
  );
};

 export default FoundItemsFeed;
