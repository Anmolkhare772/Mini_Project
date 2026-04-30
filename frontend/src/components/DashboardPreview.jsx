import React from 'react';

export default function DashboardPreview() {
  return (
    <section className="py-24 bg-cyber-dark overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative group">
          {/* Background Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyber-neon-blue to-cyber-neon-green rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-cyber-dark rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="bg-white/5 px-4 py-1 rounded-md text-[10px] text-gray-500 font-mono flex-1 text-center">
                sentinel.cybershield.io/dashboard
              </div>
            </div>
            
            <img 
              src="/assets/dashboard_mockup.png" 
              alt="CyberShield Dashboard Mockup" 
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left px-4">
          <div>
            <h4 className="text-white font-bold mb-2">Tactical Map</h4>
            <p className="text-gray-500 text-sm">Visualize attack origins and global threat vectors in real-time.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">ML Analytics</h4>
            <p className="text-gray-500 text-sm">Deep inspection of every log entry using trained classification models.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Audit Logs</h4>
            <p className="text-gray-500 text-sm">Comprehensive searchable database of all environmental security events.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
