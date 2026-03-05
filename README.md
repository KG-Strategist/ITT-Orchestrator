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

*   **Sovereign Edge Agent & Secure Execution Sandbox Philosophies**: Lightweight (<5MB RAM, <10ms startup) and Security-first (WASM sandboxing with TEE support, prompt injection defense).
*   **Gateway Vending Machine (GVM) & Adaptive Gateway Fabric (AGF)**: 4 Virtual Trust Zones. Declarative Intent Manifests (YAML) validated by OPA.
*   **Zone 4 Middleware**: Semantic Firewall, Cost Arbitrage, TOON Transformation, MELT Observability.
*   **Tiny Transformer & Federated Learning**: Local intent evaluation mapping to Direct Actions. Federated Learner with Homomorphic Encryption (HE) and Local Differential Privacy (LDP).
*   **Strict Enterprise API Governance**: POST only, TLSv1.3+, OAuth 2.0 Bearer, Inline Payload Scanner.
*   **React Flow Frontend**: Visual DAG builder with Custom Nodes, Service Catalog, Live Simulation Terminal, FinOps Top Bar, and Project Aurora Template.

## Quick Start with Docker Compose

Get the entire system running in seconds:

```bash
# Clone and start the stack
git clone https://github.com/anthropics/itt-orchestrator.git
cd itt-orchestrator
docker-compose up

# Wait for services to be healthy (30-45 seconds)
# Then visit:
# - Frontend UI: http://localhost:3000
# - Control Plane API: http://localhost:3001
# - Jaeger Traces: http://localhost:16686
# - Neo4j Graph DB: http://localhost:7474
# - MongoDB: mongodb://localhost:27017
```

## End-to-End Observability with OpenTelemetry & Jaeger

Phase 5 implements **real orchestration with full W3C trace context propagation**:

```bash
# 1. Start the stack
docker-compose up

# 2. From the frontend (http://localhost:3000), click "Generate Agent DAG" and simulate

# 3. Open Jaeger UI: http://localhost:16686
# 4. Select service: "itt-orchestrator-control-plane"
# 5. You'll see the complete orchestration trace chain:

AgentSocket::orchestrate_intent                    [Root Span, 50-300ms]
├─ Zone4SemanticFirewall::inspect_and_sanitize   [10-30ms, firewall decision, trust_score=98]
├─ TinyTransformer::analyze_intent                [5-10ms, intent classification]
├─ MCPToolRegistry::discover_tool                 [1-5ms, tool selection]
├─ SecureExecutionSandbox::execute_mcp_tool              [10-100ms, WASM execution with optional TEE attestation]
└─ Zone4CostArbitrage::evaluate_and_route         [5-10ms, cost evaluation, model_selected]
```

### What Each Span Represents

- **Firewall (Zone 4 Semantic Firewall)**: Analyzes incoming intent for jailbreaks, prompt injections, and semantic drift. Emits `trust_score` and `is_jailbreak` metrics.
- **Intent Analysis (TinyTransformer)**: Probabilistic intent classification (<10ms). Maps user prompt to required tools and model.
- **Tool Discovery (MCP Tool Registry)**: Centralized registry lookup for MCP tools stored in Neo4j. Returns tool metadata and WASM bytecode.
- **WASM Execution (Secure Execution Sandbox)**: Secure sandbox execution of untrusted WASM modules with 10-second timeout enforcement via epoch interruption. Optional TEE integration (AWS Nitro, Intel SGX) for cryptographic attestation.
- **Cost Arbitrage (Token Budgeting)**: Financial token bucket evaluation. Routes simple intents to cheap SLMs, complex intents to frontier LLMs based on tenant budgets.

Each span includes structured fields (trust_score, tool_name, execution_time_ms) visible in Jaeger for latency profiling and debugging.

## Execution Plan

- **Step 1**: High-level system architecture and folder structure for the monorepo. (Completed)
- **Step 2**: Core Rust traits and structs for the IntentEngine, Orchestrator, and FederatedExecutionPlane. (Completed)
- **Step 3**: Implementation of the SemanticFirewall and CostArbitrage (Token Budgeting) middleware in Rust. (Completed)
- **Step 4**: Scaffolding for the No-Code React-based Agent Builder UI. (Completed)
- **Step 5**: Day 2 Operations, Service Catalog, Live Simulation, and FinOps Top Bar. (Completed)
- **Phase 3**: API-First integration, eradicating frontend mocks, and connecting React to the Rust Control Plane. (Completed)
- **Phase 3.5**: Enterprise Seeder & Synthetic Test Harness. Pre-loading `moka` cache with HDFC API taxonomy and Virtual Trust Zones, and streaming synthetic MELT telemetry for live simulation. (Completed)
- **Phase 5**: **Final Mile - Execution, Observability & OSS Packaging** (Completed)
  - ✅ Secure Execution Sandbox (WASM): Complete epoch timeout enforcement via background `tokio::spawn` increment, with TEE attestation support (AWS Nitro, Intel SGX)
  - ✅ MCP Tool Registry: Centralized tool discovery with Neo4j persistence and WASM bytecode caching
  - ✅ Real Orchestration: Replaced hardcoded simulation with Firewall → Analysis → Tool → Execution → Cost Arbitrage
  - ✅ OpenTelemetry: W3C trace context propagation with spans emitted at each decision point
  - ✅ Jaeger Integration: Distributed tracing UI for latency profiling and debugging
  - ✅ Docker Compose: Enhanced with Jaeger + OTEL Collector services
  - ✅ Enterprise Documentation: CONTRIBUTING.md with code standards, testing strategy, release process

See `ARCHITECTURE.md` for the detailed system design and monorepo structure.
