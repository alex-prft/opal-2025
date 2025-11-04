import { NextResponse } from 'next/server';

/**
 * Opal Discovery endpoint for Campaign Management Platform Tool
 * Returns function definitions in Opal-compatible format
 */
export async function GET(): Promise<NextResponse> {
  try {
    const discoveryResponse = {
      functions: [
        {
          name: "create_campaign",
          description: "Create personalization campaigns and briefs with shareable URLs in Campaign Management Platform",
          parameters: [
            {
              name: "title",
              type: "string",
              description: "Campaign title or name",
              required: true
            },
            {
              name: "plan_markdown",
              type: "string",
              description: "Markdown content for the campaign brief",
              required: true
            },
            {
              name: "project_key",
              type: "string",
              description: "Project identifier for campaign organization",
              required: false
            },
            {
              name: "tasks",
              type: "array",
              description: "Array of task objects to create within the campaign",
              required: false
            }
          ],
          endpoint: "/api/tools/cmp",
          http_method: "POST",
          auth_requirements: ["bearer_token"]
        }
      ],
      tool_info: {
        name: "Campaign Management Platform",
        version: "1.0.0",
        description: "Create and manage personalization campaigns with shareable URLs",
        provider: "Opal PMG System"
      }
    };

    return NextResponse.json(discoveryResponse);

  } catch (error) {
    return NextResponse.json({
      error: "Discovery endpoint failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}