import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication, createAuthErrorResponse } from '@/lib/utils/auth';

/**
 * Custom Rules API - Manages user-specific custom analysis rules
 * Supports CRUD operations for personalized OSA analysis customizations
 */

// In-memory storage for demo - replace with database in production
interface CustomRule {
  id: string;
  userId: string;
  areaId: string;
  tabId: string;
  name: string;
  description: string;
  rule: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Demo storage - replace with actual database
const customRulesStore = new Map<string, CustomRule>();

// Seed with default templates
seedDefaultTemplates();

function seedDefaultTemplates() {
  const templates: Omit<CustomRule, 'id' | 'userId' | 'areaId' | 'tabId' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Conservative Scoring',
      description: 'Apply more conservative scoring to maturity assessments',
      rule: 'When calculating maturity scores, reduce all scores by 10% to ensure conservative estimates. Prioritize "walk" phase recommendations over "run" phase when confidence is below 85%.',
      isTemplate: true
    },
    {
      name: 'Aggressive Growth Focus',
      description: 'Prioritize high-impact, high-effort initiatives',
      rule: 'When generating recommendations, prioritize initiatives with impact score > 8/10 even if effort is high. Focus on "fly" phase capabilities that drive significant competitive advantage.',
      isTemplate: true
    },
    {
      name: 'Resource Constrained',
      description: 'Focus on low-effort, high-impact quick wins',
      rule: 'Filter recommendations to prioritize low-effort (≤ 4 weeks) initiatives. When calculating ROI, weight resource efficiency 2x more than absolute impact. Emphasize "crawl" and "walk" phase implementations.',
      isTemplate: true
    },
    {
      name: 'Data Quality Focus',
      description: 'Emphasize data foundation improvements',
      rule: 'When assessing readiness, require data quality scores > 90% before recommending advanced personalization. Prioritize data integration and governance improvements over feature enhancements.',
      isTemplate: true
    },
    {
      name: 'Mobile-First Strategy',
      description: 'Prioritize mobile experience optimization',
      rule: 'When evaluating personalization opportunities, prioritize mobile user experience improvements. Weight mobile performance metrics 1.5x higher than desktop in scoring. Focus on mobile-specific quick wins and optimizations.',
      isTemplate: true
    },
    {
      name: 'Compliance-Heavy Industry',
      description: 'Emphasize regulatory compliance and data governance',
      rule: 'When generating recommendations, prioritize initiatives with strong compliance frameworks. Require explicit privacy and security assessments for all data-driven features. Emphasize audit trail capabilities.',
      isTemplate: true
    }
  ];

  templates.forEach(template => {
    const id = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}`;
    customRulesStore.set(id, {
      ...template,
      id,
      userId: 'system',
      areaId: 'all',
      tabId: 'all',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
}

/**
 * GET - Retrieve custom rules for user and context
 */
export async function GET(request: NextRequest) {
  try {
    // Try authentication but allow anonymous access for demo purposes
    const authResult = requireAuthentication(request);

    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('area_id');
    const tabId = searchParams.get('tab_id');
    const includeTemplates = searchParams.get('include_templates') === 'true';

    // Use authenticated userId if available, otherwise use 'anonymous'
    const userId = authResult.isValid ? (authResult.userId || 'anonymous') : 'anonymous';

    // Filter rules by user and context
    const userRules = Array.from(customRulesStore.values()).filter(rule => {
      // Include user's own rules
      if (rule.userId === userId) {
        if (!areaId || rule.areaId === 'all' || rule.areaId === areaId) {
          if (!tabId || rule.tabId === 'all' || rule.tabId === tabId) {
            return true;
          }
        }
      }

      // Include system templates if requested
      if (includeTemplates && rule.isTemplate && rule.userId === 'system') {
        return true;
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      rules: userRules,
      count: userRules.length,
      context: { areaId, tabId, userId },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Custom Rules GET error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve custom rules',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST - Create new custom rule
 */
export async function POST(request: NextRequest) {
  try {
    // Try authentication but allow anonymous access for demo purposes
    const authResult = requireAuthentication(request);

    const { areaId, tabId, name, description, rule, isTemplate = false } = await request.json();

    if (!areaId || !tabId || !name || !rule) {
      return NextResponse.json(
        { error: 'Missing required fields: areaId, tabId, name, rule' },
        { status: 400 }
      );
    }

    // Use authenticated userId if available, otherwise use 'anonymous'
    const userId = authResult.isValid ? (authResult.userId || 'anonymous') : 'anonymous';
    const ruleId = `${userId}-${areaId}-${tabId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newRule: CustomRule = {
      id: ruleId,
      userId,
      areaId,
      tabId,
      name: name.trim(),
      description: description?.trim() || '',
      rule: rule.trim(),
      isTemplate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    customRulesStore.set(ruleId, newRule);

    return NextResponse.json({
      success: true,
      rule: newRule,
      message: 'Custom rule created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Custom Rules POST error:', error);
    return NextResponse.json({
      error: 'Failed to create custom rule',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT - Update existing custom rule
 */
export async function PUT(request: NextRequest) {
  try {
    // Try authentication but allow anonymous access for demo purposes
    const authResult = requireAuthentication(request);

    const { id, name, description, rule } = await request.json();

    if (!id || !name || !rule) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, rule' },
        { status: 400 }
      );
    }

    // Use authenticated userId if available, otherwise use 'anonymous'
    const userId = authResult.isValid ? (authResult.userId || 'anonymous') : 'anonymous';
    const existingRule = customRulesStore.get(id);

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Custom rule not found' },
        { status: 404 }
      );
    }

    // Only allow users to update their own rules (not system templates)
    if (existingRule.userId !== userId || existingRule.userId === 'system') {
      return NextResponse.json(
        { error: 'Unauthorized to modify this rule' },
        { status: 403 }
      );
    }

    const updatedRule: CustomRule = {
      ...existingRule,
      name: name.trim(),
      description: description?.trim() || '',
      rule: rule.trim(),
      updatedAt: new Date().toISOString()
    };

    customRulesStore.set(id, updatedRule);

    return NextResponse.json({
      success: true,
      rule: updatedRule,
      message: 'Custom rule updated successfully'
    });

  } catch (error) {
    console.error('Custom Rules PUT error:', error);
    return NextResponse.json({
      error: 'Failed to update custom rule',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE - Remove custom rule
 */
export async function DELETE(request: NextRequest) {
  try {
    // Try authentication but allow anonymous access for demo purposes
    const authResult = requireAuthentication(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Use authenticated userId if available, otherwise use 'anonymous'
    const userId = authResult.isValid ? (authResult.userId || 'anonymous') : 'anonymous';
    const existingRule = customRulesStore.get(id);

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Custom rule not found' },
        { status: 404 }
      );
    }

    // Only allow users to delete their own rules (not system templates)
    if (existingRule.userId !== userId || existingRule.userId === 'system') {
      return NextResponse.json(
        { error: 'Unauthorized to delete this rule' },
        { status: 403 }
      );
    }

    customRulesStore.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Custom rule deleted successfully',
      deletedRule: { id, name: existingRule.name }
    });

  } catch (error) {
    console.error('Custom Rules DELETE error:', error);
    return NextResponse.json({
      error: 'Failed to delete custom rule',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}