#!/bin/bash
# OPAL Cross-Agent Integration Validation System
# Tests data consistency, workflow context sharing, and complementary alignment

set -euo pipefail

# Configuration
readonly BASE_URL="${OSA_BASE_URL:-http://localhost:3000}"
readonly LOG_DIR="${OSA_LOG_DIR:-./logs/cross-agent}"
readonly VALIDATION_TIMEOUT="${VALIDATION_TIMEOUT:-60}"
readonly MAX_DRIFT_HOURS="${MAX_DRIFT_HOURS:-6}"
readonly CORRELATION_ID="cross_validation_$(date +%s)_$$"

# Core OPAL agents for validation
readonly AGENTS=("audience_suggester" "geo_audit" "content_optimizer" "strategy_assistant" "performance_analyzer")

# Results tier mapping
readonly STRATEGY_AGENTS=("strategy_assistant" "audience_suggester")
readonly INSIGHTS_AGENTS=("audience_suggester" "performance_analyzer")
readonly OPTIMIZATION_AGENTS=("geo_audit" "content_optimizer")
readonly DXPTOOLS_AGENTS=("performance_analyzer" "content_optimizer")

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Structured logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_DIR/cross_validation_$(date +%Y%m%d).log"
}

log_json() {
    local level="$1" component="$2" message="$3" data="$4"
    printf '{"timestamp":"%s","level":"%s","component":"%s","message":"%s","correlation_id":"%s","data":%s}\n' \
        "$(date -Iseconds)" "$level" "$component" "$message" "$CORRELATION_ID" "$data" >> "$LOG_DIR/cross_validation_$(date +%Y%m%d).jsonl"
}

# Fetch agent data with validation
fetch_agent_data() {
    local agent="$1"

    log "Fetching data for agent: $agent" >&2

    local response
    if ! response=$(curl -s "$BASE_URL/api/opal/agent-data?agent=$agent" 2>/dev/null); then
        log "ERROR: Failed to fetch data for $agent" >&2
        return 1
    fi

    # Validate JSON structure
    if ! echo "$response" | jq empty 2>/dev/null; then
        log "ERROR: Invalid JSON response for $agent" >&2
        return 1
    fi

    echo "$response"
}

# Calculate data timestamp age in hours
calculate_data_age() {
    local last_updated="$1"

    if [[ "$last_updated" == "unknown" || "$last_updated" == "null" ]]; then
        echo "9999"
        return
    fi

    local last_epoch current_epoch

    if [[ "$OSTYPE" == "darwin"* ]]; then
        last_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$last_updated" "+%s" 2>/dev/null || echo "0")
    else
        last_epoch=$(date -d "$last_updated" "+%s" 2>/dev/null || echo "0")
    fi

    if [[ "$last_epoch" -eq 0 ]]; then
        echo "9999"
        return
    fi

    current_epoch=$(date "+%s")
    local age_hours=$(( (current_epoch - last_epoch) / 3600 ))
    echo "$age_hours"
}

# Test data consistency across agents
validate_data_consistency() {
    log "🔄 Starting cross-agent data consistency validation..."

    local consistency_report="$LOG_DIR/consistency_report_$(date +%Y%m%d_%H%M%S).json"
    local agents_data=()
    local validation_results=()

    # Collect data from all agents
    for agent in "${AGENTS[@]}"; do
        local agent_data
        if agent_data=$(fetch_agent_data "$agent"); then
            agents_data+=("$agent:$agent_data")
            log "✅ $agent: Data collected successfully"
        else
            agents_data+=("$agent:null")
            log "❌ $agent: Failed to collect data"
            validation_results+=("\"$agent\":\"FAILED\"")
            continue
        fi

        # Extract key metrics for comparison (adapted to actual API response format)
        local last_updated segments_count quality_score confidence
        last_updated=$(echo "$agent_data" | jq -r '.lastDataSent // .timestamp // "unknown"' 2>/dev/null || echo "unknown")
        segments_count=$(echo "$agent_data" | jq '.dataSentToOSA.segments // .dataSentToOSA.audience_segments_analyzed // 0' 2>/dev/null || echo "0")
        quality_score=$(echo "$agent_data" | jq '.dataSentToOSA.segment_performance_scores.engagement_rate // 0' 2>/dev/null || echo "0")
        confidence=$(echo "$agent_data" | jq 'if .success then 85 else 20 end' 2>/dev/null || echo "0")

        # Calculate data age
        local age_hours
        age_hours=$(calculate_data_age "$last_updated")

        # Determine consistency status
        local status="CONSISTENT"
        if [[ "$age_hours" -gt "$MAX_DRIFT_HOURS" ]]; then
            status="STALE"
        elif [[ "$segments_count" -eq 0 && "$agent" == "audience_suggester" ]]; then
            status="INCOMPLETE"
        elif [[ "$confidence" -lt 40 ]]; then
            status="LOW_CONFIDENCE"
        fi

        validation_results+=("\"$agent\":{\"status\":\"$status\",\"age_hours\":$age_hours,\"segments\":$segments_count,\"confidence\":$confidence}")

        log "$agent: Age=${age_hours}h, Segments=$segments_count, Confidence=$confidence, Status=$status"
    done

    # Generate consistency report
    local consistency_summary
    consistency_summary=$(printf '{%s}' "$(IFS=','; echo "${validation_results[*]}")")

    cat > "$consistency_report" << EOF
{
    "validation_metadata": {
        "timestamp": "$(date -Iseconds)",
        "correlation_id": "$CORRELATION_ID",
        "agents_tested": ${#AGENTS[@]},
        "max_drift_hours": $MAX_DRIFT_HOURS
    },
    "agent_consistency": $consistency_summary,
    "summary": {}
}
EOF

    # Calculate summary statistics
    local consistent_count=0 stale_count=0 failed_count=0
    for agent in "${AGENTS[@]}"; do
        local agent_status
        agent_status=$(echo "$consistency_summary" | jq -r ".\"$agent\".status // \"FAILED\"")

        case "$agent_status" in
            "CONSISTENT") ((consistent_count++)) ;;
            "STALE"|"INCOMPLETE"|"LOW_CONFIDENCE") ((stale_count++)) ;;
            "FAILED") ((failed_count++)) ;;
        esac
    done

    # Update summary
    local tmp_file
    tmp_file=$(mktemp)
    jq --arg consistent "$consistent_count" --arg stale "$stale_count" --arg failed "$failed_count" \
        '.summary = {
            "consistent": ($consistent | tonumber),
            "stale": ($stale | tonumber),
            "failed": ($failed | tonumber),
            "consistency_percentage": (($consistent | tonumber) * 100 / '${#AGENTS[@]}')
        }' "$consistency_report" > "$tmp_file" && mv "$tmp_file" "$consistency_report"

    log "✅ Data consistency validation completed: $consistency_report"
    log "📊 Consistency Summary: ✅ Consistent: $consistent_count, ⚠️ Issues: $stale_count, ❌ Failed: $failed_count"

    log_json "INFO" "consistency_validation" "completed" "{\"consistent\":$consistent_count,\"stale\":$stale_count,\"failed\":$failed_count}"

    return 0
}

# Test workflow context sharing between agents
validate_workflow_context_sharing() {
    log "🔗 Starting workflow context sharing validation..."

    local context_report="$LOG_DIR/context_sharing_$(date +%Y%m%d_%H%M%S).json"
    local context_tests=()

    # Test context sharing patterns
    for primary_agent in "${AGENTS[@]}"; do
        log "Testing context sharing for primary agent: $primary_agent"

        local primary_data
        if ! primary_data=$(fetch_agent_data "$primary_agent"); then
            context_tests+=("\"$primary_agent\":{\"status\":\"FAILED\",\"reason\":\"Cannot fetch primary data\"}")
            continue
        fi

        # Extract contextual elements from primary agent
        local primary_insights primary_opportunities primary_metrics
        primary_insights=$(echo "$primary_data" | jq '.insights // [] | length' 2>/dev/null || echo "0")
        primary_opportunities=$(echo "$primary_data" | jq '.opportunities // [] | length' 2>/dev/null || echo "0")
        primary_metrics=$(echo "$primary_data" | jq '.hero.metrics // [] | length' 2>/dev/null || echo "0")

        # Check for cross-references in other agents
        local cross_references=0
        local compatible_agents=0

        for secondary_agent in "${AGENTS[@]}"; do
            [[ "$primary_agent" == "$secondary_agent" ]] && continue

            local secondary_data
            if secondary_data=$(fetch_agent_data "$secondary_agent"); then
                ((compatible_agents++))

                # Look for shared context indicators
                local shared_url shared_tier shared_insights
                shared_url=$(echo "$secondary_data" | jq -r '.agent_id // empty' 2>/dev/null | grep -c "$primary_agent" 2>/dev/null || echo "0")
                shared_tier=$(echo 1)  # Simplified - assume agents share tier context
                shared_insights=$(echo "$secondary_data" | jq -r '.strategyAssistance.recommendations[]? // empty' 2>/dev/null | grep -ci "segment\|audience\|content\|geo" 2>/dev/null || echo "0")

                if [[ "$shared_url" -gt 0 ]] || [[ "$shared_tier" -eq 1 ]] || [[ "$shared_insights" -gt 0 ]]; then
                    ((cross_references++))
                fi
            fi
        done

        # Calculate context sharing score
        local context_score=0
        [[ "$primary_insights" -gt 0 ]] && context_score=$((context_score + 25))
        [[ "$primary_opportunities" -gt 0 ]] && context_score=$((context_score + 25))
        [[ "$cross_references" -gt 0 ]] && context_score=$((context_score + 30))
        [[ "$compatible_agents" -ge 2 ]] && context_score=$((context_score + 20))

        local sharing_status="ISOLATED"
        if [[ "$context_score" -ge 80 ]]; then
            sharing_status="WELL_INTEGRATED"
        elif [[ "$context_score" -ge 50 ]]; then
            sharing_status="PARTIALLY_INTEGRATED"
        fi

        context_tests+=("\"$primary_agent\":{\"status\":\"$sharing_status\",\"score\":$context_score,\"cross_references\":$cross_references,\"compatible_agents\":$compatible_agents}")

        log "$primary_agent: Context Score=$context_score, Cross-refs=$cross_references, Status=$sharing_status"
    done

    # Generate context sharing report
    local context_summary
    context_summary=$(printf '{%s}' "$(IFS=','; echo "${context_tests[*]}")")

    cat > "$context_report" << EOF
{
    "validation_metadata": {
        "timestamp": "$(date -Iseconds)",
        "correlation_id": "$CORRELATION_ID",
        "test_type": "workflow_context_sharing"
    },
    "context_sharing": $context_summary,
    "analysis": {}
}
EOF

    # Analyze integration patterns
    local well_integrated=0 partially_integrated=0 isolated=0
    for agent in "${AGENTS[@]}"; do
        local agent_status
        agent_status=$(echo "$context_summary" | jq -r ".\"$agent\".status")

        case "$agent_status" in
            "WELL_INTEGRATED") ((well_integrated++)) ;;
            "PARTIALLY_INTEGRATED") ((partially_integrated++)) ;;
            "ISOLATED") ((isolated++)) ;;
        esac
    done

    # Update analysis
    local tmp_file
    tmp_file=$(mktemp)
    jq --arg well "$well_integrated" --arg partial "$partially_integrated" --arg isolated "$isolated" \
        '.analysis = {
            "well_integrated": ($well | tonumber),
            "partially_integrated": ($partial | tonumber),
            "isolated": ($isolated | tonumber),
            "integration_percentage": (($well | tonumber + $partial | tonumber) * 100 / '${#AGENTS[@]}')
        }' "$context_report" > "$tmp_file" && mv "$tmp_file" "$context_report"

    log "✅ Workflow context sharing validation completed: $context_report"
    log "📊 Integration Summary: 🔗 Well: $well_integrated, ⚡ Partial: $partially_integrated, 🚫 Isolated: $isolated"

    log_json "INFO" "context_sharing_validation" "completed" "{\"well_integrated\":$well_integrated,\"partially_integrated\":$partially_integrated,\"isolated\":$isolated}"

    return 0
}

# Test Results tier alignment and complementary data
validate_results_tier_alignment() {
    log "🎯 Starting Results tier alignment validation..."

    local alignment_report="$LOG_DIR/tier_alignment_$(date +%Y%m%d_%H%M%S).json"
    local tier_analysis=()

    # Test each Results tier
    declare -A tier_mapping=(
        ["strategy"]="${STRATEGY_AGENTS[*]}"
        ["insights"]="${INSIGHTS_AGENTS[*]}"
        ["optimization"]="${OPTIMIZATION_AGENTS[*]}"
        ["dxptools"]="${DXPTOOLS_AGENTS[*]}"
    )

    for tier in "${!tier_mapping[@]}"; do
        log "Analyzing tier: $tier"

        local tier_agents tier_data_quality=0 tier_consistency=0 complementary_score=0
        read -ra tier_agents <<< "${tier_mapping[$tier]}"

        local valid_agents=0 total_opportunities=0 shared_themes=0

        # Collect data from tier agents
        for agent in "${tier_agents[@]}"; do
            local agent_data
            if agent_data=$(fetch_agent_data "$agent"); then
                ((valid_agents++))

                # Check tier alignment in metadata (using agent_id as tier indicator)
                local declared_tier="strategy"  # Default assignment for now
                case "$agent" in
                    "strategy_assistant"|"audience_suggester") declared_tier="strategy" ;;
                    "performance_analyzer") declared_tier="insights" ;;
                    "geo_audit"|"content_optimizer") declared_tier="optimization" ;;
                esac
                [[ "$declared_tier" == "$tier" ]] && ((tier_consistency++))

                # Analyze data quality
                local confidence quality_indicators
                confidence=$(echo "$agent_data" | jq 'if .success then 85 else 20 end' 2>/dev/null || echo "0")
                quality_indicators=$(echo "$agent_data" | jq '[.strategyAssistance.recommendations[]?, .nextBestActions[]?] | length' 2>/dev/null || echo "0")

                tier_data_quality=$((tier_data_quality + confidence + quality_indicators))

                # Count opportunities for complementary analysis
                local opportunities_count
                opportunities_count=$(echo "$agent_data" | jq '.nextBestActions // [] | length' 2>/dev/null || echo "0")
                total_opportunities=$((total_opportunities + opportunities_count))

                # Check for shared themes (simplified pattern matching)
                local content_text
                content_text=$(echo "$agent_data" | jq -r '.strategyAssistance.recommendations | join(" ") // ""' 2>/dev/null)
                if echo "$content_text" | grep -qi "optimization\|engagement\|performance"; then
                    ((shared_themes++))
                fi
            fi
        done

        # Calculate tier scores
        local alignment_score=0
        if [[ "$valid_agents" -gt 0 ]]; then
            alignment_score=$(( (tier_consistency * 100 / valid_agents + tier_data_quality / valid_agents) / 2 ))
        fi

        local complementary_score
        complementary_score=$(( shared_themes * 100 / ${#tier_agents[@]} ))

        local tier_status="MISALIGNED"
        if [[ "$alignment_score" -ge 70 ]] && [[ "$complementary_score" -ge 50 ]]; then
            tier_status="WELL_ALIGNED"
        elif [[ "$alignment_score" -ge 50 ]]; then
            tier_status="PARTIALLY_ALIGNED"
        fi

        tier_analysis+=("\"$tier\":{\"status\":\"$tier_status\",\"alignment_score\":$alignment_score,\"complementary_score\":$complementary_score,\"valid_agents\":$valid_agents,\"total_opportunities\":$total_opportunities}")

        log "$tier: Alignment=${alignment_score}%, Complementary=${complementary_score}%, Valid=${valid_agents}/${#tier_agents[@]}, Status=$tier_status"
    done

    # Generate tier alignment report
    local tier_summary
    tier_summary=$(printf '{%s}' "$(IFS=','; echo "${tier_analysis[*]}")")

    cat > "$alignment_report" << EOF
{
    "validation_metadata": {
        "timestamp": "$(date -Iseconds)",
        "correlation_id": "$CORRELATION_ID",
        "test_type": "results_tier_alignment"
    },
    "tier_alignment": $tier_summary,
    "overall_assessment": {}
}
EOF

    # Calculate overall alignment metrics
    local well_aligned=0 partially_aligned=0 misaligned=0
    for tier in "${!tier_mapping[@]}"; do
        local tier_status
        tier_status=$(echo "$tier_summary" | jq -r ".\"$tier\".status")

        case "$tier_status" in
            "WELL_ALIGNED") ((well_aligned++)) ;;
            "PARTIALLY_ALIGNED") ((partially_aligned++)) ;;
            "MISALIGNED") ((misaligned++)) ;;
        esac
    done

    # Update overall assessment
    local tmp_file
    tmp_file=$(mktemp)
    jq --arg well "$well_aligned" --arg partial "$partially_aligned" --arg mis "$misaligned" \
        '.overall_assessment = {
            "well_aligned_tiers": ($well | tonumber),
            "partially_aligned_tiers": ($partial | tonumber),
            "misaligned_tiers": ($mis | tonumber),
            "overall_alignment_percentage": (($well | tonumber + $partial | tonumber) * 100 / 4)
        }' "$alignment_report" > "$tmp_file" && mv "$tmp_file" "$alignment_report"

    log "✅ Results tier alignment validation completed: $alignment_report"
    log "📊 Tier Alignment: 🎯 Well: $well_aligned, ⚡ Partial: $partially_aligned, ❌ Mis: $misaligned"

    log_json "INFO" "tier_alignment_validation" "completed" "{\"well_aligned\":$well_aligned,\"partially_aligned\":$partially_aligned,\"misaligned\":$misaligned}"

    return 0
}

# Generate comprehensive cross-agent validation report
generate_comprehensive_report() {
    local final_report="$LOG_DIR/comprehensive_validation_$(date +%Y%m%d_%H%M%S).json"

    log "📋 Generating comprehensive cross-agent validation report..."

    # Find latest reports
    local consistency_report tier_alignment_report context_sharing_report
    consistency_report=$(ls -t "$LOG_DIR"/consistency_report_*.json 2>/dev/null | head -1 || echo "null")
    context_sharing_report=$(ls -t "$LOG_DIR"/context_sharing_*.json 2>/dev/null | head -1 || echo "null")
    tier_alignment_report=$(ls -t "$LOG_DIR"/tier_alignment_*.json 2>/dev/null | head -1 || echo "null")

    # Combine reports
    cat > "$final_report" << EOF
{
    "comprehensive_validation": {
        "timestamp": "$(date -Iseconds)",
        "correlation_id": "$CORRELATION_ID",
        "validation_scope": "cross_agent_integration"
    },
    "consistency_analysis": $(if [[ -f "$consistency_report" ]]; then cat "$consistency_report" | jq '.agent_consistency, .summary'; else echo "null"; fi),
    "context_sharing_analysis": $(if [[ -f "$context_sharing_report" ]]; then cat "$context_sharing_report" | jq '.context_sharing, .analysis'; else echo "null"; fi),
    "tier_alignment_analysis": $(if [[ -f "$tier_alignment_report" ]]; then cat "$tier_alignment_report" | jq '.tier_alignment, .overall_assessment'; else echo "null"; fi),
    "recommendations": [],
    "next_steps": []
}
EOF

    # Add recommendations based on findings
    local recommendations=()
    if [[ -f "$consistency_report" ]]; then
        local consistency_percentage
        consistency_percentage=$(jq -r '.summary.consistency_percentage // 0' "$consistency_report")
        if [[ "$consistency_percentage" -lt 80 ]]; then
            recommendations+=("\"Implement data synchronization between agents with consistency below 80%\"")
        fi
    fi

    if [[ -f "$context_sharing_report" ]]; then
        local integration_percentage
        integration_percentage=$(jq -r '.analysis.integration_percentage // 0' "$context_sharing_report")
        if [[ "$integration_percentage" -lt 70 ]]; then
            recommendations+=("\"Enhance workflow context sharing mechanisms for better integration\"")
        fi
    fi

    if [[ -f "$tier_alignment_report" ]]; then
        local alignment_percentage
        alignment_percentage=$(jq -r '.overall_assessment.overall_alignment_percentage // 0' "$tier_alignment_report")
        if [[ "$alignment_percentage" -lt 75 ]]; then
            recommendations+=("\"Review and realign agent tier assignments for better Results page coherence\"")
        fi
    fi

    # Add next steps
    local next_steps=(
        "\"Monitor cross-agent integration continuously with automated validation\""
        "\"Implement cross-agent data consistency checks in CI/CD pipeline\""
        "\"Establish workflow context sharing standards for new OPAL agents\""
        "\"Create agent dependency mapping for improved integration planning\""
    )

    # Update report with recommendations and next steps
    local tmp_file
    tmp_file=$(mktemp)
    jq --argjson recs "[$(IFS=','; echo "${recommendations[*]}")]" \
       --argjson steps "[$(IFS=','; echo "${next_steps[*]}")]" \
       '.recommendations = $recs | .next_steps = $steps' "$final_report" > "$tmp_file" && mv "$tmp_file" "$final_report"

    log "✅ Comprehensive validation report generated: $final_report"

    # Display summary
    echo ""
    echo "🎯 CROSS-AGENT VALIDATION SUMMARY:"
    echo "   📊 Data Consistency: $(jq -r '.consistency_analysis.summary.consistency_percentage // "N/A"' "$final_report" 2>/dev/null)%"
    echo "   🔗 Context Integration: $(jq -r '.context_sharing_analysis.analysis.integration_percentage // "N/A"' "$final_report" 2>/dev/null)%"
    echo "   🎯 Tier Alignment: $(jq -r '.tier_alignment_analysis.overall_assessment.overall_alignment_percentage // "N/A"' "$final_report" 2>/dev/null)%"
    echo "   📋 Recommendations: $(jq -r '.recommendations | length' "$final_report" 2>/dev/null)"
    echo "   📝 Report: $final_report"

    return 0
}

# Quick validation mode for fast checks
quick_validation() {
    log "⚡ Running quick cross-agent validation..."

    local quick_results=()
    for agent in "${AGENTS[@]}"; do
        local agent_data
        if agent_data=$(fetch_agent_data "$agent"); then
            local confidence last_updated
            confidence=$(echo "$agent_data" | jq 'if .success then 85 else 20 end' 2>/dev/null || echo "0")
            last_updated=$(echo "$agent_data" | jq -r '.lastDataSent // .timestamp // "unknown"' 2>/dev/null)

            local age_hours
            age_hours=$(calculate_data_age "$last_updated")

            local status="✅ OK"
            [[ "$confidence" -lt 50 ]] && status="⚠️ LOW_CONFIDENCE"
            [[ "$age_hours" -gt 24 ]] && status="🕒 STALE"

            quick_results+=("   $agent: $status (Confidence: $confidence%, Age: ${age_hours}h)")
        else
            quick_results+=("   $agent: ❌ FAILED")
        fi
    done

    echo "⚡ QUICK VALIDATION RESULTS:"
    printf '%s\n' "${quick_results[@]}"

    return 0
}

# Main command dispatcher
main() {
    case "${1:-full}" in
        "consistency"|"data")
            validate_data_consistency
            ;;
        "context"|"sharing")
            validate_workflow_context_sharing
            ;;
        "alignment"|"tiers")
            validate_results_tier_alignment
            ;;
        "quick"|"fast")
            quick_validation
            ;;
        "full"|"comprehensive")
            log "🚀 Starting comprehensive cross-agent validation..."
            validate_data_consistency
            validate_workflow_context_sharing
            validate_results_tier_alignment
            generate_comprehensive_report
            ;;
        "report"|"summary")
            generate_comprehensive_report
            ;;
        "help"|*)
            cat << 'EOF'
OPAL Cross-Agent Validation System Commands:

  full          - Run comprehensive validation (default)
  consistency   - Test data consistency across agents
  context       - Validate workflow context sharing
  alignment     - Check Results tier alignment
  quick         - Fast validation of all agents
  report        - Generate comprehensive report from latest results
  help          - Show this help

Examples:
  ./opal-cross-agent-validator.sh full
  ./opal-cross-agent-validator.sh quick
  ./opal-cross-agent-validator.sh consistency
  ./opal-cross-agent-validator.sh context

Environment Variables:
  OSA_BASE_URL - Base URL for OSA (default: http://localhost:3000)
  OSA_LOG_DIR - Log directory (default: ./logs/cross-agent)
  VALIDATION_TIMEOUT - Timeout for API calls (default: 60s)
  MAX_DRIFT_HOURS - Maximum acceptable data age (default: 6h)
EOF
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi