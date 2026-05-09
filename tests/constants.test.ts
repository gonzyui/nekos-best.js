import { describe, it, expect } from "vitest";
import { IMAGE_CATEGORIES, GIF_CATEGORIES } from "../src/constants";

describe("constants", () => {
    it("IMAGE_CATEGORIES is not empty", () => {
        expect(IMAGE_CATEGORIES.length).toBeGreaterThan(0);
    });

    it("GIF_CATEGORIES is not empty", () => {
        expect(GIF_CATEGORIES.length).toBeGreaterThan(0);
    });

    it("has no overlap between images and gifs", () => {
        const overlap = IMAGE_CATEGORIES.filter((c) =>
            (GIF_CATEGORIES as readonly string[]).includes(c),
        );
        expect(overlap).toHaveLength(0);
    });

    it("all categories are lowercase", () => {
        [...IMAGE_CATEGORIES, ...GIF_CATEGORIES].forEach((c) => {
            expect(c).toBe(c.toLowerCase());
        });
    });
});