/**
 * Extended request options for API calls
 */
type RequestOptions = RequestInit & {
    /** Path parameters to append to the URL */
    params?: string[];
    /** Query parameters for the request */
    query?: Record<string, any>;
    /** Request body data */
    body?: any;
    /** Whether to expect and process a response (defaults to true) */
    expectResponse?: boolean;
};

/**
 * Generic API response type
 */
type ApiResponse<T> = Promise<T>;

/**
 * Serializes a query parameter key-value pair
 * @param key - The parameter key
 * @param value - The parameter value
 * @returns Tuple containing the key and serialized value
 */
const serializeQueryParam = (key: string, value: any): [string, string] => {
    if (value && typeof value === "object") {
        return [key, JSON.stringify(value)];
    }

    return [key, String(value)];
};

/**
 * Builds a complete URL with path parameters and query string
 * @param path - Base URL path
 * @param params - Path parameters to append to the URL
 * @param query - Query parameters to add as querystring
 * @returns Complete URL string
 */
const buildUrl = (path: string, params: string[] = [], query: Record<string, any> = {}) => {
    let fullPath = path;

    // Append path parameters
    for (const param of params) {
        fullPath += `/${param}`;
    }

    // Build query string with proper handling of nested objects and arrays
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === "object" && !Array.isArray(value)) {
                // Handle nested objects
                Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                    if (nestedValue !== undefined && nestedValue !== null) {
                        searchParams.append(`${key}[${nestedKey}]`, String(nestedValue));
                    }
                });
            } else {
                if (Array.isArray(value)) {
                    for (const item of value) {
                        const [paramKey, paramValue] = serializeQueryParam(key, item);
                        searchParams.append(`${paramKey}[]`, paramValue);
                    }
                } else {
                    const [paramKey, paramValue] = serializeQueryParam(key, value);
                    searchParams.append(paramKey, paramValue);
                }
            }
        }
    });

    // Append query string if it exists
    const queryString = searchParams.toString();
    if (queryString) {
        fullPath += `?${queryString}`;
    }

    return fullPath;
};

/**
 * Performs an HTTP request with enhanced handling of different response types
 * @param path - API endpoint path
 * @param options - Request options including params, query, body, headers, etc.
 * @returns Promise resolving to the response data
 */
const customFetch = async <T>(path: string, options: RequestOptions = {}): ApiResponse<T> => {
    const {
        params = [],
        query = {},
        body,
        headers = {},
        expectResponse = true,
        ...fetchOptions
    } = options;

    const url = buildUrl(path, params, query);

    const defaultHeaders: HeadersInit = {
        "Content-Type": "application/json",
    };

    const requestOptions: RequestInit = {
        ...fetchOptions,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
    };

    if (body) {
        requestOptions.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, requestOptions);

        // If we don't expect a response, just check for errors and return
        if (!expectResponse) {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return null as T; // Return void for no-response requests
        }

        if (!response.ok) {
            const errorResponse: Record<string, string> = (await response.json()) as Record<
                string,
                string
            >;
            throw new Error(
                errorResponse.message
                    ? errorResponse.message
                    : `HTTP error! status: ${response.status}`
            );
        }

        // Return null for 204 No Content
        if (response.status === 204) {
            return null as T;
        }

        // Check if the response should be returned as a blob
        const contentType = response.headers.get("content-type");
        if (
            contentType?.includes("application/octet-stream") ||
            contentType?.includes("application/pdf") ||
            contentType?.includes("image/")
        ) {
            return response.blob() as Promise<T>;
        }

        // For JSON responses
        if (contentType?.includes("application/json")) {
            const jsonData = await response.json();
            return jsonData as T; // Return the actual data, not the Response object
        }

        // For text responses
        if (contentType?.includes("text/")) {
            return response.text() as Promise<T>;
        }

        // Default to JSON if content-type is not specified
        return response.json() as Promise<T>;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
};

/**
 * Main API interface for making HTTP requests
 */
const api = {
    /**
     * Performs a GET request
     * @param path - API endpoint path
     * @param params - Path parameters to append to the URL
     * @param query - Query parameters
     * @param options - Additional request options
     * @param expectResponse - Whether to expect and process a response
     * @returns Promise resolving to the response data
     */
    get: <T>({
        path,
        params,
        query = {},
        options = {},
        expectResponse = true,
    }: {
        path: string;
        params?: string[];
        query?: Record<string, any>;
        options?: Omit<RequestOptions, "method" | "body" | "expectResponse">;
        expectResponse?: boolean;
    }): ApiResponse<T> => {
        return customFetch<T>(path, {
            method: "GET",
            params,
            query,
            expectResponse,
            ...options,
        });
    },

    /**
     * Performs a POST request
     * @param path - API endpoint path
     * @param params - Path parameters to append to the URL
     * @param body - Request body data
     * @param query - Query parameters
     * @param options - Additional request options
     * @param expectResponse - Whether to expect and process a response
     * @returns Promise resolving to the response data
     */
    post: <T>({
        path,
        params,
        body,
        query = {},
        options = {},
        expectResponse = true,
    }: {
        path: string;
        params?: string[];
        body?: any;
        query?: Record<string, any>;
        options?: Omit<RequestOptions, "method" | "expectResponse">;
        expectResponse?: boolean;
    }): ApiResponse<T> => {
        return customFetch<T>(path, {
            method: "POST",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    },

    /**
     * Performs a PUT request
     * @param path - API endpoint path
     * @param params - Path parameters to append to the URL
     * @param body - Request body data
     * @param query - Query parameters
     * @param options - Additional request options
     * @param expectResponse - Whether to expect and process a response
     * @returns Promise resolving to the response data
     */
    put: <T>({
        path,
        params,
        body,
        query = {},
        options = {},
        expectResponse = true,
    }: {
        path: string;
        params?: string[];
        body?: any;
        query?: Record<string, any>;
        options?: Omit<RequestOptions, "method" | "expectResponse">;
        expectResponse?: boolean;
    }): ApiResponse<T> => {
        return customFetch<T>(path, {
            method: "PUT",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    },

    /**
     * Performs a PATCH request
     * @param path - API endpoint path
     * @param params - Path parameters to append to the URL
     * @param body - Request body data
     * @param query - Query parameters
     * @param options - Additional request options
     * @param expectResponse - Whether to expect and process a response
     * @returns Promise resolving to the response data
     */
    patch: <T>({
        path,
        params,
        body,
        query = {},
        options = {},
        expectResponse = true,
    }: {
        path: string;
        params?: string[];
        body?: any;
        query?: Record<string, any>;
        options?: Omit<RequestOptions, "method" | "expectResponse">;
        expectResponse?: boolean;
    }): ApiResponse<T> => {
        return customFetch<T>(path, {
            method: "PATCH",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    },

    /**
     * Performs a DELETE request
     * @param path - API endpoint path
     * @param params - Path parameters to append to the URL
     * @param body - Request body data
     * @param query - Query parameters
     * @param options - Additional request options
     * @param expectResponse - Whether to expect and process a response
     * @returns Promise resolving to the response data
     */
    delete: <T>({
        path,
        params,
        body,
        query = {},
        options = {},
        expectResponse = true,
    }: {
        path: string;
        params?: string[];
        body?: any;
        query?: Record<string, any>;
        options?: Omit<RequestOptions, "method" | "expectResponse">;
        expectResponse?: boolean;
    }): ApiResponse<T> => {
        return customFetch<T>(path, {
            method: "DELETE",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    },

    /**
     * Methods for sending requests only from browser
     */
    browserOnly: {
        /**
         * Downloads a file from the given URL
         * @param url - URL of the file to download
         * @param filename - Name to save the file as
         * @param options - Additional request options
         * @returns Promise that resolves when the download completes
         */
        downloadFile: async ({
            url,
            filename,
            options = {},
        }: {
            url: string;
            filename: string;
            options?: Omit<RequestOptions, "method">;
        }): Promise<void> => {
            const response = await fetch(url, options);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        },
    },
};

export { api };
