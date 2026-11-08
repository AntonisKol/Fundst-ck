import * as Location from "expo-location";
import { Coordinates } from "./geocode";

// About a city district across.
const AREA_DELTA = 0.08;

export const regionAround = ({ latitude, longitude }: Coordinates) => ({
  latitude,
  longitude,
  latitudeDelta: AREA_DELTA,
  longitudeDelta: AREA_DELTA,
});

const readPosition = async (): Promise<Coordinates> => {
  const position =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
};

// The user's position, only if they've already allowed it - never prompts.
export const locationIfAllowed = async (): Promise<Coordinates | null> => {
  try {
    if (!(await Location.getForegroundPermissionsAsync()).granted) return null;
    return await readPosition();
  } catch (error) {
    console.error("Location error:", error);
    return null;
  }
};

// Asks for permission if needed. "denied" means the user said no.
export const requestLocation = async (): Promise<Coordinates | "denied" | null> => {
  try {
    if (!(await Location.requestForegroundPermissionsAsync()).granted) return "denied";
    return await readPosition();
  } catch (error) {
    console.error("Location error:", error);
    return null;
  }
};

// Where the map opens: the user's position if allowed, else their registered
// ZIP code, else null (the caller shows all pins).
export const pickStartingPoint = async ({
  here,
  zip,
  geocode,
}: {
  here: () => Promise<Coordinates | null>;
  zip: string | undefined;
  geocode: (zip: string) => Promise<Coordinates | null>;
}): Promise<Coordinates | null> => {
  const position = await here();
  if (position) return position;
  if (!zip) return null;
  return geocode(zip);
};
