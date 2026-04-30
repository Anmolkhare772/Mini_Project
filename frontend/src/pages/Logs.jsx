import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, ShieldAlert, Monitor, Terminal, ChevronLeft, ChevronRight, RefreshCw, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const Logs = () => {
  const location = useLocation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // URL Params parsing
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialIp = queryParams.get('ip') || '';

  // Filters
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState(initialIp); // We use this for search (including IP)

  // Manual Log Analyzer state
  const [rawLog, setRawLog] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const searchInputRef = useRef(null);

  const fetchLogs = async (page = 1) => {
    setLoading(page === 1); // Only full load state for first page to avoid flickering
    try {
      const res = await api.get('/logs', {
        params: { page, per_page: 25, status, event_type: eventType }
      });
      setLogs(res.data.logs);
      setPagination({
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total
      });
    } catch (err) {
      toast.error('Failed to retrieve log telemetry');
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    const interval = setInterval(() => fetchLogs(pagination.page), 5000); // 5s interval for live logs
    return () => clearInterval(interval);
  }, [status, eventType, pagination.page]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const highlightText = (text, highlight) => {
    if (!highlight.trim() || !text) return text;
    const parts = String(text).split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <span key={i} className="bg-primary text-surface-container font-bold px-0.5 rounded">{part}</span> : part
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAnalyze = async () => {
    if (!rawLog.trim()) return;
    setAnalysisLoading(true);
    setAnalysisResult(null);
    const toastId = toast.loading('Preprocessing raw payload...');
    try {
      const res = await api.post('/logs/raw', { raw_log: rawLog });
      const alerts = res.data.alerts_triggered || [];
      setAnalysisResult({ success: true, alerts });
      
      if (alerts.length > 0) {
        toast.error(`Analysis Found ${alerts.length} Threats`, { id: toastId });
      } else {
        toast.success('Static analysis complete: Clean', { id: toastId });
      }

      setRawLog('');
      fetchLogs(1); // Refresh logs table immediately
    } catch (err) {
      setAnalysisResult({ success: false, error: 'Heuristic analysis failed.' });
      toast.error('Log processing error', { id: toastId });
      console.error(err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full">
      {/* Header with Title and Search Input */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-on-surface tracking-tight">Telemetry Forge</h2>
          <p className="text-[10px] text-on-surface-variant font-data mt-1 tracking-[0.3em] uppercase flex items-center gap-2">
            <Terminal size={12} className="text-primary" />
            Raw Event Forensics Stream
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-on-surface-border p-1 rounded-lg border border-on-surface-border">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={14} />
                <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Search IPs, Paths, Events..." 
                    className="bg-transparent text-on-surface text-sm rounded pl-9 pr-14 py-1.5 focus:outline-none w-[200px] lg:w-[300px] transition-all font-data"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    <span className="text-[9px] font-bold text-on-surface-variant/50 border border-on-surface-variant/20 rounded px-1.5 py-0.5 shadow-sm bg-surface-container">Ctrl+K</span>
                </div>
            </div>
            <select 
                className="bg-surface-container-high text-on-surface text-[10px] uppercase font-bold tracking-widest rounded px-3 py-2 outline-none cursor-pointer hover:bg-primary transition-colors"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
            >
                <option value="">ALL STATUS</option>
                <option value="success">PASS ONLY</option>
                <option value="failure">FLAGGED</option>
            </select>
        </div>
      </div>

      {/* Manual Analyzer Module */}
      <div className="card border-primary bg-on-surface-border group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
            <Cpu size={48} className="text-primary" />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                   Static Payload Analyzer
                </h3>
                <textarea 
                    className="ghost-input text-[13px] h-20 font-data"
                    placeholder="Enter raw log payload for heuristic signature matching..."
                    value={rawLog}
                    onChange={(e) => setRawLog(e.target.value)}
                />
            </div>
            <button 
                onClick={handleAnalyze}
                disabled={analysisLoading || !rawLog.trim()}
                className="btn-primary self-center md:self-end shrink-0 px-8 py-3 text-xs"
            >
                {analysisLoading ? <RefreshCw className="animate-spin" size={16} /> : 'INJECT & ANALYZE'}
            </button>
        </div>
        
        {analysisResult && analysisResult.alerts.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-error border border-error animate-fade-in">
                <div className="flex items-center gap-2 text-error font-bold text-[11px] uppercase tracking-widest mb-2">
                    <ShieldAlert size={14} /> HEURISTIC WARNING: SIGNATURES MATCHED
                </div>
                <div className="space-y-1">
                    {analysisResult.alerts.map((a, i) => (
                        <div key={i} className="text-[12px] text-on-surface-variant font-data pl-5 border-l border-error">
                            {a.description}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Logs Table Area */}
      <div className="flex-1 flex flex-col bg-surface-container rounded-xl border border-on-surface-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-on-surface-border border-b border-on-surface-border">
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Epoch Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Event Identity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Source Vector</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Protocol Stats</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Telemetry Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface-border font-data">
                {loading ? (
                   [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse opacity-50">
                        <td colSpan="5" className="px-6 py-4 bg-on-surface-border h-12"></td>
                    </tr>
                   ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-20 text-center flex flex-col items-center justify-center opacity-40">
                        <Monitor size={48} className="mb-2" />
                        <span className="text-xs uppercase font-bold tracking-[0.4em]">Environmental Scans Empty</span>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log.id} 
                        className="hover:bg-on-surface-border transition-colors group animate-fade-in"
                        style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <td className="px-6 py-4 text-on-surface-variant whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-on-surface-border border border-on-surface-border text-[10px] text-on-surface font-bold tracking-tighter">
                            {highlightText(log.event_type, eventType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-primary font-bold text-[13px]">
                        {highlightText(log.ip_address, eventType)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border 
                          ${log.status === 'success' 
                            ? 'bg-tertiary text-tertiary border-tertiary' 
                            : 'bg-error text-error border-error'}`
                        }>
                          {log.status === 'success' ? 'PASS' : 'FLAGGED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-[12px] truncate max-w-[400px] leading-none" title={log.details}>
                        {highlightText(log.details || 'NO_CONTEXT', eventType)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        {/* Tactical Pagination */}
        <div className="p-4 bg-on-surface-border border-t border-on-surface-border flex items-center justify-between shrink-0">
          <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
            Stream Index: {((pagination.page - 1) * 25) + 1} - {Math.min(pagination.page * 25, pagination.total)} OF {pagination.total}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)} 
              disabled={pagination.page === 1}
              className="p-2 rounded-lg bg-surface-container border border-on-surface-border text-on-surface disabled:opacity-20 hover:text-primary transition-all active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="font-data text-xs px-4 text-on-surface font-bold">
               {pagination.page} <span className="opacity-30 mx-1">/</span> {pagination.pages}
            </div>
            <button 
              onClick={() => handlePageChange(pagination.page + 1)} 
              disabled={pagination.page === pagination.pages || pagination.pages === 0}
              className="p-2 rounded-lg bg-surface-container border border-on-surface-border text-on-surface disabled:opacity-20 hover:text-primary transition-all active:scale-90"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
