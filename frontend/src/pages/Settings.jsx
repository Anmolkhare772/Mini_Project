import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../services/api';
import { Shield, Bell, AlertOctagon, Trash2, Mail, MessageSquare, Database } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    brute_force_threshold: 5,
    port_scan_threshold: 10,
    email_notifications: false,
    sms_notifications: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/');
      setSettings(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const res = await api.patch('/settings/', { [key]: value });
      setSettings(res.data);
      toast.success('Settings updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update setting');
    }
  };

  const handleFlush = async () => {
    if (!window.confirm('CRITICAL: This will permanently delete ALL security logs and alerts. Proceed?')) return;
    
    const toastId = toast.loading('Flushing all telemetry data...');
    try {
      await api.post('/settings/flush');
      toast.success('All telemetry flushed successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to flush telemetry', { id: toastId });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <Database className="animate-pulse text-primary" size={48} />
      <div className="text-on-surface-variant font-data animate-pulse uppercase tracking-widest text-sm">Initializing System Config...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white">System Configuration</h2>
          <p className="text-xs text-on-surface-variant font-data mt-1 tracking-[0.3em] uppercase">Global Preferences & Tactical Rules</p>
        </div>
        <div className="text-[10px] text-primary font-bold bg-primary/10 px-3 py-1 rounded border border-primary/20 uppercase tracking-widest">
            v1.2.4-stable
        </div>
      </div>

      <div className="card group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 mb-6 flex items-center gap-3">
          <Shield size={18} className="text-primary" />
          Detection Engine Thresholds
        </h3>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Brute Force Tolerance</label>
              <span className="text-xs font-data text-white bg-primary/20 border border-primary/30 px-3 py-1 rounded shadow-[0_0_10px_rgba(0,209,255,0.2)]">
                {settings.brute_force_threshold} Attempts
              </span>
            </div>
            <input 
              type="range" 
              className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" 
              min="1" 
              max="20" 
              value={settings.brute_force_threshold}
              onChange={(e) => updateSetting('brute_force_threshold', parseInt(e.target.value))}
            />
            <p className="text-[10px] text-on-surface-variant/60 leading-relaxed italic">
              Locked by global security policy. Lower values increase sensitivity to repeated failure events.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Port Scan Sensitivity</label>
              <span className="text-xs font-data text-white bg-tertiary/20 border border-tertiary/30 px-3 py-1 rounded">
                {settings.port_scan_threshold} Ports
              </span>
            </div>
            <input 
              type="range" 
              className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-tertiary" 
              min="5" 
              max="50" 
              value={settings.port_scan_threshold}
              onChange={(e) => updateSetting('port_scan_threshold', parseInt(e.target.value))}
            />
            <p className="text-[10px] text-on-surface-variant/60 leading-relaxed italic">
              Defines the number of unique ports a single IP can hit before triggering an automated scan alert.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 mb-6 flex items-center gap-3">
            <Bell size={18} className="text-tertiary" />
            Notification Channels
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-tertiary/30 transition-all cursor-not-allowed opacity-60">
              <div className="flex items-center gap-3">
                <Database size={16} className="text-tertiary" />
                <span className="text-sm font-medium text-white">Dashboard Feed</span>
              </div>
              <input type="checkbox" className="accent-tertiary w-4 h-4 cursor-not-allowed" checked readOnly />
            </label>
            
            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-tertiary/30 transition-all cursor-pointer group/item">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-tertiary group-hover/item:animate-bounce" />
                <span className="text-sm font-medium text-white">Email Dispatches</span>
              </div>
              <input 
                type="checkbox" 
                className="accent-tertiary w-4 h-4 cursor-pointer" 
                checked={settings.email_notifications}
                onChange={(e) => updateSetting('email_notifications', e.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-tertiary/30 transition-all cursor-pointer group/item">
              <div className="flex items-center gap-3">
                <MessageSquare size={16} className="text-tertiary group-hover/item:animate-bounce" />
                <span className="text-sm font-medium text-white">SMS Critical Alerts</span>
              </div>
              <input 
                type="checkbox" 
                className="accent-tertiary w-4 h-4 cursor-pointer" 
                checked={settings.sms_notifications}
                onChange={(e) => updateSetting('sms_notifications', e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="card relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-error opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 mb-6 flex items-center gap-3">
            <AlertOctagon size={18} className="text-error" />
            Danger Zone
          </h3>
          <div className="space-y-6">
             <div className="bg-error/5 border border-error/20 p-4 rounded-lg">
               <p className="text-xs text-error/90 leading-relaxed font-medium">
                 <span className="font-bold uppercase block mb-1">Warning: Irreversible Action</span>
                 Modifying core threat models or resetting telemetry will permanently erase historical security data. 
                 Executive clearance is assumed for this session.
               </p>
             </div>
             <button 
                onClick={handleFlush}
                className="group flex items-center justify-center gap-2 bg-transparent border border-error text-error px-4 py-3 text-xs font-bold rounded-lg hover:bg-error hover:text-white transition-all w-full uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(255,59,92,0.1)] hover:shadow-[0_0_20px_rgba(255,59,92,0.4)]"
             >
                <Trash2 size={16} className="group-hover:animate-pulse" />
                Flush All Telemetry
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
