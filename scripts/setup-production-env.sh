#!/bin/bash

# OPAL Production Environment Setup Script
# Content Population Roadmap - Phase 1: OPAL API Integration & Data Pipeline
# Creates production-ready environment configuration

echo "🚀 OPAL Production Environment Setup"
echo "===================================="
echo ""
echo "📋 Phase 1: OPAL API Integration & Data Pipeline"
echo "   Priority: CRITICAL - Production API Configuration"
echo ""

# Create production environment file
PROD_ENV_FILE=".env.production.local"

if [ -f "$PROD_ENV_FILE" ]; then
    echo "📄 Found existing $PROD_ENV_FILE"
    echo "   Creating backup..."
    cp "$PROD_ENV_FILE" "${PROD_ENV_FILE}.backup.$(date +%s)"
    echo "   ✅ Backup created: ${PROD_ENV_FILE}.backup.$(date +%s)"
else
    echo "📝 Creating new $PROD_ENV_FILE..."
    touch "$PROD_ENV_FILE"
fi

echo ""

# Function to update or add environment variable in production file
update_prod_env_var() {
    local key=$1
    local value=$2
    local file="$PROD_ENV_FILE"

    if grep -q "^${key}=" "$file"; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
        else
            # Linux
            sed -i "s|^${key}=.*|${key}=${value}|" "$file"
        fi
        echo "   ✅ Updated ${key}"
    else
        # Add new
        echo "${key}=${value}" >> "$file"
        echo "   ✅ Added ${key}"
    fi
}

# Generate secure random keys
generate_secure_key() {
    openssl rand -hex 24  # 48 characters
}

echo "🔧 Production Environment Configuration"
echo "======================================"
echo ""

# 1. Production Environment Settings
echo "1️⃣ Production Environment Settings"
echo "   Setting up production environment variables..."

update_prod_env_var "NODE_ENV" "production"
update_prod_env_var "DEFAULT_ENVIRONMENT" "production"
update_prod_env_var "BASE_URL" "https://opal-2025.vercel.app"

echo ""

# 2. OPAL API Configuration
echo "2️⃣ OPAL API Configuration"
echo "   📋 Production OPAL API Base URL"
update_prod_env_var "OPAL_API_BASE" "https://api.opal.optimizely.com"

echo ""
echo "   🔑 OPAL API Credentials (Required from OPAL Dashboard)"
echo "   ⚠️  CRITICAL: You must obtain these from your production OPAL workspace:"
echo ""

read -p "   Enter Production OPAL API KEY: " opal_api_key
if [ -n "$opal_api_key" ]; then
    update_prod_env_var "OPAL_API_KEY" "$opal_api_key"
else
    update_prod_env_var "OPAL_API_KEY" "opal_prod_api_key_placeholder"
    echo "   ⚠️  Using placeholder - UPDATE BEFORE DEPLOYMENT"
fi

read -p "   Enter Production OPAL WORKSPACE ID: " opal_workspace_id
if [ -n "$opal_workspace_id" ]; then
    update_prod_env_var "OPAL_WORKSPACE_ID" "$opal_workspace_id"
else
    update_prod_env_var "OPAL_WORKSPACE_ID" "workspace_prod_placeholder"
    echo "   ⚠️  Using placeholder - UPDATE BEFORE DEPLOYMENT"
fi

echo ""

# 3. OPAL Agent Integration
echo "3️⃣ OPAL Agent Integration"
echo "   📋 Configuring agent authentication for production use"

# Strategy Workflow Auth Key
STRATEGY_WORKFLOW_KEY=$(generate_secure_key)
update_prod_env_var "OPAL_STRATEGY_WORKFLOW_AUTH_KEY" "$STRATEGY_WORKFLOW_KEY"
echo "   🔑 Generated OPAL_STRATEGY_WORKFLOW_AUTH_KEY"

# Webhook Configuration
read -p "   Enter Production OPAL Webhook URL: " opal_webhook_url
if [ -n "$opal_webhook_url" ]; then
    update_prod_env_var "OPAL_WEBHOOK_URL" "$opal_webhook_url"
else
    update_prod_env_var "OPAL_WEBHOOK_URL" "https://webhook.opal.optimizely.com/webhooks/production_placeholder"
    echo "   ⚠️  Using placeholder webhook URL - UPDATE BEFORE DEPLOYMENT"
fi

# OSA Webhook Configuration
OSA_WEBHOOK_SECRET=$(generate_secure_key)
update_prod_env_var "OSA_WEBHOOK_SHARED_SECRET" "$OSA_WEBHOOK_SECRET"
echo "   🔑 Generated OSA_WEBHOOK_SHARED_SECRET"

# Webhook Auth Key
WEBHOOK_AUTH_KEY=$(generate_secure_key)
update_prod_env_var "OPAL_WEBHOOK_AUTH_KEY" "$WEBHOOK_AUTH_KEY"
echo "   🔑 Generated OPAL_WEBHOOK_AUTH_KEY"

echo ""

# 4. Security Configuration
echo "4️⃣ Security Configuration"
echo "   🔒 Generating production security keys..."

JWT_SECRET=$(generate_secure_key)
update_prod_env_var "JWT_SECRET" "$JWT_SECRET"
echo "   🔑 Generated JWT_SECRET"

# Additional security token
WEBHOOK_AUTH_TOKEN=$(generate_secure_key)
update_prod_env_var "OPAL_WEBHOOK_AUTH_TOKEN" "$WEBHOOK_AUTH_TOKEN"
echo "   🔑 Generated OPAL_WEBHOOK_AUTH_TOKEN"

echo ""

# 5. Production Performance Settings
echo "5️⃣ Production Performance Settings"
echo "   ⚡ Configuring production performance optimizations..."

update_prod_env_var "DEBUG" "false"
update_prod_env_var "OPAL_DEBUG_MODE" "false"
update_prod_env_var "LOG_LEVEL" "info"
update_prod_env_var "ENABLE_DEV_TOOLS" "false"
update_prod_env_var "ENABLE_DEBUG_ENDPOINTS" "false"
update_prod_env_var "DIAGNOSTICS_LIMIT_DEFAULT" "100"

echo ""

# 6. Data Storage Configuration
echo "6️⃣ Data Storage Configuration"
echo "   💾 Setting up production data storage..."

update_prod_env_var "USE_FILE_STORAGE" "false"
update_prod_env_var "FILE_STORAGE_PATH" "./data/production"

echo ""
echo "   🗄️  Database Configuration (Optional - configure if using Supabase):"
read -p "   Enter Supabase URL (or press Enter to skip): " supabase_url
if [ -n "$supabase_url" ]; then
    update_prod_env_var "SUPABASE_URL" "$supabase_url"
    read -p "   Enter Supabase Anon Key: " supabase_key
    if [ -n "$supabase_key" ]; then
        update_prod_env_var "SUPABASE_ANON_KEY" "$supabase_key"
    fi
else
    echo "   ✅ Skipped Supabase configuration (using file storage)"
fi

echo ""

# 7. Webhook Endpoints
echo "7️⃣ Production Webhook Endpoints"
echo "   🔗 Setting up production webhook URLs..."

update_prod_env_var "OSA_WEBHOOK_URL" "https://opal-2025.vercel.app/api/webhooks/opal-workflow"
update_prod_env_var "OPAL_TOOLS_DISCOVERY_URL" "https://opal-2025.vercel.app"

echo ""

# Display production configuration (masked)
echo "🎉 Production Environment Setup Complete!"
echo ""
echo "📄 Production Configuration Summary:"
echo "===================================="

# Create display version with masked sensitive data
while IFS= read -r line; do
    if [[ $line == *"="* ]]; then
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)

        # Mask sensitive values
        if [[ $key == *"KEY"* ]] || [[ $key == *"SECRET"* ]] || [[ $key == *"TOKEN"* ]]; then
            if [ ${#value} -gt 8 ]; then
                masked="${value:0:8}...${value: -4}"
            else
                masked="***"
            fi
            echo "✅ $key=$masked"
        elif [[ $key == *"URL"* ]]; then
            # Mask sensitive parts of URLs
            if [[ $value == *"placeholder"* ]]; then
                echo "⚠️  $key=$value"
            else
                masked=$(echo "$value" | sed 's|/webhooks/[^/]*/|/webhooks/***/|')
                echo "✅ $key=$masked"
            fi
        elif [[ $value == *"placeholder"* ]]; then
            echo "⚠️  $key=$value"
        else
            echo "✅ $key=$value"
        fi
    fi
done < "$PROD_ENV_FILE"

echo ""
echo "🚨 CRITICAL NEXT STEPS FOR PRODUCTION:"
echo "======================================"
echo ""
echo "1. 🔑 REPLACE PLACEHOLDER VALUES:"
echo "   • OPAL_API_KEY: Get from OPAL Dashboard > Settings > API Keys"
echo "   • OPAL_WORKSPACE_ID: Get from OPAL Dashboard > Workspace Settings"
echo "   • OPAL_WEBHOOK_URL: Get from OPAL Dashboard > Workflows > Webhook Settings"
echo ""
echo "2. 🧪 TEST CONFIGURATION:"
echo "   • Run: npm run test -- --testNamePattern=\"OPAL API Integration\""
echo "   • Test webhook endpoint: curl -X POST https://opal-2025.vercel.app/api/webhooks/opal-workflow"
echo ""
echo "3. 🚀 DEPLOYMENT:"
echo "   • Deploy to Vercel with production environment variables"
echo "   • Verify OPAL integration in production environment"
echo "   • Monitor logs for any authentication issues"
echo ""
echo "4. 📊 DATA POPULATION:"
echo "   • Phase 2: Content Strategy & Data Mapping (Week 2-3)"
echo "   • Phase 3: Real Data Integration (Week 3-4)"
echo "   • Refer to: docs/CONTENT_POPULATION_ROADMAP.md"
echo ""

# Create deployment command
echo "🔧 Deployment Commands:"
echo "======================"
echo ""
echo "# Deploy to Vercel with production environment:"
cat << 'EOF'
OPAL_API_BASE=https://api.opal.optimizely.com \
OPAL_API_KEY=[production_api_key] \
OPAL_WORKSPACE_ID=[production_workspace_id] \
OSA_WEBHOOK_SHARED_SECRET=[production_webhook_secret_32_chars_min_required] \
BASE_URL=https://opal-2025.vercel.app \
npx vercel --prod --yes
EOF

echo ""
echo "✅ Production environment configuration complete!"
echo "   File created: $PROD_ENV_FILE"
echo "   Next: Update placeholder values and deploy to production"
echo ""