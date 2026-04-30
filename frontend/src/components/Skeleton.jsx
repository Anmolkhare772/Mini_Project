/**
 * Skeleton shimmer loading components for professional loading states.
 */

const shimmerStyle = {
  backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(var(--color-on-surface), 0.06) 50%, transparent 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s ease-in-out infinite',
};

export const SkeletonBlock = ({ className = '', style = {} }) => (
  <div
    className={`bg-on-surface/5 rounded ${className}`}
    style={{ ...shimmerStyle, ...style }}
  />
);

export const SkeletonKpiCard = () => (
  <div className="card relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-[3px] bg-on-surface/5" />
    <SkeletonBlock className="h-3 w-16 mb-3 rounded" />
    <SkeletonBlock className="h-8 w-20 mb-2 rounded" />
    <div className="border-t border-on-surface/5 pt-2 mt-2">
      <SkeletonBlock className="h-2 w-24 rounded" />
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="card lg:col-span-2 flex flex-col min-h-[350px]">
    <div className="flex justify-between items-start mb-6">
      <SkeletonBlock className="h-3 w-40 rounded" />
      <SkeletonBlock className="h-3 w-16 rounded" />
    </div>
    <div className="flex-1 flex items-end gap-2 px-4 pb-4">
      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            ...shimmerStyle,
            height: `${h}%`,
            backgroundColor: 'rgba(var(--color-on-surface), 0.04)',
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  </div>
);

export const SkeletonPie = () => (
  <div className="card flex flex-col items-center">
    <SkeletonBlock className="h-3 w-32 self-start mb-6 rounded" />
    <div className="h-[220px] w-full flex items-center justify-center">
      <div
        className="w-[180px] h-[180px] rounded-full border-[20px]"
        style={{
          ...shimmerStyle,
          borderColor: 'rgba(var(--color-on-surface), 0.06)',
          backgroundColor: 'transparent',
        }}
      />
    </div>
    <div className="mt-8 grid grid-cols-2 gap-3 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-2">
          <SkeletonBlock className="h-2 w-16 mb-2 rounded" />
          <SkeletonBlock className="h-4 w-10 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonAlertRow = () => (
  <div className="border-l-2 border-on-surface/10 pl-4 py-3 bg-on-surface/5 rounded-r-lg">
    <div className="flex justify-between items-start mb-2">
      <SkeletonBlock className="h-3 w-28 rounded" />
      <SkeletonBlock className="h-4 w-14 rounded-full" />
    </div>
    <SkeletonBlock className="h-3 w-full mb-2 rounded" />
    <div className="flex justify-between">
      <SkeletonBlock className="h-2 w-36 rounded" />
      <SkeletonBlock className="h-2 w-16 rounded" />
    </div>
  </div>
);

export const SkeletonIPRow = () => (
  <div className="flex justify-between items-center bg-on-surface/5 p-3 rounded-lg">
    <div className="flex items-center gap-3">
      <SkeletonBlock className="w-1.5 h-1.5 rounded-full" />
      <SkeletonBlock className="h-3 w-28 rounded" />
    </div>
    <SkeletonBlock className="h-3 w-16 rounded" />
  </div>
);

export const SkeletonTableRow = ({ cols = 5 }) => (
  <tr style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}>
    {Array(cols).fill(0).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <SkeletonBlock
          className="h-3 rounded"
          style={{
            width: `${50 + Math.random() * 50}%`,
            animationDelay: `${i * 150}ms`,
          }}
        />
      </td>
    ))}
  </tr>
);

export const SkeletonMap = () => (
  <div className="card">
    <div className="flex justify-between items-start mb-4">
      <SkeletonBlock className="h-3 w-40 rounded" />
      <SkeletonBlock className="h-3 w-12 rounded" />
    </div>
    <SkeletonBlock className="h-[300px] w-full rounded-lg" />
    <div className="mt-4 grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} className="h-12 rounded-lg" />
      ))}
    </div>
  </div>
);

/* Inject keyframes via a style element */
export const SkeletonStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `}</style>
);
