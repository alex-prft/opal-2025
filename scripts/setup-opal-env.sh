#!/bin/bash

# OPAL Environment Setup Script
# This script helps you configure all required OPAL environment variables

echo "🔧 OPAL Environment Variable Setup"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    touch .env.local
else
    echo "📄 Found existing .env.local file"
fi

echo ""
echo "🚨 IMPORTANT: You need to get these values from your OPAL dashboard:"
echo ""

# Function to update or add environment variable
update_env_var() {
    local key=$1
    local value=$2
    local file=".env.local"

    if grep -q "^${key}=" "$file"; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/^${key}=.*/${key}=${value}/" "$file"
        else
            # Linux
            sed -i "s/^${key}=.*/${key}=${value}/" "$file"
        fi
        echo "   ✅ Updated ${key}"
    else
        # Add new
        echo "${key}=${value}" >> "$file"
        echo "   ✅ Added ${key}"
    fi
}

# 1. OPAL Webhook URL
echo "1️⃣ OPAL_WEBHOOK_URL"
echo "   📋 This should look like: https://webhook.opal.optimizely.com/webhooks/YOUR_ID/YOUR_SECRET"
echo "   🔗 Find this in: OPAL Dashboard > Workflows > strategy_workflow > Webhook Settings"
read -p "   Enter your OPAL Webhook URL: " webhook_url

if [ -n "$webhook_url" ]; then
    update_env_var "OPAL_WEBHOOK_URL" "$webhook_url"
else
    echo "   ⚠️ Skipped OPAL_WEBHOOK_URL (you can add this later)"
fi

echo ""

# 2. OPAL Strategy Workflow Auth Key
echo "2️⃣ OPAL_STRATEGY_WORKFLOW_AUTH_KEY"
echo "   📋 This is your Bearer token for authenticating with OPAL"
echo "   🔗 Find this in: OPAL Dashboard > Settings > API Keys > Workflow Keys"
echo "   ⚠️ Must be at least 32 characters long"
read -p "   Enter your OPAL Strategy Workflow Auth Key: " auth_key

if [ -n "$auth_key" ]; then
    if [ ${#auth_key} -ge 32 ]; then
        update_env_var "OPAL_STRATEGY_WORKFLOW_AUTH_KEY" "$auth_key"
    else
        echo "   ❌ Error: Auth key must be at least 32 characters long"
        echo "   ⚠️ Skipped OPAL_STRATEGY_WORKFLOW_AUTH_KEY"
    fi
else
    echo "   ⚠️ Skipped OPAL_STRATEGY_WORKFLOW_AUTH_KEY (you can add this later)"
fi

echo ""

# 3. OPAL Workspace ID
echo "3️⃣ OPAL_WORKSPACE_ID"
echo "   📋 This is your OPAL workspace identifier (UUID format)"
echo "   🔗 Find this in: OPAL Dashboard > Settings > Workspace Settings > Workspace ID"
echo "   📝 Example: 12345678-1234-1234-1234-123456789012"
read -p "   Enter your OPAL Workspace ID: " workspace_id

if [ -n "$workspace_id" ]; then
    # Basic UUID format validation
    if [[ $workspace_id =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
        update_env_var "OPAL_WORKSPACE_ID" "$workspace_id"
    else
        echo "   ⚠️ Warning: Workspace ID doesn't match UUID format, but adding anyway"
        update_env_var "OPAL_WORKSPACE_ID" "$workspace_id"
    fi
else
    echo "   ⚠️ Skipped OPAL_WORKSPACE_ID (you can add this later)"
fi

echo ""

# 4. Optional: OPAL Webhook Auth Key (for incoming webhooks)
echo "4️⃣ OPAL_WEBHOOK_AUTH_KEY (Optional)"
echo "   📋 This is for validating incoming webhooks FROM OPAL (if you receive them)"
echo "   🔗 Find this in: OPAL Dashboard > Settings > Webhook Security"
read -p "   Enter OPAL Webhook Auth Key (or press Enter to skip): " webhook_auth_key

if [ -n "$webhook_auth_key" ]; then
    update_env_var "OPAL_WEBHOOK_AUTH_KEY" "$webhook_auth_key"
else
    echo "   ✅ Skipped optional OPAL_WEBHOOK_AUTH_KEY"
fi

echo ""

# 5. Optional: Debug mode
echo "5️⃣ OPAL_DEBUG_MODE (Optional)"
echo "   📋 Enable detailed logging for debugging (true/false)"
read -p "   Enable debug mode? (y/N): " debug_choice

if [[ $debug_choice =~ ^[Yy]$ ]]; then
    update_env_var "OPAL_DEBUG_MODE" "true"
    echo "   ✅ Enabled debug mode"
else
    echo "   ✅ Debug mode disabled (default)"
fi

echo ""
echo "🎉 Environment Setup Complete!"
echo ""

# Display current .env.local (masked)
echo "📄 Current .env.local configuration:"
echo "=================================="

while IFS= read -r line; do
    if [[ $line == *"OPAL_"* ]]; then
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)

        # Mask sensitive values
        if [[ $key == *"KEY"* ]] || [[ $key == *"SECRET"* ]] || [[ $key == *"TOKEN"* ]]; then
            if [ ${#value} -gt 8 ]; then
                masked="${value:0:8}...${value: -4}"
            else
                masked="***"
            fi
            echo "$key=$masked"
        elif [[ $key == *"URL"* ]]; then
            # Mask webhook URLs
            masked=$(echo "$value" | sed 's|/webhooks/[^/]*/|/webhooks/***/|')
            echo "$key=$masked"
        else
            echo "$key=$value"
        fi
    fi
done < .env.local

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Restart your development server to load new environment variables"
echo "2. Test your configuration by running: npx tsx scripts/test-payload-builder.ts"
echo "3. Test Force Sync by visiting: http://localhost:3000/engine"
echo "4. Check logs for any remaining configuration issues"
echo ""
echo "🔗 Useful Links:"
echo "- OPAL Dashboard: https://app.opal.optimizely.com"
echo "- Strategy Workflow: Look for 'strategy_workflow' in your OPAL dashboard"
echo "- Troubleshooting Guide: docs/FORCE_SYNC_FIX.txt"
echo ""

# Generate a random 32-character key for reference
echo "🔑 Need a secure auth key? Here's a randomly generated 32-char key:"
echo "   $(openssl rand -hex 16)"
echo "   (Don't use this directly - get the real key from OPAL)"
echo ""

echo "✅ Setup complete! Your OPAL integration should now work with production webhooks."