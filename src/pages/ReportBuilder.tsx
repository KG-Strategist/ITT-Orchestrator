import React, { useState } from 'react';
import { useOrchestratorStore, CustomReport } from '../store/orchestratorStore';
import { useNavigate } from 'react-router-dom';
import { BarChart3, LineChart, PieChart, Activity, Save, Settings, Users, ArrowRight } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock MELT Data for Preview
const mockMeltData = [
    { time: '00:00', latency: 45, tokens: 1200, trustScore: 98 },
    { time: '04:00', latency: 52, tokens: 900, trustScore: 95 },
    { time: '08:00', latency: 38, tokens: 2400, trustScore: 99 },
    { time: '12:00', latency: 65, tokens: 3800, trustScore: 92 },
    { time: '16:00', latency: 48, tokens: 2100, trustScore: 97 },
    { time: '20:00', latency: 42, tokens: 1500, trustScore: 98 },
];

const AVAILABLE_ROLES = ['All', 'Admin', 'SRE', 'SOC_Analyst', 'Finance'];

const ReportBuilder: React.FC = () => {
    const navigate = useNavigate();
    const { saveCustomReport } = useOrchestratorStore();

    const [name, setName] = useState('New Custom Report');
    const [dataSource, setDataSource] = useState<'latency' | 'tokens' | 'trustScore'>('latency');
    const [visualizationType, setVisualizationType] = useState<'line' | 'bar' | 'area'>('line');
    const [allowedRoles, setAllowedRoles] = useState<string[]>(['All']);

    const handleSave = () => {
        const reportId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const report: CustomReport = {
            id: reportId,
            name,
            dataSource,
            visualizationType,
            allowedRoles,
        };
        saveCustomReport(report);
        navigate(`/dashboard/report/${reportId}`);
    };

    const toggleRole = (role: string) => {
        if (role === 'All') {
            setAllowedRoles(['All']);
            return;
        }
        const newRoles = allowedRoles.filter(r => r !== 'All');
        if (newRoles.includes(role)) {
            setAllowedRoles(newRoles.filter(r => r !== role));
        } else {
            setAllowedRoles([...newRoles, role]);
        }
    };

    const renderPreviewChart = () => {
        const colorMap = {
            latency: '#06b6d4', // cyan
            tokens: '#10b981', // emerald
            trustScore: '#8b5cf6', // violet
        };
        const color = colorMap[dataSource];

        switch (visualizationType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={mockMeltData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Line type="monotone" dataKey={dataSource} stroke={color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mockMeltData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey={dataSource} fill={color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={mockMeltData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Area type="monotone" dataKey={dataSource} stroke={color} fill={color} fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Settings className="w-8 h-8 text-cyan-500" />
                            Report Builder
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Create custom dashboard views from live MELT metrics with RBAC visibility.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || allowedRoles.length === 0}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" /> Save custom Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Configuration Sidebar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-8">

                        {/* Report Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Report Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                placeholder="e.g., SRE Latency Overview"
                            />
                        </div>

                        {/* Data Source */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">MELT Metric Source</label>
                            <div className="space-y-2">
                                {[
                                    { id: 'latency', label: 'API Gateway Latency', icon: Activity, color: 'text-cyan-500' },
                                    { id: 'tokens', label: 'Token Consumption (GenAI)', icon: BarChart3, color: 'text-emerald-500' },
                                    { id: 'trustScore', label: 'Semantic Trust Scores', icon: PieChart, color: 'text-violet-500' }
                                ].map(source => (
                                    <button
                                        key={source.id}
                                        onClick={() => setDataSource(source.id as any)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${dataSource === source.id ? 'bg-cyan-50 border-cyan-500 dark:bg-cyan-500/10 dark:border-cyan-500 shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                    >
                                        <source.icon className={`w-5 h-5 ${source.color}`} />
                                        <span className={`text-sm font-medium ${dataSource === source.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {source.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visualization Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['line', 'bar', 'area'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setVisualizationType(type as any)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${visualizationType === type ? 'bg-slate-100 border-slate-400 dark:bg-slate-800 dark:border-slate-500 shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                    >
                                        {type === 'line' && <LineChart className="w-5 h-5 mb-1 text-slate-500" />}
                                        {type === 'bar' && <BarChart3 className="w-5 h-5 mb-1 text-slate-500" />}
                                        {type === 'area' && <Activity className="w-5 h-5 mb-1 text-slate-500" />}
                                        <span className="text-xs font-semibold capitalize text-slate-600 dark:text-slate-300">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RBAC Visibility */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Role Visibility (RBAC)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_ROLES.map(role => {
                                    const isSelected = allowedRoles.includes(role);
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => toggleRole(role)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isSelected ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300' : 'bg-slate-100 border-transparent text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                        >
                                            {role}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Live Preview Canvas */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[500px]">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">Live Preview</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{name || 'Untitled Report'}</h2>
                                </div>
                                <div className="flex -space-x-2">
                                    {allowedRoles.map((role, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 z-10" title={role}>
                                            {role.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                {renderPreviewChart()}
                                <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-2">
                                    <Activity className="w-3 h-3" /> Preview data is mocked mapping to OpenTelemetry streams
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReportBuilder;
