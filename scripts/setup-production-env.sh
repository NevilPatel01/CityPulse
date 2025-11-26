#!/bin/bash

###############################################################################
# Production Environment Setup for CityPulse
# For domains: city-pulse.app (frontend) and api.city-pulse.app (backend)
###############################################################################

set -e

echo "================================================"
echo "🚀 CityPulse Production Environment Setup"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get current directory
CURRENT_DIR="$(pwd)"

# Try to detect project structure
if [ -d "backend" ] && [ -d "frontend" ]; then
    PROJECT_ROOT="$CURRENT_DIR"
elif [ -f "package.json" ] && [ -d "../frontend" ]; then
    PROJECT_ROOT="$(dirname "$CURRENT_DIR")"
else
    read -p "Enter full path to your project root: " PROJECT_ROOT
fi

if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌ Directory not found: $PROJECT_ROOT${NC}"
    exit 1
fi

echo "📍 Project root: $PROJECT_ROOT"
echo ""

# Check if backend and frontend directories exist
if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo -e "${RED}❌ Backend directory not found at $PROJECT_ROOT/backend${NC}"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/frontend" ]; then
    echo -e "${RED}❌ Frontend directory not found at $PROJECT_ROOT/frontend${NC}"
    exit 1
fi

#------------------------------------------------------------------------------
# Step 1: Create backend/.env
#------------------------------------------------------------------------------
echo "1️⃣ Creating backend/.env..."
cd "$PROJECT_ROOT/backend"

# Backup existing .env if it exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}   Backing up existing .env to .env.backup...${NC}"
    cp .env .env.backup
fi

# Create new .env
cat > .env << 'EOF'
# API Configuration
API_BASE_URL=https://api.city-pulse.app
BACKEND_URL=https://api.city-pulse.app
PORT=5001

# Frontend URL for CORS
FRONTEND_URL=https://city-pulse.app

# Environment
NODE_ENV=production
EOF

# Copy other variables from root .env if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "   Copying additional variables from root .env..."
    # Copy database, JWT, and email variables
    grep -E "^(DB_|JWT_|EMAIL_|SMTP_)" "$PROJECT_ROOT/.env" >> .env 2>/dev/null || true
fi

echo -e "${GREEN}   ✓ Backend .env created at: $PROJECT_ROOT/backend/.env${NC}"
echo ""

#------------------------------------------------------------------------------
# Step 2: Create uploads directory
#------------------------------------------------------------------------------
echo "2️⃣ Setting up uploads directory..."
cd "$PROJECT_ROOT/backend"

if [ ! -d "uploads" ]; then
    mkdir -p uploads
    echo -e "${GREEN}   ✓ Created uploads directory${NC}"
else
    echo -e "${GREEN}   ✓ Uploads directory already exists${NC}"
fi

chmod 755 uploads
echo "   Set permissions to 755"

# Set ownership (try to detect current user)
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" != "root" ]; then
    chown -R $CURRENT_USER:$CURRENT_USER uploads 2>/dev/null || true
fi

echo -e "${GREEN}   ✓ Uploads directory configured${NC}"
echo ""

#------------------------------------------------------------------------------
# Step 3: Create frontend/.env
#------------------------------------------------------------------------------
echo "3️⃣ Creating frontend/.env..."
cd "$PROJECT_ROOT/frontend"

# Backup existing .env if it exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}   Backing up existing .env to .env.backup...${NC}"
    cp .env .env.backup
fi

cat > .env << 'EOF'
VITE_API_URL=https://api.city-pulse.app
EOF

echo -e "${GREEN}   ✓ Frontend .env created at: $PROJECT_ROOT/frontend/.env${NC}"
echo ""

#------------------------------------------------------------------------------
# Step 4: Rebuild frontend
#------------------------------------------------------------------------------
echo "4️⃣ Rebuilding frontend with production API URL..."
cd "$PROJECT_ROOT/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

echo "   Building frontend..."
VITE_API_URL=https://api.city-pulse.app npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ Frontend built successfully${NC}"
else
    echo -e "${RED}   ❌ Frontend build failed${NC}"
fi
echo ""

#------------------------------------------------------------------------------
# Step 5: Restart backend
#------------------------------------------------------------------------------
echo "5️⃣ Restarting backend service..."
cd "$PROJECT_ROOT/backend"

# Try different restart methods
if command -v pm2 &> /dev/null; then
    echo "   Using PM2..."
    pm2 restart backend 2>/dev/null || pm2 restart all 2>/dev/null || pm2 start npm --name "backend" -- start
    pm2 save
    echo -e "${GREEN}   ✓ Backend restarted with PM2${NC}"
elif systemctl list-units --type=service | grep -q "citypulse"; then
    echo "   Using systemctl..."
    sudo systemctl restart citypulse-backend
    echo -e "${GREEN}   ✓ Backend restarted with systemctl${NC}"
else
    echo -e "${YELLOW}   ⚠ Could not detect process manager${NC}"
    echo "   Please restart your backend manually:"
    echo "   • If using PM2: pm2 restart backend"
    echo "   • If using systemd: sudo systemctl restart your-service"
    echo "   • If running directly: npm start"
fi
echo ""

#------------------------------------------------------------------------------
# Step 6: Test setup
#------------------------------------------------------------------------------
echo "6️⃣ Testing configuration..."
cd "$PROJECT_ROOT/backend"

# Create test file
echo "test-$(date +%s)" > uploads/test-setup.txt
echo "   Created test file: uploads/test-setup.txt"

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 3

# Test local access
echo "   Testing local file serving..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/uploads/test-setup.txt 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✓ Backend serving files locally (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}   ⚠ Local test returned HTTP $HTTP_CODE${NC}"
    echo "   This is okay if you're using nginx as a reverse proxy"
fi

# Clean up test file
rm -f uploads/test-setup.txt

echo ""

#------------------------------------------------------------------------------
# Step 7: Display summary
#------------------------------------------------------------------------------
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""

echo "📋 Configuration Summary:"
echo ""
echo "Backend:"
echo "  • .env location: $PROJECT_ROOT/backend/.env"
echo "  • API URL: https://api.city-pulse.app"
echo "  • Uploads: $PROJECT_ROOT/backend/uploads/"
echo ""
echo "Frontend:"
echo "  • .env location: $PROJECT_ROOT/frontend/.env"
echo "  • API URL: https://api.city-pulse.app"
echo "  • Build output: $PROJECT_ROOT/frontend/dist/"
echo ""

echo "📋 Next Steps:"
echo ""
echo "1. Verify backend is running:"
echo "   pm2 list"
echo "   # or"
echo "   ps aux | grep node"
echo ""
echo "2. Check backend logs:"
echo "   pm2 logs backend --lines 30"
echo ""
echo "3. Test uploads locally:"
echo "   curl http://localhost:5001/uploads/test.txt"
echo ""
echo "4. Test uploads via domain:"
echo "   curl https://api.city-pulse.app/uploads/test.txt"
echo ""
echo "5. If using nginx, ensure it's configured to proxy /uploads"
echo "   See: $PROJECT_ROOT/docs/PRODUCTION_ENV_SETUP.md"
echo ""
echo "6. Deploy frontend build files:"
echo "   sudo cp -r $PROJECT_ROOT/frontend/dist/* /var/www/citypulse/"
echo ""
echo "7. Try uploading an image from the frontend"
echo ""

echo "🔍 Troubleshooting:"
echo ""
echo "If images still don't load:"
echo "  • Check: cat $PROJECT_ROOT/backend/.env"
echo "  • Check logs: pm2 logs backend"
echo "  • Test API: curl https://api.city-pulse.app/api/health"
echo "  • Check nginx: sudo nginx -t && sudo systemctl reload nginx"
echo ""

echo "📚 Full documentation: $PROJECT_ROOT/docs/PRODUCTION_ENV_SETUP.md"
echo ""

