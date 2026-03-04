// Neo4j Initialization Script
// This script sets up constraints and indexes for the Knowledge Graph.

// Wait for Neo4j to be fully ready before running these commands in production.
// For Docker compose, this can be run via cypher-shell or APOC.

// Create constraints to ensure uniqueness
CREATE CONSTRAINT api_id IF NOT EXISTS FOR (a:API) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT zone_id IF NOT EXISTS FOR (z:Zone) REQUIRE z.id IS UNIQUE;
CREATE CONSTRAINT integration_id IF NOT EXISTS FOR (i:Integration) REQUIRE i.id IS UNIQUE;

// Create indexes for faster lookups
CREATE INDEX api_category IF NOT EXISTS FOR (a:API) ON (a.category);
CREATE INDEX api_status IF NOT EXISTS FOR (a:API) ON (a.status);

// Example of creating relationships (this will be done by the Rust backend dynamically)
// MATCH (a:API {id: 'api_1'}), (b:API {id: 'api_2'}) CREATE (a)-[:DEPENDS_ON]->(b);

RETURN "Neo4j initialization complete. Constraints and indexes created." AS Status;
