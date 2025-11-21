#!/bin/bash

# Worktree Health Check System
# Automated monitoring with alerts and optional auto-fixing
# Usage: ./scripts/worktree-health-check.sh [--auto-fix] [--notify] [--schedule]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/worktree-monitor.sh"
HEALTH_LOG="$PROJECT_ROOT/.worktree-health.log"
ALERT_THRESHOLD=70  # Health score below this triggers alerts

# Flags
AUTO_FIX=false
NOTIFY_ALERTS=false
SCHEDULE_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --notify)
            NOTIFY_ALERTS=true
            shift
            ;;
        --schedule)
            SCHEDULE_MODE=true
            shift
            ;;
        -h|--help)
            echo "Worktree Health Check System"
            echo ""
            echo "Usage: $0 [--auto-fix] [--notify] [--schedule]"
            echo ""
            echo "Options:"
            echo "  --auto-fix    Automatically fix detected issues"
            echo "  --notify      Send desktop notifications for alerts"
            echo "  --schedule    Run in schedule mode (less verbose output)"
            echo ""
            echo "Examples:"
            echo "  $0                    # Basic health check"
            echo "  $0 --auto-fix         # Health check with automatic fixes"
            echo "  $0 --notify           # Health check with desktop notifications"
            echo "  $0 --schedule --auto-fix  # Automated mode (for cron jobs)"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Function to send desktop notification (macOS)
send_notification() {
    local title=$1
    local message=$2
    local urgency=${3:-normal}

    if [[ "$NOTIFY_ALERTS" == "true" ]] && command -v osascript > /dev/null; then
        osascript -e "display notification \"$message\" with title \"$title\" sound name \"Glass\""
    fi
}

# Function to log health check results
log_health_result() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local health_score=$1
    local issues_count=$2
    local status=$3

    echo "$timestamp | Score: $health_score | Issues: $issues_count | Status: $status" >> "$HEALTH_LOG"

    # Keep only last 100 entries
    if [[ -f "$HEALTH_LOG" ]]; then
        tail -n 100 "$HEALTH_LOG" > "$HEALTH_LOG.tmp" && mv "$HEALTH_LOG.tmp" "$HEALTH_LOG"
    fi
}

# Function to get health trends
get_health_trend() {
    if [[ ! -f "$HEALTH_LOG" ]]; then
        echo "no-data"
        return
    fi

    local current_score=$(tail -n 1 "$HEALTH_LOG" | cut -d'|' -f2 | cut -d':' -f2 | tr -d ' ')
    local previous_score=$(tail -n 2 "$HEALTH_LOG" | head -n 1 | cut -d'|' -f2 | cut -d':' -f2 | tr -d ' ' 2>/dev/null || echo "$current_score")

    if [[ "$current_score" -gt "$previous_score" ]]; then
        echo "improving"
    elif [[ "$current_score" -lt "$previous_score" ]]; then
        echo "declining"
    else
        echo "stable"
    fi
}

# Function to check if issues need immediate attention
check_critical_issues() {
    local monitor_output=$1

    # Check for critical patterns
    if echo "$monitor_output" | grep -q "rebase_failed\|missing\|invalid"; then
        echo "critical"
    elif echo "$monitor_output" | grep -q "far_ahead\|far_behind"; then
        echo "major"
    elif echo "$monitor_output" | grep -q "uncommitted\|behind"; then
        echo "minor"
    else
        echo "none"
    fi
}

# Function to run health check and parse results
run_health_check() {
    local fix_flag=""
    if [[ "$AUTO_FIX" == "true" ]]; then
        fix_flag="--fix-sync"
    fi

    # Run the monitor script and capture both JSON and regular output
    local json_output=$(bash "$MONITOR_SCRIPT" --json $fix_flag)
    local health_score=$(echo "$json_output" | jq -r '.health_score // 0')
    local issues_count=$(echo "$json_output" | jq -r '.issues | length')
    local issues_severity=$(check_critical_issues "$json_output")

    # Determine overall status
    local status="healthy"
    if [[ "$health_score" -lt 50 ]]; then
        status="critical"
    elif [[ "$health_score" -lt "$ALERT_THRESHOLD" ]]; then
        status="warning"
    fi

    # Log the result
    log_health_result "$health_score" "$issues_count" "$status"

    # Get trend
    local trend=$(get_health_trend)

    # Show results based on mode
    if [[ "$SCHEDULE_MODE" == "false" ]]; then
        echo "=========================================="
        echo "       WORKTREE HEALTH CHECK REPORT"
        echo "=========================================="
        echo "Health Score: $health_score/100"
        echo "Issues Found: $issues_count"
        echo "Severity: $issues_severity"
        echo "Trend: $trend"
        echo "Status: $status"
        echo ""

        if [[ "$issues_count" -gt 0 ]]; then
            echo "Issues Details:"
            echo "$json_output" | jq -r '.issues[] | "  • \(.type): \(.description)"'
            echo ""
        fi

        echo "Worktree Summary:"
        echo "$json_output" | jq -r '
            "  Main: \(.worktrees.main.branch) (\(.worktrees.main.commit)) - \(.worktrees.main.uncommitted_changes) changes",
            "  Bugfix: \(.worktrees.bugfix.branch) (\(.worktrees.bugfix.commit)) - \(.worktrees.bugfix.behind_main) behind main",
            "  Claude: \(.worktrees.claude.branch) (\(.worktrees.claude.commit)) - \(.worktrees.claude.uncommitted_changes) changes"
        '
        echo ""

        if [[ "$AUTO_FIX" == "true" ]] && [[ "$issues_count" -gt 0 ]]; then
            echo "🔧 Auto-fix was enabled. Check above output for fix results."
        fi
    else
        # Schedule mode - only show if there are issues
        if [[ "$health_score" -lt "$ALERT_THRESHOLD" ]] || [[ "$issues_severity" == "critical" ]]; then
            echo "$(date): Worktree health issue detected - Score: $health_score, Issues: $issues_count ($issues_severity)"
        fi
    fi

    # Send notifications if enabled
    if [[ "$NOTIFY_ALERTS" == "true" ]]; then
        case $status in
            "critical")
                send_notification "Worktree Health Critical" "Score: $health_score/100, $issues_count critical issues detected" "critical"
                ;;
            "warning")
                send_notification "Worktree Health Warning" "Score: $health_score/100, $issues_count issues need attention" "normal"
                ;;
        esac

        # Notify about positive trends
        if [[ "$trend" == "improving" ]] && [[ "$health_score" -gt 80 ]]; then
            send_notification "Worktree Health Improved" "Score improved to $health_score/100" "normal"
        fi
    fi

    # Return health score for scripting
    return $((100 - health_score))
}

# Function to show recent health history
show_health_history() {
    if [[ ! -f "$HEALTH_LOG" ]]; then
        echo "No health history available yet."
        return
    fi

    echo "Recent Health History (last 10 checks):"
    echo "----------------------------------------"
    tail -n 10 "$HEALTH_LOG" | while IFS='|' read -r timestamp score_part issues_part status_part; do
        local score=$(echo "$score_part" | cut -d':' -f2 | tr -d ' ')
        local issues=$(echo "$issues_part" | cut -d':' -f2 | tr -d ' ')
        local status=$(echo "$status_part" | cut -d':' -f2 | tr -d ' ')

        # Color code the status
        case $status in
            "healthy")
                echo -e "$timestamp | \033[0;32m$score/100\033[0m | $issues issues | \033[0;32m$status\033[0m"
                ;;
            "warning")
                echo -e "$timestamp | \033[1;33m$score/100\033[0m | $issues issues | \033[1;33m$status\033[0m"
                ;;
            "critical")
                echo -e "$timestamp | \033[0;31m$score/100\033[0m | $issues issues | \033[0;31m$status\033[0m"
                ;;
        esac
    done
}

# Function to setup automated monitoring (cron job)
setup_automated_monitoring() {
    echo "Setting up automated worktree monitoring..."

    # Create a cron job that runs every 30 minutes
    local cron_command="*/30 * * * * $SCRIPT_DIR/worktree-health-check.sh --schedule --auto-fix >> /tmp/worktree-monitor.log 2>&1"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "worktree-health-check.sh"; then
        echo "Automated monitoring is already set up."
    else
        # Add to crontab
        (crontab -l 2>/dev/null; echo "$cron_command") | crontab -
        echo "✅ Automated monitoring set up successfully!"
        echo "   - Runs every 30 minutes"
        echo "   - Auto-fixes minor issues"
        echo "   - Logs to /tmp/worktree-monitor.log"
        echo ""
        echo "To disable: crontab -e and remove the worktree-health-check line"
    fi
}

# Function to run interactive mode
interactive_mode() {
    while true; do
        echo ""
        echo "Worktree Health Check - Interactive Mode"
        echo "========================================"
        echo "1) Run health check"
        echo "2) Run health check with auto-fix"
        echo "3) Show health history"
        echo "4) Setup automated monitoring"
        echo "5) Export health data"
        echo "6) Exit"
        echo ""
        read -p "Select option (1-6): " choice

        case $choice in
            1)
                run_health_check
                ;;
            2)
                AUTO_FIX=true
                run_health_check
                AUTO_FIX=false
                ;;
            3)
                show_health_history
                ;;
            4)
                setup_automated_monitoring
                ;;
            5)
                if [[ -f "$HEALTH_LOG" ]]; then
                    local export_file="worktree-health-export-$(date +%Y%m%d-%H%M%S).csv"
                    echo "timestamp,health_score,issues_count,status" > "$export_file"
                    cat "$HEALTH_LOG" | sed 's/|/,/g' | sed 's/ //g' >> "$export_file"
                    echo "Health data exported to: $export_file"
                else
                    echo "No health data to export."
                fi
                ;;
            6)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                echo "Invalid option. Please select 1-6."
                ;;
        esac
    done
}

# Main execution
main() {
    # Check if monitor script exists
    if [[ ! -f "$MONITOR_SCRIPT" ]]; then
        echo "Error: Worktree monitor script not found at $MONITOR_SCRIPT"
        echo "Please ensure the worktree-monitor.sh script is in the same directory."
        exit 1
    fi

    # Check for required dependencies
    if ! command -v jq > /dev/null; then
        echo "Warning: jq is not installed. JSON parsing will be limited."
        echo "Install with: brew install jq (on macOS)"
    fi

    # If no arguments provided, run interactive mode
    if [[ $# -eq 0 ]] && [[ "$SCHEDULE_MODE" == "false" ]]; then
        interactive_mode
    else
        # Run the health check
        run_health_check
    fi
}

# Execute main function with all arguments
main "$@"