# Requirements Index

<<<<<<< HEAD
This file contains a summary of all requirements in this project.

| Feature Name | Status | Phase | Created | Path |
|--------------|--------|-------|---------|------|

## Status Legend

- ✅ COMPLETE: Ready for implementation
- 🟢 ACTIVE: Currently being defined
- ⚠️ INCOMPLETE: Paused or partially complete
- ❌ CANCELED: Canceled or obsolete

## Usage

Use the Claude Requirements Gathering System commands to manage requirements:

- `/requirements-start [description]` - Begin new requirement
- `/requirements-status` - Check current progress
- `/requirements-current` - Resume current work
- `/requirements-end` - Finish or cleanup current requirement
- `/requirements-list` - See all requirements
- `/requirements-remind` - Show system reminder

## OSA Focus Areas

Features are prioritized in this order:
1. Content Improvements (highest priority)
2. Actionable Analytics Insights
3. Tactics and use cases to improve experience
4. Strategy Plans, phases, and roadmaps

Features fit into these OSA categories:
- Strategy Plans
- Optimizely DXP Tools  
- Analytics Insights
- Experience Optimization
=======
**Last Updated:** Never (no requirements yet)

## Summary

- **Total Requirements:** 0
- **Active:** 0
- **Complete:** 0
- **Cancelled:** 0

## Requirements List

*No requirements have been created yet.*

## Usage

- **Start New Requirement:** `/requirements-start [description]`
- **Check Status:** `/requirements-status`
- **View Current:** `/requirements-current`
- **List All:** `/requirements-list`
- **End Current:** `/requirements-end`

## Claude Requirements Gathering System

### Overview

The Claude Requirements Gathering System is a project-scoped tool for collecting structured, reproducible requirements through an intelligent two-phase questioning approach. It integrates seamlessly with OSA (Optimizely Strategy Assistant) architectural patterns and follows mandatory CLAUDE.md compliance frameworks.

### Key Features

**🔍 Two-Phase Questioning**
- **Discovery Phase:** 5 high-level product and user experience questions
- **Detail Phase:** 5 technical implementation and architecture questions
- **Smart Defaults:** All questions support 'idk' for intelligent default responses

**🏗️ OSA Integration**
- Aligned with OSA Results architecture: 4 equal tiers (Strategy Plans, DXP Tools, Analytics Insights, Experience Optimization)
- Awareness of DCI Orchestrator workflows and OPAL agent integration
- Results tier placement and navigation considerations
- Enterprise security and compliance patterns

**📋 Quality Control Framework**
- **Mandatory TodoWrite tracking** for all development work
- **Quality control agents** at major milestones (results-content-optimizer, opal-integration-validator)
- **CLAUDE.md validation** as final step in all workflows
- **Implementation next steps** with specific quality requirements

**📁 Structured Output**
- Complete requirements package with 8 standardized files
- Full specification documents ready for implementation
- Codebase analysis and context integration
- Quality control and validation requirements

### System Architecture

#### Core Components

**1. TypeScript Utilities (`claude-requirements/utils.ts`)**
- Core interfaces and type definitions
- State management functions
- File I/O operations with error handling
- Question generation and validation logic

**2. Requirements Engine (`claude-requirements/requirements-engine.ts`)**
- Two-phase workflow orchestration
- Answer processing and normalization
- Contextual analysis and specification generation
- Mandatory quality control integration

**3. Command Interface (`.claude/commands/requirements-*.md`)**
- `/requirements-start` - Begin new requirement
- `/requirements-status` - Check current progress
- `/requirements-current` - View detailed current state
- `/requirements-list` - List all requirements
- `/requirements-end` - Complete or cancel requirement
- `/requirements-remind` - Show current question

#### Quality Control Integration

**Mandatory CLAUDE.md Compliance Patterns:**

```typescript
// REQUIRED: Every implementation must follow this pattern
TodoWrite([
  { content: "Implement core functionality", status: "pending", activeForm: "Implementing core functionality" },
  { content: "Add comprehensive tests", status: "pending", activeForm: "Adding comprehensive tests" },
  { content: "Run quality control validation", status: "pending", activeForm: "Running quality control validation" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);

// Launch appropriate quality control agents based on feature type
// For Results page features:
Task({
  subagent_type: "results-content-optimizer",
  description: "Validate Results page content alignment",
  prompt: "Ensure feature aligns with selected Results tier (Strategy Plans/DXP Tools/Analytics Insights/Experience Optimization) and maintains content consistency across the 88+ Results pages architecture"
});

// For OPAL integration features:
Task({
  subagent_type: "opal-integration-validator",
  description: "Validate OPAL pipeline integration",
  prompt: "Validate end-to-end OPAL integration including Force Sync workflows, agent execution, OSA data ingestion, and Results generation for this feature"
});

// For all features (mandatory final step):
Task({
  subagent_type: "general-purpose",
  description: "CLAUDE.md compliance validation",
  prompt: "Perform comprehensive CLAUDE.md compliance validation ensuring all patterns are followed, TodoWrite tracking is complete, and quality control agents have been used appropriately"
});
```

**Quality Control Agents:**
- **results-content-optimizer:** For Results page content alignment across 88+ pages and 4 major Results tiers
- **opal-integration-validator:** For OPAL integration pipeline validation and Force Sync workflow testing
- **general-purpose (CLAUDE.md checker):** For final pattern compliance validation and comprehensive quality review

**Results Page Integration Context:**
- **Strategy Plans (22 sub-pages):** OSA, Phases, Quick Wins, Maturity, Roadmap
- **DXP Tools (20 sub-pages):** Content Recs, CMS, ODP, WEBX, CMP
- **Analytics Insights (27 sub-pages):** OSA, Content, Audiences, CX, Experimentation, Personalization
- **Experience Optimization (19 sub-pages):** Content, Personalization, Experimentation, UX, Technology

**OPAL Agent Integration Guidance:**
- **30+ specialized agents** with complete configurations and tool mappings
- **Agent-to-widget mappings** for all content functionality
- **Complete tier configurations** ensuring AI workflow automation across all Results pages

### Implementation Learnings

#### 1. What Problem Did This Solve?

**Inconsistent Requirements Gathering**
- **Before:** Ad-hoc requirement collection with inconsistent formats and completeness
- **Problem:** Incomplete specifications leading to rework, scope creep, and implementation delays
- **Solution:** Structured two-phase questioning with standardized output format

**Missing OSA Context Integration**
- **Before:** Requirements collected without awareness of OSA architectural patterns
- **Problem:** Requirements that didn't align with OSA priorities or integration patterns
- **Solution:** OSA-aware question design with DCI Orchestrator and OPAL integration considerations

**No Quality Control Framework**
- **Before:** Requirements completed without validation or quality assurance
- **Problem:** Specifications that didn't follow CLAUDE.md patterns or missed quality requirements
- **Solution:** Mandatory quality control agent integration with TodoWrite tracking

#### 2. Why This Approach Over Alternatives?

**Two-Phase Questioning vs. Single-Phase Collection**
- **Alternative Considered:** Single comprehensive questionnaire
- **Why Rejected:** Cognitive overload, context switching between product and technical concerns
- **Chosen Approach:** Discovery phase first, then contextual technical questions
- **Result:** Better question relevance and more thoughtful responses

**Project-Scoped vs. Global Tool**
- **Alternative Considered:** Global Claude Code feature for all projects
- **Why Rejected:** Requirements gathering needs project-specific context and patterns
- **Chosen Approach:** Project-scoped tool aware of OSA architecture
- **Result:** Contextual questions and OSA-aligned specifications

**Structured Output vs. Free-Form Documentation**
- **Alternative Considered:** Free-form requirement documents
- **Why Rejected:** Inconsistent format, missing key sections, variable quality
- **Chosen Approach:** Standardized 8-file output structure with mandatory sections
- **Result:** Consistent, complete, implementation-ready specifications

#### 3. What Patterns Should Future Changes Follow?

**✅ Always Use OSA-Aware Question Design**
```typescript
// Questions should reference OSA architectural patterns
{
  question: "Will this feature need to integrate with or be aware of the DCI Orchestrator workflows?",
  context: "DCI integration affects Results page placement, OPAL agent involvement, and data flow patterns.",
  defaultAnswer: "NO"
}
```

**✅ Implement Mandatory Quality Control**
```typescript
// Every generated specification must include quality control requirements
spec += `## Quality Control Requirements\n\n`;
spec += `### Mandatory CLAUDE.md Compliance\n\n`;
spec += `This implementation MUST follow CLAUDE.md patterns:\n\n`;
```

**✅ Use Context-Aware Default Answers**
```typescript
// Smart defaults based on OSA patterns and typical use cases
const osaPriorityDefaults = {
  uiInvolvement: "YES", // Most OSA features involve UI
  nonAdminAccess: "YES", // Default to broad access
  contentFocus: "YES", // Content is highest OSA priority
  dciIntegration: "NO", // Not all features need DCI
  navigationPlacement: "YES" // Most features need navigation
};
```

**✅ Follow Structured File Organization**
```
requirements/[requirement-id]/
├── 00-initial-request.md (Original description)
├── 01-discovery-questions.md (Discovery phase questions)
├── 02-discovery-answers.md (Discovery responses)
├── 03-context-findings.md (Codebase analysis)
├── 04-detail-questions.md (Technical detail questions)
├── 05-detail-answers.md (Technical responses)
├── 06-requirements-spec.md (Final specification)
└── 07-implementation-next-steps.md (Quality control requirements)
```

#### 4. What Mistakes Should Be Avoided?

**❌ Never Skip Quality Control Integration**
```typescript
// WRONG: Generate specification without quality control requirements
return { specification: basicSpec };

// CORRECT: Always include mandatory quality control section
spec += mandatoryQualityControlSection;
this.logMandatoryNextSteps(requirementId, metadata);
```

**❌ Don't Use Generic Questions Without OSA Context**
```typescript
// WRONG: Generic software development questions
"Will this be a web application?"

// CORRECT: OSA-specific contextual questions
"Will this feature primarily involve changes to the OSA UI that users interact with?"
```

**❌ Avoid Incomplete Specification Generation**
```typescript
// WRONG: Generate spec without all required sections
const spec = generateBasicSpec(answers);

// CORRECT: Include all mandatory sections
spec += problemStatement + functionalRequirements + technicalRequirements +
         qualityControlRequirements + implementationNotes + integrationPoints;
```

**❌ Never Skip TodoWrite Tracking Requirements**
```typescript
// WRONG: Specification without TodoWrite patterns
"Implementation should follow standard practices"

// CORRECT: Specific TodoWrite requirements with examples
"All development work must be tracked with TodoWrite for visibility"
// Include exact TodoWrite pattern examples
```

### File Structure Reference

```
claude-requirements/
├── utils.ts (Core utilities and interfaces)
├── requirements-engine.ts (Main workflow logic)
└── current-requirement.json (Active requirement tracking)

.claude/commands/
├── requirements-start.md (Start new requirement)
├── requirements-status.md (Check current status)
├── requirements-current.md (View current details)
├── requirements-list.md (List all requirements)
├── requirements-end.md (Complete/cancel requirement)
└── requirements-remind.md (Show current question)

requirements/
├── index.md (This file - system overview)
└── [requirement-id]/ (Individual requirement directories)
    ├── metadata.json (Requirement metadata)
    ├── 00-initial-request.md
    ├── 01-discovery-questions.md
    ├── 02-discovery-answers.md
    ├── 03-context-findings.md
    ├── 04-detail-questions.md
    ├── 05-detail-answers.md
    ├── 06-requirements-spec.md
    └── 07-implementation-next-steps.md
```

### Success Indicators

**✅ Successful Implementation:**
- All TypeScript files compile without errors
- Commands respond appropriately to user input
- Two-phase questioning workflow operates correctly
- Quality control requirements generated for all specifications
- OSA architectural patterns integrated throughout
- CLAUDE.md compliance mandatory in all outputs

**✅ Quality Metrics:**
- 100% of specifications include quality control requirements
- 100% of specifications include TodoWrite tracking patterns
- 100% of specifications reference appropriate quality control agents
- 100% of questions include OSA-specific context
- 100% of outputs follow standardized file structure

### Integration with OSA Development

This system integrates seamlessly with OSA development workflows:

**Development Architecture Alignment:**
1. **OSA Results Tiers:** Strategy Plans, DXP Tools, Analytics Insights, Experience Optimization (4 equal tiers)
2. React 19 + Next.js 16 + TypeScript strict mode compatibility
3. Supabase integration with enterprise guardrails
4. OPAL workflow system awareness
5. Enterprise security and compliance patterns

**Quality Assurance Integration:**
- Mandatory use of results-content-optimizer for Results page changes
- Mandatory use of opal-integration-validator for OPAL integration work
- Mandatory use of general-purpose (CLAUDE.md checker) for final validation
- Complete TodoWrite tracking for all development work

---

*Generated by Claude Requirements Gathering System*
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
