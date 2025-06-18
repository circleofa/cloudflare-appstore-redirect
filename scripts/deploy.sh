#!/bin/bash

# Cloudflare Worker Deployment Script
# This script helps deploy the app store redirect worker with proper environment setup

set -e  # Exit on any error

echo "🚀 Cloudflare App Store Redirect Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
print_status "Checking Wrangler authentication..."
if ! wrangler whoami &> /dev/null; then
    print_error "You are not logged in to Wrangler. Please run:"
    echo "wrangler login"
    exit 1
fi

print_success "Wrangler authentication verified"

# Check for required environment variables
print_status "Checking environment variables..."

missing_vars=()

# Check if secrets are set (this will fail silently if not set)
if ! wrangler secret list 2>/dev/null | grep -q "FALLBACK"; then
    missing_vars+=("FALLBACK")
fi

if ! wrangler secret list 2>/dev/null | grep -q "APPSTORE_URL"; then
    print_warning "APPSTORE_URL not set - iOS users will fall back to FALLBACK URL"
fi

if ! wrangler secret list 2>/dev/null | grep -q "PLAYSTORE_URL"; then
    print_warning "PLAYSTORE_URL not set - Android users will fall back to FALLBACK URL"
fi

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables: ${missing_vars[*]}"
    echo ""
    echo "Please set them using:"
    for var in "${missing_vars[@]}"; do
        echo "wrangler secret put $var"
    done
    echo ""
    echo "Example values:"
    echo "FALLBACK: https://yourwebsite.com"
    echo "APPSTORE_URL: https://apps.apple.com/app/yourapp/id123456789"
    echo "PLAYSTORE_URL: https://play.google.com/store/apps/details?id=com.yourapp"
    exit 1
fi

# Run type checking
print_status "Running type check..."
if ! npm run type-check; then
    print_error "Type check failed. Please fix TypeScript errors before deploying."
    exit 1
fi

print_success "Type check passed"

# Run tests
print_status "Running tests..."
if ! npm test; then
    print_error "Tests failed. Please fix failing tests before deploying."
    exit 1
fi

print_success "All tests passed"

# Ask for confirmation
echo ""
print_status "Ready to deploy. This will:"
echo "  • Deploy the worker to Cloudflare"
echo "  • Make it available at your worker URL"
echo "  • Use environment variables set as secrets"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 0
fi

# Deploy
print_status "Deploying to Cloudflare..."
if wrangler deploy; then
    print_success "Deployment successful!"
    echo ""
    echo "🎉 Your app store redirect worker is now live!"
    echo ""
    echo "Next steps:"
    echo "1. Test your worker with different User-Agent headers"
    echo "2. Set up a custom domain (optional)"
    echo "3. Monitor logs in the Cloudflare dashboard"
    echo ""
    echo "Test URLs with different User-Agents:"
    echo "• iOS: curl -H 'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' [YOUR_WORKER_URL]"
    echo "• Android: curl -H 'User-Agent: Mozilla/5.0 (Linux; Android 13)' [YOUR_WORKER_URL]"
    echo "• Desktop: curl -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)' [YOUR_WORKER_URL]"
else
    print_error "Deployment failed!"
    exit 1
fi
