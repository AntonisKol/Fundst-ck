import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";
import PostScreen from "./PostScreen";

// A signed-in user, so the Post tab shows the forms instead of the sign-in prompt.
jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ session: { user: { id: "user-1" } }, loading: false }),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
// Saving and photo upload talk to Supabase; these tests never save.
jest.mock("../../utils/items", () => ({ insertItem: jest.fn() }));
jest.mock("../../utils/storage", () => ({ uploadImage: jest.fn() }));

// Both forms use the same placeholder. Queries skip the hidden form, so this
// always finds the notes field of the form the user is looking at.
const notesField = () => screen.getByPlaceholderText("Color, brand, condition...");

describe("Post tab", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
  });

  it("starts on the Found form", async () => {
    await render(<PostScreen />);

    expect(screen.getByRole("button", { name: "Found" })).toBeSelected();
    expect(screen.getByText("Report Found Item")).toBeOnTheScreen();
    expect(screen.queryByText("Report Lost Item")).not.toBeOnTheScreen();
  });

  it("keeps each draft when switching between Found and Lost", async () => {
    await render(<PostScreen />);

    // Start a Found post.
    await user.press(screen.getByText("Wallet"));
    await user.type(notesField(), "Black leather wallet");

    // Switch to Lost: a separate, empty form.
    await user.press(screen.getByRole("button", { name: "Lost" }));
    expect(screen.getByRole("button", { name: "Lost" })).toBeSelected();
    expect(screen.getByText("Report Lost Item")).toBeOnTheScreen();
    expect(notesField()).toHaveDisplayValue("");
    await user.type(notesField(), "Blue umbrella");

    // Back to Found: the draft, including the chosen category, is still there.
    await user.press(screen.getByRole("button", { name: "Found" }));
    expect(notesField()).toHaveDisplayValue("Black leather wallet");
    expect(screen.getByRole("button", { name: /handing it in/ })).toBeOnTheScreen();

    // And the Lost draft survived too.
    await user.press(screen.getByRole("button", { name: "Lost" }));
    expect(notesField()).toHaveDisplayValue("Blue umbrella");
  });
});
