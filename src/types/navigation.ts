import { ItemDetailsParams } from "./items";

export type MainTabParamList = {
  Feed: undefined;
  Post: undefined;
  Map: undefined;
  Messages: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Landing: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  ItemDetails: ItemDetailsParams;
  Chat: { conversationId: string; title?: string };
};
