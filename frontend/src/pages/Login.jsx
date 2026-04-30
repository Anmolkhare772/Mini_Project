import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Activity, Cpu, Globe, Terminal, Fingerprint, Database, Zap, ShieldCheck, ShieldAlert, Key } from 'lucide-react';
import api from '../services/api';
import BrandLogo from '../components/BrandLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([
    '>> INITIALIZING SENTINEL CORE_V4.0...',
    '>> CONNECTING TO SECURE_UPLINK_01...',
    '>> NODE_AUTH_PENDING...'
  ]);
  const navigate = useNavigate();
  const terminalRef = useRef(null);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const newLogs = [
        `>> PING: NODE_${Math.floor(Math.random() * 999)} - LATENCY: ${Math.floor(Math.random() * 20)}ms`,
        `>> TRAFFIC_SCAN: ${Math.floor(Math.random() * 1000)}kbps - STATUS: STABLE`,
        `>> AUTH_DAEMON: LISTENING_ON_PORT_8080`,
        `>> CIPHER_HANDSHAKE: AES-256-GCM ACTIVE`
      ];
      setLogs(prev => [...prev.slice(-15), newLogs[Math.floor(Math.random() * newLogs.length)]]);
    }, 2000);
    return () => clearInterval(logInterval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLogs(prev => [...prev, '>> INITIATING_UPLINK_SEQUENCE...', '>> VERIFYING_CREDENTIALS...']);
    
    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setLogs(prev => [...prev, '>> ACCESS_GRANTED. REDIRECTING...']);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'ACCESS_DENIED: AUTH_FAILURE');
      setLogs(prev => [...prev, '>> ERROR: UNAUTHORIZED_ACCESS_DETECTED', '>> SECURITY_ALERT_TRIGGERED']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 font-data selection:bg-cyber-neon-blue selection:text-black flex overflow-hidden relative">
      {/* Anti-Banding Noise Layer */}
      <div className="fixed inset-0 bg-noise opacity-[0.04] pointer-events-none z-0" />
      
      {/* Ambient Glows */}
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-tertiary/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex w-full h-full">
      {/* LEFT PANEL: Tactical SOC Monitor */}
      <div className="hidden lg:flex w-1/3 flex-col border-r border-white/5 bg-black/20 p-8 relative overflow-hidden">
        {/* Subtle Map Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none grayscale contrast-125">
          <svg viewBox="0 0 1000 500" className="w-full h-full">
            <path d="M150 150 L200 180 L250 140 L300 200" fill="none" stroke="#00CFFF" strokeWidth="1" className="animate-pulse" />
            <circle cx="200" cy="180" r="2" fill="#00FF9C" className="animate-ping" />
            <circle cx="600" cy="300" r="2" fill="#FF3B5C" className="animate-ping" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-cyber-neon-blue/10 border border-cyber-neon-blue/20 rounded">
              <Shield size={20} className="text-cyber-neon-blue" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-widest uppercase">Sentinel_Command</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Global Ops Node: 0x442</p>
            </div>
          </div>

          <div className="flex-1 bg-black/40 border border-white/5 rounded-lg p-4 font-data text-[10px] leading-relaxed overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2 text-cyber-neon-blue/60">
              <Terminal size={12} />
              <span>LIVE_SYSTEM_TELEMETRY</span>
            </div>
            <div className="flex-1 space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className={`${log.includes('ERROR') ? 'text-red-500' : log.includes('ACCESS_GRANTED') ? 'text-cyber-neon-green' : 'text-gray-500'} animate-fade-in`}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-md">
              <p className="text-[9px] text-gray-600 mb-1">CPU_LOAD</p>
              <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyber-neon-blue w-[42%] animate-pulse"></div>
              </div>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-md">
              <p className="text-[9px] text-gray-600 mb-1">NET_TRAFFIC</p>
              <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyber-neon-green w-[15%] animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Terminal */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-6">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:5rem_5rem]"></div>
        </div>

        <div className="w-full max-w-[440px] relative z-10">
          <div className="mb-12 flex flex-col items-center scale-125">
            <Link to="/" className="relative">
              <BrandLogo size="lg" />
            </Link>
            <div className="h-[1px] w-24 bg-cyber-neon-blue/40 mt-8"></div>
          </div>

          <div className="glass-premium p-8 rounded-xl border border-white/10 relative">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyber-neon-blue/40"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyber-neon-blue/40"></div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-600 uppercase tracking-[0.3em] ml-1">Operator_ID</label>
                <div className="relative">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                  <input 
                    type="email" 
                    required
                    className="w-full bg-black/60 border border-white/5 rounded-md pl-12 pr-4 py-4 text-sm focus:border-cyber-neon-blue/40 outline-none transition-all placeholder:text-gray-800"
                    placeholder="ENTER_DESIGNATION"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-600 uppercase tracking-[0.3em] ml-1">Secure_Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                  <input 
                    type="password" 
                    required
                    className="w-full bg-black/60 border border-white/5 rounded-md pl-12 pr-4 py-4 text-sm focus:border-cyber-neon-blue/40 outline-none transition-all placeholder:text-gray-800"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded flex items-center gap-3">
                  <ShieldAlert size={16} className="text-red-500" />
                  <span className="text-[10px] text-red-500 uppercase tracking-widest">{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-cyber-neon-blue hover:bg-cyber-neon-green text-black font-bold text-xs tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {loading ? 'AUTHENTICATING' : (
                  <>
                    UPLINK_START
                    <Zap size={14} className="group-hover:scale-125 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex justify-between items-center px-1">
              <Link to="/register" className="text-[10px] text-gray-600 hover:text-cyber-neon-blue transition-colors uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                New_Clearance
              </Link>
              <div className="text-[9px] text-gray-800 uppercase">Secure_V4.0</div>
            </div>
          </div>
        </div>

        {/* Global Footer Elements */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-20 lg:hidden">
          <div className="text-[8px] tracking-[0.5em] text-white">SENTINEL_SECURITY_LAB</div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
