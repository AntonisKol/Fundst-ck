import { describe, expect, it, vi } from "vitest";

vi.mock("expo-location", () => ({}));

import { pickStartingPoint, regionAround } from "./location";

const berlin = { latitude: 52.52, longitude: 13.4 };
const munich = { latitude: 48.14, longitude: 11.58 };

describe("pickStartingPoint", () => {
  it("prefers the user's position", async () => {
    const geocode = vi.fn();

    await expect(pickStartingPoint({ here: async () => berlin, zip: "80331", geocode })).resolves.toEqual(berlin);
    expect(geocode).not.toHaveBeenCalled();
  });

  it("falls back to the registered ZIP code", async () => {
    const geocode = vi.fn().mockResolvedValue(munich);

    await expect(pickStartingPoint({ here: async () => null, zip: "80331", geocode })).resolves.toEqual(munich);
    expect(geocode).toHaveBeenCalledWith("80331");
  });

  it("returns null without a position or ZIP code", async () => {
    await expect(pickStartingPoint({ here: async () => null, zip: undefined, geocode: vi.fn() })).resolves.toBeNull();
  });

  it("returns null when the ZIP code can't be found", async () => {
    const geocode = vi.fn().mockResolvedValue(null);

    await expect(pickStartingPoint({ here: async () => null, zip: "80331", geocode })).resolves.toBeNull();
  });
});

describe("regionAround", () => {
  it("centres a district-sized region on the point", () => {
    expect(regionAround(munich)).toEqual({ ...munich, latitudeDelta: 0.08, longitudeDelta: 0.08 });
  });
});
