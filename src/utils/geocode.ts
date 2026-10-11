export interface Coordinates {
  latitude: number;
  longitude: number;
}

const FALLBACK_COORDS: Coordinates = { latitude: 52.52, longitude: 13.405 }; // Berlin

export const fetchCoordinates = async (zip: string): Promise<Coordinates> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=Germany&format=json&limit=1`,
      { headers: { "User-Agent": "FundstuckLostAndFoundApp/1.0" } }
    );
    const data = await response.json();
    if (data.length === 0) return FALLBACK_COORDS;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return FALLBACK_COORDS;
  }
};
