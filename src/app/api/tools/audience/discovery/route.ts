import { NextResponse } from 'next/server';

/**
 * Opal Discovery endpoint for Audience Tool
 * Returns function definitions in Opal-compatible format
 */
export async function GET(): Promise<NextResponse> {
  try {
    const discoveryResponse = {
      functions: [
        {
          name: "audience_lookup",
          description: "Look up user profile and segments from Optimizely Data Platform and Salesforce integration",
          parameters: [
            {
              name: "email_hash",
              type: "string",
              description: "Hashed email identifier for user lookup",
              required: false
            },
            {
              name: "sf_contact_id",
              type: "string",
              description: "Salesforce contact ID for user lookup",
              required: false
            },
            {
              name: "opti_user_id",
              type: "string",
              description: "Optimizely user ID for lookup",
              required: false
            },
            {
              name: "zaius_id",
              type: "string",
              description: "Legacy Zaius identifier for lookup",
              required: false
            }
          ],
          endpoint: "/api/tools/audience",
          http_method: "POST",
          auth_requirements: ["bearer_token"]
        }
      ],
      tool_info: {
        name: "ODP Audience Insights",
        version: "1.0.0",
        description: "Retrieve audience insights and user profiles from Optimizely Data Platform",
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