/**
 * Ask Assistant Individual Prompt Run API
 *
 * Handles retrieval of individual Ask Assistant prompt runs by ID.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiHandler, rateLimitConfigs } from '@/lib/api/base-api-handler';
import { supabase, isDatabaseAvailable } from '@/lib/supabase';

// Validation schemas
const PromptIdParamsSchema = z.object({
  promptId: z.string().uuid()
});

// Create API handler
const getHandler = createApiHandler({
  endpoint: '/api/ask-assistant/runs/[promptId]',
  validation: {
    params: PromptIdParamsSchema
  },
  rateLimit: rateLimitConfigs.normal,
  requireAuth: false, // TODO: Enable auth when user system is implemented
  cors: true
});

/**
 * GET /api/ask-assistant/runs/[promptId]
 * Retrieve a specific Ask Assistant prompt run by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  return getHandler.handle(request, async (req, context, validated) => {
    const { promptId } = await params;

    // Validate UUID format
    if (!promptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(promptId)) {
      throw new Error('Invalid prompt ID format');
    }

    // Try to fetch from database if available
    if (isDatabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('ask_assistant_prompt_runs')
          .select('*')
          .eq('id', promptId)
          .eq('user_id', 'anonymous') // TODO: Use actual user ID and check ownership
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return {
              success: false,
              error: 'Prompt run not found',
              promptId
            };
          }
          throw error;
        }

        // Transform database record to API format
        return {
          success: true,
          promptRun: {
            id: data.id,
            sectionKey: data.section_key,
            sourcePath: data.source_path,
            prompt: data.prompt,
            sourceConfigId: data.source_config_id,
            usedExpertExample: data.used_expert_example,
            selectedRecommendedPrompt: data.selected_recommended_prompt,
            createdAt: data.created_at
          }
        };

      } catch (error) {
        console.error('Database operation failed:', error);
        // Continue with fallback behavior
      }
    }

    // Fallback: Check if this is a URL parameter-based prompt
    const url = new URL(request.url);
    const promptFromUrl = url.searchParams.get('prompt');
    const sectionKeyFromUrl = url.searchParams.get('sectionKey');
    const sourcePathFromUrl = url.searchParams.get('sourcePath');

    if (promptFromUrl && sectionKeyFromUrl) {
      console.log('📝 [Ask Assistant] Returning URL-based prompt run in fallback mode');

      return {
        success: true,
        promptRun: {
          id: promptId,
          sectionKey: sectionKeyFromUrl,
          sourcePath: sourcePathFromUrl || '',
          prompt: promptFromUrl,
          sourceConfigId: null,
          usedExpertExample: false,
          selectedRecommendedPrompt: null,
          createdAt: new Date().toISOString()
        },
        fallbackMode: true,
        message: 'Prompt run retrieved from URL parameters (database not available)'
      };
    }

    return {
      success: false,
      error: 'Prompt run not found (database not available and no URL parameters)',
      promptId,
      fallbackMode: true
    };
  });
}