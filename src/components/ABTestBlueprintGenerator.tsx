'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Beaker,
  Target,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Plus,
  Lightbulb,
  BarChart3
} from 'lucide-react';

interface ABTestBlueprint {
  id: string;
  title: string;
  hypothesis: string;
  target_audience: string;
  primary_metric: string;
  secondary_metrics: string[];
  test_duration: string;
  sample_size: number;
  statistical_power: number;
  variations: TestVariation[];
  success_criteria: string;
  implementation_complexity: 'Low' | 'Medium' | 'High';
  potential_impact: 'Low' | 'Medium' | 'High';
  category: 'Content' | 'Navigation' | 'Membership' | 'Events' | 'Engagement';
}

interface TestVariation {
  name: string;
  description: string;
  changes: string[];
  traffic_split: number;
}

export default function ABTestBlueprintGenerator() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generatedBlueprints, setGeneratedBlueprints] = useState<ABTestBlueprint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Pre-defined test blueprints for IFPA
  const ifpaTestBlueprints: ABTestBlueprint[] = [
    {
      id: 'membership-cta-optimization',
      title: 'Membership CTA Optimization',
      hypothesis: 'Personalizing membership call-to-action buttons based on visitor type (returning vs new) will increase membership sign-ups by 15%',
      target_audience: 'Non-member website visitors interested in produce industry',
      primary_metric: 'Membership conversion rate',
      secondary_metrics: ['Click-through rate on CTA', 'Time spent on membership page', 'Form completion rate'],
      test_duration: '4 weeks',
      sample_size: 2400,
      statistical_power: 80,
      variations: [
        {
          name: 'Control (Current)',
          description: 'Standard "Join IFPA" button with generic messaging',
          changes: ['Current button design', 'Generic membership benefits'],
          traffic_split: 33
        },
        {
          name: 'Personalized - New Visitors',
          description: 'Targeted messaging for first-time visitors highlighting discovery benefits',
          changes: [
            'CTA: "Discover Your Produce Network"',
            'Emphasis on industry connections',
            'Free trial offer prominent'
          ],
          traffic_split: 33
        },
        {
          name: 'Personalized - Returning Visitors',
          description: 'Targeted messaging for returning visitors emphasizing exclusive access',
          changes: [
            'CTA: "Join Your Industry Leaders"',
            'Emphasis on exclusive content and events',
            'Member testimonials visible'
          ],
          traffic_split: 34
        }
      ],
      success_criteria: '15% increase in membership sign-ups with 95% confidence',
      implementation_complexity: 'Medium',
      potential_impact: 'High',
      category: 'Membership'
    },
    {
      id: 'event-registration-personalization',
      title: 'Event Registration Page Personalization',
      hypothesis: 'Showing relevant past event attendance and member-specific pricing will increase event registrations by 25%',
      target_audience: 'IFPA members browsing upcoming events',
      primary_metric: 'Event registration conversion rate',
      secondary_metrics: ['Page engagement time', 'Click-through on related events', 'Email newsletter sign-ups'],
      test_duration: '6 weeks',
      sample_size: 1800,
      statistical_power: 85,
      variations: [
        {
          name: 'Control (Generic)',
          description: 'Standard event listing with general information',
          changes: ['Standard event cards', 'General pricing display', 'Generic benefits list'],
          traffic_split: 50
        },
        {
          name: 'Personalized Experience',
          description: 'Member-specific event recommendations and pricing',
          changes: [
            'Member pricing prominently displayed',
            '"Members like you attended" social proof',
            'Personalized event recommendations',
            'Past attendance history widget'
          ],
          traffic_split: 50
        }
      ],
      success_criteria: '25% increase in event registrations with statistical significance',
      implementation_complexity: 'High',
      potential_impact: 'High',
      category: 'Events'
    },
    {
      id: 'content-recommendation-algorithm',
      title: 'Content Recommendation Algorithm Test',
      hypothesis: 'AI-powered content recommendations based on member type and reading history will increase content engagement by 35%',
      target_audience: 'All website visitors and members',
      primary_metric: 'Content engagement rate (time spent + actions taken)',
      secondary_metrics: ['Content download rate', 'Related article clicks', 'Social sharing'],
      test_duration: '8 weeks',
      sample_size: 3200,
      statistical_power: 90,
      variations: [
        {
          name: 'Manual Curation',
          description: 'Editor-selected featured content and related articles',
          changes: ['Manually curated content sections', 'Editor-picked related articles'],
          traffic_split: 25
        },
        {
          name: 'Collaborative Filtering',
          description: 'Recommendations based on similar user behavior patterns',
          changes: [
            'Content similar users viewed',
            'Popular in your industry segment',
            'Trending among your member type'
          ],
          traffic_split: 25
        },
        {
          name: 'AI-Powered Hybrid',
          description: 'Machine learning algorithm combining behavior, content, and member data',
          changes: [
            'Personalized content feed',
            'Dynamic article recommendations',
            'Smart content discovery',
            'Predictive content suggestions'
          ],
          traffic_split: 25
        },
        {
          name: 'Control + A/B Split',
          description: 'Random content recommendations for baseline comparison',
          changes: ['Randomized content display', 'No personalization logic'],
          traffic_split: 25
        }
      ],
      success_criteria: '35% increase in content engagement with p-value < 0.05',
      implementation_complexity: 'High',
      potential_impact: 'High',
      category: 'Content'
    },
    {
      id: 'navigation-member-portal',
      title: 'Member Portal Navigation Optimization',
      hypothesis: 'Personalizing navigation menu based on member usage patterns will reduce bounce rate by 20% and increase portal session duration',
      target_audience: 'Logged-in IFPA members accessing the member portal',
      primary_metric: 'Portal bounce rate',
      secondary_metrics: ['Session duration', 'Pages per session', 'Feature adoption rate'],
      test_duration: '5 weeks',
      sample_size: 2000,
      statistical_power: 85,
      variations: [
        {
          name: 'Standard Navigation',
          description: 'Current fixed navigation menu for all members',
          changes: ['Standard menu structure', 'All features equally visible'],
          traffic_split: 50
        },
        {
          name: 'Usage-Based Navigation',
          description: 'Dynamic menu highlighting most-used features for each member',
          changes: [
            'Frequently used features promoted',
            'Personalized quick actions',
            'Usage-based menu ordering',
            'Recently accessed content widget'
          ],
          traffic_split: 50
        }
      ],
      success_criteria: '20% reduction in bounce rate and 15% increase in session duration',
      implementation_complexity: 'Medium',
      potential_impact: 'Medium',
      category: 'Navigation'
    },
    {
      id: 'email-subject-line-optimization',
      title: 'Email Subject Line Personalization',
      hypothesis: 'Personalizing email subject lines based on member segment and past engagement will increase open rates by 18%',
      target_audience: 'All IFPA email subscribers segmented by member type',
      primary_metric: 'Email open rate',
      secondary_metrics: ['Click-through rate', 'Unsubscribe rate', 'Forward/share rate'],
      test_duration: '3 weeks',
      sample_size: 15000,
      statistical_power: 95,
      variations: [
        {
          name: 'Generic Subject Lines',
          description: 'Standard subject lines for all recipients',
          changes: ['One-size-fits-all messaging', 'No personalization'],
          traffic_split: 20
        },
        {
          name: 'Name Personalization',
          description: 'Subject lines including recipient first name',
          changes: ['First name in subject line', 'Direct address approach'],
          traffic_split: 20
        },
        {
          name: 'Segment-Based Messaging',
          description: 'Subject lines tailored to member type and interests',
          changes: [
            'Industry-specific messaging',
            'Member type relevant content',
            'Interest-based subject lines'
          ],
          traffic_split: 20
        },
        {
          name: 'Behavioral Personalization',
          description: 'Subject lines based on past email engagement and website behavior',
          changes: [
            'Engagement history informed',
            'Website behavior triggered',
            'Content preference based',
            'Activity-level appropriate'
          ],
          traffic_split: 20
        },
        {
          name: 'AI-Optimized Dynamic',
          description: 'Machine learning-optimized subject lines for each individual',
          changes: [
            'AI-generated personalization',
            'Individual optimization',
            'Predictive engagement scoring',
            'Dynamic content selection'
          ],
          traffic_split: 20
        }
      ],
      success_criteria: '18% increase in email open rates across all segments',
      implementation_complexity: 'Low',
      potential_impact: 'Medium',
      category: 'Engagement'
    }
  ];

  const generateNewBlueprint = async () => {
    setIsGenerating(true);

    // Simulate AI generation process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, this would call an AI service to generate new test ideas
    const newBlueprint: ABTestBlueprint = {
      id: `generated-${Date.now()}`,
      title: 'AI-Generated Test Opportunity',
      hypothesis: 'Dynamic content personalization based on member journey stage will improve engagement metrics',
      target_audience: 'All website visitors',
      primary_metric: 'Conversion rate',
      secondary_metrics: ['Engagement time', 'Click-through rate'],
      test_duration: '4 weeks',
      sample_size: 2500,
      statistical_power: 80,
      variations: [
        {
          name: 'Control',
          description: 'Current experience',
          changes: ['No changes'],
          traffic_split: 50
        },
        {
          name: 'Personalized',
          description: 'AI-powered personalization',
          changes: ['Dynamic content', 'Personalized messaging'],
          traffic_split: 50
        }
      ],
      success_criteria: '20% improvement in primary metric',
      implementation_complexity: 'Medium',
      potential_impact: 'High',
      category: 'Content'
    };

    setGeneratedBlueprints([...generatedBlueprints, newBlueprint]);
    setIsGenerating(false);
  };

  const filteredBlueprints = selectedCategory === 'all'
    ? [...ifpaTestBlueprints, ...generatedBlueprints]
    : [...ifpaTestBlueprints, ...generatedBlueprints].filter(bp => bp.category === selectedCategory);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
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
      case 'High': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Beaker className="h-6 w-6" />
            A/B Test Blueprint Generator
          </h2>
          <p className="text-muted-foreground">
            Pre-configured test strategies optimized for IFPA's personalization goals
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={generateNewBlueprint} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            Generate AI Blueprint
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Tests ({ifpaTestBlueprints.length + generatedBlueprints.length})
        </Button>
        {['Content', 'Navigation', 'Membership', 'Events', 'Engagement'].map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category} ({[...ifpaTestBlueprints, ...generatedBlueprints].filter(bp => bp.category === category).length})
          </Button>
        ))}
      </div>

      {/* Blueprint Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBlueprints.map((blueprint) => (
          <Card key={blueprint.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{blueprint.title}</CardTitle>
                  <CardDescription className="mt-2">
                    <Badge variant="outline" className="mr-2">{blueprint.category}</Badge>
                    <span className="text-sm">{blueprint.target_audience}</span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getComplexityColor(blueprint.implementation_complexity)}>
                    {blueprint.implementation_complexity}
                  </Badge>
                  <Badge className={getImpactColor(blueprint.potential_impact)}>
                    {blueprint.potential_impact} Impact
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="variations">Variations</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Hypothesis</h4>
                    <p className="text-sm text-gray-600">{blueprint.hypothesis}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{blueprint.test_duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{blueprint.sample_size.toLocaleString()} visitors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <span>{blueprint.statistical_power}% power</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-500" />
                      <span>{blueprint.variations.length} variations</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Success Criteria</h4>
                    <p className="text-sm text-gray-600">{blueprint.success_criteria}</p>
                  </div>
                </TabsContent>

                <TabsContent value="variations" className="space-y-3">
                  {blueprint.variations.map((variation, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{variation.name}</h4>
                        <Badge variant="secondary">{variation.traffic_split}%</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{variation.description}</p>
                      <div className="space-y-1">
                        {variation.changes.map((change, changeIndex) => (
                          <div key={changeIndex} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{change}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Primary Metric
                    </h4>
                    <p className="text-sm font-medium text-blue-600">{blueprint.primary_metric}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Secondary Metrics
                    </h4>
                    <div className="space-y-1">
                      {blueprint.secondary_metrics.map((metric, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-3 w-3 text-orange-500" />
                          <span>{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Clone & Edit
                  </Button>
                  <Button size="sm">
                    Implement Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBlueprints.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No test blueprints found</h3>
            <p className="text-gray-500 mb-4">
              Try selecting a different category or generate a new AI-powered blueprint
            </p>
            <Button onClick={generateNewBlueprint} disabled={isGenerating}>
              Generate New Blueprint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}