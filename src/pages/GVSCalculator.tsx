import React, { useState, useEffect, useRef } from 'react';
import { Activity, ArrowDownRight, TrendingDown, Target, ShieldCheck, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';

const initialData = [
  { time: '00:00', gvs: 600 },
  { time: '04:00', gvs: 580 },
  { time: '08:00', gvs: 450 },
  { time: '12:00', gvs: 320 },
  { time: '16:00', gvs: 150 },
  { time: '20:00', gvs: 45 },
  { time: '24:00', gvs: 10 },
];

const GVSCalculator: React.FC = () => {
  const [currentGvs, setCurrentGvs] = useState(600);
  const [chartData, setChartData] = useState(initialData);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to the real-time telemetry socket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/v1/agent-socket`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to GVS Telemetry Stream');
      // Request initial GVS state if needed
      ws.send(JSON.stringify({ action: 'subscribe_gvs' }));
    };

    ws.onmessage = async (event) => {
      try {
        let textData = event.data;
        if (event.data instanceof Blob) {
          textData = await event.data.text();
        }
        
        const data = JSON.parse(textData);
        if (data.type === 'gvs_update' && typeof data.gvs === 'number') {
          setCurrentGvs(data.gvs);
          
          // Update chart data dynamically
          setChartData(prev => {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const newData = [...prev.slice(1), { time: timeStr, gvs: data.gvs }];
            return newData;
          });
        }
      } catch (e) {
        console.error('Failed to parse GVS telemetry', e);
      }
    };

    ws.onerror = (error) => {
      console.error('GVS WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-500" />
              Gateway Variance Score (GVS)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Real-time calculation of architectural complexity and technical debt.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-500" /> GVS Reduction Trajectory
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGvs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="gvs" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGvs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
              <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Current Global GVS</h4>
              <div className="text-6xl font-black text-emerald-500 font-mono flex items-center justify-center gap-2">
                {currentGvs} <ArrowDownRight className="w-8 h-8" />
              </div>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-4">Target: 10 (Optimized State)</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" /> The GVS Equation
              </h4>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-sm text-center">
                <span className="text-rose-500">GVS</span> = 
                <span className="text-indigo-500"> (N × P)</span> + 
                <span className="text-amber-500"> (S × 10)</span> + 
                <span className="text-cyan-500"> (C × 5)</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> <strong>N:</strong> Number of Gateways</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> <strong>P:</strong> Protocols Supported</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> <strong>S:</strong> Security Policies</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> <strong>C:</strong> Custom Integrations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GVSCalculator;
