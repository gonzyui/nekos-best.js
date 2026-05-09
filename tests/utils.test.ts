import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    extractRatelimitData,
    handleRatelimit,
    pickRandomCategory,
    validateCategory,
} from "../src/utils";
import { IMAGE_CATEGORIES, GIF_CATEGORIES } from "../src/constants";

describe("validateCategory", () => {
    it("accepts a valid image category", () => {
        expect(() => validateCategory("neko")).not.toThrow();
    });

    it("accepts a valid gif category", () => {
        expect(() => validateCategory(GIF_CATEGORIES[0])).not.toThrow();
    });

    it("throws on invalid category", () => {
        expect(() => validateCategory("invalid" as never)).toThrow(TypeError);
    });

    it("throws on non-string value", () => {
        expect(() => validateCategory(123 as never)).toThrow();
    });
});

describe("pickRandomCategory", () => {
    it("returns a valid category", () => {
        const all = [...IMAGE_CATEGORIES, ...GIF_CATEGORIES];
        for (let i = 0; i < 50; i++) {
            expect(all).toContain(pickRandomCategory());
        }
    });
});

describe("extractRatelimitData", () => {
    it("parses ISO 8601 headers correctly", () => {
        const response = new Response(null, {
            headers: {
                "x-rate-limit-remaining": "199",
                "x-rate-limit-reset": "2026-05-09T05:24:00.0000000Z",
            },
        });

        const data = extractRatelimitData(response);
        expect(data).not.toBeNull();
        expect(data!.remaining).toBe(199);
        expect(data!.resetsIn).toBe(
            Date.parse("2026-05-09T05:24:00.0000000Z"),
        );
    });

    it("returns null when headers are missing", () => {
        const response = new Response(null);
        expect(extractRatelimitData(response)).toBeNull();
    });

    it("returns null when reset is invalid", () => {
        const response = new Response(null, {
            headers: {
                "x-rate-limit-remaining": "10",
                "x-rate-limit-reset": "not-a-date",
            },
        });
        expect(extractRatelimitData(response)).toBeNull();
    });

    it("returns null when remaining is invalid", () => {
        const response = new Response(null, {
            headers: {
                "x-rate-limit-remaining": "abc",
                "x-rate-limit-reset": "2026-05-09T05:24:00Z",
            },
        });
        expect(extractRatelimitData(response)).toBeNull();
    });
});

describe("handleRatelimit", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("does nothing when remaining > 0", async () => {
        const data = { remaining: 5, resetsIn: Date.now() + 60_000 };
        await expect(handleRatelimit("throw", data)).resolves.toBeUndefined();
    });

    it("does nothing when the window has expired", async () => {
        const data = { remaining: 0, resetsIn: Date.now() - 1000 };
        await expect(handleRatelimit("throw", data)).resolves.toBeUndefined();
    });

    it("throws in 'throw' mode when ratelimited", async () => {
        const data = { remaining: 0, resetsIn: Date.now() + 5000 };
        await expect(handleRatelimit("throw", data)).rejects.toThrow(
            /ratelimited/i,
        );
    });

    it("sleeps in 'sleep' mode until reset", async () => {
        const now = Date.now();
        const data = { remaining: 0, resetsIn: now + 3000 };

        const promise = handleRatelimit("sleep", data);
        await vi.advanceTimersByTimeAsync(3000);
        await expect(promise).resolves.toBeUndefined();
    });
});

import { fetchPath, fetchJson } from "../src/utils";

describe("fetchPath", () => {
    beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
    afterEach(() => vi.unstubAllGlobals());

    it("returns the response when ok", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            new Response("ok", { status: 200 }),
        );

        const res = await fetchPath("neko?amount=1");
        expect(res.status).toBe(200);
    });

    it("throws when response is not ok", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            new Response("Not Found", { status: 404 }),
        );

        await expect(fetchPath("neko?amount=1")).rejects.toThrow(
            /status code 404/,
        );
    });
});

describe("fetchJson", () => {
    beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
    afterEach(() => vi.unstubAllGlobals());

    it("returns parsed JSON", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            new Response(JSON.stringify({ results: [] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
        );

        const data = await fetchJson<{ results: unknown[] }>("neko?amount=1");
        expect(data.results).toHaveLength(0);
    });
});
