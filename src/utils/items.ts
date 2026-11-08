import { supabase } from "../supabase/supabase";
import { fetchCoordinates } from "./geocode";
import { ItemRecord, ItemRow, ItemStatus, ItemType } from "../types/items";

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
  const table = tableFor(type);
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

const tableFor = (type: ItemType) => (type === "found" ? "found_items" : "lost_items");

// RLS doesn't raise an error for a post the user may not change: the query
// succeeds and touches no rows. So check that a row really was affected.
const NOT_CHANGED_MESSAGE = "This post couldn't be changed. It may already have been deleted.";

// These return an error message to show the user, or null on success.
export const setItemStatus = async (type: ItemType, id: string, status: ItemStatus): Promise<string | null> => {
  const table = tableFor(type);
  try {
    const { data, error } = await supabase.from(table).update({ status }).eq("id", id).select("id");
    if (error) {
      console.error(`Supabase ${table} status update error:`, error);
      return error.message;
    }
    return data.length > 0 ? null : NOT_CHANGED_MESSAGE;
  } catch (err) {
    console.error(`Supabase ${table} status update error:`, err);
    return NETWORK_ERROR_MESSAGE;
  }
};

export const deleteItem = async (type: ItemType, id: string): Promise<string | null> => {
  const table = tableFor(type);
  try {
    const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
    if (error) {
      console.error(`Supabase ${table} delete error:`, error);
      return error.message;
    }
    return data.length > 0 ? null : NOT_CHANGED_MESSAGE;
  } catch (err) {
    console.error(`Supabase ${table} delete error:`, err);
    return NETWORK_ERROR_MESSAGE;
  }
};

const tagWithType = (rows: ItemRecord[] | null, type: ItemType): ItemRow[] =>
  (rows ?? []).map((row) => ({ ...row, type }));

type ItemsResult = { data: ItemRow[]; error: null } | { data: null; error: string };

// Found and lost posts where one column matches, merged and newest first.
const fetchFoundAndLost = async (column: "user_id" | "status", value: string, label: string): Promise<ItemsResult> => {
  try {
    const [found, lost] = await Promise.all([
      supabase.from("found_items").select("*").eq(column, value),
      supabase.from("lost_items").select("*").eq(column, value),
    ]);

    const failure = found.error ?? lost.error;
    if (failure) {
      console.error(`Supabase fetch ${label} error:`, failure);
      return { data: null, error: failure.message };
    }

    const items = [...tagWithType(found.data, "found"), ...tagWithType(lost.data, "lost")].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { data: items, error: null };
  } catch (err) {
    console.error(`Supabase fetch ${label} error:`, err);
    return { data: null, error: NETWORK_ERROR_MESSAGE };
  }
};

// The signed-in user's posts, open and returned.
export const fetchMyItems = (userId: string) => fetchFoundAndLost("user_id", userId, "my items");

// Everyone's open posts, for the Feed and the Map.
export const fetchOpenItems = () => fetchFoundAndLost("status", "open", "open items");
