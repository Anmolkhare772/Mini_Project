import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import api from '../services/api';

/**
 * AlertNotifier polls the backend for new alerts and fires toasts
 * when new CRITICAL or HIGH severity alerts appear.
 */
const AlertNotifier = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('alert_sound') !== 'false';
  });
  const lastAlertIdRef = useRef(null);
  const isFirstPollRef = useRef(true);

  // Create a beep sound using Web Audio API
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // First beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Second beep (higher pitch)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.2);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.4);

      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      // Audio not supported or blocked
    }
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('alert_sound', String(newVal));
    toast.info(newVal ? 'Alert sound enabled' : 'Alert sound muted', {
      icon: newVal ? <Volume2 size={16} /> : <VolumeX size={16} />,
      duration: 2000,
    });
  };

  useEffect(() => {
    const checkForNewAlerts = async () => {
      try {
        const res = await api.get('/alerts', { params: { page: 1, per_page: 1, severity: '' } });
        const alerts = res.data.alerts || [];
        if (alerts.length === 0) return;

        const latestAlert = alerts[0];
        const latestId = latestAlert.id;

        // Skip first poll to avoid firing on page load
        if (isFirstPollRef.current) {
          lastAlertIdRef.current = latestId;
          isFirstPollRef.current = false;
          return;
        }

        // If we've already seen this alert, skip
        if (lastAlertIdRef.current >= latestId) return;

        // New alert detected!
        lastAlertIdRef.current = latestId;

        const severity = latestAlert.severity?.toUpperCase();
        const isCritical = severity === 'CRITICAL';
        const isHigh = severity === 'HIGH';

        if (isCritical || isHigh) {
          playAlertSound();

          toast[isCritical ? 'error' : 'warning'](
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert size={14} />
                New {severity} Alert Detected!
              </div>
              <div className="text-xs opacity-80 leading-snug">
                {latestAlert.alert_type?.replace(/_/g, ' ')} — {latestAlert.description?.slice(0, 80)}
              </div>
              {latestAlert.source_ip && (
                <div className="text-[10px] opacity-60 font-mono mt-0.5">
                  SRC: {latestAlert.source_ip}
                </div>
              )}
            </div>,
            {
              duration: isCritical ? 8000 : 5000,
              position: 'top-right',
            }
          );
        } else if (severity === 'MEDIUM') {
          toast.info(`New ${severity} alert: ${latestAlert.alert_type?.replace(/_/g, ' ')}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      } catch {
        // Silently fail — notifications are non-critical
      }
    };

    const interval = setInterval(checkForNewAlerts, 8000);
    checkForNewAlerts();
    return () => clearInterval(interval);
  }, [soundEnabled]);

  return (
    <button
      onClick={toggleSound}
      className="p-2 text-on-surface-variant hover:text-primary transition-all hover:bg-on-surface/5 rounded-lg active:scale-90 shadow-sm border border-transparent hover:border-primary/10"
      title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
    >
      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
};

export default AlertNotifier;
