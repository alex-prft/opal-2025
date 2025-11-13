/**
 * Example API Route using Base API Handler
 *
 * This demonstrates how to use the new standardized API handler
 * for consistent error handling, validation, rate limiting, and logging.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiHandler, commonSchemas, rateLimitConfigs } from '@/lib/api/base-api-handler';

// Define validation schemas for this endpoint
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).optional().default('user'),
  metadata: z.record(z.any()).optional()
});

const GetUsersQuerySchema = z.object({
  ...commonSchemas.pagination.shape,
  role: z.enum(['user', 'admin']).optional(),
  search: z.string().optional()
});

// Create separate handlers for different HTTP methods
const getHandler = createApiHandler({
  endpoint: '/api/example/users',
  validation: {
    query: GetUsersQuerySchema
  },
  rateLimit: rateLimitConfigs.normal, // 100 requests per minute
  requireAuth: false,
  cors: true
});

const postHandler = createApiHandler({
  endpoint: '/api/example/users',
  validation: {
    body: CreateUserSchema
  },
  rateLimit: rateLimitConfigs.normal,
  requireAuth: false,
  cors: true
});

const putHandler = createApiHandler({
  endpoint: '/api/example/users',
  validation: {
    body: CreateUserSchema.partial() // Allow partial updates
  },
  rateLimit: rateLimitConfigs.normal,
  requireAuth: false,
  cors: true
});

// Mock data for demonstration
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'user' }
];

/**
 * GET /api/example/users
 * Retrieve users with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  return getHandler.handle(request, async (req, context, validated) => {
    const { query } = validated;

    // Simulate filtering
    let filteredUsers = [...mockUsers];

    if (query?.role) {
      filteredUsers = filteredUsers.filter(user => user.role === query.role);
    }

    if (query?.search) {
      const searchTerm = query.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    // Simulate pagination
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      },
      metadata: {
        filtered_count: filteredUsers.length,
        total_count: mockUsers.length,
        applied_filters: {
          role: query?.role || null,
          search: query?.search || null
        }
      }
    };
  });
}

/**
 * POST /api/example/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  return postHandler.handle(request, async (req, context, validated) => {
    const { body } = validated;

    // Check if user already exists (simulation)
    const existingUser = mockUsers.find(user => user.email === body.email);
    if (existingUser) {
      throw new Error(`User with email ${body.email} already exists`);
    }

    // Simulate user creation
    const newUser = {
      id: `${mockUsers.length + 1}`,
      name: body.name,
      email: body.email,
      role: body.role,
      created_at: new Date().toISOString(),
      metadata: body.metadata || {}
    };

    // Add to mock database
    mockUsers.push(newUser);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      user: newUser,
      message: `User ${body.name} created successfully`
    };
  });
}

/**
 * PUT /api/example/users/:id
 * Update an existing user (placeholder for dynamic route)
 */
export async function PUT(request: NextRequest) {
  return putHandler.handle(request, async (req, context, validated) => {
    const { body } = validated;

    // In a real implementation, you'd extract the ID from the URL
    // For this example, we'll update the first user
    const userToUpdate = mockUsers[0];

    if (!userToUpdate) {
      throw new Error('User not found');
    }

    // Simulate update
    Object.assign(userToUpdate, {
      ...body,
      updated_at: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      user: userToUpdate,
      message: 'User updated successfully'
    };
  });
}

/**
 * DELETE /api/example/users
 * Delete users (bulk delete example)
 */
export async function DELETE(request: NextRequest) {
  // Create handler with stricter rate limiting for delete operations
  const deleteHandler = createApiHandler({
    endpoint: '/api/example/users',
    validation: {
      body: z.object({
        user_ids: z.array(z.string()).min(1).max(10)
      })
    },
    rateLimit: rateLimitConfigs.strict, // 10 requests per minute for deletes
    requireAuth: false, // In real app, definitely require auth for deletes
    cors: true
  });

  return deleteHandler.handle(request, async (req, context, validated) => {
    const { body } = validated;

    // Simulate deletion
    const deletedCount = body.user_ids.length;

    // In real implementation, you'd actually delete from database
    console.log(`Would delete users with IDs: ${body.user_ids.join(', ')}`);

    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      deleted_count: deletedCount,
      deleted_user_ids: body.user_ids,
      message: `Successfully deleted ${deletedCount} user(s)`
    };
  });
}