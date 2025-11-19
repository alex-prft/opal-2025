#!/usr/bin/env python3
"""
OPAL Integration Validator

This script validates OPAL integration across OSA results pages and ensures
alignment with the results-content-optimizer agent patterns.

Usage:
    python3 opal_integration_validator.py --validate-page /engine/results/strategy-plans/osa
    python3 opal_integration_validator.py --validate-all-results
    python3 opal_integration_validator.py --check-mapping-alignment
"""

import argparse
import json
import os
import re
import sys
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass
from pathlib import Path


@dataclass
class OPALValidationResult:
    """Results from OPAL integration validation"""
    page_path: str
    tier1: str
    tier2: str
    tier3: Optional[str]
    has_required_opal_instructions: bool
    has_required_opal_agents: bool
    has_required_opal_tools: bool
    has_dxp_tools_integration: bool
    validation_score: float
    missing_components: List[str]
    validation_errors: List[str]
    optimization_opportunities: List[str]


class OPALIntegrationValidator:
    """Validates OPAL integration across OSA results pages"""

    def __init__(self, opal_mapping_path: Optional[str] = None):
        self.opal_mapping = self._load_opal_mapping(opal_mapping_path)
        self.required_patterns = {
            'opal_instructions': [
                r'company[_\s-]overview',
                r'marketing[_\s-]strategy',
                r'content[_\s-]guidelines',
                r'brand[_\s-]tone[_\s-]guidelines',
                r'data[_\s-]governance[_\s-]privacy',
                r'technical[_\s-]implementation[_\s-]guidelines',
                r'kpi[_\s-]experimentation',
                r'personalization[_\s-]maturity[_\s-]rubric',
                r'personas'
            ],
            'opal_agents': [
                r'strategy[_\s-]workflow',
                r'content[_\s-]review',
                r'audience[_\s-]suggester',
                r'experiment[_\s-]blueprinter',
                r'personalization[_\s-]idea[_\s-]generator',
                r'geo[_\s-]audit',
                r'cmp[_\s-]organizer'
            ],
            'opal_tools': [
                r'workflow[_\s-]data[_\s-]sharing',
                r'osa[_\s-]contentrecs[_\s-]tools',
                r'osa[_\s-]cmspaas[_\s-]tools',
                r'osa[_\s-]odp[_\s-]tools',
                r'osa[_\s-]webx[_\s-]tools',
                r'osa[_\s-]cmp[_\s-]tools'
            ],
            'dxp_tools': [
                r'content\s+recs?',
                r'cms',
                r'odp',
                r'webx?',
                r'cmp'
            ]
        }

    def _load_opal_mapping(self, mapping_path: Optional[str]) -> Dict:
        """Load OPAL mapping configuration"""
        if mapping_path and os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                return json.load(f)

        # Load from default location or return built-in mapping
        default_paths = [
            './src/data/opal-mapping.json',
            '../../../src/data/opal-mapping.json',
            './opal-mapping.json'
        ]

        for path in default_paths:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    return json.load(f)

        # Return minimal mapping structure
        return {
            "Strategy Plans": {
                "OSA": {
                    "opal_instructions": ["company-overview", "marketing-strategy"],
                    "opal_agents": ["strategy_workflow"],
                    "opal_tools": ["workflow_data_sharing"],
                    "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
                }
            }
        }

    def validate_page(self, content: str, tier1: str, tier2: str, tier3: Optional[str] = None) -> OPALValidationResult:
        """Validate OPAL integration for a specific page"""
        page_path = f"/engine/results/{tier1.lower().replace(' ', '-')}/{tier2.lower().replace(' ', '-')}"
        if tier3:
            page_path += f"/{tier3.lower().replace(' ', '-')}"

        # Get expected OPAL components for this tier combination
        expected_components = self._get_expected_components(tier1, tier2)

        # Validate each component type
        has_instructions = self._validate_opal_instructions(content, expected_components.get('opal_instructions', []))
        has_agents = self._validate_opal_agents(content, expected_components.get('opal_agents', []))
        has_tools = self._validate_opal_tools(content, expected_components.get('opal_tools', []))
        has_dxp_tools = self._validate_dxp_tools(content, expected_components.get('optimizely_dxp_tools', []))

        # Calculate validation score
        validation_score = self._calculate_validation_score(
            has_instructions, has_agents, has_tools, has_dxp_tools
        )

        # Identify missing components
        missing_components = self._identify_missing_components(
            content, expected_components
        )

        # Identify validation errors
        validation_errors = self._identify_validation_errors(
            content, tier1, tier2, tier3, expected_components
        )

        # Generate optimization opportunities
        optimization_opportunities = self._generate_optimization_opportunities(
            content, tier1, tier2, expected_components, validation_score
        )

        return OPALValidationResult(
            page_path=page_path,
            tier1=tier1,
            tier2=tier2,
            tier3=tier3,
            has_required_opal_instructions=has_instructions,
            has_required_opal_agents=has_agents,
            has_required_opal_tools=has_tools,
            has_dxp_tools_integration=has_dxp_tools,
            validation_score=validation_score,
            missing_components=missing_components,
            validation_errors=validation_errors,
            optimization_opportunities=optimization_opportunities
        )

    def _get_expected_components(self, tier1: str, tier2: str) -> Dict:
        """Get expected OPAL components for tier combination"""
        if tier1 in self.opal_mapping and tier2 in self.opal_mapping[tier1]:
            return self.opal_mapping[tier1][tier2]
        return {}

    def _validate_opal_instructions(self, content: str, expected_instructions: List[str]) -> bool:
        """Validate OPAL instructions integration"""
        content_lower = content.lower()
        found_count = 0

        for instruction in expected_instructions:
            instruction_pattern = instruction.replace('-', '[_\\s-]')
            if re.search(instruction_pattern, content_lower):
                found_count += 1

        # At least 50% of expected instructions should be present
        return found_count >= len(expected_instructions) * 0.5 if expected_instructions else True

    def _validate_opal_agents(self, content: str, expected_agents: List[str]) -> bool:
        """Validate OPAL agents integration"""
        content_lower = content.lower()
        found_count = 0

        for agent in expected_agents:
            agent_pattern = agent.replace('_', '[_\\s-]')
            if re.search(agent_pattern, content_lower):
                found_count += 1

        # At least one expected agent should be referenced
        return found_count > 0 if expected_agents else True

    def _validate_opal_tools(self, content: str, expected_tools: List[str]) -> bool:
        """Validate OPAL tools integration"""
        content_lower = content.lower()
        found_count = 0

        for tool in expected_tools:
            tool_pattern = tool.replace('_', '[_\\s-]')
            if re.search(tool_pattern, content_lower):
                found_count += 1

        # At least one expected tool should be referenced
        return found_count > 0 if expected_tools else True

    def _validate_dxp_tools(self, content: str, expected_dxp_tools: List[str]) -> bool:
        """Validate Optimizely DXP tools integration"""
        content_lower = content.lower()
        found_count = 0

        for dxp_tool in expected_dxp_tools:
            if dxp_tool.lower() in content_lower:
                found_count += 1

        # At least 25% of expected DXP tools should be mentioned
        return found_count >= len(expected_dxp_tools) * 0.25 if expected_dxp_tools else True

    def _calculate_validation_score(self, has_instructions: bool, has_agents: bool,
                                  has_tools: bool, has_dxp_tools: bool) -> float:
        """Calculate overall validation score"""
        score = 0.0
        max_score = 100.0

        if has_instructions:
            score += 30
        if has_agents:
            score += 30
        if has_tools:
            score += 25
        if has_dxp_tools:
            score += 15

        return score

    def _identify_missing_components(self, content: str, expected_components: Dict) -> List[str]:
        """Identify missing OPAL components"""
        missing = []
        content_lower = content.lower()

        # Check missing OPAL instructions
        for instruction in expected_components.get('opal_instructions', []):
            if instruction.replace('-', ' ') not in content_lower:
                missing.append(f"OPAL Instruction: {instruction}")

        # Check missing OPAL agents
        for agent in expected_components.get('opal_agents', []):
            if agent.replace('_', ' ') not in content_lower:
                missing.append(f"OPAL Agent: {agent}")

        # Check missing OPAL tools
        for tool in expected_components.get('opal_tools', []):
            if tool.replace('_', ' ') not in content_lower:
                missing.append(f"OPAL Tool: {tool}")

        # Check missing DXP tools
        for dxp_tool in expected_components.get('optimizely_dxp_tools', []):
            if dxp_tool.lower() not in content_lower:
                missing.append(f"DXP Tool: {dxp_tool}")

        return missing

    def _identify_validation_errors(self, content: str, tier1: str, tier2: str,
                                  tier3: Optional[str], expected_components: Dict) -> List[str]:
        """Identify validation errors"""
        errors = []

        # Check for generic content indicators
        generic_indicators = [
            "placeholder content",
            "[TODO]",
            "example data",
            "sample content",
            "generic recommendation"
        ]

        content_lower = content.lower()
        for indicator in generic_indicators:
            if indicator in content_lower:
                errors.append(f"Generic content detected: '{indicator}'")

        # Check for missing tier-specific requirements
        if tier1 == "Strategy Plans" and "strategy" not in content_lower:
            errors.append("Strategy Plans content missing strategic focus")

        if tier1 == "Analytics Insights" and "data" not in content_lower:
            errors.append("Analytics Insights content missing data references")

        if tier1 == "Experience Optimization" and "optimization" not in content_lower:
            errors.append("Experience Optimization content missing optimization focus")

        # Check for minimum content length
        if len(content.strip()) < 50:
            errors.append("Content too short for meaningful OPAL integration")

        return errors

    def _generate_optimization_opportunities(self, content: str, tier1: str, tier2: str,
                                           expected_components: Dict, validation_score: float) -> List[str]:
        """Generate optimization opportunities"""
        opportunities = []

        if validation_score < 70:
            opportunities.append("Integrate more OPAL-specific components to improve alignment")

        if validation_score < 50:
            opportunities.append("Consider using results-content-optimizer agent for comprehensive review")

        # Tier-specific opportunities
        if tier1 == "Strategy Plans":
            if "timeline" not in content.lower():
                opportunities.append("Add implementation timeline from strategy workflow agent")
            if "kpi" not in content.lower():
                opportunities.append("Include KPI tracking and measurement framework")

        if tier1 == "Analytics Insights":
            if "metric" not in content.lower():
                opportunities.append("Add specific metrics and performance indicators")
            if "trend" not in content.lower():
                opportunities.append("Include trending data and behavioral insights")

        if tier1 == "Experience Optimization":
            if "test" not in content.lower():
                opportunities.append("Add A/B testing recommendations and results")
            if "personalization" not in content.lower():
                opportunities.append("Include personalization opportunities and strategies")

        # Check for DXP tool-specific opportunities
        dxp_tools = expected_components.get('optimizely_dxp_tools', [])
        content_lower = content.lower()

        for tool in dxp_tools:
            if tool.lower() not in content_lower:
                opportunities.append(f"Integrate {tool} specific insights and recommendations")

        return opportunities

    def validate_all_results(self, results_directory: str = "./src/app/engine/results") -> List[OPALValidationResult]:
        """Validate all results pages"""
        results = []

        if not os.path.exists(results_directory):
            print(f"Results directory not found: {results_directory}")
            return results

        # Walk through results directory structure
        for root, dirs, files in os.walk(results_directory):
            for file in files:
                if file.endswith('.tsx') or file.endswith('.ts'):
                    file_path = os.path.join(root, file)
                    # Extract tier information from path
                    path_parts = file_path.replace(results_directory, '').strip('/').split('/')

                    tier1 = tier2 = tier3 = None
                    if len(path_parts) >= 2:
                        tier1 = path_parts[0].replace('-', ' ').title()
                        tier2 = path_parts[1].replace('-', ' ').title()
                        if len(path_parts) >= 3:
                            tier3 = path_parts[2].replace('-', ' ').title()

                    if tier1 and tier2:
                        try:
                            with open(file_path, 'r') as f:
                                content = f.read()
                            result = self.validate_page(content, tier1, tier2, tier3)
                            results.append(result)
                        except Exception as e:
                            print(f"Error processing {file_path}: {e}")

        return results


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="OPAL Integration Validator")
    parser.add_argument("--tier1", help="Tier 1 section name")
    parser.add_argument("--tier2", help="Tier 2 section name")
    parser.add_argument("--tier3", help="Tier 3 section name (optional)")
    parser.add_argument("--content-file", help="Path to content file to validate")
    parser.add_argument("--content", help="Content text to validate directly")
    parser.add_argument("--mapping-file", help="Path to OPAL mapping JSON file")
    parser.add_argument("--validate-all-results", action="store_true",
                       help="Validate all results pages")
    parser.add_argument("--output-json", help="Output results as JSON file")
    parser.add_argument("--min-score", type=float, default=50.0,
                       help="Minimum validation score threshold")

    args = parser.parse_args()

    # Initialize validator
    validator = OPALIntegrationValidator(args.mapping_file)

    if args.validate_all_results:
        # Validate all results pages
        results = validator.validate_all_results()

        if args.output_json:
            with open(args.output_json, 'w') as f:
                json.dump([result.__dict__ for result in results], f, indent=2)
            print(f"Validation results saved to {args.output_json}")
        else:
            print(f"\nValidated {len(results)} pages")
            failing_pages = [r for r in results if r.validation_score < args.min_score]
            print(f"Pages below threshold ({args.min_score}): {len(failing_pages)}")

            for result in failing_pages[:5]:  # Show top 5 failing pages
                print(f"\n❌ {result.page_path} - Score: {result.validation_score:.1f}")
                for error in result.validation_errors[:3]:
                    print(f"  • {error}")

    else:
        # Validate single page
        if not (args.tier1 and args.tier2):
            print("Error: --tier1 and --tier2 are required for single page validation")
            sys.exit(1)

        # Get content to validate
        content = ""
        if args.content_file:
            with open(args.content_file, 'r') as f:
                content = f.read()
        elif args.content:
            content = args.content
        else:
            print("Error: Either --content-file or --content is required")
            sys.exit(1)

        # Validate content
        result = validator.validate_page(content, args.tier1, args.tier2, args.tier3)

        # Output results
        if args.output_json:
            with open(args.output_json, 'w') as f:
                json.dump(result.__dict__, f, indent=2)
            print(f"Validation results saved to {args.output_json}")
        else:
            # Print human-readable report
            status = "✅" if result.validation_score >= args.min_score else "❌"
            print(f"\n{status} OPAL INTEGRATION VALIDATION")
            print("="*50)
            print(f"Page: {result.page_path}")
            print(f"Validation Score: {result.validation_score:.1f}/100")
            print(f"OPAL Instructions: {'✅' if result.has_required_opal_instructions else '❌'}")
            print(f"OPAL Agents: {'✅' if result.has_required_opal_agents else '❌'}")
            print(f"OPAL Tools: {'✅' if result.has_required_opal_tools else '❌'}")
            print(f"DXP Tools: {'✅' if result.has_dxp_tools_integration else '❌'}")

            if result.validation_errors:
                print(f"\n❌ VALIDATION ERRORS:")
                for error in result.validation_errors:
                    print(f"  • {error}")

            if result.missing_components:
                print(f"\n🔍 MISSING COMPONENTS:")
                for component in result.missing_components:
                    print(f"  • {component}")

            if result.optimization_opportunities:
                print(f"\n💡 OPTIMIZATION OPPORTUNITIES:")
                for opportunity in result.optimization_opportunities:
                    print(f"  • {opportunity}")


if __name__ == "__main__":
    main()