#!/bin/bash

# 🚀 Backend Deployment Commands
# Run these commands to deploy your backend to production

echo "================================================"
echo "🚀 Trivia Game Backend Deployment"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if git remote exists
echo -e "${BLUE}Step 1: Checking Git Configuration...${NC}"
if git remote | grep -q "origin"; then
    echo -e "${GREEN}✅ Git remote already configured${NC}"
    git remote -v
else
    echo -e "${RED}❌ No git remote found${NC}"
    echo ""
    echo "Please add your GitHub repository:"
    echo ""
    echo -e "${BLUE}git remote add origin https://github.com/YOUR_USERNAME/trivia-game-backend.git${NC}"
    echo ""
    echo "Replace YOUR_USERNAME with your actual GitHub username"
    exit 1
fi

echo ""

# Step 2: Check for uncommitted changes
echo -e "${BLUE}Step 2: Checking for Uncommitted Changes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}⚠️  You have uncommitted changes:${NC}"
    git status -s
    echo ""
    echo "Commit them first:"
    echo -e "${BLUE}git add .${NC}"
    echo -e "${BLUE}git commit -m 'Your commit message'${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi

echo ""

# Step 3: Push to GitHub
echo -e "${BLUE}Step 3: Pushing to GitHub...${NC}"
echo "This will push your backend code to GitHub"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
        echo ""
        echo "================================================"
        echo "🎉 Code is on GitHub!"
        echo "================================================"
        echo ""
        echo "Next Steps:"
        echo ""
        echo "1. Go to: https://render.com"
        echo "2. Sign up (use GitHub)"
        echo "3. New → Web Service"
        echo "4. Connect your repository"
        echo "5. Configure deployment settings"
        echo "6. Add environment variables (see below)"
        echo ""
        echo "================================================"
        echo "📋 Environment Variables to Add in Render:"
        echo "================================================"
        echo ""
        echo "NODE_ENV=production"
        echo "MONGODB_URI=mongodb+srv://mohammadsalahapple_db_user:0FNGtH6SXc5ZJXyj@cluster0.avydrsi.mongodb.net/trivia-game?retryWrites=true&w=majority"
        echo "JWT_SECRET=YfF4WzRrACF6c/qTrv/9HrBvPaUsOpJcwxmsxXlnJTA="
        echo "JWT_EXPIRES_IN=7d"
        echo "ALLOWED_ORIGINS=capacitor://localhost,ionic://localhost"
        echo "INITIAL_FREE_GAMES=3"
        echo "RATE_LIMIT_MAX=100"
        echo "RATE_LIMIT_WINDOW_MS=900000"
        echo ""
        echo "================================================"
        echo "📚 Full Guide: ../DEPLOY_BACKEND_NOW.md"
        echo "================================================"
    else
        echo ""
        echo -e "${RED}❌ Failed to push to GitHub${NC}"
        echo "Check the error message above"
        exit 1
    fi
else
    echo ""
    echo "Deployment cancelled"
    exit 0
fi
