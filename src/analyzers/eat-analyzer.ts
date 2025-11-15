import { load } from 'cheerio';
import { EEATScore, EEATIssue, AnalysisResult, StructuredDataIssue } from '../types.js';

export class EEATAnalyzer {

  /**
   * Analyze URL or HTML content for E-E-A-T signals
   */
  analyze(html: string, url: string): AnalysisResult {
    const $ = load(html);

    const eatScore = this.calculateEEATScore($);
    const issues = this.findEEATIssues($);
    const structuredData = this.analyzeStructuredData($);
    const recommendations = this.generateRecommendations(eatScore, issues);
    const aeoReadiness = this.calculateAEOReadiness($, eatScore);

    return {
      url,
      eatScore,
      issues,
      structuredData,
      recommendations,
      aeoReadiness
    };
  }

  /**
   * Calculate E-E-A-T scores
   */
  private calculateEEATScore($: any): EEATScore {
    const experience = this.scoreExperience($);
    const expertise = this.scoreExpertise($);
    const authoritativeness = this.scoreAuthoritativeness($);
    const trustworthiness = this.scoreTrustworthiness($);

    const overall = Math.round((experience + expertise + authoritativeness + trustworthiness) / 4);

    return {
      experience,
      expertise,
      authoritativeness,
      trustworthiness,
      overall
    };
  }

  /**
   * Score Experience signals
   */
  private scoreExperience($: any): number {
    let score = 0;

    // Check for first-person accounts
    const text = $('body').text().toLowerCase();
    if (text.includes('i tested') || text.includes('i tried') || text.includes('in my experience')) {
      score += 25;
    }

    // Check for images/screenshots
    const images = $('img').length;
    if (images >= 5) score += 20;
    else if (images >= 2) score += 10;

    // Check for detailed processes
    if (text.includes('step') || text.includes('how to') || text.includes('tutorial')) {
      score += 15;
    }

    // Check for dates/timestamps
    if ($('time').length > 0 || text.includes('updated') || text.includes('published')) {
      score += 20;
    }

    // Check for specific details
    const hasNumbers = /\d+/.test(text);
    const hasMetrics = text.includes('results') || text.includes('tested') || text.includes('data');
    if (hasNumbers && hasMetrics) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Score Expertise signals
   */
  private scoreExpertise($: any): number {
    let score = 0;

    // Check for author bio
    const authorSelectors = ['[rel="author"]', '.author-bio', '#author', '.author', '[itemprop="author"]'];
    const hasAuthor = authorSelectors.some(selector => $(selector).length > 0);
    if (hasAuthor) score += 30;

    // Check for credentials
    const text = $('body').text().toLowerCase();
    const credentials = ['phd', 'md', 'certified', 'expert', 'professional', 'specialist'];
    const hasCredentials = credentials.some(cred => text.includes(cred));
    if (hasCredentials) score += 25;

    // Check for references/citations
    if ($('cite').length > 0 || $('blockquote').length > 0 || text.includes('source:') || text.includes('references')) {
      score += 20;
    }

    // Check for technical depth
    const hasTechnicalContent = text.split(' ').length > 1000;
    if (hasTechnicalContent) score += 15;

    // Check for structured content (headings)
    const headings = $('h2, h3, h4').length;
    if (headings >= 5) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Score Authoritativeness signals
   */
  private scoreAuthoritativeness($: any): number {
    let score = 0;

    // Check for organization schema
    const hasOrgSchema = $('script[type="application/ld+json"]').toArray().some((el: any) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        return json['@type'] === 'Organization' || json['@type'] === 'Person';
      } catch {
        return false;
      }
    });
    if (hasOrgSchema) score += 30;

    // Check for About page
    const links = $('a').toArray().map((el: any) => $(el).attr('href')?.toLowerCase() || '');
    if (links.some((href: string) => href.includes('about'))) score += 20;

    // Check for Contact information
    if (links.some((href: string) => href.includes('contact')) || $('address').length > 0) {
      score += 15;
    }

    // Check for social proof
    if (links.some((href: string) => href.includes('linkedin') || href.includes('twitter'))) {
      score += 15;
    }

    // Check for external references
    const externalLinks = links.filter((href: string) => href.startsWith('http'));
    if (externalLinks.length >= 3) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Score Trustworthiness signals
   */
  private scoreTrustworthiness($: any): number {
    let score = 0;

    // Check for HTTPS
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical?.startsWith('https://')) score += 20;

    // Check for privacy policy
    const links = $('a').toArray().map((el: any) => $(el).text().toLowerCase());
    if (links.some((text: string) => text.includes('privacy'))) score += 15;

    // Check for terms of service
    if (links.some((text: string) => text.includes('terms'))) score += 10;

    // Check for contact info
    const text = $('body').text().toLowerCase();
    const hasEmail = /@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
    if (hasEmail) score += 15;

    // Check for transparency (last updated, disclosure)
    if (text.includes('updated') || text.includes('disclosure') || text.includes('affiliate')) {
      score += 15;
    }

    // Check for security badges/certifications
    if ($('img[alt*="secure"]').length > 0 || text.includes('ssl')) {
      score += 10;
    }

    // Check for professional design (minimal broken images, good structure)
    const brokenImages = $('img:not([src])').length;
    if (brokenImages === 0 && $('header, nav, footer').length >= 2) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Find E-E-A-T issues
   */
  private findEEATIssues($: any): EEATIssue[] {
    const issues: EEATIssue[] = [];

    // Check for missing meta description
    const metaDescription = $('meta[name="description"]').attr('content');
    if (!metaDescription || metaDescription.trim().length === 0) {
      issues.push({
        category: 'trustworthiness',
        severity: 'high',
        message: 'Missing meta description',
        element: 'head',
        fix: 'Add meta description (150-160 characters) summarizing page content for search engines.'
      });
    }

    // Check for missing author
    if ($('[rel="author"]').length === 0 && $('.author').length === 0) {
      issues.push({
        category: 'expertise',
        severity: 'high',
        message: 'No author information found',
        element: 'article',
        fix: 'Add author byline with rel="author" attribute. Include author bio and credentials.'
      });
    }

    // Check for missing publication date
    if ($('time').length === 0) {
      issues.push({
        category: 'trustworthiness',
        severity: 'medium',
        message: 'No publication or update date found',
        element: 'article',
        fix: 'Add <time> element with datetime attribute showing when content was published/updated.'
      });
    }

    // Check for missing citations
    const hasCitations = $('cite, blockquote, [href*="doi.org"], [href*="ncbi"]').length > 0;
    if (!hasCitations) {
      issues.push({
        category: 'expertise',
        severity: 'medium',
        message: 'No citations or references found',
        fix: 'Add citations to authoritative sources. Use <cite> tags and link to original research.'
      });
    }

    // Check for missing contact info
    const hasContact = $('a[href^="mailto:"]').length > 0 || $('address').length > 0;
    if (!hasContact) {
      issues.push({
        category: 'trustworthiness',
        severity: 'high',
        message: 'No contact information found',
        fix: 'Add contact email, phone, or contact form. Include physical address if applicable.'
      });
    }

    // Check for thin content
    const wordCount = $('body').text().split(/\s+/).length;
    if (wordCount < 300) {
      issues.push({
        category: 'experience',
        severity: 'critical',
        message: `Thin content detected (${wordCount} words)`,
        fix: 'Expand content to at least 1000 words with detailed, valuable information.'
      });
    }

    return issues;
  }

  /**
   * Analyze structured data
   */
  private analyzeStructuredData($: any): {
    found: string[];
    missing: string[];
    issues: StructuredDataIssue[];
  } {
    const found: string[] = [];
    const missing: string[] = [];
    const issues: StructuredDataIssue[] = [];

    // Check for JSON-LD
    const scripts = $('script[type="application/ld+json"]').toArray();
    scripts.forEach((el: any) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json['@type']) {
          found.push(json['@type']);
        }
      } catch (e) {
        issues.push({
          type: 'JSON-LD',
          severity: 'error',
          message: 'Invalid JSON-LD syntax',
          fix: 'Fix JSON syntax errors in structured data'
        });
      }
    });

    // Recommended schema types
    const recommended = ['Article', 'Person', 'Organization', 'BreadcrumbList'];
    recommended.forEach(type => {
      if (!found.includes(type)) {
        missing.push(type);
      }
    });

    // Check for missing required fields
    if (found.includes('Article')) {
      const articleSchema = scripts.find((el: any) => {
        try {
          const json = JSON.parse($(el).html() || '{}');
          return json['@type'] === 'Article';
        } catch {
          return false;
        }
      });

      if (articleSchema) {
        const json = JSON.parse($(articleSchema).html() || '{}');
        if (!json.author) {
          issues.push({
            type: 'Article',
            severity: 'warning',
            message: 'Article schema missing author',
            fix: 'Add "author" field to Article schema'
          });
        }
        if (!json.datePublished) {
          issues.push({
            type: 'Article',
            severity: 'warning',
            message: 'Article schema missing datePublished',
            fix: 'Add "datePublished" field to Article schema'
          });
        }
      }
    }

    return { found, missing, issues };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(score: EEATScore, issues: EEATIssue[]): string[] {
    const recommendations: string[] = [];

    if (score.experience < 60) {
      recommendations.push('Add first-person experiences, case studies, and specific examples');
      recommendations.push('Include images, screenshots, or videos showing real results');
    }

    if (score.expertise < 60) {
      recommendations.push('Add author bio with credentials and expertise');
      recommendations.push('Include citations to authoritative sources');
      recommendations.push('Add technical depth and detailed explanations');
    }

    if (score.authoritativeness < 60) {
      recommendations.push('Add Organization or Person schema markup');
      recommendations.push('Create detailed About and Contact pages');
      recommendations.push('Link to authoritative external sources');
    }

    if (score.trustworthiness < 60) {
      recommendations.push('Add publication/update dates to all content');
      recommendations.push('Include privacy policy and terms of service');
      recommendations.push('Add clear contact information');
    }

    return recommendations;
  }

  /**
   * Calculate Answer Engine Optimization readiness
   */
  private calculateAEOReadiness($: any, score: EEATScore): {
    chatgpt: number;
    perplexity: number;
    googleAI: number;
  } {
    const text = $('body').text();
    const hasStructuredContent = $('h2, h3').length >= 3;
    const hasClearAnswers = text.includes('?') && text.includes(':');
    const hasLists = $('ul, ol').length > 0;

    // ChatGPT prefers conversational, clear content
    let chatgpt = score.overall * 0.6;
    if (hasClearAnswers) chatgpt += 20;
    if (hasLists) chatgpt += 20;

    // Perplexity values citations and sources
    let perplexity = score.expertise * 0.7;
    const hasCitations = $('cite, blockquote').length > 0;
    if (hasCitations) perplexity += 30;

    // Google AI Overviews value E-E-A-T highly
    let googleAI = score.overall * 0.8;
    if (hasStructuredContent) googleAI += 20;

    return {
      chatgpt: Math.min(Math.round(chatgpt), 100),
      perplexity: Math.min(Math.round(perplexity), 100),
      googleAI: Math.min(Math.round(googleAI), 100)
    };
  }
}
