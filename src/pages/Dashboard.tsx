import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Activity, ShieldCheck, Database, Zap, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back, {user?.name}. You are logged in as <span className="font-mono text-cyan-500">{user?.role}</span>.</p>
          </div>
          <button 
            onClick={() => navigate('/agents')}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 hover:scale-105"
          >
            <Zap className="w-5 h-5" /> Launch Agent Builder
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">API Latency (p99)</h3>
              <div className="p-2 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg">
                <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">45ms</div>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 rotate-45" /> Target: &lt;50ms
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Availability</h3>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">99.995%</div>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 -rotate-45" /> SLA: 99.99%
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MTTR</h3>
              <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">3m 42s</div>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 rotate-45" /> Target: &lt;5 mins
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trace Coverage</h3>
              <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg">
                <Database className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">100%</div>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 -rotate-45" /> Target: 100%
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Compliance</h3>
              <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 -rotate-45" /> Violations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent GVM Deployments</h2>
            <div className="space-y-4">
              {[
                { name: 'Project Aurora (AML)', zone: 'Zone 4: Cognitive Edge', status: 'Active', time: '2 hours ago' },
                { name: 'KYC Verification Agent', zone: 'Zone 2: Internal (Core)', status: 'Active', time: '5 hours ago' },
                { name: 'Partner API Gateway', zone: 'Zone 1: DMZ (External)', status: 'Active', time: '1 day ago' },
              ].map((dep, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{dep.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dep.zone}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {dep.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">{dep.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">System Health (MELT)</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Agent Socket Latency</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">8ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Tokenization Engine Load</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">42%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Smart Corpus Cache Hit Rate</span>
                  <span className="font-mono text-violet-600 dark:text-violet-400">94%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-violet-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
