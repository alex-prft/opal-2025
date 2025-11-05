'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Target,
  Users,
  TrendingUp,
  Lightbulb,
  Settings,
  CheckCircle,
  Clock,
  BarChart3,
  User,
  Building2,
  UserCheck,
  Crown,
  AlertTriangle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { PMGWorkflowInput } from '@/lib/types/maturity';
import { checkBusinessCapabilities, getCapabilitySummary, CapabilityCheck } from '@/lib/utils/capability-checker';

const useCaseData = {
  'member-engagement': {
    title: 'Member Journey Personalization',
    description: 'Customize member portal experience based on company size, role, and engagement history',
    category: 'Member Experience',
    difficulty: 'Intermediate',
    timeline: '3-4 months',
    roi: '45-60%',
    color: 'blue',
    personas: [
      {
        id: 'new_member',
        name: 'New Member - Small Grower',
        icon: User,
        description: 'First-year IFPA member running a small organic farm',
        characteristics: ['< 50 acres', 'Direct-to-consumer sales', 'Seeking education'],
        experiments: [
          {
            title: 'Onboarding Path Optimization',
            description: 'Test simplified vs. comprehensive onboarding flows for new small growers',
            kpi: 'Completion rate',
            effort: 'Medium',
            impact: 'High'
          },
          {
            title: 'Resource Discovery A/B Test',
            description: 'Compare curated resource lists vs. search-first approach',
            kpi: 'Time to first resource download',
            effort: 'Low',
            impact: 'Medium'
          },
          {
            title: 'Peer Connection Nudges',
            description: 'Test automated introductions to similar-sized farms in their region',
            kpi: 'Forum participation rate',
            effort: 'High',
            impact: 'High'
          },
          {
            title: 'Educational Content Sequencing',
            description: 'Test progressive vs. all-access educational material release',
            kpi: 'Course completion rate',
            effort: 'Medium',
            impact: 'High'
          },
          {
            title: 'Success Story Placement',
            description: 'A/B test placement of relevant success stories in the member dashboard',
            kpi: 'Engagement with success stories',
            effort: 'Low',
            impact: 'Medium'
          }
        ],
        personalizations: [
          {
            title: 'Small Farm Resource Hub',
            description: 'Dedicated dashboard section with resources tailored for operations under 50 acres',
            complexity: 'Low',
            impact: 'High'
          },
          {
            title: 'Local Market Intelligence',
            description: 'Personalized market reports based on their geographic region and crops',
            complexity: 'High',
            impact: 'High'
          },
          {
            title: 'Seasonal Guidance Calendar',
            description: 'Customized seasonal reminders and best practices for their crop types',
            complexity: 'Medium',
            impact: 'Medium'
          },
          {
            title: 'Peer Success Highlights',
            description: 'Showcase achievements from similar-sized farms to inspire and educate',
            complexity: 'Medium',
            impact: 'Medium'
          },
          {
            title: 'Learning Path Recommendations',
            description: 'AI-curated educational sequence based on their stated goals and progress',
            complexity: 'High',
            impact: 'High'
          }
        ]
      },
      {
        id: 'corporate_member',
        name: 'Corporate Member - Large Distributor',
        icon: Building2,
        description: 'Multi-year IFPA member representing a major produce distribution company',
        characteristics: ['500+ employees', 'Multi-state operations', 'Regulatory focus'],
        experiments: [
          {
            title: 'Executive Dashboard Layouts',
            description: 'Test different dashboard configurations for C-level vs. operational users',
            kpi: 'Dashboard engagement time',
            effort: 'Medium',
            impact: 'High'
          },
          {
            title: 'Industry Report Personalization',
            description: 'Compare generic vs. company-size-specific industry reports',
            kpi: 'Report download and share rate',
            effort: 'High',
            impact: 'Medium'
          },
          {
            title: 'Regulatory Alert Urgency',
            description: 'Test different urgency levels and formats for regulatory notifications',
            kpi: 'Response time to regulatory changes',
            effort: 'Low',
            impact: 'High'
          },
          {
            title: 'Team Collaboration Features',
            description: 'A/B test team workspace vs. individual account experiences',
            kpi: 'Multi-user account activation',
            effort: 'High',
            impact: 'High'
          },
          {
            title: 'Premium Content Access',
            description: 'Test gated vs. open access to advanced industry intelligence',
            kpi: 'Premium content engagement',
            effort: 'Medium',
            impact: 'Medium'
          }
        ],
        personalizations: [
          {
            title: 'Corporate Intelligence Dashboard',
            description: 'Executive-level insights with market trends, competitive analysis, and regulatory updates',
            complexity: 'High',
            impact: 'High'
          },
          {
            title: 'Multi-Location Operations Hub',
            description: 'Centralized management for operations across multiple states and facilities',
            complexity: 'High',
            impact: 'Medium'
          },
          {
            title: 'Regulatory Compliance Center',
            description: 'Personalized regulatory tracking based on their specific operations and locations',
            complexity: 'Medium',
            impact: 'High'
          },
          {
            title: 'Industry Network Access',
            description: 'VIP access to exclusive industry leader forums and networking opportunities',
            complexity: 'Low',
            impact: 'Medium'
          },
          {
            title: 'Custom Research Requests',
            description: 'Ability to request custom market research tailored to their business needs',
            complexity: 'High',
            impact: 'High'
          }
        ]
      },
      {
        id: 'engaged_veteran',
        name: 'Engaged Veteran - Mid-Size Producer',
        icon: UserCheck,
        description: '5+ year IFPA member running a successful mid-size produce operation',
        characteristics: ['50-200 acres', 'Wholesale + retail', 'Industry advocate'],
        experiments: [
          {
            title: 'Mentorship Program Opt-in',
            description: 'Test different approaches to recruit experienced members as mentors',
            kpi: 'Mentorship program enrollment',
            effort: 'Medium',
            impact: 'High'
          },
          {
            title: 'Advanced Content Pathways',
            description: 'Compare self-directed vs. guided advanced learning experiences',
            kpi: 'Advanced course completion',
            effort: 'High',
            impact: 'Medium'
          },
          {
            title: 'Industry Leadership Invitations',
            description: 'Test different invitation styles for speaking opportunities and committees',
            kpi: 'Leadership participation rate',
            effort: 'Low',
            impact: 'Medium'
          },
          {
            title: 'Peer Advisory Group Formation',
            description: 'A/B test automated vs. manual peer group matching algorithms',
            kpi: 'Peer group engagement',
            effort: 'High',
            impact: 'High'
          },
          {
            title: 'Innovation Showcase Opportunities',
            description: 'Test different ways to highlight member innovations and best practices',
            kpi: 'Innovation submission rate',
            effort: 'Medium',
            impact: 'Medium'
          }
        ],
        personalizations: [
          {
            title: 'Industry Leadership Portal',
            description: 'Access to speaking opportunities, committee positions, and industry influence roles',
            complexity: 'Medium',
            impact: 'High'
          },
          {
            title: 'Advanced Operations Analytics',
            description: 'Sophisticated business intelligence tools and industry benchmarking',
            complexity: 'High',
            impact: 'High'
          },
          {
            title: 'Mentorship Matching System',
            description: 'AI-powered matching with new members who could benefit from their expertise',
            complexity: 'High',
            impact: 'Medium'
          },
          {
            title: 'Innovation Lab Access',
            description: 'Early access to new technologies, pilot programs, and research initiatives',
            complexity: 'Medium',
            impact: 'Medium'
          },
          {
            title: 'Strategic Partnership Opportunities',
            description: 'Curated business partnership and collaboration opportunities',
            complexity: 'Medium',
            impact: 'High'
          }
        ]
      },
      {
        id: 'premium_influencer',
        name: 'Premium Influencer - Industry Executive',
        icon: Crown,
        description: 'C-level executive at major produce company, IFPA board member or advisor',
        characteristics: ['Fortune 500 company', 'Industry thought leader', 'Policy influence'],
        experiments: [
          {
            title: 'Executive Briefing Formats',
            description: 'Test video vs. written vs. interactive executive briefings',
            kpi: 'Briefing engagement and retention',
            effort: 'Medium',
            impact: 'High'
          },
          {
            title: 'VIP Event Experience Design',
            description: 'Compare different VIP event formats and networking opportunities',
            kpi: 'Event satisfaction and attendance',
            effort: 'High',
            impact: 'Medium'
          },
          {
            title: 'Policy Input Collection Methods',
            description: 'Test different ways to collect and incorporate executive policy feedback',
            kpi: 'Policy engagement rate',
            effort: 'Medium',
            impact: 'High'
          },
          {
            title: 'Thought Leadership Platform',
            description: 'A/B test different platforms for executives to share industry insights',
            kpi: 'Content creation and engagement',
            effort: 'High',
            impact: 'High'
          },
          {
            title: 'Strategic Initiative Involvement',
            description: 'Test invitation approaches for high-level strategic initiatives',
            kpi: 'Strategic initiative participation',
            effort: 'Low',
            impact: 'High'
          }
        ],
        personalizations: [
          {
            title: 'Executive Intelligence Suite',
            description: 'White-glove market intelligence with custom analysis and direct researcher access',
            complexity: 'High',
            impact: 'High'
          },
          {
            title: 'Policy Influence Dashboard',
            description: 'Real-time policy tracking with direct input channels to IFPA advocacy efforts',
            complexity: 'High',
            impact: 'High'
          },
          {
            title: 'VIP Concierge Services',
            description: 'Dedicated support for events, meetings, and special requests',
            complexity: 'Low',
            impact: 'Medium'
          },
          {
            title: 'Thought Leadership Platform',
            description: 'Premium publishing and speaking platform to share industry expertise',
            complexity: 'Medium',
            impact: 'High'
          },
          {
            title: 'Strategic Advisory Access',
            description: 'Direct access to IFPA leadership and involvement in strategic decision-making',
            complexity: 'Low',
            impact: 'High'
          }
        ]
      }
    ]
  },
  'event-promotion': {
    title: 'Event & Conference Targeting',
    description: 'Promote relevant events based on member interests, location, and past attendance',
    category: 'Event Marketing',
    difficulty: 'Beginner',
    timeline: '2-3 months',
    roi: '35-50%',
    color: 'green',
    personas: [
      // Similar structure for event promotion personas...
    ]
  },
  'content-strategy': {
    title: 'Content Strategy Optimization',
    description: 'Deliver personalized content based on member type, interests, and engagement patterns',
    category: 'Content Marketing',
    difficulty: 'Advanced',
    timeline: '4-6 months',
    roi: '55-70%',
    color: 'purple',
    personas: [
      // Similar structure for content strategy personas...
    ]
  },
  'lead-nurturing': {
    title: 'Lead Nurturing & Conversion',
    description: 'Convert website visitors to members through personalized engagement campaigns',
    category: 'Lead Generation',
    difficulty: 'Intermediate',
    timeline: '3-5 months',
    roi: '40-65%',
    color: 'orange',
    personas: [
      // Similar structure for lead nurturing personas...
    ]
  }
};

export default function UseCaseDetailPage({ params }: { params: { id: string } }) {
  const [capabilities, setCapabilities] = useState<CapabilityCheck | null>(null);
  const [capabilitySummary, setCapabilitySummary] = useState<any>(null);
  const [inputData, setInputData] = useState<PMGWorkflowInput | null>(null);

  const useCase = useCaseData[params.id as keyof typeof useCaseData];

  useEffect(() => {
    // Get PMG input data from sessionStorage to check capabilities
    const savedInputData = sessionStorage.getItem('pmg_input_data');
    if (savedInputData) {
      try {
        const parsedInputData: PMGWorkflowInput = JSON.parse(savedInputData);
        setInputData(parsedInputData);

        // Check business capabilities based on the input
        const businessCapabilities = checkBusinessCapabilities(parsedInputData);
        const summary = getCapabilitySummary(parsedInputData);

        setCapabilities(businessCapabilities);
        setCapabilitySummary(summary);
      } catch (error) {
        console.error('Failed to parse input data:', error);
      }
    }
  }, []);

  if (!useCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Use Case Not Found</h1>
              <p className="text-gray-600 mb-6">The requested use case does not exist.</p>
              <Link href="/engine/results">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Results
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-50 text-blue-700',
      green: 'border-green-500 bg-green-50 text-green-700',
      purple: 'border-purple-500 bg-purple-50 text-purple-700',
      orange: 'border-orange-500 bg-orange-50 text-orange-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Low': return 'bg-gray-100 text-gray-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/engine/results">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
            </Link>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{useCase.title}</h1>
              <p className="text-gray-600 mt-1">{useCase.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary">{useCase.category}</Badge>
            <Badge variant="outline">{useCase.difficulty}</Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-lg">{useCase.timeline}</h3>
              <p className="text-sm text-gray-600">Implementation Timeline</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-lg">{useCase.roi}</h3>
              <p className="text-sm text-gray-600">Expected ROI Increase</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-lg">{useCase.personas.length}</h3>
              <p className="text-sm text-gray-600">Target Personas</p>
            </CardContent>
          </Card>
        </div>

        {/* Personas Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 w-5" />
              Target Personas & Implementation Ideas
            </CardTitle>
            <CardDescription>
              Explore experimentation and personalization opportunities for each persona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={useCase.personas[0]?.id} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                {useCase.personas.map((persona) => {
                  const IconComponent = persona.icon;
                  return (
                    <TabsTrigger key={persona.id} value={persona.id} className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden sm:inline">{persona.name.split(' - ')[1]}</span>
                      <span className="sm:hidden">{persona.name.split(' - ')[1].split(' ')[0]}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {useCase.personas.map((persona) => (
                <TabsContent key={persona.id} value={persona.id} className="space-y-6">

                  {/* Persona Overview */}
                  <Card className={`border-l-4 ${getColorClasses(useCase.color)}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${getColorClasses(useCase.color)}`}>
                          <persona.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{persona.name}</h3>
                          <p className="text-gray-600 mb-4">{persona.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {persona.characteristics.map((char, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Experiments */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          Experimentation Ideas
                        </CardTitle>
                        <CardDescription>5 A/B test concepts to optimize this persona's experience</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {persona.experiments.map((experiment, index) => (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-blue-700">{experiment.title}</h4>
                                <div className="flex gap-1">
                                  <Badge className={`text-xs ${getEffortColor(experiment.effort)}`}>
                                    {experiment.effort}
                                  </Badge>
                                  <Badge className={`text-xs ${getImpactColor(experiment.impact)}`}>
                                    {experiment.impact}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{experiment.description}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Target className="w-3 h-3" />
                                <span>KPI: {experiment.kpi}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Personalizations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-green-600" />
                          Personalization Ideas
                        </CardTitle>
                        <CardDescription>5 personalization concepts to enhance their journey</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {persona.personalizations.map((personalization, index) => (
                          <Card key={index} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-green-700">{personalization.title}</h4>
                                <div className="flex gap-1">
                                  <Badge className={`text-xs ${getComplexityColor(personalization.complexity)}`}>
                                    {personalization.complexity}
                                  </Badge>
                                  <Badge className={`text-xs ${getImpactColor(personalization.impact)}`}>
                                    {personalization.impact}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{personalization.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Implementation Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Implementation Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Best Practices
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Start with low-effort, high-impact experiments</li>
                  <li>• Implement robust tracking for all persona interactions</li>
                  <li>• Establish clear success metrics before launching</li>
                  <li>• Plan for iterative improvements based on results</li>
                  <li>• Ensure compliance with data privacy regulations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Success Metrics
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Persona-specific engagement rates</li>
                  <li>• Conversion improvements by segment</li>
                  <li>• Member satisfaction scores</li>
                  <li>• Time-to-value metrics</li>
                  <li>• Long-term retention rates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}