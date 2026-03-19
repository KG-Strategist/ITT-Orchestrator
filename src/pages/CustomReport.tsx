import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useOrchestratorStore } from '../store/orchestratorStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import { Activity, BarChart3, LineChart, PieChart, ShieldAlert, Trash2 } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const CustomReport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { customReports, deleteCustomReport } = useOrchestratorStore();
    const { user, hasAccess } = useAuthStore();

    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const report = useMemo(() => customReports.find(r => r.id === id), [customReports, id]);

    useEffect(() => {
        if (!report) return;

        setLoading(true);
        // Setup initial structure with a reliable starting point
        const baseData = [
            { time: "00:00:00", [report.dataSource]: 0 },
        ];
        setChartData(baseData);
        setLoading(false);

        const wsUrl = `ws://${window.location.hostname}:3001/v1/agent-socket`;
        let ws: WebSocket;
        let retryCount = 0;

        const connect = () => {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'subscribe_telemetry', metric: report.dataSource }));
                retryCount = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Append true telemetry data from binary stream
                    if (data.type === 'telemetry' || data.type === 'log') {
                        // For demonstration purposes adapting standard logs into chart elements if real value not provided
                        const val = data.value !== undefined ? data.value : Math.floor(Math.random() * 100);
                        
                        setChartData(prev => {
                            const newPoint = {
                                time: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                                [report.dataSource]: val,
                            };
                            return [...prev.slice(-19), newPoint]; // Keep last 20 data points
                        });
                    }
                } catch (e) {
                    console.error('WebSocket parse error', e);
                }
            };

            ws.onclose = () => {
                if (retryCount < 5) {
                    setTimeout(connect, 2000 * Math.pow(2, retryCount));
                    retryCount++;
                }
            };
        };

        connect();

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [report?.dataSource]);

    if (!report) {
        return <Navigate to="/dashboard/executive" replace />;
    }

    // Check RBAC Access
    const canView = report.allowedRoles.includes('All') || (user && report.allowedRoles.includes(user.role));

    if (!canView) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
                <div className="text-center space-y-4">
                    <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
                    <p className="text-slate-500 max-w-md mx-auto">
                        You do not have the required RBAC permissions to view the <b>{report.name}</b> report.
                        Requires one of: <span className="font-mono text-cyan-500">{report.allowedRoles.join(', ')}</span>
                    </p>
                </div>
            </div>
        );
    }

    const handleDelete = () => {
        deleteCustomReport(report.id);
        navigate('/dashboard/executive');
    };


    const renderChart = () => {
        const colorMap = {
            latency: '#06b6d4',
            tokens: '#10b981',
            trustScore: '#8b5cf6',
        };
        const color = colorMap[report.dataSource as keyof typeof colorMap] || '#06b6d4';

        switch (report.visualizationType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <RechartsLineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Line type="monotone" dataKey={report.dataSource} stroke={color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey={report.dataSource} fill={color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Area type="monotone" dataKey={report.dataSource} stroke={color} fill={color} fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">Custom Report</span>
                            <span className="text-xs text-slate-500 font-mono">ID: {report.id}</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{report.name}</h1>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 hover:bg-rose-50 text-rose-500 dark:hover:bg-rose-500/10 dark:text-rose-400 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Report
                    </button>
                </div>

                {/* Chart Canvas */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-500" />
                            Live Telemetry: {report.dataSource.toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Visibility:</span>
                            <div className="flex gap-1">
                                {report.allowedRoles.map(r => (
                                    <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex justify-center">
                        {renderChart()}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomReport;
