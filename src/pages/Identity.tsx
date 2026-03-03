import React, { useState } from 'react';
import { ShieldCheck, Server, Users, Key, CheckCircle2, XCircle, Clock } from 'lucide-react';

const Identity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sso' | 'rbac' | 'pam'>('sso');

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
            Identity & Access Management (UAM)
          </h1>
          <p className="text-slate-400 mt-2">Manage SSO integrations, Role-Based Access Control, and Privileged Access Management.</p>
        </div>

        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('sso')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'sso' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            SSO Providers
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'rbac' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            RBAC Matrix
          </button>
          <button
            onClick={() => setActiveTab('pam')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'pam' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Privileged Access Requests
          </button>
        </div>

        {activeTab === 'sso' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-slate-400" /> Configure Identity Provider
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Provider Type</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none">
                      <option>SAML 2.0 (Azure AD)</option>
                      <option>OIDC (PingIdentity)</option>
                      <option>OAuth2 (Okta)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Metadata URL</label>
                    <input type="text" placeholder="https://login.microsoftonline.com/.../federationmetadata.xml" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client ID / Entity ID</label>
                    <input type="text" placeholder="spn:12345678-abcd-..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Secret (Vault Path)</label>
                    <input type="text" placeholder="secret/data/prod/sso/client_secret" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(217,119,6,0.4)]">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rbac' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" /> Role-Permission Matrix
                </h2>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">
                  + Add Role
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-4 font-medium">Permission</th>
                      <th className="p-4 font-medium text-center">Super Admin</th>
                      <th className="p-4 font-medium text-center">PAM Admin</th>
                      <th className="p-4 font-medium text-center">Operator</th>
                      <th className="p-4 font-medium text-center">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      'View Canvas',
                      'Deploy to Edge',
                      'Manage SSO',
                      'Edit MDM Rules',
                      'Approve PAM Requests'
                    ].map((perm, i) => (
                      <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 text-slate-300">{perm}</td>
                        <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="p-4 text-center">{i !== 2 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-600 mx-auto" />}</td>
                        <td className="p-4 text-center">{i < 2 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-600 mx-auto" />}</td>
                        <td className="p-4 text-center">{i === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-600 mx-auto" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pam' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid gap-4">
              {[
                { user: 'alice.smith@bank.com', role: 'Super Admin', reason: 'Emergency MDM Rule Update', time: '10 mins ago', status: 'pending' },
                { user: 'bob.jones@bank.com', role: 'PAM Admin', reason: 'Vault Credential Rotation', time: '2 hours ago', status: 'approved' },
              ].map((req, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${req.status === 'pending' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                      <Key className={`w-6 h-6 ${req.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{req.user}</h3>
                      <p className="text-sm text-slate-400 mt-1">Requested <span className="text-amber-400 font-mono">{req.role}</span> elevation</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {req.time} • Reason: {req.reason}</p>
                    </div>
                  </div>
                  {req.status === 'pending' ? (
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-sm font-medium transition-colors">
                        Approve (1hr)
                      </button>
                      <button className="px-4 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-sm font-medium transition-colors">
                        Deny
                      </button>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                      Approved
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Identity;
