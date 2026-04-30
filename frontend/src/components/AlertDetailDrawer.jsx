import { useEffect, useRef } from 'react';
import { X, ShieldAlert, Globe, Clock, AlertTriangle, Ban, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { AlertBadge } from './AlertBadge';
import { toast } from 'sonner';

// Simulated IP reputation scoring
function getIPReputation(ip) {
  if (!ip) return { score: 0, label: 'UNKNOWN', color: 'text-on-surface-variant' };
  const octets = ip.split('.').map(Number);
  const hash = (octets[0] * 7 + octets[1] * 13 + octets[2] * 3 + octets[3] * 11) % 100;
  if (hash > 75) return { score: hash, label: 'MALICIOUS', color: 'text-error' };
  if (hash > 50) return { score: hash, label: 'SUSPICIOUS', color: 'text-[#f5c842]' };
  if (hash > 25) return { score: hash, label: 'NEUTRAL', color: 'text-on-surface-variant' };
  return { score: hash, label: 'CLEAN', color: 'text-tertiary' };
}

// Recommended actions per alert type
function getRecommendation(alertType, severity) {
  const actions = {
    brute_force: [
      'Implement rate-limiting on login endpoints',
      'Enable account lockout after 5 failed attempts',
      'Deploy CAPTCHA for repeated failures',
    ],
    sql_injection: [
      'Sanitize all user inputs immediately',
      'Use parameterized queries in database calls',
      'Deploy WAF rules for SQL injection patterns',
    ],
    xss_attack: [
      'Encode all output displayed to users',
      'Implement Content-Security-Policy headers',
      'Sanitize HTML input with DOMPurify',
    ],
    port_scan: [
      'Block source IP at firewall level',
      'Enable IDS/IPS signature detection',
      'Monitor for follow-up exploitation attempts',
    ],
    ddos_attempt: [
      'Enable rate limiting and traffic shaping',
      'Activate DDoS mitigation (Cloudflare/AWS Shield)',
      'Scale infrastructure to absorb traffic',
    ],
  };

  const defaultActions = [
    'Investigate source IP for further anomalies',
    'Review related log entries for pattern detection',
    severity === 'critical' ? 'Escalate to security incident response team' : 'Document and monitor',
  ];

  const normalizedType = alertType.toLowerCase().replace(/\s+/g, '_');
  for (const [key, val] of Object.entries(actions)) {
    if (normalizedType.includes(key)) return val;
  }
  return defaultActions;
}

const AlertDetailDrawer = ({ alert, isOpen, onClose, onBlockIP }) => {
  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !alert) return null;

  const reputation = getIPReputation(alert.source_ip);
  const recommendations = getRecommendation(alert.alert_type, alert.severity);
  const timestamp = new Date(alert.timestamp);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleBlockIP = () => {
    if (onBlockIP) {
      onBlockIP(alert.source_ip);
    }
    toast.success(`IP ${alert.source_ip} added to blocklist`, {
      icon: <Ban size={16} />,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-surface-container border-l border-on-surface/10 z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-on-surface/10 shrink-0 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-error/10 border border-error/20">
              <ShieldAlert size={18} className="text-error" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-on-surface">Alert Investigation</h3>
              <p className="text-[9px] text-on-surface-variant font-data uppercase tracking-widest mt-0.5">
                ID: {String(alert.id).padStart(6, '0')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Alert Type & Severity */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface uppercase tracking-tight">
              {alert.alert_type.replace(/_/g, ' ')}
            </span>
            <AlertBadge severity={alert.severity} />
          </div>

          {/* Description */}
          <div className="bg-on-surface/5 rounded-lg p-4 border border-on-surface/5">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">
              Payload Description
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{alert.description}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Source IP */}
            <div className="bg-on-surface/5 rounded-lg p-3 border border-on-surface/5">
              <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                <Globe size={10} /> Source IP
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-data text-primary font-bold">{alert.source_ip || 'N/A'}</span>
                {alert.source_ip && (
                  <button onClick={() => copyToClipboard(alert.source_ip)} className="text-on-surface-variant/50 hover:text-primary transition-colors">
                    <Copy size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="bg-on-surface/5 rounded-lg p-3 border border-on-surface/5">
              <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                <Clock size={10} /> Detected At
              </div>
              <span className="text-sm font-data text-on-surface">
                {timestamp.toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </span>
            </div>

            {/* Read Status */}
            <div className="bg-on-surface/5 rounded-lg p-3 border border-on-surface/5">
              <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                <CheckCircle size={10} /> Status
              </div>
              <span className={`text-sm font-data font-bold ${alert.is_read ? 'text-tertiary' : 'text-error'}`}>
                {alert.is_read ? 'REVIEWED' : 'UNREAD'}
              </span>
            </div>

            {/* Alert ID */}
            <div className="bg-on-surface/5 rounded-lg p-3 border border-on-surface/5">
              <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                <AlertTriangle size={10} /> Alert Class
              </div>
              <span className="text-sm font-data text-on-surface">{alert.alert_type}</span>
            </div>
          </div>

          {/* IP Reputation Score */}
          {alert.source_ip && (
            <div className="bg-on-surface/5 rounded-lg p-4 border border-on-surface/5">
              <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-3">
                IP Reputation Analysis
              </div>
              <div className="flex items-center gap-4">
                {/* Score gauge */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(var(--color-on-surface), 0.08)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={reputation.score > 75 ? 'rgb(255, 59, 92)' : reputation.score > 50 ? 'rgb(245, 200, 66)' : 'rgb(0, 229, 122)'}
                      strokeWidth="3"
                      strokeDasharray={`${reputation.score * 0.88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-display font-bold ${reputation.color}`}>{reputation.score}</span>
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-bold ${reputation.color}`}>{reputation.label}</div>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">
                    Threat Intelligence Score
                  </div>
                  <div className="text-[9px] text-on-surface-variant/60 mt-1 font-data">
                    Based on heuristic + behavioral analysis
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          <div className="bg-on-surface/5 rounded-lg p-4 border border-on-surface/5">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-[#f5c842]" />
              Recommended Actions
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 group">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                  <span className="text-xs text-on-surface/80 leading-relaxed group-hover:text-on-surface transition-colors">
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Packet Data (simulated) */}
          <div className="bg-on-surface/5 rounded-lg p-4 border border-on-surface/5">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-3">
              Raw Event Data
            </div>
            <pre className="text-[10px] text-on-surface-variant font-data bg-surface-container-low p-3 rounded border border-on-surface/5 overflow-x-auto">
{JSON.stringify({
  id: alert.id,
  type: alert.alert_type,
  severity: alert.severity,
  src_ip: alert.source_ip || 'null',
  timestamp: alert.timestamp,
  description: alert.description,
  is_read: alert.is_read,
  reputation_score: reputation.score,
  reputation_label: reputation.label,
}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-on-surface/10 shrink-0 bg-surface-container-low flex gap-3">
          {alert.source_ip && (
            <button
              onClick={handleBlockIP}
              className="flex-1 flex items-center justify-center gap-2 bg-error/10 text-error border border-error/30 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-error/20 transition-all active:scale-95"
            >
              <Ban size={14} />
              Block IP
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 btn-ghost text-xs font-bold uppercase tracking-wider text-center"
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AlertDetailDrawer;
