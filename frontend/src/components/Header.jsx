import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Sun, Moon, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import AlertNotifier from './AlertNotifier';

const Header = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Successfully logged out');
    navigate('/login');
  };

  const handleRefresh = async () => {
    const toastId = toast.loading('Running security scan...');
    try {
      await api.post('/detect');
      toast.success('Security scan completed successfully!', { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Scan failed to complete.', { id: toastId });
      console.error(err);
    }
  };

  const handleS3Sync = async () => {
    setSyncStatus('syncing');
    const toastId = toast.loading('Synchronizing with AWS S3...');
    try {
      const res = await api.post('/logs/sync');
      const count = res.data.new_logs;
      setSyncStatus({ count, time: new Date().toLocaleTimeString() });
      if (count > 0) {
        toast.success(`S3 Sync Complete: Found ${count} new log files.`, { id: toastId });
      } else {
        toast.info('S3 Sync Complete: No new log files found.', { id: toastId });
      }
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err) {
      setSyncStatus(null);
      toast.error('Failed to sync with AWS S3.', { id: toastId });
    }
  };

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
    <header className="h-14 bg-surface-container-low border-b border-on-surface/10 flex items-center justify-between px-6 pl-14 lg:pl-6 shrink-0 relative z-10 transition-colors duration-300">
      {/* Left Section: Status Badge (Pulsing Light) */}
      <div className="flex-1 flex items-center justify-start">
        <div className="hidden sm:flex items-center gap-2.5 bg-tertiary/10 border border-tertiary/20 text-tertiary px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] transition-all hover:bg-tertiary/20 cursor-default">
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff80] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff80] shadow-[0_0_15px_#00ff80]"></span>
            </div>
            SYSTEM OPERATIONAL
        </div>
      </div>
      
      {/* Middle Section: Center Date/Time (Relocated to prevent overlap) */}
      <div className="flex items-center gap-4 text-xs font-data border-x border-on-surface/5 px-4 h-full">
        <div className="flex items-center gap-2">
             <span className="text-on-surface-variant/40 hidden xl:inline uppercase tracking-widest text-[9px]">Local Epoch</span>
             <span className="text-primary font-bold text-sm tabular-nums tracking-tighter flex items-center gap-1.5 min-w-[70px]">
                <Clock size={12} className="opacity-40" />
                {formatTime(currentTime)}
             </span>
        </div>
        <div className="flex items-center gap-2 border-l border-on-surface/5 pl-4">
             <span className="text-on-surface-variant hidden sm:inline tracking-widest uppercase text-[9px]">{formatDate(currentTime)}</span>
             <span className="text-on-surface-variant/40 text-[9px] hidden sm:inline">IST</span>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex-1 flex items-center justify-end gap-3">
        <button onClick={toggleTheme} className="p-2 text-on-surface-variant hover:text-primary transition-all hover:bg-on-surface/5 rounded-lg active:scale-90 shadow-sm border border-transparent hover:border-primary/10">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <AlertNotifier />

        <div className="hidden md:flex items-center gap-2">
            <button onClick={handleS3Sync} disabled={syncStatus === 'syncing'} className="flex items-center gap-2 bg-surface-container border border-on-surface/10 text-on-surface-variant px-3 py-2 rounded-lg text-[11px] transition-all hover:bg-surface-container-high hover:text-primary hover:border-primary font-bold disabled:opacity-50 active:scale-95">
                <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                S3 SYNC
            </button>
            <button onClick={handleRefresh} className="bg-surface-container border border-on-surface/10 text-on-surface-variant px-3 py-2 rounded-lg text-[11px] flex items-center gap-2 transition-all hover:bg-surface-container-high hover:text-on-surface hover:border-primary font-bold active:scale-95">
                <RefreshCw size={12} /> SCAN
            </button>
        </div>

        <div className="w-px h-6 bg-on-surface/10 mx-1"></div>

        <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-all hover:bg-error/10 p-2 rounded-lg active:scale-90 shadow-sm">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
