import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function FooterCTA() {
  return (
    <footer className="bg-cyber-dark py-24 px-6 relative overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyber-neon-blue/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
          Ready to <span className="text-cyber-neon-blue">Secure</span> Your Infrastructure?
        </h2>
        <p className="text-gray-400 mb-12 text-lg">
          Join leading security teams using the CyberShield Lab to detect and neutralize threats in real-time.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 bg-white text-black px-10 py-5 rounded-2xl font-bold hover:bg-cyber-neon-blue hover:text-white transition-all shadow-xl hover:scale-105"
          >
            Start Monitoring Now
            <ChevronRight size={20} />
          </Link>
          <button className="text-gray-400 hover:text-white font-medium px-8 py-5 transition-colors underline decoration-cyber-neon-blue/40 underline-offset-8">
            Schedule Architecture Review
          </button>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-60">
            <span className="text-white font-display font-bold tracking-tight">CyberShield</span>
            <span className="text-gray-600 text-xs">© 2026 Lab Edition</span>
          </div>
          
          <div className="flex gap-8 text-xs text-gray-500">
            <a href="#" className="hover:text-cyber-neon-blue transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyber-neon-blue transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cyber-neon-blue transition-colors">Documentation</a>
            <a href="#" className="hover:text-cyber-neon-blue transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
