#!/usr/bin/env python3
"""
OSA Content Review and Analysis Script

This script analyzes content on OSA results pages to determine:
1. Whether content is generic or leverages OPAL integration data
2. Alignment with OPAL mapping structure
3. Content quality and optimization opportunities
4. Integration with results-content-optimizer patterns

Usage:
    python3 content_analyzer.py --tier1 "Strategy Plans" --tier2 "OSA" --tier3 "AI Recommendations"
    python3 content_analyzer.py --analyze-page /engine/results/strategy-plans/osa/ai-recommendations
    python3 content_analyzer.py --check-opal-alignment --mapping-file ./opal-mapping.json
"""

import argparse
import json
import os
import sys
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ContentAnalysisResult:
    """Results from content analysis"""
    page_path: str
    tier1: str
    tier2: str
    tier3: Optional[str]
    has_opal_data: bool
    is_generic: bool
    opal_alignment_score: float
    content_quality_score: float
    recommendations: List[str]
    missing_opal_integrations: List[str]
    suggested_improvements: List[str]


class OSAContentAnalyzer:
    """Analyzes OSA content for OPAL integration and quality"""

    def __init__(self, opal_mapping_path: Optional[str] = None):
        self.opal_mapping = self._load_opal_mapping(opal_mapping_path)
        self.generic_indicators = [
            "generic recommendation",
            "standard practice",
            "general suggestion",
            "typical approach",
            "common strategy",
            "placeholder content",
            "[TODO]",
            "example data",
            "sample content"
        ]

        self.opal_data_indicators = [
            "based on your data",
            "your current performance",
            "specific to your site",
            "from your analytics",
            "your audience behavior",
            "your content performance",
            "personalized recommendation",
            "data-driven insight"
        ]

    def _load_opal_mapping(self, mapping_path: Optional[str]) -> Dict:
        """Load OPAL mapping configuration"""
        if mapping_path and os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                return json.load(f)

        # Default OSA OPAL mapping structure
        return {
            "Strategy Plans": {
                "OSA": {
                    "opal_instructions": ["company-overview", "marketing-strategy"],
                    "opal_agents": ["strategy_workflow"],
                    "opal_tools": ["workflow_data_sharing"],
                    "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
                }
            },
            "Analytics Insights": {
                "Content": {
                    "opal_instructions": ["content-guidelines", "brand-tone-guidelines"],
                    "opal_agents": ["content_review"],
                    "opal_tools": ["workflow_data_sharing"]
                }
            },
            "Experience Optimization": {
                "Content": {
                    "opal_instructions": ["content-guidelines", "brand-tone-guidelines"],
                    "opal_agents": ["content_review"],
                    "opal_tools": ["osa_contentrecs_tools"]
                }
            }
        }

    def analyze_content(self, content: str, tier1: str, tier2: str, tier3: Optional[str] = None) -> ContentAnalysisResult:
        """Analyze content for OPAL integration and quality"""
        page_path = f"/engine/results/{tier1.lower().replace(' ', '-')}/{tier2.lower().replace(' ', '-')}"
        if tier3:
            page_path += f"/{tier3.lower().replace(' ', '-')}"

        # Check for generic content indicators
        is_generic = self._check_generic_content(content)

        # Check for OPAL data integration
        has_opal_data = self._check_opal_data_integration(content)

        # Calculate alignment score
        opal_alignment_score = self._calculate_opal_alignment(tier1, tier2, tier3, content)

        # Calculate content quality score
        content_quality_score = self._calculate_content_quality(content, has_opal_data, is_generic)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            content, tier1, tier2, tier3, has_opal_data, is_generic
        )

        # Identify missing OPAL integrations
        missing_integrations = self._identify_missing_opal_integrations(tier1, tier2, content)

        # Generate improvement suggestions
        improvements = self._generate_improvement_suggestions(
            content, tier1, tier2, tier3, opal_alignment_score
        )

        return ContentAnalysisResult(
            page_path=page_path,
            tier1=tier1,
            tier2=tier2,
            tier3=tier3,
            has_opal_data=has_opal_data,
            is_generic=is_generic,
            opal_alignment_score=opal_alignment_score,
            content_quality_score=content_quality_score,
            recommendations=recommendations,
            missing_opal_integrations=missing_integrations,
            suggested_improvements=improvements
        )

    def _check_generic_content(self, content: str) -> bool:
        """Check if content contains generic indicators"""
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in self.generic_indicators)

    def _check_opal_data_integration(self, content: str) -> bool:
        """Check if content leverages OPAL data"""
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in self.opal_data_indicators)

    def _calculate_opal_alignment(self, tier1: str, tier2: str, tier3: Optional[str], content: str) -> float:
        """Calculate how well content aligns with OPAL mapping expectations"""
        score = 0.0
        max_score = 100.0

        # Check if tier structure exists in mapping
        if tier1 in self.opal_mapping:
            score += 25
            if tier2 in self.opal_mapping[tier1]:
                score += 25
                mapping = self.opal_mapping[tier1][tier2]

                # Check for OPAL instructions integration
                if 'opal_instructions' in mapping:
                    for instruction in mapping['opal_instructions']:
                        if instruction.replace('-', ' ') in content.lower():
                            score += 10

                # Check for OPAL agents integration
                if 'opal_agents' in mapping:
                    for agent in mapping['opal_agents']:
                        if agent.replace('_', ' ') in content.lower():
                            score += 10

                # Check for OPAL tools integration
                if 'opal_tools' in mapping:
                    for tool in mapping['opal_tools']:
                        if tool.replace('_', ' ') in content.lower():
                            score += 10

                # Check for DXP tools integration
                if 'optimizely_dxp_tools' in mapping:
                    for dxp_tool in mapping['optimizely_dxp_tools']:
                        if dxp_tool.lower() in content.lower():
                            score += 5

        return min(score, max_score)

    def _calculate_content_quality(self, content: str, has_opal_data: bool, is_generic: bool) -> float:
        """Calculate overall content quality score"""
        score = 50.0  # Base score

        # Boost for OPAL data integration
        if has_opal_data:
            score += 30

        # Penalty for generic content
        if is_generic:
            score -= 40

        # Length and structure bonus
        if len(content) > 200:
            score += 10
        if len(content.split('\n')) > 3:  # Multi-paragraph content
            score += 10

        return max(0, min(100, score))

    def _generate_recommendations(
        self, content: str, tier1: str, tier2: str, tier3: Optional[str],
        has_opal_data: bool, is_generic: bool
    ) -> List[str]:
        """Generate specific recommendations for content improvement"""
        recommendations = []

        if is_generic:
            recommendations.append(
                "Replace generic content with data-driven insights from OPAL integration"
            )

        if not has_opal_data:
            recommendations.append(
                "Integrate specific OPAL data points and analytics for personalized content"
            )

        # Tier-specific recommendations
        if tier1 == "Strategy Plans":
            if "company-overview" not in content.lower():
                recommendations.append("Include company-specific context from OPAL instructions")
            if "marketing-strategy" not in content.lower():
                recommendations.append("Integrate marketing strategy data from OPAL workflow")

        elif tier1 == "Analytics Insights":
            if "performance" not in content.lower():
                recommendations.append("Add specific performance metrics and analytics data")
            if "audience" not in content.lower():
                recommendations.append("Include audience-specific insights from OPAL agents")

        elif tier1 == "Experience Optimization":
            if "optimization" not in content.lower():
                recommendations.append("Include specific optimization recommendations")
            if "testing" not in content.lower():
                recommendations.append("Add A/B testing insights and recommendations")

        return recommendations

    def _identify_missing_opal_integrations(self, tier1: str, tier2: str, content: str) -> List[str]:
        """Identify missing OPAL integrations for the content"""
        missing = []

        if tier1 in self.opal_mapping and tier2 in self.opal_mapping[tier1]:
            mapping = self.opal_mapping[tier1][tier2]

            # Check missing OPAL instructions
            for instruction in mapping.get('opal_instructions', []):
                if instruction.replace('-', ' ') not in content.lower():
                    missing.append(f"OPAL Instruction: {instruction}")

            # Check missing OPAL agents
            for agent in mapping.get('opal_agents', []):
                if agent.replace('_', ' ') not in content.lower():
                    missing.append(f"OPAL Agent: {agent}")

            # Check missing OPAL tools
            for tool in mapping.get('opal_tools', []):
                if tool.replace('_', ' ') not in content.lower():
                    missing.append(f"OPAL Tool: {tool}")

        return missing

    def _generate_improvement_suggestions(
        self, content: str, tier1: str, tier2: str, tier3: Optional[str], alignment_score: float
    ) -> List[str]:
        """Generate specific improvement suggestions"""
        suggestions = []

        if alignment_score < 50:
            suggestions.append("Integrate more OPAL-specific data and instructions")
            suggestions.append("Align content with the expected OPAL mapping structure")

        if len(content) < 100:
            suggestions.append("Expand content with more detailed, data-driven insights")

        if "recommendation" not in content.lower():
            suggestions.append("Add specific, actionable recommendations")

        if tier1 == "Strategy Plans" and "timeline" not in content.lower():
            suggestions.append("Include implementation timeline and phases")

        if tier1 == "Analytics Insights" and "metric" not in content.lower():
            suggestions.append("Add specific metrics and KPI tracking")

        return suggestions


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="OSA Content Review and Analysis")
    parser.add_argument("--tier1", help="Tier 1 section name")
    parser.add_argument("--tier2", help="Tier 2 section name")
    parser.add_argument("--tier3", help="Tier 3 section name (optional)")
    parser.add_argument("--content-file", help="Path to content file to analyze")
    parser.add_argument("--content", help="Content text to analyze directly")
    parser.add_argument("--mapping-file", help="Path to OPAL mapping JSON file")
    parser.add_argument("--output-json", help="Output results as JSON file")
    parser.add_argument("--check-opal-alignment", action="store_true",
                       help="Check OPAL alignment for all content")

    args = parser.parse_args()

    if not (args.tier1 and args.tier2):
        print("Error: --tier1 and --tier2 are required")
        sys.exit(1)

    # Initialize analyzer
    analyzer = OSAContentAnalyzer(args.mapping_file)

    # Get content to analyze
    content = ""
    if args.content_file:
        with open(args.content_file, 'r') as f:
            content = f.read()
    elif args.content:
        content = args.content
    else:
        print("Error: Either --content-file or --content is required")
        sys.exit(1)

    # Analyze content
    result = analyzer.analyze_content(content, args.tier1, args.tier2, args.tier3)

    # Output results
    if args.output_json:
        with open(args.output_json, 'w') as f:
            json.dump(result.__dict__, f, indent=2)
        print(f"Results saved to {args.output_json}")
    else:
        # Print human-readable report
        print("\n" + "="*60)
        print(f"OSA CONTENT ANALYSIS REPORT")
        print("="*60)
        print(f"Page Path: {result.page_path}")
        print(f"Tier Structure: {result.tier1} > {result.tier2}" + (f" > {result.tier3}" if result.tier3 else ""))
        print(f"Has OPAL Data: {'✅' if result.has_opal_data else '❌'}")
        print(f"Is Generic: {'❌' if result.is_generic else '✅'}")
        print(f"OPAL Alignment Score: {result.opal_alignment_score:.1f}/100")
        print(f"Content Quality Score: {result.content_quality_score:.1f}/100")

        if result.recommendations:
            print(f"\n📋 RECOMMENDATIONS:")
            for i, rec in enumerate(result.recommendations, 1):
                print(f"  {i}. {rec}")

        if result.missing_opal_integrations:
            print(f"\n🔍 MISSING OPAL INTEGRATIONS:")
            for integration in result.missing_opal_integrations:
                print(f"  • {integration}")

        if result.suggested_improvements:
            print(f"\n💡 SUGGESTED IMPROVEMENTS:")
            for improvement in result.suggested_improvements:
                print(f"  • {improvement}")

        print("\n" + "="*60)


if __name__ == "__main__":
    main()