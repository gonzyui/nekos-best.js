import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client, fetchRandom } from "../src/client";

const fetchMock = vi.fn();

beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const mockResponse = (body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            "content-type": "application/json",
            ...headers,
        },
    });

describe("Client", () => {
    describe("fetch()", () => {
        it("calls the correct URL with category and amount", async () => {
            fetchMock.mockResolvedValueOnce(
                mockResponse({
                    results: [
                        {
                            url: "https://nekos.best/api/v2/neko/dcda2fb2-e66f-4beb-96ee-471c78e4e67e.png",
                        },
                    ],
                }),
            );

            const client = new Client();
            const result = await client.fetch("neko", 1);

            expect(fetchMock).toHaveBeenCalledOnce();
            expect(result.results).toHaveLength(1);
        });

        it("picks a random category when null is passed", async () => {
            fetchMock.mockResolvedValueOnce(
                mockResponse({ results: [] }),
            );

            const client = new Client();
            await client.fetch(null, 1);

            expect(fetchMock).toHaveBeenCalledOnce();
        });

        it("throws on invalid category", async () => {
            const client = new Client();
            await expect(
                client.fetch("invalid" as never, 1),
            ).rejects.toThrow(TypeError);
        });

        it("throws when amount is not an integer", async () => {
            const client = new Client();
            await expect(
                client.fetch("neko", 1.5),
            ).rejects.toThrow(TypeError);
        });

        it("updates internal state from response headers", async () => {
            const resetDate = new Date(Date.now() + 60_000).toISOString();
            fetchMock.mockResolvedValueOnce(
                mockResponse(
                    { results: [] },
                    {
                        "x-rate-limit-remaining": "42",
                        "x-rate-limit-reset": resetDate,
                    },
                ),
            );

            const client = new Client();
            await client.fetch("neko", 1);
            // No error means ratelimit handling succeeded
        });

        it("throws when remaining = 0 in 'throw' mode", async () => {
            const resetDate = new Date(Date.now() + 60_000).toISOString();
            fetchMock.mockResolvedValue(
                mockResponse(
                    { results: [] },
                    {
                        "x-rate-limit-remaining": "0",
                        "x-rate-limit-reset": resetDate,
                    },
                ),
            );

            const client = new Client({ ratelimitHandleMode: "throw" });
            await client.fetch("neko", 1); // first request OK, stores ratelimit
            await expect(client.fetch("neko", 1)).rejects.toThrow(/ratelimited/i);
        });
    });

    describe("fetchFile()", () => {
        it("returns the binary data", async () => {
            fetchMock
                .mockResolvedValueOnce(
                    mockResponse({
                        results: [
                            {
                                url: "https://nekos.best/api/v2/neko/dcda2fb2-e66f-4beb-96ee-471c78e4e67e.png",
                                artist_name: "x",
                            },
                        ],
                    }),
                )
                .mockResolvedValueOnce(
                    new Response(new Uint8Array([1, 2, 3, 4])),
                );

            const client = new Client();
            const file = await client.fetchFile("neko");

            expect(file.data).toBeInstanceOf(Uint8Array);
            expect(file.data.length).toBe(4);
            expect(file.url).toBe(
                "https://nekos.best/api/v2/neko/dcda2fb2-e66f-4beb-96ee-471c78e4e67e.png",
            );
        });
    });
});

describe("fetchRandom (helper)", () => {
    it("instantiates a throwaway Client", async () => {
        fetchMock.mockResolvedValueOnce(
            mockResponse({
                results: [
                    { url: "https://nekos.best/api/v2/neko/test.png" },
                ],
            }),
        );

        try {
            const result = await fetchRandom("neko");
            console.log("fetch calls:", fetchMock.mock.calls);
            console.log("result:", result);
            expect(result.results).toHaveLength(1);
            expect(fetchMock).toHaveBeenCalledOnce();
        } catch (e) {
            console.error("FULL ERROR:", e);
            if (e instanceof Error) {
                console.error("STACK:", e.stack);
                console.error("CAUSE:", (e as any).cause);
            }
            throw e;
        }
    });
});

describe("search()", () => {
    it("builds correct URL with query, category, type and amount (image category)", async () => {
        fetchMock.mockResolvedValueOnce(
            mockResponse({ results: [] }),
        );

        const client = new Client();
        await client.search("cat", "neko", 3);

        expect(fetchMock).toHaveBeenCalledOnce();
        const url = fetchMock.mock.calls[0][0] as string;
        expect(url).toContain("search?");
        expect(url).toContain("query=cat");
        expect(url).toContain("category=neko");
        expect(url).toContain("type=1");
        expect(url).toContain("amount=3");
    });

    it("uses type=2 for non-image categories (e.g. gif)", async () => {
        fetchMock.mockResolvedValueOnce(
            mockResponse({ results: [] }),
        );

        const client = new Client();
        await client.search("hello", "hug", 1);

        const url = fetchMock.mock.calls[0][0] as string;
        expect(url).toContain("type=2");
        expect(url).toContain("category=hug");
    });

    it("picks a random category when null is passed", async () => {
        fetchMock.mockResolvedValueOnce(
            mockResponse({ results: [] }),
        );

        const client = new Client();
        await client.search("anything", null, 1);

        expect(fetchMock).toHaveBeenCalledOnce();
        const url = fetchMock.mock.calls[0][0] as string;
        expect(url).toMatch(/category=[a-z_]+/i);
    });

    it("throws on invalid category", async () => {
        const client = new Client();
        await expect(
            client.search("q", "invalid" as never, 1),
        ).rejects.toThrow(TypeError);
    });

    it("throws when amount is not a safe integer", async () => {
        const client = new Client();
        await expect(
            client.search("q", "neko", 1.5),
        ).rejects.toThrow(TypeError);
    });
});

