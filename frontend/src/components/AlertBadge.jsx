export const AlertBadge = ({ severity }) => {
  const styles = {
    critical: 'bg-error text-error border-error',
    high: 'bg-error text-error border-error',
    medium: 'bg-on-surface text-on-surface border-on-surface',
    low: 'bg-tertiary text-tertiary border-tertiary',
  };

  const styleClass = styles[severity?.toLowerCase()] || styles.low;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-data tracking-widest uppercase border bg-opacity-10 border-opacity-20 ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        severity?.toLowerCase() === 'critical' ? 'bg-error' : 
        severity?.toLowerCase() === 'high' ? 'bg-error' : 
        severity?.toLowerCase() === 'medium' ? 'bg-on-surface' : 'bg-tertiary'}`}></span>
      {severity}
    </span>
  );
};
