import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Leaf, Mail, Lock, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const regRole = urlParams.get('registeredRole');
    if (regRole) {
      const savedEmail = localStorage.getItem('registeredEmail');
      const savedPassword = localStorage.getItem('registeredPassword');
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        // Clear temporary local storage keys
        localStorage.removeItem('registeredEmail');
        localStorage.removeItem('registeredPassword');
        localStorage.removeItem('registeredRole');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login({ email, password });
      login(response.token, response.user);
      
      // Redirect based on user role
      switch (response.user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'collector':
          navigate('/collector');
          break;
        case 'recycler':
          navigate('/recycler');
          break;
        case 'citizen':
        default:
          navigate('/citizen');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 flex flex-col justify-center min-h-[70vh] fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl">
            <Leaf className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to manage plastic waste collection and earn rewards.
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-red-600 dark:text-red-400">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@ecocycle.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white font-extrabold py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center space-x-2 text-sm mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Redirect */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-450 pt-2">
          New to EcoCycle?{' '}
          <Link to="/register" className="text-emerald-500 font-extrabold hover:underline">
            Create an account
          </Link>
        </div>

        {/* Seeding Demo Accounts Tip Box */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
          <div className="font-extrabold text-slate-700 dark:text-slate-350 text-xs">Seeded Demo Login Profiles:</div>
          <p>Test each dashboard using password <b>Password123</b>:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Citizen: <code className="bg-slate-200 dark:bg-slate-850 px-1 py-0.5 rounded">citizen@ecocycle.com</code></li>
            <li>Collector: <code className="bg-slate-200 dark:bg-slate-850 px-1 py-0.5 rounded">collector@ecocycle.com</code></li>
            <li>Recycler: <code className="bg-slate-200 dark:bg-slate-850 px-1 py-0.5 rounded">recycler@ecocycle.com</code></li>
            <li>Admin: <code className="bg-slate-200 dark:bg-slate-850 px-1 py-0.5 rounded">admin@ecocycle.com</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
