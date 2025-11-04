'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ArrowLeft,
  Brain,
  Database,
  Zap,
  BarChart3,
  Target,
  TrendingUp,
  Users,
  Cog,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  const maturityPhases = [
    {
      phase: "Crawl",
      title: "Foundation Building",
      description: "A/B testing and simple personalization",
      icon: "🐛",
      color: "from-red-500/10 to-red-500/5 border-red-200",
      details: [
        "Basic A/B testing setup",
        "Simple audience segmentation",
        "First data collection processes",
        "Foundation measurement framework"
      ]
    },
    {
      phase: "Walk",
      title: "Structured Growth",
      description: "Advanced experimentation and data-driven audiences",
      icon: "🚶",
      color: "from-yellow-500/10 to-yellow-500/5 border-yellow-200",
      details: [
        "Multi-variate testing programs",
        "Advanced audience targeting",
        "Cross-channel data integration",
        "Automated campaign optimization"
      ]
    },
    {
      phase: "Run",
      title: "Advanced Execution",
      description: "Smart personalization and integrated systems",
      icon: "🏃",
      color: "from-green-500/10 to-green-500/5 border-green-200",
      details: [
        "AI-powered personalization",
        "Real-time content optimization",
        "Integrated martech stack",
        "Advanced analytics & attribution"
      ]
    },
    {
      phase: "Fly",
      title: "Mature Optimization",
      description: "AI-powered omnichannel experiences",
      icon: "🦅",
      color: "from-blue-500/10 to-blue-500/5 border-blue-200",
      details: [
        "Fully automated personalization",
        "Predictive customer journey mapping",
        "Cross-channel experience orchestration",
        "Advanced AI and machine learning"
      ]
    }
  ];

  const engineCapabilities = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI Analysis Engine",
      description: "Advanced machine learning algorithms analyze your current technology stack, business goals, and market position to identify optimization opportunities."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Data Integration Layer",
      description: "Seamlessly connects with your existing martech tools like Optimizely, Salesforce, Adobe, and more to understand your current capabilities."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Strategic Roadmapping",
      description: "Generates personalized, phased roadmaps with specific milestones, timelines, and success metrics tailored to your organization's maturity level."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Performance Benchmarking",
      description: "Compares your current state against industry standards and best practices to identify gaps and prioritize improvements."
    }
  ];

  const dataUsagePoints = [
    {
      category: "Technology Assessment",
      description: "Maps your current martech stack capabilities and integration points",
      examples: ["CRM platforms", "Analytics tools", "Content management", "Automation platforms"]
    },
    {
      category: "Business Context",
      description: "Understands your industry, company size, and strategic priorities",
      examples: ["Revenue goals", "Target audiences", "Market position", "Growth objectives"]
    },
    {
      category: "Maturity Evaluation",
      description: "Assesses current personalization and experimentation capabilities",
      examples: ["Testing sophistication", "Data quality", "Team expertise", "Process maturity"]
    },
    {
      category: "Strategic Alignment",
      description: "Aligns recommendations with your specific business outcomes",
      examples: ["ROI projections", "Resource requirements", "Timeline planning", "Risk assessment"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3 hover:from-blue-700 hover:to-indigo-700 transition-colors">
                <Sparkles className="h-8 w-8" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">How It Works</h1>
                <p className="text-muted-foreground">Understanding the Opal AI Strategy Engine</p>
              </div>
            </div>
            <Link href="/engine">
              <Button className="gap-2">
                Try the Engine
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Intelligent Personalization Strategy Generation
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI engine analyzes your unique business context and technology ecosystem to create
              data-driven personalization strategies that deliver measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* How the Engine Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">How the Opal Engine Works</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Advanced AI technology meets personalization expertise to deliver strategies tailored to your organization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {engineCapabilities.map((capability, index) => (
            <Card key={index} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {capability.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{capability.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{capability.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Usage Explanation */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <Database className="h-7 w-7 text-blue-600" />
              How We Use Your Data to Create Strategy
            </CardTitle>
            <p className="text-muted-foreground">
              Transparency in how we analyze your information to generate personalized recommendations
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dataUsagePoints.map((point, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{point.category}</h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-7">{point.description}</p>
                  <div className="ml-7">
                    <div className="flex flex-wrap gap-2">
                      {point.examples.map((example, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4-Phase Maturity Framework */}
      <section className="container mx-auto px-4 py-16 bg-white/50">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">4-Phase Maturity Framework</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive framework guides you through progressive stages of personalization maturity,
            ensuring sustainable growth and measurable results at each phase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {maturityPhases.map((phase, index) => (
            <Card key={phase.phase} className={`bg-gradient-to-br ${phase.color} border hover:shadow-lg transition-shadow h-full`}>
              <CardContent className="p-6 h-full flex flex-col">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{phase.icon}</div>
                  <h4 className="font-bold text-xl mb-2">{phase.phase.toUpperCase()}</h4>
                  <h5 className="font-semibold text-sm text-muted-foreground mb-3">{phase.title}</h5>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>

                <div className="flex-1">
                  <h6 className="font-semibold text-sm mb-3">Key Capabilities:</h6>
                  <div className="space-y-2">
                    {phase.details.map((detail, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs leading-tight">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="inline-block bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-6 w-6 text-purple-600" />
                <span className="font-semibold text-lg">Ready to Begin Your Journey?</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Discover where you currently stand and get your personalized roadmap to the next phase
              </p>
              <Link href="/engine">
                <Button size="lg" className="gap-2">
                  Start Your Assessment
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2025 Opal Personalization Generator from Perficient. Powered by Opal AI.
            </div>
            <div className="flex space-x-6">
              <Button variant="link" size="sm" asChild>
                <Link href="/">Home</Link>
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link href="/engine">Strategy Engine</Link>
              </Button>
              <Button variant="link" size="sm" asChild>
                <a href="/api/mcp">MCP API</a>
              </Button>
              <Button variant="link" size="sm" asChild>
                <a href="https://github.com/alex-prft/opal-2025">GitHub</a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}