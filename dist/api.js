/**
 * Serializes a query parameter key-value pair
 * @param key - The parameter key
 * @param value - The parameter value
 * @returns Tuple containing the key and serialized value
 */
const serializeQueryParam = (key, value) => {
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
const buildUrl = (path, params = [], query = {}) => {
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
            }
            else {
                if (Array.isArray(value)) {
                    for (const item of value) {
                        const [paramKey, paramValue] = serializeQueryParam(key, item);
                        searchParams.append(`${paramKey}[]`, paramValue);
                    }
                }
                else {
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
const customFetch = async (path, options = {}) => {
    const { params = [], query = {}, body, headers = {}, expectResponse = true, ...fetchOptions } = options;
    const url = buildUrl(path, params, query);
    const defaultHeaders = {
        "Content-Type": "application/json",
    };
    const requestOptions = {
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
            return null; // Return void for no-response requests
        }
        if (!response.ok) {
            const errorResponse = (await response.json());
            throw new Error(errorResponse.message
                ? errorResponse.message
                : `HTTP error! status: ${response.status}`);
        }
        // Return null for 204 No Content
        if (response.status === 204) {
            return null;
        }
        // Check if the response should be returned as a blob
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/octet-stream") ||
            contentType?.includes("application/pdf") ||
            contentType?.includes("image/")) {
            return response.blob();
        }
        // For JSON responses
        if (contentType?.includes("application/json")) {
            const jsonData = await response.json();
            return jsonData; // Return the actual data, not the Response object
        }
        // For text responses
        if (contentType?.includes("text/")) {
            return response.text();
        }
        // Default to JSON if content-type is not specified
        return response.json();
    }
    catch (error) {
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
    get: ({ path, params, query = {}, options = {}, expectResponse = true, }) => {
        return customFetch(path, {
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
    post: ({ path, params, body, query = {}, options = {}, expectResponse = true, }) => {
        return customFetch(path, {
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
    put: ({ path, params, body, query = {}, options = {}, expectResponse = true, }) => {
        return customFetch(path, {
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
    patch: ({ path, params, body, query = {}, options = {}, expectResponse = true, }) => {
        return customFetch(path, {
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
    delete: ({ path, params, body, query = {}, options = {}, expectResponse = true, }) => {
        return customFetch(path, {
            method: "DELETE",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    },
    /**
     * Methods for sending requests without expecting a response (fire-and-forget)
     */
    sendOnly: {
        /**
         * Sends a POST request without expecting a response
         * @param path - API endpoint path
         * @param params - Path parameters to append to the URL
         * @param body - Request body data
         * @param query - Query parameters
         * @param options - Additional request options
         * @returns Promise that resolves when the request completes
         */
        post: ({ path, params, body, query = {}, options = {}, }) => {
            return customFetch(path, {
                method: "POST",
                params,
                query,
                body,
                expectResponse: false,
                ...options,
            });
        },
        /**
         * Sends a PUT request without expecting a response
         * @param path - API endpoint path
         * @param params - Path parameters to append to the URL
         * @param body - Request body data
         * @param query - Query parameters
         * @param options - Additional request options
         * @returns Promise that resolves when the request completes
         */
        put: ({ path, params, body, query = {}, options = {}, }) => {
            return customFetch(path, {
                method: "PUT",
                params,
                query,
                body,
                expectResponse: false,
                ...options,
            });
        },
        /**
         * Sends a PATCH request without expecting a response
         * @param path - API endpoint path
         * @param params - Path parameters to append to the URL
         * @param body - Request body data
         * @param query - Query parameters
         * @param options - Additional request options
         * @returns Promise that resolves when the request completes
         */
        patch: ({ path, params, body, query = {}, options = {}, }) => {
            return customFetch(path, {
                method: "PATCH",
                params,
                query,
                body,
                expectResponse: false,
                ...options,
            });
        },
        /**
         * Sends a DELETE request without expecting a response
         * @param path - API endpoint path
         * @param params - Path parameters to append to the URL
         * @param body - Request body data
         * @param query - Query parameters
         * @param options - Additional request options
         * @returns Promise that resolves when the request completes
         */
        delete: ({ path, params, body, query = {}, options = {}, }) => {
            return customFetch(path, {
                method: "DELETE",
                params,
                query,
                body,
                expectResponse: false,
                ...options,
            });
        },
    },
    /**
     * Downloads a file from the given URL
     * @param url - URL of the file to download
     * @param filename - Name to save the file as
     * @param options - Additional request options
     * @returns Promise that resolves when the download completes
     */
    downloadFile: async ({ url, filename, options = {}, }) => {
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
};
export { api };
//# sourceMappingURL=api.js.map