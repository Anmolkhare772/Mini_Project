import React from 'react';
import { Database, Zap, Cpu, Layout, ArrowRight } from 'lucide-react';

const Step = ({ icon: Icon, title, desc, active }) => (
  <div className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all ${active ? 'bg-cyber-neon-blue/5 border-cyber-neon-blue/30 scale-105' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}>
    <div className={`p-4 rounded-2xl mb-4 ${active ? 'bg-cyber-neon-blue/20 shadow-neon-blue' : 'bg-white/5'}`}>
      <Icon className={active ? 'text-cyber-neon-blue' : 'text-gray-400'} size={32} />
    </div>
    <h4 className="text-white font-bold mb-2">{title}</h4>
    <p className="text-gray-500 text-xs">{desc}</p>
  </div>
);

export default function HowItWorks() {
  const steps = [
    { icon: Database, title: "CloudWatch", desc: "Logs Ingested", active: false },
    { icon: Zap, title: "Lambda/S3", desc: "Data Processing", active: false },
    { icon: Cpu, title: "ML Engine", desc: "Threat Detection", active: false },
    { icon: Layout, title: "Dashboard", desc: "Visual Alerts", active: false }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-cyber-dark/50 px-6 border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-cyber-neon-green uppercase tracking-[0.3em] mb-4">Architecture</h2>
          <p className="text-3xl md:text-4xl font-display font-bold text-white">How the Lab Operates</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-neon-blue/20 to-transparent -translate-y-8 z-0"></div>
          
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <Step {...step} />
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center -mt-16 z-10 text-cyber-neon-blue opacity-50">
                  <ArrowRight size={24} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
