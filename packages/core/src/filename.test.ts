import { describe, expect, it } from "vitest";
import { buildPhotoFilename, resolveCollision } from "./filename";

describe("filename helpers", () => {
  it("builds timestamp filename", () => {
    const value = buildPhotoFilename(new Date("2026-01-02T03:04:05"));
    expect(value).toBe("20260102_030405.png");
  });

  it("adds suffix when collision exists", () => {
    const existing = new Set(["x.png", "x_1.png"]);
    expect(resolveCollision("x.png", existing)).toBe("x_2.png");
  });
});
