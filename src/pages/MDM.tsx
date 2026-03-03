import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, Zap, Clock, Save, Plus, Trash2, X } from 'lucide-react';

interface Rule {
  id: number;
  name: string;
  pattern: string;
  token: string;
}

const MDM: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [ttl, setTtl] = useState(24);
  const [budget, setBudget] = useState(5000000);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', pattern: '', token: '' });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/v1/mdm/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        // Fallback if endpoint doesn't exist yet
        setRules([
          { id: 1, name: 'Aadhaar Number', pattern: '\\d{4}-\\d{4}-\\d{4}', token: 'TKN-AADHAAR' },
          { id: 2, name: 'PAN Card', pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', token: 'TKN-PAN' },
          { id: 3, name: 'Email Address', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', token: 'TKN-EMAIL' }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch rules', error);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.pattern || !newRule.token) return;
    
    try {
      const response = await fetch('/api/v1/mdm/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      
      if (response.ok) {
        const addedRule = await response.json();
        setRules([...rules, addedRule]);
        setIsModalOpen(false);
        setNewRule({ name: '', pattern: '', token: '' });
      } else {
        // Fallback for UI if backend not ready
        setRules([...rules, { id: Date.now(), ...newRule }]);
        setIsModalOpen(false);
        setNewRule({ name: '', pattern: '', token: '' });
      }
    } catch (error) {
      console.error('Failed to add rule', error);
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/mdm/rules/${id}`, { method: 'DELETE' });
      if (response.ok || response.status === 404) {
        setRules(rules.filter(r => r.id !== id));
      } else {
         setRules(rules.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete rule', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-fuchsia-500" />
            Masters & Data (MDM)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Configure global platform parameters, DPDP masking rules, and FinOps budgets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DPDP Masking Rules */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:col-span-2 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> DPDP Masking Rules (TokenizationEngine)
              </h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </div>
            
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Entity Name</label>
                    <input type="text" value={rule.name} readOnly className="w-full bg-transparent border-none text-sm font-medium focus:ring-0 p-0" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Regex Pattern</label>
                    <input type="text" value={rule.pattern} readOnly className="w-full bg-transparent border-none text-sm text-cyan-600 dark:text-cyan-400 font-mono focus:ring-0 p-0" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Replacement Token</label>
                    <input type="text" value={rule.token} readOnly className="w-full bg-transparent border-none text-sm text-emerald-600 dark:text-emerald-400 font-mono focus:ring-0 p-0" />
                  </div>
                  <button onClick={() => handleDeleteRule(rule.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Global FinOps */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" /> Global FinOps Budget
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Token Budget (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-mono">₹</span>
                  <input 
                    type="number" 
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 pl-8 text-lg text-emerald-600 dark:text-emerald-400 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Hard limit for all external LLM calls across the enterprise.</p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Update Budget
                </button>
              </div>
            </div>
          </div>

          {/* Corpus Hygiene */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Corpus Hygiene (SelfHygieneWorker)
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex justify-between">
                  <span>Strict Time-To-Live (TTL)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">{ttl} Hours</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="72" 
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                  <span>1h</span>
                  <span>24h</span>
                  <span>72h</span>
                </div>
                <p className="text-xs text-slate-500 mt-4">Operational data older than this TTL will be permanently purged from Vector/Graph DBs.</p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Update TTL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Add DPDP Masking Rule
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Entity Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Passport Number" 
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Regex Pattern</label>
                <input 
                  type="text" 
                  placeholder="^[A-PR-WYa-pr-wy][1-9]\\d\\s?\\d{4}[1-9]$" 
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-cyan-600 dark:text-cyan-400 font-mono focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Replacement Token</label>
                <input 
                  type="text" 
                  placeholder="TKN-PASSPORT" 
                  value={newRule.token}
                  onChange={(e) => setNewRule({...newRule, token: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-emerald-600 dark:text-emerald-400 font-mono focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none" 
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddRule}
                disabled={!newRule.name || !newRule.pattern || !newRule.token}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MDM;
