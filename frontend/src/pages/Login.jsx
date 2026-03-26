import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.03)_0%,transparent_60%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md p-8 glass rounded-lg border border-white/5 relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg border border-primary flex items-center justify-center bg-gradient-to-br from-[#1a3a6e] to-[#0f2044] shadow-glow-primary mb-4">
            <Shield size={24} className="text-primary" />
          </div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-on-surface">Operator Authentication</h2>
          <p className="text-xs text-on-surface-variant font-data mt-2 tracking-widest uppercase">Secure Access Portal</p>
        </div>

        {error && (
          <div className="bg-error/10 border-l-2 border-error text-error text-sm p-3 mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 shadow-none">
          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mb-1.5">Email / Designation Auth</label>
            <input 
              type="email" 
              required
              className="ghost-input"
              placeholder="e.g. operator@sentinel.sys"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mb-1.5">Passphrase</label>
            <input 
              type="password" 
              required
              className="ghost-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE UPLINK'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-on-surface-variant">
          New operator? <Link to="/register" className="text-primary hover:underline ml-1">Request Clearance</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
