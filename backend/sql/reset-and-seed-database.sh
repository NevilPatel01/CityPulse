#!/bin/bash

# CityPulse Database Reset and Schema Application Script
# This script drops the database, recreates it, and runs the schema

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection parameters (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-user}"
DB_NAME="${DB_NAME:-citypulse_dev}"

echo -e "${BLUE}🗄️  CityPulse Database Reset${NC}"
echo "=================================="
echo -e "Host: ${YELLOW}$DB_HOST:$DB_PORT${NC}"
echo -e "User: ${YELLOW}$DB_USER${NC}"
echo -e "Database: ${YELLOW}$DB_NAME${NC}"
echo ""

# Function to check if database is running
check_database() {
    echo -e "${YELLOW}🔍 Checking database connection...${NC}"
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Database is not running${NC}"
        echo "Please start the database with: docker-compose -f docker-compose.dev.yml up postgres"
        return 1
    fi
}

# Main reset function
reset_database() {
    if ! check_database; then
        exit 1
    fi
    
    echo -e "${YELLOW}🗑️  Dropping database (if exists)...${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || echo "Database drop completed"
    
    echo -e "${YELLOW}📋 Creating fresh database...${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" || {
        echo -e "${RED}❌ Failed to create database${NC}"
        exit 1
    }
    
    echo -e "${YELLOW}🏗️  Running database schema...${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./backend/sql/schema.sql || {
        echo -e "${RED}❌ Failed to run schema${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Database reset and schema applied successfully!${NC}"
    echo -e "${BLUE}💡 Database is ready. You can now create recommendations manually through the application.${NC}"
}

# Run the reset
reset_database

