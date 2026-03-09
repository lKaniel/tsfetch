/**
 * Types of API errors that can occur
 */
export type ApiErrorType = 'HTTP_ERROR' | 'NETWORK_ERROR' | 'PARSE_ERROR';

/**
 * Request context information for error tracking
 */
export interface ApiErrorRequestContext {
    url: string;
    method: string;
}

/**
 * Options for constructing an ApiError
 */
export interface ApiErrorOptions {
    message: string;
    type: ApiErrorType;
    status?: number;
    statusText?: string;
    code?: string | number;
    responseText?: string;
    responseData?: unknown;
    request: ApiErrorRequestContext;
    cause?: Error;
}

/**
 * Custom error class for API errors with rich context
 */
export class ApiError extends Error {
    readonly type: ApiErrorType;
    readonly status?: number;
    readonly statusText?: string;
    readonly code?: string | number;
    readonly responseText?: string;
    readonly responseData?: unknown;
    readonly request: ApiErrorRequestContext;
    override readonly cause?: Error;

    constructor(options: ApiErrorOptions) {
        super(options.message);
        this.name = 'ApiError';
        this.type = options.type;
        this.status = options.status;
        this.statusText = options.statusText;
        this.code = options.code;
        this.responseText = options.responseText;
        this.responseData = options.responseData;
        this.request = options.request;
        this.cause = options.cause;

        // Maintains proper stack trace for where error was thrown (only in V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }

    /**
     * Type guard to check if an error is an ApiError
     */
    static isApiError(error: unknown): error is ApiError {
        return error instanceof ApiError;
    }

    /**
     * Check if the error has a specific HTTP status code
     */
    hasStatus(status: number): boolean {
        return this.status === status;
    }

    /**
     * Check if this is a client error (4xx status code)
     */
    isClientError(): boolean {
        return this.status !== undefined && this.status >= 400 && this.status < 500;
    }

    /**
     * Check if this is a server error (5xx status code)
     */
    isServerError(): boolean {
        return this.status !== undefined && this.status >= 500 && this.status < 600;
    }

    /**
     * Check if this is a network error
     */
    isNetworkError(): boolean {
        return this.type === 'NETWORK_ERROR';
    }

    /**
     * Serialize the error to a JSON-compatible object
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            status: this.status,
            statusText: this.statusText,
            code: this.code,
            responseText: this.responseText,
            responseData: this.responseData,
            request: this.request,
            cause: this.cause ? {
                name: this.cause.name,
                message: this.cause.message,
            } : undefined,
        };
    }
}
