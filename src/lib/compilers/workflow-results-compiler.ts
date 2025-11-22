import { supabase } from '@/lib/database/supabase-client';
import { OSAWorkflowOutput } from '@/lib/types/maturity';

export class WorkflowResultsCompiler {
  static async compile(workflowId: string): Promise<OSAWorkflowOutput> {

    // 1) Fetch core workflow row (for status, etc.)
    const { data: workflow } = await supabase
      .from('opal_workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .maybeSingle();

    // 2) Fetch insights (best effort – tolerate missing tables/rows)
    const { data: odp } = await supabase
      .from('opal_odp_insights')
      .select('*')
      .eq('workflow_id', workflowId)
      .maybeSingle();

    const { data: content } = await supabase
      .from('opal_content_insights')
      .select('*')
      .eq('workflow_id', workflowId)
      .maybeSingle();

    const { data: cmp } = await supabase
      .from('opal_cmp_insights')
      .select('*')
      .eq('workflow_id', workflowId)
      .maybeSingle();

    // 3) Do a very simple, defensive mapping.
    //    Do NOT throw if something is missing – just leave fields undefined.

    const output: OSAWorkflowOutput = {
      workflow_id: workflowId,
      status: (workflow?.status as any) ?? 'completed',
      // keep existing fields if needed...
    };

    // Map segments from odp.audience_segments if present
    if (odp?.audience_segments) {
      // Assume it's already close to AudienceSegment[] shape
      output.segments = odp.audience_segments as any;
    }

    // Map content inventory and recommendations from content_insights if present
    if (content?.website_content_analysis) {
      output.content_inventory = content.website_content_analysis as any;
    }

    if (content?.content_recommendations) {
      output.experience_recommendations = content.content_recommendations as any;
    }

    // Map strategy outline from cmp_insights if present
    if (cmp?.strategy_brief || cmp?.implementation_timeline) {
      output.strategy_outline = {
        phases: [], // optional for now – can be filled later
        roadmap: (cmp.implementation_timeline as any) ?? [],
        priorities: (cmp.business_objectives as any) ?? [],
        maturity_assessment: {
          current_phase: 'crawl' as any,
          target_phase: 'walk' as any,
          overall_score: 0,
        },
        executive_summary: cmp.executive_summary ?? '',
        key_metrics: [],
      };
    }

    return output;
  }
}