import { ItemRecord } from "./items";

type Table<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown>,
  Update extends Record<string, unknown> = Partial<Insert>,
  Relationships extends unknown[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

// status and returned_at come from column defaults and a trigger (008_post_status.sql).
type ItemInsert = Omit<ItemRecord, "id" | "created_at" | "status" | "returned_at"> & {
  id?: string;
  created_at?: string;
};

// Mirrors the columns 008_post_status.sql lets signed-in users update.
type ItemUpdate = Partial<
  Pick<ItemRecord, "status" | "category" | "location" | "notes" | "image_url" | "latitude" | "longitude">
>;

type ConversationRow = {
  id: string;
  item_id: string;
  item_type: "found" | "lost";
  owner_id: string;
  requester_id: string;
  created_at: string;
  last_message_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export interface Database {
  public: {
    Tables: {
      found_items: Table<ItemRecord, ItemInsert, ItemUpdate>;
      lost_items: Table<ItemRecord, ItemInsert, ItemUpdate>;
      conversations: Table<
        ConversationRow,
        Omit<ConversationRow, "id" | "created_at" | "last_message_at"> & {
          id?: string;
          created_at?: string;
          last_message_at?: string;
        }
      >;
      messages: Table<
        MessageRow,
        Omit<MessageRow, "id" | "created_at" | "read_at"> & {
          id?: string;
          created_at?: string;
          read_at?: string | null;
        },
        Partial<MessageRow>,
        [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      start_conversation: {
        Args: { p_item_type: "found" | "lost"; p_item_id: string };
        Returns: string;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
