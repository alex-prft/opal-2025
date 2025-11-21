// src/main.ts
import 'reflect-metadata';
import { ToolsService } from "@optimizely-opal/opal-tools-sdk";
import * as cors from "cors";
import * as express from "express";
import * as basicAuth from "express-basic-auth";

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());
app.use("/public", express.static("public"));

// Authentication middleware (Bearer token + Basic auth fallback)
app.use((req, res, next) => {
  if (req.path.startsWith("/public/") || req.path === "/rick.gif") {
    return next(); // allow public assets
  }

  // Check for Bearer token first (preferred for OPAL)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const expectedToken = process.env.OPAL_DISCOVERY_TOKEN || process.env.OPAL_TOOLS_AUTH_TOKEN;

    if (expectedToken && token === expectedToken) {
      console.log('✅ [OPAL Tools] Bearer token authentication successful');
      return next();
    } else if (expectedToken) {
      return res.status(401).json({
        error: 'Invalid Bearer token',
        message: 'Please provide a valid Bearer token in Authorization header'
      });
    }
  }

  // Fallback to Basic auth for backwards compatibility
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

// Core OSA Tools (implemented)
import "./tools/osa_fetch_audience_segments";
import "./tools/osa_send_data_to_osa_webhook";
import "./tools/osa_analyze_member_behavior";
import "./tools/osa_validate_language_rules";

// Batch Placeholder Tools (temporary - will be split into individual files)
import "./tools/placeholder-tools-batch";

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