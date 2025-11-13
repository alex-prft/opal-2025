# OSA Documentation Validation Guide

This guide provides automated and manual validation procedures to ensure OSA documentation integrity, accuracy, and alignment with the live system.

## 🎯 Purpose

Maintain documentation quality through systematic validation of:
- Link integrity across all documents
- API endpoint functionality and alignment
- Environment variable accuracy
- Code reference validity
- Production system consistency

---

## 🔍 Validation Categories

### 1. Link Validation

#### Internal Link Checks
Validate all internal documentation links:

```bash
# Check for broken internal links
find docs/ -name "*.md" -exec grep -l "\[.*\](.*\.md)" {} \; | while read file; do
    echo "Checking links in: $file"
    grep -oE "\[.*\]\([^)]+\.md\)" "$file" | while read link; do
        target=$(echo "$link" | sed 's/.*(\([^)]*\)).*/\1/')
        if [ ! -f "docs/$target" ]; then
            echo "❌ Broken link in $file: $target"
        else
            echo "✅ Valid link: $target"
        fi
    done
done
```

#### External URL Validation
Check external links for accessibility:

```bash
# Validate external URLs (requires curl)
find docs/ -name "*.md" -exec grep -oE "https?://[^)]+" {} \; | sort -u | while read url; do
    if curl -s --head "$url" | head -n 1 | grep -q "200 OK"; then
        echo "✅ $url - Accessible"
    else
        echo "❌ $url - Not accessible"
    fi
done
```

#### Production System Links
Validate OSA production system URLs:

```bash
# Test key OSA endpoints
declare -a endpoints=(
    "https://opal-2025.vercel.app"
    "https://opal-2025.vercel.app/engine/admin"
    "https://opal-2025.vercel.app/docs"
    "https://opal-2025.vercel.app/engine/admin/opal-monitoring"
    "https://opal-2025.vercel.app/engine/results/"
)

for url in "${endpoints[@]}"; do
    if curl -s --head "$url" | head -n 1 | grep -qE "(200|302)"; then
        echo "✅ $url - Accessible"
    else
        echo "❌ $url - Not accessible"
    fi
done
```

### 2. API Endpoint Verification

#### Local Development Endpoints
Validate API endpoints against local development server:

```bash
# Start local server first: npm run dev
# Then validate key API endpoints

declare -a api_endpoints=(
    "/api/opal/health"
    "/api/opal/discovery"
    "/api/opal/enhanced-tools"
    "/api/diagnostics/last-webhook"
    "/api/webhook-events/stream"
)

for endpoint in "${api_endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
    if [ "$response" -eq 200 ] || [ "$response" -eq 404 ]; then
        echo "✅ $endpoint - Endpoint exists (HTTP $response)"
    else
        echo "❌ $endpoint - Issue detected (HTTP $response)"
    fi
done
```

#### API Documentation Consistency
Verify API endpoints documented in README match actual implementation:

```bash
# Extract API endpoints from documentation
grep -r "\/api\/" docs/*.md | grep -oE "\/api\/[^)\s]+" | sort -u > /tmp/documented_apis.txt

# Extract API endpoints from codebase
find src/app/api -name "route.ts" | sed 's|src/app||' | sed 's|/route.ts||' | sort -u > /tmp/actual_apis.txt

echo "=== API Endpoint Comparison ==="
echo "Documented but not implemented:"
comm -23 /tmp/documented_apis.txt /tmp/actual_apis.txt

echo ""
echo "Implemented but not documented:"
comm -13 /tmp/documented_apis.txt /tmp/actual_apis.txt

echo ""
echo "Correctly documented and implemented:"
comm -12 /tmp/documented_apis.txt /tmp/actual_apis.txt | wc -l
echo "endpoints match"
```

### 3. Environment Variable Validation

#### Required Environment Variables
Validate documented environment variables:

```bash
# Check for required environment variables in documentation
declare -a required_vars=(
    "OPAL_API_BASE"
    "OPAL_API_KEY"
    "OPAL_WORKSPACE_ID"
    "OSA_WEBHOOK_SHARED_SECRET"
    "OPAL_WEBHOOK_URL"
    "BASE_URL"
    "NEXT_PUBLIC_API_URL"
)

echo "=== Environment Variable Validation ==="
for var in "${required_vars[@]}"; do
    if grep -r "$var" docs/*.md > /dev/null; then
        echo "✅ $var - Documented"
        if [ ! -z "${!var}" ]; then
            echo "   ✅ Set in current environment"
        else
            echo "   ⚠️  Not set in current environment"
        fi
    else
        echo "❌ $var - Not documented"
    fi
done
```

#### Environment Configuration Files
Validate configuration file references:

```bash
# Check file path references in documentation
declare -a config_files=(
    "src/lib/config/opal-env.ts"
    "src/lib/security/hmac.ts"
    ".env.local"
    ".env.example"
)

echo "=== Configuration File Validation ==="
for file in "${config_files[@]}"; do
    if grep -r "$file" docs/*.md > /dev/null; then
        echo "✅ $file - Referenced in documentation"
        if [ -f "$file" ]; then
            echo "   ✅ File exists"
        else
            echo "   ❌ File not found"
        fi
    else
        echo "⚠️  $file - Not referenced in documentation"
    fi
done
```

### 4. Code Reference Validation

#### File Path and Line Number Checks
Validate specific code references with line numbers:

```bash
# Extract file:line references from documentation
grep -r "\.ts:[0-9]" docs/*.md | while IFS=: read -r doc_file line_num file_path line_ref; do
    file_name=$(echo "$file_path" | cut -d: -f1)
    referenced_line=$(echo "$line_ref" | cut -d: -f1)

    if [ -f "$file_name" ]; then
        total_lines=$(wc -l < "$file_name")
        if [ "$referenced_line" -le "$total_lines" ]; then
            echo "✅ $file_name:$referenced_line - Valid reference"
        else
            echo "❌ $file_name:$referenced_line - Line number exceeds file length ($total_lines)"
        fi
    else
        echo "❌ $file_name - File not found"
    fi
done
```

#### Import and Module Validation
Check if documented imports exist:

```bash
# Validate TypeScript/JavaScript imports mentioned in documentation
grep -r "import.*from" docs/*.md | grep -oE "'[^']+'" | sort -u | while read module; do
    module_clean=$(echo "$module" | tr -d "'")
    if [ -f "$module_clean" ] || [ -d "node_modules/$module_clean" ]; then
        echo "✅ $module_clean - Module exists"
    else
        echo "❌ $module_clean - Module not found"
    fi
done
```

---

## 🔄 Automated Validation Scripts

### Daily Validation Script
Create `scripts/validate-docs.sh`:

```bash
#!/bin/bash
# OSA Documentation Daily Validation Script

echo "🔍 OSA Documentation Validation - $(date)"
echo "=================================================="

# 1. Link validation
echo "1. Validating internal links..."
npm run validate:links 2>/dev/null || echo "⚠️  Link validator not configured"

# 2. API endpoint check
echo ""
echo "2. Checking API endpoints..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
    echo "✅ Local server running on port 3000"
    # Run API validation
else
    echo "⚠️  Local server not running - skipping API validation"
fi

# 3. File reference validation
echo ""
echo "3. Validating file references..."
find docs/ -name "*.md" -exec grep -l "src/" {} \; | wc -l
echo "documents contain code references"

# 4. Environment variable check
echo ""
echo "4. Environment variable validation..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
else
    echo "⚠️  .env.local not found"
fi

echo ""
echo "📋 Validation complete - $(date)"
```

### Weekly Deep Validation
Create `scripts/validate-docs-deep.sh`:

```bash
#!/bin/bash
# OSA Documentation Weekly Deep Validation

echo "🔍 OSA Documentation Deep Validation - $(date)"
echo "====================================================="

# 1. Comprehensive link checking
echo "1. Deep link validation..."
# Implementation for comprehensive link checking

# 2. Production system validation
echo "2. Production system validation..."
# Test all production URLs

# 3. Documentation completeness check
echo "3. Documentation completeness..."
# Check for missing documentation

# 4. Cross-reference validation
echo "4. Cross-reference validation..."
# Validate all internal cross-references

echo ""
echo "📊 Deep validation complete - $(date)"
```

---

## 📊 Validation Metrics

### Key Performance Indicators
Track these metrics monthly:

- **Link Health**: Percentage of working links (Target: >98%)
- **API Coverage**: API endpoints documented vs. implemented (Target: 100%)
- **File Reference Accuracy**: Valid file paths and line numbers (Target: >95%)
- **Environment Variable Coverage**: Required variables documented (Target: 100%)
- **Cross-Reference Integrity**: Working internal links (Target: 100%)

### Validation Dashboard
Monitor validation status:

```bash
# Generate validation report
echo "OSA Documentation Health Report - $(date)"
echo "========================================="
echo ""

# Calculate metrics
total_links=$(grep -r "\[.*\](" docs/*.md | wc -l)
echo "📊 Total Links: $total_links"

total_apis=$(find src/app/api -name "route.ts" | wc -l)
echo "📊 Total API Endpoints: $total_apis"

total_files=$(find docs/ -name "*.md" | wc -l)
echo "📊 Total Documentation Files: $total_files"

echo ""
echo "🎯 Health Targets:"
echo "   Link Health: >98%"
echo "   API Coverage: 100%"
echo "   File References: >95%"
echo "   Environment Variables: 100%"
```

---

## 🚨 Error Resolution

### Common Validation Issues

#### 1. Broken Internal Links
**Issue**: Link points to non-existent file
**Resolution**:
```bash
# Fix broken link
# Change: [Guide](missing-file.md)
# To: [Guide](existing-file.md)
```

#### 2. Outdated API References
**Issue**: Documented API endpoint doesn't exist
**Resolution**:
1. Check if endpoint was moved or renamed
2. Update documentation with correct endpoint
3. Add redirect if necessary

#### 3. Invalid Line Number References
**Issue**: Code reference points to wrong line
**Resolution**:
1. Find correct line number in current codebase
2. Update documentation with accurate reference
3. Consider using function/class names instead of line numbers for stability

#### 4. Missing Environment Variables
**Issue**: Required variable not documented
**Resolution**:
1. Add variable to quick-start.md
2. Include in .env.example
3. Document purpose and format requirements

### Validation Workflow Integration

#### Pre-Commit Hooks
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Validate documentation before commit
echo "Validating documentation..."
if ! scripts/validate-docs.sh; then
    echo "❌ Documentation validation failed"
    exit 1
fi
echo "✅ Documentation validation passed"
```

#### CI/CD Integration
Add to GitHub Actions workflow:
```yaml
name: Documentation Validation
on: [push, pull_request]
jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Documentation
        run: |
          chmod +x scripts/validate-docs.sh
          ./scripts/validate-docs.sh
```

---

## 📅 Validation Schedule

### Daily (Automated)
- Link integrity checks
- Basic API endpoint validation
- Environment variable presence check

### Weekly (Manual + Automated)
- Deep link validation including external URLs
- API endpoint functionality testing
- File reference accuracy check
- Cross-reference validation

### Monthly (Manual Review)
- Complete documentation audit
- Production system alignment check
- Metrics analysis and reporting
- Documentation improvement planning

### Quarterly (Comprehensive Review)
- Full system validation
- Documentation architecture review
- User feedback integration
- Process improvement updates

---

**Validation Guide Version**: 1.0
**Last Updated**: November 12, 2024
**Next Review**: December 12, 2024
**Validation Schedule**: Daily automated, Weekly deep validation, Monthly audit