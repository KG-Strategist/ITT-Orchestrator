# ITT-Orchestrator v1.0.0 Release Notes

We are thrilled to announce the official v1.0.0 open-source release of the ITT-Orchestrator! This release represents a massive architectural milestone, transforming our intent-to-task routing system into a fully decentralized, secure, and production-ready enterprise gateway.

## Key Features in v1.0.0

### The Adaptive Gateway Fabric (AGF) & Zero Trust Architecture
- Decentralized runtime utilizing **4 Virtual Trust Zones** to separate legacy integrations, internal microservices, and autonomous agents.
- **Sovereign Edge Agents**: Ultra-lightweight Rust agents (<5MB RAM, <10ms startup) acting as execution proxies. We've laid the structural foundations for eBPF kernel-level interception and local hardware acceleration (GPU/NPU).
- **Secure Execution Sandbox**: Untrusted Model Context Protocol (MCP) tools are seamlessly isolated in WASM instances. Advanced integration with Trusted Execution Environments (TEE) enables cryptographic attestation via AWS Nitro Enclaves and Intel SGX explicitly inside the open-source implementation.

### The Agentic Gateway (SEAG) & Semantic Firewall
- Pre-execution intent validation blocks jailbreaks and prompt injections.
- Inline DPDP-compliant PII tokenization sanitizes all AI-bound data inside the pipeline footprint, producing continuous `RealTimeTrustScore` logs.

### Project Aurora Federated Learning
- Embedded frameworks securely propagate model learnings from the edge using Homomorphic Encryption (HE) and Local Differential Privacy (LDP), keeping tenant data strictly on-premises while the network improves natively.

### Standalone `agent-socket-rs` SDK (New!)
- The proprietary heartbeat and intent logic has been completely decoupled from the orchestrator.
- Developers can now integrate via `cargo add agent-socket-rs` directly into their IoT and AI architectures.
- Includes adaptive **DirectMode** (Stateful WebSocket) and **RelayMode** (Serverless wrappers), plus a robust Polyglot Plugin trait supporting MCP, MQ, and raw TCP transcoding.

### Production-Ready Deployments
- Upgraded the default Docker Compose manifest to orchestrate MongoDB, Neo4j, Jaeger, OpenTelemetry Collector, Vite Frontend, and the Rust Control Plane via a unified MELT stack.
- Kubernetes Helm charts are available inside the `/deploy` directory for frictionless scaling.

*This project remains 100% open-source under the Apache 2.0 License.*
