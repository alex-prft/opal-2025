// src/main.ts
import 'reflect-metadata';
import { ToolsService } from "@optimizely-opal/opal-tools-sdk";
import cors from "cors";
import express from "express";
import basicAuth from "express-basic-auth";

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());
app.use("/public", express.static("public"));

// Basic auth (optional, recommended in prod)
app.use((req, res, next) => {
  if (req.path.startsWith("/public/") || req.path === "/rick.gif") {
    return next(); // allow public assets
  }

  // Use env vars in real life
  const USER = process.env.OPAL_TOOLS_USER || "admin";
  const PASS = process.env.OPAL_TOOLS_PASS || "password";

  return basicAuth({
    users: { [USER]: PASS },
    challenge: true,
  })(req, res, next);
});

// Create Tools Service (this wires up /discovery)
const toolsService = new ToolsService(app);

// ===== IMPORT ALL TOOLS HERE (each file registers itself) =====

// Core OSA Tools
import "./tools/osa_fetch_audience_segments";
import "./tools/osa_send_data_to_osa_webhook";
import "./tools/osa_analyze_member_behavior";
import "./tools/osa_store_workflow_data";
import "./tools/osa_create_dynamic_segments";
import "./tools/osa_validate_language_rules";
import "./tools/osa_retrieve_workflow_context";

// Data Analysis Tools
import "./tools/osa_analyze_data_insights";
import "./tools/osa_calculate_segment_statistical_power";
import "./tools/osa_get_member_journey_data";
import "./tools/osa_export_segment_targeting_logic";
import "./tools/osa_generate_behavioral_insights";
import "./tools/osa_track_engagement_patterns";
import "./tools/osa_analyze_conversion_paths";

// Segment Management Tools
import "./tools/osa_generate_segment_profiles";
import "./tools/osa_optimize_audience_targeting";
import "./tools/osa_analyze_lifecycle_stages";
import "./tools/osa_analyze_audience_cohorts";

// Content Tools
import "./tools/osa_analyze_website_content";
import "./tools/create_content_matrix";
import "./tools/get_content_recommendations_by_topic";
import "./tools/get_content_recommendations_by_section";

// Experimentation Tools
import "./tools/osa_design_experiments";
import "./tools/osa_generate_performance_baseline";

// Campaign Management Platform Integration Tools
import "./tools/osa_read_marketing_calendar";
import "./tools/osa_send_strategy_to_cmp";
import "./tools/osa_create_cmp_brief";
import "./tools/osa_create_cmp_task";

// Canvas Visualization Tools
import "./tools/osa_suggest_canvas_visualization";
import "./tools/osa_create_audience_dashboard_canvas";
import "./tools/osa_create_segment_comparison_canvas";
import "./tools/osa_create_behavioral_funnel_canvas";
import "./tools/osa_create_engagement_heatmap_canvas";

// General Platform Tools
import "./tools/data_insights";
import "./tools/notify";
import "./tools/cmp";
import "./tools/ai_experimentation";
import "./tools/ai_personalization";
import "./tools/experiments";
import "./tools/audience";
import "./tools/content";

console.log('🚀 [OPAL Tools Registry] All tools have been imported and registered');
console.log('📋 [OPAL Tools Registry] Discovery endpoint will be available at /discovery');

// Export app for serverless
export { app };

// Local dev server (optional)
if (process.env.NODE_ENV !== "production" || process.env.NETLIFY !== "true") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🎯 [OPAL Tools Server] Running on port ${PORT}`);
    console.log(`🔍 [OPAL Tools Discovery] Available at: http://localhost:${PORT}/discovery`);
    console.log(`📊 [OPAL Tools Registry] 40+ tools registered and ready for OPAL integration`);
  });
}