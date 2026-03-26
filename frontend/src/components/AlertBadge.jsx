export const AlertBadge = ({ severity }) => {
  const styles = {
    critical: 'bg-error/10 text-[#ff6b85] border-error/20 marker:bg-error shadow-[0_0_4px_#ff3b5c]',
    high: 'bg-[#ff7a35]/10 text-[#ff7a35] border-[#ff7a35]/20 marker:bg-[#ff7a35]',
    medium: 'bg-[#f5c842]/10 text-[#f5c842] border-[#f5c842]/20 marker:bg-[#f5c842]',
    low: 'bg-tertiary/10 text-tertiary border-tertiary/20 marker:bg-tertiary',
  };

  const styleClass = styles[severity?.toLowerCase()] || styles.low;
  // Use a regex/string match logic to pull out the marker color to mimic the pseudo-element before
  const isCritical = severity?.toLowerCase() === 'critical';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[10px] font-semibold font-data tracking-widest uppercase tabular-nums whitespace-nowrap border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-error shadow-[0_0_4px_#ff3b5c]' : 
        severity?.toLowerCase() === 'high' ? 'bg-[#ff7a35]' : 
        severity?.toLowerCase() === 'medium' ? 'bg-[#f5c842]' : 'bg-tertiary'}`}></span>
      {severity}
    </span>
  );
};
