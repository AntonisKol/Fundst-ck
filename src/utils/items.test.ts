import { beforeEach, describe, expect, it, vi } from "vitest";

const eq = vi.fn();
vi.mock("../supabase/supabase", () => ({
  supabase: { from: (table: string) => ({ select: () => ({ eq: (column: string, value: string) => eq(table, column, value) }) }) },
}));

import { fetchMyItems, NETWORK_ERROR_MESSAGE } from "./items";

const row = (id: string, created_at: string) => ({ id, created_at });

describe("fetchMyItems", () => {
  beforeEach(() => {
    eq.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("merges found and lost posts newest first, tagged with their type", async () => {
    eq.mockImplementation(async (table: string) => ({
      data: table === "found_items"
        ? [row("old-found", "2026-01-01T00:00:00Z"), row("new-found", "2026-03-01T00:00:00Z")]
        : [row("mid-lost", "2026-02-01T00:00:00Z")],
      error: null,
    }));

    const { data, error } = await fetchMyItems("user-1");

    expect(error).toBeNull();
    expect(data?.map((item) => [item.id, item.type])).toEqual([
      ["new-found", "found"],
      ["mid-lost", "lost"],
      ["old-found", "found"],
    ]);
  });

  it("only asks for the given user's posts", async () => {
    eq.mockResolvedValue({ data: [], error: null });

    await fetchMyItems("user-1");

    expect(eq).toHaveBeenCalledWith("found_items", "user_id", "user-1");
    expect(eq).toHaveBeenCalledWith("lost_items", "user_id", "user-1");
  });

  it("returns the message when a query fails", async () => {
    eq.mockImplementation(async (table: string) =>
      table === "lost_items" ? { data: null, error: { message: "boom" } } : { data: [], error: null }
    );

    await expect(fetchMyItems("user-1")).resolves.toEqual({ data: null, error: "boom" });
  });

  it("returns the network message when a query throws", async () => {
    eq.mockRejectedValue(new Error("offline"));

    await expect(fetchMyItems("user-1")).resolves.toEqual({ data: null, error: NETWORK_ERROR_MESSAGE });
  });
});
