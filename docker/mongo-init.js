// MongoDB Initialization Script
// This script runs when the MongoDB container starts for the first time.

db = db.getSiblingDB('itt_orchestrator');

// Create collections
db.createCollection('api_registry');
db.createCollection('zones');
db.createCollection('mdm_rules');
db.createCollection('integrations');
db.createCollection('embeddings');

// Create indexes for efficient querying
db.api_registry.createIndex({ "id": 1 }, { unique: true });
db.api_registry.createIndex({ "category": 1 });
db.api_registry.createIndex({ "status": 1 });

db.zones.createIndex({ "id": 1 }, { unique: true });
db.mdm_rules.createIndex({ "id": 1 }, { unique: true });

// For embeddings (if using MongoDB as a vector store fallback)
// Note: MongoDB Community Edition supports standard indexes.
// Atlas supports vector search, but for community, we just store the vectors.
db.embeddings.createIndex({ "id": 1 }, { unique: true });

print("MongoDB initialization complete. Collections and indexes created.");
