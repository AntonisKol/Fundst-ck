import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ActivityIndicator, Alert, Text, Modal, Pressable, FlatList, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Callout } from "react-native-maps";
import { useNavigation, StackActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import ScreenHeader from "../../components/ScreenHeader";
import { useAuth } from "../../context/AuthContext";
import { fetchCoordinates } from "../../utils/geocode";
import { locationIfAllowed, pickStartingPoint, regionAround, requestLocation } from "../../utils/location";
import { styles } from "./styled";
import { ItemRow } from "../../types/items";
import { useOpenItems } from "../../hooks/useOpenItems";
import { RootStackParamList } from "../../types/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Item = Omit<ItemRow, "latitude" | "longitude"> & {
  latitude: number;
  longitude: number;
};

// Only posts with usable coordinates can be pinned.
const withCoordinates = (items: ItemRow[]): Item[] =>
  items.flatMap((item) => {
    if (item.latitude === null || item.longitude === null) return [];
    if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return [];

    return [{ ...item, latitude: item.latitude, longitude: item.longitude }];
  });

const BERLIN_REGION = { latitude: 52.52, longitude: 13.405, latitudeDelta: 0.15, longitudeDelta: 0.15 };

const MapScreen = () => {
  const { items: openItems, loading, error } = useOpenItems("map_items_changes");
  const items = useMemo(() => withCoordinates(openItems), [openItems]);
  const [selectedGroup, setSelectedGroup] = useState<Item[] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const positioned = useRef(false);
  const { session } = useAuth();
  const registeredZip: string | undefined = session?.user.user_metadata?.zip_code;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (error) Alert.alert("Error fetching items", error);
  }, [error]);

  // Items are geocoded from their ZIP code, so items sharing a ZIP land on
  // (near enough) the same coordinate. Group by ZIP so the map shows one
  // pin per ZIP instead of stacked, indistinguishable markers.
  const groupedByZip = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((item) => {
      const key = item.location || `${item.latitude},${item.longitude}`;
      const group = map.get(key);
      if (group) group.push(item);
      else map.set(key, [item]);
    });
    return Array.from(map.values());
  }, [items]);

  // Zoom to show every pin, leaving room for the floating header.
  const fitAllPins = useCallback(() => {
    const coordinates = groupedByZip.map(([first]) => ({ latitude: first.latitude, longitude: first.longitude }));
    if (!mapRef.current || coordinates.length === 0) return;
    if (coordinates.length === 1) {
      mapRef.current.animateToRegion({ ...coordinates[0], latitudeDelta: 0.05, longitudeDelta: 0.05 }, 0);
      return;
    }
    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: insets.top + 100, right: 50, bottom: 50, left: 50 },
      animated: false,
    });
  }, [groupedByZip, insets.top]);

  // Position the map once, when it opens - not again on every live update.
  useEffect(() => {
    if (!mapReady || positioned.current) return;
    positioned.current = true;

    (async () => {
      const here = await locationIfAllowed();
      if (here) setShowUserLocation(true);
      const point = await pickStartingPoint({ here: async () => here, zip: registeredZip, geocode: fetchCoordinates });
      if (!point) {
        fitAllPins();
        return;
      }
      mapRef.current?.animateToRegion(regionAround(point), 0);
    })();
  }, [mapReady, fitAllPins, registeredZip]);

  // Asks for location only when the user taps the button, never on its own.
  const locateMe = async () => {
    const result = await requestLocation();
    if (result === "denied") {
      Alert.alert("Location is off", "Allow location access in Settings to see what's been lost and found near you.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    if (!result) {
      Alert.alert("Couldn't find your location", "Please try again in a moment.");
      return;
    }
    setShowUserLocation(true);
    mapRef.current?.animateToRegion(regionAround(result), 300);
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <ScreenHeader title="Map" />
        <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onMapReady={() => setMapReady(true)}
        initialRegion={BERLIN_REGION}
        showsUserLocation={showUserLocation}
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

      <Pressable
        style={styles.locateButton}
        onPress={locateMe}
        accessibilityRole="button"
        accessibilityLabel="Show my location"
      >
        <Ionicons name="locate" size={22} color={colors.stamp} />
      </Pressable>

      {/* Floating header: keeps the status bar and title off the map tiles. */}
      <View style={styles.headerOverlay} pointerEvents="box-none">
        <ScreenHeader title="Map" />
      </View>

      <Modal
        visible={!!selectedGroup}
        animationType="slide"
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
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
    </View>
  );
};

export default MapScreen;
