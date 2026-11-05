import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { CATEGORIES } from "../constants/categories";
import { HAND_IN_CATEGORIES } from "../constants/safety";
import { ItemType } from "../types/items";
import DismissKeyboardOnTap from "./DismissKeyboardOnTap";
import FundbueroLink from "./FundbueroLink";
import RequireAuthPrompt from "./RequireAuthPrompt";
import ZipCodePicker from "./ZipCodePicker";
import { useItemForm } from "../hooks/useItemForm";
import { styles } from "./ItemForm.styled";

const ItemForm = ({ type }: { type: ItemType }) => {
  const {
    category,
    errors,
    imageUri,
    location,
    notes,
    pickImage,
    saveItem,
    setCategory,
    setLocation,
    setNotes,
    session,
    uploading,
  } = useItemForm(type);
  const isFound = type === "found";

  if (!session) {
    return <RequireAuthPrompt message={`Sign in to post a ${type} item.`} />;
  }

  return (
    <DismissKeyboardOnTap>
      <KeyboardAvoidingView style={styles.form} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.page} contentInsetAdjustmentBehavior="never">
          <View style={styles.cardWrapper}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.card}>
              <Pressable style={styles.imageBox} onPress={pickImage} disabled={uploading}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                  <Text style={styles.imageText}>
                    {isFound ? "Tap to take a photo" : "Tap to add photo (optional)"}
                  </Text>
                )}
                {uploading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.loadingText}>Uploading...</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, styles.labelInRow]}>Category *</Text>
                  {isFound ? (
                    HAND_IN_CATEGORIES.includes(category) && <FundbueroLink variant="found" />
                  ) : (
                    <FundbueroLink variant="lost" />
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                  {CATEGORIES.map((itemCategory) => {
                    const selected = category === itemCategory;
                    return (
                      <Pressable
                        key={itemCategory}
                        onPress={() => setCategory(itemCategory)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{itemCategory}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{isFound ? "ZIP Code Found*" : "Possible ZIP code*"}</Text>
                <ZipCodePicker
                  style={[styles.zipInput, errors.location && styles.errorInput]}
                  value={location}
                  onChange={setLocation}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{isFound ? "Notes" : "Description*"}</Text>
                <TextInput
                  style={[styles.input, styles.noteInput, errors.notes && styles.errorInput]}
                  placeholder="Color, brand, condition..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  returnKeyType="done"
                />
                {isFound && (
                  <Text style={styles.hint}>
                    Don't show serial numbers, ID cards or distinguishing details in the photo or notes. Keep them to
                    check who the real owner is.
                  </Text>
                )}
              </View>

              <Pressable
                disabled={uploading}
                style={[styles.saveButton, !isFound && styles.saveButtonLost]}
                onPress={saveItem}
              >
                <Text style={styles.saveText}>{isFound ? "Report Found Item" : "Report Lost Item"}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DismissKeyboardOnTap>
  );
};

export default ItemForm;
