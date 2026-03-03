import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Layers, ShieldCheck, Database, Key, Activity, Network, 
  Moon, Sun, LogOut, ChevronDown, Zap, Terminal, Box, 
  Cpu, Lock, FileJson, BarChart3, Settings, Server, FileCode2, Users, Users2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, hasAccess } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden transition-colors duration-300">
      {/* Global Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xl tracking-tight">
            <Layers className="w-6 h-6" />
            <span>ITT-Orchestrator</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div className="hidden md:flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Global GVS:</span>
              <span className="text-rose-500 dark:text-rose-400 line-through">600</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">→ 10</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Token Budget:</span>
              <span className="text-slate-900 dark:text-white">$5,000</span>
              <span className="text-slate-300 dark:text-slate-500">|</span>
              <span className="text-amber-600 dark:text-amber-400">Consumed: $1,240</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {location.pathname !== '/agents' && !location.pathname.startsWith('/agent-builder') && (
            <button 
              onClick={() => navigate('/agents')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Launch Agent Builder
            </button>
          )}
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

          <div className="flex items-center gap-3 relative group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-700 dark:text-cyan-400 font-bold text-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-bold text-slate-900 dark:text-white leading-none">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Comprehensive Enterprise Navigation Menu */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0 overflow-y-auto justify-between">
          <nav className="p-4 space-y-6">
            
            {/* Dashboards (Reporting Only) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Dashboards</h3>
              <div className="space-y-1">
                <NavLink to="/dashboard/executive" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <BarChart3 className="w-4 h-4" /> Executive Overview
                </NavLink>
              </div>
            </div>

            {/* Master Data Management (MDM) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Master Data (MDM)</h3>
              <div className="space-y-1">
                <NavLink to="/masters/mdm" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Database className="w-4 h-4" /> Data Dictionary
                </NavLink>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <ShieldCheck className="w-4 h-4" /> DPDP Masking Rules
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <Activity className="w-4 h-4" /> FinOps Budgets
                </div>
              </div>
            </div>

            {/* Identity & Access (IAM) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Identity & Access</h3>
              <div className="space-y-1">
                <NavLink to="/iam/tenants" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Users className="w-4 h-4" /> Multi-Tenant Mgmt
                </NavLink>
                <NavLink to="/iam" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Key className="w-4 h-4" /> Access Policies
                </NavLink>
              </div>
            </div>

            {/* Adaptive Gateway Fabric (AGF) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Adaptive Gateway Fabric</h3>
              <div className="space-y-1">
                <NavLink to="/zones" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Network className="w-4 h-4" /> Zone Management
                </NavLink>
                <NavLink to="/agf/execution-planes" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Server className="w-4 h-4" /> Execution Planes
                </NavLink>
                <NavLink to="/agf/policies" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <FileCode2 className="w-4 h-4" /> Policy Mgmt (OPA)
                </NavLink>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <Cpu className="w-4 h-4" /> Polyglot Translation
                </div>
              </div>
            </div>

            {/* Gateway Vending Machine (GVM) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Gateway Vending Machine</h3>
              <div className="space-y-1">
                <NavLink to="/agents" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive || location.pathname.startsWith('/agent-builder') ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Box className="w-4 h-4" /> Agent Portfolio
                </NavLink>
                <NavLink to="/gvm/manifests" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <FileJson className="w-4 h-4" /> Intent Manifests
                </NavLink>
                <NavLink to="/gvm/calculator" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Activity className="w-4 h-4" /> GVS Calculator
                </NavLink>
              </div>
            </div>

            {/* Agentic Gateway (SEAG) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Agentic Gateway (SEAG)</h3>
              <div className="space-y-1">
                <NavLink to="/registry" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Layers className="w-4 h-4" /> Unified API Registry
                </NavLink>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <ShieldCheck className="w-4 h-4" /> Semantic Firewalls
                </div>
                <NavLink to="/integrations" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Key className="w-4 h-4" /> Integrations & Vault
                </NavLink>
              </div>
            </div>

          </nav>

          {/* Super Admin Settings */}
          {hasAccess('All') && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Global Settings</h3>
              <div className="space-y-1">
                <NavLink to="/settings/organization" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Settings className="w-4 h-4" /> Organization Profile
                </NavLink>
                <NavLink to="/settings/currency" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Activity className="w-4 h-4" /> Currency Settings
                </NavLink>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
