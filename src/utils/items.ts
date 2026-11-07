import { supabase } from "../supabase/supabase";
import { fetchCoordinates } from "./geocode";
import { ItemRecord, ItemType, ListItem } from "../types/items";

export const NETWORK_ERROR_MESSAGE = "Couldn't reach the server. Check your connection and try again.";

export interface NewItem {
  user_id: string;
  image_url: string | null;
  category: string;
  location: string;
  notes: string;
}

// Geocodes the item's ZIP and inserts it. Returns an error message to show
// the user, or null on success.
export const insertItem = async (type: ItemType, item: NewItem): Promise<string | null> => {
  const table = type === "found" ? "found_items" : "lost_items";
  try {
    const coords = await fetchCoordinates(item.location);
    const { error } = await supabase
      .from(table)
      .insert([{ ...item, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null }]);
    if (!error) return null;

    console.error(`Supabase ${table} insert error:`, error);
    return error.message;
  } catch (err) {
    console.error(`Supabase ${table} insert error:`, err);
    return NETWORK_ERROR_MESSAGE;
  }
};

const tagWithType = (rows: ItemRecord[] | null, type: ItemType): ListItem[] =>
  (rows ?? []).map((row) => ({ ...row, type }));

// The signed-in user's found and lost posts, newest first.
export const fetchMyItems = async (
  userId: string
): Promise<{ data: ListItem[]; error: null } | { data: null; error: string }> => {
  try {
    const [found, lost] = await Promise.all([
      supabase.from("found_items").select("*").eq("user_id", userId),
      supabase.from("lost_items").select("*").eq("user_id", userId),
    ]);

    const failure = found.error ?? lost.error;
    if (failure) {
      console.error("Supabase fetch my items error:", failure);
      return { data: null, error: failure.message };
    }

    const items = [...tagWithType(found.data, "found"), ...tagWithType(lost.data, "lost")].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { data: items, error: null };
  } catch (err) {
    console.error("Supabase fetch my items error:", err);
    return { data: null, error: NETWORK_ERROR_MESSAGE };
  }
};
