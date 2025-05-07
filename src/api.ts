/**
 * Next.js fetch options
 */
type NextFetchOptions = {
    /** Revalidation time in seconds or false for no revalidation */
    revalidate?: number | false;
    /** Cache tags for on-demand revalidation */
    tags?: string[];
    /** Cache strategy */
    cache?: "force-cache" | "no-store";
};

/**
 * Extended request options for API calls
 */
export type RequestOptions = RequestInit & {
    /** Path parameters to append to the URL */
    params?: string[];
    /** Query parameters for the request */
    query?: Record<string, any>;
    /** Request body data */
    body?: any;
    /** Whether to expect and process a response (defaults to true) */
    expectResponse?: boolean;
    /** Full URL - if provided, it will override the path-based URL construction */
    url?: string;
    /** Next.js specific fetch options */
    next?: NextFetchOptions;
};

/**
 * Generic API response type
 */
type ApiResponse<T> = Promise<T>;

/**
 * Middleware function type for request processing
 * Takes the current request options and returns modified options
 */
export type ApiMiddleware = (options: RequestOptions) => RequestOptions | Promise<RequestOptions>;

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
    };

    /** Base URL for API calls */
    private baseUrl: string;
    /** Authentication token */
    private token: string | null = null;
    /** Array of middleware functions to process requests */
    private middlewares: ApiMiddleware[] = [];

    /**
     * Creates a new API client instance
     * @param baseUrl - Base URL for API calls
     * @param token - Optional authentication token
     */
    constructor(baseUrl: string, token?: string) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
        this.token = token || null;
    }

    /**
     * Updates the authentication token
     * @param token - New authentication token
     */
    setToken(token: string): void {
        this.token = token;
    }

    /**
     * Updates the base URL
     * @param baseUrl - New base URL
     */
    setBaseUrl(baseUrl: string): void {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    }

    /**
     * Adds a middleware function to the client
     * @param middleware - Middleware function to add
     * @returns The client instance for chaining
     */
    use(middleware: ApiMiddleware): ApiClient {
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
    get<T>({
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
    }): ApiResponse<T> {
        return this.customFetch<T>(path, {
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
    post<T>({
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
    }): ApiResponse<T> {
        return this.customFetch<T>(path, {
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
    put<T>({
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
    }): ApiResponse<T> {
        return this.customFetch<T>(path, {
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
    patch<T>({
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
    }): ApiResponse<T> {
        return this.customFetch<T>(path, {
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
    delete<T>({
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
    }): ApiResponse<T> {
        return this.customFetch<T>(path, {
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
    private serializeQueryParam(key: string, value: any): [string, string] {
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
    private buildUrl(path: string, params: string[] = [], query: Record<string, any> = {}) {
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
                } else {
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            const [paramKey, paramValue] = this.serializeQueryParam(key, item);
                            searchParams.append(`${paramKey}[]`, paramValue);
                        }
                    } else {
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
    private async applyMiddlewares(options: RequestOptions): Promise<RequestOptions> {
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
    private async customFetch<T>(path: string, options: RequestOptions = {}): ApiResponse<T> {
        const {
            params = [],
            query = {},
            body,
            headers = {},
            expectResponse = true,
            url: customUrl,
            ...fetchOptions
        } = options;

        // Apply token and content-type headers
        const defaultHeaders: HeadersInit = {
            "Content-Type": "application/json",
        };

        // Add authorization header if token exists
        if (this.token) {
            defaultHeaders["Authorization"] = `${this.token}`;
        }

        // Initial request options
        let requestOptions: RequestOptions = {
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
        const {
            params: processedParams = [],
            query: processedQuery = {},
            body: processedBody,
            headers: processedHeaders = {},
            expectResponse: processedExpectResponse = true,
            url: processedCustomUrl,
            ...processedFetchOptions
        } = requestOptions;

        // Determine the URL (either custom URL from options/middleware or built URL)
        const url =
            processedCustomUrl || customUrl || this.buildUrl(path, processedParams, processedQuery);

        // Prepare final fetch options
        const finalRequestOptions: RequestInit = {
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
                return null as T; // Return void for no-response requests
            }

            if (!response.ok) {
                try {
                    // Try to parse the error response as JSON
                    const text = await response.text();
                    if (text && text.trim()) {
                        const errorResponse = JSON.parse(text) as Record<string, string>;
                        throw new Error(
                            errorResponse.message
                                ? errorResponse.message
                                : `HTTP error! status: ${response.status}`
                        );
                    } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                } catch (jsonError) {
                    // If JSON parsing fails, just use the HTTP status
                    if (jsonError instanceof SyntaxError) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    throw jsonError;
                }
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
                const text = await response.text();
                // Handle empty responses that would cause JSON.parse to fail
                if (!text.trim()) {
                    return null as T;
                }
                const jsonData = JSON.parse(text);
                return jsonData as T; // Return the actual data, not the Response object
            }

            // For text responses
            if (contentType?.includes("text/")) {
                return response.text() as Promise<T>;
            }

            // Default to JSON if content-type is not specified
            try {
                const text = await response.text();
                // Handle empty responses that would cause JSON.parse to fail
                if (!text.trim()) {
                    return null as T;
                }
                return JSON.parse(text) as T;
            } catch (e) {
                console.warn("Failed to parse response as JSON:", e);
                return null as T;
            }
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    }
}

export { ApiClient };
