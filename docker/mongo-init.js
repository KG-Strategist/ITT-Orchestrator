// MongoDB Initialization Script
// This script runs when the MongoDB container starts for the first time.

db = db.getSiblingDB('itt_orchestrator');

// Create collections
db.createCollection('api_registry');
db.createCollection('zones');
db.createCollection('mdm_rules');
db.createCollection('integrations');
db.createCollection('embeddings');
db.createCollection('users');
db.createCollection('tenants');
db.createCollection('roles');

// Clean database starts without any admin users so the /setup endpoint unlocks

// Create indexes for efficient querying
db.api_registry.createIndex({ "id": 1 }, { unique: true });
db.api_registry.createIndex({ "category": 1 });
db.api_registry.createIndex({ "status": 1 });

db.zones.createIndex({ "id": 1 }, { unique: true });
db.mdm_rules.createIndex({ "id": 1 }, { unique: true });

db.users.createIndex({ "username": 1 }, { unique: true });
db.tenants.createIndex({ "name": 1 }, { unique: true });
db.roles.createIndex({ "name": 1 }, { unique: true });

// For embeddings (if using MongoDB as a vector store fallback)
db.embeddings.createIndex({ "id": 1 }, { unique: true });

// Attempt to create a vector search index (Atlas specific, but we add it for completeness)
try {
    db.runCommand({
        "createSearchIndexes": "embeddings",
        "indexes": [
            {
                "name": "vector_index",
                "definition": {
                    "mappings": {
                        "dynamic": true,
                        "fields": {
                            "embedding": {
                                "dimensions": 768,
                                "similarity": "cosine",
                                "type": "knnVector"
                            }
                        }
                    }
                }
            }
        ]
    });
    print("Vector search index created successfully.");
} catch (e) {
    print("Failed to create vector search index (expected on Community Edition): " + e);
}

print("MongoDB initialization complete. Collections and indexes created.");
