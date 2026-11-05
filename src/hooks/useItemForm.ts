import { useState } from "react";
import { Alert, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { ItemType } from "../types/items";
import { MainTabParamList } from "../types/navigation";
import { insertItem } from "../utils/items";
import { uploadImage } from "../utils/storage";

interface FormErrors {
  category?: boolean;
  location?: boolean;
  notes?: boolean;
}

export const useItemForm = (type: ItemType) => {
  const { session } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("Other");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = (field: keyof FormErrors, value: string) => {
    if (field === "category") setCategory(value);
    if (field === "location") setLocation(value);
    if (field === "notes") setNotes(value);
    setErrors((previous) => ({ ...previous, [field]: false }));
  };

  const pickImage = async () => {
    try {
      const permission =
        type === "found"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          type === "found"
            ? "Camera access is required to photograph the item."
            : "Media library access is required."
        );
        return;
      }

      const result =
        type === "found"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.7,
            });

      if (result.canceled || result.assets.length === 0) return;

      const uri = result.assets[0].uri;
      setImageUri(uri);
      setUploadedUrl(null);
      setUploading(true);
      const imageUrl = await uploadImage(uri);
      if (!imageUrl) {
        Alert.alert("Error", "Upload failed");
        return;
      }
      setUploadedUrl(imageUrl);
    } catch (error) {
      console.error("Image selection error:", error);
      Alert.alert("Error", "Couldn't select or upload the photo.");
    } finally {
      setUploading(false);
    }
  };

  const saveItem = async () => {
    Keyboard.dismiss();
    if (uploading) return;

    const nextErrors: FormErrors = {};
    if (!category.trim()) nextErrors.category = true;
    if (!location.trim()) nextErrors.location = true;
    if (type === "lost" && !notes.trim()) nextErrors.notes = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Alert.alert("Missing info", type === "found" ? "Category and Location are required." : "Please fill all required fields.");
      return;
    }

    if (!session) {
      Alert.alert("Sign in required", `Please sign in to post a ${type} item.`);
      return;
    }

    setUploading(true);
    const error = await insertItem(type, {
      user_id: session.user.id,
      image_url: uploadedUrl,
      category,
      location,
      notes,
    });
    setUploading(false);
    if (error) {
      Alert.alert("Error", error);
      return;
    }

    Alert.alert("Success", type === "found" ? "Item saved!" : "Lost item saved!");
    setImageUri(null);
    setUploadedUrl(null);
    setCategory("Other");
    setLocation("");
    setNotes("");
    setErrors({});
    navigation.navigate("Feed");
  };

  return {
    category,
    errors,
    imageUri,
    location,
    notes,
    pickImage,
    saveItem,
    setCategory: (value: string) => updateField("category", value),
    setLocation: (value: string) => updateField("location", value),
    setNotes: (value: string) => updateField("notes", value),
    session,
    uploading,
  };
};
