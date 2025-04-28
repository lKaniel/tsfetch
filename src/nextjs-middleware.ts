import type { ApiMiddleware, RequestOptions } from "./api.js";

/**
 * Next.js fetch options
 */
export type NextFetchOptions = {
    /** Revalidation time in seconds or false for no revalidation */
    revalidate?: number | false;
    /** Cache tags for on-demand revalidation */
    tags?: string[];
    /** Cache strategy */
    cache?: "force-cache" | "no-store";
};

/**
 * Extended request options for Next.js
 */
export type NextRequestOptions = RequestOptions & {
    next?: NextFetchOptions;
};

/**
 * Hash function for generating cache keys
 * @param str - String to hash
 * @param seed - Optional seed value
 * @returns Hash value as number
 */
const cyrb53 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * Next.js middleware that adds per-user caching support
 * Creates unique cache keys based on user token to prevent cache collisions
 * @param options - Request options
 * @returns Modified request options with Next.js cache configuration
 */
export const nextJsPerUserCachingMiddleware: ApiMiddleware = (options) => {
    // Cast options to access Next.js specific properties
    const nextOptions = options as NextRequestOptions;
    const { headers = {}, next } = nextOptions;

    // Create a unique cache key based on the URL and auth token
    const url = nextOptions.url || "";
    const token = (headers["Authorization"] || "") as string;
    const cacheKey = "" + cyrb53(token ? `${url}-${token}` : url);

    // Configure Next.js fetch options
    const nextConfig = {
        next: {
            revalidate: next?.revalidate ?? 10,
            tags: next?.tags ? [...next.tags, cacheKey] : [cacheKey],
            cache: next?.cache || "no-store",
        },
    };

    // Merge configurations
    return {
        ...nextOptions,
        ...nextConfig,
    };
};
