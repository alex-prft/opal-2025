# Base API Handler Guide

## Overview

The Base API Handler provides a standardized way to create Next.js App Router API routes with consistent:
- Error handling & logging
- Request validation using Zod
- Rate limiting (in-memory for development)
- Response formatting
- Performance tracking
- CORS handling

## Features

✅ **Extends Existing Patterns**: Builds on your current correlation ID and logging systems
✅ **Zod Integration**: Uses your existing validation schemas
✅ **Backward Compatible**: Works alongside existing API routes
✅ **Development Friendly**: Verbose logging and debugging in dev mode
✅ **Production Ready**: Easy to upgrade with Redis rate limiting later

## Quick Start

### 1. Basic API Route

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiHandler, rateLimitConfigs } from '@/lib/api/base-api-handler';

// Define validation schema
const RequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

// Create handler with config
const handler = createApiHandler({
  endpoint: '/api/my-endpoint',
  validation: { body: RequestSchema },
  rateLimit: rateLimitConfigs.normal,
  cors: true
});

// Implement your endpoint
export async function POST(request: NextRequest) {
  return handler.handle(request, async (req, context, validated) => {
    const { body } = validated;

    // Your business logic here
    const result = await processUser(body.name, body.email);

    return { user: result, message: 'User created successfully' };
  });
}
```

### 2. Response Format

All responses follow this standardized format:

```typescript
// Success Response
{
  "success": true,
  "data": { /* your data */ },
  "message": "Optional message",
  "correlation_id": "api-1699876543210-abc123",
  "timestamp": "2024-11-12T15:30:00.000Z",
  "duration_ms": 150
}

// Error Response
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "correlation_id": "api-1699876543210-abc123",
  "timestamp": "2024-11-12T15:30:00.000Z",
  "duration_ms": 25,
  "data": { "details": [...] } // Only in development
}
```

## Configuration Options

### Handler Configuration

```typescript
interface ApiHandlerConfig {
  endpoint: string;              // For logging and metrics
  validation?: ValidationMiddleware;  // Zod schemas
  rateLimit?: RateLimitConfig;   // Rate limiting settings
  requireAuth?: boolean;         // Authentication required
  cors?: boolean;               // Enable CORS headers
  compression?: boolean;        // Enable response compression
}
```

### Validation Middleware

```typescript
interface ValidationMiddleware {
  body?: z.ZodSchema;    // Validate request body
  query?: z.ZodSchema;   // Validate query parameters
  headers?: z.ZodSchema; // Validate headers
}

// Example
const handler = createApiHandler({
  endpoint: '/api/users',
  validation: {
    body: z.object({
      name: z.string().min(1).max(100),
      email: z.string().email()
    }),
    query: z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
      limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional()
    })
  }
});
```

### Rate Limiting

```typescript
// Pre-configured rate limits
rateLimitConfigs.strict   // 10 requests/minute
rateLimitConfigs.normal   // 100 requests/minute
rateLimitConfigs.lenient  // 1000 requests/minute
rateLimitConfigs.disabled // No rate limiting

// Custom rate limiting
rateLimit: {
  enabled: true,
  windowMs: 60000,      // 1 minute window
  maxRequests: 50,      // 50 requests per window
  keyGenerator: (req, ctx) => ctx.ip // Custom key generation
}
```

## Advanced Usage

### Custom Error Handling

```typescript
import { ApiValidationError, ApiRateLimitError } from '@/lib/api/base-api-handler';

export async function POST(request: NextRequest) {
  return handler.handle(request, async (req, context, validated) => {
    // Custom validation
    if (validated.body.email.includes('spam')) {
      throw new ApiValidationError('Invalid email domain');
    }

    // Business logic errors
    if (userExists) {
      throw new Error('User already exists'); // Becomes INTERNAL_ERROR
    }

    return { success: true };
  });
}
```

### Multiple HTTP Methods

```typescript
// Different configs for different methods
const getHandler = createApiHandler({
  endpoint: '/api/users',
  validation: { query: GetUsersSchema },
  rateLimit: rateLimitConfigs.normal
});

const postHandler = createApiHandler({
  endpoint: '/api/users',
  validation: { body: CreateUserSchema },
  rateLimit: rateLimitConfigs.strict,
  requireAuth: true
});

export async function GET(request: NextRequest) {
  return getHandler.handle(request, async (req, ctx, validated) => {
    // GET logic
  });
}

export async function POST(request: NextRequest) {
  return postHandler.handle(request, async (req, ctx, validated) => {
    // POST logic
  });
}
```

### Authentication Integration

```typescript
// Enable authentication
const handler = createApiHandler({
  endpoint: '/api/protected',
  requireAuth: true,  // Will check Authorization header
  // ... other config
});

// The handler automatically validates the Authorization header
// Extend the checkAuthentication method in BaseApiHandler for custom auth
```

## Common Schemas

Use pre-built validation schemas for common patterns:

```typescript
import { commonSchemas } from '@/lib/api/base-api-handler';

// Pagination
const QuerySchema = z.object({
  ...commonSchemas.pagination.shape,  // page?, limit?
  search: z.string().optional()
});

// Timestamps
const FilterSchema = z.object({
  ...commonSchemas.timestamps.shape,  // start_date?, end_date?
  category: z.string().optional()
});
```

## Testing

Test your API routes with the standardized responses:

```typescript
// Test file
describe('API Handler', () => {
  test('should return standardized success response', async () => {
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.correlation_id).toMatch(/^api-\d+-\w+$/);
    expect(data.timestamp).toBeDefined();
    expect(data.duration_ms).toBeGreaterThan(0);
  });

  test('should handle validation errors', async () => {
    const response = await POST(invalidRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('VALIDATION_ERROR');
  });
});
```

## Migration Guide

### From Existing Routes

Your existing routes will continue to work. To migrate:

1. **Keep existing routes working** - no breaking changes
2. **Gradually adopt** the Base Handler for new routes
3. **Migrate existing routes** when you need to add validation/rate limiting

### Example Migration

**Before:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**After:**
```typescript
const handler = createApiHandler({
  endpoint: '/api/data',
  rateLimit: rateLimitConfigs.normal
});

export async function GET(request: NextRequest) {
  return handler.handle(request, async (req, context, validated) => {
    const data = await fetchData();
    return { data };
  });
}
```

## Performance & Monitoring

The Base API Handler automatically tracks:
- Request duration
- Correlation IDs for tracing
- Rate limit metrics
- Error rates
- Response sizes

All metrics are logged using your existing logger system and can be monitored through:
- `/api/debug/dev-info` - Development information
- `/api/monitoring/metrics` - Performance metrics
- Console logs with correlation IDs

## Best Practices

1. **Use appropriate rate limits** - Strict for write operations, normal for reads
2. **Validate all inputs** - Use Zod schemas for type safety
3. **Handle errors gracefully** - Use specific error types when possible
4. **Log important events** - The handler logs automatically, but add business logic logs
5. **Test thoroughly** - Validate both success and error scenarios
6. **Monitor performance** - Use correlation IDs to track request flows

## Troubleshooting

### Common Issues

1. **Rate limit exceeded**: Adjust rate limit config or implement user-specific limits
2. **Validation errors**: Check your Zod schemas match your request format
3. **CORS issues**: Enable `cors: true` in handler config
4. **Authentication fails**: Implement proper auth check in `checkAuthentication` method

### Debug Information

```bash
# Check endpoint status
curl http://localhost:3000/api/example/users | jq .

# View debug information
curl http://localhost:3000/api/debug/dev-info | jq .development_info

# Check logs for correlation ID
grep "correlation_id.*abc123" logs/app.log
```

## Examples

See the complete example at `/api/example/users` which demonstrates:
- GET with query validation and pagination
- POST with body validation
- PUT with updates
- DELETE with stricter rate limiting
- Error handling
- Different rate limits per method

The Base API Handler makes your API routes consistent, secure, and maintainable while building on your existing patterns! 🚀