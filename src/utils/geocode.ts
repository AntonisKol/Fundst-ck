export interface Coordinates {
  latitude: number;
  longitude: number;
}

const searchGermanPostalCode = (zip: string) =>
  fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=Germany&format=json&limit=1`,
    { headers: { "User-Agent": "FundstuckLostAndFoundApp/1.0" } }
  );

// German ZIP codes are five digits from 01001 to 99998, so none start with 00.
export const isGermanZipFormat = (zip: string) => /^(?!00)\d{5}$/.test(zip);

// Whether OpenStreetMap knows this German ZIP code: null when it couldn't be
// checked (offline, service down), so callers can decide not to block on that.
export const germanZipExists = async (zip: string): Promise<boolean | null> => {
  try {
    const response = await searchGermanPostalCode(zip);
    if (!response.ok) return null;

    const results: unknown = await response.json();
    return Array.isArray(results) ? results.length > 0 : null;
  } catch (error) {
    console.error("Error checking ZIP code:", error);
    return null;
  }
};

export const fetchCoordinates = async (zip: string): Promise<Coordinates | null> => {
  try {
    const response = await searchGermanPostalCode(zip);
    if (!response.ok) return null;

    const results: unknown = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const result: unknown = results[0];
    if (
      typeof result !== "object" ||
      result === null ||
      !("lat" in result) ||
      !("lon" in result) ||
      typeof result.lat !== "string" ||
      typeof result.lon !== "string"
    ) {
      return null;
    }

    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    return { latitude, longitude };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};
