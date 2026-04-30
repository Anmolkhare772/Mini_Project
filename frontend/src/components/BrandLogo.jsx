import React from 'react';

const BrandLogo = ({ size = "md", className = "", vertical = false }) => {
  const sizes = {
    sm: "h-8",
    md: "h-14",
    lg: "h-24",
    xl: "h-36"
  };

  return (
    <div className={`flex ${vertical ? 'flex-col items-center text-center' : 'flex-row items-center'} gap-3 md:gap-5 ${className} max-w-full relative`}>
      <div className={`relative ${sizes[size]} aspect-square group flex items-center justify-center shrink-0 overflow-hidden rounded-full`}>
        {/* Layer 1: High-Density Cloud Detail (Animated SVG) */}
        <div className="absolute inset-0 scale-150 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyber-neon-blue animate-pulse-slow">
            <path d="M20 60 Q20 40 40 40 T60 40 T80 60 Q80 80 50 80 Q20 80 20 60" fill="currentColor" opacity="0.2" />
          </svg>
        </div>

        {/* Layer 2: Soft Radial Glow - Constrained to prevent corner bleed */}
        <div className={`absolute inset-0 bg-cyber-neon-blue/20 ${size === 'md' ? 'blur-xl' : 'blur-3xl'} rounded-full animate-pulse`}></div>
        
        <img 
          src="/logo.png" 
          alt="CyberShield Sentinel" 
          className="w-full h-full relative z-10 drop-shadow-[0_0_20px_rgba(0,207,255,0.8)] object-contain transition-all group-hover:scale-110 duration-500 mix-blend-screen rounded-full" 
        />
      </div>

      <div className="flex flex-col leading-[0.8] max-w-full">
        <span className={`${vertical ? 'text-xl md:text-2xl' : 'text-xl md:text-2xl'} font-display font-bold text-white tracking-tighter flex items-center gap-2 ${vertical ? 'justify-center' : ''}`}>
          Cyber<span className="text-cyber-neon-blue">Shield</span>
        </span>
        <div className={`font-data text-on-surface-variant/80 uppercase mt-2 border-t border-white/10 pt-2 flex flex-wrap gap-x-2 gap-y-1 ${vertical ? 'justify-center text-[8px] tracking-[0.1em]' : 'text-[9px] tracking-[0.2em]'}`}>
           <span className="text-cyber-neon-blue font-bold whitespace-nowrap">Cloud Analytics</span>
           <span className="opacity-30">•</span>
           <span className="whitespace-nowrap text-cyber-neon-green font-bold">Secure Sentinel</span>
        </div>
      </div>
    </div>
  );
};

export default BrandLogo;
