import { IMAGE_CATEGORIES, GIF_CATEGORIES, BASE_URL, USER_AGENT } from "./constants";
import { NbCategories, Nullable, RatelimitData, RatelimitHandleMode } from "./types";

/**
 * Fetches a resource from the API or a full URL.
 * 
 * @param path The relative path to fetch from the API.
 * @param fullUrl Optional full URL to fetch from instead of the API.
 * @returns The fetch Response object.
 * @throws {Error} If the response is not OK.
 */
export async function fetchPath(path?: string, fullUrl: Nullable<string> = null) {
    const url = fullUrl || `${BASE_URL}/${path}`;
    const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
    });

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `Failed to fetch url "${url}" (status code ${response.status}): ${text}`,
        );
    }

    return response;
}

/**
 * Fetches a JSON resource from the API.
 * 
 * @param path The relative path to fetch.
 * @returns The parsed JSON response.
 */
export async function fetchJson<T>(path: string): Promise<T> {
    return (await (await fetchPath(path)).json()) as T;
}

/**
 * Validates if a category is valid according to the predefined categories.
 * 
 * @param category The category name to validate.
 * @throws {TypeError} If the category is invalid.
 */
export function validateCategory(category: string) {
    if (
        !(
            (IMAGE_CATEGORIES as readonly string[]).includes(category) ||
            (GIF_CATEGORIES as readonly string[]).includes(category)
        )
    ) {
        throw new TypeError(
            `"${category}" is not a valid category. Available categories: ${IMAGE_CATEGORIES.join(", ")}, ${GIF_CATEGORIES.join(", ")}`,
        );
    }
}

/**
 * Picks a random category from all available categories.
 * 
 * @returns A random category name.
 */
export function pickRandomCategory(): NbCategories {
    const idx =
        (Math.random() * (GIF_CATEGORIES.length + IMAGE_CATEGORIES.length)) | 0;

    if (idx < IMAGE_CATEGORIES.length) {
        return IMAGE_CATEGORIES[idx];
    }

    return GIF_CATEGORIES[idx - IMAGE_CATEGORIES.length];
}

/**
 * Handles rate limiting by either sleeping or throwing an error.
 * 
 * @param mode The rate limit handling mode ("sleep" or "throw").
 * @param data The current rate limit data.
 */
export async function handleRatelimit(
    mode: RatelimitHandleMode,
    data: RatelimitData,
) {
    const now = Date.now();

    if (data.resetsIn <= now) {
        return;
    }

    if (data.remaining <= 0) {
        const waitMs = data.resetsIn - now;
        switch (mode) {
            case "sleep":
                await new Promise((resolve) => setTimeout(resolve, waitMs));
                return;
            case "throw":
                throw new Error(
                    `You are being ratelimited. Resets in ${waitMs}ms.`,
                );
        }
    }
}

/**
 * Extracts rate limit data from the response headers.
 * 
 * @param response The fetch Response object.
 * @returns The extracted rate limit data or null if headers are missing or invalid.
 */
export function extractRatelimitData(response: Response): RatelimitData | null {
    const remaining = response.headers.get("x-rate-limit-remaining");
    const reset = response.headers.get("x-rate-limit-reset");

    if (remaining == null || reset == null) {
        return null;
    }

    const remainingNum = Number(remaining);
    const resetMs = Date.parse(reset);

    if (!Number.isFinite(remainingNum) || !Number.isFinite(resetMs)) {
        return null;
    }

    return {
        remaining: remainingNum,
        resetsIn: resetMs,
    };
}
