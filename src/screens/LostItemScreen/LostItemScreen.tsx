import { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Alert,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { styles } from "./styled";
import { useNavigation } from "@react-navigation/native";
import { uploadImage } from "../../utils/storage";
import { insertItem } from "../../utils/items";
import { CATEGORIES } from "../../constants/categories";
import DismissKeyboardOnTap from "../../components/DismissKeyboardOnTap";
import ZipCodePicker from "../../components/ZipCodePicker";
import RequireAuthPrompt from "../../components/RequireAuthPrompt";
import { useAuth } from "../../context/AuthContext";

const LostItemScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [category, setCategory] = useState("Other");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<{ category?: boolean; location?: boolean; notes?: boolean }>({});
  const notesRef = useRef<TextInput>(null);

  const validate = () => {
    let valid = true;
    const newErrors: { category?: boolean; location?: boolean; notes?: boolean } = {};

    if (!category.trim()) {
      newErrors.category = true;
      valid = false;
    }
    if (!location.trim()) {
      newErrors.location = true;
      valid = false;
    }
    if (!notes.trim()) {
      newErrors.notes = true;
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Media library access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setUploading(true);
      const url = await uploadImage(uri);
      setUploading(false);
      if (url) setUploadedUrl(url);
      else Alert.alert("Error", "Upload failed");
    }
  };

  const saveItem = async () => {
    Keyboard.dismiss();

    if (!validate()) {
      Alert.alert("Missing info", "Please fill all required fields.");
      return;
    }

    if (!session) {
      Alert.alert("Sign in required", "Please sign in to post a lost item.");
      return;
    }

    setUploading(true);
    const error = await insertItem("lost_items", {
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

    Alert.alert("Success", "Lost item saved!");
    setImageUri(null);
    setUploadedUrl(null);
    setCategory("Other");
    setLocation("");
    setNotes("");
    setErrors({});
    navigation.navigate("Feed");
  };

  const renderCategoryChip = (cat: string) => {
    const selected = category === cat;
    return (
      <Pressable
        key={cat}
        onPress={() => {
          setCategory(cat);
          if (errors.category) setErrors((prev) => ({ ...prev, category: false }));
        }}
        style={[styles.chip, selected && styles.chipSelected]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat}</Text>
      </Pressable>
    );
  };

  if (!session) {
    return <RequireAuthPrompt message="Sign in to post a lost item." />;
  }

  return (
    <DismissKeyboardOnTap>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.cardWrapper}>
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.card}>
            <Text style={styles.title}>Lost Item</Text>
            <Text style={styles.subtitle}>Report something you lost</Text>

            {/* Optional Image */}
            <Pressable style={styles.imageBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <Text style={styles.imageText}>Tap to add photo (optional)</Text>
              )}
              {uploading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.loadingText}>Uploading...</Text>
                </View>
              )}
            </Pressable>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipContainer}
              >
                {CATEGORIES.map(renderCategoryChip)}
              </ScrollView>
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Possible ZIP code*</Text>
              <ZipCodePicker
                style={[styles.input, errors.location && styles.errorInput]}
                value={location}
                onChange={(zip) => {
                  setLocation(zip);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: false }));
                }}
              />
            </View>

            {/* Description/Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description*</Text>
              <TextInput
                ref={notesRef}
                style={[styles.input, styles.noteInput, errors.notes && styles.errorInput]}
                placeholder="Color, brand, condition..."
                value={notes}
                onChangeText={(text) => {
                  setNotes(text);
                  if (errors.notes) setErrors((prev) => ({ ...prev, notes: false }));
                }}
                multiline
                returnKeyType="done"
              />
            </View>

            <Pressable disabled={uploading} style={styles.saveButton} onPress={saveItem}>
              <Text style={styles.saveText}>Report Lost Item</Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DismissKeyboardOnTap>
  );
};

export default LostItemScreen;
