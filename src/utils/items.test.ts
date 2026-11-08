import { beforeEach, describe, expect, it, vi } from "vitest";

const eq = vi.fn();
const change = vi.fn();
vi.mock("../supabase/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({ eq: (column: string, value: string) => eq(table, column, value) }),
      update: (values: object) => ({ eq: (_: string, id: string) => ({ select: () => change("update", table, id, values) }) }),
      delete: () => ({ eq: (_: string, id: string) => ({ select: () => change("delete", table, id) }) }),
    }),
  },
}));

import { deleteItem, fetchMyItems, fetchOpenItems, NETWORK_ERROR_MESSAGE, setItemStatus } from "./items";

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

// Shares its merging and error handling with fetchMyItems, tested above.
describe("fetchOpenItems", () => {
  beforeEach(() => {
    eq.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("asks both tables for open posts only, merged newest first", async () => {
    eq.mockImplementation(async (table: string) => ({
      data: table === "found_items" ? [row("old-found", "2026-01-01T00:00:00Z")] : [row("new-lost", "2026-02-01T00:00:00Z")],
      error: null,
    }));

    const { data } = await fetchOpenItems();

    expect(eq).toHaveBeenCalledWith("found_items", "status", "open");
    expect(eq).toHaveBeenCalledWith("lost_items", "status", "open");
    expect(data?.map((item) => [item.id, item.type])).toEqual([
      ["new-lost", "lost"],
      ["old-found", "found"],
    ]);
  });
});

describe("changing a post", () => {
  beforeEach(() => {
    change.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("updates the status in the table for the post's type", async () => {
    change.mockResolvedValue({ data: [{ id: "1" }], error: null });

    await expect(setItemStatus("lost", "1", "returned")).resolves.toBeNull();
    expect(change).toHaveBeenCalledWith("update", "lost_items", "1", { status: "returned" });
  });

  it("deletes from the table for the post's type", async () => {
    change.mockResolvedValue({ data: [{ id: "1" }], error: null });

    await expect(deleteItem("found", "1")).resolves.toBeNull();
    expect(change).toHaveBeenCalledWith("delete", "found_items", "1");
  });

  // RLS refuses by touching no rows rather than raising an error.
  it.each([
    ["setItemStatus", () => setItemStatus("found", "1", "returned")],
    ["deleteItem", () => deleteItem("found", "1")],
  ])("%s reports a failure when no row changed", async (_, run) => {
    change.mockResolvedValue({ data: [], error: null });

    await expect(run()).resolves.toMatch(/couldn't be changed/);
  });

  it.each([
    ["setItemStatus", () => setItemStatus("found", "1", "returned")],
    ["deleteItem", () => deleteItem("found", "1")],
  ])("%s returns the error message from the server", async (_, run) => {
    change.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(run()).resolves.toBe("boom");
  });

  it("returns the network message when the request throws", async () => {
    change.mockRejectedValue(new Error("offline"));

    await expect(deleteItem("found", "1")).resolves.toBe(NETWORK_ERROR_MESSAGE);
  });
});
