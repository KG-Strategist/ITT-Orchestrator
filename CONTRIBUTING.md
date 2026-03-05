# Contributing to ITT-Orchestrator

Thank you for your interest in contributing to ITT-Orchestrator! This document provides guidelines for contributing to our open-source project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in your interactions.

## Development Setup

### Prerequisites
- **Rust**: 1.75+ (install via [rustup](https://rustup.rs/))
- **Node.js**: 20+ (for frontend)
- **Docker**: For containerized testing
- **Git**: For version control

### Quick Start
```bash
# Clone the repository
git clone https://github.com/anthropics/itt-orchestrator.git
cd itt-orchestrator

# Run the complete stack
docker-compose up

# Visit:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - Jaeger UI: http://localhost:16686
```

### Local Development (Without Docker)
```bash
# Terminal 1: Start backend
cd backend
cargo run --bin itt_api

# Terminal 2: Start frontend
npm install
npm run dev
```

## Architecture Overview

ITT-Orchestrator is a production-ready "Self-Driving" Unified Logical Control Plane for AI Orchestration. Key concepts:

### Core Philosophies
- **Sovereign Edge Agent**: Ultra-lightweight (<5MB RAM, <10ms startup) agents on the edge with eBPF kernel-level interception and local hardware acceleration (GPU/NPU inference)
- **Secure Execution Sandbox**: Security-first WASM sandboxing for untrusted AI tools with Trusted Execution Environment (TEE) support for hardware attestation

### The 28 SEAG Capabilities
Organized across 8 functional pillars:
1. **The Spine**: Multi-protocol support, SSE streaming, CBS/ESB integration
2. **The Immune System**: OIDC/OAuth2, DPDP/GDPR tokenization, Semantic Firewall
3. **The Reflexes**: Latency-aware balancing, Circuit Breakers, TOON optimization
4. **The Senses (MELT)**: OpenTelemetry distributed tracing, Semantic Drift Detection
5. **The Cortex**: API Versioning, Schema Registry, Semantic API Discovery
6. **The Motor Functions**: Event-Driven Architecture, Sagas, Idempotency
7. **The Memory**: Multi-tenancy isolation, Vector/Graph DB context injection (RAG)
8. **The Conscience**: Token Budgeting, Cost Arbitrage, Graceful Degradation

For detailed architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Contribution Guidelines

### 1. New Features

When implementing a new feature:

1. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Implement with full instrumentation**:
   - Add `#[instrument]` macros to all async functions
   - Emit structured tracing events with context fields
   - Document public APIs with rustdoc

3. **Write tests**:
   - Unit tests: `backend/crates/{crate}/tests/`
   - Integration tests via docker-compose
   - E2E tests: verify traces appear in Jaeger

4. **Code Quality**:
   - Run `cargo fmt` before committing
   - Run `cargo clippy` and fix warnings
   - Zero `todo!()`, `unwrap()`, or `panic!()` in production code
   - Strict error handling: `Result<T, AppError>`
   - TypeScript: Zero `any` types

5. **Update Documentation**:
   - Update README.md if user-facing
   - Update ARCHITECTURE.md if architectural changes
   - Add release notes in CHANGELOG.md

### 2. Bug Fixes

For bug fixes:

1. **Create an issue first** to discuss the fix
2. **Create a branch** referencing the issue:
   ```bash
   git checkout -b fix/issue-123-description
   ```
3. **Add regression test** to prevent recurrence
4. **Reference issue in commit**: `Fixes #123`

### 3. Code Quality Standards

#### Rust
```rust
// All new async functions must be instrumented
#[instrument(skip(self, payload), fields(user_id = %user_id))]
async fn process_request(&self, user_id: &str, payload: &[u8]) -> Result<Vec<u8>, AppError> {
    info!("Processing request for user");
    // Implementation
}

// Emit telemetry events
info!(
    event = "intent_analyzed",
    trust_score = %score.score,
    "Intent analysis complete"
);

// Strict error handling
match operation().await {
    Ok(result) => result,
    Err(e) => return Err(AppError::InternalError(format!("Failed: {}", e))),
}
```

#### TypeScript
```typescript
// Explicit types, never use `any`
interface DroneConfig {
  model: string;
  version: CONTROL_PLANE_VERSION;
  timeoutMs: number;
}

// Fetch from real backend API, never mock
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/endpoint`);
const data = (await response.json()) as APIResponse;
```

## Testing Strategy

### Unit Tests
```bash
cd backend
cargo test --all                    # Run all unit tests
cargo test --lib itt_middleware    # Test specific crate
```

### Integration Tests
```bash
docker-compose up -d
sleep 10

# Send real intent to Agent Socket
curl -N -H "Upgrade: websocket" \
  ws://localhost:3001/v1/agent-socket \
  -d '{"action": "start_simulation"}'

# Verify traces in Jaeger
curl http://localhost:16686/api/traces?service=itt-orchestrator-control-plane
```

### E2E Validation
```bash
# Run the entire stack and verify orchestration flow
npm run test:e2e

# Expected outcome:
# - Intent received ✓
# - Firewall passed ✓
# - Tool discovered ✓
# - WASM executed ✓
# - Cost arbitrage routed ✓
# - Traces visible in Jaeger ✓
```

## Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **Major (X.0.0)**: Breaking API changes
- **Minor (0.X.0)**: New features (backward compatible)
- **Patch (0.0.X)**: Bug fixes

### Release Steps
1. **Update version** in `backend/Cargo.toml` and `package.json`
2. **Update CHANGELOG.md** with breaking changes, features, and fixes
3. **Create release branch**:
   ```bash
   git checkout -b release/v0.2.0
   ```
4. **Create git tag**:
   ```bash
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin release/v0.2.0 --tags
   ```
5. **Build Docker image**:
   ```bash
   docker build -t itt-orchestrator:v0.2.0 .
   docker push your-registry/itt-orchestrator:v0.2.0
   ```
6. **Create GitHub Release** from the tag

## Getting Help

### Questions & Discussions
- Open a [GitHub Discussion](https://github.com/anthropics/itt-orchestrator/discussions)
- Check existing discussions for similar questions

### Bug Reports
- Search existing [GitHub Issues](https://github.com/anthropics/itt-orchestrator/issues)
- Include reproduction steps, expected behavior, actual behavior

### Documentation
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md) (if available)
- **API Docs**: Visit http://localhost:3001/docs (when running)

## Project Structure

```
ITT-Orchestrator/
├── backend/crates/              # Rust backend services
│   ├── itt_api/                # Main control plane API
│   ├── itt_middleware/         # SEAG middleware (Firewall, Arbitrage, Secure Execution Sandbox)
│   ├── itt_core/               # Core traits and MCP Tool Registry
│   ├── itt_memory/             # MongoDB/Neo4j integration
│   ├── itt_privacy/            # DPDP/GDPR tokenization
│   ├── itt_intent/             # TinyTransformer intent analysis
│   ├── itt_federation/         # CAL 4 federated learning
│   ├── itt_integrations/       # External APIs (Vault, etc.)
│   ├── itt_identity/           # Identity & RBAC
│   └── edge_agent/               # Sovereign Edge Agent with eBPF & hardware acceleration
├── src/components/             # React frontend
│   ├── canvas/                 # React Flow DAG builder
│   └── ...
├── docker/                     # Docker configs
├── docker-compose.yml          # Complete stack (MongoDB, Neo4j, Jaeger, etc.)
├── README.md                   # Project overview
├── CONTRIBUTING.md             # This file
└── LICENSE                     # Apache 2.0

```

## Acknowledgments

ITT-Orchestrator is built by the open-source community. We appreciate all contributions, from code to documentation to issue reports!

---

**Happy contributing! 🚀**
