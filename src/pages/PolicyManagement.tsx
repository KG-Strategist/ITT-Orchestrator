import React, { useState } from 'react';
import { FileCode2, ShieldCheck, Plus, CheckCircle2, AlertTriangle, Link2, X } from 'lucide-react';

const PolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState([
    { id: 'pol-001', name: 'Zero Trust Ingress', type: 'AuthZ', status: 'Active', boundTo: ['envoy-edge-01'] },
    { id: 'pol-002', name: 'Geo-Fencing (EU)', type: 'Routing', status: 'Active', boundTo: ['f5-dmz-01'] },
    { id: 'pol-003', name: 'Global Rate Limit', type: 'Traffic', status: 'Inactive', boundTo: [] },
  ]);

  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileCode2 className="w-8 h-8 text-fuchsia-500" />
              Policy Management (OPA)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Define Open Policy Agent rules and bind them to Execution Plane nodes.</p>
          </div>
          <button className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Policy
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-bold">Policy Name</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Bindings</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedPolicy(policy.id)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-fuchsia-500" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{policy.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{policy.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {policy.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${policy.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${policy.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {policy.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{policy.boundTo.length} nodes</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-sm text-fuchsia-600 dark:text-fuchsia-400 hover:underline font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedPolicy ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-fuchsia-500" /> Policy Details
                </h3>
                <button onClick={() => setSelectedPolicy(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 mb-6 flex-1">
                <div className="text-xs font-mono text-slate-400 mb-2 border-b border-slate-800 pb-2">policy.rego</div>
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
{`package envoy.authz

default allow = false

allow {
    input.attributes.request.http.method == "GET"
    input.attributes.request.http.headers["x-tenant-id"] != ""
}`}
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Active Bindings</h4>
                <div className="space-y-2">
                  {policies.find(p => p.id === selectedPolicy)?.boundTo.map(node => (
                    <div key={node} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg">
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{node}</span>
                      <button className="text-xs text-rose-500 hover:underline">Unbind</button>
                    </div>
                  ))}
                  {policies.find(p => p.id === selectedPolicy)?.boundTo.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No active bindings.</p>
                  )}
                </div>
                <button className="w-full mt-4 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:text-fuchsia-500 hover:border-fuchsia-500 transition-colors flex items-center justify-center gap-2">
                  <Link2 className="w-4 h-4" /> Bind to Execution Node
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">Select a Policy</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-[200px]">Click on a policy in the table to view its Rego code and manage node bindings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyManagement;
