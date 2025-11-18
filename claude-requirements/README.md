# Claude Requirements Gathering System for OSA

This system provides a structured approach to gathering clear, reproducible requirements for new features in the OSA (Optimizely Strategy Assistant) project.

## Overview

The system implements a two-phase questioning approach:
1. **Discovery Phase**: 5 high-level questions about feature context and purpose
2. **Detail Phase**: 5 technical questions about implementation approach

All questions use YES/NO format with smart defaults that can be applied by answering `idk`.

## Key Features

- **Project-scoped**: Lives entirely within this OSA repository
- **Optional and non-blocking**: Only activated when `/requirements-start` is called
- **Non-intrusive**: Does not refactor or change existing OSA functionality
- **Safe failure**: All operations fail gracefully without breaking other development
- **Structured output**: Generates complete requirements specifications ready for implementation

## OSA Integration

The system is aware of OSA's architecture and priorities:

### Priority Order
1. Content Improvements (highest priority)
2. Actionable Analytics Insights
3. Tactics and use cases to improve experience
4. Strategy Plans, phases, and roadmaps

### OSA Categories
- Strategy Plans
- Optimizely DXP Tools
- Analytics Insights
- Experience Optimization

### Integration Points
- DCI Orchestrator awareness
- results-content-optimizer compatibility
- OPAL workflow system integration

## File Structure

```
claude-requirements/
├── README.md                 # This file
├── utils.ts                  # Utility functions for state management
├── requirements-engine.ts    # Core questioning logic
└── examples/                 # Optional examples for reference

requirements/
├── .current-requirement      # Active requirement tracking
├── index.md                  # Summary of all requirements
└── YYYY-MM-DD-HHMM-slug/    # Individual requirement folders
    ├── metadata.json         # State tracking
    ├── 00-initial-request.md # Original description
    ├── 01-discovery-questions.md
    ├── 02-discovery-answers.md
    ├── 03-context-findings.md
    ├── 04-detail-questions.md
    ├── 05-detail-answers.md
    └── 06-requirements-spec.md
```

## Available Commands

Commands are defined in `.claude/commands/` and follow the existing OSA command pattern:

- `/requirements-start [description]` - Begin new requirement gathering
- `/requirements-status` - Check current progress
- `/requirements-current` - Resume current work with details
- `/requirements-end` - Finish or cleanup current requirement
- `/requirements-list` - List all requirements
- `/requirements-remind` - Show system behavior reminder

## Usage Flow

1. **Start**: `/requirements-start "Add user avatar upload functionality"`
2. **Discovery**: Answer 5 high-level questions (yes/no/idk)
3. **Analysis**: System autonomously analyzes codebase
4. **Detail**: Answer 5 technical questions (yes/no/idk)
5. **Specification**: System generates complete requirements document
6. **Complete**: Ready for implementation by future Claude sessions

## Question Examples

### Discovery Questions
- "Will users interact with this feature through the OSA UI? (default: YES)"
- "Does this feature primarily affect content recommendations or analytics insights? (default: content)"
- "Should this feature be aware of the DCI Orchestrator / results-content-optimizer flows? (default: YES when related to Results)"

### Detail Questions
- "Should we reuse existing services and components where possible? (default: YES)"
- "Should this feature participate in the DCI-based Results pipeline? (default: YES for Results-related features)"
- "Is it acceptable to roll this out behind a feature flag initially? (default: YES)"

## State Management

The system uses a simple JSON-based state model:

```json
{
  "id": "2024-11-18-1430-user-avatar-upload",
  "name": "user-avatar-upload",
  "description": "Add user avatar upload functionality...",
  "status": "ACTIVE|COMPLETE|INCOMPLETE|CANCELED",
  "phase": "DISCOVERY|ANALYSIS|DETAIL|SPEC",
  "discoveryQuestionsAnswered": 3,
  "detailQuestionsAnswered": 0
}
```

## Safety Features

- **Non-blocking**: Normal OSA development continues unaffected
- **Single active requirement**: Prevents conflicts and confusion
- **Graceful failure**: File I/O errors don't crash the system
- **Data preservation**: Incomplete work is saved and can be resumed
- **Clean cleanup**: End command provides options for different scenarios

## Implementation Notes

- Uses Node.js file system operations for persistence
- Follows existing OSA TypeScript patterns and conventions
- Integrates with existing `.claude/commands/` pattern
- No external dependencies beyond Node.js built-ins
- All operations are synchronous for simplicity and reliability

## Future Extensions

The system is designed to be extensible:
- Custom question sets for specific feature types
- Integration with GitHub issues or project management
- Automated validation of generated requirements
- Template-based specification generation