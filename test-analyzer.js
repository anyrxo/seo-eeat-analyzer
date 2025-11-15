#!/usr/bin/env node

/**
 * Comprehensive test suite for E-E-A-T Analyzer
 * Tests all functionality to ensure it actually works
 */

import { EEATAnalyzer } from './dist/analyzers/eat-analyzer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.log(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n🧪 E-E-A-T Analyzer Test Suite\n');

// Test 1: Analyzer can be instantiated
test('Analyzer instantiation', () => {
  const analyzer = new EEATAnalyzer();
  assert(analyzer !== null, 'Analyzer should be instantiable');
});

// Test 2: Analysis returns proper structure
test('Analysis returns correct structure', () => {
  const analyzer = new EEATAnalyzer();
  const html = '<html><body><h1>Test</h1></body></html>';
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.url === 'http://test.com', 'URL should be set');
  assert(typeof result.eatScore === 'object', 'Should have eatScore object');
  assert(typeof result.eatScore.experience === 'number', 'Should have experience score');
  assert(typeof result.eatScore.expertise === 'number', 'Should have expertise score');
  assert(typeof result.eatScore.authoritativeness === 'number', 'Should have authoritativeness score');
  assert(typeof result.eatScore.trustworthiness === 'number', 'Should have trustworthiness score');
  assert(typeof result.eatScore.overall === 'number', 'Should have overall score');
  assert(Array.isArray(result.issues), 'Should have issues array');
  assert(Array.isArray(result.recommendations), 'Should have recommendations array');
  assert(typeof result.aeoReadiness === 'object', 'Should have AEO readiness');
});

// Test 3: Experience scoring detects first-person accounts
test('Experience scoring - first-person detection', () => {
  const analyzer = new EEATAnalyzer();
  const html = '<html><body><p>I tested this product for 6 months</p></body></html>';
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.eatScore.experience > 0, 'Should detect first-person experience');
});

// Test 4: Expertise scoring detects author credentials
test('Expertise scoring - author bio detection', () => {
  const analyzer = new EEATAnalyzer();
  const html = `
    <html>
      <body>
        <div class="author-bio">
          <p>Dr. John Smith is a certified expert with a PhD in Computer Science</p>
        </div>
      </body>
    </html>
  `;
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.eatScore.expertise > 30, 'Should detect author bio and credentials');
});

// Test 5: Authoritativeness scoring detects schema markup
test('Authoritativeness scoring - schema detection', () => {
  const analyzer = new EEATAnalyzer();
  const html = `
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Test Company"
        }
        </script>
      </head>
      <body><h1>Test</h1></body>
    </html>
  `;
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.eatScore.authoritativeness >= 30, 'Should detect schema markup');
});

// Test 6: Trustworthiness scoring detects HTTPS
test('Trustworthiness scoring - HTTPS detection', () => {
  const analyzer = new EEATAnalyzer();
  const html = `
    <html>
      <head>
        <link rel="canonical" href="https://secure-site.com/page" />
      </head>
      <body><h1>Test</h1></body>
    </html>
  `;
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.eatScore.trustworthiness >= 20, 'Should detect HTTPS');
});

// Test 7: Issue detection for missing author
test('Issue detection - missing author', () => {
  const analyzer = new EEATAnalyzer();
  const html = '<html><body><article><h1>Article</h1><p>Content</p></article></body></html>';
  const result = analyzer.analyze(html, 'http://test.com');

  const hasAuthorIssue = result.issues.some(issue =>
    issue.message.toLowerCase().includes('author')
  );
  assert(hasAuthorIssue, 'Should detect missing author');
});

// Test 8: Issue detection for missing meta description
test('Issue detection - missing meta description', () => {
  const analyzer = new EEATAnalyzer();
  const html = '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>';
  const result = analyzer.analyze(html, 'http://test.com');

  const hasMetaIssue = result.issues.some(issue =>
    issue.message.toLowerCase().includes('meta description')
  );
  assert(hasMetaIssue, 'Should detect missing meta description');
});

// Test 9: Structured data detection
test('Structured data detection', () => {
  const analyzer = new EEATAnalyzer();
  const html = `
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Test Article"
        }
        </script>
      </head>
      <body><h1>Test</h1></body>
    </html>
  `;
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.structuredData.found.includes('Article'), 'Should detect Article schema');
});

// Test 10: AEO readiness calculation
test('AEO readiness calculation', () => {
  const analyzer = new EEATAnalyzer();
  const html = `
    <html>
      <head>
        <meta name="description" content="Test description" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FAQPage"
        }
        </script>
      </head>
      <body>
        <article>
          <h1>Test Article</h1>
          <div class="author-bio">Dr. Expert</div>
          <p>I tested this product</p>
        </article>
      </body>
    </html>
  `;
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.aeoReadiness.chatgpt > 0, 'Should calculate ChatGPT readiness');
  assert(result.aeoReadiness.perplexity > 0, 'Should calculate Perplexity readiness');
  assert(result.aeoReadiness.googleAI > 0, 'Should calculate Google AI readiness');
});

// Test 11: Recommendations generation
test('Recommendations generation', () => {
  const analyzer = new EEATAnalyzer();
  const html = '<html><body><h1>Test</h1></body></html>';
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.recommendations.length > 0, 'Should generate recommendations for low scores');
});

// Test 12: Score boundaries (0-100)
test('Score boundaries validation', () => {
  const analyzer = new EEATAnalyzer();
  const html = '<html><body><h1>Test</h1></body></html>';
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.eatScore.experience >= 0 && result.eatScore.experience <= 100, 'Experience score should be 0-100');
  assert(result.eatScore.expertise >= 0 && result.eatScore.expertise <= 100, 'Expertise score should be 0-100');
  assert(result.eatScore.authoritativeness >= 0 && result.eatScore.authoritativeness <= 100, 'Authoritativeness score should be 0-100');
  assert(result.eatScore.trustworthiness >= 0 && result.eatScore.trustworthiness <= 100, 'Trustworthiness score should be 0-100');
  assert(result.eatScore.overall >= 0 && result.eatScore.overall <= 100, 'Overall score should be 0-100');
});

// Test 13: Complex HTML with high E-E-A-T signals
test('High E-E-A-T page analysis', async () => {
  const analyzer = new EEATAnalyzer();
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="description" content="Comprehensive guide based on 5 years of testing" />
        <link rel="canonical" href="https://example.com/guide" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@graph": [
            {
              "@type": "Person",
              "name": "Dr. Jane Expert",
              "jobTitle": "PhD, Certified Professional"
            },
            {
              "@type": "Organization",
              "name": "Expert Company"
            }
          ]
        }
        </script>
      </head>
      <body>
        <article>
          <h1>Ultimate Guide Based on Real Testing</h1>
          <div class="author-bio">
            <p>Written by Dr. Jane Expert, PhD in Computer Science with 15 years of experience</p>
            <p>Certified professional researcher</p>
          </div>
          <p>I personally tested 50+ products over 3 years. Here are my findings:</p>
          <img src="test1.jpg" alt="Test result 1" />
          <img src="test2.jpg" alt="Test result 2" />
          <img src="test3.jpg" alt="Test result 3" />
          <img src="test4.jpg" alt="Test result 4" />
          <img src="test5.jpg" alt="Test result 5" />
          <p>Based on peer-reviewed research [1], statistical analysis shows...</p>
          <p>Updated: January 2025</p>
          <a href="/about">About Us</a>
          <a href="/contact">Contact</a>
          <a href="https://linkedin.com/company/test">LinkedIn</a>
          <a href="https://twitter.com/test">Twitter</a>
          <address>contact@example.com</address>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </article>
      </body>
    </html>
  `;
  const result = analyzer.analyze(html, 'https://example.com/guide');

  assert(result.eatScore.overall >= 60, 'High E-E-A-T page should score 60+');
  assert(result.eatScore.experience >= 40, 'Should detect strong experience signals');
  assert(result.eatScore.expertise >= 40, 'Should detect strong expertise signals');
  assert(result.eatScore.authoritativeness >= 40, 'Should detect strong authoritativeness signals');
  assert(result.eatScore.trustworthiness >= 40, 'Should detect strong trustworthiness signals');
});

// Test 14: Empty HTML handling
test('Empty HTML handling', () => {
  const analyzer = new EEATAnalyzer();
  const html = '';
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.eatScore.overall >= 0, 'Should handle empty HTML gracefully');
  assert(result.issues.length > 0, 'Should report issues for empty HTML');
});

// Test 15: Malformed HTML handling
test('Malformed HTML handling', () => {
  const analyzer = new EEATAnalyzer();
  const html = '<html><body><h1>Test<p>Missing closing tags';
  const result = analyzer.analyze(html, 'http://test.com');

  assert(result.eatScore !== undefined, 'Should handle malformed HTML without crashing');
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Summary:`);
console.log(`   Total: ${testsRun}`);
console.log(`   ✓ Passed: ${testsPassed}`);
console.log(`   ✗ Failed: ${testsFailed}`);
console.log(`   Pass Rate: ${Math.round((testsPassed / testsRun) * 100)}%\n`);

if (testsFailed > 0) {
  process.exit(1);
}
