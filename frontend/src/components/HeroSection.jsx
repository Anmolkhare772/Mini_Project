import React from 'react';
import { ShieldCheck, Activity, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-cyber-dark">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00CFFF_1px,transparent_1px),linear-gradient(to_bottom,#00CFFF_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 max-w-4xl animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-neon-blue/10 border border-cyber-neon-blue/20 text-cyber-neon-blue text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
          <Activity size={12} className="animate-pulse" />
          ML-Powered Sentinel Now Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
          Real-Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-neon-blue to-cyber-neon-green">Trinetra</span> Detection System
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Advanced security telemetry processing with real-time machine learning classification. Transform raw logs into actionable intelligence in milliseconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/dashboard" 
            className="group flex items-center gap-2 bg-cyber-neon-blue text-black px-8 py-4 rounded-xl text-lg font-bold hover:bg-cyber-neon-green transition-all hover:scale-105 shadow-neon-blue hover:shadow-neon-green"
          >
            Launch Dashboard
            <Zap size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/logs" 
            className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center"
          >
            View Live Logs
          </Link>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-20 left-10 md:left-20 animate-bounce duration-[3s] opacity-50">
        <div className="p-1 rounded-2xl bg-cyber-neon-blue/10 border border-cyber-neon-blue/20 shadow-neon-blue">
          <img src="/logo.png" alt="Sentinel Icon" className="w-10 h-10 object-contain" />
        </div>
      </div>
      <div className="absolute top-40 right-10 md:right-40 animate-pulse opacity-50">
        <div className="p-3 rounded-2xl bg-cyber-neon-green/10 border border-cyber-neon-green/20 shadow-neon-green">
          <Activity className="text-cyber-neon-green" size={32} />
        </div>
      </div>
    </section>
  );
}
