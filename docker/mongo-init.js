// Initialize MongoDB collections and indexes
db = db.getSiblingDB('itt_orchestrator');

// Create collections
db.createCollection('api_registry');
db.createCollection('zones');
db.createCollection('mdm_rules');
db.createCollection('integrations');
db.createCollection('audit_logs');
db.createCollection('user_sessions');
db.createCollection('compliance_records');

// Create indexes for performance
db.api_registry.createIndex({ id: 1 }, { unique: true });
db.api_registry.createIndex({ name: 1 });
db.api_registry.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

db.zones.createIndex({ id: 1 }, { unique: true });
db.zones.createIndex({ name: 1 });

db.mdm_rules.createIndex({ id: 1 }, { unique: true });
db.mdm_rules.createIndex({ name: 1 });

db.integrations.createIndex({ id: 1 }, { unique: true });
db.integrations.createIndex({ createdAt: 1 });

db.audit_logs.createIndex({ timestamp: 1 });
db.audit_logs.createIndex({ userId: 1 });
db.audit_logs.createIndex({ action: 1 });
db.audit_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

db.user_sessions.createIndex({ sessionId: 1 }, { unique: true });
db.user_sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

db.compliance_records.createIndex({ timestamp: 1 });
db.compliance_records.createIndex({ policyName: 1 });
db.compliance_records.createIndex({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year for compliance

print('MongoDB initialization complete!');
