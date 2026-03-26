import { useEffect, useState } from 'react';
import api from '../services/api';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Filters
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState('');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/logs', {
        params: { page, per_page: 20, status, event_type: eventType }
      });
      setLogs(res.data.logs);
      setPagination({
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total
      });
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [status, eventType]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchLogs(newPage);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">System Logs</h2>
        <p className="text-xs text-on-surface-variant font-data mt-1 tracking-wider uppercase">Raw Event Telemetry</p>
      </div>

      <div className="card flex-shrink-0 flex items-center justify-between gap-4 p-3 border-b-0 rounded-b-none bg-surface-container-low">
        <div className="flex gap-3">
          <select 
            className="bg-surface border border-white/10 text-on-surface text-sm rounded px-3 py-1.5 font-body focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="success">Success Only</option>
            <option value="failure">Failure Only</option>
          </select>

          <input 
            type="text" 
            placeholder="Filter by Event..." 
            className="bg-surface border border-white/10 text-on-surface text-sm rounded px-3 py-1.5 font-body focus:outline-none focus:border-primary w-64"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
        </div>
        
        <div className="text-xs text-on-surface-variant font-data">
          Total: <span className="text-primary">{pagination.total}</span> events
        </div>
      </div>

      <div className="card flex-1 overflow-auto rounded-t-none border-t border-white/5 p-0 bg-surface">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-surface-container border-b border-white/10 z-10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <tr>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Timestamp (UTC)</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Source IP</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Event Type</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest w-full">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-data text-xs">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant animate-pulse">Loading Logs Segment...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">No logs match the criteria.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}</td>
                  <td className="px-4 py-3 text-primary">{log.ip_address}</td>
                  <td className="px-4 py-3 text-on-surface truncate max-w-[150px]">{log.event_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border 
                      ${log.status === 'success' 
                        ? 'bg-tertiary/10 text-tertiary border-tertiary/20' 
                        : 'bg-error/10 text-error border-error/20'}`
                    }>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant truncate max-w-[300px]" title={log.details}>
                    {log.details || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <button 
          onClick={() => handlePageChange(pagination.page - 1)} 
          disabled={pagination.page === 1}
          className="bg-surface-container border border-white/10 px-3 py-1.5 rounded text-xs text-on-surface disabled:opacity-30 hover:bg-surface-container-high transition-colors"
        >
          &lt;
        </button>
        <span className="text-xs text-on-surface-variant font-data px-4">
          PAGE {pagination.page} / {Math.max(1, pagination.pages)}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.page + 1)} 
          disabled={pagination.page === pagination.pages || pagination.pages === 0}
          className="bg-surface-container border border-white/10 px-3 py-1.5 rounded text-xs text-on-surface disabled:opacity-30 hover:bg-surface-container-high transition-colors"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Logs;
