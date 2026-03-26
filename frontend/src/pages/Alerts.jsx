import { useEffect, useState } from 'react';
import api from '../services/api';
import { AlertBadge } from '../components/AlertBadge';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [severity, setSeverity] = useState('');

  const fetchAlerts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/alerts', {
        params: { page, per_page: 15, severity }
      });
      setAlerts(res.data.alerts);
      setPagination({
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total
      });
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(1);
    const interval = setInterval(() => fetchAlerts(pagination.page), 15000);
    return () => clearInterval(interval);
  }, [severity]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) fetchAlerts(newPage);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Security Alerts</h2>
        <p className="text-xs text-on-surface-variant font-data mt-1 tracking-wider uppercase">Detected Threat Feed</p>
      </div>

      <div className="flex gap-2">
        {['', 'critical', 'high', 'medium', 'low'].map((level) => (
          <button
            key={level}
            onClick={() => setSeverity(level)}
            className={`px-4 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all border
              ${severity === level 
                ? 'bg-primary/20 text-primary border-primary hover:bg-primary/30' 
                : 'bg-surface-container border-white/5 text-on-surface-variant hover:bg-surface-container-high hover:border-white/10'}`}
          >
            {level === '' ? 'ALL LEVELS' : level}
          </button>
        ))}
      </div>

      <div className="card flex-1 overflow-auto bg-surface p-0">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-surface-container border-b border-white/10 z-10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <tr>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Time</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Severity</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Trigger Type</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Source IP</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest w-full">Description Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-data text-xs">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant animate-pulse">Scanning feed...</td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">No alerts found. System normal.</td></tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3.5 text-on-surface-variant whitespace-nowrap">{new Date(alert.timestamp).toISOString().replace('T', ' ').substring(0, 19)}</td>
                  <td className="px-4 py-3.5"><AlertBadge severity={alert.severity} /></td>
                  <td className="px-4 py-3.5 text-on-surface font-semibold truncate max-w-[150px]">{alert.alert_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3.5 text-primary group-hover:text-white transition-colors">{alert.source_ip || '-'}</td>
                  <td className="px-4 py-3.5 text-on-surface-variant/80 truncate max-w-[400px] leading-relaxed" title={alert.description}>
                    {alert.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-2">
        <button 
          onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}
          className="bg-surface border border-white/10 px-3 py-1.5 rounded text-xs text-on-surface disabled:opacity-30 hover:bg-surface-container"
        >&lt;</button>
        <span className="text-xs text-on-surface-variant font-data px-4 py-1.5">
          PAGE {pagination.page} OF {Math.max(1, pagination.pages)}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages || pagination.pages === 0}
          className="bg-surface border border-white/10 px-3 py-1.5 rounded text-xs text-on-surface disabled:opacity-30 hover:bg-surface-container"
        >&gt;</button>
      </div>
    </div>
  );
};

export default Alerts;
