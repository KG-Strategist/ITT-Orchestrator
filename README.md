# ITT-Orchestrator: Intent-to-Task Orchestration Platform

**A Bespoke Open-Source Web-Based "Intent-to-Task Orchestration Platform"**

Large enterprises are paralyzed by the "Build vs. Buy" dilemma when managing diverse gateways, legacy systems, and autonomous AI agents. This platform solves this by decoupling the governance (Control Plane) from execution (Data Plane). It embodies the "Secure Enterprise Agent Gateway (SEAG)" framework, adhering to "Edge AI First" and "Sovereign Domain-Specific AI" principles.

## Core Directives & Capability Requirements (SEAG 28)

1. **The Spine (Infrastructure)**: Multi-protocol support (gRPC/HTTP/TCP/ISO 8583), Agentic streaming (SSE), Legacy CBS/ESB integration.
2. **The Immune System (Security)**: Zero Trust AuthN/AuthZ, Data Protection (PII masking/DPDP Act compliance), Semantic Firewalling (blocking prompt injections), Immutable Audit (Chain of Thought logging).
3. **The Reflexes (Performance)**: Token-bucket rate limiting, Latency-aware load balancing, Circuit breakers, Intelligent context-routing, and TOON (Text-Object Notation) payload compression.
4. **The Senses (Observability)**: MELT (Metrics, Events, Logs, Traces) via OpenTelemetry, Anomaly alerting, and Semantic Drift detection.
5. **The Cortex (API Mgmt)**: API versioning, Unified developer portal, Schema registry, and Semantic Registry for dynamic agent discovery.
6. **The Motor Functions (Orchestration)**: Event-driven asynchronous execution, Multi-step Sagas, Idempotency guarantees.
7. **The Memory (Data Mgmt)**: Multi-tenancy, Native Vector DB integration, Advanced analytics.
8. **The Conscience (Cost Mgmt)**: Multi-LLM Cost Arbitrage (routing simple intents to cheap SLMs, complex intents to frontier LLMs based on Token Budgets).

## Key Features Implemented

*   **ZeroClaw & IronClaw Philosophies**: Lightweight (<5MB RAM, <10ms startup) and Security-first (WASM sandboxing, prompt injection defense).
*   **Gateway Vending Machine (GVM) & Adaptive Gateway Fabric (AGF)**: 4 Virtual Trust Zones. Declarative Intent Manifests (YAML) validated by OPA.
*   **Zone 4 Middleware**: Semantic Firewall, Cost Arbitrage, TOON Transformation, MELT Observability.
*   **Tiny Transformer & Federated Learning**: Local intent evaluation mapping to Direct Actions. Federated Learner with Homomorphic Encryption (HE) and Local Differential Privacy (LDP).
*   **Strict Enterprise API Governance**: POST only, TLSv1.3+, OAuth 2.0 Bearer, Inline Payload Scanner.
*   **React Flow Frontend**: Visual DAG builder with Custom Nodes, Service Catalog, Live Simulation Terminal, FinOps Top Bar, and Project Aurora Template.

## Execution Plan

- **Step 1**: High-level system architecture and folder structure for the monorepo. (Completed)
- **Step 2**: Core Rust traits and structs for the IntentEngine, Orchestrator, and FederatedExecutionPlane. (Completed)
- **Step 3**: Implementation of the SemanticFirewall and CostArbitrage (Token Budgeting) middleware in Rust. (Completed)
- **Step 4**: Scaffolding for the No-Code React-based Agent Builder UI. (Completed)
- **Step 5**: Day 2 Operations, Service Catalog, Live Simulation, and FinOps Top Bar. (Completed)
- **Phase 3**: API-First integration, eradicating frontend mocks, and connecting React to the Rust Control Plane. (Completed)
- **Phase 3.5**: Enterprise Seeder & Synthetic Test Harness. Pre-loading `moka` cache with HDFC API taxonomy and Virtual Trust Zones, and streaming synthetic MELT telemetry for live simulation. (Completed)

See `ARCHITECTURE.md` for the detailed system design and monorepo structure.
