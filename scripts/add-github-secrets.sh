#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you add all required secrets to your GitHub repository

echo "GitHub Secrets Setup for OTAP Pipeline"
echo "======================================"
echo ""
echo "This script will help you add all required secrets to your GitHub repository."
echo "Make sure you have the GitHub CLI installed and authenticated."
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ You are not authenticated with GitHub CLI."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Repository name
REPO="remcovansanten/startzondag-inschrijving"

echo "Adding secrets to repository: $REPO"
echo ""

# Function to add secret
add_secret() {
    local name=$1
    local value=$2
    echo -n "Adding $name... "
    echo "$value" | gh secret set "$name" --repo="$REPO"
    echo "✅"
}

echo "Step 1: Vercel Secrets"
echo "====================="
echo "Please provide the following values:"
echo ""

read -p "VERCEL_TOKEN (from https://vercel.com/account/tokens): " VERCEL_TOKEN
read -p "VERCEL_ORG_ID (starts with team_): " VERCEL_ORG_ID
read -p "VERCEL_PROJECT_ID (starts with prj_): " VERCEL_PROJECT_ID

echo ""
echo "Step 2: Database Configuration"
echo "============================="
echo "Do you want to use the same production database for all environments?"
read -p "(not recommended for production) [y/N]: " USE_SAME_DB

# Database URL should be provided by user
read -p "PROD_DATABASE_URL: " PROD_DB

if [[ "$USE_SAME_DB" =~ ^[Yy]$ ]]; then
    DEV_DATABASE_URL="$PROD_DB"
    TEST_DATABASE_URL="$PROD_DB"
    STAGING_DATABASE_URL="$PROD_DB"
    PROD_DATABASE_URL="$PROD_DB"
else
    echo ""
    echo "Using production database for production environment:"
    echo "$PROD_DB"
    echo ""
    echo "Please provide separate database URLs for other environments:"
    read -p "DEV_DATABASE_URL: " DEV_DATABASE_URL
    read -p "TEST_DATABASE_URL: " TEST_DATABASE_URL
    read -p "STAGING_DATABASE_URL: " STAGING_DATABASE_URL
    PROD_DATABASE_URL="$PROD_DB"
fi

echo ""
echo "Step 3: Using Admin Credentials from .env.local"
echo "=============================================="
echo "Using existing production credentials:"
echo "Username: admin"
PROD_ADMIN_USERNAME="admin"
read -s -p "PROD_ADMIN_PASSWORD: " PROD_ADMIN_PASSWORD
echo ""

echo ""
echo "Step 4: Adding all secrets to GitHub"
echo "===================================="
echo ""

# Vercel secrets
add_secret "VERCEL_TOKEN" "$VERCEL_TOKEN"
add_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID"
add_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID"

# Database URLs
add_secret "DEV_DATABASE_URL" "$DEV_DATABASE_URL"
add_secret "TEST_DATABASE_URL" "$TEST_DATABASE_URL"
add_secret "STAGING_DATABASE_URL" "$STAGING_DATABASE_URL"
add_secret "PROD_DATABASE_URL" "$PROD_DATABASE_URL"

# JWT Secrets
echo ""
echo "Generating secure JWT secrets..."
DEV_JWT_SECRET=$(openssl rand -base64 32)
TEST_JWT_SECRET=$(openssl rand -base64 32)
STAGING_JWT_SECRET=$(openssl rand -base64 32)
read -p "PROD_JWT_SECRET (or press Enter to generate): " PROD_JWT_SECRET
if [ -z "$PROD_JWT_SECRET" ]; then
    PROD_JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated: $PROD_JWT_SECRET"
fi

add_secret "DEV_JWT_SECRET" "$DEV_JWT_SECRET"
add_secret "TEST_JWT_SECRET" "$TEST_JWT_SECRET"
add_secret "STAGING_JWT_SECRET" "$STAGING_JWT_SECRET"
add_secret "PROD_JWT_SECRET" "$PROD_JWT_SECRET"

# Email API Keys
echo ""
echo "Step 5: Resend API Keys"
echo "======================"
read -p "RESEND_API_KEY (will be used for all environments): " RESEND_API_KEY

add_secret "DEV_RESEND_API_KEY" "$RESEND_API_KEY"
add_secret "TEST_RESEND_API_KEY" "$RESEND_API_KEY"
add_secret "STAGING_RESEND_API_KEY" "$RESEND_API_KEY"
add_secret "PROD_RESEND_API_KEY" "$RESEND_API_KEY"

# Admin credentials
add_secret "DEV_ADMIN_USERNAME" "admin"
add_secret "DEV_ADMIN_PASSWORD" "dev-password-123"
add_secret "TEST_ADMIN_USERNAME" "admin"
add_secret "TEST_ADMIN_PASSWORD" "test-password-123"
add_secret "STAGING_ADMIN_USERNAME" "admin"
add_secret "STAGING_ADMIN_PASSWORD" "staging-password-123"
add_secret "PROD_ADMIN_USERNAME" "$PROD_ADMIN_USERNAME"
add_secret "PROD_ADMIN_PASSWORD" "$PROD_ADMIN_PASSWORD"

echo ""
echo "✅ All secrets have been added to GitHub!"
echo ""
echo "You can verify them at:"
echo "https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "The OTAP pipeline should now be fully operational!"
echo ""
echo "Next steps:"
echo "1. Make a small change to the develop branch"
echo "2. Push to GitHub"
echo "3. Watch the Actions tab for the automated deployment"
echo ""