import React, { useState, useEffect } from 'react';
import { Network, ShieldCheck, Activity, Lock, Plus, Trash2, Server, Globe, Save, Cpu, HardDrive, ToggleLeft, ToggleRight, FileJson, Layers, ShieldAlert, BrainCircuit } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api, apiEndpoints } from '../api/client';

const iconMap: Record<string, any> = {
  Lock, ShieldCheck, Activity, Network, Globe, Layers, ShieldAlert, BrainCircuit
};

const defaultZones = [
  {
    id: 'zone-1',
    name: 'Zone 1: DMZ (External)',
    description: 'Public-facing ingress. Handles external API traffic, initial TLS termination, and basic WAF rules.',
    icon: 'Globe',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    ips: ['0.0.0.0/0'],
    filters: ['RateLimit_Global', 'WAF_Basic']
  },
  {
    id: 'zone-2',
    name: 'Zone 2: Internal (Core)',
    description: 'Internal microservices mesh. Strict mTLS, service-to-service authorization, and protocol transcoding.',
    icon: 'Network',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    ips: ['10.0.0.0/8'],
    filters: ['mTLS_Strict', 'ISO8583_Transcoder']
  },
  {
    id: 'zone-3',
    name: 'Zone 3: Secure (PCI/PII)',
    description: 'Highly restricted zone for sensitive data processing. Enforces DPDP masking and strict audit logging.',
    icon: 'ShieldAlert',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ips: ['10.10.0.0/16'],
    filters: ['DPDP_Masking', 'Audit_Strict']
  },
  {
    id: 'zone-4',
    name: 'Zone 4: Cognitive Edge',
    description: 'Dedicated zone for AI Agents and LLM interactions. Enforces Semantic Firewalls and Token Budgets.',
    icon: 'BrainCircuit',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ips: ['10.20.0.0/16'],
    filters: ['Semantic_Firewall', 'Token_Budget']
  }
];

const mockNodes = [
  { id: 'node-1', type: 'Envoy Proxy', ip: '10.0.1.15', status: 'Healthy', cpu: 45, mem: 60, version: '1.28.0' },
  { id: 'node-2', type: 'eBPF Sensor', ip: '10.0.1.16', status: 'Healthy', cpu: 12, mem: 25, version: '5.15.0' },
  { id: 'node-3', type: 'Envoy Proxy', ip: '10.0.1.17', status: 'Warning', cpu: 88, mem: 75, version: '1.28.0' },
];

const availablePolicies = [
  { id: 'pol-1', name: 'Block_MTI_0800_External', desc: 'Blocks external network management messages.' },
  { id: 'pol-2', name: 'Require_mTLS_Strict', desc: 'Enforces strict mTLS for all incoming connections.' },
  { id: 'pol-3', name: 'RateLimit_Global_10k', desc: 'Global rate limit of 10,000 req/sec.' },
];

const availableFilters = [
  { id: 'f-1', name: 'ISO 8583 Transcoder', enabled: true },
  { id: 'f-2', name: 'DPDP Masking', enabled: false },
  { id: 'f-3', name: 'Semantic Firewall', enabled: true },
  { id: 'f-4', name: 'GraphQL Depth Limit', enabled: false },
];

const ZoneManagement: React.FC = () => {
  const { hasAccess } = useAuthStore();
  const [zones, setZones] = useState<any[]>(defaultZones);
  const [activeZone, setActiveZone] = useState<any>(defaultZones[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'policies' | 'filters'>('overview');
  
  const [newIp, setNewIp] = useState('');
  const [newFilter, setNewFilter] = useState('');
  
  const [attachedPolicies, setAttachedPolicies] = useState<string[]>(['pol-2']);
  const [filterStates, setFilterStates] = useState(availableFilters);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const data: any = await api.get(apiEndpoints.zones.list);
        if (data && data.length > 0) {
          setZones(data);
          setActiveZone(data[0]);
        }
      } catch (e) {
        console.error("Failed to fetch zones, using defaults", e);
      }
    };
    fetchZones();
  }, []);

  const handleAddIp = () => {
    if (!hasAccess('All') && !hasAccess(activeZone.id)) {
      alert(`Permission Denied: You do not have access to modify ${activeZone.name}.`);
      return;
    }
    if (newIp) {
      const updatedZones = zones.map(z => z.id === activeZone.id ? { ...z, ips: [...z.ips, newIp] } : z);
      setZones(updatedZones);
      setActiveZone(updatedZones.find(z => z.id === activeZone.id)!);
      setNewIp('');
    }
  };

  const handleRemoveIp = (ipToRemove: string) => {
    if (!hasAccess('All') && !hasAccess(activeZone.id)) {
      alert(`Permission Denied: You do not have access to modify ${activeZone.name}.`);
      return;
    }
    const updatedZones = zones.map(z => z.id === activeZone.id ? { ...z, ips: z.ips.filter((ip: string) => ip !== ipToRemove) } : z);
    setZones(updatedZones);
    setActiveZone(updatedZones.find(z => z.id === activeZone.id)!);
  };

  const handleCreateZone = async () => {
    if (!hasAccess('All')) {
      alert("Permission Denied: Only Super Admins can create new Virtual Zones.");
      return;
    }
    const newZoneId = `zone${zones.length + 1}`;
    const newZone = {
      id: newZoneId,
      name: `Zone ${zones.length + 1}: Partner DMZ`,
      description: 'Newly created logical boundary for partner integrations.',
      icon: 'Globe',
      color: 'text-fuchsia-500',
      bg: 'bg-fuchsia-500/10',
      border: 'border-fuchsia-500/20',
      ips: ['172.16.0.0/12'],
      filters: ['Partner_Auth', 'RateLimit_Standard']
    };
    
    try {
      const savedZone = await api.post(apiEndpoints.zones.create, newZone);
      setZones([...zones, savedZone]);
      setActiveZone(savedZone);
    } catch (e) {
      console.error("Failed to create zone", e);
    }
  };

  const handleSaveZone = async () => {
    if (!hasAccess('All') && !hasAccess(activeZone.id)) {
      alert(`Permission Denied: You do not have CRUD access to ${activeZone.name}.`);
      return;
    }
    try {
      await api.put(apiEndpoints.zones.list, activeZone);
      alert("Zone configuration saved successfully");
    } catch (e) {
      console.error("Failed to save zone", e);
      alert("Failed to save zone configuration.");
    }
  };

  const togglePolicy = (id: string) => {
    setAttachedPolicies(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleFilter = (id: string) => {
    setFilterStates(prev => 
      prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f)
    );
  };

  if (!activeZone) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Network className="w-8 h-8 text-indigo-500" />
                Adaptive Gateway Fabric (AGF)
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Manage logical trust zones, IP whitelisting, and Wasm filter attachments.</p>
            </div>
            {hasAccess('All') && (
              <button 
                onClick={handleCreateZone}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2 hover:scale-105"
              >
                <Plus className="w-5 h-5" /> Create New Virtual Zone
              </button>
            )}
          </div>
          <div className="p-8 text-center text-slate-500">
            No zones configured. Create a new Virtual Zone to get started.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Network className="w-8 h-8 text-indigo-500" />
              Adaptive Gateway Fabric (AGF)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage logical trust zones, IP whitelisting, and Wasm filter attachments.</p>
          </div>
          {hasAccess('All') && (
            <button 
              onClick={handleCreateZone}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2 hover:scale-105"
            >
              <Plus className="w-5 h-5" /> Create New Virtual Zone
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Zone Selector */}
          <div className="lg:col-span-1 space-y-4">
            {zones.map((zone) => {
              const Icon = iconMap[zone.icon] || Network;
              const isActive = activeZone.id === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => { setActiveZone(zone); setActiveTab('overview'); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isActive 
                      ? `${zone.bg || 'bg-indigo-500/10'} ${zone.border || 'border-indigo-500/20'} ring-1 ring-inset ring-${(zone.color || 'text-indigo-500').split('-')[1]}-500` 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${isActive ? (zone.color || 'text-indigo-500') : 'text-slate-400'}`} />
                    <span className={`font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {zone.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2">{zone.description}</p>
                </button>
              );
            })}
          </div>

          {/* Active Zone Configuration */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className={`p-4 rounded-xl ${activeZone.bg || 'bg-indigo-500/10'}`}>
                  {React.createElement(iconMap[activeZone.icon] || Network, { className: `w-8 h-8 ${activeZone.color || 'text-indigo-500'}` })}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activeZone.name}</h2>
                  <p className="text-slate-500 dark:text-slate-400">{activeZone.description}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                {[
                  { id: 'overview', label: 'Overview', icon: Globe },
                  { id: 'nodes', label: 'Data Plane Nodes', icon: Server },
                  { id: 'policies', label: 'Policy Binding (OPA)', icon: FileJson },
                  { id: 'filters', label: 'Filter Management', icon: ShieldCheck },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 px-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id 
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content: Overview */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* IP Whitelisting */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-400" /> Ingress CIDR Whitelist
                    </h3>
                    <div className="space-y-3 mb-4">
                      {activeZone.ips.map((ip: string) => (
                        <div key={ip} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                          <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{ip}</span>
                          <button onClick={() => handleRemoveIp(ip)} className="text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        placeholder="e.g., 10.3.0.0/16" 
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <button onClick={handleAddIp} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors">
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" /> Zone Telemetry
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center">
                      <span className="text-sm text-slate-500">Active Nodes</span>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">3</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center">
                      <span className="text-sm text-slate-500">Req/Sec</span>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">1,240</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center">
                      <span className="text-sm text-slate-500">Avg Latency</span>
                      <span className="font-bold text-lg text-emerald-500">12ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Data Plane Nodes */}
              {activeTab === 'nodes' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Connected Execution Nodes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Node ID</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">CPU / Mem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {mockNodes.map(node => (
                          <tr key={node.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4 font-mono text-sm text-slate-900 dark:text-white">{node.id}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{node.type}</td>
                            <td className="py-3 px-4 font-mono text-sm text-slate-600 dark:text-slate-400">{node.ip}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                node.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                              }`}>
                                {node.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Cpu className="w-3 h-3" /> {node.cpu}%
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <HardDrive className="w-3 h-3" /> {node.mem}%
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content: Policy Binding */}
              {activeTab === 'policies' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">OPA Policy Binding</h3>
                  <div className="space-y-4">
                    {availablePolicies.map(policy => {
                      const isAttached = attachedPolicies.includes(policy.id);
                      return (
                        <div key={policy.id} className={`flex items-start justify-between p-4 rounded-xl border transition-colors ${
                          isAttached ? 'bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white font-mono text-sm">{policy.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">{policy.desc}</p>
                          </div>
                          <button 
                            onClick={() => togglePolicy(policy.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isAttached 
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isAttached ? 'Detach' : 'Attach'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab Content: Filter Management */}
              {activeTab === 'filters' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Wasm Filter Toggles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterStates.map(filter => (
                      <div key={filter.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <span className="font-medium text-slate-900 dark:text-white">{filter.name}</span>
                        <button onClick={() => toggleFilter(filter.id)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                          {filter.enabled ? (
                            <ToggleRight className="w-8 h-8 text-indigo-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={handleSaveZone}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Zone Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneManagement;
