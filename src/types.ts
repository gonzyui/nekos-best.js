import { IMAGE_CATEGORIES, GIF_CATEGORIES } from "./constants";

/**
 * Represents a value that can be T, undefined, or null.
 */
export type Nullable<T> = T | undefined | null;

/**
 * Data representing the current rate limit status.
 */
export interface RatelimitData {
    /** The number of requests remaining in the current window. */
    remaining: number;
    /** The timestamp (in ms) when the rate limit window resets. */
    resetsIn: number;
}

/**
 * All available categories for images and GIFs.
 */
export type NbCategories =
    | (typeof GIF_CATEGORIES)[number]
    | (typeof IMAGE_CATEGORIES)[number];

/** 
 * Metadata for API endpoints.
 * @deprecated This will be removed in the next major version 
 */
export type NbEndpointMetadata = Record<
    string,
    {
        /** The file format (e.g., "png", "gif"). */
        format: string;
        /** Minimum expected amount (if applicable). */
        min: string;
        /** Maximum expected amount (if applicable). */
        max: string;
    }
>;

/**
 * Individual response object from the API.
 */
export type NbIndividualResponse = {
    /** The name of the anime (if available). */
    anime_name?: string;
    /** The URL to the artist's profile (if available). */
    artist_href?: string;
    /** The name of the artist (if available). */
    artist_name?: string;
    /** Dimensions of the asset. */
    dimensions: {
        /** Width in pixels. */
        width: number;
        /** Height in pixels. */
        height: number;
    };
    /** The source URL of the asset (if available). */
    source_url?: string;
    /** The direct URL to the asset file. */
    url: string;
};

/**
 * The standard response object containing multiple results.
 */
export type NbResponse = { results: NbIndividualResponse[] };

/**
 * Response object for a file fetch, including the binary data.
 */
export type NbBufferResponse = NbIndividualResponse & { 
    /** The binary data of the file. */
    data: Uint8Array 
};

/**
 * The mode for handling rate limits.
 * - "sleep": Wait until the rate limit resets.
 * - "throw": Throw an error immediately.
 */
export type RatelimitHandleMode = "sleep" | "throw";

/**
 * Options for configuring the Client.
 */
export interface ClientOptions {
    /** How to handle rate limits. Defaults to "sleep". */
    ratelimitHandleMode: RatelimitHandleMode;
}
