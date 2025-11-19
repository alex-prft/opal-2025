#!/bin/bash
# OPAL Data Freshness Optimization System
# Automated detection and refresh of stale agent data

set -euo pipefail

# Configuration
readonly BASE_URL="${OSA_BASE_URL:-http://localhost:3000}"
readonly OPAL_API_URL="${OPAL_API_URL:-https://api.opal.com}"  # Replace with actual OPAL endpoint
readonly LOG_DIR="${OSA_LOG_DIR:-./logs/freshness}"
readonly MAX_DATA_AGE_HOURS="${MAX_DATA_AGE_HOURS:-24}"  # Trigger refresh after 24h
readonly CRITICAL_DATA_AGE_HOURS="${CRITICAL_DATA_AGE_HOURS:-72}"  # Critical threshold
readonly REFRESH_TIMEOUT="${REFRESH_TIMEOUT:-300}"  # 5 minutes timeout for refresh
readonly CONCURRENT_REFRESHES="${CONCURRENT_REFRESHES:-3}"  # Max parallel refreshes

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging with timestamps
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_DIR/freshness_$(date +%Y%m%d).log"
}

log_json() {
    local level="$1" agent="$2" message="$3" data="$4"
    printf '{"timestamp":"%s","level":"%s","agent":"%s","message":"%s","data":%s}\n' \
        "$(date -Iseconds)" "$level" "$agent" "$message" "$data" >> "$LOG_DIR/freshness_$(date +%Y%m%d).jsonl"
}

# Calculate data age in hours
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

# Check if agent data is stale
check_agent_freshness() {
    local agent="$1"

    log "Checking freshness for agent: $agent"

    # Get agent data
    local response
    if ! response=$(curl -s "$BASE_URL/api/opal/agent-data?agent=$agent" 2>/dev/null); then
        log "ERROR: Failed to fetch data for $agent"
        return 1
    fi

    # Validate JSON
    if ! echo "$response" | jq empty 2>/dev/null; then
        log "ERROR: Invalid JSON response for $agent"
        return 1
    fi

    # Extract timestamp
    local last_updated
    last_updated=$(echo "$response" | jq -r '.lastUpdated // .last_updated // .updated_at // "unknown"')

    # Calculate age
    local age_hours
    age_hours=$(calculate_data_age "$last_updated")

    # Determine freshness status
    local status="FRESH"
    if [[ "$age_hours" -gt "$CRITICAL_DATA_AGE_HOURS" ]]; then
        status="CRITICAL"
    elif [[ "$age_hours" -gt "$MAX_DATA_AGE_HOURS" ]]; then
        status="STALE"
    fi

    log "$agent: Age=${age_hours}h, Status=$status, LastUpdate=$last_updated"

    # Log structured data
    log_json "INFO" "$agent" "freshness_check" "{\"age_hours\":$age_hours,\"status\":\"$status\",\"last_updated\":\"$last_updated\"}"

    # Return status code based on freshness
    case "$status" in
        "FRESH") return 0 ;;
        "STALE") return 1 ;;
        "CRITICAL") return 2 ;;
    esac
}

# Trigger agent refresh via OPAL API
refresh_agent_data() {
    local agent="$1"
    local correlation_id="refresh_$(date +%s)_$$"

    log "Starting refresh for agent: $agent (correlation: $correlation_id)"

    # Method 1: Try direct agent refresh endpoint
    local refresh_response
    if refresh_response=$(curl -s -X POST \
        "$BASE_URL/api/opal/agents/$agent/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"correlation_id\":\"$correlation_id\",\"priority\":\"high\"}" \
        2>/dev/null); then

        if echo "$refresh_response" | jq -e '.success == true' >/dev/null 2>&1; then
            log "SUCCESS: Agent $agent refresh initiated via direct endpoint"
            log_json "SUCCESS" "$agent" "refresh_initiated" "{\"method\":\"direct\",\"correlation_id\":\"$correlation_id\"}"
            return 0
        fi
    fi

    # Method 2: Try OPAL workflow trigger
    if [[ -n "$OPAL_API_URL" ]]; then
        local workflow_response
        if workflow_response=$(curl -s -X POST \
            "$OPAL_API_URL/workflows/$agent/trigger" \
            -H "Content-Type: application/json" \
            -d "{\"correlation_id\":\"$correlation_id\",\"refresh_reason\":\"stale_data\"}" \
            2>/dev/null); then

            if echo "$workflow_response" | jq -e '.status' >/dev/null 2>&1; then
                log "SUCCESS: Agent $agent refresh initiated via OPAL workflow"
                log_json "SUCCESS" "$agent" "refresh_initiated" "{\"method\":\"workflow\",\"correlation_id\":\"$correlation_id\"}"
                return 0
            fi
        fi
    fi

    # Method 3: Try force sync endpoint
    local force_sync_response
    if force_sync_response=$(curl -s -X POST \
        "$BASE_URL/api/admin/force-sync" \
        -H "Content-Type: application/json" \
        -d "{\"agent\":\"$agent\",\"correlation_id\":\"$correlation_id\"}" \
        2>/dev/null); then

        if echo "$force_sync_response" | jq -e '.success' >/dev/null 2>&1; then
            log "SUCCESS: Agent $agent refresh initiated via force sync"
            log_json "SUCCESS" "$agent" "refresh_initiated" "{\"method\":\"force_sync\",\"correlation_id\":\"$correlation_id\"}"
            return 0
        fi
    fi

    log "ERROR: Failed to refresh agent $agent - all methods failed"
    log_json "ERROR" "$agent" "refresh_failed" "{\"reason\":\"all_methods_failed\",\"correlation_id\":\"$correlation_id\"}"
    return 1
}

# Wait for agent refresh completion with timeout
wait_for_refresh_completion() {
    local agent="$1"
    local correlation_id="$2"
    local start_time="$3"
    local timeout="$4"

    log "Waiting for refresh completion: $agent (timeout: ${timeout}s)"

    local elapsed=0
    while [[ "$elapsed" -lt "$timeout" ]]; do
        # Check if data has been updated
        local response last_updated current_age

        if response=$(curl -s "$BASE_URL/api/opal/agent-data?agent=$agent" 2>/dev/null); then
            last_updated=$(echo "$response" | jq -r '.lastUpdated // .last_updated // .updated_at // "unknown"')
            current_age=$(calculate_data_age "$last_updated")

            # Check if data is now fresh (updated after we started the refresh)
            if [[ "$current_age" -lt 2 ]]; then  # Less than 2 hours old = fresh
                log "SUCCESS: Agent $agent refresh completed (age now: ${current_age}h)"
                log_json "SUCCESS" "$agent" "refresh_completed" "{\"duration_seconds\":$elapsed,\"new_age_hours\":$current_age,\"correlation_id\":\"$correlation_id\"}"
                return 0
            fi
        fi

        sleep 30
        elapsed=$((elapsed + 30))

        if [[ $((elapsed % 120)) -eq 0 ]]; then  # Log progress every 2 minutes
            log "PROGRESS: Agent $agent refresh still in progress (${elapsed}s elapsed, age: ${current_age}h)"
        fi
    done

    log "TIMEOUT: Agent $agent refresh did not complete within ${timeout}s"
    log_json "TIMEOUT" "$agent" "refresh_timeout" "{\"duration_seconds\":$elapsed,\"correlation_id\":\"$correlation_id\"}"
    return 1
}

# Refresh stale agents with controlled concurrency
refresh_stale_agents() {
    local agents=("$@")
    local stale_agents=()
    local critical_agents=()

    log "Checking freshness for ${#agents[@]} agents..."

    # Identify stale and critical agents
    for agent in "${agents[@]}"; do
        local freshness_status
        if check_agent_freshness "$agent"; then
            log "FRESH: $agent - no refresh needed"
        elif [[ $? -eq 1 ]]; then
            log "STALE: $agent - refresh recommended"
            stale_agents+=("$agent")
        else
            log "CRITICAL: $agent - refresh required immediately"
            critical_agents+=("$agent")
        fi
    done

    # Refresh critical agents first (sequential for reliability)
    if [[ ${#critical_agents[@]} -gt 0 ]]; then
        log "Refreshing ${#critical_agents[@]} critical agents (sequential)..."

        for agent in "${critical_agents[@]}"; do
            log "CRITICAL REFRESH: Starting $agent..."

            if refresh_agent_data "$agent"; then
                local correlation_id="refresh_$(date +%s)_$$"
                local start_time="$(date +%s)"

                if wait_for_refresh_completion "$agent" "$correlation_id" "$start_time" "$REFRESH_TIMEOUT"; then
                    log "CRITICAL SUCCESS: $agent refresh completed"
                else
                    log "CRITICAL FAILURE: $agent refresh timed out"
                fi
            else
                log "CRITICAL FAILURE: Could not initiate refresh for $agent"
            fi
        done
    fi

    # Refresh stale agents (parallel with controlled concurrency)
    if [[ ${#stale_agents[@]} -gt 0 ]]; then
        log "Refreshing ${#stale_agents[@]} stale agents (parallel, max $CONCURRENT_REFRESHES concurrent)..."

        local pids=()
        local count=0

        for agent in "${stale_agents[@]}"; do
            # Wait if we've reached max concurrent refreshes
            if [[ ${#pids[@]} -ge "$CONCURRENT_REFRESHES" ]]; then
                wait "${pids[0]}"
                pids=("${pids[@]:1}")  # Remove first element
            fi

            # Start refresh in background
            (
                log "STALE REFRESH: Starting $agent..."
                if refresh_agent_data "$agent"; then
                    local correlation_id="refresh_$(date +%s)_$$"
                    local start_time="$(date +%s)"

                    if wait_for_refresh_completion "$agent" "$correlation_id" "$start_time" "$REFRESH_TIMEOUT"; then
                        log "STALE SUCCESS: $agent refresh completed"
                    else
                        log "STALE FAILURE: $agent refresh timed out"
                    fi
                else
                    log "STALE FAILURE: Could not initiate refresh for $agent"
                fi
            ) &

            pids+=($!)
            ((count++))
            log "PROGRESS: Started refresh $count/${#stale_agents[@]} for $agent"
        done

        # Wait for all remaining refreshes
        log "Waiting for all stale agent refreshes to complete..."
        wait
    fi

    log "Refresh cycle completed. Critical: ${#critical_agents[@]}, Stale: ${#stale_agents[@]}"
}

# Generate freshness report
generate_freshness_report() {
    local agents=("$@")
    local report_file="$LOG_DIR/freshness_report_$(date +%Y%m%d_%H%M%S).json"

    log "Generating freshness report for ${#agents[@]} agents..."

    # Initialize report
    cat > "$report_file" << EOF
{
    "report_metadata": {
        "timestamp": "$(date -Iseconds)",
        "agents_checked": ${#agents[@]},
        "thresholds": {
            "max_age_hours": $MAX_DATA_AGE_HOURS,
            "critical_age_hours": $CRITICAL_DATA_AGE_HOURS
        }
    },
    "agent_freshness": {}
}
EOF

    local fresh_count=0 stale_count=0 critical_count=0

    # Check each agent and add to report
    for agent in "${agents[@]}"; do
        local response last_updated age_hours status

        if response=$(curl -s "$BASE_URL/api/opal/agent-data?agent=$agent" 2>/dev/null) && \
           echo "$response" | jq empty 2>/dev/null; then

            last_updated=$(echo "$response" | jq -r '.lastUpdated // .last_updated // .updated_at // "unknown"')
            age_hours=$(calculate_data_age "$last_updated")

            if [[ "$age_hours" -gt "$CRITICAL_DATA_AGE_HOURS" ]]; then
                status="CRITICAL"
                ((critical_count++))
            elif [[ "$age_hours" -gt "$MAX_DATA_AGE_HOURS" ]]; then
                status="STALE"
                ((stale_count++))
            else
                status="FRESH"
                ((fresh_count++))
            fi

            # Add to report
            local tmp_file
            tmp_file=$(mktemp)
            jq --arg agent "$agent" --arg status "$status" --arg age "$age_hours" --arg updated "$last_updated" \
                '.agent_freshness[$agent] = {
                    "status": $status,
                    "age_hours": ($age | tonumber),
                    "last_updated": $updated,
                    "needs_refresh": ($status != "FRESH")
                }' "$report_file" > "$tmp_file" && mv "$tmp_file" "$report_file"
        else
            # Agent error
            local tmp_file
            tmp_file=$(mktemp)
            jq --arg agent "$agent" \
                '.agent_freshness[$agent] = {
                    "status": "ERROR",
                    "age_hours": null,
                    "last_updated": "unknown",
                    "needs_refresh": true,
                    "error": "Cannot fetch agent data"
                }' "$report_file" > "$tmp_file" && mv "$tmp_file" "$report_file"
        fi
    done

    # Add summary
    local tmp_file
    tmp_file=$(mktemp)
    jq --arg fresh "$fresh_count" --arg stale "$stale_count" --arg critical "$critical_count" \
        '.summary = {
            "fresh": ($fresh | tonumber),
            "stale": ($stale | tonumber),
            "critical": ($critical | tonumber),
            "fresh_percentage": (($fresh | tonumber) * 100 / .report_metadata.agents_checked)
        }' "$report_file" > "$tmp_file" && mv "$tmp_file" "$report_file"

    log "✅ Freshness report generated: $report_file"

    # Display summary
    echo ""
    echo "📊 DATA FRESHNESS SUMMARY:"
    echo "   ✅ Fresh: $fresh_count"
    echo "   ⚠️ Stale: $stale_count"
    echo "   🚨 Critical: $critical_count"
    echo "   📊 Fresh Rate: $(( fresh_count * 100 / ${#agents[@]} ))%"

    return 0
}

# Scheduled freshness optimization
run_scheduled_optimization() {
    local interval="${1:-3600}"  # Default 1 hour
    local agents=("audience_suggester" "geo_audit" "content_optimizer" "strategy_assistant" "performance_analyzer")

    log "Starting scheduled freshness optimization (interval: ${interval}s)"

    while true; do
        log "🔄 Starting freshness optimization cycle..."

        # Generate freshness report
        generate_freshness_report "${agents[@]}"

        # Refresh stale agents
        refresh_stale_agents "${agents[@]}"

        log "✅ Freshness optimization cycle completed"
        log "⏳ Next optimization in ${interval}s..."
        sleep "$interval"
    done
}

# Main command dispatcher
main() {
    case "${1:-help}" in
        "check")
            local agents=("${@:2}")
            [[ ${#agents[@]} -eq 0 ]] && agents=("audience_suggester" "geo_audit" "content_optimizer")
            generate_freshness_report "${agents[@]}"
            ;;
        "refresh")
            local agents=("${@:2}")
            [[ ${#agents[@]} -eq 0 ]] && agents=("audience_suggester" "geo_audit" "content_optimizer")
            refresh_stale_agents "${agents[@]}"
            ;;
        "schedule"|"start")
            local interval="${2:-3600}"
            run_scheduled_optimization "$interval"
            ;;
        "agent")
            local agent="${2:-audience_suggester}"
            check_agent_freshness "$agent"
            ;;
        "help"|*)
            cat << 'EOF'
OPAL Data Freshness Optimizer Commands:

  check [AGENTS...]    - Check freshness status of agents
  refresh [AGENTS...]  - Refresh stale agents
  schedule [INTERVAL]  - Start scheduled optimization (seconds)
  agent AGENT          - Check specific agent freshness
  help                 - Show this help

Examples:
  ./opal-data-freshness-optimizer.sh check
  ./opal-data-freshness-optimizer.sh refresh audience_suggester
  ./opal-data-freshness-optimizer.sh schedule 1800
  ./opal-data-freshness-optimizer.sh agent audience_suggester

Environment Variables:
  OSA_BASE_URL - Base URL for OSA (default: http://localhost:3000)
  OPAL_API_URL - OPAL API endpoint for triggering refreshes
  MAX_DATA_AGE_HOURS - Stale data threshold (default: 24)
  CRITICAL_DATA_AGE_HOURS - Critical threshold (default: 72)
  REFRESH_TIMEOUT - Refresh completion timeout (default: 300s)
EOF
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi