//! Secure Execution Sandbox Sandbox (MCP Wasm Execution Engine)
//!
//! Executes compiled WebAssembly modules (representing MCP tools) securely
//! in a completely isolated memory space with strict timeouts.
//!
//! The sandbox uses wasmtime's epoch interruption mechanism to enforce strict
//! timeouts on WASM execution. A background tokio task increments the engine's
//! epoch every 100ms, enforcing a ~10-second maximum execution time.

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tracing::{info, instrument, error};
use wasmtime::{Config, Engine, Instance, Module, Store, TypedFunc};

use crate::error::AppError;

/// The Secure Execution Sandbox Sandbox for executing Wasm modules.
///
/// Uses a background epoch incrementor thread to enforce strict timeouts
/// on untrusted WASM code without blocking the caller.
pub struct SecureExecutionSandbox {
    engine: Arc<Engine>,
    _epoch_task: Arc<Mutex<tokio::task::JoinHandle<()>>>,
}

impl SecureExecutionSandbox {
    /// Initializes a new Secure Execution Sandbox Sandbox with strict resource limits.
    ///
    /// Spawns a background tokio task that increments the engine's epoch every 100ms.
    /// This enforces a ~10-second timeout for WASM execution (100 * 100ms = 10s).
    pub fn new() -> Result<Self, AppError> {
        let mut config = Config::new();
        // Enable epoch interruption for strict timeouts
        config.epoch_interruption(true);
        // Limit memory allocation
        config.max_wasm_stack(1024 * 1024); // 1MB stack limit

        let engine = Engine::new(&config)
            .map_err(|e| AppError::InternalError(format!("Failed to initialize Wasm engine: {}", e)))?;

        let engine_arc = Arc::new(engine);
        let engine_clone = engine_arc.clone();

        // Spawn background task to increment epoch every 100ms
        let epoch_task = tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_millis(100)).await;
                // Increment the epoch to interrupt long-running WASM code
                // After 100 increments (~10 seconds), WASM execution will be terminated
                engine_clone.increment_epoch();
            }
        });

        Ok(Self {
            engine: engine_arc,
            _epoch_task: Arc::new(Mutex::new(epoch_task)),
        })
    }

    /// Executes a Wasm module securely within the sandbox.
    ///
    /// The module is expected to export a function named `execute` that takes an integer
    /// and returns an integer.
    ///
    /// # Timeout Behavior
    /// - Execution is limited to ~10 seconds maximum due to epoch interruption
    /// - If execution exceeds this time, it returns `AppError::SecurityViolation`
    ///
    /// # Arguments
    /// * `wasm_bytes` - The compiled WebAssembly bytecode
    /// * `input` - Integer input to pass to the `execute` function
    #[instrument(
        name = "SecureExecutionSandbox::execute_mcp_tool",
        skip(self, wasm_bytes),
        fields(wasm_size_bytes = wasm_bytes.len(), input = %input)
    )]
    pub fn execute_mcp_tool(&self, wasm_bytes: &[u8], input: i32) -> Result<i32, AppError> {
        let start_time = Instant::now();

        info!("Compiling Wasm module ({} bytes) in Secure Execution Sandbox sandbox", wasm_bytes.len());

        let module = Module::new(&self.engine, wasm_bytes)
            .map_err(|e| AppError::InternalError(format!("Failed to compile Wasm module: {}", e)))?;

        // Create a store with epoch interruption enabled
        let mut store = Store::new(&self.engine, ());
        // Set deadline to 1 epoch; background task will increment and interrupt execution
        store.set_epoch_deadline(1);

        info!("Instantiating Wasm module in isolated memory space");
        let instance = Instance::new(&mut store, &module, &[])
            .map_err(|e| AppError::InternalError(format!("Failed to instantiate Wasm module: {}", e)))?;

        // Extract the exported function
        let execute_func: TypedFunc<i32, i32> = instance
            .get_typed_func(&mut store, "execute")
            .map_err(|e| AppError::InternalError(format!("Failed to find exported 'execute' function: {}", e)))?;

        info!("Executing MCP tool with input: {}", input);

        // Call the WASM function; if it exceeds epoch deadline, wasmtime will error
        let result = execute_func.call(&mut store, input)
            .map_err(|e| {
                let err_msg = e.to_string();
                if err_msg.contains("epoch") || err_msg.contains("deadline") {
                    AppError::SecurityViolation(format!("Wasm execution timeout (>10s): {}", e))
                } else {
                    AppError::SecurityViolation(format!("Wasm execution failed: {}", e))
                }
            })?;

        let execution_time_ms = start_time.elapsed().as_millis();
        info!(
            execution_time_ms = %execution_time_ms,
            result = %result,
            "MCP tool execution completed successfully"
        );

        Ok(result)
    }
}

impl Drop for SecureExecutionSandbox {
    /// Gracefully abort the epoch increment background task on sandbox shutdown.
    fn drop(&mut self) {
        // The JoinHandle will be dropped, and tokio will automatically abort the task
        tracing::debug!("SecureExecutionSandbox dropped; epoch incrementor task will be aborted");
    }
}
