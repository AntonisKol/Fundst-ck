import { jest } from "@jest/globals";

// Native pieces the screen tests don't care about.

// Icons load their font through expo-asset, which only resolves under Metro.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock(
  "react-native-safe-area-context",
  () => jest.requireActual<{ default: object }>("react-native-safe-area-context/jest/mock").default
);
