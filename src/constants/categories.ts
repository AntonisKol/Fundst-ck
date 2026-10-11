import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

// Ordered from most sensitive (IDs, money, personal data) to least.
export const CATEGORIES = [
  "Documents",
  "Bank card",
  "Wallet",
  "Phone",
  "Keys",
  "Electronics",
  "Jewelry",
  "Bag / Backpack",
  "Glasses",
  "Clothing",
  "Umbrella",
  "Toys",
  "Other",
];

// Shown wherever an item has no photo.
export const CATEGORY_ICONS: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
  Documents: "document-text-outline",
  "Bank card": "card-outline",
  Wallet: "wallet-outline",
  Phone: "phone-portrait-outline",
  Keys: "key-outline",
  Electronics: "headset-outline",
  Jewelry: "diamond-outline",
  "Bag / Backpack": "bag-handle-outline",
  Glasses: "glasses-outline",
  Clothing: "shirt-outline",
  Umbrella: "umbrella-outline",
  Toys: "game-controller-outline",
  Other: "cube-outline",
};
