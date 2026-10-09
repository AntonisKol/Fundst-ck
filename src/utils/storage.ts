import { File } from "expo-file-system";
import { supabase } from "../supabase/supabase";

const BUCKET = "item-photos";

export const uploadImage = async (imageUri: string): Promise<string | null> => {
  try {
    // fetch(uri).blob() silently produces a 0-byte blob for local files on
    // React Native, so the upload "succeeds" with an empty file. Reading the
    // file directly avoids that.
    const file = new File(imageUri);
    const arrayBuffer = await file.arrayBuffer();

    const fileExt = imageUri.split(".").pop()?.split("?")[0] || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const contentType = fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`;

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, arrayBuffer, {
      contentType,
    });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error("Supabase storage upload error:", err);
    return null;
  }
};
