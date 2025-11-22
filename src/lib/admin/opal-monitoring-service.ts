/**
 * OPAL Admin Monitoring Service
 *
 * Read-only service for admin "X-ray" view of OPAL workflow status and results page readiness.
 * Used for debugging and demo confidence - simple checks with graceful degradation.
 */

import { createSupabaseAdmin } from '@/lib/database/supabase-client';

export interface WorkflowRunCard {
  workflow_id: string;
  status: 'completed' | 'running' | 'failed' | string;
  client_name?: string | null;
  started_at: string;
  completed_at?: string | null;
  agents_completed: string[];
  agents_expected: string[];
}

export interface ResultsPageStatus {
  page_name: 'Strategy' | 'Insights' | 'Optimization' | 'DXP Tools';
  route: string;
  has_required_data: boolean;
  data_completeness: number; // 0–100
  notes: string[];
}

/**
 * Get the most recent workflow execution for admin dashboard
 */
export async function getLatestWorkflowRun(): Promise<WorkflowRunCard | null> {
  try {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from('opal_workflow_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[OPAL Monitoring] Error fetching latest workflow:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    // Extract completed agents - handle both array and null cases
    const agentsCompleted = Array.isArray(data.completed_agents)
      ? data.completed_agents
      : [];

    // Extract expected agents - handle both array and null cases, with fallback
    const agentsExpected = Array.isArray(data.expected_agents)
      ? data.expected_agents
      : ['audience_suggester', 'content_review']; // Default fallback

    return {
      workflow_id: data.id,
      status: data.status || 'unknown',
      client_name: data.client_name,
      started_at: data.trigger_timestamp || data.created_at,
      completed_at: data.completed_at,
      agents_completed: agentsCompleted,
      agents_expected: agentsExpected,
    };
  } catch (error) {
    console.error('[OPAL Monitoring] Failed to fetch latest workflow:', error);
    return null;
  }
}

/**
 * Check data availability for each results page for a specific workflow
 */
export async function getResultsPageStatuses(
  workflowId: string
): Promise<ResultsPageStatus[]> {
  try {
    const supabase = createSupabaseAdmin();

    // Query all insights tables in parallel - graceful handling if tables don't exist
    const [odpResult, contentResult, cmpResult] = await Promise.allSettled([
      supabase
        .from('opal_odp_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .maybeSingle(),
      supabase
        .from('opal_content_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .maybeSingle(),
      supabase
        .from('opal_cmp_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .maybeSingle(),
    ]);

    const statuses: ResultsPageStatus[] = [];

    // Extract data safely from Promise.allSettled results
    const odpData = odpResult.status === 'fulfilled' && !odpResult.value.error
      ? odpResult.value.data
      : null;
    const contentData = contentResult.status === 'fulfilled' && !contentResult.value.error
      ? contentResult.value.data
      : null;
    const cmpData = cmpResult.status === 'fulfilled' && !cmpResult.value.error
      ? cmpResult.value.data
      : null;

    // Strategy Page - needs CMP strategy info
    const hasStrategyData = !!cmpData;
    statuses.push({
      page_name: 'Strategy',
      route: `/engine/results/strategy?workflow_id=${workflowId}`,
      has_required_data: hasStrategyData,
      data_completeness: hasStrategyData ? 100 : 0,
      notes: hasStrategyData
        ? ['Strategy data available from CMP insights']
        : ['No strategy (CMP) data found for this workflow'],
    });

    // Insights Page - needs ODP audience data
    const hasInsightsData = !!odpData;
    statuses.push({
      page_name: 'Insights',
      route: `/engine/results/insights?workflow_id=${workflowId}`,
      has_required_data: hasInsightsData,
      data_completeness: hasInsightsData ? 100 : 0,
      notes: hasInsightsData
        ? ['Audience insights available from ODP data']
        : ['No ODP/audience insights for this workflow'],
    });

    // Optimization Page - needs content recommendations
    const hasOptimizationData = !!contentData;
    statuses.push({
      page_name: 'Optimization',
      route: `/engine/results/optimization?workflow_id=${workflowId}`,
      has_required_data: hasOptimizationData,
      data_completeness: hasOptimizationData ? 100 : 0,
      notes: hasOptimizationData
        ? ['Content optimization data available']
        : ['No content insights for this workflow'],
    });

    // DXP Tools Page - treat as same as content presence for now
    const hasDXPData = !!contentData;
    statuses.push({
      page_name: 'DXP Tools',
      route: `/engine/results/dxptools?workflow_id=${workflowId}`,
      has_required_data: hasDXPData,
      data_completeness: hasDXPData ? 100 : 0,
      notes: hasDXPData
        ? ['DXP tools data available from content insights']
        : ['No content/CMS insights for DXP tools'],
    });

    return statuses;

  } catch (error) {
    console.error('[OPAL Monitoring] Failed to fetch results page statuses:', error);

    // Return safe fallback with error indicators
    const errorStatuses: ResultsPageStatus[] = [
      'Strategy', 'Insights', 'Optimization', 'DXP Tools'
    ].map(pageName => ({
      page_name: pageName as any,
      route: `/engine/results/${pageName.toLowerCase()}?workflow_id=${workflowId}`,
      has_required_data: false,
      data_completeness: 0,
      notes: ['Error checking data availability - database query failed'],
    }));

    return errorStatuses;
  }
}

/**
 * Get basic health status of OPAL monitoring system
 */
export async function getMonitoringHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'error';
  checks: { name: string; passed: boolean; message: string }[];
}> {
  const checks = [];

  try {
    const supabase = createSupabaseAdmin();

    // Check if workflow table is accessible
    const { error: workflowError } = await supabase
      .from('opal_workflow_executions')
      .select('count', { count: 'exact', head: true });

    checks.push({
      name: 'Workflow Executions Table',
      passed: !workflowError,
      message: workflowError ? workflowError.message : 'Accessible'
    });

    // Check if insights tables are accessible
    const insightTables = ['opal_odp_insights', 'opal_content_insights', 'opal_cmp_insights'];

    for (const table of insightTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });

        checks.push({
          name: `${table} Table`,
          passed: !error,
          message: error ? error.message : 'Accessible'
        });
      } catch (err) {
        checks.push({
          name: `${table} Table`,
          passed: false,
          message: `Table check failed: ${err}`
        });
      }
    }

    const failedChecks = checks.filter(c => !c.passed).length;
    const status = failedChecks === 0 ? 'healthy' : failedChecks <= 1 ? 'degraded' : 'error';

    return { status, checks };

  } catch (error) {
    return {
      status: 'error',
      checks: [{
        name: 'Database Connection',
        passed: false,
        message: `Connection failed: ${error}`
      }]
    };
  }
}