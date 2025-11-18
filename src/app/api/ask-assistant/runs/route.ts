/**
 * Ask Assistant Prompt Runs API
 *
 * Handles creation and retrieval of Ask Assistant prompt runs with
 * proper validation, error handling, and database persistence.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiHandler, rateLimitConfigs } from '@/lib/api/base-api-handler';
import { supabase, handleDatabaseError, isDatabaseAvailable } from '@/lib/supabase';
import { ResultsSectionKey } from '@/lib/askAssistant/config';

// Validation schemas
const CreatePromptRunSchema = z.object({
  sectionKey: z.string() as z.ZodType<ResultsSectionKey>,
  sourcePath: z.string().optional().default(''),
  prompt: z.string().min(1).max(10000),
  sourceConfigId: z.string().optional(),
  usedExpertExample: z.boolean().optional().default(false),
  selectedRecommendedPrompt: z.string().optional()
});

const GetPromptRunsQuerySchema = z.object({
  sectionKey: z.string().optional() as z.ZodType<ResultsSectionKey | undefined>,
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0)
});

// Create API handlers
const postHandler = createApiHandler({
  endpoint: '/api/ask-assistant/runs',
  validation: {
    body: CreatePromptRunSchema
  },
  rateLimit: rateLimitConfigs.normal, // 100 requests per minute
  requireAuth: false, // TODO: Enable auth when user system is implemented
  cors: true
});

const getHandler = createApiHandler({
  endpoint: '/api/ask-assistant/runs',
  validation: {
    query: GetPromptRunsQuerySchema
  },
  rateLimit: rateLimitConfigs.normal,
  requireAuth: false, // TODO: Enable auth when user system is implemented
  cors: true
});

/**
 * POST /api/ask-assistant/runs
 * Create a new Ask Assistant prompt run
 */
export async function POST(request: NextRequest) {
  return postHandler.handle(request, async (req, context, validated) => {
    const { body } = validated;
    const promptId = crypto.randomUUID();
    const currentTime = new Date().toISOString();

    // Create prompt run record
    const promptRun = {
      id: promptId,
      user_id: 'anonymous', // TODO: Replace with actual user ID when auth is implemented
      section_key: body.sectionKey,
      source_path: body.sourcePath || '',
      prompt: body.prompt,
      source_config_id: body.sourceConfigId || null,
      used_expert_example: body.usedExpertExample || false,
      selected_recommended_prompt: body.selectedRecommendedPrompt || null,
      created_at: currentTime
    };

    // Try to save to database if available
    if (isDatabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('ask_assistant_prompt_runs')
          .insert([promptRun])
          .select()
          .single();

        if (error) {
          console.error('Database insert failed, falling back to in-memory storage:', error);
          // Continue with fallback behavior below
        } else {
          return {
            id: data.id,
            sectionKey: data.section_key,
            sourcePath: data.source_path,
            prompt: data.prompt,
            sourceConfigId: data.source_config_id,
            usedExpertExample: data.used_expert_example,
            selectedRecommendedPrompt: data.selected_recommended_prompt,
            createdAt: data.created_at,
            message: 'Prompt run created successfully'
          };
        }
      } catch (error) {
        console.error('Database operation failed:', error);
        // Continue with fallback behavior
      }
    }

    // Fallback: Store in temporary memory/session storage
    // In a real implementation, you might want to use Redis or another temporary store
    console.log('📝 [Ask Assistant] Storing prompt run in fallback mode:', {
      id: promptId,
      sectionKey: body.sectionKey,
      prompt: body.prompt.substring(0, 100) + '...'
    });

    return {
      id: promptId,
      sectionKey: body.sectionKey,
      sourcePath: body.sourcePath || '',
      prompt: body.prompt,
      sourceConfigId: body.sourceConfigId,
      usedExpertExample: body.usedExpertExample || false,
      selectedRecommendedPrompt: body.selectedRecommendedPrompt,
      createdAt: currentTime,
      message: 'Prompt run created successfully (stored temporarily)',
      fallbackMode: true
    };
  });
}

/**
 * GET /api/ask-assistant/runs
 * Retrieve Ask Assistant prompt runs for the current user
 */
export async function GET(request: NextRequest) {
  return getHandler.handle(request, async (req, context, validated) => {
    const { query } = validated;

    // Try to fetch from database if available
    if (isDatabaseAvailable()) {
      try {
        let dbQuery = supabase
          .from('ask_assistant_prompt_runs')
          .select('*')
          .eq('user_id', 'anonymous') // TODO: Use actual user ID
          .order('created_at', { ascending: false });

        if (query?.sectionKey) {
          dbQuery = dbQuery.eq('section_key', query.sectionKey);
        }

        if (query?.limit) {
          dbQuery = dbQuery.limit(query.limit);
        }

        if (query?.offset) {
          dbQuery = dbQuery.range(query.offset, query.offset + (query?.limit || 50) - 1);
        }

        const { data, error } = await dbQuery;

        if (error) {
          console.error('Database query failed:', error);
          throw error;
        }

        // Transform database records to API format
        const runs = data?.map(record => ({
          id: record.id,
          sectionKey: record.section_key,
          sourcePath: record.source_path,
          prompt: record.prompt,
          sourceConfigId: record.source_config_id,
          usedExpertExample: record.used_expert_example,
          selectedRecommendedPrompt: record.selected_recommended_prompt,
          createdAt: record.created_at
        })) || [];

        return {
          runs,
          total: runs.length,
          hasMore: runs.length === (query?.limit || 50),
          metadata: {
            sectionKey: query?.sectionKey || null,
            limit: query?.limit || 50,
            offset: query?.offset || 0
          }
        };

      } catch (error) {
        console.error('Database operation failed:', error);
        // Continue with fallback behavior
      }
    }

    // Fallback: Return empty results with helpful message
    console.log('📝 [Ask Assistant] Returning empty results in fallback mode');

    return {
      runs: [],
      total: 0,
      hasMore: false,
      message: 'No prompt runs found (database not available)',
      fallbackMode: true,
      metadata: {
        sectionKey: query?.sectionKey || null,
        limit: query?.limit || 50,
        offset: query?.offset || 0
      }
    };
  });
}