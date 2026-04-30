import React from 'react';
import { Shield, Brain, Cloud, Bell, Eye, Lock } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cyber-neon-blue/50 transition-all hover:-translate-y-2 overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    <div className={`p-3 rounded-xl bg-${color}/10 border border-${color}/20 w-fit mb-6 shadow-neon-${color}`}>
      <Icon className={`text-cyber-neon-${color === 'blue' ? 'blue' : 'green'}`} size={28} />
    </div>
    <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-cyber-neon-blue transition-colors">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function FeaturesSection() {
  const features = [
    {
      icon: Eye,
      title: "Real-Time Monitoring",
      description: "Continuously stream security telemetry from CloudWatch and Kinesis. Observe your environment with millisecond latency.",
      color: "blue"
    },
    {
      icon: Brain,
      title: "ML-Based Detection",
      description: "Proprietary Random Forest and Isolation Forest models classify threats and detect zero-day anomalies with high precision.",
      color: "green"
    },
    {
      icon: Cloud,
      title: "Cloud Integration",
      description: "Native AWS integration with S3, Lambda, and Kinesis Firehose. Scale your monitoring as your infrastructure grows.",
      color: "blue"
    },
    {
      icon: Bell,
      title: "Intelligent Alerting",
      description: "Automated alert generation with severity classification. Get notified of critical breaches before they cause damage.",
      color: "green"
    }
  ];

  return (
    <section id="features" className="py-24 bg-cyber-dark px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-cyber-neon-blue uppercase tracking-[0.3em] mb-4">Core Capabilities</h2>
          <p className="text-3xl md:text-4xl font-display font-bold text-white">Enterprise-Grade Defense</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
