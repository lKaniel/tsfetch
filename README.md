# TS rest api

A flexible and powerful HTTP client built with TypeScript that provides advanced features for making API requests with
middleware support.

## Features

- 🌐 **Full TypeScript Support**: Strongly typed API for enhanced developer experience
- 🔄 **Middleware Architecture**: Easily extend and customize request processing
- 🔌 **URL Composition**: Simple path and query parameter handling
- 📦 **Response Formatting**: Automatic handling of different response types (JSON, Blob, Text)
- 🔒 **Authentication**: Built-in token-based authentication support
- 🧩 **Next.js Integration**: Ready-to-use middleware for Next.js applications
- 📱 **Browser Utilities**: Includes browser-specific features like file downloads

## Installation

```bash
npm install @lkaniel/fetch
# or
yarn add @lkaniel/fetch
# or
pnpm add @lkaniel/fetch
```

## Basic Usage

```typescript
import {ApiClient} from '@lkaniel/fetch';

// Create a custom client instance with base URL and optional token
const myApi = new ApiClient('https://api.example.com', 'initial-token');

// Later update token if needed
myApi.setToken('updated-token');

// Make requests
const response = await myApi.post<CreateUserResponse>({
    path: 'users',
    body: {name: 'John Doe', email: 'john@example.com'}
});
```

## Middleware Support

TSFetch allows you to extend functionality through middleware:

```typescript
import {ApiClient, ApiMiddleware} from '@lkaniel/fetch';

// Create a custom middleware
const loggingMiddleware: ApiMiddleware = (options) => {
    console.log('Request:', options);
    return options;
};

// Create a client and add middleware
const api = new ApiClient('https://api.example.com');
api.use(loggingMiddleware);

// Chain middleware
api.use((options) => {
    // Add custom headers
    return {
        ...options,
        headers: {
            ...options.headers,
            'X-Custom-Header': 'custom-value'
        }
    };
});
```

## Next.js Integration

TSFetch includes a middleware specifically for Next.js applications:

```typescript
import {ApiClient, nextFetchMiddleware} from '@lkaniel/fetch';

// Create a client with Next.js support
const api = new ApiClient('https://api.example.com');
api.use(nextFetchMiddleware);

// Use in your Next.js components or API routes
```

## API Methods

TSFetch supports all standard HTTP methods:

```typescript
// GET request
const data = await api.get<ResponseType>({
    path: 'resource',
    params: ['param1', 'param2'],  // Will be appended as /resource/param1/param2
    query: {sort: 'name', filter: 'active'}  // Will be added as ?sort=name&filter=active
});

// POST request with body
const result = await api.post<ResponseType>({
    path: 'resource',
    body: {name: 'New Item'}
});

// Other methods
await api.put({path: 'resource/123', body: {name: 'Updated Item'}});
await api.patch({path: 'resource/123', body: {status: 'active'}});
await api.delete({path: 'resource/123'});
```

## Browser Utilities

TSFetch includes utilities for browser-specific operations:

```typescript
// Download a file
await api.browserOnly.downloadFile({
    url: 'https://example.com/files/document.pdf',
    filename: 'document.pdf'
});
```

## Advanced Usage

### Custom Request Options

```typescript
const response = await api.get({
    path: 'resources',
    options: {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
            'Accept-Language': 'en-US'
        }
    }
});
```

### Working with FormData

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', 'My Document');

const result = await api.post({
    path: 'upload',
    body: formData,
    options: {
        headers: {
            // Content-Type is automatically set by the browser for FormData
        }
    }
});
```

### Handling Errors

```typescript
try {
    const data = await api.get({path: 'resources'});
    // Process successful response
} catch (error) {
    console.error('API request failed:', error);
    // Handle error appropriately
}
```

## License

ISC

## Author

Vitalii Shevchuk
