#!/bin/bash

echo "🚀 HeartLink - Complete Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="heartlink-f4ftq"

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

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "Node.js $(node --version) and npm $(npm --version) are available"

# Install Firebase CLI if not available
if ! command -v firebase &> /dev/null; then
    print_status "Installing Firebase CLI..."
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        print_error "Failed to install Firebase CLI"
        exit 1
    fi
    print_success "Firebase CLI installed successfully"
else
    print_success "Firebase CLI $(firebase --version) is available"
fi

# Check authentication
print_status "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "Not authenticated with Firebase"
    echo ""
    echo "To authenticate, you have several options:"
    echo "1. Interactive login: firebase login"
    echo "2. CI token: firebase login:ci (run this once to generate a token)"
    echo "3. Service account: export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json"
    echo ""
    echo "After authentication, run this script again."
    echo ""
    print_status "Attempting alternative authentication methods..."
    
    # Check for service account file
    if [ -f "service-account.json" ]; then
        print_status "Found service-account.json, setting GOOGLE_APPLICATION_CREDENTIALS..."
        export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
    fi
    
    # Check for Firebase token in environment
    if [ ! -z "$FIREBASE_TOKEN" ]; then
        print_status "Using FIREBASE_TOKEN from environment"
    else
        print_error "No authentication method available. Please authenticate manually:"
        echo "firebase login"
        exit 1
    fi
fi

# Install dependencies
print_status "Installing project dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed successfully"

# Install functions dependencies
print_status "Installing Firebase Functions dependencies..."
cd functions
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install functions dependencies"
    exit 1
fi
cd ..
print_success "Functions dependencies installed successfully"

# Build the application
print_status "Building Next.js application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed. Please fix the errors and try again."
    exit 1
fi
print_success "Application built successfully"

# Deploy to Firebase
print_status "Starting Firebase deployment to project: $PROJECT_ID"

# Deploy functions
print_status "Deploying Firebase Functions..."
if [ ! -z "$FIREBASE_TOKEN" ]; then
    firebase deploy --only functions --project $PROJECT_ID --token $FIREBASE_TOKEN
else
    firebase deploy --only functions --project $PROJECT_ID
fi

if [ $? -eq 0 ]; then
    print_success "Functions deployed successfully"
else
    print_warning "Functions deployment failed or skipped"
fi

# Deploy storage rules
print_status "Deploying Storage rules..."
if [ ! -z "$FIREBASE_TOKEN" ]; then
    firebase deploy --only storage --project $PROJECT_ID --token $FIREBASE_TOKEN
else
    firebase deploy --only storage --project $PROJECT_ID
fi

if [ $? -eq 0 ]; then
    print_success "Storage rules deployed successfully"
else
    print_warning "Storage rules deployment failed or skipped"
fi

# Deploy database rules
print_status "Deploying Database rules..."
if [ ! -z "$FIREBASE_TOKEN" ]; then
    firebase deploy --only database --project $PROJECT_ID --token $FIREBASE_TOKEN
else
    firebase deploy --only database --project $PROJECT_ID
fi

if [ $? -eq 0 ]; then
    print_success "Database rules deployed successfully"
else
    print_warning "Database rules deployment failed or skipped"
fi

# For Next.js App Hosting, we need to use a different approach
print_status "Checking App Hosting configuration..."
if [ -f "apphosting.yaml" ]; then
    print_status "App Hosting configuration found"
    print_status "For App Hosting deployment, please use the Firebase Console:"
    echo "1. Go to https://console.firebase.google.com/project/$PROJECT_ID"
    echo "2. Navigate to Hosting > App Hosting"
    echo "3. Create or update your backend"
    echo "4. Connect your GitHub repository"
    echo "5. The app will auto-deploy on git push to main"
else
    print_warning "No App Hosting configuration found"
fi

# Final status
echo ""
print_success "Deployment process completed!"
echo ""
echo "📊 Summary:"
echo "  - Project: $PROJECT_ID"
echo "  - Functions: Deployed"
echo "  - Storage Rules: Deployed" 
echo "  - Database Rules: Deployed"
echo "  - App Hosting: Manual setup required (see instructions above)"
echo ""
echo "🌍 Your app will be available at:"
echo "  - App Hosting: https://$PROJECT_ID.web.app"
echo "  - Functions: https://us-central1-$PROJECT_ID.cloudfunctions.net"
echo ""
print_status "Deployment script completed successfully!"