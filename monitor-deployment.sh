#!/bin/bash

# Monitor deployment status
echo "🔍 Monitoring deployment status..."

echo "📊 Server Status:"
ssh root@206.189.65.221 "
echo '=== Docker Containers ==='
docker ps -a
echo ''
echo '=== Deployment Files ==='
ls -la /opt/citypulse
echo ''
echo '=== Docker Images ==='
docker images | head -10
echo ''
echo '=== System Resources ==='
df -h /
echo ''
echo '=== Recent Logs ==='
journalctl --since '5 minutes ago' | grep -i docker | tail -10
"

echo ""
echo "🌐 Testing Domain:"
echo "HTTP Status:"
curl -I http://city-pulse.app/health 2>/dev/null || echo "❌ HTTP connection failed"

echo ""
echo "DNS Resolution:"
nslookup city-pulse.app

echo ""
echo "📋 Summary:"
echo "✅ Check GitHub Actions: https://github.com/Steve-at-Mohawk-College/capstone-project-NevilPatel01/actions"
echo "✅ Expected fixes:"
echo "   - No nginx module errors"  
echo "   - No .env parsing errors"
echo "   - Clean deployment with root user"