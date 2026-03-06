#![no_std]
//! ITT-Orchestrator: Ultra-Lightweight Sovereign Edge Agents
//!
//! Expands the Sovereign Edge Agent footprint. These agents compile into minimal binaries (<5MB)
//! capable of sitting alongside execution gateways (Envoy/Nginx) to collect telemetry
//! and enforce local policies. They report back via the binary AgentSocket protocol.
//!
//! Enhanced with eBPF kernel-level interception and optional hardware acceleration (GPU/NPU)
//! for local SLM (Small Language Model) inference at the edge.

extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use core::fmt;
use core::future::Future;

/// Custom Error enum for Edge Agent operations
#[derive(Debug)]
pub enum EdgeError {
    TelemetryCollectionFailed(String),
    PolicyEnforcementFailed(String),
    SocketTransmissionError(String),
    EBpfhookFailed(String),
    HardwareAccelerationNotAvailable,
    InvalidConfig,
    InvalidInput,
    NotInitialized,
}

impl fmt::Display for EdgeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EdgeError::TelemetryCollectionFailed(msg) => {
                write!(f, "Telemetry collection failed: {}", msg)
            }
            EdgeError::PolicyEnforcementFailed(msg) => {
                write!(f, "Policy enforcement failed: {}", msg)
            }
            EdgeError::SocketTransmissionError(msg) => {
                write!(f, "AgentSocket transmission error: {}", msg)
            }
            EdgeError::EBpfhookFailed(msg) => write!(f, "eBPF hook failed: {}", msg),
            EdgeError::HardwareAccelerationNotAvailable => {
                write!(f, "Hardware acceleration not available")
            }
            EdgeError::InvalidConfig => {
                write!(f, "Invalid configuration")
            }
            EdgeError::InvalidInput => {
                write!(f, "Invalid input provided")
            }
            EdgeError::NotInitialized => {
                write!(f, "Component not initialized")
            }
        }
    }
}

/// The Insight Agent Trait (Sovereign Edge Agent Footprint)
/// Designed to be `no_std` compatible where possible, ensuring <5MB binary size.
pub trait InsightAgent: Send + Sync {
    /// Collects local telemetry (eBPF metrics, Envoy stats) from the edge node.
    fn collect_telemetry(&self) -> impl Future<Output = Result<Vec<u8>, EdgeError>> + Send;

    /// Enforces local policy controls (e.g., rate limiting, circuit breaking) directly at the edge.
    fn enforce_local_policy(
        &self,
        payload: &[u8],
    ) -> impl Future<Output = Result<(), EdgeError>> + Send;

    /// Securely centralizes insights back to the core Orchestrator via the full-duplex AgentSocket protocol.
    fn report_to_orchestrator(
        &self,
        agent_socket_payload: &[u8],
    ) -> impl Future<Output = Result<(), EdgeError>> + Send;
}

/// A reference implementation of an Ultra-Lightweight Sovereign Edge Agent
pub struct SovereignSidecarAgent {
    pub node_id: String,
}

impl InsightAgent for SovereignSidecarAgent {
    async fn collect_telemetry(&self) -> Result<Vec<u8>, EdgeError> {
        // Simulated eBPF telemetry collection
        let telemetry_data = alloc::vec![0x01, 0x02, 0x03]; // Mock binary data
        Ok(telemetry_data)
    }

    async fn enforce_local_policy(&self, _payload: &[u8]) -> Result<(), EdgeError> {
        // Simulated local policy enforcement (e.g., checking local token bucket)
        Ok(())
    }

    async fn report_to_orchestrator(&self, _agent_socket_payload: &[u8]) -> Result<(), EdgeError> {
        // Simulated transmission over binary WebSocket (AgentSocket)
        Ok(())
    }
}

// ==================================================================================
// ENTERPRISE ENHANCEMENT: eBPF Kernel-Level Interception & Hardware Acceleration
// ==================================================================================

/// eBPF Hook Provider trait enabling kernel-level packet filtering and syscall interception.
///
/// Implementers provide eBPF programs that attach to kernel hooks without requiring
/// kernel modules, enabling sub-microsecond observation and enforcement at the OS level.
/// Uses the Linux eBPF (Extended Berkeley Packet Filter) subsystem for kernel-level
/// program execution.
pub trait EBpfhookProvider: Send + Sync {
    /// Attach a network filter (packet sniffer/inspector) via eBPF XDP/TC hooks.
    ///
    /// XDP (eXpress Data Path) programs run at the NIC driver level with zero-copy
    /// access to packet data, enabling sub-microsecond latency for packet inspection.
    ///
    /// # Arguments
    /// * `filter_name` - Name of the eBPF program (e.g., "aml_packet_filter")
    fn attach_network_filter(&self, filter_name: &str) -> Result<(), EdgeError>;

    /// Hook a specific syscall (e.g., open, read, write) for observability.
    ///
    /// Tracepoints are zero-overhead kernel instrumentation points that trigger
    /// eBPF programs on syscall entry/exit without modifying the kernel.
    ///
    /// # Arguments
    /// * `syscall_name` - Name of the syscall to hook (e.g., "sys_open", "sys_sendto")
    fn hook_syscall(&self, syscall_name: &str) -> Result<(), EdgeError>;

    /// Retrieve aggregated metrics from attached eBPF programs.
    ///
    /// eBPF programs write to kernel maps that are memory-mapped to userspace,
    /// enabling lock-free metric collection with near-zero overhead.
    fn get_metrics(&self) -> Result<BTreeMap<String, u64>, EdgeError>;
}

/// Hardware Acceleration Provider trait enabling GPU/NPU inference at the edge.
///
/// Implementers provide optimized execution of Small Language Models (SLMs)
/// on local hardware accelerators (NVIDIA GPU, TPU, etc.) for sub-200ms response times.
pub trait HardwareAccelerationProvider: Send + Sync {
    /// Check if hardware acceleration is available on this node.
    fn is_available(&self) -> bool;

    /// Execute a Small Language Model (SLM) locally via hardware acceleration.
    ///
    /// Returns the model's response without network round-trips to external APIs,
    /// enabling sub-100ms latency for local inference.
    ///
    /// # Arguments
    /// * `model_name` - Name of the SLM (e.g., "tinyllama-1b", "mistral-7b-quantized")
    /// * `prompt` - User input prompt for the model
    fn run_slm(&self, model_name: &str, prompt: &str) -> Result<String, EdgeError>;

    /// Retrieve capabilities of available hardware accelerators.
    fn get_capabilities(&self) -> BTreeMap<String, String>;
}

/// eBPF Interceptor - Packet Filtering & Threat Detection
///
/// In production, this links with libbpf or aya libraries to compile and attach
/// eBPF programs to the kernel datapath. This implementation provides the schema
/// and operational interface for network packet inspection and syscall monitoring.
pub struct EbpfInterceptor {
    /// Name of the eBPF program / filter (e.g., "aml_packet_filter", "ddos_protection")
    filter_name: String,
    /// Filter rules for packet inspection (e.g., IP ranges, port ranges, protocol rules)
    filter_rules: Vec<FilterRule>,
    /// Metrics collected from eBPF programs (filter_hits, dropped_packets, avg_latency_us)
    metrics: BTreeMap<String, u64>,
    /// Whether the filter is currently active and attached to the kernel
    is_active: bool,
}

/// Represents a single filtering rule for packet inspection
#[derive(Clone, Debug)]
pub struct FilterRule {
    /// Name of the rule (e.g., "block_private_ips", "aml_anomaly_detector")
    pub name: String,
    /// Action to take: "allow", "drop", "redirect", "alert"
    pub action: String,
    /// Condition for matching (simplified; production would use complex BPF expressions)
    pub condition: String,
    /// Priority (higher = evaluated first)
    pub priority: u32,
}

impl EbpfInterceptor {
    /// Create a new eBPF interceptor for a given filter name.
    pub fn new(filter_name: String) -> Self {
        Self {
            filter_name,
            filter_rules: Vec::new(),
            metrics: BTreeMap::new(),
            is_active: false,
        }
    }

    /// Add a filter rule for packet inspection.
    /// Example: add_filter("allow_ips_10_x", "allow", "src_ip=10.0.0.0/8", 10)
    pub fn add_filter(&mut self, name: &str, action: &str, condition: &str, priority: u32) -> Result<(), EdgeError> {
        // Validate action is one of the allowed values
        if !matches!(action, "allow" | "drop" | "redirect" | "alert") {
            return Err(EdgeError::InvalidConfig);
        }

        // Insert rule maintaining priority order
        let rule = FilterRule {
            name: name.to_string(),
            action: action.to_string(),
            condition: condition.to_string(),
            priority,
        };

        // Insert at correct position by priority (higher priority first)
        let insert_pos = self.filter_rules.iter().position(|r| r.priority < priority)
            .unwrap_or(self.filter_rules.len());
        self.filter_rules.insert(insert_pos, rule);

        // Track metric: rules_registered
        let count = self.metrics.entry("rules_registered".to_string()).or_insert(0);
        *count += 1;

        Ok(())
    }

    /// Intercept and analyze a packet. Returns (allowed: bool, matched_rule: Option<String>)
    pub fn intercept(&mut self, packet_data: &[u8]) -> Result<(bool, Option<String>), EdgeError> {
        if !self.is_active {
            return Err(EdgeError::NotInitialized);
        }

        if packet_data.is_empty() {
            return Err(EdgeError::InvalidInput);
        }

        // Simplified packet analysis: iterate through rules in priority order
        for rule in &self.filter_rules {
            // In production, this would parse actual packet headers and apply eBPF expressions
            // For now, use a simple string matching simulation
            if packet_data.len() > 0 && rule.condition.len() > 0 {
                // Simulate matching by checking if packet contains condition bytes
                let matches = packet_data.windows(rule.condition.len())
                    .any(|window| window == rule.condition.as_bytes());

                if matches {
                    // Increment metrics based on action
                    let metric_key = alloc::format!("{}_count", rule.action);
                    let count = self.metrics.entry(metric_key).or_insert(0);
                    *count += 1;

                    // Return decision and matched rule
                    let allowed = rule.action == "allow";
                    return Ok((allowed, Some(rule.name.clone())));
                }
            }
        }

        // No rule matched -> default to allow (permit unless explicitly blocked)
        let count = self.metrics.entry("default_allow_count".to_string()).or_insert(0);
        *count += 1;

        Ok((true, None))
    }

    /// Activate the eBPF filter (simulate attaching to kernel)
    pub fn activate(&mut self) -> Result<(), EdgeError> {
        self.is_active = true;
        let count = self.metrics.entry("activated_count".to_string()).or_insert(0);
        *count += 1;
        Ok(())
    }

    /// Deactivate the eBPF filter
    pub fn deactivate(&mut self) -> Result<(), EdgeError> {
        self.is_active = false;
        let count = self.metrics.entry("deactivated_count".to_string()).or_insert(0);
        *count += 1;
        Ok(())
    }
}

impl EBpfhookProvider for EbpfInterceptor {
    fn attach_network_filter(&self, filter_name: &str) -> Result<(), EdgeError> {
        // Production: Compile eBPF XDP program and attach to NIC via libbpf
        // This would use bpf::prog_load(), bpf_xdp_set_prog_fd(), etc.
        // Stub: Log the attachment intent
        if filter_name != self.filter_name {
            return Err(EdgeError::InvalidConfig);
        }
        let _ = alloc::format!("eBPF: Attaching network filter: {}", filter_name);
        Ok(())
    }

    fn hook_syscall(&self, syscall_name: &str) -> Result<(), EdgeError> {
        // Production: Attach tracepoint/kprobe via /sys/kernel/debug/tracing
        // Would set up perf_event_open() with PERF_TYPE_TRACEPOINT
        // Stub: Log the syscall hook
        if syscall_name.is_empty() {
            return Err(EdgeError::InvalidInput);
        }
        let _ = alloc::format!("eBPF: Hooking syscall: {}", syscall_name);
        Ok(())
    }

    fn get_metrics(&self) -> Result<BTreeMap<String, u64>, EdgeError> {
        // Production: Read from kernel eBPF map via mmap
        // Would access /sys/kernel/debug/tracing/trace_pipe or bpf_map_lookup_elem()
        // Return collected metrics
        Ok(self.metrics.clone())
    }
}

/// Local Hardware Accelerator for GPU/NPU Inference
///
/// Provides a stub for hardware-accelerated Small Language Model (SLM) inference.
/// In production, would link with CUDA (NVIDIA), HIP (AMD), or TensorFlow Lite (quantized).
pub struct LocalHardwareAccelerator {
    /// Device name (e.g., "nvidia-gpu-0", "tpu-v4-8")
    device_name: String,
    /// Available memory in MB
    total_memory_mb: u64,
    /// Loaded SLM models and their sizes
    loaded_models: BTreeMap<String, u64>,
}

impl LocalHardwareAccelerator {
    /// Create a new hardware accelerator for the given device.
    pub fn new(device_name: String, total_memory_mb: u64) -> Self {
        Self {
            device_name,
            total_memory_mb,
            loaded_models: BTreeMap::new(),
        }
    }
}

impl HardwareAccelerationProvider for LocalHardwareAccelerator {
    fn is_available(&self) -> bool {
        // Production: Check /proc/nvidia/gpus or tpu-cli status
        // Stub: Always available for demo
        true
    }

    fn run_slm(&self, model_name: &str, prompt: &str) -> Result<String, EdgeError> {
        if !self.is_available() {
            return Err(EdgeError::HardwareAccelerationNotAvailable);
        }

        // Production: Load model into GPU memory, run inference via CUDA/HIP kernel
        // Stub: Return a synthetic response
        let response = alloc::format!(
            "SLM Response from {}: Processed prompt '{}' (length {})",
            model_name,
            &prompt[..core::cmp::min(20, prompt.len())],
            prompt.len()
        );

        Ok(response)
    }

    fn get_capabilities(&self) -> BTreeMap<String, String> {
        let mut caps = BTreeMap::new();
        caps.insert("device".to_string(), self.device_name.clone());
        caps.insert(
            "total_memory_mb".to_string(),
            alloc::format!("{}", self.total_memory_mb),
        );
        caps.insert(
            "loaded_models".to_string(),
            alloc::format!("{}", self.loaded_models.len()),
        );
        caps
    }
}

/// Sovereign Edge Agent (Advanced) with eBPF + Hardware Acceleration
///
/// Combines the base InsightAgent with kernel-level observability (eBPF) and
/// local SLM inference (hardware acceleration) for enterprise edge deployments.
///
/// # Use Case
/// A Tier-1 bank deploys this agent in a Kubernetes sidecar alongside Envoy:
/// 1. Collects packet-level observability via eBPF XDP programs (<1µs latency)
/// 2. Enforces rate limiting, circuit breaking at sub-millisecond speed
/// 3. Runs local fraud detection SLM (< 200ms) without external API calls
/// 4. Reports aggregated metrics back to Control Plane via AgentSocket
#[allow(dead_code)]
pub struct SovereignEdgeAgentAdvanced {
    /// Base insight agent for telemetry and policy
    base_agent: SovereignSidecarAgent,
    /// eBPF provider for kernel-level hooks
    ebpf_provider: alloc::sync::Arc<dyn EBpfhookProvider>,
    /// Hardware acceleration provider for local SLM inference
    hardware_provider: alloc::sync::Arc<dyn HardwareAccelerationProvider>,
    /// Metrics cache
    metrics_cache: BTreeMap<String, u64>,
}

impl SovereignEdgeAgentAdvanced {
    /// Create a new Sovereign Edge Agent with eBPF and hardware acceleration.
    pub fn new(
        node_id: String,
        ebpf_provider: alloc::sync::Arc<dyn EBpfhookProvider>,
        hardware_provider: alloc::sync::Arc<dyn HardwareAccelerationProvider>,
    ) -> Self {
        Self {
            base_agent: SovereignSidecarAgent { node_id },
            ebpf_provider,
            hardware_provider,
            metrics_cache: BTreeMap::new(),
        }
    }

    /// Get the underlying node ID.
    pub fn node_id(&self) -> &str {
        &self.base_agent.node_id
    }

    /// Get eBPF metrics for observability.
    pub fn get_ebpf_metrics(&self) -> Result<BTreeMap<String, u64>, EdgeError> {
        self.ebpf_provider.get_metrics()
    }

    /// Get hardware acceleration capabilities.
    pub fn get_hardware_capabilities(&self) -> BTreeMap<String, String> {
        self.hardware_provider.get_capabilities()
    }

    /// Check if hardware acceleration is available.
    pub fn is_hardware_accelerated(&self) -> bool {
        self.hardware_provider.is_available()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sovereign_sidecar_agent_creation() {
        let agent = SovereignSidecarAgent {
            node_id: "node-1".to_string(),
        };
        assert_eq!(agent.node_id, "node-1");
    }

    #[test]
    fn test_ebpf_interceptor_creation() {
        let interceptor = EbpfInterceptor::new("test-filter".to_string());
        assert_eq!(interceptor.filter_name, "test-filter");
        assert!(!interceptor.is_active);
    }

    #[test]
    fn test_ebpf_hook_attachment() {
        let interceptor = EbpfInterceptor::new("aml-filter".to_string());
        let result = interceptor.attach_network_filter("aml-filter");
        assert!(result.is_ok());
    }

    #[test]
    fn test_ebpf_filter_matching() {
        let mut interceptor = EbpfInterceptor::new("test-filter".to_string());

        // Activate the filter
        let activate_result = interceptor.activate();
        assert!(activate_result.is_ok());
        assert!(interceptor.is_active);

        // Add a filter rule
        let result = interceptor.add_filter("allow_rule", "allow", "ALLOW", 100);
        assert!(result.is_ok());

        // Test packet that matches the "ALLOW" rule
        let matching_packet = b"ALLOW_THIS_PACKET";
        let (allowed, rule_name) = interceptor.intercept(matching_packet).expect("Intercept failed");
        assert!(allowed); // allowed should be true since action is "allow"
        assert_eq!(rule_name, Some("allow_rule".to_string()));

        // Verify metrics were updated
        let metrics = interceptor.get_metrics().expect("Get metrics failed");
        assert_eq!(metrics.get("rules_registered"), Some(&1));
        assert_eq!(metrics.get("allow_count"), Some(&1));

        // Test packet that doesn't match any rule (should default to allow)
        let non_matching_packet = b"DROP_THIS";
        let (allowed, rule_name) = interceptor.intercept(non_matching_packet).expect("Intercept failed");
        assert!(allowed); // default is allow
        assert_eq!(rule_name, None);

        // Verify default allow metric incremented
        let metrics = interceptor.get_metrics().expect("Get metrics failed");
        assert_eq!(metrics.get("default_allow_count"), Some(&1));

        // Add a drop rule with higher priority
        let result = interceptor.add_filter("block_rule", "drop", "MALICIOUS", 200);
        assert!(result.is_ok());

        // Test packet matching the drop rule
        let drop_packet = b"MALICIOUS_PAYLOAD";
        let (allowed, rule_name) = interceptor.intercept(drop_packet).expect("Intercept failed");
        assert!(!allowed); // allowed should be false since action is "drop"
        assert_eq!(rule_name, Some("block_rule".to_string()));

        // Deactivate and verify it fails
        let deactivate_result = interceptor.deactivate();
        assert!(deactivate_result.is_ok());
        let intercept_result = interceptor.intercept(b"test");
        assert!(intercept_result.is_err()); // Should fail when not active
    }

    #[test]
    fn test_hardware_accelerator_creation() {
        let accelerator = LocalHardwareAccelerator::new("nvidia-gpu-0".to_string(), 24576);
        assert!(accelerator.is_available());
        assert_eq!(accelerator.device_name, "nvidia-gpu-0");
    }
}
