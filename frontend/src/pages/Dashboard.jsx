import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush,
  PieChart, Pie, Cell
} from 'recharts';
import { ShieldAlert, Globe, Activity, Zap, TrendingUp, AlertTriangle, LayoutGrid } from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import { AlertBadge } from '../components/AlertBadge';
import { useTheme } from '../context/ThemeContext';
// AttackMap removed by user request

import { SkeletonKpiCard, SkeletonChart, SkeletonPie, SkeletonIPRow, SkeletonAlertRow, SkeletonMap, SkeletonStyles } from '../components/Skeleton';
import { useDashboardLayout, DashboardCustomizer } from '../components/DashboardCustomizer';
import ExportPanel from '../components/ExportPanel';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { widgets, isCustomizing, setIsCustomizing, toggleWidget, reorderWidgets, resetLayout, isVisible } = useDashboardLayout();

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Poll every 5s for live updates
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return (
    <div className="space-y-8 animate-fade-in">
      <SkeletonStyles />
      {/* Skeleton Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="h-8 w-52 bg-on-surface/5 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite', backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(var(--color-on-surface), 0.06) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
          <div className="h-3 w-36 bg-on-surface/5 rounded mt-2" style={{ animation: 'shimmer 1.8s ease-in-out infinite', backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(var(--color-on-surface), 0.06) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
        </div>
      </div>
      {/* Skeleton KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => <SkeletonKpiCard key={i} />)}
      </div>
      {/* Skeleton Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonChart />
        <SkeletonPie />
      </div>

      {/* Skeleton Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><div className="space-y-4">{[...Array(5)].map((_, i) => <SkeletonIPRow key={i} />)}</div></div>
        <div className="card"><div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonAlertRow key={i} />)}</div></div>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-error space-y-4">
        <ShieldAlert size={48} />
        <span className="font-display font-bold">CRITICAL: CONNECTION TO SENTINEL DATA LOST</span>
        <button onClick={fetchStats} className="btn-primary text-xs">RECONNECT</button>
    </div>
  );

  const PIE_COLORS = ['#f43f5e', '#22d3ee', '#10b981', '#fbbf24', '#a855f7'];
  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const axisColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-on-surface dark:text-white tracking-tight">Security Command</h2>
          <p className="text-[10px] text-on-surface-variant dark:text-[#9CA3AF] font-data mt-1 tracking-[0.3em] uppercase flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Tactical Monitoring
            </span>
            <span className="h-3 w-[1px] bg-on-surface/10 dark:bg-white/10 hidden sm:block"></span>
            <span className="hidden sm:flex items-center gap-1.5 text-primary dark:text-cyan-400/80">
              <Activity size={10} />
              Node_0x442: Stable
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPanel alerts={stats.recent_alerts} />
          <button
            onClick={() => setIsCustomizing(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
              isCustomizing
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-on-surface/5 text-on-surface-variant border-on-surface/10 hover:border-primary/40 hover:text-primary'
            }`}
          >
            <LayoutGrid size={12} />
            {isCustomizing ? 'Done' : 'Customize'}
          </button>
          <div className="text-[10px] text-on-surface-variant/60 font-data border border-on-surface/10 bg-on-surface/5 px-3 py-1 rounded hidden sm:block">
             VERSION: 1.0.5-STABLE
          </div>
        </div>
      </div>

      {/* Dashboard Customizer Panel */}
      {isCustomizing && (
        <DashboardCustomizer
          widgets={widgets}
          toggleWidget={toggleWidget}
          reorderWidgets={reorderWidgets}
          resetLayout={resetLayout}
          onClose={() => setIsCustomizing(false)}
        />
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <KpiCard title="Total Alerts" value={stats.total_alerts} subtitle="Threats Detected" colorClass="red" />
        <KpiCard title="Critical" value={stats.critical_alerts} subtitle="Action Required" colorClass="red" isActive={stats.critical_alerts > 0} />
        <KpiCard title="High" value={stats.high_alerts} subtitle="Priority Check" colorClass="orange" />
        <KpiCard title="Medium" value={stats.medium_alerts} subtitle="Observe Flow" colorClass="yellow" />
        <KpiCard title="Low" value={stats.low_alerts} subtitle="Operational" colorClass="green" />
        <KpiCard title="Attackers" value={stats.unique_attacker_ips} subtitle="Unique Hosts" colorClass="blue" />
        <KpiCard title="Logs Analyzed" value={stats.total_logs} subtitle="Total Events" colorClass="teal" />
      </div>

      {/* Main Analytical Grid */}
      {(isVisible('timeline') || isVisible('distribution')) && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline Chart */}
        <div className="card lg:col-span-2 flex flex-col min-h-[350px] group">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-on-surface dark:text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-primary dark:text-cyan-400" />
                Attack Intensity / 24h
            </h3>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-data">
                    <div className="w-2 h-2 rounded-sm bg-primary/40"></div> Trend
                </div>
            </div>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={stats.timeline}>
                <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                   </linearGradient>
                   <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur stdDeviation="3" result="blur" />
                     <feComposite in="SourceGraphic" in2="blur" operator="over" />
                   </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke={axisColor} 
                  tick={{ fill: axisColor, fontSize: 9, fontFamily: 'monospace' }} 
                  tickFormatter={(val) => (val && typeof val === 'string' ? val.split(' ')[1] : val) || val}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke={axisColor} 
                  tick={{ fill: axisColor, fontSize: 9, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={6}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  itemStyle={{ color: '#22d3ee', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#9CA3AF', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#22d3ee" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCount)"
                  animationDuration={1500}
                  filter="url(#glow)"
                />
                <Brush 
                  dataKey="time" 
                  height={20} 
                  stroke={axisColor}
                  fill={isDark ? 'rgba(17, 24, 39, 0.5)' : '#ffffff'}
                  tickFormatter={(val) => (val && typeof val === 'string' ? val.split(' ')[1] : val) || val}
                  className="text-[10px] font-data"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isVisible('distribution') && (
        <div className="card flex flex-col items-center">
            <h3 className="w-full text-xs font-bold text-on-surface dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={14} className="text-error dark:text-rose-500" />
                Risk Distribution
            </h3>
            <div className="h-[220px] w-full relative flex items-center justify-center">
                {stats.threat_types.length > 0 ? (
                  <>
                    <div className="absolute flex flex-col items-center justify-center">
                         <span className="text-2xl font-display font-bold text-on-surface">{stats.total_alerts}</span>
                         <span className="text-[8px] text-on-surface-variant uppercase tracking-widest">Global Risk</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                            <Pie
                                data={stats.threat_types}
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="type"
                                stroke="none"
                                animationDuration={1500}
                                animationBegin={300}
                            >
                                {(stats.threat_types || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: isDark ? 'rgb(30, 31, 37)' : '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-on-surface-variant/40 space-y-2">
                      <Zap size={32} />
                      <span className="text-[10px] uppercase font-bold tracking-widest">No Active Vectors Found</span>
                  </div>
                )}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 w-full">
                {(stats.threat_types || []).slice(0, 4).map((t, idx) => (
                  <div key={idx} className="flex flex-col gap-1 cursor-default hover:bg-on-surface/5 p-2 rounded transition-colors group">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                        <span className="text-[10px] text-on-surface font-bold truncate tracking-tight">{t.type}</span>
                    </div>
                    <div className="text-[14px] font-data text-on-surface-variant/80 pl-3.5 group-hover:text-primary transition-colors">{t.count}</div>
                  </div>
                ))}
            </div>
        </div>
        )}
      </div>
      )}



      {(isVisible('targets') || isVisible('stream')) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investigative Targets (Top IPs) */}
        {isVisible('targets') && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-on-surface dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-primary dark:text-cyan-400" />
                Investigative Targets
            </h3>
            <span className="text-[9px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">High Volatility</span>
          </div>
          <div className="space-y-4">
            {(stats.top_ips || []).map((ip, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/logs?ip=${ip.ip}`)}
                className="flex justify-between items-center bg-on-surface/5 dark:bg-white/5 p-3 rounded-lg border border-on-surface/5 dark:border-white/5 hover:border-primary/40 dark:hover:border-cyan-400/40 hover:bg-primary/5 dark:hover:bg-cyan-400/5 transition-all cursor-pointer group shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 dark:bg-cyan-400/40 group-hover:scale-150 group-hover:bg-primary dark:group-hover:bg-cyan-400 transition-all"></div>
                    <span className="font-data text-primary dark:text-cyan-400 group-hover:font-bold transition-all">{ip.ip}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-data text-on-surface-variant dark:text-[#9CA3AF] text-xs">{ip.count} alerts</span>
                    <div className="text-[10px] text-on-surface-variant/40 dark:text-[#9CA3AF]/40 group-hover:text-primary dark:group-hover:text-cyan-400 group-hover:opacity-100 transition-all">DRILL &gt;</div>
                </div>
              </div>
            ))}
            {(stats.top_ips || []).length === 0 && (
                <div className="text-center py-10 opacity-30">
                    <Activity size={32} className="mx-auto mb-2" />
                    <p className="text-[10px] font-bold tracking-widest uppercase">Peripheral Scanning Clear</p>
                </div>
            )}
          </div>
        </div>
        )}

        {/* Live Vector Stream (Alert Feed) */}
        {isVisible('stream') && (
        <div className="card flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-xs font-bold text-on-surface dark:text-white uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} className="text-error dark:text-rose-500" />
                Live Vector Stream
            </h3>
            <div className="w-2 h-2 rounded-full bg-error animate-ping"></div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {(stats.recent_alerts || []).map((alert) => (
              <div 
                key={alert.id} 
                onClick={() => navigate(`/alerts`)}
                className="group relative overflow-hidden border-l-2 border-error/40 dark:border-rose-500/40 pl-4 py-3 bg-on-surface/5 dark:bg-white/5 hover:bg-on-surface/10 dark:hover:bg-white/10 transition-all cursor-pointer rounded-r-lg backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-error/5 dark:from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-on-surface dark:text-white uppercase tracking-tight">{alert.alert_type.replace(/_/g, ' ')}</span>
                  <AlertBadge severity={alert.severity} />
                </div>
                <div className="text-[13px] text-on-surface-variant dark:text-[#9CA3AF] line-clamp-1 leading-snug group-hover:text-on-surface dark:group-hover:text-white transition-colors">
                  {alert.description}
                </div>
                <div className="text-[9px] text-on-surface-variant/50 dark:text-[#9CA3AF]/50 font-data mt-2 flex justify-between uppercase">
                   <span>ID: {String(alert.id).padStart(6, '0')} · SRC: {alert.source_ip || 'VOID'}</span>
                   <span>{new Date(alert.timestamp).toLocaleTimeString()} IST</span>
                </div>
              </div>
            ))}
            {(stats.recent_alerts || []).length === 0 && (
                <div className="flex flex-col h-full items-center justify-center opacity-20">
                    <ShieldAlert size={48} />
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em]">No Active Breaches</p>
                </div>
            )}
          </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
};

export default Dashboard;
