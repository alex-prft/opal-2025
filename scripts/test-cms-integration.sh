#!/bin/bash

# Test script for Optimizely CMS 12 PaaS integration
# Validates that the content recommendations APIs work with both CMS and fallback content

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🧪 Testing Optimizely CMS 12 PaaS Integration for OSA Content Recommendations Tools"
echo ""

# Test 1: Content Recommendations by Topic
echo "🔍 Testing: Content Recommendations by Topic"
response1=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "${BASE_URL}/api/tools/contentrecs/by-topic" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "seasonal_produce",
    "audience": "paid_members",
    "limit": 5,
    "content_format": "all"
  }')

http_code1=$(echo "$response1" | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
response_body1=$(echo "$response1" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$http_code1" -eq 200 ]; then
    echo "✅ Content Recommendations by Topic: PASS ($http_code1)"
    recs_count=$(echo "$response_body1" | jq -r '.recommendations | length' 2>/dev/null || echo "0")
    echo "   📄 Recommendations: $recs_count"
else
    echo "❌ Content Recommendations by Topic: FAIL ($http_code1)"
    echo "   Error: $(echo "$response_body1" | jq -r '.error // .message' 2>/dev/null || echo 'Unknown error')"
fi
echo ""

# Test 2: Content Recommendations by Section
echo "🔍 Testing: Content Recommendations by Section"
response2=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "${BASE_URL}/api/tools/contentrecs/by-section" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "member_portal",
    "audience": "paid_members",
    "limit": 3,
    "personalization_level": "moderate"
  }')

http_code2=$(echo "$response2" | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
response_body2=$(echo "$response2" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$http_code2" -eq 200 ]; then
    echo "✅ Content Recommendations by Section: PASS ($http_code2)"
    recs_count2=$(echo "$response_body2" | jq -r '.recommendations | length' 2>/dev/null || echo "0")
    echo "   📄 Recommendations: $recs_count2"
else
    echo "❌ Content Recommendations by Section: FAIL ($http_code2)"
    echo "   Error: $(echo "$response_body2" | jq -r '.error // .message' 2>/dev/null || echo 'Unknown error')"
fi
echo ""

# Test 3: Content Catalog Retrieval
echo "🔍 Testing: Content Catalog Retrieval"
response3=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X GET "${BASE_URL}/api/tools/contentrecs/catalog?catalog_type=both&include_metadata=true&audience_filter=paid_members")

http_code3=$(echo "$response3" | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
response_body3=$(echo "$response3" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$http_code3" -eq 200 ]; then
    echo "✅ Content Catalog Retrieval: PASS ($http_code3)"
    topics_count=$(echo "$response_body3" | jq -r '.topics | length' 2>/dev/null || echo "0")
    sections_count=$(echo "$response_body3" | jq -r '.sections | length' 2>/dev/null || echo "0")
    echo "   🏷️ Topics: $topics_count"
    echo "   🏗️ Sections: $sections_count"
else
    echo "❌ Content Catalog Retrieval: FAIL ($http_code3)"
    echo "   Error: $(echo "$response_body3" | jq -r '.error // .message' 2>/dev/null || echo 'Unknown error')"
fi
echo ""

# Test 4: Tier-based Content Data Generation
echo "🔍 Testing: Tier-based Content Data Generation"
response4=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "${BASE_URL}/api/tools/contentrecs/tier-data" \
  -H "Content-Type: application/json" \
  -d '{
    "content_recommendations": [
      {
        "title": "Test Content Item",
        "topics": ["seasonal_produce"],
        "sections": ["resource_center"],
        "confidence_score": 0.85,
        "audience": "Paid Members"
      }
    ],
    "tier_configuration": {
      "tier1_summary": true,
      "tier2_kpis": true,
      "tier3_detailed": true
    }
  }')

http_code4=$(echo "$response4" | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
response_body4=$(echo "$response4" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$http_code4" -eq 200 ]; then
    echo "✅ Tier-based Content Data Generation: PASS ($http_code4)"
    echo "   📊 Tier structure generated successfully"
else
    echo "❌ Tier-based Content Data Generation: FAIL ($http_code4)"
    echo "   Error: $(echo "$response_body4" | jq -r '.error // .message' 2>/dev/null || echo 'Unknown error')"
fi
echo ""

# Test 5: Cache Refresh
echo "🔍 Testing: Cache Refresh"
response5=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "${BASE_URL}/api/tools/contentrecs/cache-refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "cache_scope": "topics",
    "force_refresh": false,
    "cache_duration": "1_hour"
  }')

http_code5=$(echo "$response5" | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
response_body5=$(echo "$response5" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$http_code5" -eq 200 ]; then
    echo "✅ Cache Refresh: PASS ($http_code5)"
    cache_scope=$(echo "$response_body5" | jq -r '.cache_refreshed' 2>/dev/null || echo "unknown")
    echo "   🔄 Cache refreshed: $cache_scope"
else
    echo "❌ Cache Refresh: FAIL ($http_code5)"
    echo "   Error: $(echo "$response_body5" | jq -r '.error // .message' 2>/dev/null || echo 'Unknown error')"
fi
echo ""

# Summary
echo "📋 Test Summary:"
passed=0
total=5

[ "$http_code1" -eq 200 ] && ((passed++))
[ "$http_code2" -eq 200 ] && ((passed++))
[ "$http_code3" -eq 200 ] && ((passed++))
[ "$http_code4" -eq 200 ] && ((passed++))
[ "$http_code5" -eq 200 ] && ((passed++))

failed=$((total - passed))

echo "   ✅ Passed: $passed/$total"
echo "   ❌ Failed: $failed/$total"
echo ""

echo "🔗 CMS Integration Status:"
if [ -n "$CMS_PAAS_API_KEY" ] && [ "$CMS_PAAS_API_KEY" != "your_cms_api_key_here" ]; then
    echo "   CMS Configuration: ✅ Configured"
    echo "   Content Source: Optimizely CMS 12 PaaS"
else
    echo "   CMS Configuration: ⚠️ Using Fallback"
    echo "   Content Source: Enhanced IFPA Fallback"
fi
echo ""

if [ "$passed" -eq "$total" ]; then
    echo "🎉 All tests passed! CMS integration is working correctly."
    exit 0
else
    echo "⚠️ Some tests failed. Check the configuration and try again."
    exit 1
fi