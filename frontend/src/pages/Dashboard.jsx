import { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import { AlertBadge } from '../components/AlertBadge';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return <div className="p-8 text-on-surface-variant font-data animate-pulse">Initializing Telemetry...</div>;
  if (!stats) return <div className="p-8 text-error">Failed to load telemetry.</div>;

  const PIE_COLORS = ['#ff3b5c', '#00d1ff', '#00e57a', '#f5c842', '#a855f7'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Security Overview</h2>
        <p className="text-xs text-on-surface-variant font-data mt-1 tracking-wider uppercase">Live Threat Intelligence</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard title="Total Alerts" value={stats.total_alerts} subtitle="All threats detected" colorClass="red" />
        <KpiCard title="Critical" value={stats.critical_alerts} subtitle="Immediate action" colorClass="red" />
        <KpiCard title="High" value={stats.high_alerts} subtitle="Priority response" colorClass="orange" />
        <KpiCard title="Medium" value={stats.medium_alerts} subtitle="Monitor closely" colorClass="yellow" />
        <KpiCard title="Low" value={stats.low_alerts} subtitle="Informational" colorClass="green" />
        <KpiCard title="Attacker IPs" value={stats.unique_attacker_ips} subtitle="Unique sources" colorClass="blue" />
        <KpiCard title="Events Processed" value={stats.total_logs} subtitle="Total log entries" colorClass="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Timeline Chart */}
        <div className="card xl:col-span-2 flex flex-col min-h-[300px]">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary"></span>
            Alert Timeline
          </h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#253048" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#8896b3" 
                  tick={{ fill: '#8896b3', fontSize: 10, fontFamily: 'monospace' }} 
                  tickFormatter={(val) => val.split(' ')[1] || val} // Just show hour
                />
                <YAxis stroke="#8896b3" tick={{ fill: '#8896b3', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1f25', borderColor: '#253048', borderRadius: '4px' }}
                  itemStyle={{ color: '#00d1ff', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#8896b3', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00d1ff" 
                  strokeWidth={2} 
                  dot={{ r: 2, fill: '#00d1ff' }} 
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#00d1ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Types Pie */}
        <div className="card flex flex-col min-h-[300px]">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-error shadow-[0_0_6px_#ff3b5c]"></span>
            Threat Types
          </h3>
          <div className="flex-1 w-full min-h-[250px] relative">
            {stats.threat_types.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.threat_types}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="type"
                    stroke="none"
                  >
                    {stats.threat_types.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1f25', borderColor: '#253048', borderRadius: '4px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant">No explicit threat data.</div>
            )}
            
            {/* Custom Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 px-2">
              {stats.threat_types.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px] text-on-surface">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                  <span className="truncate" title={t.type}>{t.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attacker IPs */}
        <div className="card">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a35]"></span>
             Top Offending IPs
          </h3>
          <div className="space-y-3">
            {stats.top_ips.map((ip, idx) => (
              <div key={idx} className="flex justify-between items-center bg-surface-container-low p-2 px-3 rounded text-sm group">
                <span className="font-data text-primary group-hover:text-white transition-colors">{ip.ip}</span>
                <span className="font-data text-on-surface-variant bg-surface px-2 py-0.5 rounded text-xs border border-white/5">{ip.count} alerts</span>
              </div>
            ))}
            {stats.top_ips.length === 0 && <div className="text-center text-sm text-on-surface-variant py-4">No attackers logged</div>}
          </div>
        </div>

        {/* Recent Alerts Feed Component */}
        <div className="card max-h-[400px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2 sticky top-0 bg-surface-container pb-2">
             <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
             Live Alert Feed
          </h3>
          <div className="space-y-3">
            {stats.recent_alerts.map((alert) => (
              <div key={alert.id} className="border-l-2 border-white/10 pl-3 py-2 bg-gradient-to-r from-white/[0.02] to-transparent hover:from-white/[0.04] transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-bold text-on-surface truncate pr-2">{alert.alert_type}</span>
                  <AlertBadge severity={alert.severity} />
                </div>
                <div className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {alert.description}
                </div>
                <div className="text-[10px] text-on-surface-variant/70 font-data mt-2 flex justify-between">
                  <span>SRC: {alert.source_ip || 'UNKNOWN'}</span>
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {stats.recent_alerts.length === 0 && <div className="text-center text-sm text-on-surface-variant py-4">No recent alerts</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
