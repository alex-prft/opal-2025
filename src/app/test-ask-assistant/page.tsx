"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AskAssistantModal } from "@/components/ask-assistant/AskAssistantModal"
import { AskAssistantPromptConfig, ResultsSectionKey } from "@/lib/askAssistant/config"
import { MessageCircle, Sparkles } from "lucide-react"

interface TestScenario {
  name: string;
  sectionKey: ResultsSectionKey;
  sectionTitle: string;
  pagePath: string;
  expertPrompt: string;
  recommendedPrompts: string[];
  description: string;
}

const testScenarios: TestScenario[] = [
  {
    name: "Strategy Plans - OSA Overview",
    sectionKey: "strategy:osa:overview",
    sectionTitle: "Strategy Plans → OSA → Overview",
    pagePath: "/engine/results/strategy-plans/osa",
    description: "Test modal with strategy-focused content and expert guidance",
    expertPrompt: `Act as a digital strategy and optimization maturity consultant.

You are helping a marketing team understand their overall state inside Optimizely Strategy Plans → OSA, based on:
- Crawl/Walk/Run/Fly maturity rubric
- Current phase completion and roadmap
- Audience/persona definitions from OPAL instructions
- Data flowing from DXP tools (Content Recs, CMS, ODP, WebX, CMP)
- Analytics Insights and Experience Optimization recommendations

Your job is to:
1) Summarize where they are today
2) Connect the dots between tools, data, and outcomes
3) Prioritize what matters next
4) Provide a clear story they can share

Guardrails:
- Respect OPAL instructions: personas, tone, brand, goals, personalization maturity rubric.
- Do not propose changing system architecture; focus on content, clarity, and priorities.
- No currency amounts; focus on KPIs and maturity progression.`,
    recommendedPrompts: [
      "Summarize our current strategy maturity and give me the 5 most important priorities for the next 90 days.",
      "Turn our current Strategy Plans → OSA view into a one-page story I can present to leadership.",
      "Explain how our DXP tools, Analytics Insights, and Experience Optimization sections connect, using our Strategy Plans as the hub.",
      "Rewrite the OSA strategy summary so it's easier for non-technical marketers to understand.",
      "Highlight the 3 biggest risks in our current roadmap and how to mitigate them."
    ]
  },
  {
    name: "Experience Optimization - Content",
    sectionKey: "experience:content:overview",
    sectionTitle: "Experience Optimization → Content → Overview",
    pagePath: "/engine/results/experience-optimization/content",
    description: "Test modal with content strategy recommendations",
    expertPrompt: `Act as a content strategy and experience optimization partner.

You are working in Experience Optimization → Content, especially the Content Strategy Overview.

Inputs:
- DXP Tools (Content Recs, CMS, ODP, CMP)
- Analytics Insights → Content, Audiences, OSA
- Strategy Plans → Maturity, Phases, Roadmap
- OPAL instructions (personas, objectives, tone, maturity rubric)

Your tasks:
1) Summarize the purpose of content in this organization
2) Use data to inform the strategy
3) Provide a clear content strategy outline

Guardrails:
- No revenue outcomes; focus on maturity and KPIs
- Respect OPAL personas and tone
- Stay aligned with marketing calendar and CMP where relevant`,
    recommendedPrompts: [
      "Summarize our content strategy based on current data and maturity.",
      "Turn our content insights into a clear strategy overview for marketers.",
      "Explain how content supports experiments, personalization, and CX improvements.",
      "Create a content strategy one-pager aligned with our Strategy Plans.",
      "Highlight the 5 most important content themes we should focus on."
    ]
  },
  {
    name: "DXP Tools - Content Recs",
    sectionKey: "dxp:content-recs:overview",
    sectionTitle: "DXP Tools → Content Recs → Overview",
    pagePath: "/engine/results/optimizely-dxp-tools/content-recs",
    description: "Test modal with Content Recommendations analysis",
    expertPrompt: `Act as a content recommendations strategist who understands Optimizely Content Recommendations, CMS, and ODP.

You are working in DXP Tools → Content Recs and its child pages.

Your tasks:
1) Explain what Content Recs is telling us about our content
2) Connect Content Recs back to content strategy
3) Map to Experience Optimization and Analytics Insights

Guardrails:
- Do not change how Content Recs works; interpret the data
- Respect OPAL personas and tone guidelines
- No currency; speak in terms of engagement, conversion, depth, and maturity`,
    recommendedPrompts: [
      "Summarize what Content Recs is telling us about our top topics and content.",
      "Explain how we should use Content Recs data to shape our Content Suggestions under Experience Optimization.",
      "Compare our strongest topics vs the ones we're under-investing in.",
      "Write a plain-English explanation of our Content Recs data for content writers.",
      "Highlight 10 concrete content follow-ups based on Content Recs."
    ]
  }
];

export default function TestAskAssistantPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedScenario, setSelectedScenario] = React.useState<TestScenario | null>(null);

  const handleOpenModal = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
          Ask Assistant Modal - Test Suite
        </h1>
        <p className="text-lg text-slate-600">
          Test the AskAssistantModal component with different sections and scenarios
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testScenarios.map((scenario, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                {scenario.name}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{scenario.sectionKey}</Badge>
              </div>
              <CardDescription>
                {scenario.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Context Path:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    {scenario.sectionTitle}
                  </code>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Recommended Prompts:</p>
                  <p className="text-xs text-slate-600">
                    {scenario.recommendedPrompts.length} prompts available
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Expert Prompt:</p>
                  <p className="text-xs text-slate-600">
                    {scenario.expertPrompt.slice(0, 120)}...
                  </p>
                </div>

                <Button
                  onClick={() => handleOpenModal(scenario)}
                  className="w-full mt-4"
                >
                  Test This Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Test Instructions</h2>
        <div className="space-y-2 text-sm text-slate-700">
          <p>• Click any scenario card to open the AskAssistantModal</p>
          <p>• Try clicking recommended prompts to auto-fill the textarea</p>
          <p>• Toggle the "Include context" switch to see different behavior</p>
          <p>• Test the expert prompt expansion/collapse functionality</p>
          <p>• Submit prompts to test the API integration (check console for responses)</p>
          <p>• Recent prompts will be saved and shown in the dropdown after submissions</p>
        </div>
      </div>

      {selectedScenario && (
        <AskAssistantModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          sectionKey={selectedScenario.sectionKey}
          promptConfig={{
            id: selectedScenario.sectionKey,
            label: selectedScenario.sectionTitle,
            description: selectedScenario.description,
            expertPromptExample: selectedScenario.expertPrompt,
            recommendedPrompts: selectedScenario.recommendedPrompts,
            placeholder: "Describe what you want the assistant to help with for this section..."
          }}
          sourcePath={selectedScenario.pagePath}
        />
      )}
    </div>
  );
}