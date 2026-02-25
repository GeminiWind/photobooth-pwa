import { describe, expect, it } from "vitest";
import { computeCoverFit, validateFrameTemplate, validateNormalizedRect } from "./frame";

describe("frame helpers", () => {
  it("validates normalized rect boundaries", () => {
    expect(validateNormalizedRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })).toBe(true);
    expect(validateNormalizedRect({ x: -0.1, y: 0.1, width: 0.8, height: 0.8 })).toBe(false);
    expect(validateNormalizedRect({ x: 0.2, y: 0.2, width: 0.9, height: 0.9 })).toBe(false);
  });

  it("validates frame template", () => {
    expect(
      validateFrameTemplate({
        id: "frame-1",
        name: "Frame 1",
        source: "bundled",
        frameImagePathOrUrl: "/frames/f-1.png",
        safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
      })
    ).toBe(true);
  });

  it("computes cover fit", () => {
    const fit = computeCoverFit(1920, 1080, 800, 1200);
    expect(fit.dh).toBe(1200);
    expect(fit.dw).toBeGreaterThan(800);
  });
});
