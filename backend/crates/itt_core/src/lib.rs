//! ITT-Orchestrator Core Traits
//! 
//! This module defines the foundational traits for the Intent-to-Task Orchestration Platform.
//! It strictly adheres to two core philosophies:
//! 1. **ZeroClaw (Base)**: Ultra-lightweight, trait-driven, <5MB RAM footprint, <10ms startup.
//! 2. **IronClaw (Security)**: Security-first, WASM sandboxing for tools, and prompt injection defense.

use std::future::Future;

// ==========================================
// 1. ZERO-CLAW: LIGHTWEIGHT AGENT SKELETON
// ==========================================

/// Represents a ZeroClaw-inspired Micro-Agent.
/// Designed for zero-overhead instantiation on edge devices (IoT, mobile).
pub trait MicroAgent: Send + Sync {
    type Context;
    type Error;

    /// Instantiates the agent instantly (<10ms startup).
    fn spawn(ctx: Self::Context) -> Result<Self, Self::Error>
    where
        Self: Sized;

    /// Processes a task with minimal memory footprint (<5MB RAM).
    fn process_task(&self, payload: &[u8]) -> impl Future<Output = Result<Vec<u8>, Self::Error>> + Send;
}

// ==========================================
// 2. IRON-CLAW: SECURITY & SANDBOXING
// ==========================================

/// IronClaw-inspired Semantic Firewall.
/// Acts as a pre-processing layer to defend against prompt injections and semantic drift.
pub trait SemanticFirewall: Send + Sync {
    type Error;

    /// Inspects the raw input intent.
    /// Returns the sanitized payload or rejects it entirely if malicious.
    fn inspect_and_sanitize(&self, raw_intent: &[u8]) -> Result<Vec<u8>, Self::Error>;
}

/// IronClaw-inspired WASM Sandbox for Model Context Protocol (MCP) Tools.
/// Ensures untrusted tool executions cannot compromise the host execution plane.
pub trait WasmSandbox: Send + Sync {
    type Error;

    /// Executes an MCP tool inside an isolated WebAssembly environment.
    fn execute_isolated(
        &self,
        tool_name: &str,
        params: &[u8],
    ) -> impl Future<Output = Result<Vec<u8>, Self::Error>> + Send;
}

// ==========================================
// 3. CORE ORCHESTRATION & INTENT ENGINE
// ==========================================

/// Represents the analyzed context of an intent.
#[derive(Debug, Clone)]
pub struct IntentContext {
    /// The target model determined by Cost Arbitrage (e.g., "local-slm-v5" or "frontier-llm").
    pub target_model: String,
    /// MCP tools required to fulfill the intent.
    pub required_tools: Vec<String>,
    /// The maximum token budget allocated for this execution.
    pub token_budget: usize,
}

/// The Intent Engine responsible for Probabilistic Intent Analysis.
pub trait IntentEngine: Send + Sync {
    type Firewall: SemanticFirewall;
    type Error;

    /// Access the IronClaw Semantic Firewall.
    fn firewall(&self) -> &Self::Firewall;

    /// Analyzes the sanitized intent using a lightweight Transformer v5 architecture.
    /// Must execute in <10ms.
    fn analyze_intent(
        &self,
        sanitized_payload: &[u8],
    ) -> impl Future<Output = Result<IntentContext, Self::Error>> + Send;
}

/// The Federated Execution Plane (Data Plane).
/// Manages routing to disparate gateways and executes tools securely.
pub trait FederatedExecutionPlane: Send + Sync {
    type Sandbox: WasmSandbox;
    type Error;

    /// Access the IronClaw WASM Sandbox for secure tool execution.
    fn sandbox(&self) -> &Self::Sandbox;

    /// Routes the analyzed intent to the appropriate edge node or executes locally.
    fn route_and_execute(
        &self,
        context: IntentContext,
        payload: &[u8],
    ) -> impl Future<Output = Result<Vec<u8>, Self::Error>> + Send;
}

/// The Unified Logical Control Plane Orchestrator.
pub trait Orchestrator: Send + Sync {
    type Agent: MicroAgent;
    type Engine: IntentEngine;
    type ExecutionPlane: FederatedExecutionPlane;
    type Error;

    /// The main entry point for incoming requests.
    /// 1. Passes raw payload to the IntentEngine's Semantic Firewall.
    /// 2. Analyzes the intent to generate an IntentContext.
    /// 3. Instantiates a ZeroClaw MicroAgent instantly.
    /// 4. Dispatches to the FederatedExecutionPlane for WASM-sandboxed execution.
    fn orchestrate(
        &self,
        raw_payload: &[u8],
    ) -> impl Future<Output = Result<Vec<u8>, Self::Error>> + Send;
}
