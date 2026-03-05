# ITT-Orchestrator: Production-Ready Enterprise Architecture

## High-Level System Architecture

The ITT-Orchestrator is a **Unified Logical Control Plane** designed for Tier-1 Banks. It decouples governance from execution, adhering strictly to the Secure Enterprise Agent Gateway (SEAG) framework, Zero Trust, ultra-low latency, and sovereign AI principles.

### Foundational Philosophies
*   **Sovereign Edge Agent (Rust Base)**: A trait-driven architecture targeting <5MB RAM footprint and <10ms startup time. Used for core orchestration and **Ultra-Lightweight Edge Insight Agents**. Now includes architecture for **eBPF kernel-level interception** and **local hardware acceleration** (GPUs/NPUs for SLMs).
*   **Secure Execution Sandbox (Rust Security)**: A "Security-first design" implementing WASM sandboxing for untrusted Model Context Protocol (MCP) tools and prompt injection defenses. Features **Trusted Execution Environment (TEE) support** allowing code to execute in hardware enclaves (AWS Nitro, Intel SGX).

---

### 1. The Identity Layer (UAM & Access Control)
*   **IdP Plugin System**: Supports standard SSO (SAML 2.0 / OIDC) for large-scale enterprise integration (e.g., Azure AD, PingIdentity).
*   **Strict RBAC & PIM/PAM**: Role-Based Access Control supporting Privileged Identity Management and Privileged Access Management workflows, dynamically configurable via the frontend.

### 2. The Control Plane (Governance & Orchestration)
Written in **Rust (Tokio)** for high-throughput, memory-safe, and predictable latency (<10ms overhead).
*   **Tiny Transformer (The Brain)**: A self-learning cognitive engine mapping intents to "Direct Actions" (<15ms, $0 cost) before defaulting to external LLMs.
*   **Semantic Firewall & DPDP Tokenizer (Secure Execution Sandbox)**: Calculates a `RealTimeTrustScore` inline to block prompt injections. **Continuous DPDP Compliance** ensures any PII entering the system is immediately tokenized and masked.
*   **Cost Arbitrage (The Conscience)**: Uses a Financial Token Bucket to track monetary spend, triggering "Graceful Degradation" if budgets are exhausted.
*   **TOON Optimizer**: Transparently compresses verbose JSON payloads into Token-Oriented Object Notation (TOON).
*   **Federated Gateway Manager (GVM)**: Translates declarative Intent Manifests (YAML) into infrastructure state via GitOps, validated by Open Policy Agent (OPA).
*   **Self-Hygiene Worker**: A background Rust process that automatically scrubs residual operational data and potential privacy leakage on a strict TTL, while retaining semantic learnings.

### 3. The Memory (Smart Corpus & Caching)
*   **Smart Vector/Graph Corpus**: Integrates Milvus (Vector DB) and Neo4j (Graph DB) to store the models' ongoing semantic learnings and enterprise context.
*   **High-Speed Caching**: A high-performance Rust-based in-memory caching layer (using `moka` or Redis) sits in front of the Smart Corpus to guarantee ultra-low latency context retrieval.

### 4. Custom Integrations & Key Vault Management
*   **Integrations Plugin System**: Supports diverse data sources (RDBMS, NoSQL, APIs) for seamless enterprise connectivity.
*   **Native Key Vault Management**: Integrates with HashiCorp Vault. Credentials are dynamically fetched and injected (The Sandwich Pattern) and never stored in plaintext.

### 5. The Data Plane (Execution) - Adaptive Gateway Fabric (AGF)
The AGF consists of 4 Virtual Trust Zones:
*   **Zone 1 (The Fortress)**: External ingress. Decryption Trust Anchor terminating TLS.
*   **Zone 2 (The Core Guard)**: Legacy integration. Sovereign Sidecar (eBPF) for Identity Injection.
*   **Zone 3 (The Velocity Mesh)**: Internal microservices. Sidecar-less ambient mesh (gRPC/TCP/ISO 8583).
*   **Zone 4 (The Cognitive Edge)**: AI Governance. Executes Sovereign Edge Agent Micro-Agents and Secure Execution Sandbox WASM Sandboxes.
*   **Ultra-Lightweight Edge Insight Agents**: <5MB binaries sitting alongside gateways/Envoy to collect telemetry, execute local policy controls, and centralize insights via the Agent Socket Protocol.
*   **Federated Learning**: Edge nodes compute localized model weight updates using Homomorphic Encryption (HE) and Local Differential Privacy (LDP).

### 6. The Frontend (Operational Control Center)
A comprehensive React-based (Vite) Operational Control Center built over the **TinyClaw** execution engine philosophy.
*   **100% SEAG Capability Coverage**: All 28 capabilities across the 8 Pillars (Spine, Immune System, Reflexes, Senses, Cortex, Motor Functions, Memory, Conscience) are accessible and configurable.
*   **Master Data Management (MDM)**: Dedicated screens for administrators to add, edit, and define attributes, objects, and master configurations without writing code.
*   **Visual DAG Canvas**: Drag-and-drop nodes for complex federated workflows.
*   **Unified Service Catalog**: Discover and drag legacy APIs directly onto the canvas.
*   **Live Simulation & MELT Observability**: Terminal console streaming the AI's "Chain of Thought" over WebSockets.
*   **FinOps & GVS Top Bar**: Real-time metrics tracking Global Gateway Variance Score (GVS), Token Budgets, and TOON Optimization Savings.

---

## Monorepo Folder Structure

```text
itt-orchestrator/
├── package.json                        # Concurrently runs Vite (3000) & Rust (3001)
├── vite.config.ts                      # Proxies /api and /v1 to Rust backend
├── src/                                # React/Vite Frontend (Operational Control Center)
│   ├── components/
│   │   ├── canvas/                     # React Flow canvas and custom nodes
│   │   │   ├── IntentNode.tsx
│   │   │   ├── MCPToolNode.tsx
│   │   │   └── FirewallNode.tsx
│   │   └── layout/                     # UI Shell, Sidebar, Toolbars
│   ├── store/                          # Zustand state for canvas and agent definitions
│   └── api/                            # Native fetch clients proxying to Rust backend
│
├── backend/                            # Rust Workspace (Control Plane)
│   ├── Cargo.toml                      # Workspace definition
│   ├── crates/
│   │   ├── itt_core/                   # Core traits: Orchestrator, IntentEngine, ExecutionPlane
│   │   ├── itt_api/                    # Ingress: gRPC, WebSockets, SSE, REST
│   │   ├── itt_intent/                 # Transformer v5 inference, RAG, Vector DB client
│   │   ├── itt_middleware/             # Semantic Firewall, Cost Arbitrage, Token Bucket
│   │   ├── itt_federation/             # OPA/Rego compiler, Data Plane sync (eBPF/Envoy)
│   │   ├── itt_memory/                 # Smart Corpus (Milvus/Neo4j) & Synthetic Seeder
│   │   └── itt_observability/          # MELT (OpenTelemetry), Audit logging
│   └── src/
│       └── main.rs                     # Entry point for the Tokio async runtime
│
├── proto/                              # Protocol Buffers for gRPC communication
│   ├── orchestrator.proto
│   └── mcp_tools.proto
│
└── ARCHITECTURE.md                     # This document
```

## Phase 3 & 3.5: API-First & Synthetic Test Harness
*   **No Mocks**: The frontend strictly relies on the Rust backend (`itt_api`) via Vite's proxy. All `setTimeout` mocks have been eradicated.
*   **Enterprise Seeder**: A `TEST_MODE` toggle pre-loads the `moka` cache with HDFC API taxonomy and Virtual Trust Zones.
*   **Synthetic MELT Telemetry**: The WebSocket handler streams binary "Chain of Thought" logs for live simulation testing.
