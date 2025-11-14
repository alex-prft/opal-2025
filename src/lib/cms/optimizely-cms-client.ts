// Optimizely CMS 12 PaaS Client
// Integrates with IFPA CMS content for real content recommendations

import { workflowDb } from '@/lib/database/workflow-operations';

export interface CMSContent {
  id: string;
  title: string;
  description: string;
  url: string;
  contentType: string;
  topics: string[];
  sections: string[];
  audience: string;
  lastModified: string;
  publishDate: string;
  metadata: Record<string, any>;
  confidenceScore?: number;
}

export interface CMSContentFilter {
  contentType?: string;
  topic?: string;
  section?: string;
  audience?: string;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
  activeOnly?: boolean;
}

export class OptimizelyDMSClient {
  private baseUrl: string;
  private apiKey: string;
  private projectId: string;

  constructor() {
    this.baseUrl = process.env.CMS_PAAS_BASE_URL || 'https://your-ifpa-cms.optimizely.cloud';
    this.apiKey = process.env.CMS_PAAS_API_KEY || '';
    this.projectId = process.env.CMS_PAAS_PROJECT_ID || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/episerver/${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`CMS API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CMS API Error:', error);

      // Log performance metric for failed request
      await workflowDb.logAPIPerformance({
        endpoint: url,
        method: options.method || 'GET',
        responseTimeMs: 0,
        statusCode: 500,
        dxpPlatform: 'optimizely_cms_12_paas',
        apiCallType: 'cms_content_retrieval',
        errorMessage: error instanceof Error ? error.message : 'Unknown CMS error'
      });

      throw error;
    }
  }

  async getContentByTopic(topic: string, filter: CMSContentFilter = {}): Promise<CMSContent[]> {
    const startTime = Date.now();

    try {
      // If CMS is not configured, return fallback IFPA content
      if (!this.apiKey || this.apiKey === 'your_cms_api_key_here') {
        console.log('⚠️ CMS not configured, using fallback IFPA content');
        return this.getFallbackContentByTopic(topic, filter);
      }

      // Query CMS for topic-based content
      const query = {
        contentType: 'IFPAContent',
        expand: '*',
        filter: {
          Topics: { contains: topic },
          Status: 'Published',
          ...filter
        },
        orderBy: filter.sortBy === 'date' ? 'Changed desc' : 'Relevance desc',
        top: filter.limit || 10
      };

      const response = await this.makeRequest('v3.0/content', {
        method: 'POST',
        body: JSON.stringify(query)
      });

      const content = this.transformCMSContent(response.value || []);

      // Log performance
      await workflowDb.logAPIPerformance({
        endpoint: '/api/episerver/v3.0/content',
        method: 'POST',
        responseTimeMs: Date.now() - startTime,
        statusCode: 200,
        dxpPlatform: 'optimizely_cms_12_paas',
        apiCallType: 'topic_content_retrieval'
      });

      console.log(`✅ Retrieved ${content.length} CMS content items for topic: ${topic}`);
      return content;

    } catch (error) {
      console.error('❌ CMS content retrieval failed, using fallback:', error);
      return this.getFallbackContentByTopic(topic, filter);
    }
  }

  async getContentBySection(section: string, filter: CMSContentFilter = {}): Promise<CMSContent[]> {
    const startTime = Date.now();

    try {
      if (!this.apiKey || this.apiKey === 'your_cms_api_key_here') {
        console.log('⚠️ CMS not configured, using fallback IFPA content');
        return this.getFallbackContentBySection(section, filter);
      }

      const query = {
        contentType: 'IFPAContent',
        expand: '*',
        filter: {
          Sections: { contains: section },
          Status: 'Published',
          ...filter
        },
        orderBy: filter.sortBy === 'date' ? 'Changed desc' : 'Relevance desc',
        top: filter.limit || 10
      };

      const response = await this.makeRequest('v3.0/content', {
        method: 'POST',
        body: JSON.stringify(query)
      });

      const content = this.transformCMSContent(response.value || []);

      await workflowDb.logAPIPerformance({
        endpoint: '/api/episerver/v3.0/content',
        method: 'POST',
        responseTimeMs: Date.now() - startTime,
        statusCode: 200,
        dxpPlatform: 'optimizely_cms_12_paas',
        apiCallType: 'section_content_retrieval'
      });

      console.log(`✅ Retrieved ${content.length} CMS content items for section: ${section}`);
      return content;

    } catch (error) {
      console.error('❌ CMS content retrieval failed, using fallback:', error);
      return this.getFallbackContentBySection(section, filter);
    }
  }

  async getContentCatalog(): Promise<{ topics: any[], sections: any[] }> {
    const startTime = Date.now();

    try {
      if (!this.apiKey || this.apiKey === 'your_cms_api_key_here') {
        console.log('⚠️ CMS not configured, using fallback IFPA catalog');
        return this.getFallbackCatalog();
      }

      // Get available topics and sections from CMS
      const [topicsResponse, sectionsResponse] = await Promise.all([
        this.makeRequest('v3.0/content/topics'),
        this.makeRequest('v3.0/content/sections')
      ]);

      const catalog = {
        topics: topicsResponse.value || [],
        sections: sectionsResponse.value || []
      };

      await workflowDb.logAPIPerformance({
        endpoint: '/api/episerver/v3.0/content/catalog',
        method: 'GET',
        responseTimeMs: Date.now() - startTime,
        statusCode: 200,
        dxpPlatform: 'optimizely_cms_12_paas',
        apiCallType: 'catalog_retrieval'
      });

      console.log(`✅ Retrieved CMS catalog: ${catalog.topics.length} topics, ${catalog.sections.length} sections`);
      return catalog;

    } catch (error) {
      console.error('❌ CMS catalog retrieval failed, using fallback:', error);
      return this.getFallbackCatalog();
    }
  }

  private transformCMSContent(cmsItems: any[]): CMSContent[] {
    return cmsItems.map(item => ({
      id: item.ContentGuid || item.ContentLink?.GuidValue || `cms_${Date.now()}`,
      title: item.Name || item.Title || 'Untitled Content',
      description: item.MetaDescription || item.TeaserText || item.MainBody?.substring(0, 200) || '',
      url: item.Url || item.ContentLink?.Url || '#',
      contentType: item.ContentTypeName || 'Article',
      topics: this.extractTopics(item),
      sections: this.extractSections(item),
      audience: this.determineAudience(item),
      lastModified: item.Changed || new Date().toISOString(),
      publishDate: item.StartPublish || item.Created || new Date().toISOString(),
      metadata: {
        language: item.Language?.Name || 'en',
        category: item.Category?.Name || 'General',
        author: item.CreatedBy || 'IFPA',
        tags: item.Tags || []
      },
      confidenceScore: this.calculateConfidenceScore(item)
    }));
  }

  private extractTopics(item: any): string[] {
    // Extract topics from various CMS fields
    const topics = [];

    if (item.Topics) topics.push(...item.Topics);
    if (item.Category?.Name) topics.push(item.Category.Name);
    if (item.Tags) topics.push(...item.Tags.filter((tag: string) => tag.includes('topic')));

    return topics.length > 0 ? topics : ['general'];
  }

  private extractSections(item: any): string[] {
    // Extract sections from CMS structure
    const sections = [];

    if (item.Sections) sections.push(...item.Sections);
    if (item.ParentLink?.Name) sections.push(item.ParentLink.Name);

    return sections.length > 0 ? sections : ['content'];
  }

  private determineAudience(item: any): string {
    // Determine audience based on CMS properties
    if (item.MembershipRequired || item.Access === 'Members') {
      return 'Paid Members';
    }
    if (item.RequiresLogin || item.Access === 'Registered') {
      return 'Registered';
    }
    return 'All Members';
  }

  private calculateConfidenceScore(item: any): number {
    let score = 0.7; // Base score

    // Boost score based on content completeness
    if (item.MetaDescription) score += 0.1;
    if (item.TeaserText) score += 0.05;
    if (item.MainBody && item.MainBody.length > 500) score += 0.1;
    if (item.Tags && item.Tags.length > 0) score += 0.05;

    return Math.min(score, 1.0);
  }

  // Fallback methods for when CMS is not configured
  private getFallbackContentByTopic(topic: string, filter: CMSContentFilter): CMSContent[] {
    const ifpaTopicContent: Record<string, CMSContent[]> = {
      'seasonal_produce': [
        {
          id: 'ifpa_seasonal_1',
          title: 'Winter Citrus Season Guide',
          description: 'Comprehensive guide to winter citrus varieties, quality standards, and seasonal availability',
          url: '/resources/seasonal/winter-citrus',
          contentType: 'Seasonal Guide',
          topics: ['seasonal_produce', 'citrus', 'winter'],
          sections: ['resource_center'],
          audience: 'All Members',
          lastModified: '2024-11-10T00:00:00Z',
          publishDate: '2024-11-01T00:00:00Z',
          metadata: {
            language: 'en',
            category: 'Seasonal Produce',
            author: 'IFPA Research Team',
            tags: ['citrus', 'winter', 'quality']
          },
          confidenceScore: 0.92
        }
      ],
      'member_benefits': [
        {
          id: 'ifpa_benefits_1',
          title: 'IFPA Member Networking Directory',
          description: 'Connect with over 2,000 IFPA members worldwide through our exclusive networking platform',
          url: '/members/directory',
          contentType: 'Member Resource',
          topics: ['member_benefits', 'networking'],
          sections: ['member_portal'],
          audience: 'Registered',
          lastModified: '2024-11-08T00:00:00Z',
          publishDate: '2024-10-15T00:00:00Z',
          metadata: {
            language: 'en',
            category: 'Member Benefits',
            author: 'IFPA Membership Team',
            tags: ['networking', 'directory', 'members']
          },
          confidenceScore: 0.95
        }
      ]
    };

    return ifpaTopicContent[topic] || [];
  }

  private getFallbackContentBySection(section: string, filter: CMSContentFilter): CMSContent[] {
    const ifpaSectionContent: Record<string, CMSContent[]> = {
      'homepage_hero': [
        {
          id: 'ifpa_hero_1',
          title: 'Welcome to IFPA - Leading the Fresh Produce Industry',
          description: 'Join the International Fresh Produce Association and connect with the global fresh produce community',
          url: '/',
          contentType: 'Hero Content',
          topics: ['welcome', 'industry_leadership'],
          sections: ['homepage_hero'],
          audience: 'All Members',
          lastModified: '2024-11-12T00:00:00Z',
          publishDate: '2024-11-12T00:00:00Z',
          metadata: {
            language: 'en',
            category: 'Homepage',
            author: 'IFPA Marketing',
            tags: ['hero', 'welcome', 'industry']
          },
          confidenceScore: 0.98
        }
      ],
      'member_portal': [
        {
          id: 'ifpa_portal_1',
          title: 'Member Resources Dashboard',
          description: 'Access exclusive member resources, industry reports, and certification programs',
          url: '/members/dashboard',
          contentType: 'Dashboard',
          topics: ['member_resources', 'dashboard'],
          sections: ['member_portal'],
          audience: 'Paid Members',
          lastModified: '2024-11-11T00:00:00Z',
          publishDate: '2024-11-01T00:00:00Z',
          metadata: {
            language: 'en',
            category: 'Member Portal',
            author: 'IFPA Member Services',
            tags: ['dashboard', 'resources', 'exclusive']
          },
          confidenceScore: 0.94
        }
      ]
    };

    return ifpaSectionContent[section] || [];
  }

  private getFallbackCatalog() {
    return {
      topics: [
        { id: 'seasonal_produce', name: 'Seasonal Produce', description: 'Seasonal availability and quality information' },
        { id: 'member_benefits', name: 'Member Benefits', description: 'Exclusive member resources and networking' },
        { id: 'industry_news', name: 'Industry News', description: 'Latest fresh produce industry developments' },
        { id: 'sustainability', name: 'Sustainability', description: 'Environmental initiatives and sustainable practices' },
        { id: 'food_safety', name: 'Food Safety', description: 'Safety protocols and compliance guidelines' },
        { id: 'education_training', name: 'Education & Training', description: 'Professional development and certification' }
      ],
      sections: [
        { id: 'homepage_hero', name: 'Homepage Hero', description: 'Primary homepage content area' },
        { id: 'member_portal', name: 'Member Portal', description: 'Member-exclusive resources section' },
        { id: 'resource_center', name: 'Resource Center', description: 'Educational materials and guides' },
        { id: 'news_updates', name: 'News & Updates', description: 'Industry news and updates' },
        { id: 'education', name: 'Education Hub', description: 'Training and certification programs' },
        { id: 'events', name: 'Events & Conferences', description: 'Industry events and networking' }
      ]
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey || this.apiKey === 'your_cms_api_key_here') {
        console.log('⚠️ CMS credentials not configured - using fallback content');
        return false;
      }

      await this.makeRequest('v3.0/content?$top=1');
      console.log('✅ CMS connection successful');
      return true;
    } catch (error) {
      console.error('❌ CMS connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cmsClient = new OptimizelyDMSClient();