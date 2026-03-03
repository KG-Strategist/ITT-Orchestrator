import React, { useState } from 'react';
import { Users, ShieldCheck, Plus, Key, Building2, Lock, CheckCircle2 } from 'lucide-react';

const MultiTenantIAM: React.FC = () => {
  const [tenants, setTenants] = useState([
    { id: 'tnt-retail-01', name: 'Retail Banking', domain: 'retail.itt-orchestrator.internal', status: 'Active', users: 1240, policies: 45 },
    { id: 'tnt-corp-01', name: 'Corporate Banking', domain: 'corp.itt-orchestrator.internal', status: 'Active', users: 350, policies: 112 },
    { id: 'tnt-wealth-01', name: 'Wealth Management', domain: 'wealth.itt-orchestrator.internal', status: 'Provisioning', users: 0, policies: 0 },
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-500" />
              Multi-Tenant Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Logically isolate and manage Business Units ensuring strict tenant boundaries.</p>
          </div>
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Onboard Tenant
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{tenant.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{tenant.id}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Lock className="w-4 h-4" /> Domain
                  </div>
                  <span className="text-xs font-mono text-slate-900 dark:text-white truncate max-w-[150px]" title={tenant.domain}>{tenant.domain}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Active Users</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{tenant.users.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bound Policies</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{tenant.policies}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tenant.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                  {tenant.status}
                </span>
                <button className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  Manage <Key className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mt-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Global Isolation Policies
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Strict Data Plane Separation</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enforce physical network isolation between tenant workloads.</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Cross-Tenant API Routing</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Allow explicit API calls between authorized tenants.</p>
              </div>
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiTenantIAM;
