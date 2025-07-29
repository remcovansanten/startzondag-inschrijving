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

PROD_DB="postgres://19a91092569789773f3a33c429af4ec70eee7a6cbf162e6e2d7a0cfb28ea7c48:sk_gQM2SpF0LwfKZ77AS87sy@db.prisma.io:5432/?sslmode=require"

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
PROD_ADMIN_PASSWORD="usYfk*nJy3zfDiW__WU-"

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
add_secret "DEV_JWT_SECRET" "dev-jwt-secret-zX9mK3nP5qR8tV2wY6bC4fH7jL0"
add_secret "TEST_JWT_SECRET" "test-jwt-secret-aB3dE5gH7jK9mN2pQ4sT6vW8xZ1"
add_secret "STAGING_JWT_SECRET" "staging-jwt-secret-cD4fG6hJ8kL0nP2qS5uV7wX9yB3"
add_secret "PROD_JWT_SECRET" "IGoXeYj3rpHFRIFavJD6xX4xjltc028fbhCwGzI7dd0="

# Email API Keys (using same key for all environments)
add_secret "DEV_RESEND_API_KEY" "re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"
add_secret "TEST_RESEND_API_KEY" "re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"
add_secret "STAGING_RESEND_API_KEY" "re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"
add_secret "PROD_RESEND_API_KEY" "re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ"

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