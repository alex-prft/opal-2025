#!/bin/bash
# OPAL Integration Automated Monitoring System
# Production-ready monitoring with corrected endpoints and alerting

set -euo pipefail

# Configuration
readonly BASE_URL="${OSA_BASE_URL:-http://localhost:3000}"
readonly MONITOR_INTERVAL="${MONITOR_INTERVAL:-300}"  # 5 minutes default
readonly LOG_DIR="${OSA_LOG_DIR:-./logs/monitoring}"
readonly ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"  # Optional Slack/Teams webhook
readonly DATA_FRESHNESS_THRESHOLD_HOURS="${DATA_FRESHNESS_THRESHOLD:-48}"
readonly QUALITY_THRESHOLD="${QUALITY_THRESHOLD:-50}"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging functions with structured output
log_metric() {
    local timestamp="$(date -Iseconds)"
    local agent="$1" metric="$2" value="$3" status="$4"

    # JSON structured log for analysis
    printf '{"timestamp":"%s","agent":"%s","metric":"%s","value":"%s","status":"%s"}\n' \
        "$timestamp" "$agent" "$metric" "$value" "$status" >> "$LOG_DIR/metrics_$(date +%Y%m%d).jsonl"

    # Human readable log
    echo "[$timestamp] $agent | $metric: $value ($status)" | tee -a "$LOG_DIR/monitoring_$(date +%Y%m%d).log"
}

log_alert() {
    local level="$1" message="$2"
    local timestamp="$(date -Iseconds)"

    echo "[$timestamp] $level: $message" | tee -a "$LOG_DIR/alerts_$(date +%Y%m%d).log"

    # Send to external webhook if configured
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"OPAL Alert [$level]: $message\"}" >/dev/null 2>&1 || true
    fi
}

# Enhanced agent health check with corrected endpoint
check_agent_health() {
    local agent="$1"
    local timeout="${2:-10}"

    log_metric "$agent" "check_started" "$(date +%s)" "INFO"

    # Get agent data with timeout
    local response http_code data

    if ! response=$(timeout "$timeout" curl -s -w "%{http_code}" "$BASE_URL/api/opal/agent-data?agent=$agent" 2>/dev/null); then
        log_metric "$agent" "connection" "timeout" "CRITICAL"
        return 1
    fi

    http_code="${response: -3}"
    data="${response%???}"

    # Validate HTTP response
    if [[ "$http_code" != "200" ]]; then
        log_metric "$agent" "http_status" "$http_code" "CRITICAL"
        return 1
    fi

    # Validate JSON structure
    if ! echo "$data" | jq empty 2>/dev/null; then
        log_metric "$agent" "json_validity" "invalid" "CRITICAL"
        return 1
    fi

    # Extract key metrics
    local segments_count performance_available last_updated quality_score

    segments_count=$(echo "$data" | jq '.segments // .audience_segments // [] | length' 2>/dev/null || echo "0")
    performance_available=$(echo "$data" | jq 'if (.performance != null or .metrics != null) then "true" else "false" end' 2>/dev/null || echo "false")
    last_updated=$(echo "$data" | jq -r '.lastUpdated // .last_updated // .updated_at // "unknown"' 2>/dev/null || echo "unknown")

    # Calculate data freshness
    local age_hours=9999
    if [[ "$last_updated" != "unknown" ]]; then
        local last_epoch current_epoch

        if [[ "$OSTYPE" == "darwin"* ]]; then
            last_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$last_updated" "+%s" 2>/dev/null || echo "0")
        else
            last_epoch=$(date -d "$last_updated" "+%s" 2>/dev/null || echo "0")
        fi

        if [[ "$last_epoch" -gt 0 ]]; then
            current_epoch=$(date "+%s")
            age_hours=$(( (current_epoch - last_epoch) / 3600 ))
        fi
    fi

    # Calculate quality score
    quality_score=0
    [[ "$segments_count" -gt 0 ]] && quality_score=$((quality_score + 30))
    [[ "$performance_available" == "true" ]] && quality_score=$((quality_score + 30))
    [[ "$last_updated" != "unknown" ]] && quality_score=$((quality_score + 20))
    [[ "$age_hours" -lt 168 ]] && quality_score=$((quality_score + 20))  # Less than 7 days

    # Log all metrics
    log_metric "$agent" "segments_count" "$segments_count" "INFO"
    log_metric "$agent" "performance_available" "$performance_available" "INFO"
    log_metric "$agent" "data_age_hours" "$age_hours" "INFO"
    log_metric "$agent" "quality_score" "$quality_score" "INFO"

    # Determine overall health status and generate alerts
    local status="HEALTHY"

    if [[ "$age_hours" -gt "$DATA_FRESHNESS_THRESHOLD_HOURS" ]]; then
        status="CRITICAL"
        log_alert "CRITICAL" "$agent has stale data (${age_hours}h old, threshold: ${DATA_FRESHNESS_THRESHOLD_HOURS}h)"
    elif [[ "$quality_score" -lt "$QUALITY_THRESHOLD" ]]; then
        status="WARNING"
        log_alert "WARNING" "$agent has low quality score ($quality_score/100, threshold: $QUALITY_THRESHOLD)"
    elif [[ "$segments_count" -eq 0 ]]; then
        status="WARNING"
        log_alert "WARNING" "$agent has no segments data"
    fi

    log_metric "$agent" "overall_status" "$status" "$status"

    # Return appropriate exit code
    case "$status" in
        "HEALTHY") return 0 ;;
        "WARNING") return 1 ;;
        "CRITICAL") return 2 ;;
    esac
}

# System-wide health dashboard
generate_health_dashboard() {
    local dashboard_file="$LOG_DIR/health_dashboard_$(date +%Y%m%d_%H%M%S).json"
    local agents=("audience_suggester" "geo_audit" "content_optimizer" "strategy_assistant" "performance_analyzer")

    echo "📊 Generating health dashboard..."

    # Initialize dashboard structure
    cat > "$dashboard_file" << EOF
{
    "dashboard_metadata": {
        "timestamp": "$(date -Iseconds)",
        "base_url": "$BASE_URL",
        "monitoring_version": "2.0"
    },
    "system_status": {},
    "agent_health": {},
    "summary": {}
}
EOF

    local healthy_count=0 warning_count=0 critical_count=0

    # Check each agent
    for agent in "${agents[@]}"; do
        echo "   Checking $agent..."

        local health_status
        if check_agent_health "$agent" 5; then
            health_status="HEALTHY"
            ((healthy_count++))
        elif [[ $? -eq 1 ]]; then
            health_status="WARNING"
            ((warning_count++))
        else
            health_status="CRITICAL"
            ((critical_count++))
        fi

        # Add to dashboard
        local tmp_file
        tmp_file=$(mktemp)
        jq --arg agent "$agent" --arg status "$health_status" \
            '.agent_health[$agent] = {"status": $status, "last_checked": "'$(date -Iseconds)'"}' \
            "$dashboard_file" > "$tmp_file" && mv "$tmp_file" "$dashboard_file"
    done

    # Update summary
    local tmp_file
    tmp_file=$(mktemp)
    jq --arg healthy "$healthy_count" --arg warning "$warning_count" --arg critical "$critical_count" \
        '.summary = {
            "total_agents": '${#agents[@]}',
            "healthy": ($healthy | tonumber),
            "warning": ($warning | tonumber),
            "critical": ($critical | tonumber),
            "health_percentage": (($healthy | tonumber) * 100 / '${#agents[@]}')"
        }' "$dashboard_file" > "$tmp_file" && mv "$tmp_file" "$dashboard_file"

    echo "✅ Health dashboard generated: $dashboard_file"

    # Display summary
    echo ""
    echo "🎯 SYSTEM HEALTH SUMMARY:"
    echo "   ✅ Healthy: $healthy_count"
    echo "   ⚠️ Warning: $warning_count"
    echo "   🚨 Critical: $critical_count"
    echo "   📊 Health: $(( healthy_count * 100 / ${#agents[@]} ))%"

    return 0
}

# Continuous monitoring loop
start_continuous_monitoring() {
    echo "🚀 Starting OPAL continuous monitoring..."
    echo "   Base URL: $BASE_URL"
    echo "   Interval: ${MONITOR_INTERVAL}s"
    echo "   Log Directory: $LOG_DIR"
    echo "   Data Freshness Threshold: ${DATA_FRESHNESS_THRESHOLD_HOURS}h"
    echo "   Quality Threshold: $QUALITY_THRESHOLD/100"
    echo ""

    local cycle_count=0

    while true; do
        ((cycle_count++))
        echo "🔄 Monitoring Cycle #$cycle_count - $(date)"

        # Generate health dashboard
        generate_health_dashboard

        # Check if any critical alerts
        local critical_alerts
        critical_alerts=$(tail -20 "$LOG_DIR/alerts_$(date +%Y%m%d).log" 2>/dev/null | grep "CRITICAL" | wc -l || echo "0")

        if [[ "$critical_alerts" -gt 0 ]]; then
            echo "🚨 CRITICAL ALERTS DETECTED: $critical_alerts recent critical issues"
        fi

        echo "⏳ Next check in ${MONITOR_INTERVAL}s..."
        echo ""
        sleep "$MONITOR_INTERVAL"
    done
}

# Performance trending analysis
analyze_performance_trends() {
    local days="${1:-7}"
    echo "📈 Analyzing performance trends over last $days days..."

    # Analyze metrics from JSON logs
    local trend_file="$LOG_DIR/performance_trends_$(date +%Y%m%d).json"

    # Find all metric files from last N days
    local metric_files=()
    for i in $(seq 0 $((days-1))); do
        local date_str
        if [[ "$OSTYPE" == "darwin"* ]]; then
            date_str=$(date -v-"${i}d" "+%Y%m%d")
        else
            date_str=$(date -d "$i days ago" "+%Y%m%d")
        fi

        local file="$LOG_DIR/metrics_${date_str}.jsonl"
        [[ -f "$file" ]] && metric_files+=("$file")
    done

    if [[ ${#metric_files[@]} -eq 0 ]]; then
        echo "⚠️ No metric files found for trend analysis"
        return 1
    fi

    echo "   Analyzing ${#metric_files[@]} metric files..."

    # Combine and analyze metrics
    cat "${metric_files[@]}" | jq -s '
        group_by(.agent) |
        map({
            agent: .[0].agent,
            metrics_count: length,
            latest_quality: (map(select(.metric == "quality_score")) | sort_by(.timestamp) | last | .value // "N/A"),
            avg_segments: (map(select(.metric == "segments_count")) | map(.value | tonumber) | add / length),
            data_freshness_issues: (map(select(.metric == "data_age_hours" and (.value | tonumber) > 48)) | length)
        })
    ' > "$trend_file"

    echo "✅ Trend analysis saved to: $trend_file"

    # Display summary
    echo ""
    echo "📊 PERFORMANCE TRENDS SUMMARY:"
    jq -r '.[] | "   \(.agent): Quality=\(.latest_quality), Avg Segments=\(.avg_segments | floor), Freshness Issues=\(.data_freshness_issues)"' "$trend_file"
}

# Main command dispatcher
main() {
    case "${1:-monitor}" in
        "monitor"|"start")
            start_continuous_monitoring
            ;;
        "dashboard"|"status")
            generate_health_dashboard
            ;;
        "check")
            local agent="${2:-audience_suggester}"
            check_agent_health "$agent"
            ;;
        "trends"|"analyze")
            local days="${2:-7}"
            analyze_performance_trends "$days"
            ;;
        "help"|*)
            cat << 'EOF'
OPAL Monitoring System Commands:

  monitor     - Start continuous monitoring (default)
  dashboard   - Generate current health dashboard
  check AGENT - Check specific agent health
  trends [N]  - Analyze performance trends (N days)
  help        - Show this help

Examples:
  ./opal-monitoring-system.sh monitor
  ./opal-monitoring-system.sh dashboard
  ./opal-monitoring-system.sh check audience_suggester
  ./opal-monitoring-system.sh trends 7

Environment Variables:
  OSA_BASE_URL - Base URL for OSA (default: http://localhost:3000)
  MONITOR_INTERVAL - Monitoring interval in seconds (default: 300)
  OSA_LOG_DIR - Log directory (default: ./logs/monitoring)
  ALERT_WEBHOOK - Webhook URL for alerts (optional)
  DATA_FRESHNESS_THRESHOLD - Hours for stale data alert (default: 48)
  QUALITY_THRESHOLD - Minimum quality score (default: 50)
EOF
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi