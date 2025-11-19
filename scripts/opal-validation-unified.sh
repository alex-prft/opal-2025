#!/bin/bash
# OPAL Validation Unified Interface
# Single command interface for all OPAL validation systems
# Integrates monitoring, freshness, and cross-agent validation

set -euo pipefail

# Script directory detection
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source individual validation systems
readonly MONITORING_SCRIPT="$SCRIPT_DIR/opal-monitoring-system.sh"
readonly FRESHNESS_SCRIPT="$SCRIPT_DIR/opal-data-freshness-optimizer.sh"
readonly CROSS_AGENT_SCRIPT="$SCRIPT_DIR/opal-cross-agent-validator.sh"

# Configuration
readonly BASE_URL="${OSA_BASE_URL:-http://localhost:3000}"
readonly LOG_DIR="${OSA_LOG_DIR:-./logs/unified-validation}"
readonly VALIDATION_TIMEOUT="${VALIDATION_TIMEOUT:-120}"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" | tee -a "$LOG_DIR/unified_$(date +%Y%m%d).log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "$LOG_DIR/unified_$(date +%Y%m%d).log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "$LOG_DIR/unified_$(date +%Y%m%d).log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_DIR/unified_$(date +%Y%m%d).log"
}

log_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$*${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Check if validation scripts exist
check_dependencies() {
    local missing_scripts=()

    [[ ! -f "$MONITORING_SCRIPT" ]] && missing_scripts+=("opal-monitoring-system.sh")
    [[ ! -f "$FRESHNESS_SCRIPT" ]] && missing_scripts+=("opal-data-freshness-optimizer.sh")
    [[ ! -f "$CROSS_AGENT_SCRIPT" ]] && missing_scripts+=("opal-cross-agent-validator.sh")

    if [[ ${#missing_scripts[@]} -gt 0 ]]; then
        log_error "Missing validation scripts: ${missing_scripts[*]}"
        log_error "Expected location: $SCRIPT_DIR"
        return 1
    fi

    # Make scripts executable
    chmod +x "$MONITORING_SCRIPT" "$FRESHNESS_SCRIPT" "$CROSS_AGENT_SCRIPT" 2>/dev/null || true

    return 0
}

# Quick health check - fastest validation
quick_health_check() {
    log_header "Quick Health Check (< 30 seconds)"

    local start_time=$(date +%s)

    # Run fast checks from each system in parallel
    local monitoring_status=0
    local freshness_status=0
    local cross_agent_status=0

    log_info "Running parallel quick checks..."

    # Monitoring system quick check
    (
        log_info "1/3: Monitoring system health check..."
        if "$MONITORING_SCRIPT" check audience_suggester >/dev/null 2>&1; then
            echo "monitoring:OK" > "$LOG_DIR/quick_monitoring.tmp"
        else
            echo "monitoring:FAIL" > "$LOG_DIR/quick_monitoring.tmp"
        fi
    ) &
    local monitoring_pid=$!

    # Freshness system quick check
    (
        log_info "2/3: Data freshness check..."
        if "$FRESHNESS_SCRIPT" agent audience_suggester >/dev/null 2>&1; then
            echo "freshness:OK" > "$LOG_DIR/quick_freshness.tmp"
        else
            echo "freshness:FAIL" > "$LOG_DIR/quick_freshness.tmp"
        fi
    ) &
    local freshness_pid=$!

    # Cross-agent quick check
    (
        log_info "3/3: Cross-agent validation..."
        if "$CROSS_AGENT_SCRIPT" quick >/dev/null 2>&1; then
            echo "cross_agent:OK" > "$LOG_DIR/quick_cross_agent.tmp"
        else
            echo "cross_agent:FAIL" > "$LOG_DIR/quick_cross_agent.tmp"
        fi
    ) &
    local cross_agent_pid=$!

    # Wait for all checks with timeout
    wait "$monitoring_pid" || true
    wait "$freshness_pid" || true
    wait "$cross_agent_pid" || true

    # Collect results
    local monitoring_result=$(cat "$LOG_DIR/quick_monitoring.tmp" 2>/dev/null || echo "monitoring:UNKNOWN")
    local freshness_result=$(cat "$LOG_DIR/quick_freshness.tmp" 2>/dev/null || echo "freshness:UNKNOWN")
    local cross_agent_result=$(cat "$LOG_DIR/quick_cross_agent.tmp" 2>/dev/null || echo "cross_agent:UNKNOWN")

    # Clean up temp files
    rm -f "$LOG_DIR"/quick_*.tmp

    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Display results
    echo ""
    log_success "Quick Health Check Completed in ${duration}s"
    echo ""
    echo "  Monitoring:   ${monitoring_result#*:}"
    echo "  Freshness:    ${freshness_result#*:}"
    echo "  Cross-Agent:  ${cross_agent_result#*:}"
    echo ""

    # Return overall status
    if [[ "$monitoring_result" == *"OK"* ]] && [[ "$freshness_result" == *"OK"* ]] && [[ "$cross_agent_result" == *"OK"* ]]; then
        log_success "Overall Status: HEALTHY"
        return 0
    else
        log_warning "Overall Status: DEGRADED - Run 'full' validation for details"
        return 1
    fi
}

# Full validation - comprehensive checks
full_validation() {
    local skip_monitoring="${1:-false}"
    local skip_freshness="${2:-false}"
    local skip_cross_agent="${3:-false}"

    log_header "Full OPAL Integration Validation"

    local start_time=$(date +%s)
    local validation_report="$LOG_DIR/full_validation_$(date +%Y%m%d_%H%M%S).json"

    # Initialize report
    cat > "$validation_report" << EOF
{
    "validation_metadata": {
        "timestamp": "$(date -Iseconds)",
        "validation_type": "full_comprehensive",
        "base_url": "$BASE_URL"
    },
    "monitoring": {},
    "freshness": {},
    "cross_agent": {},
    "summary": {}
}
EOF

    local monitoring_success=false
    local freshness_success=false
    local cross_agent_success=false

    # 1. Monitoring System Validation
    if [[ "$skip_monitoring" == "false" ]]; then
        log_header "1. Monitoring System Validation"

        if "$MONITORING_SCRIPT" dashboard; then
            monitoring_success=true
            log_success "Monitoring validation completed"
        else
            log_error "Monitoring validation failed"
        fi
    else
        log_info "Skipping monitoring validation"
        monitoring_success=true
    fi

    # 2. Data Freshness Validation
    if [[ "$skip_freshness" == "false" ]]; then
        log_header "2. Data Freshness Validation"

        if "$FRESHNESS_SCRIPT" check; then
            freshness_success=true
            log_success "Freshness validation completed"
        else
            log_error "Freshness validation failed"
        fi
    else
        log_info "Skipping freshness validation"
        freshness_success=true
    fi

    # 3. Cross-Agent Integration Validation
    if [[ "$skip_cross_agent" == "false" ]]; then
        log_header "3. Cross-Agent Integration Validation"

        if "$CROSS_AGENT_SCRIPT" full; then
            cross_agent_success=true
            log_success "Cross-agent validation completed"
        else
            log_error "Cross-agent validation failed"
        fi
    else
        log_info "Skipping cross-agent validation"
        cross_agent_success=true
    fi

    # Calculate overall status
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Update report with summary
    local overall_status="FAILED"
    if [[ "$monitoring_success" == "true" ]] && [[ "$freshness_success" == "true" ]] && [[ "$cross_agent_success" == "true" ]]; then
        overall_status="HEALTHY"
    elif [[ "$monitoring_success" == "true" ]] || [[ "$freshness_success" == "true" ]] || [[ "$cross_agent_success" == "true" ]]; then
        overall_status="DEGRADED"
    fi

    local tmp_file
    tmp_file=$(mktemp)
    jq --arg status "$overall_status" --arg duration "$duration" \
        --arg monitoring "$monitoring_success" \
        --arg freshness "$freshness_success" \
        --arg cross_agent "$cross_agent_success" \
        '.summary = {
            "overall_status": $status,
            "duration_seconds": ($duration | tonumber),
            "monitoring_passed": ($monitoring == "true"),
            "freshness_passed": ($freshness == "true"),
            "cross_agent_passed": ($cross_agent == "true"),
            "completion_time": "'$(date -Iseconds)'"
        }' "$validation_report" > "$tmp_file" && mv "$tmp_file" "$validation_report"

    # Display final summary
    log_header "Full Validation Summary"
    echo "  Duration:      ${duration}s"
    echo "  Overall Status: $overall_status"
    echo "  Monitoring:    $([ "$monitoring_success" == "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
    echo "  Freshness:     $([ "$freshness_success" == "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
    echo "  Cross-Agent:   $([ "$cross_agent_success" == "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
    echo ""
    log_info "Full report saved: $validation_report"

    [[ "$overall_status" == "HEALTHY" ]] && return 0 || return 1
}

# Force Sync validation - triggered after Force Sync completion
force_sync_validation() {
    local correlation_id="${1:-}"

    if [[ -z "$correlation_id" ]]; then
        log_error "Correlation ID required for Force Sync validation"
        echo "Usage: $0 force-sync <correlation_id>"
        return 1
    fi

    log_header "Force Sync Pipeline Validation"
    log_info "Correlation ID: $correlation_id"

    local start_time=$(date +%s)

    # Wait for workflow completion (with timeout)
    log_info "Waiting for Force Sync workflow to complete..."
    local wait_time=0
    local max_wait=90

    while [[ $wait_time -lt $max_wait ]]; do
        # Check OSA recent status for workflow completion
        local status_response
        if status_response=$(curl -s "$BASE_URL/api/admin/osa/recent-status" 2>/dev/null); then
            local last_force_sync
            last_force_sync=$(echo "$status_response" | jq -r '.data.lastForceSyncAt // "unknown"' 2>/dev/null || echo "unknown")

            if [[ "$last_force_sync" != "unknown" ]]; then
                log_success "Force Sync detected in OSA status"
                break
            fi
        fi

        sleep 5
        wait_time=$((wait_time + 5))

        if [[ $((wait_time % 15)) -eq 0 ]]; then
            log_info "Still waiting... (${wait_time}s elapsed)"
        fi
    done

    if [[ $wait_time -ge $max_wait ]]; then
        log_warning "Workflow status check timed out after ${max_wait}s"
    fi

    # Layer 1: Force Sync Orchestration
    log_info "Layer 1: Validating Force Sync orchestration..."
    local layer1_status="UNKNOWN"

    if curl -s "$BASE_URL/api/admin/osa/recent-status" | jq -e '.data.lastForceSyncAt' >/dev/null 2>&1; then
        layer1_status="OK"
        log_success "Layer 1: Force Sync orchestration validated"
    else
        layer1_status="FAILED"
        log_error "Layer 1: Force Sync orchestration validation failed"
    fi

    # Layer 2: OPAL Agents Execution
    log_info "Layer 2: Validating OPAL agents execution..."
    local layer2_status="UNKNOWN"

    if "$MONITORING_SCRIPT" dashboard >/dev/null 2>&1; then
        layer2_status="OK"
        log_success "Layer 2: OPAL agents validated"
    else
        layer2_status="DEGRADED"
        log_warning "Layer 2: Some OPAL agents have issues"
    fi

    # Layer 3: OSA Ingestion
    log_info "Layer 3: Validating OSA data ingestion..."
    local layer3_status="UNKNOWN"

    # Check if agents reported data to OSA
    local agent_data_count=0
    for agent in audience_suggester geo_audit content_optimizer strategy_assistant performance_analyzer; do
        if curl -s "$BASE_URL/api/opal/agent-data?agent=$agent" | jq -e '.lastUpdated' >/dev/null 2>&1; then
            ((agent_data_count++))
        fi
    done

    local reception_rate=$((agent_data_count * 100 / 5))
    if [[ $reception_rate -ge 80 ]]; then
        layer3_status="OK"
        log_success "Layer 3: OSA ingestion validated ($reception_rate% reception rate)"
    else
        layer3_status="DEGRADED"
        log_warning "Layer 3: Low OSA reception rate ($reception_rate%)"
    fi

    # Layer 4: Results Generation
    log_info "Layer 4: Validating Results generation..."
    local layer4_status="UNKNOWN"

    # Check if Results page has recent data
    if "$CROSS_AGENT_SCRIPT" quick >/dev/null 2>&1; then
        layer4_status="OK"
        log_success "Layer 4: Results generation validated"
    else
        layer4_status="DEGRADED"
        log_warning "Layer 4: Results generation has issues"
    fi

    # Calculate overall status
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    local overall_status="HEALTHY"
    if [[ "$layer1_status" == "FAILED" ]] || [[ "$layer2_status" == "FAILED" ]]; then
        overall_status="FAILED"
    elif [[ "$layer3_status" == "DEGRADED" ]] || [[ "$layer4_status" == "DEGRADED" ]]; then
        overall_status="DEGRADED"
    fi

    # Display results
    log_header "Force Sync Validation Results"
    echo "  Correlation ID:  $correlation_id"
    echo "  Duration:        ${duration}s"
    echo "  Overall Status:  $overall_status"
    echo ""
    echo "  Layer 1 (Force Sync):    $layer1_status"
    echo "  Layer 2 (OPAL Agents):   $layer2_status"
    echo "  Layer 3 (OSA Ingestion): $layer3_status (${reception_rate}% reception)"
    echo "  Layer 4 (Results):       $layer4_status"
    echo ""

    # Save detailed report
    local report_file="$LOG_DIR/force_sync_validation_$(date +%Y%m%d_%H%M%S).json"
    cat > "$report_file" << EOF
{
    "validation_metadata": {
        "correlation_id": "$correlation_id",
        "timestamp": "$(date -Iseconds)",
        "duration_seconds": $duration
    },
    "layer_validation": {
        "layer1_force_sync": "$layer1_status",
        "layer2_opal_agents": "$layer2_status",
        "layer3_osa_ingestion": {
            "status": "$layer3_status",
            "reception_rate": $reception_rate
        },
        "layer4_results": "$layer4_status"
    },
    "overall_status": "$overall_status"
}
EOF

    log_info "Detailed report saved: $report_file"

    [[ "$overall_status" == "HEALTHY" ]] && return 0 || return 1
}

# Continuous monitoring mode
continuous_monitoring() {
    local interval="${1:-300}"

    log_header "Starting Continuous Monitoring (interval: ${interval}s)"

    local cycle_count=0

    while true; do
        ((cycle_count++))

        log_header "Monitoring Cycle #$cycle_count - $(date)"

        # Run quick health check
        if quick_health_check; then
            log_success "Cycle #$cycle_count: System HEALTHY"
        else
            log_warning "Cycle #$cycle_count: System DEGRADED - consider running full validation"
        fi

        log_info "Next check in ${interval}s..."
        sleep "$interval"
    done
}

# Status dashboard - aggregated view
status_dashboard() {
    log_header "OPAL Integration Status Dashboard"

    # Get latest reports from each system
    local monitoring_report=$(ls -t ./logs/monitoring/health_dashboard_*.json 2>/dev/null | head -1 || echo "")
    local freshness_report=$(ls -t ./logs/freshness/freshness_report_*.json 2>/dev/null | head -1 || echo "")
    local cross_agent_report=$(ls -t ./logs/cross-agent/comprehensive_validation_*.json 2>/dev/null | head -1 || echo "")

    echo ""
    echo "📊 SYSTEM HEALTH OVERVIEW"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Monitoring status
    if [[ -f "$monitoring_report" ]]; then
        local monitoring_health=$(jq -r '.summary.health_percentage // "N/A"' "$monitoring_report" 2>/dev/null)
        echo "  Agent Health:      $monitoring_health%"
    else
        echo "  Agent Health:      No data (run: monitoring)"
    fi

    # Freshness status
    if [[ -f "$freshness_report" ]]; then
        local fresh_rate=$(jq -r '.summary.fresh_percentage // "N/A"' "$freshness_report" 2>/dev/null)
        echo "  Data Freshness:    $fresh_rate%"
    else
        echo "  Data Freshness:    No data (run: freshness)"
    fi

    # Cross-agent status
    if [[ -f "$cross_agent_report" ]]; then
        local consistency=$(jq -r '.consistency_analysis.summary.consistency_percentage // "N/A"' "$cross_agent_report" 2>/dev/null)
        local integration=$(jq -r '.context_sharing_analysis.analysis.integration_percentage // "N/A"' "$cross_agent_report" 2>/dev/null)
        local alignment=$(jq -r '.tier_alignment_analysis.overall_assessment.overall_alignment_percentage // "N/A"' "$cross_agent_report" 2>/dev/null)

        echo "  Data Consistency:  $consistency%"
        echo "  Context Sharing:   $integration%"
        echo "  Tier Alignment:    $alignment%"
    else
        echo "  Cross-Agent:       No data (run: cross-agent)"
    fi

    echo ""
    echo "📁 RECENT REPORTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    [[ -f "$monitoring_report" ]] && echo "  Monitoring:  $monitoring_report"
    [[ -f "$freshness_report" ]] && echo "  Freshness:   $freshness_report"
    [[ -f "$cross_agent_report" ]] && echo "  Cross-Agent: $cross_agent_report"
    echo ""
}

# Command help
show_help() {
    cat << 'EOF'
OPAL Validation Unified Interface - All-in-one validation command

USAGE:
  ./opal-validation-unified.sh <command> [options]

QUICK COMMANDS:
  quick               Fast health check (< 30s) - best for frequent checks
  status              Display current status dashboard
  full                Comprehensive validation (all systems)
  force-sync <id>     Validate Force Sync pipeline with correlation ID
  monitor [interval]  Continuous monitoring mode (default: 300s)

INDIVIDUAL SYSTEMS:
  monitoring          Run monitoring system checks only
  freshness           Run data freshness checks only
  cross-agent         Run cross-agent validation only

SPECIALIZED COMMANDS:
  monitoring-dashboard        Generate monitoring system dashboard
  freshness-check            Check all agents for stale data
  freshness-refresh          Refresh stale agents automatically
  cross-agent-consistency    Test data consistency across agents
  cross-agent-context        Validate workflow context sharing
  cross-agent-alignment      Check Results tier alignment

EXAMPLES:
  # Quick health check (recommended for frequent monitoring)
  ./opal-validation-unified.sh quick

  # Full comprehensive validation
  ./opal-validation-unified.sh full

  # Validate after Force Sync
  ./opal-validation-unified.sh force-sync force-sync-1731859200-abc123

  # Continuous monitoring every 5 minutes
  ./opal-validation-unified.sh monitor 300

  # Check and refresh stale data
  ./opal-validation-unified.sh freshness-refresh

  # View current status
  ./opal-validation-unified.sh status

ENVIRONMENT VARIABLES:
  OSA_BASE_URL        Base URL for OSA (default: http://localhost:3000)
  OSA_LOG_DIR         Log directory (default: ./logs/unified-validation)
  VALIDATION_TIMEOUT  Timeout for validations (default: 120s)
  MONITOR_INTERVAL    Default monitoring interval (default: 300s)

INTEGRATION NOTES:
  - All commands produce JSON reports in $OSA_LOG_DIR
  - Exit codes: 0=success, 1=degraded, 2=failed
  - Supports parallel execution for performance
  - Compatible with CI/CD pipelines

For detailed help on individual systems:
  ./opal-monitoring-system.sh help
  ./opal-data-freshness-optimizer.sh help
  ./opal-cross-agent-validator.sh help
EOF
}

# Main command dispatcher
main() {
    # Check dependencies first
    if ! check_dependencies; then
        log_error "Dependency check failed"
        exit 1
    fi

    local command="${1:-help}"

    case "$command" in
        "quick"|"fast")
            quick_health_check
            ;;
        "full"|"comprehensive")
            full_validation
            ;;
        "force-sync"|"forcesync")
            force_sync_validation "${2:-}"
            ;;
        "monitor"|"watch")
            continuous_monitoring "${2:-300}"
            ;;
        "status"|"dashboard")
            status_dashboard
            ;;
        "monitoring")
            log_header "Monitoring System Validation"
            "$MONITORING_SCRIPT" dashboard
            ;;
        "freshness")
            log_header "Data Freshness Validation"
            "$FRESHNESS_SCRIPT" check
            ;;
        "cross-agent"|"integration")
            log_header "Cross-Agent Validation"
            "$CROSS_AGENT_SCRIPT" full
            ;;
        "monitoring-dashboard")
            "$MONITORING_SCRIPT" dashboard
            ;;
        "freshness-check")
            "$FRESHNESS_SCRIPT" check
            ;;
        "freshness-refresh")
            "$FRESHNESS_SCRIPT" refresh
            ;;
        "cross-agent-consistency")
            "$CROSS_AGENT_SCRIPT" consistency
            ;;
        "cross-agent-context")
            "$CROSS_AGENT_SCRIPT" context
            ;;
        "cross-agent-alignment")
            "$CROSS_AGENT_SCRIPT" alignment
            ;;
        "help"|"-h"|"--help"|*)
            show_help
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
