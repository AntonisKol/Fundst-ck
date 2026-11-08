import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Alert } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CATEGORIES } from "../constants/categories";
import { HAND_IN_CATEGORIES } from "../constants/safety";
import ItemForm from "./ItemForm";

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ session: { user: { id: "user-1" } }, loading: false }),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
// Saving and photo upload talk to Supabase; these tests never save.
jest.mock("../utils/items", () => ({ insertItem: jest.fn() }));
jest.mock("../utils/storage", () => ({ uploadImage: jest.fn() }));

const HAND_IN_LINK = { name: "Consider handing it in to the police or a Fundbüro" };
const FUNDBUERO_LINK = { name: "Check the Fundbüro for your lost item" };

const SENSITIVE = CATEGORIES.filter((category) => HAND_IN_CATEGORIES.includes(category));
const EVERYDAY = CATEGORIES.filter((category) => !HAND_IN_CATEGORIES.includes(category));

describe("Hand it in link on the Found form", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
  });

  it("is hidden for the default category", async () => {
    await render(<ItemForm type="found" />);

    expect(screen.queryByRole("button", HAND_IN_LINK)).not.toBeOnTheScreen();
  });

  it.each(SENSITIVE)("shows for %s", async (category) => {
    await render(<ItemForm type="found" />);

    await user.press(screen.getByText(category));

    expect(screen.getByRole("button", HAND_IN_LINK)).toBeOnTheScreen();
  });

  it.each(EVERYDAY)("stays hidden for %s", async (category) => {
    await render(<ItemForm type="found" />);

    await user.press(screen.getByText(category));

    expect(screen.queryByRole("button", HAND_IN_LINK)).not.toBeOnTheScreen();
  });

  it("disappears again when switching to an everyday category", async () => {
    await render(<ItemForm type="found" />);

    await user.press(screen.getByText("Phone"));
    expect(screen.getByRole("button", HAND_IN_LINK)).toBeOnTheScreen();

    await user.press(screen.getByText("Umbrella"));
    expect(screen.queryByRole("button", HAND_IN_LINK)).not.toBeOnTheScreen();
  });

  it("explains where to hand it in when pressed", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await render(<ItemForm type="found" />);

    await user.press(screen.getByText("Wallet"));
    await user.press(screen.getByRole("button", HAND_IN_LINK));

    expect(alert).toHaveBeenCalledWith("Consider handing it in", expect.any(String), expect.any(Array));
    alert.mockRestore();
  });
});

describe("Fundbüro link on the Lost form", () => {
  it("never offers to hand it in, but always suggests checking the Fundbüro", async () => {
    const user = userEvent.setup();
    await render(<ItemForm type="lost" />);

    for (const category of ["Other", "Wallet", "Umbrella"]) {
      await user.press(screen.getByText(category));
      expect(screen.getByRole("button", FUNDBUERO_LINK)).toBeOnTheScreen();
      expect(screen.queryByRole("button", HAND_IN_LINK)).not.toBeOnTheScreen();
    }
  });
});
