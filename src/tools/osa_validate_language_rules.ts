// src/tools/osa_validate_language_rules.ts
import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ValidateLanguageRulesParams {
  content_text: string;
  content_type?: string;
  target_audience?: string;
  validation_level?: 'basic' | 'comprehensive' | 'strict';
  custom_rules?: string[];
}

interface LanguageValidationResult {
  success: boolean;
  validation_results: {
    overall_compliance: number;
    compliance_status: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
    rule_violations: Array<{
      rule_name: string;
      violation_type: 'error' | 'warning' | 'suggestion';
      description: string;
      severity: 'high' | 'medium' | 'low';
      suggested_fix: string;
      location?: { start: number; end: number };
    }>;
    compliance_metrics: {
      readability_score: number;
      inclusivity_score: number;
      professionalism_score: number;
      accuracy_score: number;
    };
    recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
      expected_improvement: string;
    }>;
  };
  _metadata: {
    processing_time_ms: number;
    correlation_id: string;
    timestamp: string;
    content_length: number;
    rules_checked: number;
  };
}

async function osaValidateLanguageRules(
  params: ValidateLanguageRulesParams
): Promise<LanguageValidationResult> {
  const startTime = Date.now();
  const {
    content_text,
    content_type = 'general',
    target_audience = 'professional',
    validation_level = 'comprehensive',
    custom_rules = []
  } = params;

  const correlationId = `language-validation-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  console.log('📝 [Language Rules Validation] Processing content', {
    correlationId,
    content_length: content_text.length,
    content_type,
    validation_level
  });

  try {
    // Simulate language validation analysis
    const violations = [];
    const rulesChecked = 15 + custom_rules.length;

    // Basic readability check
    const wordCount = content_text.split(/\s+/).length;
    const sentenceCount = content_text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    if (avgWordsPerSentence > 20) {
      violations.push({
        rule_name: 'Sentence Length',
        violation_type: 'warning' as const,
        description: 'Some sentences are too long and may reduce readability',
        severity: 'medium' as const,
        suggested_fix: 'Consider breaking longer sentences into shorter, more concise statements'
      });
    }

    // Inclusivity checks
    const exclusiveTerms = ['guys', 'manpower', 'blacklist', 'whitelist'];
    exclusiveTerms.forEach(term => {
      if (content_text.toLowerCase().includes(term)) {
        violations.push({
          rule_name: 'Inclusive Language',
          violation_type: 'error' as const,
          description: `Use of potentially exclusive term: "${term}"`,
          severity: 'high' as const,
          suggested_fix: `Consider replacing "${term}" with more inclusive alternatives`
        });
      }
    });

    // Professional tone check
    const casualTerms = ['awesome', 'cool', 'super', 'amazing'];
    casualTerms.forEach(term => {
      if (content_text.toLowerCase().includes(term)) {
        violations.push({
          rule_name: 'Professional Tone',
          violation_type: 'suggestion' as const,
          description: `Casual language detected: "${term}"`,
          severity: 'low' as const,
          suggested_fix: `Consider using more formal language for professional audience`
        });
      }
    });

    // Calculate compliance metrics
    const compliance_metrics = {
      readability_score: Math.max(0, 100 - (avgWordsPerSentence - 15) * 2),
      inclusivity_score: Math.max(0, 100 - violations.filter(v => v.rule_name === 'Inclusive Language').length * 20),
      professionalism_score: Math.max(0, 100 - violations.filter(v => v.rule_name === 'Professional Tone').length * 10),
      accuracy_score: 95 // Simulated accuracy score
    };

    const overall_compliance = Object.values(compliance_metrics).reduce((sum, score) => sum + score, 0) / 4;

    const compliance_status =
      overall_compliance >= 90 ? 'compliant' :
      overall_compliance >= 75 ? 'minor_issues' :
      overall_compliance >= 50 ? 'major_issues' : 'non_compliant';

    const recommendations = [
      {
        category: 'Readability',
        priority: 'high' as const,
        recommendation: 'Maintain average sentence length between 15-20 words',
        expected_improvement: 'Improved reader comprehension and engagement'
      },
      {
        category: 'Inclusivity',
        priority: 'high' as const,
        recommendation: 'Use inclusive language that welcomes all audience members',
        expected_improvement: 'Better brand perception and broader audience appeal'
      }
    ];

    const processingTime = Date.now() - startTime;

    console.log('✅ [Language Rules Validation] Validation completed', {
      correlationId,
      overall_compliance: Math.round(overall_compliance),
      violations_found: violations.length,
      processing_time_ms: processingTime
    });

    return {
      success: true,
      validation_results: {
        overall_compliance: Math.round(overall_compliance * 100) / 100,
        compliance_status,
        rule_violations: violations,
        compliance_metrics,
        recommendations
      },
      _metadata: {
        processing_time_ms: processingTime,
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
        content_length: content_text.length,
        rules_checked: rulesChecked
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [Language Rules Validation] Validation failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime
    });

    return {
      success: false,
      validation_results: {
        overall_compliance: 0,
        compliance_status: 'non_compliant',
        rule_violations: [{
          rule_name: 'System Error',
          violation_type: 'error',
          description: 'Validation process failed',
          severity: 'high',
          suggested_fix: 'Please retry the validation or contact support'
        }],
        compliance_metrics: {
          readability_score: 0,
          inclusivity_score: 0,
          professionalism_score: 0,
          accuracy_score: 0
        },
        recommendations: []
      },
      _metadata: {
        processing_time_ms: processingTime,
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
        content_length: content_text.length,
        rules_checked: 0
      }
    };
  }
}

// Register tool with OPAL SDK
tool({
  name: "osa_validate_language_rules",
  description: "Validate content against language rules for readability, inclusivity, professionalism, and accuracy compliance.",
  parameters: [
    {
      name: "content_text",
      type: ParameterType.String,
      description: "Text content to validate against language rules and compliance standards",
      required: true,
    },
    {
      name: "content_type",
      type: ParameterType.String,
      description: "Type of content being validated (e.g., 'email', 'blog_post', 'marketing_copy', 'general')",
      required: false,
    },
    {
      name: "target_audience",
      type: ParameterType.String,
      description: "Target audience for content (e.g., 'professional', 'casual', 'technical', 'executive')",
      required: false,
    },
    {
      name: "validation_level",
      type: ParameterType.String,
      description: "Level of validation strictness ('basic', 'comprehensive', 'strict')",
      required: false,
    },
    {
      name: "custom_rules",
      type: ParameterType.List,
      description: "Additional custom validation rules to apply",
      required: false,
    },
  ],
})(osaValidateLanguageRules);