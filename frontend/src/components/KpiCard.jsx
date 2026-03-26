const KpiCard = ({ title, value, subtitle, colorClass = 'red' }) => {
  // Mapping color names to actual Tailwind classes for the top bar and value text
  const colorMap = {
    red: { text: 'text-error', border: 'from-error' },
    orange: { text: 'text-[#ff7a35]', border: 'from-[#ff7a35]' },
    yellow: { text: 'text-[#f5c842]', border: 'from-[#f5c842]' },
    green: { text: 'text-tertiary', border: 'from-tertiary' },
    blue: { text: 'text-primary', border: 'from-primary' },
    purple: { text: 'text-[#a855f7]', border: 'from-[#a855f7]' },
    teal: { text: 'text-[#00d4c8]', border: 'from-[#00d4c8]' },
  };

  const { text, border } = colorMap[colorClass] || colorMap.blue;

  return (
    <div className="bg-surface-container border border-white/5 rounded-lg p-4 relative overflow-hidden group hover:border-[#253048] hover:-translate-y-[1px] transition-all duration-200 cursor-default">
      <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-gradient-to-r ${border} to-transparent`} />
      <div className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase mb-2">
        {title}
      </div>
      <div className={`text-3xl font-bold leading-none font-data tracking-tight ${text}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] text-on-surface-variant mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
