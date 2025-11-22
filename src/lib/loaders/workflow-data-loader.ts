import { WorkflowResultsCompiler } from '@/lib/compilers/workflow-results-compiler';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import { supabase } from '@/lib/database/supabase-client';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_OPAL_MOCK_MODE === 'true';
const USE_WORKFLOW_RESULTS = process.env.NEXT_PUBLIC_USE_WORKFLOW_RESULTS === 'true';

export async function getLatestWorkflowId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('opal_workflow_executions')
    .select('workflow_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.workflow_id;
}

export async function loadWorkflowResults(
  workflowId?: string | null
): Promise<OSAWorkflowOutput | null> {
  // If we are in mock mode, just return mock data as before
  if (USE_MOCK_DATA) {
    try {
      const { MockOpalIntegrationValidator } = await import('@/lib/opal/integration-validator-mock');
      return MockOpalIntegrationValidator.generate('healthy') as any;
    } catch {
      return null;
    }
  }

  // If the new workflow-based pipeline is OFF, let callers fall back to legacy logic
  if (!USE_WORKFLOW_RESULTS) {
    return null;
  }

  const id = workflowId ?? (await getLatestWorkflowId());
  if (!id) return null;

  try {
    return await WorkflowResultsCompiler.compile(id);
  } catch (e) {
    console.error('loadWorkflowResults error', e);
    return null;
  }
}