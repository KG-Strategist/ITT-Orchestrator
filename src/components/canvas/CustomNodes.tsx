import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ShieldAlert, Zap, Database, MessageSquare, Key, ArrowRightLeft, Minimize2, Network, BrainCircuit, PowerOff, FileCode2, ActivitySquare, LockKeyhole, CheckCircle, AlertTriangle, Shield, Layers, Globe, SplitSquareHorizontal, DatabaseZap, Share2, FileText, GitCommit, Timer, RotateCcw, BarChart3, FileSearch, GitMerge } from 'lucide-react';

export const IntentTriggerNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-indigo-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Intent Trigger</h3>
          <p className="text-xs text-slate-400">Natural Language Entry</p>
        </div>
      </div>
      <div className="bg-slate-950 rounded p-2 text-xs text-slate-300 font-mono border border-slate-800">
        {data.label as string || 'e.g., "Check my loan status"'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-slate-900" />
    </div>
  );
};

export const SemanticFirewallNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-rose-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-rose-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-rose-500/20 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Semantic Firewall</h3>
          <p className="text-xs text-slate-400">Advanced Security Sandbox</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Trust Threshold:</span>
        <span className="text-rose-400 font-mono font-bold">{data.threshold as string || '0.95'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-rose-500 border-2 border-slate-900" />
    </div>
  );
};

export const MCPToolNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Database className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">MCP Tool</h3>
          <p className="text-xs text-slate-400">WASM Sandboxed Execution</p>
        </div>
      </div>
      <div className="bg-slate-950 rounded p-2 text-xs text-cyan-300 font-mono border border-slate-800">
        {data.toolName as string || 'CoreBanking.GetBalance'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-500 border-2 border-slate-900" />
    </div>
  );
};

export const TokenBudgetNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-emerald-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Cost Arbitrage</h3>
          <p className="text-xs text-slate-400">Financial Token Bucket</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Max Budget:</span>
        <span className="text-emerald-400 font-mono font-bold">₹{data.budget as string || '10.00'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-slate-900" />
    </div>
  );
};

export const IdentityMediationNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-amber-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Key className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Identity Mediation</h3>
          <p className="text-xs text-slate-400">The Sandwich Pattern</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Translation:</span>
        <span className="text-amber-400 font-mono font-bold">{data.translation || 'OIDC → LDAP'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-slate-900" />
    </div>
  );
};

export const ProtocolTranscoderNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-fuchsia-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-fuchsia-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-fuchsia-500/20 rounded-lg">
          <ArrowRightLeft className="w-5 h-5 text-fuchsia-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Protocol Transcoder</h3>
          <p className="text-xs text-slate-400">Mesh-to-Queue Bridge</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Bridge:</span>
        <span className="text-fuchsia-400 font-mono font-bold">{data.bridge || 'REST → ISO 8583'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-fuchsia-500 border-2 border-slate-900" />
    </div>
  );
};

export const ToonOptimizerNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-lime-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-lime-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-lime-500/20 rounded-lg">
          <Minimize2 className="w-5 h-5 text-lime-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">TOON Optimizer</h3>
          <p className="text-xs text-slate-400">Token Density Reduction</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Format:</span>
        <span className="text-lime-400 font-mono font-bold">JSON → TOON</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-lime-500 border-2 border-slate-900" />
    </div>
  );
};

export const ContextInjectorNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-blue-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Network className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Context Injector</h3>
          <p className="text-xs text-slate-400">Memory / RAG</p>
        </div>
      </div>
      <div className="bg-slate-950 rounded p-2 text-xs text-blue-300 font-mono border border-slate-800">
        {data.source || 'Pinecone: Customer KG'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-slate-900" />
    </div>
  );
};

export const FederatedLearnerNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-violet-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-violet-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-violet-500/20 rounded-lg">
          <BrainCircuit className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Federated Learner</h3>
          <p className="text-xs text-slate-400">HE & LDP Privacy</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Privacy:</span>
        <span className="text-violet-400 font-mono font-bold">{data.privacy || 'Homomorphic Enc.'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-violet-500 border-2 border-slate-900" />
    </div>
  );
};

export const CircuitBreakerNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-orange-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <PowerOff className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Circuit Breaker</h3>
          <p className="text-xs text-slate-400">Fault Tolerance</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Threshold:</span>
        <span className="text-orange-400 font-mono font-bold">{data.threshold || '5 Failures'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500 border-2 border-slate-900" />
    </div>
  );
};

export const SchemaRegistryNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-teal-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-teal-500/20 rounded-lg">
          <FileCode2 className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Schema Registry</h3>
          <p className="text-xs text-slate-400">Payload Validation</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Schema:</span>
        <span className="text-teal-400 font-mono font-bold">{data.schema || 'v1.2.0'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-500 border-2 border-slate-900" />
    </div>
  );
};

export const DPDPTokenizerNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-pink-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <LockKeyhole className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">DPDP Tokenizer</h3>
          <p className="text-xs text-slate-400">PII Masking</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Rule:</span>
        <span className="text-pink-400 font-mono font-bold">{data.rule || 'Aadhaar/PAN'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-500 border-2 border-slate-900" />
    </div>
  );
};

export const AnomalyAlertingNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-red-500 rounded-xl p-4 shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-red-500 border-2 border-slate-900" />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <ActivitySquare className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Anomaly Alerting</h3>
          <p className="text-xs text-slate-400">MELT Observability</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-950 rounded p-2 text-xs border border-slate-800">
        <span className="text-slate-400">Target:</span>
        <span className="text-red-400 font-mono font-bold">{data.target || 'SOC Team'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-red-500 border-2 border-slate-900" />
    </div>
  );
};

// --- New SEAG Capability Nodes ---

export const ComplianceAuditorNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <CheckCircle className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Compliance Auditor</h3>
        <p className="text-xs text-slate-400">Continuous Verification</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const BiasDetectorNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Bias Detector</h3>
        <p className="text-xs text-slate-400">Fairness Evaluation</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const DecryptionTrustAnchorNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <Shield className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Decryption Trust Anchor</h3>
        <p className="text-xs text-slate-400">Secure Payload Inspection</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const SovereignSidecarNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <Layers className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Sovereign Sidecar</h3>
        <p className="text-xs text-slate-400">eBPF Data Plane</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const PolyglotTranslationNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <Globe className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Polyglot Translation</h3>
        <p className="text-xs text-slate-400">Multi-Language Support</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const SandwichPatternNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <SplitSquareHorizontal className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Sandwich Pattern</h3>
        <p className="text-xs text-slate-400">Pre/Post Processing</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const VectorStoreNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <DatabaseZap className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Vector Store</h3>
        <p className="text-xs text-slate-400">Embedding Retrieval</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const KnowledgeGraphNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <Share2 className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Knowledge Graph</h3>
        <p className="text-xs text-slate-400">Semantic Relationships</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const PromptTemplateNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <FileText className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Prompt Template</h3>
        <p className="text-xs text-slate-400">Dynamic Injection</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const ChainOfThoughtNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <GitCommit className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Chain of Thought</h3>
        <p className="text-xs text-slate-400">Reasoning Engine</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const RateLimiterNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <Timer className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Rate Limiter</h3>
        <p className="text-xs text-slate-400">Traffic Shaping</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const RetryPolicyNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <RotateCcw className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Retry Policy</h3>
        <p className="text-xs text-slate-400">Exponential Backoff</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const TelemetryExporterNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <BarChart3 className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Telemetry Exporter</h3>
        <p className="text-xs text-slate-400">OTEL Integration</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const LogAggregatorNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <FileSearch className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Log Aggregator</h3>
        <p className="text-xs text-slate-400">Centralized Logging</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);

export const DistributedTracerNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-500 rounded-xl p-4 shadow-lg min-w-[250px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <GitMerge className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">Distributed Tracer</h3>
        <p className="text-xs text-slate-400">Request Tracking</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-2 border-slate-900" />
  </div>
);
