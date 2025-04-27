/**
 * API Client for making HTTP requests
 */
class ApiClient {
    /**
     * Methods for sending requests only from browser
     */
    browserOnly = {
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
    /** Base URL for API calls */
    baseUrl;
    /** Authentication token */
    token = null;
    /** Array of middleware functions to process requests */
    middlewares = [];
    /**
     * Creates a new API client instance
     * @param baseUrl - Base URL for API calls
     * @param token - Optional authentication token
     */
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
        this.token = token || null;
    }
    /**
     * Updates the authentication token
     * @param token - New authentication token
     */
    setToken(token) {
        this.token = token;
    }
    /**
     * Updates the base URL
     * @param baseUrl - New base URL
     */
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    }
    /**
     * Adds a middleware function to the client
     * @param middleware - Middleware function to add
     * @returns The client instance for chaining
     */
    use(middleware) {
        this.middlewares.push(middleware);
        return this;
    }
    /**
     * Performs a GET request
     * @param path - API endpoint path
     * @param params - Path parameters to append to the URL
     * @param query - Query parameters
     * @param options - Additional request options
     * @param expectResponse - Whether to expect and process a response
     * @returns Promise resolving to the response data
     */
    get({ path, params, query = {}, options = {}, expectResponse = true, }) {
        return this.customFetch(path, {
            method: "GET",
            params,
            query,
            expectResponse,
            ...options,
        });
    }
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
    post({ path, params, body, query = {}, options = {}, expectResponse = true, }) {
        return this.customFetch(path, {
            method: "POST",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    }
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
    put({ path, params, body, query = {}, options = {}, expectResponse = true, }) {
        return this.customFetch(path, {
            method: "PUT",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    }
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
    patch({ path, params, body, query = {}, options = {}, expectResponse = true, }) {
        return this.customFetch(path, {
            method: "PATCH",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    }
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
    delete({ path, params, body, query = {}, options = {}, expectResponse = true, }) {
        return this.customFetch(path, {
            method: "DELETE",
            params,
            query,
            body,
            expectResponse,
            ...options,
        });
    }
    /**
     * Serializes a query parameter key-value pair
     * @param key - The parameter key
     * @param value - The parameter value
     * @returns Tuple containing the key and serialized value
     */
    serializeQueryParam(key, value) {
        if (value && typeof value === "object") {
            return [key, JSON.stringify(value)];
        }
        return [key, String(value)];
    }
    /**
     * Builds a complete URL with path parameters and query string
     * @param path - API endpoint path
     * @param params - Path parameters to append to the URL
     * @param query - Query parameters to add as querystring
     * @returns Complete URL string
     */
    buildUrl(path, params = [], query = {}) {
        // Make sure path doesn't start with a slash when we combine with baseUrl
        const cleanPath = path.startsWith("/") ? path.substring(1) : path;
        let fullPath = `${this.baseUrl}${cleanPath}`;
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
                            const [paramKey, paramValue] = this.serializeQueryParam(key, item);
                            searchParams.append(`${paramKey}[]`, paramValue);
                        }
                    }
                    else {
                        const [paramKey, paramValue] = this.serializeQueryParam(key, value);
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
    }
    /**
     * Apply all middleware functions to the request options
     * @param options - The original request options
     * @returns The modified request options after all middleware processing
     */
    async applyMiddlewares(options) {
        let processedOptions = { ...options };
        for (const middleware of this.middlewares) {
            processedOptions = await middleware(processedOptions);
        }
        return processedOptions;
    }
    /**
     * Performs an HTTP request with enhanced handling of different response types
     * @param path - API endpoint path
     * @param options - Request options including params, query, body, headers, etc.
     * @returns Promise resolving to the response data
     */
    async customFetch(path, options = {}) {
        const { params = [], query = {}, body, headers = {}, expectResponse = true, url: customUrl, ...fetchOptions } = options;
        // Apply token and content-type headers
        const defaultHeaders = {
            "Content-Type": "application/json",
        };
        // Add authorization header if token exists
        if (this.token) {
            defaultHeaders["Authorization"] = `Bearer ${this.token}`;
        }
        // Initial request options
        let requestOptions = {
            ...fetchOptions,
            headers: {
                ...defaultHeaders,
                ...headers,
            },
            params,
            query,
            expectResponse,
        };
        if (body) {
            requestOptions.body = body;
        }
        // Apply middlewares
        requestOptions = await this.applyMiddlewares(requestOptions);
        // Extract processed options after middleware
        const { params: processedParams = [], query: processedQuery = {}, body: processedBody, headers: processedHeaders = {}, expectResponse: processedExpectResponse = true, url: processedCustomUrl, ...processedFetchOptions } = requestOptions;
        // Determine the URL (either custom URL from options/middleware or built URL)
        const url = processedCustomUrl || customUrl || this.buildUrl(path, processedParams, processedQuery);
        // Prepare final fetch options
        const finalRequestOptions = {
            ...processedFetchOptions,
            headers: processedHeaders,
        };
        // Process body if it hasn't been processed by middleware
        if (processedBody !== undefined) {
            finalRequestOptions.body =
                typeof processedBody === "string" || processedBody instanceof FormData
                    ? processedBody
                    : JSON.stringify(processedBody);
        }
        try {
            const response = await fetch(url, finalRequestOptions);
            // If we don't expect a response, just check for errors and return
            if (!processedExpectResponse) {
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
    }
}
/**
 * Next.js fetch middleware
 * Adapts requests to work with Next.js fetch API
 */
export const nextFetchMiddleware = (options) => {
    // Clone options to avoid modifying the original
    const nextOptions = { ...options };
    return nextOptions;
};
export { ApiClient };
//# sourceMappingURL=api.js.map