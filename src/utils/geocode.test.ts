import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCoordinates, germanZipExists, isGermanZipFormat } from "./geocode";

describe("fetchCoordinates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns coordinates for a valid geocoding result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "52.5200", lon: "13.4050" }],
      })
    );

    await expect(fetchCoordinates("10115")).resolves.toEqual({
      latitude: 52.52,
      longitude: 13.405,
    });
  });

  it("returns null when the ZIP code has no match", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));

    await expect(fetchCoordinates("00000")).resolves.toBeNull();
  });

  it("returns null for unsuccessful responses and invalid coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => [] }));
    await expect(fetchCoordinates("10115")).resolves.toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "91", lon: "13.405" }],
      })
    );
    await expect(fetchCoordinates("10115")).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));

    await expect(fetchCoordinates("10115")).resolves.toBeNull();
  });
});

describe("isGermanZipFormat", () => {
  it.each(["01001", "10115", "99998"])("accepts %s", (zip) => {
    expect(isGermanZipFormat(zip)).toBe(true);
  });

  it.each(["", "1011", "101155", "00123", "1011a", " 10115"])("rejects %j", (zip) => {
    expect(isGermanZipFormat(zip)).toBe(false);
  });
});

describe("germanZipExists", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is true when OpenStreetMap finds the ZIP code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ lat: "52.5", lon: "13.4" }] }));

    await expect(germanZipExists("10115")).resolves.toBe(true);
  });

  it("is false when it finds nothing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));

    await expect(germanZipExists("99999")).resolves.toBe(false);
  });

  it("is null when it couldn't be checked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => [] }));
    await expect(germanZipExists("10115")).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(germanZipExists("10115")).resolves.toBeNull();
  });
});
