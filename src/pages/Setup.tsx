import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, Building2, User, Mail, Lock, KeyRound,
    CheckCircle2, XCircle, AlertCircle, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react';
import { api, apiEndpoints } from '../api/client';
import { useAuthStore, CoERole } from '../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupInitResponse {
    token: string;
    expires_in: number;
    token_type: string;
    user: {
        id: string;
        username: string;
        name: string;
        role: CoERole;
    };
}

interface PasswordRule {
    label: string;
    test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
    { label: 'One digit (0–9)', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string): number {
    return PASSWORD_RULES.filter((r) => r.test(password)).length;
}

function strengthLabel(score: number): { text: string; color: string } {
    if (score <= 1) return { text: 'Very Weak', color: '#ef4444' };
    if (score === 2) return { text: 'Weak', color: '#f97316' };
    if (score === 3) return { text: 'Fair', color: '#eab308' };
    if (score === 4) return { text: 'Strong', color: '#84cc16' };
    return { text: 'Excellent', color: '#22c55e' };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Setup: React.FC = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [step, setStep] = useState<1 | 2>(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Step 1 fields
    const [orgName, setOrgName] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    // Step 2 fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const strength = getStrength(password);
    const { text: strengthText, color: strengthColor } = strengthLabel(strength);
    const allRulesPassed = strength === PASSWORD_RULES.length;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    // If setup already complete, redirect to login
    useEffect(() => {
        api.get<{ setup_required: boolean }>(apiEndpoints.setup.status).then((data) => {
            if (!data.setup_required) navigate('/login', { replace: true });
        }).catch(() => {/* ignore – stay on page */ });
    }, [navigate]);

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!orgName.trim() || !fullName.trim() || !email.trim()) {
            setError('All fields are required.');
            return;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!allRulesPassed) {
            setError('Password does not meet all requirements.');
            return;
        }
        if (!passwordsMatch) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post<SetupInitResponse>(apiEndpoints.setup.init, {
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password,
                confirm_password: confirmPassword,
                full_name: fullName.trim(),
                organization: orgName.trim(),
            });

            if (response?.token && response?.user) {
                setSuccess(true);
                setTimeout(() => {
                    login(response.user, response.token);
                    navigate('/dashboard/executive', { replace: true });
                }, 1800);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Setup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Success Screen ─────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6 animate-pulse">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Setup Complete</h2>
                    <p className="text-slate-400 text-sm">Redirecting to your control centre…</p>
                </div>
            </div>
        );
    }

    // ─── Main Layout ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
            style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 70%)' }}>
            {/* Decorative grid */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }} />

            <div className="relative w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-5">
                        <ShieldCheck className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">ITT-Orchestrator</h1>
                    <p className="text-sm text-cyan-400/70 mt-1 font-mono">First-Time Admin Setup</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    {[1, 2].map((s) => (
                        <React.Fragment key={s}>
                            <button
                                onClick={() => s < step ? setStep(s as 1 | 2) : undefined}
                                className={`flex items-center gap-2 text-xs font-semibold transition-all ${step === s
                                        ? 'text-cyan-400'
                                        : s < step
                                            ? 'text-emerald-400 cursor-pointer'
                                            : 'text-slate-600 cursor-default'
                                    }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-all ${step === s
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : s < step
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-600'
                                    }`}>
                                    {s < step ? '✓' : s}
                                </span>
                                {s === 1 ? 'Organisation' : 'Credentials'}
                            </button>
                            {s < 2 && <div className={`h-px w-8 ${step > 1 ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Error banner */}
                    {error && (
                        <div className="flex items-start gap-2 p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="p-8">
                        {/* ── STEP 1 ─────────────────────────────────────────────────── */}
                        {step === 1 && (
                            <form onSubmit={handleStep1} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Organisation Name
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            id="org-name"
                                            type="text"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            placeholder="Acme Financial Services"
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            id="full-name"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@acme.com"
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                                >
                                    Continue <ChevronRight className="w-4 h-4" />
                                </button>
                            </form>
                        )}

                        {/* ── STEP 2 ─────────────────────────────────────────────────── */}
                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Admin Username
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="admin"
                                            autoComplete="username"
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            autoComplete="new-password"
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    {/* Strength meter */}
                                    {password.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                                        style={{ backgroundColor: i <= strength ? strengthColor : '#1e293b' }}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs font-semibold" style={{ color: strengthColor }}>
                                                {strengthText}
                                            </p>
                                            <ul className="space-y-1 mt-2">
                                                {PASSWORD_RULES.map((rule) => {
                                                    const passed = rule.test(password);
                                                    return (
                                                        <li key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${passed ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                            {passed ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                                            {rule.label}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            autoComplete="new-password"
                                            className={`w-full bg-slate-950/50 border rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 ${confirmPassword.length > 0
                                                    ? passwordsMatch
                                                        ? 'border-emerald-500 focus:border-emerald-400 focus:ring-emerald-500'
                                                        : 'border-rose-500 focus:border-rose-400 focus:ring-rose-500'
                                                    : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
                                                }`}
                                            required
                                        />
                                        {confirmPassword.length > 0 && (
                                            <div className="absolute right-3 top-3">
                                                {passwordsMatch
                                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                    : <XCircle className="w-5 h-5 text-rose-400" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setStep(1); setError(''); }}
                                        className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !allRulesPassed || !passwordsMatch}
                                        className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                                    >
                                        {isLoading
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Admin…</>
                                            : <><ShieldCheck className="w-4 h-4" /> Create Admin Account</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-950/40 px-8 py-4 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-cyan-600" />
                            This wizard runs once. The endpoint is permanently locked after setup.
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-700 mt-6">
                    ITT-Orchestrator · Sovereign Enterprise Agent Gateway
                </p>
            </div>
        </div>
    );
};

export default Setup;
