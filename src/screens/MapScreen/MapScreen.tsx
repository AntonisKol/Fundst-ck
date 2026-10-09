import React, { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, Alert, Text, Modal, Pressable, FlatList } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { supabase } from "../../supabase/supabase";
import { useNavigation, StackActions } from "@react-navigation/native";
import { colors } from "../../constants/theme";
import { styles } from "./styled";

type ItemType = "found" | "lost";

interface Item {
  id: string;
  image_url?: string;
  category: string | null;
  location: string;
  notes?: string;
  created_at: string;
  type: ItemType;
  latitude: number;
  longitude: number;
}

const formatItems = (data: any[] | null, type: ItemType): Item[] =>
  (data || []).map((item) => ({
    ...item,
    type,
    latitude: item.latitude ? parseFloat(item.latitude) : 52.5200, // fallback Berlin
    longitude: item.longitude ? parseFloat(item.longitude) : 13.4050,
  }));

const MapScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Item[] | null>(null);
  const navigation = useNavigation();

  const fetchItems = async () => {
    setLoading(true);

    const [foundRes, lostRes] = await Promise.all([
      supabase.from("found_items").select("*"),
      supabase.from("lost_items").select("*"),
    ]);

    if (foundRes.error) {
      console.error("Error fetching found items:", foundRes.error);
      Alert.alert("Error fetching items", foundRes.error.message);
    }
    if (lostRes.error) {
      console.error("Error fetching lost items:", lostRes.error);
      Alert.alert("Error fetching items", lostRes.error.message);
    }

    setItems([
      ...formatItems(foundRes.data, "found"),
      ...formatItems(lostRes.data, "lost"),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("map_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "found_items" },
        () => fetchItems()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lost_items" },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Items are geocoded from their ZIP code, so items sharing a ZIP land on
  // (near enough) the same coordinate. Group by ZIP so the map shows one
  // pin per ZIP instead of stacked, indistinguishable markers.
  const groupedByZip = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((item) => {
      const key = item.location || `${item.latitude},${item.longitude}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.values());
  }, [items]);

  if (loading) return <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />;

  return (
    <>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: items[0]?.latitude || 52.5200,
          longitude: items[0]?.longitude || 13.4050,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {groupedByZip.map((group) => {
          const first = group[0];
          const key = `${first.location}-${first.id}`;

          if (group.length === 1) {
            return (
              <Marker
                key={key}
                coordinate={{ latitude: first.latitude, longitude: first.longitude }}
                pinColor={first.type === "found" ? colors.twine : colors.lost}
                onPress={() => navigation.dispatch(StackActions.push("ItemDetails", { ...first }))}
              >
                <Callout>
                  <View style={{ maxWidth: 200 }}>
                    <Text style={{ fontWeight: "700" }}>
                      {first.type === "found" ? "Found" : "Lost"} · {first.category || "Other"}
                    </Text>
                    <Text>{first.location}</Text>
                    {first.notes ? <Text>{first.notes}</Text> : null}
                  </View>
                </Callout>
              </Marker>
            );
          }

          return (
            <Marker
              key={key}
              coordinate={{ latitude: first.latitude, longitude: first.longitude }}
              onPress={() => setSelectedGroup(group)}
            >
              <View style={styles.clusterBadge}>
                <Text style={styles.clusterBadgeText}>{group.length}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <Modal
        visible={!!selectedGroup}
        animationType="slide"
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>
            ZIP {selectedGroup?.[0]?.location} · {selectedGroup?.length} items
          </Text>
          <FlatList
            data={selectedGroup || []}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <Pressable
                style={styles.modalRow}
                onPress={() => {
                  setSelectedGroup(null);
                  navigation.dispatch(StackActions.push("ItemDetails", { ...item }));
                }}
              >
                <View
                  style={[
                    styles.modalRowBadge,
                    item.type === "found" ? styles.modalRowBadgeFound : styles.modalRowBadgeLost,
                  ]}
                >
                  <Text style={styles.modalRowBadgeText}>
                    {item.type === "found" ? "FOUND" : "LOST"}
                  </Text>
                </View>
                <Text style={styles.modalRowCategory}>{item.category || "Other"}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.modalClose} onPress={() => setSelectedGroup(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
};

export default MapScreen;
