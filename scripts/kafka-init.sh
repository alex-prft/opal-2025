#!/bin/bash

# OPAL Event-Driven Architecture Initialization Script
# This script initializes the complete Kafka ecosystem for OPAL → OSA integration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
SCHEMA_REGISTRY_URL="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"
KAFKA_BOOTSTRAP_SERVERS="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}"

echo -e "${BLUE}🚀 Initializing OPAL Event-Driven Architecture${NC}"
echo "================================="

# Function to check if service is ready
check_service() {
    local service_name="$1"
    local check_command="$2"
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if eval "$check_command" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Start Docker services
echo -e "${BLUE}📦 Starting Docker services...${NC}"
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo -e "${RED}❌ docker-compose.yml not found at $DOCKER_COMPOSE_FILE${NC}"
    exit 1
fi

docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

# Wait for services to be ready
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check Zookeeper
check_service "Zookeeper" "echo ruok | nc localhost 2181 | grep imok"

# Check Kafka
check_service "Kafka" "kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS --list"

# Check Redis
check_service "Redis" "redis-cli ping | grep PONG"

# Check Schema Registry
check_service "Schema Registry" "curl -s $SCHEMA_REGISTRY_URL/subjects"

echo -e "${GREEN}✅ All services are running${NC}"

# Initialize Kafka topics
echo -e "${BLUE}📋 Creating Kafka topics...${NC}"
node -e "
const { getTopicManager } = require('./dist/lib/kafka/topic-manager.js');

async function initTopics() {
    try {
        const manager = getTopicManager();
        await manager.initializeOpalTopics();
        console.log('✅ Topics initialized successfully');
    } catch (error) {
        console.error('❌ Topic initialization failed:', error);
        process.exit(1);
    }
}

initTopics();
" || {
    echo -e "${YELLOW}⚠️ Topic creation via Node.js failed, trying manual creation...${NC}"

    # Fallback to manual topic creation
    TOPICS=(
        "opal.workflow.started:6:1"
        "opal.agent.completed:6:1"
        "opal.workflow.completed:6:1"
        "opal.knowledge.upserted:3:1"
        "opal.decision.generated:6:1"
        "opal.decision.degraded:3:1"
        "opal.user.preferences.updated:3:1"
        "opal.events.dlq:3:1"
    )

    for topic_def in "${TOPICS[@]}"; do
        IFS=':' read -r topic_name partitions replication <<< "$topic_def"

        echo "Creating topic: $topic_name"
        kafka-topics --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" \
            --create \
            --topic "$topic_name" \
            --partitions "$partitions" \
            --replication-factor "$replication" \
            --if-not-exists \
            --config cleanup.policy=delete \
            --config retention.ms=604800000 \
            --config compression.type=snappy
    done
}

# Initialize Schema Registry
echo -e "${BLUE}📝 Initializing Schema Registry...${NC}"
node -e "
const { getSchemaRegistryManager } = require('./dist/lib/schema-registry/manager.js');

async function initSchemas() {
    try {
        const manager = getSchemaRegistryManager();
        await manager.initializeOpalSchemas();
        console.log('✅ Schemas initialized successfully');
    } catch (error) {
        console.error('❌ Schema initialization failed:', error);
        console.log('📋 Continuing without schema registry initialization...');
    }
}

initSchemas();
"

# Verify setup
echo -e "${BLUE}🔍 Verifying setup...${NC}"

# Check topics
echo "📋 Kafka Topics:"
kafka-topics --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --list | grep -E "^opal\." || echo "No OPAL topics found"

# Check Schema Registry subjects
echo "📝 Schema Registry Subjects:"
curl -s "$SCHEMA_REGISTRY_URL/subjects" | jq -r '.[]' 2>/dev/null | grep -E "opal\." || echo "No OPAL subjects found"

# Display service URLs
echo -e "${GREEN}🎉 OPAL Event-Driven Architecture initialized successfully!${NC}"
echo ""
echo "🔗 Service URLs:"
echo "  Kafka UI:         http://localhost:8080"
echo "  Schema Registry:  $SCHEMA_REGISTRY_URL"
echo "  Redis:            localhost:6379"
echo "  Kafka Brokers:    $KAFKA_BOOTSTRAP_SERVERS"
echo ""
echo "📋 Next steps:"
echo "  1. Start your OPAL application: npm run dev"
echo "  2. Test event publishing: npm run kafka:test-producer"
echo "  3. Monitor with Kafka UI: http://localhost:8080"
echo ""
echo "🛠️ Useful commands:"
echo "  - View logs: docker-compose logs -f [service]"
echo "  - Stop services: docker-compose down"
echo "  - Reset data: docker-compose down -v && docker-compose up -d"