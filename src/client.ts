import {
    ClientOptions,
    NbBufferResponse,
    NbCategories,
    NbResponse,
    Nullable,
    RatelimitData,
} from "./types";
import {
    extractRatelimitData,
    fetchPath,
    handleRatelimit,
    pickRandomCategory,
    validateCategory,
} from "./utils";
import { IMAGE_CATEGORIES } from "./constants";

/**
 * A quick function to fetch a random file URL along with its metadata (if available).
 *
 * If you are going to call this function multiple times, it's better to initialize a new `Client` instead.
 *
 * @param category The category to fetch the file URL from. If omitted, it picks a random category.
 * @returns A promise that resolves to the API response.
 */
export async function fetchRandom(category?: NbCategories) {
    return new Client().fetch(category, 1);
}

/**
 * The main client to interact with the nekos.best API.
 */
export class Client {
    #ratelimitData: RatelimitData | null = null;
    #clientOptions: ClientOptions;

    /**
     * Initializes a new instance of the Client.
     * 
     * @param clientOptions Optional client configuration.
     */
    constructor(clientOptions?: Partial<ClientOptions>) {
        this.#clientOptions = {
            ratelimitHandleMode: "sleep",
            ...clientOptions,
        };
    }

    /**
     * Internal request handler that manages rate limits and parses the response.
     * 
     * @param path The relative path to fetch.
     * @returns The parsed JSON response.
     * @private
     */
    async #request<T>(path: string): Promise<T> {
        if (this.#ratelimitData != null) {
            await handleRatelimit(
                this.#clientOptions.ratelimitHandleMode,
                this.#ratelimitData,
            );
        }

        const response = await fetchPath(path);

        this.#ratelimitData = extractRatelimitData(response);

        return (await response.json()) as T;
    }

    /**
     * Fetch and download a random file with its metadata (if available).
     * For more advanced options, you should use the `Client.fetch()` method and
     * fetch the file by yourself.
     *
     * @param category The category to download from. If omitted, it picks a random category.
     * @returns A promise that resolves to the file metadata and buffer data.
     */
    async fetchFile(
        category: Nullable<NbCategories> = null,
    ): Promise<NbBufferResponse> {
        const fileDetails = (await this.fetch(category, 1)).results[0];
        const file = await fetchPath(undefined, fileDetails.url);

        return {
            ...fileDetails,
            data: new Uint8Array(await file.arrayBuffer()),
        };
    }

    /**
     * Fetch multiple assets with their metadata (if available).
     *
     * @param category Category of assets. Set to `null` to pick a random category.
     * @param amount The amount of assets to fetch.
     * @returns A promise that resolves to the API response.
     * @throws {TypeError} If the amount is not a safe integer.
     */
    async fetch(
        category: Nullable<NbCategories> = null,
        amount = 1,
    ): Promise<NbResponse> {
        if (!category) {
            category = pickRandomCategory();
        } else {
            validateCategory(category);
        }

        if (!Number.isSafeInteger(amount)) {
            throw new TypeError(
                `Expected a safe integer for amount. Got "${amount}".`,
            );
        }

        return this.#request<NbResponse>(`${category}?amount=${amount}`);
    }

    /**
     * Search for assets using metadata like artist names or source titles.
     *
     * @param query Search query.
     * @param category Category of assets. Set to `null` to search in all categories.
     * @param amount The amount of assets to fetch.
     * @returns A promise that resolves to the API response.
     * @throws {TypeError} If the amount is not a safe integer.
     */
    async search(
        query: string,
        category: Nullable<NbCategories> = null,
        amount = 1,
    ): Promise<NbResponse> {
        if (!category) {
            category = pickRandomCategory();
        } else {
            validateCategory(category);
        }

        if (!Number.isSafeInteger(amount)) {
            throw new TypeError(
                `Expected a safe integer for amount. Got "${amount}".`,
            );
        }

        const type: 1 | 2 = (IMAGE_CATEGORIES as readonly string[]).includes(
            category,
        )
            ? 1
            : 2;

        const params = new URLSearchParams({
            query,
            type: String(type),
            category,
            amount: String(amount),
        });

        return this.#request<NbResponse>(`search?${params}`);
    }
}