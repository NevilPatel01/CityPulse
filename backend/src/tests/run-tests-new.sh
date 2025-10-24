#!/bin/bash

# Test Runner Script for CityPulse Backend
# Provides easy commands to run different test suites

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CityPulse Backend Test Runner          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in Docker
if [ -f /.dockerenv ]; then
    IS_DOCKER=true
else
    IS_DOCKER=false
fi

# Function to run tests
run_tests() {
    local test_path=$1
    local description=$2
    
    echo -e "${YELLOW}Running: ${description}${NC}"
    echo ""
    
    if [ "$IS_DOCKER" = true ]; then
        npm test -- "$test_path" --verbose
    else
        docker-compose -f ../../docker-compose.dev.yml exec backend npm test -- "$test_path" --verbose
    fi
}

# Parse command line arguments
case "${1}" in
    "all")
        echo -e "${GREEN}Running all tests...${NC}"
        echo ""
        if [ "$IS_DOCKER" = true ]; then
            npm test
        else
            docker-compose -f ../../docker-compose.dev.yml exec backend npm test
        fi
        ;;
    
    "auth")
        echo -e "${GREEN}Running authentication tests...${NC}"
        echo ""
        run_tests "src/tests/auth/" "Authentication Test Suite"
        ;;
    
    "register")
        run_tests "auth-register-login" "Register, Login, Logout Tests"
        ;;
    
    "password")
        run_tests "auth-password-reset" "Password Reset Tests"
        ;;
    
    "token")
        run_tests "auth-token-management" "Token & Change Password Tests"
        ;;
    
    "google")
        run_tests "auth-google-health" "Google OAuth & Health Tests"
        ;;
    
    "profile")
        echo -e "${GREEN}Running profile tests...${NC}"
        echo ""
        run_tests "src/tests/profile/" "Profile Test Suite"
        ;;
    
    "coverage")
        echo -e "${GREEN}Running tests with coverage report...${NC}"
        echo ""
        if [ "$IS_DOCKER" = true ]; then
            npm test -- --coverage
        else
            docker-compose -f ../../docker-compose.dev.yml exec backend npm test -- --coverage
        fi
        ;;
    
    "watch")
        echo -e "${GREEN}Running tests in watch mode...${NC}"
        echo ""
        if [ "$IS_DOCKER" = true ]; then
            npm test -- --watch
        else
            docker-compose -f ../../docker-compose.dev.yml exec backend npm test -- --watch
        fi
        ;;
    
    "clean")
        echo -e "${YELLOW}Cleaning up test data...${NC}"
        echo ""
        echo "DELETE FROM users WHERE email LIKE '%test_%';" | psql $DATABASE_URL
        echo -e "${GREEN}✅ Test data cleaned${NC}"
        ;;
    
    "help"|"")
        echo -e "${BLUE}Available commands:${NC}"
        echo ""
        echo -e "  ${GREEN}./run-tests-new.sh all${NC}          - Run all tests"
        echo -e "  ${GREEN}./run-tests-new.sh auth${NC}         - Run all authentication tests"
        echo -e "  ${GREEN}./run-tests-new.sh register${NC}     - Run register/login tests"
        echo -e "  ${GREEN}./run-tests-new.sh password${NC}     - Run password reset tests"
        echo -e "  ${GREEN}./run-tests-new.sh token${NC}        - Run token management tests"
        echo -e "  ${GREEN}./run-tests-new.sh google${NC}       - Run Google OAuth tests"
        echo -e "  ${GREEN}./run-tests-new.sh profile${NC}      - Run profile tests"
        echo -e "  ${GREEN}./run-tests-new.sh coverage${NC}     - Run tests with coverage"
        echo -e "  ${GREEN}./run-tests-new.sh watch${NC}        - Run tests in watch mode"
        echo -e "  ${GREEN}./run-tests-new.sh clean${NC}        - Clean up test data"
        echo -e "  ${GREEN}./run-tests-new.sh help${NC}         - Show this help"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo -e "  chmod +x run-tests-new.sh      # Make script executable"
        echo -e "  ./run-tests-new.sh all         # Run all tests"
        echo -e "  ./run-tests-new.sh auth        # Run auth tests only"
        echo -e "  npm test                       # Alternative: run via npm"
        echo ""
        ;;
    
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        echo -e "Run ${GREEN}./run-tests-new.sh help${NC} to see available commands"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
