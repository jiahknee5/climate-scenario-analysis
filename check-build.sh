#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Running comprehensive build checks..."
echo "========================================"

# 1. Clean previous builds
echo -e "\n${YELLOW}1. Cleaning previous builds...${NC}"
rm -rf .next
rm -rf out

# 2. Install dependencies (like Vercel does)
echo -e "\n${YELLOW}2. Installing dependencies...${NC}"
npm ci || npm install

# 3. Run TypeScript type checking
echo -e "\n${YELLOW}3. Running TypeScript type check...${NC}"
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript type checking failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript check passed${NC}"

# 4. Run ESLint
echo -e "\n${YELLOW}4. Running ESLint...${NC}"
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ESLint check failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ESLint check passed${NC}"

# 5. Run the full Next.js build (like Vercel)
echo -e "\n${YELLOW}5. Running Next.js production build...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build succeeded${NC}"

# 6. Check bundle size
echo -e "\n${YELLOW}6. Checking bundle sizes...${NC}"
# Next.js already shows this in the build output

echo -e "\n${GREEN}🎉 All checks passed! Ready to deploy.${NC}"