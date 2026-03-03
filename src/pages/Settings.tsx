import React, { useState } from 'react';
import { Settings, Shield, Database, Key, CheckCircle2, Building2, Banknote, Save } from 'lucide-react';

interface SettingsPageProps {
  type: 'organization' | 'currency';
}

const SettingsPage: React.FC<SettingsPageProps> = ({ type }) => {
  const [currency, setCurrency] = useState('INR');

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {type === 'organization' ? (
              <><Building2 className="w-8 h-8 text-rose-500" /> Organization Profile</>
            ) : (
              <><Banknote className="w-8 h-8 text-emerald-500" /> Currency Settings</>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {type === 'organization' ? 'Manage global organization details and DPDP contacts.' : 'Configure the global platform currency for FinOps and Cost Arbitrage.'}
          </p>
        </div>

        <div className="space-y-6">
          {type === 'organization' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-indigo-500" /> Organization Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                  <input type="text" defaultValue="HDFC Bank" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Global DPDP Contact Email</label>
                  <input type="email" defaultValue="dpo@hdfcbank.com" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tax ID / GSTIN</label>
                  <input type="text" defaultValue="27AAACH2702H1Z1" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-mono" />
                </div>
                <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Profile
                </button>
              </div>
            </div>
          )}

          {type === 'currency' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Banknote className="w-5 h-5 text-emerald-500" /> Global Platform Currency
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-medium"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">This currency will be used across all FinOps dashboards and Cost Arbitrage calculations.</p>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Currency Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
