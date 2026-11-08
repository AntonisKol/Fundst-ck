import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import { fetchOpenItems } from "../utils/items";
import { ItemRow } from "../types/items";

// Everyone's open found and lost posts, newest first, reloaded whenever a post
// changes. Each screen passes its own channel name, since both can be mounted.
export const useOpenItems = (channelName: string) => {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // State is set when the data arrives, never synchronously inside the effect.
    // A failed reload keeps the items already shown.
    const load = () =>
      fetchOpenItems().then((result) => {
        if (result.data) setItems(result.data);
        setError(result.error);
        setLoading(false);
      });

    load();

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "found_items" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "lost_items" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);

  return { items, loading, error };
};
