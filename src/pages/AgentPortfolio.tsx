import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Plus, Search, MoreVertical, Edit, Trash2, Play } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const initialAgents = [
  { id: '1', name: 'Project Aurora (AML)', domain: 'Compliance', status: 'Active', lastDeployed: '2 hours ago', zone: 'Zone 4: Cognitive Edge' },
  { id: '2', name: 'KYC Verification Agent', domain: 'Onboarding', status: 'Active', lastDeployed: '5 hours ago', zone: 'Zone 2: Core Guard' },
  { id: '3', name: 'Legacy Mainframe Bridge', domain: 'Core Banking', status: 'Active', lastDeployed: '1 day ago', zone: 'Zone 1: Fortress' },
  { id: '4', name: 'Fraud Detection Copilot', domain: 'Risk', status: 'Draft', lastDeployed: '-', zone: 'Zone 4: Cognitive Edge' },
];

const AgentPortfolio: React.FC = () => {
  const navigate = useNavigate();
  const { hasAccess } = useAuthStore();
  const [agents, setAgents] = useState(initialAgents);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (hasAccess('All') || hasAccess('Zone4')) { // Simplified check for demo
      setAgents(agents.filter(a => a.id !== id));
    } else {
      alert("Permission Denied: You do not have CRUD access to delete this agent.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Network className="w-8 h-8 text-cyan-500" />
              Agent Portfolio
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage and monitor all enterprise micro-agents and semantic firewalls.</p>
          </div>
          <button 
            onClick={() => navigate('/agent-builder/new')}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 hover:scale-105"
          >
            <Plus className="w-5 h-5" /> Create New Agent
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search agents by name or domain..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Agent Name</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Domain</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Last Deployed</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Gateway Zone</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <Network className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="cursor-pointer hover:text-cyan-500 transition-colors" onClick={() => navigate(`/agent-builder/${agent.id}`)}>
                        {agent.name}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{agent.domain}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        agent.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                          : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{agent.lastDeployed}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{agent.zone}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/agent-builder/${agent.id}`)}
                          className="p-2 text-slate-400 hover:text-cyan-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Canvas"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(agent.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No agents found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPortfolio;
