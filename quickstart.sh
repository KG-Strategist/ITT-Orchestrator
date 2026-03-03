#!/bin/bash
# Quick Start Setup Script for ITT-Orchestrator
set -e

echo "🚀 ITT-Orchestrator Quick Start Setup"
echo "======================================"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        echo "   $2"
        exit 1
    fi
    echo "✅ $1 found"
}

check_command "docker" "Visit: https://docs.docker.com/get-docker/"
check_command "docker-compose" "Visit: https://docs.docker.com/compose/install/"
check_command "git" "Visit: https://git-scm.com/downloads"
check_command "node" "Visit: https://nodejs.org/"
check_command "cargo" "Visit: https://www.rust-lang.org/tools/install"

echo ""
echo "🔧 Setting up environment..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -base64 32)
    MONGO_PASS=$(openssl rand -base64 24)
    NEO4J_PASS=$(openssl rand -base64 24)
    REDIS_PASS=$(openssl rand -base64 24)
    
    # Update .env with generated secrets
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|MONGO_INITDB_PASSWORD=.*|MONGO_INITDB_PASSWORD=$MONGO_PASS|" .env
    sed -i "s|NEO4J_PASSWORD=.*|NEO4J_PASSWORD=$NEO4J_PASS|" .env
    sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASS|" .env
    
    echo "✅ .env created with generated secrets"
else
    echo "✅ .env already exists"
fi

# Create logs directory
mkdir -p logs

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🐳 Starting Docker containers..."
echo "This may take a few minutes on first run..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
for i in {1..30}; do
    if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ API is ready!"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

if ! curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ API failed to start. Checking logs..."
    docker-compose logs backend
    exit 1
fi

echo ""
echo "✨ Setup complete! Services are running:"
echo ""
echo "  🌐 Frontend:       http://localhost:3000"
echo "  📡 API:            http://localhost:3001"
echo "  📊 API Health:     http://localhost:3001/health"
echo "  🗄️  MongoDB:        localhost:27017"
echo "  📈 Neo4j:          http://localhost:7474"
echo "  💾 Redis:          localhost:6379"
echo ""
echo "📝 Next steps:"
echo ""
echo "  1. Default login credentials (mock login):"
echo "     Username: admin"
echo "     Password: any password"
echo ""
echo "  2. Login and get token:"
echo "     curl -X POST http://localhost:3001/auth/login \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"username\":\"admin\",\"password\":\"test\"}'"
echo ""
echo "  3. View API documentation:"
echo "     See openapi.yml for full API spec"
echo ""
echo "  4. Useful commands:"
echo "     docker-compose logs -f backend    # Watch logs"
echo "     docker-compose ps                 # Check services"
echo "     docker-compose down               # Stop all services"
echo ""
echo "📖 Documentation:"
echo "   - Deployment: ./DEPLOYMENT.md"
echo "   - Architecture: ./ARCHITECTURE.md"
echo "   - Production Checklist: ./PRODUCTION_CHECKLIST.md"
echo ""
echo "Happy coding! 🎉"
