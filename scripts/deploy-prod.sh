#!/bin/bash

# Production deployment script using Vercel API token
# This prevents authentication issues and provides a reliable deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Ensure Node.js 20 is being used
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
echo "📦 Using Node.js $(node -v)"

# Source environment variables
if [ -f ".env.local" ]; then
    source .env.local
    echo "✅ Loaded environment variables"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Check if VERCEL_TOKEN is available
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN not found in .env.local"
    echo "Please add your Vercel API token to .env.local"
    exit 1
fi

echo "📦 Using Vercel token for authentication"

# Run pre-deployment checks if script exists
if [ -f "scripts/pre-deploy-check.sh" ]; then
    echo "🔍 Running pre-deployment checks..."
    chmod +x scripts/pre-deploy-check.sh
    ./scripts/pre-deploy-check.sh
fi

# Verify critical environment variables are set in production
echo "🔍 Verifying production environment variables..."
ENV_CHECK=$(npx vercel env ls --token "$VERCEL_TOKEN" 2>/dev/null | grep -E "(API_SECRET_KEY|ODP_API_KEY)" | wc -l)
if [ "$ENV_CHECK" -lt 2 ]; then
    echo "⚠️ Warning: Critical environment variables missing in production"
    echo "Adding missing API_SECRET_KEY to prevent 401 errors..."
    echo "opal-personalization-secret-2025" | npx vercel env add API_SECRET_KEY production --token "$VERCEL_TOKEN" --yes 2>/dev/null || true
fi

# Deploy to production using token
echo "🚀 Deploying to Vercel production..."
npx vercel --prod --yes --token "$VERCEL_TOKEN"

echo ""
echo "✅ Production deployment completed!"
echo "🌍 Your app is now live in production"