import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import DashboardPreview from '../components/DashboardPreview';
import TrustSection from '../components/TrustSection';
import FooterCTA from '../components/FooterCTA';

export default function Landing() {
  return (
    <div className="bg-[#020617] text-gray-100 min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Anti-Banding Noise Layer */}
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none z-0" />
      
      {/* Ambient Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tertiary/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <HowItWorks />
          <DashboardPreview />
          <TrustSection />
          <FooterCTA />
        </main>
      </div>
    </div>
  );
}
