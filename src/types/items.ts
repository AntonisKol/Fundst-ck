export type ItemType = "found" | "lost";

export type ItemRecord = {
  id: string;
  user_id: string | null;
  image_url: string | null;
  category: string | null;
  location: string;
  notes: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
};

export interface ItemDetailsParams extends Omit<ItemRecord, "latitude" | "longitude"> {
  type: ItemType;
}
