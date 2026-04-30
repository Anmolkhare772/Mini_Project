import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Mail, Key, Activity, Cpu, Globe, Terminal } from 'lucide-react';
import api from '../services/api';
import BrandLogo from '../components/BrandLogo';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nodeId, setNodeId] = useState('SENTINEL-X');
  const navigate = useNavigate();

  useEffect(() => {
    setNodeId('NODE-' + Math.random().toString(36).substring(2, 7).toUpperCase());
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/register', { name, email, password, phone });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Enrollment Failed: Verification Required');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 font-data selection:bg-cyber-neon-green selection:text-black flex items-center justify-center overflow-hidden relative">
      {/* Anti-Banding Noise Layer */}
      <div className="fixed inset-0 bg-noise opacity-[0.04] pointer-events-none z-0" />
      
      {/* Ambient Glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyber-neon-green/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyber-neon-blue/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Technical Metadata Overlays */}
      <div className="absolute top-8 right-8 flex flex-col items-end gap-1 opacity-40 font-data text-[10px] text-cyber-neon-green tracking-tighter">
        <div className="flex items-center gap-2">ENROLLMENT_STATUS: PENDING <Terminal size={10}/></div>
        <div className="flex items-center gap-2">LOCAL_NODE_ID: {nodeId} <Globe size={10}/></div>
        <div className="flex items-center gap-2">CIPHER: AES-256-GCM <Cpu size={10}/></div>
      </div>

      {/* Main Enrollment Container */}
      <div className="w-full max-w-[440px] px-6 relative z-10">
        <div className="glass-premium rounded-2xl overflow-hidden relative group">
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyber-neon-green/20 to-transparent blur-sm animate-scan"></div>
          </div>

          <div className="p-10 relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-10 scale-110">
              <Link to="/" className="relative">
                <BrandLogo size="lg" />
              </Link>
              
              <div className="flex items-center gap-3 mt-3">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gray-800"></div>
                <span className="text-[9px] font-data text-gray-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Activity size={10} className="text-cyber-neon-green animate-pulse" />
                  Clearance_Enrollment
                </span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gray-800"></div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-[11px] p-4 mb-8 rounded-lg font-data flex items-start gap-3">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                <span>CRITICAL_FAILURE // {error.toUpperCase()}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-data text-gray-500 uppercase tracking-widest ml-1">Identity_Alias</label>
                <input 
                  type="text" 
                  required
                  className="input-cyber w-full font-data text-sm border-white/5"
                  placeholder="e.g. Sentinel-7"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-data text-gray-500 uppercase tracking-widest ml-1">Auth_Comms (Email)</label>
                <input 
                  type="email" 
                  required
                  className="input-cyber w-full font-data text-sm border-white/5"
                  placeholder="operator@sentinel.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-data text-gray-500 uppercase tracking-widest ml-1">Secure_Passphrase</label>
                <input 
                  type="password" 
                  required
                  className="input-cyber w-full font-data text-sm border-white/5"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-data text-gray-500 uppercase tracking-widest ml-1">Mobile_Uplink (SMS Alerts)</label>
                <input 
                  type="tel" 
                  className="input-cyber w-full font-data text-sm border-white/5"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="relative w-full overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-cyber-neon-green transition-all duration-300 group-hover/btn:bg-cyber-neon-blue"></div>
                  <div className="absolute inset-0 animate-shimmer-fast pointer-events-none"></div>
                  <div className="relative py-4 flex items-center justify-center gap-3 text-black font-bold text-xs uppercase tracking-[0.2em] transition-transform active:scale-95">
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Request Clearance
                        <User size={14} className="opacity-60" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>

            <div className="mt-10 pt-6 border-t border-white/5 text-center">
              <Link to="/login" className="text-[10px] font-data text-gray-500 hover:text-cyber-neon-green transition-colors tracking-widest uppercase flex items-center justify-center gap-2 group">
                Already cleared? <span className="text-cyber-neon-green font-bold">Initiate Uplink</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
