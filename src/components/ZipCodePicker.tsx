import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Keyboard,
  Platform,
  InputAccessoryView,
} from "react-native";
import { BERLIN_ZIP_CODES } from "../constants/berlinZipCodes";
import { colors } from "../constants/theme";

interface Props {
  value: string;
  onChange: (zip: string) => void;
  placeholder?: string;
  style?: any;
}

const ZIP_ACCESSORY_ID = "zipCodeSearchDone";

const ZipCodePicker = ({ value, onChange, placeholder = "Select ZIP code", style }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return BERLIN_ZIP_CODES;
    return BERLIN_ZIP_CODES.filter(
      (z) => z.zip.includes(q) || z.area.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = BERLIN_ZIP_CODES.find((z) => z.zip === value);

  return (
    <>
      <Pressable style={style} onPress={() => setOpen(true)}>
        <Text style={selected ? styles.valueText : styles.placeholderText}>
          {selected ? `${selected.zip} · ${selected.area}` : placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select ZIP code</Text>
          <TextInput
            style={styles.search}
            placeholder="Search by ZIP code..."
            value={search}
            onChangeText={setSearch}
            autoFocus
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            inputAccessoryViewID={Platform.OS === "ios" ? ZIP_ACCESSORY_ID : undefined}
          />
          {/* iOS number pads have no return/done key, so add a Done bar above it. */}
          {Platform.OS === "ios" && (
            <InputAccessoryView nativeID={ZIP_ACCESSORY_ID}>
              <View style={styles.accessoryBar}>
                <Pressable onPress={Keyboard.dismiss} hitSlop={12}>
                  <Text style={styles.accessoryDone}>Done</Text>
                </Pressable>
              </View>
            </InputAccessoryView>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.zip}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[styles.row, item.zip === value && styles.rowSelected]}
                onPress={() => {
                  onChange(item.zip);
                  setSearch("");
                  setOpen(false);
                }}
              >
                <Text style={styles.rowZip}>{item.zip}</Text>
                <Text style={styles.rowArea}>{item.area}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No matching ZIP codes.</Text>}
          />
          <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
};

export default ZipCodePicker;

const styles = StyleSheet.create({
  valueText: { fontSize: 15, color: colors.ink },
  placeholderText: { fontSize: 15, color: colors.inkSoft },
  modal: { flex: 1, backgroundColor: colors.paper, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16, color: colors.ink },
  search: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.surfaceMuted },
  rowZip: { fontSize: 15, fontWeight: "600", color: colors.ink },
  rowArea: { fontSize: 15, color: colors.inkSoft },
  empty: { textAlign: "center", color: colors.inkSoft, marginTop: 40 },
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accessoryDone: { fontSize: 16, color: colors.stamp, fontWeight: "600" },
  closeButton: { paddingVertical: 16, alignItems: "center" },
  closeButtonText: { fontSize: 16, color: colors.stamp, fontWeight: "600" },
});
