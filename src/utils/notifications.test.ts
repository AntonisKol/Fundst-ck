import { beforeEach, describe, expect, it, vi } from "vitest";

const schedule = vi.fn();
vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  scheduleNotificationAsync: (request: unknown) => schedule(request),
}));
vi.mock("../supabase/supabase", () => ({ supabase: {} }));

import type { Session } from "@supabase/supabase-js";
import { messageNotificationsEnabled, messagePreview, showMessageNotification } from "./notifications";

describe("messagePreview", () => {
  it("keeps messages up to 100 characters as they are", () => {
    expect(messagePreview("Is it still there?")).toBe("Is it still there?");
    expect(messagePreview("a".repeat(100))).toBe("a".repeat(100));
  });

  it("shortens longer messages to 100 characters and an ellipsis", () => {
    expect(messagePreview("a".repeat(101))).toBe(`${"a".repeat(100)}…`);
  });

  it("doesn't leave a space before the ellipsis", () => {
    expect(messagePreview(`${"a".repeat(99)} and more`)).toBe(`${"a".repeat(99)}…`);
  });

  it("never cuts an emoji in half", () => {
    expect(messagePreview(`${"a".repeat(99)}😀b`)).toBe(`${"a".repeat(99)}😀…`);
    expect(messagePreview("😀".repeat(100))).toBe("😀".repeat(100));
  });
});

describe("showMessageNotification", () => {
  // Braces matter: a function returned from beforeEach runs as clean-up after each test.
  beforeEach(() => {
    schedule.mockReset();
  });

  it("shows the preview right away and remembers the chat to open", async () => {
    schedule.mockResolvedValue("id");
    await showMessageNotification("a".repeat(150), "conv-1");
    expect(schedule).toHaveBeenCalledWith({
      content: { title: "New message", body: `${"a".repeat(100)}…`, data: { conversationId: "conv-1" } },
      trigger: null,
    });
  });

  it("doesn't throw when the banner can't be shown", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    schedule.mockRejectedValue(new Error("not allowed"));
    await expect(showMessageNotification("Hi", "conv-1")).resolves.toBeUndefined();
  });
});

describe("messageNotificationsEnabled", () => {
  const sessionWith = (metadata: object) => ({ user: { user_metadata: metadata } }) as unknown as Session;

  it("is on by default, including when signed out", () => {
    expect(messageNotificationsEnabled(null)).toBe(true);
    expect(messageNotificationsEnabled(sessionWith({}))).toBe(true);
  });

  it("is off only when the user switched it off", () => {
    expect(messageNotificationsEnabled(sessionWith({ notify_messages: false }))).toBe(false);
    expect(messageNotificationsEnabled(sessionWith({ notify_messages: true }))).toBe(true);
  });
});
