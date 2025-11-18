/**
 * Ask Assistant Configuration Registry
 *
 * This module provides the configuration for Ask Assistant prompts across all Results pages,
 * enabling section-specific expert prompts and recommended quick actions.
 */

// =============================================================================
// Ask Assistant Types
// =============================================================================

export type AskAssistantPromptConfig = {
  id: string;                     // unique key, e.g. "experience-content-ai-for-seo"
  label: string;                  // short label, e.g. "AI for SEO"
  description: string;            // short helper copy
  expertPromptExample: string;    // long-form expert prompt
  recommendedPrompts: string[];   // 3–8 shorter prompts to click-insert
  placeholder?: string;           // input placeholder
};

export type ResultsSectionKey =
  | "strategy:osa"
  | "strategy:maturity"
  | "strategy:phases"
  | "strategy:quick-wins"
  | "strategy:roadmap"
  | "dxp:content-recs"
  | "dxp:cms"
  | "dxp:odp"
  | "dxp:webx"
  | "dxp:cmp"
  | "analytics:osa"
  | "analytics:content"
  | "analytics:audiences"
  | "analytics:cx"
  | "analytics:experimentation"
  | "analytics:personalization"
  | "experience:content"
  | "experience:content:ai-for-seo"
  | "experience:content:content-suggestions"
  | "experience:content:content-optimization"
  | "experience:content:roi"
  | "experience:personalization"
  | "experience:experimentation"
  | "experience:ux"
  | "experience:technology";

export type AskAssistantConfig = Record<ResultsSectionKey, AskAssistantPromptConfig>;

// =============================================================================
// Ask Assistant Data Model
// =============================================================================

export type AskAssistantPromptRun = {
  id: string; // uuid
  userId: string;
  sectionKey: ResultsSectionKey;
  sourcePath: string;      // full path from where prompt was launched
  prompt: string;
  sourceConfigId?: string; // link to AskAssistantPromptConfig.id if applicable
  usedExpertExample?: boolean;
  selectedRecommendedPrompt?: string;
  createdAt: Date;
  // Future: response, model metadata, etc.
};

// =============================================================================
// Configuration Registry
// =============================================================================

export const ASK_ASSISTANT_CONFIG: AskAssistantConfig = {
  // =============================================================================
  // Strategy Section Configurations
  // =============================================================================

  "strategy:osa": {
    id: "strategy-osa",
    label: "OSA Strategy Overview",
    description: "Get strategic guidance on your Optimizely Strategy Assistant implementation and roadmap.",
    expertPromptExample: `Act as an **Optimizely Strategy Consultant** specializing in OSA (Optimizely Strategy Assistant) implementation and optimization.

Your goal is to provide strategic guidance for maximizing the value of OSA across organizational maturity levels while ensuring proper integration with the broader Optimizely DXP ecosystem.

I will provide in my next messages:
1) Current OSA implementation status and usage patterns
2) Organizational maturity level (crawl/walk/run/fly)
3) Key business objectives and success metrics
4) Current Optimizely DXP tools in use (Experimentation, Personalization, CMS, etc.)
5) Team structure and capabilities

### Your tasks

#### 1) OSA Strategic Assessment
- Evaluate current OSA utilization against organizational potential
- Identify strategic alignment gaps between OSA insights and business objectives
- Assess integration opportunities with existing Optimizely DXP investments

#### 2) Maturity-Based Roadmap
- Design phase-appropriate next steps (crawl → walk → run → fly progression)
- Recommend capability building priorities based on current maturity
- Suggest timeline and milestone tracking for strategic advancement

#### 3) DXP Integration Strategy
- Identify optimization opportunities across Experimentation, Personalization, and Content
- Recommend workflow enhancements for cross-platform efficiency
- Suggest measurement frameworks for integrated success tracking

#### 4) Implementation Recommendations
- Provide specific, actionable next steps with effort/impact assessment
- Include change management considerations for organizational adoption
- Recommend success metrics and tracking methodologies`,
    recommendedPrompts: [
      "Assess our current OSA maturity level and recommend next strategic steps.",
      "Design a 90-day OSA adoption roadmap for our organization.",
      "Identify integration opportunities between OSA and our other Optimizely tools.",
      "Recommend success metrics and KPIs for measuring OSA strategic impact.",
      "Suggest team structure and capability requirements for OSA optimization.",
      "Analyze our OSA usage patterns and recommend improvement strategies."
    ],
    placeholder: "Describe your OSA strategic goals and current implementation status..."
  },

  "strategy:maturity": {
    id: "strategy-maturity",
    label: "Maturity Assessment",
    description: "TODO: define expert prompt for Maturity Assessment strategic planning.",
    expertPromptExample: "TODO: define expert prompt for Strategy Plans / Maturity Assessment.",
    recommendedPrompts: [
      "Assess our current organizational maturity across key dimensions.",
      "Recommend specific actions to advance to the next maturity level.",
      "Design a capability building plan for strategic advancement."
    ],
    placeholder: "Describe your maturity assessment goals..."
  },

  "strategy:phases": {
    id: "strategy-phases",
    label: "Strategic Phases",
    description: "TODO: define expert prompt for Strategic Phases planning.",
    expertPromptExample: "TODO: define expert prompt for Strategy Plans / Strategic Phases.",
    recommendedPrompts: [
      "Design our strategic phase progression plan.",
      "Recommend milestone tracking for phase advancement.",
      "Suggest resource allocation across strategic phases."
    ],
    placeholder: "Describe your strategic phase planning needs..."
  },

  "strategy:quick-wins": {
    id: "strategy-quick-wins",
    label: "Quick Wins",
    description: "Get expert guidance on identifying and implementing high-impact, low-effort strategic improvements that deliver immediate value.",
    expertPromptExample: `Act as a **Strategic Quick Wins Consultant** specializing in identifying high-impact, low-effort opportunities that deliver immediate business value while building momentum for long-term strategic initiatives.

Your goal is to analyze current capabilities, constraints, and opportunities to recommend actionable quick wins that can be implemented within 30-90 days and create meaningful progress toward larger strategic objectives.

I will provide in my next messages:
1) Current organizational capabilities and resources
2) Strategic objectives and long-term goals
3) Key performance indicators and success metrics
4) Current challenges and pain points
5) Available tools, technologies, and team capacity

### Your tasks

#### 1) Quick Wins Assessment
- Evaluate current state against strategic objectives to identify opportunity gaps
- Assess resource availability and implementation constraints
- Identify dependencies and potential roadblocks for rapid implementation
- Analyze impact-to-effort ratios across potential improvement areas

#### 2) High-Impact Opportunity Identification
- Recommend specific quick wins with clear business impact (revenue, efficiency, user experience)
- Focus on improvements that require minimal resources but deliver measurable results
- Identify low-hanging fruit that builds strategic momentum and stakeholder confidence
- Suggest opportunities that enable future strategic initiatives

#### 3) Implementation Roadmap
- Design 30-60-90 day implementation timeline with clear milestones
- Recommend resource allocation and team assignments for each quick win
- Identify required tools, technologies, or process changes
- Suggest measurement frameworks and success tracking methods

#### 4) Strategic Alignment
- Ensure quick wins directly support broader strategic objectives
- Recommend how quick wins can create foundation for future initiatives
- Identify opportunities for quick wins to demonstrate ROI and build internal support
- Suggest communication strategies for highlighting quick win successes

#### 5) Risk Mitigation & Success Factors
- Identify potential implementation risks and mitigation strategies
- Recommend success factors and critical enablers for quick win delivery
- Suggest monitoring and course-correction approaches
- Provide change management guidance for rapid implementation`,
    recommendedPrompts: [
      "Identify the top 5 high-impact, low-effort strategic improvements we can implement in the next 30-60 days.",
      "Recommend quick wins that will build momentum toward our long-term strategic objectives.",
      "Design a 90-day quick wins implementation timeline with clear milestones and success metrics.",
      "Suggest resource-efficient improvements that can deliver measurable business impact quickly.",
      "Identify quick wins that will demonstrate strategic progress to stakeholders and leadership.",
      "Recommend implementation strategies for quick wins that minimize disruption to current operations."
    ],
    placeholder: "Describe your strategic objectives, current capabilities, and desired quick wins..."
  },

  "strategy:roadmap": {
    id: "strategy-roadmap",
    label: "Strategic Roadmap",
    description: "TODO: define expert prompt for Strategic Roadmap development.",
    expertPromptExample: "TODO: define expert prompt for Strategy Plans / Strategic Roadmap.",
    recommendedPrompts: [
      "Design a comprehensive strategic roadmap for our objectives.",
      "Recommend prioritization framework for roadmap initiatives.",
      "Suggest milestone tracking and success measurement strategies."
    ],
    placeholder: "Describe your strategic roadmap requirements..."
  },

  // =============================================================================
  // DXP Tools Section Configurations
  // =============================================================================

  "dxp:content-recs": {
    id: "dxp-content-recs",
    label: "Content Recommendations",
    description: "Get expert guidance on optimizing content recommendation algorithms, personalization strategies, and recommendation system performance.",
    expertPromptExample: `Act as a **Content Recommendation Systems Specialist** with expertise in algorithmic personalization, machine learning-driven content discovery, and recommendation system optimization.

Your goal is to analyze, optimize, and enhance content recommendation systems to improve user engagement, content discovery, and business outcomes through data-driven personalization strategies.

I will provide in my next messages:
1) Current content recommendation system architecture and algorithms
2) Content inventory and metadata structure (topics, categories, tags, etc.)
3) User behavior data and engagement metrics
4) Content performance analytics and recommendation effectiveness data
5) Business objectives for content recommendation optimization

### Your tasks

#### 1) Recommendation System Analysis
- Evaluate current recommendation algorithm performance and accuracy
- Analyze recommendation relevance, diversity, and coverage metrics
- Identify cold start problems and content/user coverage gaps
- Assess recommendation system scalability and performance characteristics

#### 2) Algorithm Optimization Strategies
- Recommend algorithm improvements based on content types and user behaviors
- Suggest hybrid recommendation approaches (collaborative, content-based, knowledge-based)
- Identify opportunities for real-time vs. batch recommendation processing
- Recommend feature engineering improvements for better recommendation quality

#### 3) Personalization Enhancement
- Design user segmentation strategies for targeted content recommendations
- Recommend context-aware personalization (time, device, location, intent)
- Suggest implicit and explicit feedback integration strategies
- Identify opportunities for cross-domain and cross-platform recommendation enhancement

#### 4) Content Strategy Alignment
- Analyze content taxonomy and metadata optimization for better recommendations
- Recommend content tagging and categorization improvements
- Suggest content freshness and lifecycle management for recommendation systems
- Identify content gaps and creation priorities based on recommendation patterns

#### 5) Testing and Measurement Framework
- Design A/B testing strategies for recommendation algorithm improvements
- Recommend key performance indicators and success metrics
- Suggest recommendation system monitoring and alerting strategies
- Provide recommendation quality evaluation frameworks and methodologies

#### 6) Implementation Roadmap
- Prioritize recommendation system improvements by impact and technical complexity
- Recommend technology stack and infrastructure enhancements
- Suggest data pipeline and processing optimizations
- Provide change management strategies for recommendation system evolution`,
    recommendedPrompts: [
      "Analyze our content recommendation system performance and identify optimization opportunities.",
      "Design personalization strategies to improve recommendation relevance and engagement.",
      "Recommend A/B testing approaches for evaluating recommendation algorithm improvements.",
      "Suggest content metadata and taxonomy enhancements for better recommendation quality.",
      "Analyze user segmentation strategies for targeted content recommendation experiences.",
      "Design measurement frameworks for tracking recommendation system effectiveness and business impact."
    ],
    placeholder: "Describe your content recommendation system and optimization goals..."
  },

  "dxp:cms": {
    id: "dxp-cms",
    label: "CMS Integration",
    description: "TODO: define expert prompt for CMS optimization and integration.",
    expertPromptExample: "TODO: define expert prompt for DXP Tools / CMS.",
    recommendedPrompts: [
      "Optimize our CMS workflow for better content performance.",
      "Recommend CMS integration strategies with other DXP tools.",
      "Suggest content management best practices for our use case."
    ],
    placeholder: "Describe your CMS optimization needs..."
  },

  "dxp:odp": {
    id: "dxp-odp",
    label: "Optimizely Data Platform",
    description: "TODO: define expert prompt for ODP optimization and analytics.",
    expertPromptExample: "TODO: define expert prompt for DXP Tools / ODP.",
    recommendedPrompts: [
      "Optimize our ODP data collection and segmentation strategy.",
      "Recommend audience building strategies using ODP data.",
      "Suggest integration patterns between ODP and other DXP tools."
    ],
    placeholder: "Describe your ODP optimization objectives..."
  },

  "dxp:webx": {
    id: "dxp-webx",
    label: "Web Experimentation",
    description: "TODO: define expert prompt for Web Experimentation strategy.",
    expertPromptExample: "TODO: define expert prompt for DXP Tools / Web Experimentation.",
    recommendedPrompts: [
      "Design our experimentation strategy and testing roadmap.",
      "Recommend high-impact experiments based on our data.",
      "Suggest statistical analysis approaches for our experiments."
    ],
    placeholder: "Describe your experimentation strategy goals..."
  },

  "dxp:cmp": {
    id: "dxp-cmp",
    label: "Campaign Management",
    description: "TODO: define expert prompt for CMP integration and optimization.",
    expertPromptExample: "TODO: define expert prompt for DXP Tools / CMP.",
    recommendedPrompts: [
      "Optimize our campaign management workflows and processes.",
      "Recommend integration strategies between CMP and other tools.",
      "Suggest campaign performance measurement and optimization strategies."
    ],
    placeholder: "Describe your campaign management optimization needs..."
  },

  // =============================================================================
  // Analytics Section Configurations
  // =============================================================================

  "analytics:osa": {
    id: "analytics-osa",
    label: "OSA Analytics",
    description: "TODO: define expert prompt for OSA analytics and insights.",
    expertPromptExample: "TODO: define expert prompt for Analytics Insights / OSA.",
    recommendedPrompts: [
      "Analyze our OSA performance data and recommend optimizations.",
      "Suggest analytics frameworks for measuring OSA effectiveness.",
      "Recommend dashboard and reporting strategies for OSA insights."
    ],
    placeholder: "Describe your OSA analytics objectives..."
  },

  "analytics:content": {
    id: "analytics-content",
    label: "Content Analytics",
    description: "Get expert guidance on content performance analysis, engagement metrics, and optimization strategies.",
    expertPromptExample: `Act as a **Content Analytics Strategist** specializing in data-driven content optimization for digital experience platforms.

Your goal is to analyze content performance data, identify optimization opportunities, and provide actionable recommendations for improving content engagement, effectiveness, and business impact.

I will provide in my next messages:
1) Current content performance metrics and analytics data
2) Content portfolio overview (types, topics, formats, channels)
3) Key business objectives and success metrics for content
4) Target audience segments and engagement patterns
5) Current content creation and optimization workflows

### Your tasks

#### 1) Content Performance Analysis
- Evaluate content performance across key metrics (engagement, conversions, retention)
- Identify top-performing content patterns and characteristics
- Analyze content gaps and underperforming segments
- Assess content lifecycle performance and optimization opportunities

#### 2) Audience Engagement Insights
- Analyze content engagement patterns across different audience segments
- Identify content preferences and consumption behaviors
- Recommend content personalization and targeting strategies
- Suggest audience-specific content optimization approaches

#### 3) Content Optimization Strategy
- Recommend specific content improvements based on performance data
- Suggest A/B testing strategies for content optimization
- Identify content update, refresh, and retirement opportunities
- Recommend content format and channel optimization strategies

#### 4) Measurement Framework
- Design comprehensive content analytics measurement framework
- Recommend key performance indicators and success metrics
- Suggest reporting dashboards and monitoring strategies
- Provide content performance benchmarking recommendations

#### 5) Implementation Roadmap
- Provide prioritized action plan for content optimization
- Include timeline and resource requirements for implementation
- Recommend tools and processes for ongoing content analytics
- Suggest change management strategies for content optimization adoption`,
    recommendedPrompts: [
      "Analyze our content performance data and identify top optimization opportunities.",
      "Recommend content analytics frameworks and key performance indicators.",
      "Suggest audience-specific content optimization strategies based on engagement data.",
      "Design content performance dashboards and reporting approaches.",
      "Identify content gaps and recommend new content creation priorities.",
      "Analyze content lifecycle performance and suggest optimization strategies."
    ],
    placeholder: "Describe your content analytics goals and current performance data..."
  },

  "analytics:audiences": {
    id: "analytics-audiences",
    label: "Audience Analytics",
    description: "TODO: define expert prompt for Audience Analytics insights.",
    expertPromptExample: "TODO: define expert prompt for Analytics Insights / Audiences.",
    recommendedPrompts: [
      "Analyze our audience data and recommend segmentation strategies.",
      "Suggest audience analytics frameworks and measurement approaches.",
      "Recommend personalization strategies based on audience insights."
    ],
    placeholder: "Describe your audience analytics objectives..."
  },

  "analytics:cx": {
    id: "analytics-cx",
    label: "Customer Experience Analytics",
    description: "TODO: define expert prompt for CX Analytics insights.",
    expertPromptExample: "TODO: define expert prompt for Analytics Insights / CX.",
    recommendedPrompts: [
      "Analyze our customer experience data and identify improvement opportunities.",
      "Recommend CX analytics frameworks and measurement strategies.",
      "Suggest customer journey optimization approaches based on data insights."
    ],
    placeholder: "Describe your CX analytics goals..."
  },

  "analytics:experimentation": {
    id: "analytics-experimentation",
    label: "Experimentation Analytics",
    description: "TODO: define expert prompt for Experimentation Analytics insights.",
    expertPromptExample: "TODO: define expert prompt for Analytics Insights / Experimentation.",
    recommendedPrompts: [
      "Analyze our experimentation results and recommend optimization strategies.",
      "Suggest experimentation analytics frameworks and statistical approaches.",
      "Recommend testing strategies based on performance data insights."
    ],
    placeholder: "Describe your experimentation analytics objectives..."
  },

  "analytics:personalization": {
    id: "analytics-personalization",
    label: "Personalization Analytics",
    description: "TODO: define expert prompt for Personalization Analytics insights.",
    expertPromptExample: "TODO: define expert prompt for Analytics Insights / Personalization.",
    recommendedPrompts: [
      "Analyze our personalization performance data and suggest improvements.",
      "Recommend personalization analytics frameworks and measurement strategies.",
      "Suggest personalization optimization approaches based on data insights."
    ],
    placeholder: "Describe your personalization analytics goals..."
  },

  // =============================================================================
  // Experience Optimization Section Configurations
  // =============================================================================

  "experience:content": {
    id: "experience-content",
    label: "Content Experience",
    description: "Get expert guidance on optimizing content experiences across all customer touchpoints for maximum engagement and conversion.",
    expertPromptExample: `Act as a **Content Experience Optimization Specialist** focused on creating seamless, high-converting content experiences across all customer touchpoints.

Your goal is to analyze and optimize content experiences to maximize engagement, reduce friction, and drive measurable business outcomes through strategic content design and delivery.

I will provide in my next messages:
1) Current content experience audit across key touchpoints (website, apps, email, etc.)
2) Customer journey maps and key interaction points
3) Content performance metrics and user behavior data
4) Business objectives and conversion goals
5) Technical constraints and platform capabilities

### Your tasks

#### 1) Content Experience Audit
- Evaluate content effectiveness across all customer touchpoints
- Identify friction points and optimization opportunities in content flow
- Analyze content consistency and brand alignment across channels
- Assess content accessibility and user experience quality

#### 2) Customer Journey Content Optimization
- Map content experiences to customer journey stages (awareness, consideration, decision, retention)
- Identify content gaps and redundancies across the journey
- Recommend content personalization strategies for different user segments
- Suggest content sequencing and progression strategies for optimal engagement

#### 3) Content Performance Enhancement
- Analyze content engagement metrics and conversion performance
- Recommend content format optimization (visual, interactive, multimedia)
- Suggest content length, structure, and presentation improvements
- Identify high-impact content experiments and A/B testing opportunities

#### 4) Cross-Channel Content Strategy
- Design coherent content experiences across multiple channels and platforms
- Recommend content repurposing and adaptation strategies
- Suggest content syndication and distribution optimization
- Provide content governance frameworks for multi-channel consistency

#### 5) Implementation Roadmap
- Prioritize content experience improvements by impact and effort
- Recommend content optimization tools and technologies
- Suggest measurement frameworks for tracking content experience success
- Provide change management guidance for content experience transformation`,
    recommendedPrompts: [
      "Audit our content experience across key customer touchpoints and identify optimization opportunities.",
      "Recommend content personalization strategies for different user journey stages.",
      "Suggest A/B testing approaches for optimizing content engagement and conversion.",
      "Design a cross-channel content experience strategy for consistency and effectiveness.",
      "Analyze content performance metrics and recommend format and structure improvements.",
      "Create a content experience optimization roadmap with prioritized implementation steps."
    ],
    placeholder: "Describe your content experience optimization goals and current touchpoints..."
  },

  "experience:content:ai-for-seo": {
    id: "experience-content-ai-for-seo",
    label: "AI for SEO",
    description: "Use this to audit and improve how your content appears in AI Overviews, answer boxes, and traditional search.",
    expertPromptExample: `Act as an **AI-First SEO & AEO (AI Engine Optimization) strategist**.

Your goal is to make our website the **preferred source** for AI systems such as Google AI Overviews, SGE, Bing Copilot, Perplexity, and ChatGPT with browsing — while still improving traditional SEO and driving conversions.

I will provide in my next messages:
1) Our domain and 5–15 priority URLs
2) Our primary products/services and target audiences
3) Our top 10–20 keywords/topics
4) Example AI answers (screenshots or text) from AI Overviews / Copilot / Perplexity for those topics
5) 3–5 key competitors

---

### Your tasks

#### 1) Diagnose our AI visibility & gaps
- Identify the **top 5–10 "AI answer opportunities"** where AI systems summarize our topics (AI Overviews, "People also ask"-style questions, Perplexity-style answers, etc.).
- For each opportunity:
  - Summarize the **dominant user intent** (problem, job-to-be-done, or question).
  - Compare **our content vs AI's current answer** and any visible competitors:
    - Clarity and directness of the answer
    - Depth and usefulness of supporting details
    - Use of structured formats (FAQs, bullets, steps, tables)
    - Entity clarity (brands, products, locations, categories, industries)
    - Authority signals (experience, examples, data, social proof)
    - Freshness and recency

Deliverable: A table with columns:
\`Topic / Intent\` | \`Current AI-style Answer Summary\` | \`Our URL (if any)\` | \`Key Gaps vs AI Answer\` | \`Main Competitors\` | \`AEO Opportunity Score (1–10)\`

#### 2) AEO-focused content & structure recommendations
For the **top 5 opportunities**, provide detailed recommendations to make our pages AI-ready:

For each opportunity, include:

- **AI-Ready Answer Block (for the page hero):**
  - 1–2 sentence **concise "AI answer"** (40–75 words) that directly solves the key question
  - 3–5 bullet points that expand on the answer (steps, checklist, or benefits)
- **Expanded Section Outline:**
  - H1 and 3–6 H2s/H3s organized by user intent (problem, causes, solution, proof, next steps)
  - Suggested subsections that clearly address "who / what / why / how / when / cost / alternatives"
- **FAQ Pack for AI Engines:**
  - 5–10 FAQ Q&A pairs written in natural language, each answer 2–4 sentences
  - Focus on questions AI engines are likely to surface and combine in multi-question answers
- **Conversion Hooks:**
  - Recommended CTA(s) tailored to this topic (e.g., "Get a personalized plan," "Compare options," "See pricing examples")
  - 1–2 experiment/personalization ideas that align with this content (e.g., test a short vs long hero answer block, or different CTAs based on intent)

Format this as:
- \`PAGE / TOPIC NAME\`
- \`AI-Ready Answer Block\`
- \`Outline\`
- \`FAQ Pack\`
- \`Conversion Hooks (CRO + Personalization ideas)\`

#### 3) Entity, schema & metadata for AEO
For the same top 5 opportunities, design **AI-friendly structure**:

- Define a simple **entity map**:
  - Main entity (our brand / solution)
  - Supporting entities (industries, product types, locations, tools, partners)
  - How they relate (e.g., "Brand X provides [service] for [industry] in [regions] using [technology]")
- Recommend **specific schema types** and properties (e.g., \`FAQPage\`, \`HowTo\`, \`Service\`, \`Product\`, \`Organization\`, \`Article\`, \`BreadcrumbList\`) and:
  - What questions/sections should be wrapped in which schema
  - Any missing fields that reinforce credibility (e.g., \`aggregateRating\`, \`author\`, \`review\`, \`offers\`, \`areaServed\`)
- Suggest **metadata patterns**:
  - Title and meta description patterns that support both traditional SEO and AEO
  - How to reflect topical focus and entities in titles, headings, and internal links

Deliverable: For each page/topic, output:
- \`Entity Map (bullet list)\`
- \`Recommended Schema Types + Key Properties\`
- \`Sample JSON-LD block\` (pseudo-code is fine, just make the structure clear)
- \`Title & Meta Description examples (2–3 variants)\`

#### 4) Prioritized AEO roadmap
Create a **prioritized 30–90 day roadmap** focused specifically on AEO:

Group actions into:
- **P1 – High impact, low/medium effort (do first)**
- **P2 – Medium impact or medium/high effort**
- **P3 – Long-term AEO investments**

For each action, include:
- \`Action name\`
- \`Page(s) or section(s)\`
- \`Description\`
- \`Why it matters for AI engines (plain English)\`
- \`Expected impact (Traffic, Visibility in AI answers, Conversions)\`
- \`Effort (S/M/L)\`

#### 5) Plain-English explanation for non-SEO stakeholders
Provide a **1–2 paragraph summary** explaining in simple terms:
- What AEO is (AI Engine Optimization)
- How these changes help us:
  - Show up more often inside AI-generated answers
  - Control how our brand and offers are described
  - Turn that visibility into leads and customers, not just traffic

IMPORTANT STYLE NOTES
- Be concrete. Use sample copy, headings, and Q&A examples, not just theory.
- When you suggest content, **write it out** so we can copy/paste and refine.
- Prioritize actions that help both **AI answers and human users/conversions.**
- If something is unclear from the inputs I provide, state your assumptions and move forward.`,
    recommendedPrompts: [
      "Audit our top 10 URLs for AI Overviews and summarize the biggest AEO gaps.",
      "Generate AI-ready answer blocks and FAQ packs for these 5 priority topics.",
      "Compare how AI tools summarize us vs our top 3 competitors for Topic X.",
      "Design a 60-day AI for SEO roadmap based on these URLs and topics.",
      "Suggest schema and metadata patterns for our main content templates.",
      "Rewrite our top article on Topic X to be AI-answer-friendly while staying on brand.",
      "Create a FAQ block that could realistically be used by AI answers for Topic Y.",
      "Explain AEO in plain English for our executive team and tie it to our content plan."
    ],
    placeholder: "Describe what you want the assistant to do for AI for SEO (e.g. audit pages, redesign content, generate FAQs)…"
  },

  "experience:content:content-suggestions": {
    id: "experience-content-suggestions",
    label: "Content Suggestions",
    description: "TODO: define expert prompt for Content Suggestions optimization.",
    expertPromptExample: "TODO: define expert prompt for Experience Optimization / Content Suggestions.",
    recommendedPrompts: [
      "Generate content suggestions based on our performance data.",
      "Recommend content optimization strategies for better engagement.",
      "Suggest content themes and topics for our target audience."
    ],
    placeholder: "Describe your content suggestions needs..."
  },

  "experience:content:content-optimization": {
    id: "experience-content-optimization",
    label: "Content Optimization",
    description: "TODO: define expert prompt for Content Optimization strategies.",
    expertPromptExample: "TODO: define expert prompt for Experience Optimization / Content Optimization.",
    recommendedPrompts: [
      "Optimize our existing content for better performance.",
      "Recommend content enhancement strategies based on analytics.",
      "Suggest A/B testing approaches for content optimization."
    ],
    placeholder: "Describe your content optimization goals..."
  },

  "experience:content:roi": {
    id: "experience-content-roi",
    label: "Content ROI",
    description: "TODO: define expert prompt for Content ROI analysis and optimization.",
    expertPromptExample: "TODO: define expert prompt for Experience Optimization / Content ROI.",
    recommendedPrompts: [
      "Analyze our content performance impact and effectiveness metrics.",
      "Recommend measurement frameworks for content performance tracking.",
      "Suggest optimization strategies to improve content performance indicators."
    ],
    placeholder: "Describe your content performance analysis needs..."
  },

  "experience:personalization": {
    id: "experience-personalization",
    label: "Personalization Experience",
    description: "TODO: define expert prompt for Personalization Experience optimization.",
    expertPromptExample: "TODO: define expert prompt for Experience Optimization / Personalization.",
    recommendedPrompts: [
      "Optimize our personalization strategy across all touchpoints.",
      "Recommend personalization experience enhancement approaches.",
      "Suggest personalization testing and measurement strategies."
    ],
    placeholder: "Describe your personalization experience goals..."
  },

  "experience:experimentation": {
    id: "experience-experimentation",
    label: "Experimentation Experience",
    description: "TODO: define expert prompt for Experimentation Experience optimization.",
    expertPromptExample: "TODO: define expert prompt for Experience Optimization / Experimentation.",
    recommendedPrompts: [
      "Optimize our experimentation approach and testing strategy.",
      "Recommend experimentation experience enhancement methods.",
      "Suggest testing frameworks and statistical analysis approaches."
    ],
    placeholder: "Describe your experimentation experience objectives..."
  },

  "experience:ux": {
    id: "experience-ux",
    label: "UX Experience",
    description: "TODO: define expert prompt for UX Experience optimization.",
    expertPromptExample: "TODO: define expert prompt for Experience Optimization / UX.",
    recommendedPrompts: [
      "Optimize our user experience design and interaction patterns.",
      "Recommend UX enhancement strategies based on user behavior data.",
      "Suggest UX testing and measurement approaches for optimization."
    ],
    placeholder: "Describe your UX experience optimization goals..."
  },

  "experience:technology": {
    id: "experience-technology",
    label: "Technology Experience",
    description: "TODO: define expert prompt for Technology Experience optimization.",
    expertPromptExample: "TODO: define expert prompt for Experience Optimization / Technology.",
    recommendedPrompts: [
      "Optimize our technology stack for better user experience.",
      "Recommend technology enhancement strategies and implementation approaches.",
      "Suggest performance monitoring and optimization techniques."
    ],
    placeholder: "Describe your technology experience optimization needs..."
  }
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get Ask Assistant configuration for a specific section key
 */
export function getAskAssistantConfig(sectionKey: ResultsSectionKey): AskAssistantPromptConfig | undefined {
  return ASK_ASSISTANT_CONFIG[sectionKey];
}

/**
 * Get all available section keys that have Ask Assistant configurations
 */
export function getAvailableSectionKeys(): ResultsSectionKey[] {
  return Object.keys(ASK_ASSISTANT_CONFIG) as ResultsSectionKey[];
}

/**
 * Check if Ask Assistant is available for a specific section
 */
export function isAskAssistantAvailable(sectionKey: ResultsSectionKey): boolean {
  const config = getAskAssistantConfig(sectionKey);
  return config !== undefined && !config.expertPromptExample.startsWith('TODO:');
}

/**
 * Get fully implemented Ask Assistant configurations (not TODO placeholders)
 */
export function getImplementedConfigurations(): Record<string, AskAssistantPromptConfig> {
  const implemented: Record<string, AskAssistantPromptConfig> = {};

  Object.entries(ASK_ASSISTANT_CONFIG).forEach(([key, config]) => {
    if (!config.expertPromptExample.startsWith('TODO:')) {
      implemented[key] = config;
    }
  });

  return implemented;
}