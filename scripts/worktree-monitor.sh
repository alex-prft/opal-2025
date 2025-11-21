#!/bin/bash

# Worktree Monitoring System
# Provides comprehensive monitoring and health checks for the 3-worktree system
# Usage: ./scripts/worktree-monitor.sh [--json] [--alerts] [--fix-sync]

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MAIN_WORKTREE="$PROJECT_ROOT"
BUGFIX_WORKTREE="$PROJECT_ROOT/../dev/my-nextjs-app-bugfix"
CLAUDE_WORKTREE="$PROJECT_ROOT/../dev/my-nextjs-app-claude"

# Flags
OUTPUT_JSON=false
SHOW_ALERTS=false
FIX_SYNC=false

# Global variables for status (using simple variables instead of associative arrays)
HEALTH_SCORE=100
ISSUES=""
ISSUES_COUNT=0

# Worktree status variables
MAIN_BRANCH=""
MAIN_COMMIT=""
MAIN_UNCOMMITTED=0
MAIN_UNPUSHED=0
MAIN_BEHIND=0

BUGFIX_BRANCH=""
BUGFIX_COMMIT=""
BUGFIX_UNCOMMITTED=0
BUGFIX_UNPUSHED=0
BUGFIX_BEHIND=0
BUGFIX_AHEAD_MAIN=0
BUGFIX_BEHIND_MAIN=0

CLAUDE_BRANCH=""
CLAUDE_COMMIT=""
CLAUDE_UNCOMMITTED=0
CLAUDE_UNPUSHED=0
CLAUDE_BEHIND=0
CLAUDE_AHEAD_MAIN=0
CLAUDE_BEHIND_MAIN=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            OUTPUT_JSON=true
            shift
            ;;
        --alerts)
            SHOW_ALERTS=true
            shift
            ;;
        --fix-sync)
            FIX_SYNC=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--json] [--alerts] [--fix-sync]"
            echo "  --json      Output results in JSON format"
            echo "  --alerts    Show only alerts and issues"
            echo "  --fix-sync  Automatically fix synchronization issues"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Function to log with timestamp and color
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    if [[ "$OUTPUT_JSON" == "false" ]]; then
        case $level in
            "INFO")
                echo -e "${BLUE}[INFO]${NC} $timestamp - $message"
                ;;
            "WARN")
                echo -e "${YELLOW}[WARN]${NC} $timestamp - $message"
                ;;
            "ERROR")
                echo -e "${RED}[ERROR]${NC} $timestamp - $message"
                ;;
            "SUCCESS")
                echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message"
                ;;
        esac
    fi
}

# Function to add issue
add_issue() {
    local issue_type=$1
    local description=$2
    local penalty=$3

    if [[ -n "$ISSUES" ]]; then
        ISSUES="$ISSUES,"
    fi
    ISSUES="$ISSUES{\"type\": \"$issue_type\", \"description\": \"$description\"}"
    ISSUES_COUNT=$((ISSUES_COUNT + 1))
    HEALTH_SCORE=$((HEALTH_SCORE - penalty))
}

# Function to check if directory exists and is a git worktree
check_worktree_exists() {
    local worktree_path=$1
    local worktree_name=$2

    if [[ ! -d "$worktree_path" ]]; then
        log "ERROR" "$worktree_name worktree not found at $worktree_path"
        add_issue "${worktree_name}_missing" "Worktree directory not found" 30
        return 1
    fi

    # For worktrees, .git can be either a directory (main repo) or a file (worktree reference)
    if [[ ! -d "$worktree_path/.git" ]] && [[ ! -f "$worktree_path/.git" ]]; then
        log "ERROR" "$worktree_name is not a valid git worktree"
        add_issue "${worktree_name}_invalid" "Not a valid git repository" 25
        return 1
    fi

    return 0
}

# Function to get git status for a worktree
get_worktree_status() {
    local worktree_path=$1
    local worktree_name=$2

    if ! check_worktree_exists "$worktree_path" "$worktree_name"; then
        return 1
    fi

    cd "$worktree_path"

    local branch=$(git branch --show-current)
    local commit=$(git rev-parse HEAD | cut -c1-7)
    local status=$(git status --porcelain | wc -l | tr -d ' ')
    local unpushed=$(git rev-list @{u}..HEAD 2>/dev/null | wc -l | tr -d ' ' || echo "0")
    local behind=$(git rev-list HEAD..@{u} 2>/dev/null | wc -l | tr -d ' ' || echo "0")

    # Check if working directory is clean
    if [[ "$status" -gt 0 ]]; then
        log "WARN" "$worktree_name has $status uncommitted changes"
        add_issue "${worktree_name}_uncommitted" "$status uncommitted changes" 5
    fi

    # Check sync status
    if [[ "$behind" -gt 0 ]]; then
        log "WARN" "$worktree_name is $behind commits behind upstream"
        add_issue "${worktree_name}_behind" "$behind commits behind upstream" 10
    fi

    if [[ "$unpushed" -gt 0 ]]; then
        log "INFO" "$worktree_name has $unpushed unpushed commits"
    fi

    # Store status in global variables
    case $worktree_name in
        "main")
            MAIN_BRANCH="$branch"
            MAIN_COMMIT="$commit"
            MAIN_UNCOMMITTED="$status"
            MAIN_UNPUSHED="$unpushed"
            MAIN_BEHIND="$behind"
            ;;
        "bugfix")
            BUGFIX_BRANCH="$branch"
            BUGFIX_COMMIT="$commit"
            BUGFIX_UNCOMMITTED="$status"
            BUGFIX_UNPUSHED="$unpushed"
            BUGFIX_BEHIND="$behind"
            ;;
        "claude")
            CLAUDE_BRANCH="$branch"
            CLAUDE_COMMIT="$commit"
            CLAUDE_UNCOMMITTED="$status"
            CLAUDE_UNPUSHED="$unpushed"
            CLAUDE_BEHIND="$behind"
            ;;
    esac

    cd - > /dev/null
}

# Function to check branch divergence
check_branch_divergence() {
    local main_path=$1
    local other_path=$2
    local other_name=$3

    if ! check_worktree_exists "$main_path" "main" || ! check_worktree_exists "$other_path" "$other_name"; then
        return 1
    fi

    cd "$other_path"

    local ahead=$(git rev-list main..HEAD 2>/dev/null | wc -l | tr -d ' ' || echo "0")
    local behind=$(git rev-list HEAD..main 2>/dev/null | wc -l | tr -d ' ' || echo "0")

    if [[ "$ahead" -gt 10 ]]; then
        log "WARN" "$other_name is $ahead commits ahead of main (consider merging)"
        add_issue "${other_name}_far_ahead" "$ahead commits ahead of main" 15
    fi

    if [[ "$behind" -gt 5 ]]; then
        log "WARN" "$other_name is $behind commits behind main (consider rebasing)"
        add_issue "${other_name}_far_behind" "$behind commits behind main" 15
    fi

    # Store divergence info
    case $other_name in
        "bugfix")
            BUGFIX_AHEAD_MAIN="$ahead"
            BUGFIX_BEHIND_MAIN="$behind"
            ;;
        "claude")
            CLAUDE_AHEAD_MAIN="$ahead"
            CLAUDE_BEHIND_MAIN="$behind"
            ;;
    esac

    cd - > /dev/null
}

# Function to fix synchronization issues
fix_sync_issues() {
    if [[ "$FIX_SYNC" == "false" ]]; then
        return 0
    fi

    log "INFO" "Attempting to fix synchronization issues..."

    # Fix bugfix-lab if it's behind main
    if [[ "$BUGFIX_BEHIND_MAIN" -gt 0 ]]; then
        log "INFO" "Syncing bugfix-lab with main..."
        cd "$BUGFIX_WORKTREE"

        # Save any uncommitted work
        if [[ "$BUGFIX_UNCOMMITTED" -gt 0 ]]; then
            git stash push -m "Auto-stash before sync - $(date)"
            log "INFO" "Stashed uncommitted changes in bugfix-lab"
        fi

        git fetch origin
        if git rebase origin/main; then
            log "SUCCESS" "Bugfix-lab successfully synced with main"
            git push --force-with-lease origin bugfix-lab
        else
            log "ERROR" "Failed to rebase bugfix-lab, manual intervention required"
            add_issue "bugfix_rebase_failed" "Rebase failed, conflicts need resolution" 20
        fi

        cd - > /dev/null
    fi

    # Commit any uncommitted changes in claude-lab if they're configuration-related
    if [[ "$CLAUDE_UNCOMMITTED" -gt 0 ]]; then
        cd "$CLAUDE_WORKTREE"

        # Check if it's just tsconfig.json changes
        local modified_files=$(git diff --name-only)
        if [[ "$modified_files" == "tsconfig.json" ]]; then
            log "INFO" "Auto-committing tsconfig.json changes in claude-lab"
            git add tsconfig.json
            git commit -m "Auto-commit: TypeScript configuration update

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
            git push origin claude-lab
            log "SUCCESS" "Claude-lab configuration changes committed"
        else
            log "WARN" "Multiple uncommitted files in claude-lab, skipping auto-commit"
        fi

        cd - > /dev/null
    fi
}

# Function to output results
output_results() {
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "{"
        echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
        echo "  \"health_score\": $HEALTH_SCORE,"
        echo "  \"worktrees\": {"
        echo "    \"main\": {"
        echo "      \"branch\": \"$MAIN_BRANCH\","
        echo "      \"commit\": \"$MAIN_COMMIT\","
        echo "      \"uncommitted_changes\": $MAIN_UNCOMMITTED,"
        echo "      \"unpushed_commits\": $MAIN_UNPUSHED,"
        echo "      \"behind_upstream\": $MAIN_BEHIND"
        echo "    },"
        echo "    \"bugfix\": {"
        echo "      \"branch\": \"$BUGFIX_BRANCH\","
        echo "      \"commit\": \"$BUGFIX_COMMIT\","
        echo "      \"uncommitted_changes\": $BUGFIX_UNCOMMITTED,"
        echo "      \"unpushed_commits\": $BUGFIX_UNPUSHED,"
        echo "      \"behind_upstream\": $BUGFIX_BEHIND,"
        echo "      \"ahead_of_main\": $BUGFIX_AHEAD_MAIN,"
        echo "      \"behind_main\": $BUGFIX_BEHIND_MAIN"
        echo "    },"
        echo "    \"claude\": {"
        echo "      \"branch\": \"$CLAUDE_BRANCH\","
        echo "      \"commit\": \"$CLAUDE_COMMIT\","
        echo "      \"uncommitted_changes\": $CLAUDE_UNCOMMITTED,"
        echo "      \"unpushed_commits\": $CLAUDE_UNPUSHED,"
        echo "      \"behind_upstream\": $CLAUDE_BEHIND,"
        echo "      \"ahead_of_main\": $CLAUDE_AHEAD_MAIN,"
        echo "      \"behind_main\": $CLAUDE_BEHIND_MAIN"
        echo "    }"
        echo "  },"
        echo "  \"issues\": [$ISSUES]"
        echo "}"
    else
        echo ""
        echo "=========================================="
        echo "       WORKTREE MONITORING REPORT"
        echo "=========================================="
        echo "Timestamp: $(date)"
        echo "Health Score: $HEALTH_SCORE/100"
        echo ""

        if [[ "$SHOW_ALERTS" == "false" ]] || [[ $ISSUES_COUNT -eq 0 ]]; then
            echo "WORKTREE STATUS:"
            echo "  Main ($MAIN_BRANCH): $MAIN_COMMIT | Changes: $MAIN_UNCOMMITTED | Behind: $MAIN_BEHIND"
            echo "  Bugfix ($BUGFIX_BRANCH): $BUGFIX_COMMIT | Changes: $BUGFIX_UNCOMMITTED | Behind Main: $BUGFIX_BEHIND_MAIN"
            echo "  Claude ($CLAUDE_BRANCH): $CLAUDE_COMMIT | Changes: $CLAUDE_UNCOMMITTED | Behind Main: $CLAUDE_BEHIND_MAIN"
            echo ""
        fi

        if [[ $ISSUES_COUNT -gt 0 ]]; then
            echo "HEALTH ISSUES:"
            # Parse and display issues (simple parsing since we control the format)
            echo "$ISSUES" | sed 's/},{/\n/g' | sed 's/^{//; s/}$//' | while IFS= read -r issue; do
                if [[ -n "$issue" ]]; then
                    local type=$(echo "$issue" | sed 's/.*"type": *"\([^"]*\)".*/\1/')
                    local desc=$(echo "$issue" | sed 's/.*"description": *"\([^"]*\)".*/\1/')
                    echo "  ⚠️  $type: $desc"
                fi
            done
            echo ""
        fi

        if [[ "$HEALTH_SCORE" -ge 90 ]]; then
            echo -e "${GREEN}✅ Worktree system is healthy${NC}"
        elif [[ "$HEALTH_SCORE" -ge 70 ]]; then
            echo -e "${YELLOW}⚠️  Worktree system has minor issues${NC}"
        else
            echo -e "${RED}❌ Worktree system requires attention${NC}"
        fi
        echo "=========================================="
    fi
}

# Main execution
main() {
    if [[ "$OUTPUT_JSON" == "false" ]]; then
        log "INFO" "Starting worktree monitoring scan..."
    fi

    # Check all worktrees
    get_worktree_status "$MAIN_WORKTREE" "main"
    get_worktree_status "$BUGFIX_WORKTREE" "bugfix"
    get_worktree_status "$CLAUDE_WORKTREE" "claude"

    # Check branch divergence
    check_branch_divergence "$MAIN_WORKTREE" "$BUGFIX_WORKTREE" "bugfix"
    check_branch_divergence "$MAIN_WORKTREE" "$CLAUDE_WORKTREE" "claude"

    # Fix issues if requested
    fix_sync_issues

    # Output results
    output_results
}

# Execute main function
main "$@"