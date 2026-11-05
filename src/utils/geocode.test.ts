import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCoordinates } from "./geocode";

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
