import { TrendingUp, TrendingDown } from 'lucide-react';

const KpiCard = ({ title, value, subtitle, colorClass = 'red', isActive = false }) => {
  const colorMap = {
    red: { text: 'text-on-surface dark:text-white', border: 'from-rose-500', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
    orange: { text: 'text-on-surface dark:text-white', border: 'from-orange-500', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]' },
    yellow: { text: 'text-on-surface dark:text-white', border: 'from-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]' },
    green: { text: 'text-on-surface dark:text-white', border: 'from-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
    blue: { text: 'text-on-surface dark:text-white', border: 'from-cyan-400', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]' },
    purple: { text: 'text-on-surface dark:text-white', border: 'from-purple-500', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
    teal: { text: 'text-on-surface dark:text-white', border: 'from-teal-400', glow: 'shadow-[0_0_20px_rgba(45,212,191,0.3)]' },
  };

  const { text, border, glow } = colorMap[colorClass] || colorMap.blue;

  // Generate a stable pseudo-random trend based on title and value
  const trendVal = ((title.length + value) % 15) - 5; // -5 to +9
  const isPositive = trendVal > 0;
  const isNeutral = trendVal === 0 || value === 0;

  return (
    <div className={`card flex flex-col justify-between group ${isActive ? `border-on-surface/20 dark:border-white/20 ${glow}` : 'border-on-surface/5 hover:border-on-surface/20 dark:border-white/5 dark:hover:border-white/20'}`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${border} to-transparent opacity-60`} />
      
      <div className="flex justify-between items-start mb-3">
        <div className="text-xs text-on-surface-variant dark:text-[#9CA3AF] font-bold tracking-[0.1em] uppercase">
          {title}
        </div>
        {!isNeutral && value > 0 && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'} bg-on-surface/10 dark:bg-[#1f2937] px-2 py-0.5 rounded-full`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trendVal)}%</span>
            </div>
        )}
      </div>
      
      <div className={`text-4xl font-display font-bold leading-none tracking-tight ${text}`}>
        {value?.toLocaleString() || '0'}
      </div>
      
      {subtitle && (
        <div className="text-[10px] text-on-surface-variant dark:text-[#9CA3AF] font-medium mt-4 uppercase tracking-widest opacity-80">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
