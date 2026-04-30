import React from 'react';
import { ShieldCheck, Server, GlobeLock } from 'lucide-react';

const TrustCard = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center p-6">
    <Icon className="text-cyber-neon-green mb-4" size={40} />
    <h5 className="text-white font-bold mb-2">{title}</h5>
    <p className="text-gray-500 text-sm text-center max-w-[250px]">{desc}</p>
  </div>
);

export default function TrustSection() {
  return (
    <section id="trust" className="py-24 bg-cyber-dark/50 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-sm">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">Secured by Design</h3>
            <p className="text-gray-500 max-w-xl mx-auto">Our platform is architected for mission-critical reliability and zero-trust security principles.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TrustCard 
              icon={ShieldCheck} 
              title="Verified Integrity" 
              desc="Every log entry is cryptographically hashed to ensure data immutability."
            />
            <TrustCard 
              icon={Server} 
              title="Global Scalability" 
              desc="Built on serverless AWS architecture to handle massive telemetry surges."
            />
            <TrustCard 
              icon={GlobeLock} 
              title="Privacy First" 
              desc="Fully compliant data handling and encryption at rest and in transit."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
