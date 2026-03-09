# Plan: Add Custom Error Handling with Error Codes

## Summary
Add a custom `ApiError` class that preserves HTTP status codes, application error codes, response data, and request context for better error handling in try-catch blocks.

## Files to Modify

| File | Action |
|------|--------|
| `src/errors.ts` | CREATE - ApiError class and types |
| `src/api.ts` | MODIFY - Replace Error with ApiError (lines 449-529) |
| `src/index.ts` | MODIFY - Export ApiError and types |

---

## Step 1: Create `src/errors.ts`

Create a new file with:

```typescript
export type ApiErrorType = 'HTTP_ERROR' | 'NETWORK_ERROR' | 'PARSE_ERROR';

export interface ApiErrorRequestContext {
    url: string;
    method: string;
}

export class ApiError extends Error {
    readonly type: ApiErrorType;
    readonly status?: number;
    readonly statusText?: string;
    readonly code?: string | number;        // Application-specific error code
    readonly responseText?: string;         // Raw response body
    readonly responseData?: unknown;        // Parsed JSON response
    readonly request: ApiErrorRequestContext;
    readonly cause?: Error;

    constructor(options: { ... });

    static isApiError(error: unknown): error is ApiError;
    hasStatus(status: number): boolean;
    isClientError(): boolean;   // 4xx
    isServerError(): boolean;   // 5xx
    isNetworkError(): boolean;
    toJSON(): Record<string, unknown>;
}
```

---

## Step 2: Update `src/api.ts`

### 2a. Add import at top:
```typescript
import { ApiError } from './errors.js';
```

### 2b. Replace error handling (lines 453-481):

**Before (line 455):**
```typescript
throw new Error(`HTTP error! status: ${response.status}`);
```

**After:**
```typescript
throw new ApiError({
    message: `HTTP error! status: ${response.status}`,
    type: 'HTTP_ERROR',
    status: response.status,
    statusText: response.statusText,
    request: { url, method: finalRequestOptions.method || 'GET' },
});
```

**Before (lines 460-481):**
Complex try-catch that only extracts `message`

**After:**
- Parse response text
- Extract `message`, `code`, `error` fields from JSON (handles multiple formats)
- Preserve full `responseText` and `responseData`
- Throw ApiError with all context

### 2c. Update outer catch block (lines 526-529):

```typescript
} catch (error) {
    if (ApiError.isApiError(error)) {
        throw error;
    }
    throw new ApiError({
        message: error instanceof Error ? error.message : 'Network request failed',
        type: 'NETWORK_ERROR',
        request: { url, method: finalRequestOptions.method || 'GET' },
        cause: error instanceof Error ? error : undefined,
    });
}
```

---

## Step 3: Update `src/index.ts`

```typescript
export { ApiClient, type ApiMiddleware } from "./api.js";
export { nextJsPerUserCachingMiddleware } from "./nextjs-middleware.js";
export { ApiError, type ApiErrorType, type ApiErrorRequestContext } from "./errors.js";
```

---

## Usage Example

```typescript
import { ApiClient, ApiError } from 'ts-rest-api';

try {
    const data = await api.get({ path: '/users/123' });
} catch (error) {
    if (ApiError.isApiError(error)) {
        console.log('Status:', error.status);        // 404
        console.log('Code:', error.code);            // "USER_NOT_FOUND"
        console.log('Data:', error.responseData);    // { error: "...", code: "..." }

        if (error.hasStatus(404)) {
            // Handle not found
        } else if (error.isNetworkError()) {
            // Handle network issues
        }
    }
}
```

---

## Backward Compatibility

- `ApiError extends Error` - existing catch blocks still work
- `error.message` remains available as before
- No breaking changes for users who catch generic `Error`

---

## Verification

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Test error handling in `src/test.ts`:**
   - Update test file to use ApiError
   - Verify status codes, error codes, and response data are accessible

3. **Manual test with a failing request:**
   ```typescript
   try {
       await api.get({ path: '/nonexistent' });
   } catch (e) {
       if (ApiError.isApiError(e)) {
           console.log(e.status, e.code, e.responseData);
       }
   }
   ```
