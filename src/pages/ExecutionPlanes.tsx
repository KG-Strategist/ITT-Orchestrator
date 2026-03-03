import React, { useState } from 'react';
import { Server, Activity, Cpu, HardDrive, Play, Square, RefreshCw, Plus } from 'lucide-react';

const ExecutionPlanes: React.FC = () => {
  const [nodes, setNodes] = useState([
    { id: 'envoy-edge-01', type: 'Envoy Proxy', zone: 'Zone 1 (DMZ)', status: 'Running', cpu: '45%', memory: '1.2GB', uptime: '14d 2h' },
    { id: 'f5-dmz-01', type: 'F5 BIG-IP', zone: 'Zone 1 (DMZ)', status: 'Running', cpu: '60%', memory: '4.5GB', uptime: '45d 12h' },
    { id: 'ebpf-sidecar-01', type: 'eBPF Sovereign Sidecar', zone: 'Zone 4 (Cognitive Edge)', status: 'Running', cpu: '12%', memory: '250MB', uptime: '2d 5h' },
    { id: 'envoy-internal-01', type: 'Envoy Proxy', zone: 'Zone 2 (Internal)', status: 'Stopped', cpu: '0%', memory: '0MB', uptime: '0d 0h' },
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Server className="w-8 h-8 text-indigo-500" />
              Execution Plane Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Deploy and manage gateway engines (Envoy, F5, eBPF) across Virtual Trust Zones.</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Provision Node
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {nodes.map((node) => (
            <div key={node.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{node.id}</h3>
                  <p className="text-xs text-slate-500 mt-1">{node.type}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${node.status === 'Running' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'Running' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  {node.status}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Zone</span>
                  <span className="font-medium text-slate-900 dark:text-white">{node.zone}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <Cpu className="w-3 h-3" /> CPU
                    </div>
                    <div className="font-mono text-sm text-slate-900 dark:text-white">{node.cpu}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <HardDrive className="w-3 h-3" /> Memory
                    </div>
                    <div className="font-mono text-sm text-slate-900 dark:text-white">{node.memory}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Uptime
                  </div>
                  <span className="font-mono">{node.uptime}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                {node.status === 'Running' ? (
                  <>
                    <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
                      <RefreshCw className="w-3 h-3" /> Restart
                    </button>
                    <button className="flex-1 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  </>
                ) : (
                  <button className="w-full py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
                    <Play className="w-3 h-3" /> Start Node
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutionPlanes;
