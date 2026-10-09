import { supabase } from "../supabase/supabase";
import { fetchCoordinates } from "./geocode";

export const NETWORK_ERROR_MESSAGE = "Couldn't reach the server. Check your connection and try again.";

interface NewItem {
  user_id: string;
  image_url: string | null;
  category: string;
  location: string;
  notes: string;
}

// Geocodes the item's ZIP and inserts it. Returns an error message to show
// the user, or null on success.
export const insertItem = async (table: "found_items" | "lost_items", item: NewItem): Promise<string | null> => {
  try {
    const coords = await fetchCoordinates(item.location);
    const { error } = await supabase.from(table).insert([{ ...item, ...coords }]);
    if (!error) return null;

    console.error(`Supabase ${table} insert error:`, error);
    return error.message;
  } catch (err) {
    console.error(`Supabase ${table} insert error:`, err);
    return NETWORK_ERROR_MESSAGE;
  }
};
