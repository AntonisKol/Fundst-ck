import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const single = vi.fn();
vi.mock("../supabase/supabase", () => ({
  supabase: {
    from: () => ({
      insert: (row: object) => insert(row),
      select: () => ({ eq: () => ({ single: () => single() }) }),
    }),
  },
}));

import { NETWORK_ERROR_MESSAGE } from "./items";
import { fetchConversationPartner, reportUser } from "./chat";

const report = { reporterId: "me", reportedUserId: "them", messageId: null, reason: "spam" as const, note: "" };

describe("reportUser", () => {
  beforeEach(() => {
    insert.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("files the report as the given reporter and returns no error", async () => {
    insert.mockResolvedValue({ error: null });

    await expect(reportUser({ ...report, messageId: "m1", note: "  rude  " })).resolves.toBeNull();
    expect(insert).toHaveBeenCalledWith({
      reporter_id: "me",
      reported_user_id: "them",
      message_id: "m1",
      reason: "spam",
      note: "rude",
    });
  });

  it("stores an empty note as null", async () => {
    insert.mockResolvedValue({ error: null });

    await reportUser({ ...report, note: "   " });

    expect(insert.mock.calls[0][0].note).toBeNull();
  });

  it("explains a duplicate report", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });

    await expect(reportUser(report)).resolves.toMatch(/already reported/);
  });

  it("returns other server errors as they are", async () => {
    insert.mockResolvedValue({ error: { code: "42501", message: "denied" } });

    await expect(reportUser(report)).resolves.toBe("denied");
  });

  it("returns the network message when the request throws", async () => {
    insert.mockRejectedValue(new Error("offline"));

    await expect(reportUser(report)).resolves.toBe(NETWORK_ERROR_MESSAGE);
  });
});

describe("fetchConversationPartner", () => {
  beforeEach(() => {
    single.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    ["the requester, when I'm the owner", "me", "them"],
    ["the owner, when I'm the requester", "them", "me"],
  ])("returns %s", async (_, owner_id, requester_id) => {
    single.mockResolvedValue({ data: { owner_id, requester_id }, error: null });

    await expect(fetchConversationPartner("c1", "me")).resolves.toBe("them");
  });

  it("returns null when the conversation can't be loaded", async () => {
    single.mockResolvedValue({ data: null, error: { message: "not found" } });

    await expect(fetchConversationPartner("c1", "me")).resolves.toBeNull();
  });
});
