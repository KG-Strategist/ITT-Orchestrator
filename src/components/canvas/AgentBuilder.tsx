import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  IntentTriggerNode, 
  SemanticFirewallNode, 
  MCPToolNode, 
  TokenBudgetNode,
  IdentityMediationNode,
  ProtocolTranscoderNode,
  ToonOptimizerNode,
  ContextInjectorNode,
  FederatedLearnerNode,
  CircuitBreakerNode,
  SchemaRegistryNode,
  AnomalyAlertingNode,
  DPDPTokenizerNode,
  ComplianceAuditorNode,
  BiasDetectorNode,
  DecryptionTrustAnchorNode,
  SovereignSidecarNode,
  PolyglotTranslationNode,
  SandwichPatternNode,
  VectorStoreNode,
  KnowledgeGraphNode,
  PromptTemplateNode,
  ChainOfThoughtNode,
  RateLimiterNode,
  RetryPolicyNode,
  TelemetryExporterNode,
  LogAggregatorNode,
  DistributedTracerNode
} from './CustomNodes';
import { Play, Settings, Layers, ShieldCheck, X, FileJson, CheckCircle2, Terminal, BrainCircuit, Activity, ChevronDown, Download, RadioReceiver, Sparkles, Loader2 } from 'lucide-react';
import { useOrchestratorStore } from '../../store/orchestratorStore';

const nodeTypes = {
  intentTrigger: IntentTriggerNode,
  semanticFirewall: SemanticFirewallNode,
  mcpTool: MCPToolNode,
  tokenBudget: TokenBudgetNode,
  identityMediation: IdentityMediationNode,
  protocolTranscoder: ProtocolTranscoderNode,
  toonOptimizer: ToonOptimizerNode,
  contextInjector: ContextInjectorNode,
  federatedLearner: FederatedLearnerNode,
  circuitBreaker: CircuitBreakerNode,
  schemaRegistry: SchemaRegistryNode,
  anomalyAlerting: AnomalyAlertingNode,
  dpdpTokenizer: DPDPTokenizerNode,
  complianceAuditor: ComplianceAuditorNode,
  biasDetector: BiasDetectorNode,
  decryptionTrustAnchor: DecryptionTrustAnchorNode,
  sovereignSidecar: SovereignSidecarNode,
  polyglotTranslation: PolyglotTranslationNode,
  sandwichPattern: SandwichPatternNode,
  vectorStore: VectorStoreNode,
  knowledgeGraph: KnowledgeGraphNode,
  promptTemplate: PromptTemplateNode,
  chainOfThought: ChainOfThoughtNode,
  rateLimiter: RateLimiterNode,
  retryPolicy: RetryPolicyNode,
  telemetryExporter: TelemetryExporterNode,
  logAggregator: LogAggregatorNode,
  distributedTracer: DistributedTracerNode,
};

// Golden Path Template: Project Aurora (Federated AML Detection)
const initialNodes = [
  { id: '1', type: 'intentTrigger', position: { x: 250, y: 50 }, data: { label: 'Event: Suspicious Transaction' } },
  { id: '2', type: 'contextInjector', position: { x: 250, y: 200 }, data: { source: 'Pinecone: Customer KG' } },
  { id: '3', type: 'federatedLearner', position: { x: 250, y: 350 }, data: { privacy: 'Homomorphic Enc.' } },
  { id: '4', type: 'mcpTool', position: { x: 250, y: 500 }, data: { toolName: 'Global AML Model' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
];

let id = 5;
const getId = () => `${id++}`;

const AgentBuilderContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [wsStatus, setWsStatus] = useState('Connecting...');
  
  const [activeTab, setActiveTab] = useState<'components' | 'catalog'>('components');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<{text: string, color: string}[]>([]);
  const [showDeployMenu, setShowDeployMenu] = useState(false);
  const [isMeltConnected, setIsMeltConnected] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateAgentDAG } = useOrchestratorStore();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const handleGenerateDAG = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateAgentDAG(prompt);
      if (result.nodes && result.nodes.length > 0) {
        setNodes(result.nodes);
        setEdges(result.edges || []);
        setTimeout(() => fitView({ duration: 800 }), 100);
      } else {
        alert(result.fallbackMessage || "Failed to generate DAG.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating DAG.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Scaffold TinyClaw to Rust Backend Integration (Agent Socket Protocol)
  useEffect(() => {
    // Determine the correct WebSocket URL based on the current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/v1/agent-socket`;

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setWsStatus('Connected (<10ms latency)');
    };
    
    ws.onmessage = async (event) => {
      try {
        // Handle binary frames (Blob)
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          const data = JSON.parse(text);
          
          if (data.type === 'log') {
            setSimulationLogs(prev => [...prev, { text: data.message, color: data.color || 'text-slate-300' }]);
          } else if (data.type === 'status') {
             if (data.status === 'complete') {
                 setIsSimulating(false);
             }
          }
        } else {
           // Fallback for text frames if any
           const data = JSON.parse(event.data);
           if (data.type === 'log') {
             setSimulationLogs(prev => [...prev, { text: data.message, color: data.color || 'text-slate-300' }]);
           } else if (data.type === 'status') {
             if (data.status === 'complete') {
                 setIsSimulating(false);
             }
          }
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    };

    ws.onerror = () => {
      setWsStatus('Connection Error');
      setIsSimulating(false);
    };
    
    ws.onclose = () => {
      setWsStatus('Disconnected');
      setIsSimulating(false);
    };

    // Store the WebSocket instance in a ref if we need to send messages later
    // wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } } as Edge, eds)), [setEdges]);

  const onDragStart = (event: React.DragEvent, nodeType: string, toolName?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (toolName) {
      event.dataTransfer.setData('toolName', toolName);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const toolName = event.dataTransfer.getData('toolName');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      let data: any = {};
      if (type === 'mcpTool' && toolName) {
        data = { toolName };
      } else if (type === 'intentTrigger') {
        data = { label: 'New Intent' };
      } else if (type === 'semanticFirewall') {
        data = { threshold: '0.95' };
      } else if (type === 'tokenBudget') {
        data = { budget: '10.00' };
      }

      const newNode = {
        id: getId(),
        type,
        position,
        data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setShowAuditModal(true);
    }, 1500);
  };

  const runSimulation = () => {
    setShowTerminal(true);
    setIsSimulating(true);
    setSimulationLogs([]);
    
    // Determine the correct WebSocket URL based on the current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/v1/agent-socket`;

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setWsStatus('Connected (<10ms latency)');
      // Send a binary frame to start the simulation
      const payload = JSON.stringify({ action: 'start_simulation', nodes: nodes.map(n => n.id) });
      const encoder = new TextEncoder();
      ws.send(encoder.encode(payload));
    };
    
    ws.onmessage = async (event) => {
      try {
        // Handle binary frames (Blob)
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          const data = JSON.parse(text);
          
          if (data.type === 'log') {
            setSimulationLogs(prev => [...prev, { text: data.message, color: data.color || 'text-slate-300' }]);
          } else if (data.type === 'status') {
             if (data.status === 'complete') {
                 setIsSimulating(false);
                 ws.close();
             }
          }
        } else {
           // Fallback for text frames if any
           const data = JSON.parse(event.data);
           if (data.type === 'log') {
             setSimulationLogs(prev => [...prev, { text: data.message, color: data.color || 'text-slate-300' }]);
           } else if (data.type === 'status') {
             if (data.status === 'complete') {
                 setIsSimulating(false);
                 ws.close();
             }
          }
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    };

    ws.onerror = () => {
      setWsStatus('Connection Error');
      setIsSimulating(false);
    };
    
    ws.onclose = () => {
      setWsStatus('Disconnected');
      setIsSimulating(false);
    };
  };

  const generateManifest = () => {
    return `apiVersion: seag.itt-orchestrator.com/v1alpha1
kind: ConnectivityRequest
metadata:
  name: project-aurora-aml
  namespace: zone-4-cognitive-edge
spec:
  zone_intent: TheCognitiveEdge
  protocol: AgentSocket
  finops_budget: 500.00
  dpdp_masking_required: true
  nodes:
${nodes.map(n => `    - id: ${n.id}\n      type: ${n.type}`).join('\n')}
`;
  };

  const generateAuditLog = () => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      trace_id: "gitops-trace-8f92a1b",
      policy_engine: "Open Policy Agent (OPA)",
      status: "APPROVED",
      checks: [
        { rule: "DPDP_Masking_Enforced", result: "PASS" },
        { rule: "Zone_4_Isolation", result: "PASS" },
        { rule: "FinOps_Budget_Allocated", result: "PASS" }
      ],
      deployment: {
        target: "ArgoCD -> Sovereign Sidecar",
        latency_guarantee: "<10ms"
      }
    }, null, 2);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0">
        <div className="flex border-b border-slate-800 shrink-0">
          <button 
            onClick={() => setActiveTab('components')} 
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'components' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Components
          </button>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'catalog' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Service Catalog
          </button>
        </div>
        
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          {activeTab === 'components' ? (
            <>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Triggers</h4>
                <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-lg cursor-grab hover:border-indigo-500 transition-colors" onDragStart={(e) => onDragStart(e, 'intentTrigger')} draggable>
                  <span className="text-sm font-medium text-indigo-400">Intent Trigger</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Governance & Privacy</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 border border-rose-500/30 rounded-lg cursor-grab hover:border-rose-500 transition-colors" onDragStart={(e) => onDragStart(e, 'semanticFirewall')} draggable>
                    <span className="text-sm font-medium text-rose-400">Semantic Firewall</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-pink-500/30 rounded-lg cursor-grab hover:border-pink-500 transition-colors" onDragStart={(e) => onDragStart(e, 'dpdpTokenizer')} draggable>
                    <span className="text-sm font-medium text-pink-400">DPDP Tokenizer</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-lg cursor-grab hover:border-emerald-500 transition-colors" onDragStart={(e) => onDragStart(e, 'tokenBudget')} draggable>
                    <span className="text-sm font-medium text-emerald-400">Token Budget</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-violet-500/30 rounded-lg cursor-grab hover:border-violet-500 transition-colors" onDragStart={(e) => onDragStart(e, 'federatedLearner')} draggable>
                    <span className="text-sm font-medium text-violet-400">Federated Learner</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AGF Integrations</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-lg cursor-grab hover:border-amber-500 transition-colors" onDragStart={(e) => onDragStart(e, 'identityMediation')} draggable>
                    <span className="text-sm font-medium text-amber-400">Identity Mediation</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-fuchsia-500/30 rounded-lg cursor-grab hover:border-fuchsia-500 transition-colors" onDragStart={(e) => onDragStart(e, 'protocolTranscoder')} draggable>
                    <span className="text-sm font-medium text-fuchsia-400">Protocol Transcoder</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-lime-500/30 rounded-lg cursor-grab hover:border-lime-500 transition-colors" onDragStart={(e) => onDragStart(e, 'toonOptimizer')} draggable>
                    <span className="text-sm font-medium text-lime-400">TOON Optimizer</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Execution & Memory</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 border border-blue-500/30 rounded-lg cursor-grab hover:border-blue-500 transition-colors" onDragStart={(e) => onDragStart(e, 'contextInjector')} draggable>
                    <span className="text-sm font-medium text-blue-400">Context Injector</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-lg cursor-grab hover:border-cyan-500 transition-colors" onDragStart={(e) => onDragStart(e, 'mcpTool')} draggable>
                    <span className="text-sm font-medium text-cyan-400">MCP Tool (WASM)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resilience & Observability</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 border border-orange-500/30 rounded-lg cursor-grab hover:border-orange-500 transition-colors" onDragStart={(e) => onDragStart(e, 'circuitBreaker')} draggable>
                    <span className="text-sm font-medium text-orange-400">Circuit Breaker</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-teal-500/30 rounded-lg cursor-grab hover:border-teal-500 transition-colors" onDragStart={(e) => onDragStart(e, 'schemaRegistry')} draggable>
                    <span className="text-sm font-medium text-teal-400">Schema Registry</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-red-500/30 rounded-lg cursor-grab hover:border-red-500 transition-colors" onDragStart={(e) => onDragStart(e, 'anomalyAlerting')} draggable>
                    <span className="text-sm font-medium text-red-400">Anomaly Alerting</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Apigee Gateway</h4>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-grab hover:border-cyan-500 transition-colors" onDragStart={(e) => onDragStart(e, 'mcpTool', 'CoreBanking.GetBalance')} draggable>
                  <span className="text-sm font-medium text-slate-300">CoreBanking.GetBalance</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Kong Gateway</h4>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-grab hover:border-cyan-500 transition-colors" onDragStart={(e) => onDragStart(e, 'mcpTool', 'CRM.UpdateCustomer')} draggable>
                  <span className="text-sm font-medium text-slate-300">CRM.UpdateCustomer</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AWS API Gateway</h4>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-grab hover:border-cyan-500 transition-colors" onDragStart={(e) => onDragStart(e, 'mcpTool', 'Risk.KYCCheck')} draggable>
                  <span className="text-sm font-medium text-slate-300">Risk.KYCCheck</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Canvas Area */}
      <main className="flex-1 relative flex flex-col" ref={reactFlowWrapper}>
        {/* Generative Prompt Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sparkles className="w-5 h-5 text-cyan-500" />
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGenerateDAG();
                }
              }}
              placeholder="Describe the agent you want to build (e.g., 'Create a federated AML agent that checks transactions and applies local differential privacy')"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-32 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              disabled={isGenerating}
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <button
                onClick={handleGenerateDAG}
                disabled={isGenerating || !prompt.trim()}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  'Generate DAG'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-950"
          >
            <Background color="#1e293b" gap={20} size={2} />
            <Controls className="bg-slate-900 border-slate-800 fill-slate-400" />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'intentTrigger': return '#6366f1';
                  case 'semanticFirewall': return '#f43f5e';
                  case 'mcpTool': return '#06b6d4';
                  case 'tokenBudget': return '#10b981';
                  case 'identityMediation': return '#f59e0b';
                  case 'protocolTranscoder': return '#d946ef';
                  case 'toonOptimizer': return '#84cc16';
                  case 'contextInjector': return '#3b82f6';
                  case 'federatedLearner': return '#8b5cf6';
                  case 'circuitBreaker': return '#f97316';
                  case 'schemaRegistry': return '#14b8a6';
                  case 'anomalyAlerting': return '#ef4444';
                  default: return '#475569';
                }
              }}
              maskColor="rgba(15, 23, 42, 0.8)"
              className="bg-slate-900 border-slate-800"
            />
            
            <Panel position="top-left" className="m-4">
              <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 shadow-xl">
                <h2 className="text-sm font-bold text-white mb-1">Project Aurora</h2>
                <p className="text-xs text-slate-400">Federated AML Detection Template</p>
              </div>
            </Panel>

            <Panel position="top-right" className="flex gap-3 m-4">
              <button 
                onClick={runSimulation}
                disabled={isSimulating}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Run Simulation
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowDeployMenu(!showDeployMenu)}
                  disabled={isDeploying || isSimulating}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2"
                >
                  {isDeploying ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Lifecycle Actions
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                {showDeployMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => {
                          setShowDeployMenu(false);
                          handleDeploy();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors"
                      >
                        <Play className="w-4 h-4 text-cyan-500" />
                        <div>
                          <div className="font-bold">Deploy via GVM</div>
                          <div className="text-xs text-slate-500">Push to edge via GitOps</div>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setShowDeployMenu(false);
                          alert("Downloading ZeroClaw binary (<5MB)...");
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors"
                      >
                        <Download className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="font-bold">Download Agent Binary</div>
                          <div className="text-xs text-slate-500">ZeroClaw Rust executable</div>
                        </div>
                      </button>

                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>

                      <button 
                        onClick={() => {
                          setIsMeltConnected(!isMeltConnected);
                          setShowDeployMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RadioReceiver className={`w-4 h-4 ${isMeltConnected ? 'text-amber-500' : 'text-slate-400'}`} />
                          <div>
                            <div className="font-bold">Connect to MELT Engine</div>
                            <div className="text-xs text-slate-500">Stream OTEL telemetry</div>
                          </div>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isMeltConnected ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${isMeltConnected ? 'right-1' : 'left-1'}`}></div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <Panel position="bottom-center" className={`mb-4 transition-all duration-300 ${showTerminal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="px-4 py-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full flex items-center gap-3 text-xs font-mono text-slate-400 shadow-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Agent Socket Protocol:</span>
                <span className={wsStatus.includes('Connected') ? 'text-emerald-400' : 'text-amber-400'}>{wsStatus}</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Simulation Terminal Drawer */}
        {showTerminal && (
          <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 z-20">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Terminal className="w-4 h-4" />
                <span>MELT Observability: Live Chain of Thought</span>
                {isSimulating && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-2" />}
              </div>
              <button onClick={() => setShowTerminal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
              {simulationLogs.map((log, i) => (
                <div key={i} className={`${log.color} animate-in fade-in slide-in-from-bottom-2`}>
                  {log.text}
                </div>
              ))}
              {isSimulating && (
                <div className="text-slate-500 animate-pulse">_</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Properties Panel (Right Sidebar) */}
      {selectedNode && selectedNode.type === 'federatedLearner' && (
        <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-10 shrink-0">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-violet-400"/> Node Properties</h3>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configuration Profile</h4>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-sm text-violet-300 font-mono">
                CAL 4 (Decentralized National & Cross-Border)
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Privacy Controls</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Homomorphic Encryption (HE)</span>
                <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full shadow"></div></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Local Differential Privacy (LDP)</span>
                <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full shadow"></div></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">ZKP Audit Trailing</span>
                <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full shadow"></div></div>
              </div>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <p className="text-xs text-rose-300 leading-relaxed">
                <strong className="text-rose-400">Warning:</strong> Raw transaction data never leaves the local perimeter. Only encrypted model updates are shared with the Global AML Consortium.
              </p>
            </div>
          </div>
        </aside>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">GVM GitOps Deployment Successful</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* YAML Manifest */}
              <div className="flex-1 border-r border-slate-800 flex flex-col">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <FileJson className="w-4 h-4" /> gateway-request.yaml
                </div>
                <div className="p-4 flex-1 overflow-y-auto bg-slate-950/50">
                  <pre className="text-xs font-mono text-cyan-300 whitespace-pre-wrap">
                    {generateManifest()}
                  </pre>
                </div>
              </div>
              
              {/* OPA Audit Log */}
              <div className="flex-1 flex flex-col">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Automated Compliance Audit Log
                </div>
                <div className="p-4 flex-1 overflow-y-auto bg-slate-950/50">
                  <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                    {generateAuditLog()}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950 text-right">
              <button onClick={() => setShowAuditModal(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AgentBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <AgentBuilderContent />
    </ReactFlowProvider>
  );
};

export default AgentBuilder;
