import React, { useState } from 'react';
import { FileJson, Play, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

const IntentManifests: React.FC = () => {
  const [yamlContent, setYamlContent] = useState(`apiVersion: seag.itt-orchestrator.com/v1alpha1
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
    - id: 1
      type: intentTrigger
    - id: 2
      type: contextInjector
    - id: 3
      type: federatedLearner
    - id: 4
      type: mcpTool
`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = () => {
    setIsSubmitting(true);
    setStatus('idle');
    setTimeout(() => {
      setIsSubmitting(false);
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileJson className="w-8 h-8 text-indigo-500" />
              Intent Manifests
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Submit declarative YAML requests for Gateway Vending Machine (GVM) provisioning.</p>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2"
          >
            {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-5 h-5" />}
            Submit Manifest
          </button>
        </div>

        {status === 'success' && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Manifest Accepted</h4>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">The Gateway Vending Machine has successfully parsed the intent and is provisioning the required infrastructure state.</p>
            </div>
          </div>
        )}

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
              <FileJson className="w-4 h-4" />
              connectivity-request.yaml
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            </div>
          </div>
          <textarea
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            className="flex-1 w-full bg-slate-900 text-cyan-300 font-mono text-sm p-6 focus:outline-none resize-none"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};

export default IntentManifests;
