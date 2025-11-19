# OSA Skill Development Workflow

This document provides the complete workflow for creating, organizing, and maintaining skills in the OSA project.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Skill Creation Process](#skill-creation-process)
3. [Directory Organization](#directory-organization)
4. [Best Practices](#best-practices)
5. [Quality Control](#quality-control)
6. [Maintenance](#maintenance)

## Quick Reference

### Available Skills
- **skill-creator** - Framework for creating new skills
- **content-review** - Content review and optimization tools
- **opal-integration-workflow** - OPAL API integration patterns (OSA-specific)

### Skill Invocation
```bash
# Use a skill in Claude Code
Skill: "skill-name"
```

### Directory Structure Template
```
skill-name/
├── SKILL.md          # Main skill documentation (required)
├── scripts/          # Reusable code and templates (optional)
├── references/       # Domain knowledge documentation (optional)
└── assets/           # Files for output use (optional)
```

## Skill Creation Process

Follow the 6-step process defined by the skill-creator framework:

### Step 1: Understanding with Concrete Examples
**Objective**: Clearly define what the skill should accomplish

**Questions to Answer**:
- What specific tasks will this skill help with?
- What are concrete examples of how it will be used?
- What triggers should invoke this skill?

**Example for OPAL Skill**:
- "Help me create a new OPAL API route"
- "Validate OPAL webhook payload"
- "Troubleshoot OPAL integration issues"

### Step 2: Planning Reusable Contents
**Objective**: Identify what scripts, references, and assets would be helpful

**Analysis Framework**:
1. **Scripts** - What code gets rewritten repeatedly?
2. **References** - What domain knowledge is needed repeatedly?
3. **Assets** - What template files or resources are needed?

**Example for OPAL Skill**:
- **Scripts**: API route template, validation helper
- **References**: API patterns, workflow configuration
- **Assets**: None needed (code templates covered by scripts)

### Step 3: Initialize Skill Directory
**Objective**: Create proper directory structure

```bash
# Create skill directory
mkdir -p .claude/skills/skill-name/{scripts,references,assets}

# Create main SKILL.md file
touch .claude/skills/skill-name/SKILL.md
```

### Step 4: Implement Skill Contents
**Objective**: Create the actual skill resources

#### 4.1 Scripts Implementation
- Create reusable code templates
- Test all scripts for functionality
- Add comprehensive comments
- Use TypeScript for type safety

#### 4.2 References Implementation
- Write comprehensive documentation
- Include concrete examples
- Structure for easy navigation
- Keep information current and accurate

#### 4.3 SKILL.md Implementation
**Required YAML Frontmatter**:
```yaml
---
name: skill-name
description: Comprehensive description including what the skill does and when to use it. Include specific triggers and contexts.
---
```

**Required Sections**:
- Core capabilities overview
- Quick start guide
- Reference to bundled resources
- Best practices
- Troubleshooting guide

### Step 5: Quality Validation
**Objective**: Ensure skill meets quality standards

**Validation Checklist**:
- [ ] SKILL.md has proper frontmatter
- [ ] Description is comprehensive and includes triggers
- [ ] All bundled resources are referenced from SKILL.md
- [ ] Scripts are tested and functional
- [ ] Documentation is clear and actionable
- [ ] File organization follows standards

### Step 6: Integration and Iteration
**Objective**: Deploy skill and improve based on usage

- Test skill with real use cases
- Gather feedback from team members
- Iterate on documentation and functionality
- Update based on changing requirements

## Directory Organization

### Skills Directory Structure
```
.claude/skills/
├── SKILL_DEVELOPMENT_WORKFLOW.md    # This documentation
├── skill-creator/                   # Skill creation framework
├── content-review/                  # Content optimization skill
├── opal-integration-workflow/       # OPAL API patterns
└── [future-skills]/                 # Additional OSA-specific skills
```

### Individual Skill Structure
```
skill-name/
├── SKILL.md                        # Required: Main skill documentation
├── scripts/                        # Optional: Reusable code
│   ├── template-file.ts            # Code templates
│   └── helper-utilities.ts         # Utility functions
├── references/                     # Optional: Domain knowledge
│   ├── patterns.md                 # Common patterns
│   └── configuration.md            # Setup and config info
└── assets/                         # Optional: Output files
    ├── templates/                  # File templates
    └── examples/                   # Example implementations
```

## Best Practices

### Skill Design Principles

#### 1. Progressive Disclosure
- Keep SKILL.md concise and essential
- Move detailed information to references
- Use clear navigation between files

#### 2. Token Efficiency
- Challenge every piece of information
- Prefer concise examples over verbose explanations
- Only include what Claude doesn't already know

#### 3. Appropriate Degrees of Freedom
- **High freedom**: Multiple valid approaches exist
- **Medium freedom**: Preferred patterns with variation
- **Low freedom**: Fragile operations requiring specificity

### Implementation Guidelines

#### Scripts
- Test all scripts before including
- Use TypeScript for better tooling
- Include comprehensive error handling
- Add clear usage documentation

#### References
- Structure with table of contents for long files
- Include concrete examples
- Keep one level deep from SKILL.md
- Update regularly as patterns evolve

#### Documentation
- Use imperative/infinitive form ("Create", "Configure")
- Include troubleshooting sections
- Provide integration checklists
- Reference actual file paths and line numbers

## Quality Control

### Pre-Deployment Checklist
- [ ] SKILL.md follows required format
- [ ] Frontmatter includes name and comprehensive description
- [ ] All scripts are tested and functional
- [ ] References are accurate and up-to-date
- [ ] File organization is clean and logical
- [ ] No duplicate or conflicting content
- [ ] Documentation includes examples and troubleshooting

### Code Quality Standards
- TypeScript for all scripts
- Comprehensive error handling
- Structured logging with correlation IDs
- Environment-aware configuration
- Performance optimization considerations

### Documentation Standards
- Clear, actionable instructions
- Concrete examples for all patterns
- Troubleshooting guides for common issues
- Integration checklists for complex workflows
- Regular updates as patterns evolve

## Maintenance

### Regular Maintenance Tasks

#### Monthly Reviews
- [ ] Update skills based on usage patterns
- [ ] Review and update documentation
- [ ] Test all scripts for continued functionality
- [ ] Clean up obsolete or deprecated content

#### After Major Changes
- [ ] Update skills affected by architecture changes
- [ ] Test all OPAL integration patterns
- [ ] Update environment configuration examples
- [ ] Validate all reference documentation

### Skill Lifecycle Management

#### Creation
1. Identify repetitive development patterns
2. Follow 6-step skill creation process
3. Validate with real use cases
4. Document thoroughly

#### Evolution
1. Monitor usage patterns
2. Gather developer feedback
3. Update based on changing requirements
4. Maintain backward compatibility when possible

#### Deprecation
1. Mark deprecated skills clearly
2. Provide migration paths to newer patterns
3. Set timeline for removal
4. Communicate changes to team

## OSA-Specific Considerations

### Integration with CLAUDE.md
- All skill development should align with CLAUDE.md patterns
- Use TodoWrite for tracking skill development tasks
- Include quality control validation steps
- Follow OSA performance and security guidelines

### OPAL Integration Patterns
- Leverage the opal-integration-workflow skill
- Follow established authentication patterns
- Use correlation ID tracking consistently
- Implement comprehensive error handling

### Development Workflow Integration
- Skills should support the OSA development lifecycle
- Provide templates for common Next.js patterns
- Include Supabase guardrails integration
- Support both development and production environments

## Troubleshooting

### Common Issues

**Skill Not Loading**
- Check SKILL.md frontmatter format
- Verify skill name matches directory name
- Ensure description field is present and comprehensive

**Scripts Not Working**
- Verify TypeScript compilation
- Check environment variable requirements
- Test scripts in isolation
- Review error logs for specific issues

**Documentation Unclear**
- Add more concrete examples
- Include troubleshooting sections
- Provide step-by-step instructions
- Reference actual file paths

### Getting Help

1. Review this workflow documentation
2. Check the skill-creator skill for guidance
3. Examine existing skills as examples
4. Test with the OPAL integration workflow skill
5. Consult the OSA team for domain-specific questions

## Future Skill Ideas

Based on OSA development patterns, consider creating skills for:

1. **Next.js API Route Generator** - Standardized API route creation
2. **Results Page Content Optimizer** - Content generation and optimization
3. **Supabase Guardrails Configurator** - Secure database patterns
4. **Webhook Stream Manager** - Real-time integration patterns
5. **OSA Component Generator** - Standardized React component patterns

Each should follow this same development workflow for consistency and quality.