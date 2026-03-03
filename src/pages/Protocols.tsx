import React from 'react';
import { Box, Terminal, Network, Cpu, Lock } from 'lucide-react';

export const McpConfig = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold flex items-center gap-3"><Box className="text-indigo-500" /> Model Context Protocol</h1>
    <p className="mt-4 text-slate-500">Configure MCP server endpoints and context injection rules.</p>
  </div>
);

export const AgentSocketConfig = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold flex items-center gap-3"><Terminal className="text-cyan-500" /> Agent Socket</h1>
    <p className="mt-4 text-slate-500">Manage binary WebSocket connection pooling limits.</p>
  </div>
);

export const GrpcConfig = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold flex items-center gap-3"><Network className="text-emerald-500" /> gRPC Mesh Routing</h1>
    <p className="mt-4 text-slate-500">Define routing rules and load balancing for the service mesh.</p>
  </div>
);

export const Iso8583Config = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold flex items-center gap-3"><Cpu className="text-amber-500" /> ISO 8583 Wasm</h1>
    <p className="mt-4 text-slate-500">Assign Wasm transcoder ports for legacy payment TCP bitmaps.</p>
  </div>
);

export const A2aConfig = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold flex items-center gap-3"><Lock className="text-rose-500" /> A2A Security</h1>
    <p className="mt-4 text-slate-500">Configure Agent-to-Agent security rules and mutual authentication.</p>
  </div>
);
