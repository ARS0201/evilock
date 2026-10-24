import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { Logo } from '../components/common/Logo';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter your official username and password');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(demoUser, demoPass);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Link to="/">
            <Logo variant="light" size="lg" showTagline={true} />
          </Link>
        </div>
        <h2 className="text-2xl font-extrabold text-[#3B2923]">
          Authorized Personnel Portal
        </h2>
        <p className="mt-1 text-xs text-[#88776B]">
          Enter your official credentials to access protected investigation records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="card-cream py-8 px-6 sm:px-10 shadow-elevation">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-[#B84040]/10 border border-[#B84040]/30 flex items-start gap-3 text-sm text-[#B84040]">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Denied</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
                Username or Official Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#88776B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. io_rajesh or rajesh.kumar@cid.gov.in"
                  className="input-cream pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#88776B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="input-cream pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#88776B] hover:text-[#3B2923]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#88776B]">Protected by Argon2id & HttpOnly Cookies</span>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your Department Administrator (admin@evilock.gov.in) to reset official credentials.'); }} className="text-[#B8875B] hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-semibold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Sign In to EviLock</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>

          {/* Quick Access Role Demonstration */}
          <div className="mt-8 pt-6 border-t border-[#E5D7C8]">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#B8875B]" />
              <span className="text-xs font-bold text-[#3B2923] uppercase tracking-wider">
                Evaluation Demo Accounts
              </span>
            </div>
            <p className="text-[11px] text-[#88776B] mb-3">
              Select any role below to instantly authenticate with pre-configured demonstration data:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemo(acc.username, acc.pass)}
                  className="flex flex-col items-start p-2.5 rounded-lg bg-[#F7F3EE] hover:bg-[#E5D7C8]/50 border border-[#E5D7C8] text-left transition-colors group"
                >
                  <span className="text-xs font-bold text-[#4B342B] group-hover:text-[#795548]">
                    {acc.label}
                  </span>
                  <span className="text-[10px] text-[#88776B] truncate w-full">
                    {acc.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
