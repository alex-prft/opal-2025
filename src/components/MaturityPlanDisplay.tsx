'use client';

import { useState } from 'react';
import { PMGWorkflowOutput, MaturityPhase } from '@/lib/types/maturity';

interface MaturityPlanDisplayProps {
  workflowResult: PMGWorkflowOutput;
}

export default function MaturityPlanDisplay({ workflowResult }: MaturityPlanDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'roadmap' | 'resources'>('overview');
  const { maturity_plan, executive_summary, next_steps, cmp_campaign_id } = workflowResult;

  const phaseColors = {
    crawl: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-800' },
    walk: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-200 dark:border-yellow-800' },
    run: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', border: 'border-green-200 dark:border-green-800' },
    fly: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-800' }
  };

  const phaseIcons = {
    crawl: '🐛',
    walk: '🚶',
    run: '🏃',
    fly: '🦅'
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Executive Summary</h3>
          <div className="flex items-center space-x-4">
            {cmp_campaign_id && (
              <a
                href={`https://app.optimizely.com/cmp/campaigns/${cmp_campaign_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
              >
                📋 View in CMP
              </a>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Plan ID: {maturity_plan.plan_id}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {maturity_plan.overall_maturity_score}/5
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
          </div>

          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${phaseColors[maturity_plan.current_phase].bg} ${phaseColors[maturity_plan.current_phase].text}`}>
              <span className="mr-2">{phaseIcons[maturity_plan.current_phase]}</span>
              {maturity_plan.current_phase.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current Phase</div>
          </div>

          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${phaseColors[maturity_plan.target_phase].bg} ${phaseColors[maturity_plan.target_phase].text}`}>
              <span className="mr-2">{phaseIcons[maturity_plan.target_phase]}</span>
              {maturity_plan.target_phase.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Target Phase</div>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">{executive_summary}</p>

        {/* Next Steps */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Immediate Next Steps:</h4>
          <ul className="list-disc list-inside space-y-1">
            {next_steps.map((step, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">{step}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'phases', label: '📈 Phase Details', icon: '📈' },
              { id: 'roadmap', label: '🗺️ Roadmap', icon: '🗺️' },
              { id: 'resources', label: '👥 Resources', icon: '👥' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Maturity Assessment</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{maturity_plan.maturity_rationale}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Strategic Priorities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {maturity_plan.strategic_priorities.map((priority, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-blue-500 mr-3">🎯</span>
                      <span className="text-gray-700 dark:text-gray-300">{priority}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk & Governance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Risks & Assumptions</h4>
                  <ul className="space-y-2">
                    {maturity_plan.risks_and_assumptions.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2 mt-0.5">⚠️</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Privacy Considerations</h4>
                  <ul className="space-y-2">
                    {maturity_plan.privacy_considerations.map((consideration, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">🔒</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{consideration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Phases Tab */}
          {activeTab === 'phases' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4-Phase Maturity Journey</h4>
                <p className="text-gray-600 dark:text-gray-400">Progressive approach to personalization excellence</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(['crawl', 'walk', 'run', 'fly'] as MaturityPhase[]).map((phase) => {
                  const phaseData = maturity_plan.phases.find(p => p.phase === phase);
                  const colors = phaseColors[phase];
                  const isCurrentPhase = maturity_plan.current_phase === phase;
                  const isTargetPhase = maturity_plan.target_phase === phase;

                  return (
                    <div
                      key={phase}
                      className={`p-6 rounded-lg border-2 ${colors.bg} ${colors.border} ${
                        isCurrentPhase ? 'ring-4 ring-blue-200 dark:ring-blue-800' : ''
                      }`}
                    >
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">{phaseIcons[phase]}</div>
                        <h5 className={`font-bold text-lg ${colors.text}`}>
                          {phase.toUpperCase()}
                        </h5>
                        {phaseData && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {phaseData.duration_months} months
                          </p>
                        )}
                        {isCurrentPhase && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                            Current
                          </span>
                        )}
                        {isTargetPhase && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                            Target
                          </span>
                        )}
                      </div>

                      {phaseData && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {phaseData.description}
                          </p>

                          <div>
                            <h6 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Key Focus:</h6>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              {phaseData.kpi_focus.slice(0, 3).map((focus, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="mr-2">•</span>
                                  {focus}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h6 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Capabilities:</h6>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              {phaseData.organizational_capabilities.slice(0, 2).map((capability, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="mr-2">✓</span>
                                  {capability}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Implementation Roadmap</h4>

              <div className="space-y-8">
                {[
                  { phase: 'Phase 1: Immediate (0-3 months)', items: maturity_plan.roadmap.phase_1_immediate, color: 'red' },
                  { phase: 'Phase 2: Short Term (3-6 months)', items: maturity_plan.roadmap.phase_2_short_term, color: 'yellow' },
                  { phase: 'Phase 3: Medium Term (6-12 months)', items: maturity_plan.roadmap.phase_3_medium_term, color: 'green' },
                  { phase: 'Phase 4: Long Term (12+ months)', items: maturity_plan.roadmap.phase_4_long_term, color: 'blue' }
                ].map((roadmapPhase, phaseIndex) => (
                  <div key={phaseIndex} className="relative">
                    <div className="flex items-center mb-4">
                      <div className={`w-4 h-4 rounded-full bg-${roadmapPhase.color}-500 mr-4`}></div>
                      <h5 className="font-semibold text-lg text-gray-900 dark:text-white">{roadmapPhase.phase}</h5>
                    </div>

                    <div className="ml-8 space-y-4">
                      {roadmapPhase.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-medium text-gray-900 dark:text-white">{item.milestone}</h6>
                            <span className={`px-2 py-1 text-xs rounded-full bg-${roadmapPhase.color}-100 text-${roadmapPhase.color}-800 dark:bg-${roadmapPhase.color}-900 dark:text-${roadmapPhase.color}-200`}>
                              {item.timeline}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Dependencies:</span>
                              <ul className="mt-1 space-y-1">
                                {item.dependencies.map((dep, depIndex) => (
                                  <li key={depIndex} className="text-gray-600 dark:text-gray-400">• {dep}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Success Criteria:</span>
                              <ul className="mt-1 space-y-1">
                                {item.success_criteria.map((criteria, critIndex) => (
                                  <li key={critIndex} className="text-gray-600 dark:text-gray-400">✓ {criteria}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Resource Planning</h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Budget Estimates */}
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Budget Estimates</h5>
                  <div className="space-y-3">
                    {maturity_plan.budget_estimates.length > 0 ? (
                      maturity_plan.budget_estimates.map((budget, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{budget.item}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{budget.category} - {budget.phase.toUpperCase()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">{budget.cost_range}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Confidence: {budget.confidence_level}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Budget estimates will be refined based on specific requirements and vendor selections.</p>
                    )}
                  </div>
                </div>

                {/* Resource Requirements */}
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Resource Requirements</h5>
                  <div className="space-y-3">
                    {maturity_plan.resource_requirements.length > 0 ? (
                      maturity_plan.resource_requirements.map((resource, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-900 dark:text-white">{resource.role}</div>
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{resource.fte_requirement} FTE</div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Phase: {resource.phase.toUpperCase()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Skills: {resource.skills_needed.join(', ')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Resource requirements will be detailed based on chosen implementation approach and timeline.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Recommendations */}
              {maturity_plan.vendor_recommendations.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Vendor Recommendations</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maturity_plan.vendor_recommendations.map((vendor, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="font-medium text-gray-900 dark:text-white">{vendor.vendor_name}</h6>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            vendor.integration_complexity === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            vendor.integration_complexity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {vendor.integration_complexity} complexity
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{vendor.use_case}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Est. Cost: {vendor.estimated_cost}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}