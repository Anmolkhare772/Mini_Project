import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Database, AlertCircle, Settings as SettingsIcon, Users } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const isActive = currentPath === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-2 text-sm font-medium border-l-2 transition-all duration-200 select-none
          ${isActive 
            ? 'bg-primary/10 text-primary border-primary' 
            : 'text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface'
          }`}
      >
        <Icon size={18} className="shrink-0" />
        {label}
        {badge && (
          <span className="ml-auto bg-error/15 text-error border border-error/30 text-[10px] font-data px-2 py-0.5 rounded-full font-semibold">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="w-64 bg-surface-container-low border-r border-white/5 flex flex-col pt-4 overflow-y-auto">
      <div className="px-5 pb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md border border-primary flex items-center justify-center bg-gradient-to-br from-[#1a3a6e] to-[#0f2044] shadow-glow-primary">
          <Shield size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold text-on-surface tracking-wide">CyberShield</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Threat Detection Lab</p>
        </div>
      </div>
      
      <div className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest px-5 py-2">Monitor</div>
      <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
      <NavItem to="/alerts" icon={AlertCircle} label="Alerts" />
      
      <div className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest px-5 py-2 mt-4">Analysis</div>
      <NavItem to="/logs" icon={Database} label="System Logs" />
      
      <div className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest px-5 py-2 mt-4">System</div>
      <NavItem to="/profile" icon={Users} label="Profile" />
      <NavItem to="/settings" icon={SettingsIcon} label="Settings" />

      <div className="mt-auto px-5 py-4 border-t border-white/5">
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          GLA University<br/>B.Tech CSE 2024-25<br/>Mr. Sachin Upadhyay
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
