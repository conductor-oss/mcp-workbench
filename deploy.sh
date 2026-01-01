#!/bin/bash

# MCP Workbench Local Deploy Script
# This script builds the project locally and deploys the 'dist' folder to AWS Amplify.

set -e

# Configuration
APP_ID=${AWS_AMPLIFY_APP_ID}
BRANCH_NAME="main"
REGION=${AWS_REGION:-"us-east-1"}

# Check for required tools
if ! command -v aws &> /dev/null; then
    echo "Error: aws-cli is not installed."
    exit 1
fi

if ! command -v zip &> /dev/null; then
    echo "Error: zip utility is not installed."
    exit 1
fi

if [ -z "$APP_ID" ]; then
    echo "Error: AWS_AMPLIFY_APP_ID environment variable is not set."
    echo "Usage: AWS_AMPLIFY_APP_ID=your_app_id ./deploy.sh"
    exit 1
fi

echo "--- 🛠 Building Project ---"
npm run add-license
npm run build

echo "--- 📦 Packaging Artifacts ---"
cd dist
zip -r ../deployment.zip .
cd ..

echo "--- 🚀 Deploying to AWS Amplify ($APP_ID) ---"
aws amplify start-deployment \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --zip-file fileb://deployment.zip \
    --region "$REGION"

echo "--- 🧹 Cleaning up ---"
rm deployment.zip

echo "--- ✅ Deployment Started! ---"
echo "Check the progress in the AWS Console: https://$REGION.console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/"
