import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, Server } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sso' | 'local'>('local');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { username, password });
      
      if (response.token && response.user) {
        login(response.user, response.token);
        navigate('/dashboard/executive');
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl mb-6">
            <ShieldCheck className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">ITT-Orchestrator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-mono">Secure Enterprise Agent Gateway</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('sso')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'sso' 
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500' 
                  : 'bg-slate-50 dark:bg-slate-950/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Lock className="w-4 h-4" /> Enterprise SSO
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'local' 
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500' 
                  : 'bg-slate-50 dark:bg-slate-950/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Server className="w-4 h-4" /> Local Admin
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'sso' ? (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">SAML/OIDC Login</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Authenticate using your corporate identity provider.
                </p>
                <button 
                  disabled
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed flex justify-center items-center gap-2"
                >
                  SSO Currently Disabled
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-600 dark:text-rose-400 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] flex justify-center items-center gap-2 mt-6"
                >
                  {isLoading ? 'Authenticating...' : 'Login'}
                </button>
              </form>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Protected by ITT_Identity Middleware
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
