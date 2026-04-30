import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, AlertCircle, Settings as SettingsIcon, Users, Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const isActive = currentPath === to;
    
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 mx-3 my-1 rounded-lg text-sm transition-all duration-300 select-none group relative overflow-hidden
          ${isActive 
            ? 'bg-gradient-to-r from-purple-600/20 to-blue-500/20 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
            : 'border border-transparent text-on-surface-variant hover:bg-on-surface/5 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white'
          }`}
      >
        {/* Active Side Border Indicator */}
        {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        )}

        {/* Icon Container with Hover Scale */}
        <div className={`p-2 rounded-md transition-all duration-300 transform ${isActive ? 'bg-purple-500/20 scale-110' : 'group-hover:bg-on-surface/10 dark:group-hover:bg-white/10 group-hover:scale-110'}`}>
            <Icon size={18} className={`shrink-0 transition-colors duration-300 ${isActive ? 'text-purple-400' : 'opacity-60 group-hover:opacity-100 group-hover:text-purple-400'}`} />
        </div>
        
        {/* Label with Hover Translate */}
        <span className={`transition-all duration-300 ${isActive ? 'font-bold tracking-tight text-on-surface dark:text-white' : 'font-medium group-hover:translate-x-1'}`}>
            {label}
        </span>

        {/* Notification Badge */}
        {badge && (
          <span className="ml-auto bg-error/20 text-error border border-error/30 text-[10px] font-data px-2 py-0.5 rounded-full font-bold animate-pulse shadow-sm">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <Link to="/" className="px-6 pb-12 block">
        <BrandLogo size="md" vertical={true} />
      </Link>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 transition-all lg:hidden"
        >
          <X size={20} />
        </button>
      
      {/* Navigation Groups */}
      <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.4em] px-6 py-4 mt-2">Core Operations</div>
      <NavItem to="/dashboard" icon={LayoutDashboard} label="Command Center" />
      <NavItem to="/alerts" icon={AlertCircle} label="Threat Vectors" />
      
      <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.4em] px-6 py-4 mt-6">Deep Analysis</div>
      <NavItem to="/logs" icon={Database} label="Log Telemetry" />
      
      <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.4em] px-6 py-4 mt-6">Infrastructure</div>
      <NavItem to="/profile" icon={Users} label="User Identity" />
      <NavItem to="/settings" icon={SettingsIcon} label="System Engine" />

      {/* Footer Branding */}
      <div className="mt-auto px-6 py-8 border-t border-on-surface/10 bg-on-surface/5">
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <p className="text-[9px] text-on-surface-variant/50 uppercase tracking-widest font-data">University Project</p>
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface font-bold">GLA UNIVERSITY</span>
                    <span className="text-[9px] text-on-surface-variant font-data">B.TECH CSE</span>
                </div>
            </div>
            <div className="h-px w-full bg-on-surface/10"></div>
            <div className="flex flex-col gap-1">
                 <p className="text-[9px] text-primary/60 uppercase tracking-widest font-bold">Faculty Guide</p>
                 <p className="text-[11px] text-on-surface font-bold tracking-tight">MR. SACHIN UPADHYAY</p>
            </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button — rendered via a portal-like approach in Header,
          but we also provide a floating one for safety */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-surface-container border border-on-surface/10 text-on-surface-variant hover:text-primary shadow-lg lg:hidden transition-all active:scale-90"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-surface-container-low border-r border-on-surface/10 flex-col pt-8 overflow-y-auto transition-colors duration-500 shadow-xl z-20">
        {sidebarContent}
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-surface-container-low border-r border-on-surface/10 flex flex-col pt-8 overflow-y-auto shadow-2xl z-50 lg:hidden transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
