import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.03)_0%,transparent_60%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md p-8 glass rounded-lg border border-white/5 relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-lg border border-primary flex items-center justify-center bg-gradient-to-br from-[#1a3a6e] to-[#0f2044] shadow-glow-primary mb-4">
            <ShieldAlert size={24} className="text-primary" />
          </div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-on-surface">Operator Enrollment</h2>
          <p className="text-xs text-on-surface-variant font-data mt-2 tracking-widest uppercase">Clearance Request</p>
        </div>

        {error && (
          <div className="bg-error/10 border-l-2 border-error text-error text-sm p-3 mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mb-1.5">Operator ID / Alias</label>
            <input 
              type="text" 
              required
              className="ghost-input"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mb-1.5">Secure Comms (Email)</label>
            <input 
              type="email" 
              required
              className="ghost-input"
              placeholder="operator@sentinel.sys"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mb-1.5">Passphrase Key</label>
            <input 
              type="password" 
              required
              className="ghost-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary mt-6 disabled:opacity-50 flex items-center justify-center py-2.5"
          >
            {loading ? 'SUBMITTING...' : 'REQUEST CLEARANCE'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-on-surface-variant">
          Already cleared? <Link to="/login" className="text-primary hover:underline ml-1">Initiate Uplink</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
