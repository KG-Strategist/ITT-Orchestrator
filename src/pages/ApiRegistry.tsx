import React, { useState, useEffect } from 'react';
import { Layers, Search, Plus, Trash2, Shield, Link2, Activity, Database, Smartphone, Network, Globe } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOrchestratorStore, ApiCategory, API_Registry_Object } from '../store/orchestratorStore';
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';

const ApiRegistry: React.FC = () => {
  const { hasAccess } = useAuthStore();
  const { apiRegistry, fetchApiRegistry, deleteApi } = useOrchestratorStore();
  
  const [activeTab, setActiveTab] = useState<ApiCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'topology'>('table');

  useEffect(() => {
    fetchApiRegistry();
  }, [fetchApiRegistry]);

  const filteredApis = apiRegistry.filter(api => 
    (activeTab === 'all' || api.category === activeTab) &&
    (api.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     api.semanticTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleDelete = async (id: string) => {
    if (hasAccess('All')) {
      await deleteApi(id);
    } else {
      alert("Permission Denied: Only Super Admins can delete APIs from the registry.");
    }
  };

  // Generate React Flow nodes and edges for Topology View
  const generateTopology = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Layout positioning logic based on category
    const yOffsets = { experience: 100, process: 300, system: 500 };
    const xOffsets = { experience: 0, process: 0, system: 0 };

    apiRegistry.forEach((api) => {
      const x = 250 + (xOffsets[api.category] * 250);
      xOffsets[api.category]++;
      
      nodes.push({
        id: api.id,
        position: { x, y: yOffsets[api.category] },
        data: { 
          label: (
            <div className="p-2 flex flex-col items-center text-center">
              <div className={`p-2 rounded-lg mb-2 ${
                api.category === 'system' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400' :
                api.category === 'process' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' :
                'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-400'
              }`}>
                {api.category === 'system' ? <Database className="w-5 h-5" /> : 
                 api.category === 'process' ? <Activity className="w-5 h-5" /> : 
                 <Smartphone className="w-5 h-5" />}
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-white">{api.name}</span>
              <span className="text-[10px] text-slate-500 mt-1">{api.authProtocol}</span>
            </div>
          )
        },
        style: {
          background: 'var(--tw-colors-slate-900)',
          border: '1px solid var(--tw-colors-slate-800)',
          borderRadius: '12px',
          color: 'white',
          width: 180,
        }
      });

      api.dependsOn.forEach(depId => {
        edges.push({
          id: `e-${api.id}-${depId}`,
          source: api.id,
          target: depId,
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 }
        });
      });
    });

    return { nodes, edges };
  };

  const { nodes, edges } = generateTopology();

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8 text-fuchsia-500" />
              Unified API Registry
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Auto-discovered enterprise taxonomy managed by TinyTransformer.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex">
              <button 
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Table View
              </button>
              <button 
                onClick={() => setViewMode('topology')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'topology' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Network className="w-4 h-4" /> Topology
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  All APIs
                </button>
                <button 
                  onClick={() => setActiveTab('system')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'system' ? 'bg-white dark:bg-slate-900 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Building Block (System)
                </button>
                <button 
                  onClick={() => setActiveTab('process')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'process' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Process / Product
                </button>
                <button 
                  onClick={() => setActiveTab('experience')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'experience' ? 'bg-white dark:bg-slate-900 shadow-sm text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Experience (BFF)
                </button>
              </div>
              
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search APIs or tags..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">API Name</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Spec Link</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Semantic Tags</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Auth Protocol</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredApis.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No APIs found in this category. Configure an Integration to auto-discover APIs.
                      </td>
                    </tr>
                  ) : (
                    filteredApis.map((api) => (
                      <tr key={api.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              api.category === 'system' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400' :
                              api.category === 'process' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' :
                              'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-400'
                            }`}>
                              {api.category === 'system' ? <Database className="w-4 h-4" /> : 
                               api.category === 'process' ? <Activity className="w-4 h-4" /> : 
                               <Smartphone className="w-4 h-4" />}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{api.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-sm hover:underline cursor-pointer">
                            <Link2 className="w-4 h-4" />
                            {api.specLink}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {api.semanticTags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs border border-slate-200 dark:border-slate-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            {api.authProtocol}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            api.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                            api.status === 'Degraded' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                            'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                          }`}>
                            {api.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDelete(api.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden h-[600px] relative">
            <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 rounded-xl">
              <h3 className="text-white font-bold text-sm mb-2">Knowledge Graph (Neo4j)</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-fuchsia-500"></div> Experience APIs</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Process APIs</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div> System APIs</div>
              </div>
            </div>
            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              fitView
              className="bg-slate-950"
            >
              <Background color="#334155" gap={16} />
              <Controls className="bg-slate-800 border-slate-700 fill-white" />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiRegistry;
