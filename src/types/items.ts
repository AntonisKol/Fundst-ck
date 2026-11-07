export type ItemType = "found" | "lost";
export type ItemStatus = "open" | "returned";

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
  status: ItemStatus;
  returned_at: string | null;
};

// A post as shown in lists and on the details screen.
export interface ListItem extends Omit<ItemRecord, "latitude" | "longitude"> {
  type: ItemType;
}

export type ItemDetailsParams = ListItem;
