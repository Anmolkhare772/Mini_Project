const Settings = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">System Configuration</h2>
        <p className="text-xs text-on-surface-variant font-data mt-1 tracking-wider uppercase">Global Preferences & Detection Rules</p>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-on-surface border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm bg-primary border shadow-glow-primary"></span>
          Detection Engine Thresholds
        </h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wide">Brute Force Tolerance (Attempts/5m)</label>
              <span className="text-xs font-data text-primary border border-primary/30 px-2 py-0.5 rounded bg-primary/10">5 Attempts</span>
            </div>
            <input type="range" className="w-full accent-primary" min="1" max="20" defaultValue="5" disabled />
            <p className="text-[10px] text-on-surface-variant/60 mt-1">Locked by global security policy. Lower values increase sensitivity.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wide">Port Scan Detection (Unique Ports/5m)</label>
              <span className="text-xs font-data text-primary border border-primary/30 px-2 py-0.5 rounded bg-primary/10">10 Ports</span>
            </div>
            <input type="range" className="w-full accent-primary" min="5" max="50" defaultValue="10" disabled />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-on-surface border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-tertiary"></span>
            Notification Channels
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-not-allowed opacity-70">
              <input type="checkbox" className="accent-primary w-4 h-4 cursor-not-allowed" checked disabled />
              <span className="text-sm text-on-surface">Dashboard Feed</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="accent-primary w-4 h-4 cursor-pointer" />
              <span className="text-sm text-on-surface">Email Dispatches</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="accent-primary w-4 h-4 cursor-pointer" />
              <span className="text-sm text-on-surface">SMS Critical Alerts</span>
            </label>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-on-surface border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-error shadow-[0_0_6px_#ff3b5c]"></span>
            Danger Zone
          </h3>
          <div className="space-y-4">
             <p className="text-xs text-on-surface-variant leading-relaxed">
               Modifying core threat models or resetting AI heuristic weights will require Executive override code.
             </p>
             <button className="bg-error/10 text-error border border-error/20 px-4 py-2 text-xs font-semibold rounded hover:bg-error hover:text-white transition-colors w-full uppercase tracking-wider">
               Flush All Telemetry
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
