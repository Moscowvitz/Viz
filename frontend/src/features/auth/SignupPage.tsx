import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from '../../components/AuthLayout';
import { useNavigate, Link } from 'react-router-dom';

export const SignupPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to create account');
            }

            if (data.session) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token || '',
                    user: data.user || { id: 'demo-user-123', email, created_at: new Date().toISOString() },
                });
            }

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to register account');
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Your Engine"
            subtitle="Start preserving your sacred narrations"
        >
            <form onSubmit={handleSignup} className="mt-8 space-y-6">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="Your Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    {loading ? 'Initializing...' : 'Start Narrating'}
                </button>

                <p className="text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};
