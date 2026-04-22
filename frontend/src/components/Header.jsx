import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import api from '../services/api';


const Header = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState(null); // null | 'syncing' | { count, time }


  // Live ticking clock - updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleRefresh = async () => {
    try {
      await api.post('/detect');
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleS3Sync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await api.post('/logs/sync');
      setSyncStatus({ count: res.data.new_logs, time: new Date().toLocaleTimeString() });
      // Auto-clear after 5s
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err) {
      setSyncStatus(null);
      console.error('S3 sync failed', err);
    }
  };

  // Format date and time in IST
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="h-14 bg-surface-container-low border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative z-10">
      <div className="flex items-center gap-4">
        {/* Empty space for now */}
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 text-xs font-data tracking-wider">
        <span className="text-on-surface-variant">{formatDate(currentTime)}</span>
        <span className="text-primary font-semibold text-sm tabular-nums">{formatTime(currentTime)}</span>
        <span className="text-on-surface-variant/50 text-[10px]">IST</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-tertiary/10 border border-tertiary/30 text-tertiary px-3 py-1 rounded-full text-[11px] font-medium tracking-wide">
          <div className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_6px_#00e57a] animate-pulse"></div>
          SYSTEM LIVE
        </div>

        {/* S3 Sync Button */}
        <button
          onClick={handleS3Sync}
          disabled={syncStatus === 'syncing'}
          title="Pull latest logs from AWS S3"
          className="flex items-center gap-1.5 bg-surface-container border border-white/10 text-on-surface-variant px-3 py-1.5 rounded-sm text-xs transition-all hover:bg-surface-container-high hover:text-primary hover:border-primary font-medium disabled:opacity-50"
        >
          <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
          {syncStatus === 'syncing'
            ? 'Syncing S3...'
            : syncStatus
            ? `+${syncStatus.count} logs · ${syncStatus.time}`
            : 'S3 Sync'}
        </button>

        <button 
          onClick={handleRefresh}
          className="bg-surface-container border border-white/10 text-on-surface-variant px-3 py-1.5 rounded-sm text-xs flex items-center gap-2 transition-all hover:bg-surface-container-high hover:text-on-surface hover:border-primary font-medium"
        >
          ↻ Force Scan
        </button>

        <button 
          onClick={handleLogout}
          className="text-on-surface-variant hover:text-error transition-colors p-1"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
