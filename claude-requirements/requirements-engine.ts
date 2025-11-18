/**
 * Requirements Engine - Core logic for the two-phase questioning system
<<<<<<< HEAD
 * 
 * This file implements the main workflow logic for gathering requirements
 * through discovery and detail phases.
=======
 *
 * This file implements the main workflow logic for gathering requirements
 * through discovery and detail phases with mandatory CLAUDE.md compliance.
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
 */

import {
  RequirementMetadata,
  Question,
  QuestionAnswer,
  generateRequirementId,
  getCurrentRequirement,
  setCurrentRequirement,
  clearCurrentRequirement,
  createRequirementDirectory,
  loadRequirementMetadata,
  saveRequirementMetadata,
  writeRequirementFile,
  appendToRequirementFile,
  readRequirementFile,
  updateRequirementsIndex,
  generateDiscoveryQuestions,
<<<<<<< HEAD
  generateDetailQuestions
} from './utils';

export class RequirementsEngine {
  
=======
  generateDetailQuestions,
  RequirementsError
} from './utils';

export class RequirementsEngine {

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  /**
   * Start a new requirement gathering process
   */
  async startRequirement(description: string): Promise<{ success: boolean; message: string; nextQuestion?: string }> {
    try {
      // Check if there's already an active requirement
      const currentReq = getCurrentRequirement();
      if (currentReq) {
        const metadata = loadRequirementMetadata(currentReq);
        if (metadata && metadata.status === 'ACTIVE') {
          return {
            success: false,
            message: `There is already an ACTIVE requirement: ${metadata.name} (${currentReq}). Use /requirements-end to finalize or /requirements-current to resume.`
          };
        }
      }

      // Generate new requirement ID
      const requirementId = generateRequirementId(description);
      const shortName = this.extractShortName(description);

      // Create requirement directory
      createRequirementDirectory(requirementId);

      // Initialize metadata
      const metadata: RequirementMetadata = {
        id: requirementId,
        name: shortName,
        description: description,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
        phase: 'DISCOVERY',
        discoveryQuestionsCount: 5,
        discoveryQuestionsAnswered: 0,
        detailQuestionsCount: 5,
        detailQuestionsAnswered: 0
      };

      // Save initial files
      saveRequirementMetadata(requirementId, metadata);
      writeRequirementFile(requirementId, '00-initial-request.md', `# Initial Request\n\n**Date:** ${new Date().toLocaleString()}\n\n**Description:**\n${description}\n`);
<<<<<<< HEAD
      
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
      // Set as current requirement
      setCurrentRequirement(requirementId);

      // Perform quick codebase analysis
      await this.performQuickAnalysis(requirementId, description);

      // Generate and save discovery questions
      const questions = generateDiscoveryQuestions(description);
      this.saveDiscoveryQuestions(requirementId, questions);

      // Update index
      updateRequirementsIndex();

      // Return first question
      const firstQuestion = this.formatQuestion(questions[0]);
      return {
        success: true,
        message: `✅ Started new requirement: ${shortName}\n\n🔍 **Discovery Phase (1/5)**\n\n${firstQuestion}`,
        nextQuestion: firstQuestion
      };

    } catch (error) {
      console.error('Error starting requirement:', error);
      return {
        success: false,
        message: `❌ Error starting requirement: ${error.message}`
      };
    }
  }

  /**
   * Handle an answer to a discovery or detail question
   */
  async handleAnswer(answer: string): Promise<{ success: boolean; message: string; nextQuestion?: string; completed?: boolean }> {
    try {
      const currentReq = getCurrentRequirement();
      if (!currentReq) {
        return {
          success: false,
          message: "No active requirement. Use /requirements-start to begin."
        };
      }

      const metadata = loadRequirementMetadata(currentReq);
      if (!metadata) {
        return {
          success: false,
          message: "Could not load requirement metadata."
        };
      }

      if (metadata.phase === 'DISCOVERY') {
        return await this.handleDiscoveryAnswer(currentReq, metadata, answer);
      } else if (metadata.phase === 'DETAIL') {
        return await this.handleDetailAnswer(currentReq, metadata, answer);
      }

      return {
        success: false,
        message: `Cannot handle answer in phase: ${metadata.phase}`
      };

    } catch (error) {
      console.error('Error handling answer:', error);
      return {
        success: false,
        message: `❌ Error processing answer: ${error.message}`
      };
    }
  }

  /**
   * Get the current status of an active requirement
   */
  getStatus(): { success: boolean; message: string; nextQuestion?: string } {
    try {
      const currentReq = getCurrentRequirement();
      if (!currentReq) {
        return {
          success: true,
          message: "No active requirement. Use /requirements-start to begin a new one."
        };
      }

      const metadata = loadRequirementMetadata(currentReq);
      if (!metadata) {
        return {
          success: false,
          message: "Could not load requirement metadata. Consider using /requirements-end to clean up."
        };
      }

      let statusMessage = `📋 Active Requirement: ${metadata.name}\n`;
      statusMessage += `Phase: ${metadata.phase}\n`;
      statusMessage += `Progress: Discovery ${metadata.discoveryQuestionsAnswered}/5, Detail ${metadata.detailQuestionsAnswered}/5\n`;

      // Determine next action
      if (metadata.phase === 'DISCOVERY' && metadata.discoveryQuestionsAnswered < 5) {
        const questions = this.loadDiscoveryQuestions(currentReq);
        const nextQuestion = questions[metadata.discoveryQuestionsAnswered];
        statusMessage += `Next: ${this.formatQuestion(nextQuestion)}`;
        return {
          success: true,
          message: statusMessage,
          nextQuestion: this.formatQuestion(nextQuestion)
        };
      } else if (metadata.phase === 'DETAIL' && metadata.detailQuestionsAnswered < 5) {
        const questions = this.loadDetailQuestions(currentReq);
        const nextQuestion = questions[metadata.detailQuestionsAnswered];
        statusMessage += `Next: ${this.formatQuestion(nextQuestion)}`;
        return {
          success: true,
          message: statusMessage,
          nextQuestion: this.formatQuestion(nextQuestion)
        };
      } else if (metadata.phase === 'ANALYSIS') {
        statusMessage += `Next: Analyzing codebase patterns and generating technical questions`;
      } else if (metadata.phase === 'SPEC') {
        statusMessage += `Next: Ready to generate final requirements specification`;
      }

      return {
        success: true,
        message: statusMessage
      };

    } catch (error) {
      console.error('Error getting status:', error);
      return {
        success: false,
        message: `❌ Error getting status: ${error.message}`
      };
    }
  }

  /**
   * Handle discovery phase answer
   */
  private async handleDiscoveryAnswer(requirementId: string, metadata: RequirementMetadata, answer: string): Promise<{ success: boolean; message: string; nextQuestion?: string; completed?: boolean }> {
    const questions = this.loadDiscoveryQuestions(requirementId);
    const currentQuestion = questions[metadata.discoveryQuestionsAnswered];
<<<<<<< HEAD
    
    // Normalize answer
    const normalizedAnswer = this.normalizeAnswer(answer, currentQuestion.defaultAnswer);
    
=======

    // Normalize answer
    const normalizedAnswer = this.normalizeAnswer(answer, currentQuestion.defaultAnswer);

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Save the Q&A
    const qa: QuestionAnswer = {
      question: currentQuestion.question,
      answer: normalizedAnswer,
      timestamp: new Date().toISOString()
    };
<<<<<<< HEAD
    
    this.saveDiscoveryAnswer(requirementId, qa);
    
    // Update metadata
    metadata.discoveryQuestionsAnswered++;
    saveRequirementMetadata(requirementId, metadata);
    
=======

    this.saveDiscoveryAnswer(requirementId, qa);

    // Update metadata
    metadata.discoveryQuestionsAnswered++;
    saveRequirementMetadata(requirementId, metadata);

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Check if discovery is complete
    if (metadata.discoveryQuestionsAnswered >= 5) {
      // Move to analysis phase
      metadata.phase = 'ANALYSIS';
      saveRequirementMetadata(requirementId, metadata);
<<<<<<< HEAD
      
      // Perform detailed analysis
      await this.performDetailedAnalysis(requirementId, metadata);
      
      // Move to detail phase and generate questions
      metadata.phase = 'DETAIL';
      saveRequirementMetadata(requirementId, metadata);
      
      const detailQuestions = await this.generateContextualDetailQuestions(requirementId);
      this.saveDetailQuestions(requirementId, detailQuestions);
      
=======

      // Perform detailed analysis
      await this.performDetailedAnalysis(requirementId, metadata);

      // Move to detail phase and generate questions
      metadata.phase = 'DETAIL';
      saveRequirementMetadata(requirementId, metadata);

      const detailQuestions = await this.generateContextualDetailQuestions(requirementId);
      this.saveDetailQuestions(requirementId, detailQuestions);

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
      // Return first detail question
      const firstDetailQuestion = this.formatQuestion(detailQuestions[0]);
      return {
        success: true,
        message: `✅ Discovery complete! Moving to technical details.\n\n⚙️ **Detail Phase (1/5)**\n\n${firstDetailQuestion}`,
        nextQuestion: firstDetailQuestion
      };
    } else {
<<<<<<< HEAD
      // Ask next discovery question  
=======
      // Ask next discovery question
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
      const nextQuestion = questions[metadata.discoveryQuestionsAnswered];
      const formattedQuestion = this.formatQuestion(nextQuestion);
      return {
        success: true,
        message: `✅ Answer recorded: "${normalizedAnswer}"\n\n🔍 **Discovery Phase (${metadata.discoveryQuestionsAnswered + 1}/5)**\n\n${formattedQuestion}`,
        nextQuestion: formattedQuestion
      };
    }
  }

  /**
   * Handle detail phase answer
   */
  private async handleDetailAnswer(requirementId: string, metadata: RequirementMetadata, answer: string): Promise<{ success: boolean; message: string; nextQuestion?: string; completed?: boolean }> {
    const questions = this.loadDetailQuestions(requirementId);
    const currentQuestion = questions[metadata.detailQuestionsAnswered];
<<<<<<< HEAD
    
    // Normalize answer
    const normalizedAnswer = this.normalizeAnswer(answer, currentQuestion.defaultAnswer);
    
=======

    // Normalize answer
    const normalizedAnswer = this.normalizeAnswer(answer, currentQuestion.defaultAnswer);

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Save the Q&A
    const qa: QuestionAnswer = {
      question: currentQuestion.question,
      answer: normalizedAnswer,
      timestamp: new Date().toISOString()
    };
<<<<<<< HEAD
    
    this.saveDetailAnswer(requirementId, qa);
    
    // Update metadata
    metadata.detailQuestionsAnswered++;
    saveRequirementMetadata(requirementId, metadata);
    
=======

    this.saveDetailAnswer(requirementId, qa);

    // Update metadata
    metadata.detailQuestionsAnswered++;
    saveRequirementMetadata(requirementId, metadata);

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Check if detail phase is complete
    if (metadata.detailQuestionsAnswered >= 5) {
      // Move to spec phase
      metadata.phase = 'SPEC';
      saveRequirementMetadata(requirementId, metadata);
<<<<<<< HEAD
      
      // Generate final specification
      await this.generateRequirementsSpec(requirementId, metadata);
      
      // Mark as complete
      metadata.status = 'COMPLETE';
      saveRequirementMetadata(requirementId, metadata);
      
      // Clear current requirement
      clearCurrentRequirement();
      updateRequirementsIndex();
      
      return {
        success: true,
        message: `🎉 **Requirements Complete!**\n\nFinal specification generated: \`requirements/${requirementId}/06-requirements-spec.md\`\n\n✅ Status: COMPLETE - Ready for implementation`,
=======

      // Generate final specification with mandatory quality control
      await this.generateRequirementsSpec(requirementId, metadata);

      // Mark as complete
      metadata.status = 'COMPLETE';
      metadata.completedAt = new Date().toISOString();
      saveRequirementMetadata(requirementId, metadata);

      // Clear current requirement
      clearCurrentRequirement();
      updateRequirementsIndex();

      return {
        success: true,
        message: `🎉 **Requirements Complete!**\n\nFinal specification generated: \`requirements/${requirementId}/06-requirements-spec.md\`\n\n✅ Status: COMPLETE - Ready for implementation\n\n**Next Steps:** Review the implementation next steps file at \`requirements/${requirementId}/07-implementation-next-steps.md\``,
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
        completed: true
      };
    } else {
      // Ask next detail question
      const nextQuestion = questions[metadata.detailQuestionsAnswered];
      const formattedQuestion = this.formatQuestion(nextQuestion);
      return {
        success: true,
        message: `✅ Answer recorded: "${normalizedAnswer}"\n\n⚙️ **Detail Phase (${metadata.detailQuestionsAnswered + 1}/5)**\n\n${formattedQuestion}`,
        nextQuestion: formattedQuestion
      };
    }
  }

  /**
   * Perform quick initial codebase analysis
   */
  private async performQuickAnalysis(requirementId: string, description: string): Promise<void> {
    let analysis = `# Initial Codebase Analysis\n\n`;
    analysis += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    analysis += `**Feature Description:** ${description}\n\n`;
    analysis += `## OSA Architecture Overview\n\n`;
    analysis += `- **Framework:** Next.js 16 with App Router\n`;
    analysis += `- **Language:** TypeScript with strict mode\n`;
    analysis += `- **UI:** React 19, Tailwind CSS, Radix UI components\n`;
    analysis += `- **Database:** Supabase (PostgreSQL) with enterprise guardrails\n`;
    analysis += `- **Integration:** OPAL (Optimizely AI-Powered Automation Layer)\n\n`;
    analysis += `## Relevant Directories\n\n`;
    analysis += `- \`src/app/\` - Next.js App Router pages and API routes\n`;
    analysis += `- \`src/components/\` - React UI components\n`;
    analysis += `- \`src/lib/\` - Core utilities and services\n`;
    analysis += `- \`opal-config/\` - OPAL agent configurations\n\n`;
<<<<<<< HEAD
    analysis += `## OSA Feature Categories\n\n`;
    analysis += `1. **Strategy Plans** - Roadmaps, maturity assessments, phases\n`;
    analysis += `2. **Optimizely DXP Tools** - Content recommendations, CMP, ODP integration\n`;
    analysis += `3. **Analytics Insights** - Performance metrics, audience analysis\n`;
    analysis += `4. **Experience Optimization** - Content optimization, personalization\n\n`;
    analysis += `*Detailed analysis will be performed after discovery questions.*\n`;
    
=======
    analysis += `## OSA Results Architecture (4 Equal Tiers)\n\n`;
    analysis += `1. **Strategy Plans** - Roadmaps, maturity assessments, strategic phases\n`;
    analysis += `2. **DXP Tools** - Content recommendations, CMP, ODP, CMS integration\n`;
    analysis += `3. **Analytics Insights** - Performance metrics, audience analysis, data insights\n`;
    analysis += `4. **Experience Optimization** - Content optimization, personalization, UX enhancement\n\n`;
    analysis += `*Tier placement will be determined during discovery questions.*\n`;

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    writeRequirementFile(requirementId, '03-context-findings.md', analysis);
  }

  /**
   * Perform detailed codebase analysis after discovery
   */
  private async performDetailedAnalysis(requirementId: string, metadata: RequirementMetadata): Promise<void> {
    const discoveryAnswers = this.loadDiscoveryAnswers(requirementId);
<<<<<<< HEAD
    
    let analysis = `# Detailed Context Analysis\n\n`;
    analysis += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    analysis += `## Discovery Insights\n\n`;
    
=======

    let analysis = `# Detailed Context Analysis\n\n`;
    analysis += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    analysis += `## Discovery Insights\n\n`;

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    discoveryAnswers.forEach((qa, index) => {
      analysis += `**Q${index + 1}:** ${qa.question}\n`;
      analysis += `**A${index + 1}:** ${qa.answer}\n\n`;
    });
<<<<<<< HEAD
    
    analysis += `## Implementation Context\n\n`;
    analysis += `Based on discovery answers, this feature should:\n\n`;
    
=======

    analysis += `## Implementation Context\n\n`;
    analysis += `Based on discovery answers, this feature should:\n\n`;

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Add contextual analysis based on answers
    const uiInteraction = discoveryAnswers.find(qa => qa.question.includes('OSA UI'));
    if (uiInteraction?.answer.toLowerCase().includes('yes')) {
      analysis += `- **UI Components:** Create React components in \`src/components/\`\n`;
      analysis += `- **Navigation:** Integrate with existing OSA navigation structure\n`;
    }
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    const contentFocus = discoveryAnswers.find(qa => qa.question.includes('content recommendations or analytics'));
    if (contentFocus?.answer.toLowerCase().includes('content')) {
      analysis += `- **Content Focus:** Integrate with content recommendation systems\n`;
      analysis += `- **Components:** Leverage existing content widgets pattern\n`;
    }
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    analysis += `\n## Risk Assessment\n\n`;
    analysis += `- **Complexity:** Medium (based on OSA integration patterns)\n`;
    analysis += `- **Impact:** Feature addition (non-breaking change expected)\n`;
    analysis += `- **Dependencies:** Standard OSA dependencies\n\n`;
    analysis += `## Recommended Approach\n\n`;
    analysis += `- Follow existing OSA architectural patterns\n`;
    analysis += `- Use established component and service patterns\n`;
    analysis += `- Integrate with OPAL workflow system if relevant\n`;
    analysis += `- Implement with feature flags for safe rollout\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Append to existing context findings
    appendToRequirementFile(requirementId, '03-context-findings.md', '\n\n' + analysis);
  }

  /**
   * Generate contextual detail questions based on discovery answers
   */
  private async generateContextualDetailQuestions(requirementId: string): Promise<Question[]> {
    const discoveryAnswers = this.loadDiscoveryAnswers(requirementId);
    const contextAnalysis = readRequirementFile(requirementId, '03-context-findings.md') || '';
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Use the base questions but could customize based on context
    return generateDetailQuestions(discoveryAnswers, contextAnalysis);
  }

  /**
<<<<<<< HEAD
   * Generate the final requirements specification
=======
   * Generate the final requirements specification with mandatory quality control
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
   */
  private async generateRequirementsSpec(requirementId: string, metadata: RequirementMetadata): Promise<void> {
    const discoveryAnswers = this.loadDiscoveryAnswers(requirementId);
    const detailAnswers = this.loadDetailAnswers(requirementId);
    const initialRequest = readRequirementFile(requirementId, '00-initial-request.md') || '';
    const contextFindings = readRequirementFile(requirementId, '03-context-findings.md') || '';
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    let spec = `# Requirements Specification: ${metadata.name}\n\n`;
    spec += `**ID:** ${metadata.id}\n`;
    spec += `**Created:** ${new Date(metadata.createdAt).toLocaleString()}\n`;
    spec += `**Status:** ${metadata.status}\n`;
    spec += `**Generated:** ${new Date().toLocaleString()}\n\n`;
<<<<<<< HEAD
    
    spec += `## Original Request\n\n`;
    spec += `${metadata.description}\n\n`;
    
=======

    spec += `## Original Request\n\n`;
    spec += `${metadata.description}\n\n`;

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    spec += `## Context & Discovery\n\n`;
    spec += `### Key Discovery Insights\n\n`;
    discoveryAnswers.forEach((qa, index) => {
      spec += `${index + 1}. **${qa.question}** → ${qa.answer}\n`;
    });
<<<<<<< HEAD
    
    spec += `\n## Problem Statement\n\n`;
    spec += `This feature addresses the need for ${metadata.description.toLowerCase()} within the OSA (Optimizely Strategy Assistant) ecosystem. `;
    spec += `Based on discovery, this primarily impacts content improvements and user experience within the OSA platform.\n\n`;
    
    spec += `## Functional Requirements\n\n`;
    spec += `Based on the discovery and detail phases, this feature should:\n\n`;
    
=======

    spec += `\n## Problem Statement\n\n`;
    spec += `This feature addresses the need for ${metadata.description.toLowerCase()} within the OSA (Optimizely Strategy Assistant) ecosystem. `;

    // Determine tier placement from discovery answers
    const tierSelection = discoveryAnswers.find(qa => qa.question.includes('Results tier'));
    const selectedTier = tierSelection ? tierSelection.answer : 'Analytics Insights';
    spec += `Based on discovery, this feature should be placed in the **${selectedTier}** Results tier.\n\n`;

    spec += `## Functional Requirements\n\n`;
    spec += `Based on the discovery and detail phases, this feature should:\n\n`;

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Generate functional requirements based on answers
    const uiInteraction = discoveryAnswers.find(qa => qa.question.includes('OSA UI'));
    if (uiInteraction?.answer.toLowerCase().includes('yes')) {
      spec += `- Provide user interface components accessible through the OSA web application\n`;
    }
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    const nonAdminUsers = discoveryAnswers.find(qa => qa.question.includes('non-admin users'));
    if (nonAdminUsers?.answer.toLowerCase().includes('yes')) {
      spec += `- Be accessible to regular users (not just administrators)\n`;
    }
<<<<<<< HEAD
    
    spec += `- Follow established OSA design patterns and user experience guidelines\n`;
    spec += `- Integrate appropriately with existing OSA navigation and workflows\n\n`;
    
    spec += `## Technical Requirements\n\n`;
    spec += `### Implementation Approach\n\n`;
    
    detailAnswers.forEach((qa, index) => {
      spec += `**${qa.question}** → ${qa.answer}\n`;
    });
    
=======

    spec += `- Follow established OSA design patterns and user experience guidelines\n`;
    spec += `- Integrate appropriately with existing OSA navigation and workflows\n\n`;

    spec += `## Technical Requirements\n\n`;
    spec += `### Implementation Approach\n\n`;

    detailAnswers.forEach((qa, index) => {
      spec += `**${qa.question}** → ${qa.answer}\n`;
    });

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    spec += `\n### File Locations and Patterns\n\n`;
    spec += `- **Components:** \`src/components/\` (follow existing React component patterns)\n`;
    spec += `- **API Routes:** \`src/app/api/\` (if backend functionality needed)\n`;
    spec += `- **Types:** \`src/types/\` (TypeScript type definitions)\n`;
    spec += `- **Utilities:** \`src/lib/\` (shared business logic)\n\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    spec += `## Non-Functional Requirements\n\n`;
    spec += `- **Performance:** Should not negatively impact existing OSA functionality\n`;
    spec += `- **Security:** Follow existing OSA authentication and authorization patterns\n`;
    spec += `- **Maintainability:** Use established code patterns and conventions\n`;
    spec += `- **Deployment:** Support feature flag rollout strategy\n\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    spec += `## Acceptance Criteria\n\n`;
    spec += `- [ ] Feature functionality works as specified\n`;
    spec += `- [ ] Follows OSA design and architectural patterns\n`;
    spec += `- [ ] Includes appropriate error handling and user feedback\n`;
    spec += `- [ ] Does not break existing OSA functionality\n`;
    spec += `- [ ] Includes basic tests for key functionality\n`;
    spec += `- [ ] Can be rolled out incrementally with feature flags\n\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    spec += `## Implementation Notes\n\n`;
    spec += `### For Future Development\n\n`;
    spec += `- Review existing similar features in OSA codebase before implementation\n`;
    spec += `- Use established patterns from \`src/components/widgets/\` for UI components\n`;
    spec += `- Follow security patterns from \`src/lib/auth/\` for any authentication needs\n`;
    spec += `- Consider integration with OPAL workflow system if relevant to Results pages\n`;
    spec += `- Test thoroughly in development environment before deployment\n\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    spec += `### Integration Points\n\n`;
    const dciAware = discoveryAnswers.find(qa => qa.question.includes('DCI Orchestrator'));
    if (dciAware?.answer.toLowerCase().includes('yes')) {
      spec += `- **DCI Integration:** This feature should be aware of DCI Orchestrator workflows\n`;
      spec += `- **Results Content:** May need integration with results-content-optimizer\n`;
    }
<<<<<<< HEAD
    
    spec += `- **OSA Categories:** Determine appropriate placement within Strategy Plans, DXP Tools, Analytics Insights, or Experience Optimization\n`;
    spec += `- **OPAL Agents:** Consider if this feature should trigger or interact with existing OPAL agents\n\n`;
    
=======

    spec += `- **OSA Results Tier:** Placed in **${selectedTier}** tier with appropriate navigation and integration patterns\n`;
    spec += `- **OPAL Agents:** Consider integration with tier-specific OPAL agents and workflow patterns\n\n`;

    // Add mandatory quality control requirements
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    spec += `## Quality Control Requirements\n\n`;
    spec += `### Mandatory CLAUDE.md Compliance\n\n`;
    spec += `This implementation MUST follow CLAUDE.md patterns:\n\n`;
    spec += `- **TodoWrite Usage**: All development work must be tracked with TodoWrite for visibility\n`;
    spec += `- **Quality Control Agents**: Use specialized agents at major milestones:\n`;
    spec += `  - \`results-content-optimizer\` for Results page content alignment\n`;
    spec += `  - \`opal-integration-validator\` for OPAL integration pipeline validation\n`;
    spec += `  - \`general-purpose\` (CLAUDE.md checker) for final pattern compliance validation\n`;
    spec += `- **Final Validation**: Every todo list MUST end with CLAUDE.md checker validation\n\n`;
    spec += `### Implementation Workflow Pattern\n\n`;
    spec += `\`\`\`typescript\n`;
    spec += `// REQUIRED: Use this exact pattern for implementation\n`;
    spec += `TodoWrite([\n`;
    spec += `  { content: "Implement core functionality", status: "pending", activeForm: "Implementing core functionality" },\n`;
    spec += `  { content: "Add comprehensive tests", status: "pending", activeForm: "Adding comprehensive tests" },\n`;
    spec += `  { content: "Run quality control validation", status: "pending", activeForm: "Running quality control validation" },\n`;
    spec += `  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }\n`;
    spec += `]);\n\n`;
    spec += `// Launch appropriate quality control agents\n`;
    spec += `Task({\n`;
    spec += `  subagent_type: "results-content-optimizer", // or appropriate agent\n`;
    spec += `  description: "Quality control validation",\n`;
    spec += `  prompt: "Validate implementation alignment with OSA patterns and requirements"\n`;
    spec += `});\n`;
    spec += `\`\`\`\n\n`;
<<<<<<< HEAD
    
    spec += `---\n\n`;
    spec += `*This specification was generated by the Claude Requirements Gathering System*\n`;
    
    // Log mandatory next steps
    this.logMandatoryNextSteps(requirementId, metadata);
    
=======

    spec += `---\n\n`;
    spec += `*This specification was generated by the Claude Requirements Gathering System*\n`;

    // Log mandatory next steps
    this.logMandatoryNextSteps(requirementId, metadata);

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    writeRequirementFile(requirementId, '06-requirements-spec.md', spec);
  }

  /**
   * Log mandatory next steps for implementation
   */
  private logMandatoryNextSteps(requirementId: string, metadata: RequirementMetadata): void {
    let nextSteps = `# Implementation Next Steps\n\n`;
    nextSteps += `**Generated:** ${new Date().toLocaleString()}\n`;
    nextSteps += `**Requirement:** ${metadata.name}\n\n`;
    nextSteps += `## MANDATORY: Quality Control Implementation\n\n`;
    nextSteps += `Before implementing this feature, you MUST:\n\n`;
    nextSteps += `1. **Use TodoWrite for all development tracking**:\n`;
    nextSteps += `   \`\`\`typescript\n`;
    nextSteps += `   TodoWrite([\n`;
    nextSteps += `     { content: "Implement ${metadata.name}", status: "pending", activeForm: "Implementing ${metadata.name}" },\n`;
    nextSteps += `     { content: "Run quality control validation", status: "pending", activeForm: "Running quality control validation" },\n`;
    nextSteps += `     { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }\n`;
    nextSteps += `   ]);\n`;
    nextSteps += `   \`\`\`\n\n`;
    nextSteps += `2. **Launch appropriate quality control agents at major milestones:**\n`;
    nextSteps += `   - For Results page changes: \`results-content-optimizer\`\n`;
    nextSteps += `   - For OPAL integration: \`opal-integration-validator\`\n`;
    nextSteps += `   - Final validation: \`general-purpose\` (CLAUDE.md checker)\n\n`;
    nextSteps += `3. **Every todo list MUST end with CLAUDE.md validation**\n\n`;
    nextSteps += `## Implementation Priority\n\n`;
<<<<<<< HEAD
    nextSteps += `Based on OSA architecture priorities:\n`;
    nextSteps += `1. Content Improvements → Analytics Insights → Experience Tactics → Strategy Plans\n`;
=======
    nextSteps += `Based on OSA Results architecture:\n`;
    nextSteps += `1. Integrate with appropriate Results tier: Strategy Plans, DXP Tools, Analytics Insights, or Experience Optimization\n`;
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    nextSteps += `2. Follow established patterns in \`src/components/widgets/\`\n`;
    nextSteps += `3. Use secure database client (\`src/lib/database\`) for all operations\n`;
    nextSteps += `4. Implement error boundaries around complex components\n\n`;
    nextSteps += `## Success Criteria\n\n`;
    nextSteps += `- [ ] All development tracked with TodoWrite\n`;
    nextSteps += `- [ ] Quality control agents used at major milestones\n`;
    nextSteps += `- [ ] CLAUDE.md checker validates final implementation\n`;
    nextSteps += `- [ ] Feature works without breaking existing OSA functionality\n`;
    nextSteps += `- [ ] Follows OSA security and compliance patterns\n\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    writeRequirementFile(requirementId, '07-implementation-next-steps.md', nextSteps);
  }

  // Helper methods
  private extractShortName(description: string): string {
    return description.split(' ').slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  private normalizeAnswer(answer: string, defaultAnswer: string): string {
    const normalized = answer.toLowerCase().trim();
    if (normalized === 'yes' || normalized === 'y') return 'YES';
    if (normalized === 'no' || normalized === 'n') return 'NO';
    if (normalized === 'idk' || normalized === 'default' || normalized === '') return defaultAnswer;
<<<<<<< HEAD
=======

    // Handle OSA tier selections (for Discovery Question 3)
    const tierMappings: { [key: string]: string } = {
      'strategy': 'Strategy Plans',
      'strategy plans': 'Strategy Plans',
      'dxp': 'DXP Tools',
      'dxp tools': 'DXP Tools',
      'analytics': 'Analytics Insights',
      'analytics insights': 'Analytics Insights',
      'experience': 'Experience Optimization',
      'experience optimization': 'Experience Optimization',
      'optimization': 'Experience Optimization'
    };

    if (tierMappings[normalized]) {
      return tierMappings[normalized];
    }

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    return answer; // Return original if it's a specific value
  }

  private formatQuestion(question: Question): string {
<<<<<<< HEAD
    return `**Q${question.id}:** ${question.question}\n${question.context ? `\n*${question.context}*` : ''}\n\n*Answer with: yes/no/idk*`;
=======
    let formatted = `**Q${question.id}:** ${question.question}\n`;
    if (question.context) {
      formatted += `\n*${question.context}*\n`;
    }

    // Special handling for tier selection question
    if (question.id === 3 && question.question.includes('Results tier')) {
      formatted += `\n*Answer with: Strategy Plans/DXP Tools/Analytics Insights/Experience Optimization/idk*`;
    } else {
      formatted += `\n*Answer with: yes/no/idk*`;
    }

    return formatted;
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }

  private saveDiscoveryQuestions(requirementId: string, questions: Question[]): void {
    let content = '# Discovery Questions\n\n';
    content += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    questions.forEach(q => {
      content += `## Q${q.id}: ${q.question}\n\n`;
      content += `**Default:** ${q.defaultAnswer}\n\n`;
      if (q.context) {
        content += `**Context:** ${q.context}\n\n`;
      }
      content += '---\n\n';
    });
    writeRequirementFile(requirementId, '01-discovery-questions.md', content);
  }

  private saveDetailQuestions(requirementId: string, questions: Question[]): void {
    let content = '# Detail Questions\n\n';
    content += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    questions.forEach(q => {
      content += `## Q${q.id}: ${q.question}\n\n`;
      content += `**Default:** ${q.defaultAnswer}\n\n`;
      if (q.context) {
        content += `**Context:** ${q.context}\n\n`;
      }
      content += '---\n\n';
    });
    writeRequirementFile(requirementId, '04-detail-questions.md', content);
  }

  private saveDiscoveryAnswer(requirementId: string, qa: QuestionAnswer): void {
    const content = `\n## ${qa.question}\n\n**Answer:** ${qa.answer}\n**Timestamp:** ${qa.timestamp}\n\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Create file if it doesn't exist
    const existing = readRequirementFile(requirementId, '02-discovery-answers.md');
    if (!existing) {
      writeRequirementFile(requirementId, '02-discovery-answers.md', '# Discovery Answers\n\n' + content);
    } else {
      appendToRequirementFile(requirementId, '02-discovery-answers.md', content);
    }
  }

  private saveDetailAnswer(requirementId: string, qa: QuestionAnswer): void {
    const content = `\n## ${qa.question}\n\n**Answer:** ${qa.answer}\n**Timestamp:** ${qa.timestamp}\n\n`;
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    // Create file if it doesn't exist
    const existing = readRequirementFile(requirementId, '05-detail-answers.md');
    if (!existing) {
      writeRequirementFile(requirementId, '05-detail-answers.md', '# Detail Answers\n\n' + content);
    } else {
      appendToRequirementFile(requirementId, '05-detail-answers.md', content);
    }
  }

  private loadDiscoveryQuestions(requirementId: string): Question[] {
    // In a real implementation, this would parse the saved questions
    // For now, return the standard questions
    return generateDiscoveryQuestions('');
  }

  private loadDetailQuestions(requirementId: string): Question[] {
    // In a real implementation, this would parse the saved questions
    // For now, return the standard questions
    return generateDetailQuestions([], '');
  }

  private loadDiscoveryAnswers(requirementId: string): QuestionAnswer[] {
    const content = readRequirementFile(requirementId, '02-discovery-answers.md');
    if (!content) return [];
<<<<<<< HEAD
    
    // Parse the answers from the markdown file
    const answers: QuestionAnswer[] = [];
    const sections = content.split('## ').slice(1); // Skip header
    
=======

    // Parse the answers from the markdown file
    const answers: QuestionAnswer[] = [];
    const sections = content.split('## ').slice(1); // Skip header

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    sections.forEach(section => {
      const lines = section.split('\n');
      const question = lines[0];
      const answerLine = lines.find(line => line.startsWith('**Answer:**'));
      const timestampLine = lines.find(line => line.startsWith('**Timestamp:**'));
<<<<<<< HEAD
      
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
      if (answerLine && timestampLine) {
        answers.push({
          question,
          answer: answerLine.replace('**Answer:**', '').trim(),
          timestamp: timestampLine.replace('**Timestamp:**', '').trim()
        });
      }
    });
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    return answers;
  }

  private loadDetailAnswers(requirementId: string): QuestionAnswer[] {
    const content = readRequirementFile(requirementId, '05-detail-answers.md');
    if (!content) return [];
<<<<<<< HEAD
    
    // Parse the answers from the markdown file
    const answers: QuestionAnswer[] = [];
    const sections = content.split('## ').slice(1); // Skip header
    
=======

    // Parse the answers from the markdown file
    const answers: QuestionAnswer[] = [];
    const sections = content.split('## ').slice(1); // Skip header

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    sections.forEach(section => {
      const lines = section.split('\n');
      const question = lines[0];
      const answerLine = lines.find(line => line.startsWith('**Answer:**'));
      const timestampLine = lines.find(line => line.startsWith('**Timestamp:**'));
<<<<<<< HEAD
      
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
      if (answerLine && timestampLine) {
        answers.push({
          question,
          answer: answerLine.replace('**Answer:**', '').trim(),
          timestamp: timestampLine.replace('**Timestamp:**', '').trim()
        });
      }
    });
<<<<<<< HEAD
    
=======

>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    return answers;
  }
}