//! Agent Socket Protocol SDK
//!
//! A standalone, pluggable Rust SDK that decouples the Agent Socket Protocol
//! from the ITT-Orchestrator. It provides adaptive runtimes and polyglot
//! adapters to allow open-source developers to integrate it into any AI ecosystem.

pub mod adapters;
pub mod protocol;
pub mod runtimes;

pub use adapters::{McpAdapter, MqAdapter, ProtocolAdapter, TcpAdapter};
pub use protocol::{AgentSocketFrame, FrameType};
pub use runtimes::{DirectMode, RelayMode};
