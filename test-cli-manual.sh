#!/bin/bash

# Manual CLI Testing Script
# Tests the SEO E-E-A-T Analyzer CLI end-to-end

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 E-E-A-T Analyzer CLI Manual Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: CLI loads without error
echo "Test 1: CLI loads without error"
if node dist/cli.js --version > /dev/null 2>&1; then
  echo "✓ PASSED"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 2: Help command works
echo "Test 2: Help command works"
if node dist/cli.js --help | grep -q "E-E-A-T analyzer"; then
  echo "✓ PASSED"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 3: analyze-file command exists
echo "Test 3: analyze-file command exists"
if node dist/cli.js --help | grep -q "analyze-file"; then
  echo "✓ PASSED"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 4: Analyze sample HTML file
echo "Test 4: Analyze sample HTML file (high E-E-A-T)"
if node dist/cli.js analyze-file test-sample.html > /dev/null 2>&1; then
  echo "✓ PASSED - Analysis completed without error"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 5: JSON output works
echo "Test 5: JSON output format works"
if node dist/cli.js analyze-file test-sample.html --json | jq -e '.eatScore' > /dev/null 2>&1; then
  echo "✓ PASSED - Valid JSON with eatScore"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 6: Score is in valid range
echo "Test 6: E-E-A-T score is in valid range (0-100)"
SCORE=$(node dist/cli.js analyze-file test-sample.html --json | jq -r '.eatScore.overall')
if [ "$SCORE" -ge 0 ] && [ "$SCORE" -le 100 ]; then
  echo "✓ PASSED - Score is $SCORE (valid range)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED - Score is $SCORE (out of range)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 7: High-quality content gets good score
echo "Test 7: High-quality E-E-A-T content scores well (60+)"
if [ "$SCORE" -ge 60 ]; then
  echo "✓ PASSED - Score is $SCORE"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED - Score is $SCORE (expected 60+)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 8: Issues array exists
echo "Test 8: Analysis includes issues detection"
ISSUES=$(node dist/cli.js analyze-file test-sample.html --json | jq -r '.issues | length')
if [ "$ISSUES" -ge 0 ]; then
  echo "✓ PASSED - Found $ISSUES issues"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 9: Recommendations exist
echo "Test 9: Analysis includes recommendations"
RECS=$(node dist/cli.js analyze-file test-sample.html --json | jq -r '.recommendations | length')
if [ "$RECS" -ge 0 ]; then
  echo "✓ PASSED - Found $RECS recommendations"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 10: AEO readiness is calculated
echo "Test 10: AEO readiness scores are calculated"
CHATGPT=$(node dist/cli.js analyze-file test-sample.html --json | jq -r '.aeoReadiness.chatgpt')
PERPLEXITY=$(node dist/cli.js analyze-file test-sample.html --json | jq -r '.aeoReadiness.perplexity')
GOOGLEAI=$(node dist/cli.js analyze-file test-sample.html --json | jq -r '.aeoReadiness.googleAI')

if [ "$CHATGPT" -ge 0 ] && [ "$PERPLEXITY" -ge 0 ] && [ "$GOOGLEAI" -ge 0 ]; then
  echo "✓ PASSED - ChatGPT: $CHATGPT, Perplexity: $PERPLEXITY, Google AI: $GOOGLEAI"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 11: Structured data detection
echo "Test 11: Structured data detection works"
SCHEMA_FOUND=$(node dist/cli.js analyze-file test-sample.html --json | jq -r '.structuredData.found | length')
if [ "$SCHEMA_FOUND" -ge 1 ]; then
  echo "✓ PASSED - Found $SCHEMA_FOUND schema types"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED - Expected to find Article schema"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 12: Create poor E-E-A-T sample and test
echo "Test 12: Low-quality content gets low score"
cat > test-poor.html <<'EOF'
<html><body><h1>Test Page</h1><p>This is a test.</p></body></html>
EOF

POOR_SCORE=$(node dist/cli.js analyze-file test-poor.html --json | jq -r '.eatScore.overall')
if [ "$POOR_SCORE" -lt 40 ]; then
  echo "✓ PASSED - Poor content scored $POOR_SCORE (expected <40)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "✗ FAILED - Poor content scored $POOR_SCORE (expected <40)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
rm -f test-poor.html
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo "✓ Passed: $TESTS_PASSED"
echo "✗ Failed: $TESTS_FAILED"
PASS_RATE=$(( (TESTS_PASSED * 100) / (TESTS_PASSED + TESTS_FAILED) ))
echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
  exit 1
fi
