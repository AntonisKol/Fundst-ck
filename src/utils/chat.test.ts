import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const single = vi.fn();
const maybeSingle = vi.fn();
const remove = vi.fn();
const sent = vi.fn();
vi.mock("../supabase/supabase", () => ({
  supabase: {
    from: () => ({
      insert: (row: object) => Object.assign(insert(row) ?? {}, { select: () => ({ single: () => sent() }) }),
      select: () => ({ eq: () => ({ single: () => single(), eq: () => ({ maybeSingle: () => maybeSingle() }) }) }),
      delete: () => ({ eq: () => ({ eq: () => remove() }) }),
    }),
  },
}));

import { NETWORK_ERROR_MESSAGE } from "./items";
import { blockUser, fetchConversationPartner, hasBlocked, reportUser, sendMessage, unblockUser } from "./chat";

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

describe("blocking", () => {
  beforeEach(() => {
    insert.mockReset();
    maybeSingle.mockReset();
    remove.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("blocks as the given user", async () => {
    insert.mockResolvedValue({ error: null });

    await expect(blockUser("me", "them")).resolves.toBeNull();
    expect(insert).toHaveBeenCalledWith({ blocker_id: "me", blocked_id: "them" });
  });

  it("treats an existing block as success", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });

    await expect(blockUser("me", "them")).resolves.toBeNull();
  });

  it("returns other block errors", async () => {
    insert.mockResolvedValue({ error: { code: "42501", message: "denied" } });

    await expect(blockUser("me", "them")).resolves.toBe("denied");
  });

  it("unblocks, and reports a failure", async () => {
    remove.mockResolvedValueOnce({ error: null });
    await expect(unblockUser("me", "them")).resolves.toBeNull();

    remove.mockRejectedValueOnce(new Error("offline"));
    await expect(unblockUser("me", "them")).resolves.toBe(NETWORK_ERROR_MESSAGE);
  });

  it.each([
    ["a block exists", { blocked_id: "them" }, true],
    ["no block exists", null, false],
  ])("hasBlocked when %s", async (_, data, expected) => {
    maybeSingle.mockResolvedValue({ data, error: null });

    await expect(hasBlocked("me", "them")).resolves.toBe(expected);
  });

  it("hasBlocked is false when the lookup fails", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(hasBlocked("me", "them")).resolves.toBe(false);
  });
});

describe("sendMessage", () => {
  beforeEach(() => {
    insert.mockReset();
    sent.mockReset();
  });

  it("returns a rule's refusal without logging it as an error", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    logged.mockClear();
    sent.mockResolvedValue({ data: null, error: { code: "P0001", message: "You can't message this person." } });

    await expect(sendMessage("c1", "me", "hi")).resolves.toEqual({ data: null, error: "You can't message this person." });
    expect(logged).not.toHaveBeenCalled();
  });

  it("still logs an unexpected failure", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    logged.mockClear();
    sent.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    await expect(sendMessage("c1", "me", "hi")).resolves.toEqual({ data: null, error: "denied" });
    expect(logged).toHaveBeenCalledOnce();
  });
});
