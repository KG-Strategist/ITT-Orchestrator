import React, { useState, useEffect } from 'react';
import {
  Key, Database, Link, Plus, ShieldCheck, Server, Search,
  MessageSquare, Terminal, Loader2, Shield, Globe, Fingerprint,
  Network, Cpu, Radio, ChevronRight, Trash2, Edit3, Check, X,
  Plug, Cable, Lock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOrchestratorStore } from '../store/orchestratorStore';

// ── Types ────────────────────────────────────────────────────────────────────
interface IdentityProviderConfig {
  id: string;
  name: string;
  protocol: 'OIDC' | 'SAML';
  issuerUrl: string;
  clientId: string;
  clientSecretVaultPath: string;
  samlMetadataUrl?: string;
  status: 'connected' | 'pending' | 'error';
}

interface ProtocolAdapterConfig {
  id: string;
  name: string;
  type: 'Kafka' | 'IBM MQ' | 'ISO 8583' | 'RabbitMQ';
  brokerUrl: string;
  port: string;
  channel?: string;
  topicPrefix?: string;
  status: 'connected' | 'pending' | 'error';
}

// ── Pill Toggle ──────────────────────────────────────────────────────────────
const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; size?: 'sm' | 'md' }> = ({ enabled, onChange, size = 'md' }) => (
  <div
    onClick={onChange}
    className={`${size === 'md' ? 'w-10 h-5' : 'w-8 h-4'} rounded-full relative cursor-pointer transition-colors ${enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}
  >
    <div className={`absolute top-0.5 ${size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} bg-white rounded-full shadow transition-all ${enabled ? 'right-0.5' : 'left-0.5'}`} />
  </div>
);

// ── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    scanning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status as keyof typeof colors] || colors.pending}`}>
      {status}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Integrations: React.FC = () => {
  const { hasAccess } = useAuthStore();
  const { integrations, addIntegration, isScanning, fetchIntegrations } = useOrchestratorStore();

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<'identity' | 'protocols' | 'datasources' | 'meshes'>('identity');

  // ── Identity Providers State ──
  const [idpList, setIdpList] = useState<IdentityProviderConfig[]>([]);
  const [showIdpForm, setShowIdpForm] = useState(false);
  const [idpForm, setIdpForm] = useState<Partial<IdentityProviderConfig>>({
    protocol: 'OIDC',
    name: '',
    issuerUrl: '',
    clientId: '',
    clientSecretVaultPath: '',
    samlMetadataUrl: '',
  });

  // ── Protocol Adapters State ──
  const [adapterList, setAdapterList] = useState<ProtocolAdapterConfig[]>([]);
  const [showAdapterForm, setShowAdapterForm] = useState(false);
  const [adapterForm, setAdapterForm] = useState<Partial<ProtocolAdapterConfig>>({
    type: 'Kafka',
    name: '',
    brokerUrl: '',
    port: '9092',
    channel: '',
    topicPrefix: '',
  });

  // ── Existing Meshes State ──
  interface MeshConfig {
    id: string;
    name: string;
    type: 'Cilium' | 'Istio Ambient';
    apiEndpoint: string;
    credentialsVaultPath: string;
    status: 'connected' | 'pending';
  }
  const [meshList, setMeshList] = useState<MeshConfig[]>([]);
  const [showMeshForm, setShowMeshForm] = useState(false);
  const [meshForm, setMeshForm] = useState<Partial<MeshConfig>>({
    type: 'Cilium',
    name: '',
    apiEndpoint: '',
    credentialsVaultPath: '',
  });

  // ── Legacy Modal (Data Sources) ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Database');
  const [integrationName, setIntegrationName] = useState('');
  const [specificPlugin, setSpecificPlugin] = useState('Oracle RDBMS');
  const [vaultPath, setVaultPath] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // ── Identity Provider Handlers ──
  const handleSaveIdp = () => {
    if (!idpForm.name || !idpForm.issuerUrl || !idpForm.clientId) {
      return;
    }
    const newIdp: IdentityProviderConfig = {
      id: `idp-${Date.now()}`,
      name: idpForm.name || '',
      protocol: idpForm.protocol as 'OIDC' | 'SAML',
      issuerUrl: idpForm.issuerUrl || '',
      clientId: idpForm.clientId || '',
      clientSecretVaultPath: idpForm.clientSecretVaultPath || '',
      samlMetadataUrl: idpForm.samlMetadataUrl,
      status: 'pending',
    };
    setIdpList(prev => [...prev, newIdp]);
    setShowIdpForm(false);
    setIdpForm({ protocol: 'OIDC', name: '', issuerUrl: '', clientId: '', clientSecretVaultPath: '', samlMetadataUrl: '' });
    // Simulate connection test
    setTimeout(() => {
      setIdpList(prev => prev.map(p => p.id === newIdp.id ? { ...p, status: 'connected' } : p));
    }, 2000);
  };

  const handleDeleteIdp = (id: string) => {
    setIdpList(prev => prev.filter(p => p.id !== id));
  };

  // ── Protocol Adapter Handlers ──
  const handleSaveAdapter = () => {
    if (!adapterForm.name || !adapterForm.brokerUrl || !adapterForm.port) {
      return;
    }
    const newAdapter: ProtocolAdapterConfig = {
      id: `adapter-${Date.now()}`,
      name: adapterForm.name || '',
      type: adapterForm.type as ProtocolAdapterConfig['type'],
      brokerUrl: adapterForm.brokerUrl || '',
      port: adapterForm.port || '',
      channel: adapterForm.channel,
      topicPrefix: adapterForm.topicPrefix,
      status: 'pending',
    };
    setAdapterList(prev => [...prev, newAdapter]);
    setShowAdapterForm(false);
    setAdapterForm({ type: 'Kafka', name: '', brokerUrl: '', port: '9092', channel: '', topicPrefix: '' });
    setTimeout(() => {
      setAdapterList(prev => prev.map(a => a.id === newAdapter.id ? { ...a, status: 'connected' } : a));
    }, 2000);
  };

  const handleDeleteAdapter = (id: string) => {
    setAdapterList(prev => prev.filter(a => a.id !== id));
  };

  // ── Mesh Handlers ──
  const handleSaveMesh = () => {
    if (!meshForm.name || !meshForm.apiEndpoint || !meshForm.credentialsVaultPath) return;
    const newMesh: MeshConfig = {
      id: `mesh-${Date.now()}`,
      name: meshForm.name || '',
      type: meshForm.type as MeshConfig['type'],
      apiEndpoint: meshForm.apiEndpoint || '',
      credentialsVaultPath: meshForm.credentialsVaultPath || '',
      status: 'pending',
    };
    setMeshList(prev => [...prev, newMesh]);
    setShowMeshForm(false);
    setMeshForm({ type: 'Cilium', name: '', apiEndpoint: '', credentialsVaultPath: '' });
    setTimeout(() => {
      setMeshList(prev => prev.map(m => m.id === newMesh.id ? { ...m, status: 'connected' } : m));
    }, 2500);
  };
  const handleDeleteMesh = (id: string) => setMeshList(prev => prev.filter(m => m.id !== id));

  // ── Data Source Handler ──
  const handleSave = async () => {
    if (!integrationName || !vaultPath) {
      alert("Please fill in all required fields.");
      return;
    }
    setShowAddModal(false);
    await addIntegration({
      name: integrationName,
      type: selectedType,
      subtype: specificPlugin,
      vaultPath: vaultPath,
    });
  };

  // ── Tab Config ──
  const tabs = [
    { key: 'identity' as const, label: 'Identity Providers', icon: Fingerprint, color: 'text-purple-400', count: idpList.length },
    { key: 'protocols' as const, label: 'Protocol Adapters', icon: Cable, color: 'text-cyan-400', count: adapterList.length },
    { key: 'meshes' as const, label: 'Existing Meshes (eBPF)', icon: Network, color: 'text-indigo-400', count: meshList.length },
    { key: 'datasources' as const, label: 'Data Sources', icon: Database, color: 'text-amber-400', count: integrations.length },
  ];

  const portDefaults: Record<string, string> = {
    'Kafka': '9092',
    'IBM MQ': '1414',
    'ISO 8583': '8583',
    'RabbitMQ': '5672',
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Plug className="w-8 h-8 text-cyan-500" />
              Extensibility Marketplace
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Configure identity providers, legacy protocol adapters, and data source connections — no code required.
            </p>
          </div>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${activeTab === tab.key
                ? `${tab.color} border-current bg-slate-100 dark:bg-slate-900/50`
                : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: IDENTITY PROVIDERS (OIDC / SAML 2.0)
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">
                Connect your corporate SSO (Okta, PingIdentity, Azure AD, Keycloak) for zero-trust identity mediation.
              </p>
              <button
                onClick={() => setShowIdpForm(true)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center gap-2 hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Add Provider
              </button>
            </div>

            {/* Provider Cards */}
            {idpList.length === 0 && !showIdpForm && (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No identity providers configured</p>
                <p className="text-slate-600 text-sm mt-1">Add an OIDC or SAML 2.0 provider to enable SSO</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {idpList.map(idp => (
                <div key={idp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-purple-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      {idp.protocol === 'OIDC' ? <Globe className="w-5 h-5 text-purple-400" /> : <Shield className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={idp.status} />
                      <button onClick={() => handleDeleteIdp(idp.id)} className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{idp.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3">{idp.protocol} • {new URL(idp.issuerUrl).hostname}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Client ID</span>
                      <span className="text-slate-300 font-mono truncate max-w-[140px]">{idp.clientId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Secret Vault</span>
                      <span className="text-emerald-400 font-mono truncate max-w-[140px]">{idp.clientSecretVaultPath || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Add Identity Provider Form (Slide) ── */}
            {showIdpForm && (
              <div className="bg-white dark:bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-purple-400" /> Configure Identity Provider
                  </h3>
                  <button onClick={() => setShowIdpForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Provider Name</label>
                    <input
                      type="text"
                      value={idpForm.name}
                      onChange={e => setIdpForm({ ...idpForm, name: e.target.value })}
                      placeholder="e.g., Corporate Okta"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Protocol</label>
                    <select
                      value={idpForm.protocol}
                      onChange={e => setIdpForm({ ...idpForm, protocol: e.target.value as 'OIDC' | 'SAML' })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    >
                      <option value="OIDC">OpenID Connect (OIDC)</option>
                      <option value="SAML">SAML 2.0</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issuer URL</label>
                  <input
                    type="url"
                    value={idpForm.issuerUrl}
                    onChange={e => setIdpForm({ ...idpForm, issuerUrl: e.target.value })}
                    placeholder={idpForm.protocol === 'OIDC' ? 'https://your-org.okta.com/oauth2/default' : 'https://your-org.okta.com/app/metadata'}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Client ID</label>
                    <input
                      type="text"
                      value={idpForm.clientId}
                      onChange={e => setIdpForm({ ...idpForm, clientId: e.target.value })}
                      placeholder="0oa1234567890abcdef"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Client Secret (Vault Path)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                      <input
                        type="text"
                        value={idpForm.clientSecretVaultPath}
                        onChange={e => setIdpForm({ ...idpForm, clientSecretVaultPath: e.target.value })}
                        placeholder="secret/data/prod/okta/client-secret"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-lg p-3 pl-10 text-sm text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {idpForm.protocol === 'SAML' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SAML Metadata URL</label>
                    <input
                      type="url"
                      value={idpForm.samlMetadataUrl}
                      onChange={e => setIdpForm({ ...idpForm, samlMetadataUrl: e.target.value })}
                      placeholder="https://your-org.okta.com/app/exk1234/sso/saml/metadata"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-mono"
                    />
                  </div>
                )}

                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <p className="text-xs text-purple-300 leading-relaxed">
                    <strong className="text-purple-400">Zero-Trust Policy:</strong> Client secrets are never stored in the frontend or database. The Orchestrator fetches them from HashiCorp Vault at runtime via the Sandwich Pattern.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowIdpForm(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
                  <button
                    onClick={handleSaveIdp}
                    disabled={!idpForm.name || !idpForm.issuerUrl || !idpForm.clientId}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-bold transition-colors shadow-[0_0_12px_rgba(147,51,234,0.3)] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Provider
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: PROTOCOL ADAPTERS (Kafka / IBM MQ / ISO 8583 / RabbitMQ)
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'protocols' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">
                Connect legacy message queues and protocol switches for the Sovereign Sidecar sandwich pattern.
              </p>
              <button
                onClick={() => setShowAdapterForm(true)}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Add Adapter
              </button>
            </div>

            {adapterList.length === 0 && !showAdapterForm && (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Cable className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No protocol adapters configured</p>
                <p className="text-slate-600 text-sm mt-1">Connect to Kafka, IBM MQ, ISO 8583, or RabbitMQ</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {adapterList.map(adapter => (
                <div key={adapter.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-cyan-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                      {adapter.type === 'Kafka' ? <Radio className="w-5 h-5 text-cyan-400" /> :
                        adapter.type === 'IBM MQ' ? <MessageSquare className="w-5 h-5 text-cyan-400" /> :
                          adapter.type === 'ISO 8583' ? <Network className="w-5 h-5 text-cyan-400" /> :
                            <MessageSquare className="w-5 h-5 text-cyan-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={adapter.status} />
                      <button onClick={() => handleDeleteAdapter(adapter.id)} className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{adapter.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3">{adapter.type} • {adapter.brokerUrl}:{adapter.port}</p>
                  <div className="space-y-2 text-xs">
                    {adapter.channel && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Channel</span>
                        <span className="text-slate-300 font-mono">{adapter.channel}</span>
                      </div>
                    )}
                    {adapter.topicPrefix && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Topic Prefix</span>
                        <span className="text-slate-300 font-mono">{adapter.topicPrefix}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Add Protocol Adapter Form ── */}
            {showAdapterForm && (
              <div className="bg-white dark:bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Cable className="w-5 h-5 text-cyan-400" /> Configure Protocol Adapter
                  </h3>
                  <button onClick={() => setShowAdapterForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Connection Name</label>
                    <input
                      type="text"
                      value={adapterForm.name}
                      onChange={e => setAdapterForm({ ...adapterForm, name: e.target.value })}
                      placeholder="e.g., Mainframe MQ Bridge"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Protocol Type</label>
                    <select
                      value={adapterForm.type}
                      onChange={e => {
                        const type = e.target.value as ProtocolAdapterConfig['type'];
                        setAdapterForm({ ...adapterForm, type, port: portDefaults[type] || '9092' });
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    >
                      <option value="Kafka">Apache Kafka</option>
                      <option value="IBM MQ">IBM MQ</option>
                      <option value="ISO 8583">ISO 8583 (TCP Switch)</option>
                      <option value="RabbitMQ">RabbitMQ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Broker URL / Host</label>
                    <input
                      type="text"
                      value={adapterForm.brokerUrl}
                      onChange={e => setAdapterForm({ ...adapterForm, brokerUrl: e.target.value })}
                      placeholder={adapterForm.type === 'Kafka' ? 'kafka.internal.bank.com' : 'mq.internal.bank.com'}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Port</label>
                    <input
                      type="text"
                      value={adapterForm.port}
                      onChange={e => setAdapterForm({ ...adapterForm, port: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {(adapterForm.type === 'IBM MQ') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Channel Name</label>
                    <input
                      type="text"
                      value={adapterForm.channel}
                      onChange={e => setAdapterForm({ ...adapterForm, channel: e.target.value })}
                      placeholder="SYSTEM.DEF.SVRCONN"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
                    />
                  </div>
                )}

                {(adapterForm.type === 'Kafka' || adapterForm.type === 'RabbitMQ') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Topic / Queue Prefix</label>
                    <input
                      type="text"
                      value={adapterForm.topicPrefix}
                      onChange={e => setAdapterForm({ ...adapterForm, topicPrefix: e.target.value })}
                      placeholder={adapterForm.type === 'Kafka' ? 'aml.txn.' : 'transactions.'}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
                    />
                  </div>
                )}

                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <p className="text-xs text-cyan-300 leading-relaxed">
                    <strong className="text-cyan-400">Sandwich Pattern:</strong> Credentials for {adapterForm.type} will be fetched from HashiCorp Vault at runtime. The adapter runs inside the Sovereign Sidecar for Zone 2 legacy isolation.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowAdapterForm(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
                  <button
                    onClick={handleSaveAdapter}
                    disabled={!adapterForm.name || !adapterForm.brokerUrl}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-bold transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Adapter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2.5: EXISTING MESHES (eBPF Cilium / Istio Ambient)
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'meshes' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Attach existing Cilium or Istio Ambient meshes to orchestrate policies without provisioning new sidecars.</p>
              </div>
              <button
                onClick={() => setShowMeshForm(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2 hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Attach Mesh
              </button>
            </div>

            {meshList.length === 0 && !showMeshForm && (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Network className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No external meshes attached</p>
                <p className="text-slate-600 text-sm mt-1">Connect to an existing eBPF deployment for policy management</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {meshList.map(mesh => (
                <div key={mesh.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-indigo-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <Network className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={mesh.status} />
                      <button onClick={() => handleDeleteMesh(mesh.id)} className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{mesh.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3">{mesh.type} • {mesh.apiEndpoint}</p>
                </div>
              ))}
            </div>

            {/* Mesh Add Form */}
            {showMeshForm && (
              <div className="bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-lg space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-400" /> Attach eBPF Mesh
                  </h3>
                  <button onClick={() => setShowMeshForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cluster / Mesh Name</label>
                    <input
                      type="text"
                      value={meshForm.name}
                      onChange={e => setMeshForm({ ...meshForm, name: e.target.value })}
                      placeholder="e.g., Prod EKS Cilium"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deployment Type</label>
                    <select
                      value={meshForm.type}
                      onChange={e => setMeshForm({ ...meshForm, type: e.target.value as MeshConfig['type'] })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="Cilium">Cilium (eBPF)</option>
                      <option value="Istio Ambient">Istio Ambient Mesh (ztunnel)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Control Plane API Endpoint / Kubeconfig Host</label>
                  <input
                    type="url"
                    value={meshForm.apiEndpoint}
                    onChange={e => setMeshForm({ ...meshForm, apiEndpoint: e.target.value })}
                    placeholder="https://cilium.api.internal:6443"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Account / Kubeconfig (Vault Path)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={meshForm.credentialsVaultPath}
                      onChange={e => setMeshForm({ ...meshForm, credentialsVaultPath: e.target.value })}
                      placeholder="secret/data/k8s/cilium-service-account"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-lg p-3 pl-10 text-sm text-emerald-400 focus:border-emerald-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowMeshForm(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
                  <button
                    onClick={handleSaveMesh}
                    disabled={!meshForm.name || !meshForm.apiEndpoint || !meshForm.credentialsVaultPath}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-bold transition-colors shadow-[0_0_12px_rgba(79,70,229,0.3)] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Mesh
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: DATA SOURCES (Existing Integration Cards)
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'datasources' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">
                Manage data source connections, message queues, and HashiCorp Vault credential injection.
              </p>
              <button
                onClick={() => {
                  if (hasAccess('All')) {
                    setShowAddModal(true);
                  } else {
                    alert("Permission Denied: Only Super Admins can configure new integrations.");
                  }
                }}
                disabled={isScanning}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-2 hover:scale-105"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isScanning ? 'Auto-Discovering...' : 'Add Data Source'}
              </button>
            </div>

            {isScanning && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                <div>
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">TinyTransformer is scanning...</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Auto-discovering endpoints and mapping taxonomy to the Unified API Registry.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {integrations.map(integration => (
                <div key={integration.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col hover:border-amber-500/50 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 group-hover:border-amber-500/30 transition-colors">
                      {integration.type === 'Database' ? <Database className="w-5 h-5 text-cyan-500" /> :
                        integration.type === 'REST API' ? <Link className="w-5 h-5 text-fuchsia-500" /> :
                          integration.type === 'Message Queue' ? <MessageSquare className="w-5 h-5 text-amber-500" /> :
                            <Terminal className="w-5 h-5 text-indigo-500" />}
                    </div>
                    <StatusBadge status={integration.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{integration.name}</h3>
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
          </div>
        )}

        {/* ── Add Data Source Modal ──────────────────────────────────────── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" /> Data Source Configuration
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X className="w-6 h-6" />
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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plugin Category</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono"
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
                    <input type="text" placeholder="e.g., mq.internal.bank.com:1414" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono" />
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
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2"
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
