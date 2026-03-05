pub mod mcp_adapter;
pub mod mq_adapter;
pub mod tcp_adapter;

pub use mcp_adapter::McpAdapter;
pub use mq_adapter::MqAdapter;
pub use tcp_adapter::TcpAdapter;

/// Polyglot Plugin System core trait.
///
/// Allows transcoding between different network topologies and the dense
/// Agent Socket binary format.
pub trait ProtocolAdapter: Send + Sync {
    type Config;
    type Error;

    /// Transforms incoming standard protocol data into internal Agent Socket frames.
    fn ingress(&self, raw_payload: &[u8]) -> Result<Vec<u8>, Self::Error>;

    /// Transforms outgoing Agent Socket frames back into the target protocol.
    fn egress(&self, socket_frame: &[u8]) -> Result<Vec<u8>, Self::Error>;
}
