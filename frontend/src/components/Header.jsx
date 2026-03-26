import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import api from '../services/api';

const Header = () => {
  const navigate = useNavigate();

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

  return (
    <header className="h-14 bg-surface-container-low border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative z-10">
      <div className="flex items-center gap-4">
        {/* Empty space for now */}
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 text-xs text-on-surface-variant font-data tracking-wider">
        {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-tertiary/10 border border-tertiary/30 text-tertiary px-3 py-1 rounded-full text-[11px] font-medium tracking-wide">
          <div className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_6px_#00e57a] animate-pulse"></div>
          SYSTEM LIVE
        </div>
        
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
