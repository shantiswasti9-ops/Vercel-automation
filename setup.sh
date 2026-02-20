#!/usr/bin/env bash

# GitHub Jenkins Webhook - Setup Script
# This script helps you configure the webhook application

set -e

echo "=================================================="
echo "GitHub → Jenkins Webhook Setup"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists. Using existing configuration."
    echo ""
    cat .env.local
    echo ""
    read -p "Do you want to reconfigure? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping reconfiguration. Proceeding with existing setup."
        exit 0
    fi
fi

echo "Step 1: GitHub Webhook Configuration"
echo "======================================="
echo ""
echo "You need a GitHub Webhook Secret for security."
echo "This prevents unauthorized access to the webhook endpoint."
echo ""
read -p "Enter GitHub Webhook Secret (or press Enter to generate): " GITHUB_SECRET

if [ -z "$GITHUB_SECRET" ]; then
    GITHUB_SECRET=$(openssl rand -hex 32)
    echo "Generated webhook secret: $GITHUB_SECRET"
fi

echo ""
echo "Step 2: Jenkins Configuration"
echo "=============================="
echo ""
echo "Find these values in your Jenkins instance:"
echo "- URL: typically http://localhost:8080 or https://jenkins.example.com"
echo "- User: your Jenkins username"
echo "- Token: Jenkins → Your Profile → API Token"
echo ""

read -p "Jenkins URL (default: http://localhost:8080): " JENKINS_URL
JENKINS_URL=${JENKINS_URL:-http://localhost:8080}

read -p "Jenkins Username: " JENKINS_USER

read -sp "Jenkins API Token: " JENKINS_TOKEN
echo ""

echo ""
echo "=================================================="
echo "Configuration Summary"
echo "=================================================="
echo ""
echo "GitHub Webhook Secret: ******* (${#GITHUB_SECRET} chars)"
echo "Jenkins URL: $JENKINS_URL"
echo "Jenkins User: $JENKINS_USER"
echo "Jenkins Token: ******* (${#JENKINS_TOKEN} chars)"
echo ""

read -p "Confirm and save configuration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Configuration cancelled."
    exit 1
fi

# Create .env.local
cat > .env.local << EOF
# GitHub Webhook Configuration
GITHUB_WEBHOOK_SECRET=$GITHUB_SECRET

# Jenkins Configuration
JENKINS_URL=$JENKINS_URL
JENKINS_USER=$JENKINS_USER
JENKINS_TOKEN=$JENKINS_TOKEN
EOF

echo "✅ Configuration saved to .env.local"
echo ""
echo "=================================================="
echo "Next Steps"
echo "=================================================="
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Open http://localhost:3000 in your browser"
echo ""
echo "3. Configure Jenkins jobs (see JENKINS_SETUP.md)"
echo ""
echo "4. Add GitHub webhook to your repositories:"
echo "   - URL: http://localhost:3000/api/webhooks/github"
echo "   - Secret: $GITHUB_SECRET"
echo "   - Events: Push events"
echo ""
echo "5. Deploy to Vercel (when ready):"
echo "   npm i -g vercel && vercel"
echo ""
echo "   Update Vercel environment variables with:"
echo "   - GITHUB_WEBHOOK_SECRET"
echo "   - JENKINS_URL"
echo "   - JENKINS_USER"
echo "   - JENKINS_TOKEN"
echo ""
echo "For more details, see README.md and JENKINS_SETUP.md"
echo ""
