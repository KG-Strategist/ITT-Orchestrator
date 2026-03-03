import React, { useState, useEffect } from 'react';
import { Key, Database, Link, Plus, ShieldCheck, Server, Search, MessageSquare, Terminal, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOrchestratorStore } from '../store/orchestratorStore';

const Integrations: React.FC = () => {
  const { hasAccess } = useAuthStore();
  const { integrations, addIntegration, isScanning, fetchIntegrations } = useOrchestratorStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Database');
  const [integrationName, setIntegrationName] = useState('');
  const [specificPlugin, setSpecificPlugin] = useState('Oracle RDBMS');
  const [vaultPath, setVaultPath] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleSave = async () => {
    if (!integrationName || !vaultPath) {
      alert("Please fill in all required fields.");
      return;
    }
    
    setShowAddModal(false);
    
    // Trigger the auto-discovery process
    await addIntegration({
      name: integrationName,
      type: selectedType,
      subtype: specificPlugin,
      vaultPath: vaultPath
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Key className="w-8 h-8 text-emerald-500" />
              Integrations & Vault
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage data source connections, message queues, and HashiCorp Vault credential injection.</p>
          </div>
          <button 
            onClick={() => {
              if (hasAccess('All')) {
                setShowAddModal(true);
              } else {
                alert("Permission Denied: Only Super Admins can configure new integrations.");
              }
            }}
            disabled={isScanning}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 hover:scale-105"
          >
            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} 
            {isScanning ? 'Auto-Discovering...' : 'Add Integration'}
          </button>
        </div>

        {isScanning && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            <div>
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">TinyTransformer is scanning...</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Auto-discovering endpoints and mapping taxonomy to the Unified API Registry.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map(integration => (
            <div key={integration.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col hover:border-emerald-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 group-hover:border-emerald-500/30 transition-colors">
                  {integration.type === 'Database' ? <Database className="w-6 h-6 text-cyan-500" /> : 
                   integration.type === 'REST API' ? <Link className="w-6 h-6 text-fuchsia-500" /> : 
                   integration.type === 'Message Queue' ? <MessageSquare className="w-6 h-6 text-amber-500" /> :
                   <Terminal className="w-6 h-6 text-indigo-500" />}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  integration.status === 'connected' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                  integration.status === 'scanning' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 animate-pulse' :
                  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                }`}>
                  {integration.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{integration.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-mono">{integration.type} • {integration.subtype}</p>
              
              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Vault Path (Sandwich Pattern)
                </p>
                <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono border border-slate-200 dark:border-slate-800 truncate">
                  {integration.vaultPath}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Integration Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Plugin Configuration Builder
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Integration Name</label>
                    <input 
                      type="text" 
                      value={integrationName}
                      onChange={(e) => setIntegrationName(e.target.value)}
                      placeholder="e.g., Mainframe MQ" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plugin Category</label>
                    <select 
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Database">Database Connectors</option>
                      <option value="Message Queue">Message Queues</option>
                      <option value="Protocol Transcoder">Protocol Transcoders</option>
                      <option value="REST API">REST API Connectors</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Specific Plugin</label>
                    <select 
                      value={specificPlugin}
                      onChange={(e) => setSpecificPlugin(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                    >
                      {selectedType === 'Database' && (
                        <>
                          <option>Oracle RDBMS</option>
                          <option>PostgreSQL</option>
                          <option>MongoDB</option>
                          <option>Snowflake</option>
                        </>
                      )}
                      {selectedType === 'Message Queue' && (
                        <>
                          <option>IBM MQ</option>
                          <option>Apache Kafka</option>
                          <option>Solace PubSub+</option>
                          <option>RabbitMQ</option>
                        </>
                      )}
                      {selectedType === 'Protocol Transcoder' && (
                        <>
                          <option>ISO 8583 (TCP Bitmap)</option>
                          <option>FIX (Financial Info eXchange L4)</option>
                          <option>gRPC</option>
                          <option>SOAP / XML-RPC</option>
                        </>
                      )}
                      {selectedType === 'REST API' && (
                        <>
                          <option>OAuth2 Client Credentials</option>
                          <option>API Key Auth</option>
                          <option>Mutual TLS (mTLS)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Host / Endpoint</label>
                    <input type="text" placeholder="e.g., mq.internal.bank.com:1414" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono" />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Secure Credential Injection (Sandwich Pattern)</h3>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300/80 leading-relaxed">
                    Plaintext passwords are strictly prohibited. The Orchestrator will dynamically fetch credentials from HashiCorp Vault at runtime, inject them into the request, and immediately drop them from memory.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-2">HashiCorp Vault Path</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                      <input 
                        type="text" 
                        value={vaultPath}
                        onChange={(e) => setVaultPath(e.target.value)}
                        placeholder="secret/data/prod/..." 
                        className="w-full bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/50 rounded-lg p-3 pl-10 text-sm text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-4 shrink-0">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2"
                >
                  <Key className="w-4 h-4" /> Save Integration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Integrations;
