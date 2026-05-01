import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,209,255,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="max-w-3xl glass z-10 p-12 rounded-xl border border-primary shadow-[0_0_80px_rgba(0,209,255,0.1)]">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-on-surface mb-6 tracking-tighter shadow-glow-primary">
          Trinetra <span className="text-primary">Sentinel</span>
        </h1>
        
        <p className="text-lg text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate rule-based detection engine. Monitor logs, detect brute-force attacks in real-time, 
          and protect your infrastructure with surgical precision in a zero-trust environment.
        </p>
        
        <div className="flex items-center justify-center gap-6">
          <Link to="/login" className="btn-primary text-lg px-8 py-3 w-48 shadow-glow-primary">
            Initiate Uplink
          </Link>
          <Link to="/register" className="btn-ghost text-lg px-8 py-3 w-48">
            Request Clearance
          </Link>
        </div>
      </div>
      
      <div className="fixed bottom-6 text-xs text-on-surface-variant font-data tracking-widest uppercase">
        System Operational | v2.0.1
      </div>
    </div>
  );
};

export default Home;
