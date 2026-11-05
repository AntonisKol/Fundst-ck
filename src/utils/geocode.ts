export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const fetchCoordinates = async (zip: string): Promise<Coordinates | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=Germany&format=json&limit=1`,
      { headers: { "User-Agent": "FundstuckLostAndFoundApp/1.0" } }
    );
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
