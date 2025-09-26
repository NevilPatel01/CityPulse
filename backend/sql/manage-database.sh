#!/bin/bash

# CityPulse Database Management Script
# This script provides commands to manage the database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5433"
DB_USER="user"
DB_NAME="citypulse_dev"

echo -e "${BLUE}🗄️  CityPulse Database Management${NC}"
echo "=================================="

# Function to check if database is running
check_database() {
    echo -e "${YELLOW}🔍 Checking database connection...${NC}"
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Database is not running${NC}"
        echo "Please start the database with: docker-compose up postgres"
        return 1
    fi
}

# Function to initialize database
init_database() {
    echo -e "${YELLOW}🚀 Initializing database...${NC}"
    
    if ! check_database; then
        exit 1
    fi
    
    echo -e "${YELLOW}📋 Creating database if it doesn't exist...${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists"
    
    echo -e "${YELLOW}🏗️  Running database schema...${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./backend/sql/schema.sql
    
    echo -e "${GREEN}✅ Database initialization completed!${NC}"
}


# Function to reset database
reset_database() {
    echo -e "${RED}⚠️  WARNING: This will delete all data in the database!${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Dropping database...${NC}"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        
        echo -e "${YELLOW}📋 Creating fresh database...${NC}"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
        
        echo -e "${YELLOW}🏗️  Running database schema...${NC}"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./backend/sql/schema.sql
        
        echo -e "${GREEN}✅ Database reset completed!${NC}"
    else
        echo -e "${YELLOW}❌ Database reset cancelled${NC}"
    fi
}

# Function to check database status
check_status() {
    echo -e "${YELLOW}🔍 Checking database status...${NC}"
    
    if ! check_database; then
        exit 1
    fi
    
    echo -e "${YELLOW}📊 Database Statistics:${NC}"
    
    # Table count
    TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "   Tables: $TABLE_COUNT"
    
    # User count
    USER_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    echo "   Users: $USER_COUNT"
    
    # Achievement count
    ACHIEVEMENT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM achievements;" 2>/dev/null || echo "0")
    echo "   Achievements: $ACHIEVEMENT_COUNT"
    
    # Interest categories count
    INTEREST_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM interest_categories;" 2>/dev/null || echo "0")
    echo "   Interest Categories: $INTEREST_COUNT"
    
    # Recommendation categories count
    RECOMMENDATION_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM recommendation_categories;" 2>/dev/null || echo "0")
    echo "   Recommendation Categories: $RECOMMENDATION_COUNT"
    
    echo -e "${GREEN}✅ Database status check completed!${NC}"
}

# Function to show help
show_help() {
    echo -e "${BLUE}CityPulse Database Management${NC}"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  init     - Initialize the database (create tables and initial data)"
    echo "  reset    - Reset the database (delete all data and recreate)"
    echo "  status   - Check database status and statistics"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 init     # Initialize database"
    echo "  $0 reset    # Reset database (WARNING: deletes all data)"
    echo "  $0 status   # Check database status"
}

# Main script logic
case "${1:-help}" in
    init)
        init_database
        ;;
    reset)
        reset_database
        ;;
    status)
        check_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
