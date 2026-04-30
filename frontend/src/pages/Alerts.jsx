import { useEffect, useState } from 'react';
import api from '../services/api';
import { AlertBadge } from '../components/AlertBadge';
import AlertDetailDrawer from '../components/AlertDetailDrawer';
import { SkeletonTableRow, SkeletonStyles } from '../components/Skeleton';
import ExportPanel from '../components/ExportPanel';
import { toast } from 'sonner';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [severity, setSeverity] = useState('');

  // Drawer state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const openDrawer = (alert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedAlert(null), 300);
  };

  const handleBlockIP = (ip) => {
    toast.success(`Firewall rule created: BLOCK ${ip}`, { duration: 4000 });
    // In production, this would call an API endpoint to block the IP
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <SkeletonStyles />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Security Alerts</h2>
          <p className="text-xs text-on-surface-variant font-data mt-1 tracking-wider uppercase">Detected Threat Feed</p>
        </div>
        <ExportPanel alerts={alerts} />
      </div>

      <div className="flex gap-2">
        {['', 'critical', 'high', 'medium', 'low'].map((level) => (
          <button
            key={level}
            onClick={() => setSeverity(level)}
            className={`px-4 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all border
              ${severity === level 
                ? 'bg-primary text-primary border-primary hover:bg-primary' 
                : 'bg-surface-container border-white text-on-surface-variant hover:bg-surface-container-high hover:border-white'}`}
          >
            {level === '' ? 'ALL LEVELS' : level}
          </button>
        ))}
      </div>

      <div className="card flex-1 overflow-auto bg-surface p-0">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-surface-container border-b border-white z-10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <tr>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Date & Time</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Severity</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Trigger Type</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Source IP</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest w-full">Description Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white font-data text-xs">
            {loading ? (
              [...Array(8)].map((_, i) => <SkeletonTableRow key={i} cols={5} />)
            ) : alerts.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">No alerts found. System normal.</td></tr>
            ) : (
              alerts.map((alert) => (
                <tr 
                  key={alert.id} 
                  onClick={() => openDrawer(alert)}
                  className="hover:bg-on-surface-border transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3.5 text-on-surface-variant whitespace-nowrap">{new Date(alert.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</td>
                  <td className="px-4 py-3.5"><AlertBadge severity={alert.severity} /></td>
                  <td className="px-4 py-3.5 text-on-surface font-semibold truncate max-w-[150px]">{alert.alert_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3.5 text-primary group-hover:text-on-surface transition-colors">{alert.source_ip || '-'}</td>
                  <td className="px-4 py-3.5 text-on-surface-variant truncate max-w-[400px] leading-relaxed" title={alert.description}>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate">{alert.description}</span>
                      <span className="text-[9px] text-on-surface-variant/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 uppercase tracking-widest font-bold">
                        View →
                      </span>
                    </div>
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
          className="bg-surface border border-white px-3 py-1.5 rounded text-xs text-on-surface disabled:opacity-30 hover:bg-surface-container"
        >&lt;</button>
        <span className="text-xs text-on-surface-variant font-data px-4 py-1.5">
          PAGE {pagination.page} OF {Math.max(1, pagination.pages)}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages || pagination.pages === 0}
          className="bg-surface border border-white px-3 py-1.5 rounded text-xs text-on-surface disabled:opacity-30 hover:bg-surface-container"
        >&gt;</button>
      </div>

      {/* Alert Detail Drawer */}
      <AlertDetailDrawer
        alert={selectedAlert}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onBlockIP={handleBlockIP}
      />
    </div>
  );
};

export default Alerts;
