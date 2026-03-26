import { useEffect, useState } from 'react';
import api from '../services/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfile(res.data.user);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Operator Clearance</h2>
        <p className="text-xs text-on-surface-variant font-data mt-1 tracking-wider uppercase">System Identification</p>
      </div>

      <div className="card p-8">
        {loading ? (
          <div className="text-on-surface-variant font-data animate-pulse">Scanning Bio-Metrics...</div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-white/5">
              <div className="w-20 h-20 rounded bg-surface-container-high border border-primary/30 flex items-center justify-center shadow-glow-primary">
                <span className="text-3xl font-display font-bold text-primary">
                  {profile.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-display font-medium text-on-surface">{profile.name}</h3>
                <div className="text-xs font-data text-primary mt-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded inline-block">
                  ACTIVE CLEARANCE LEVEL 4
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant tracking-widest uppercase mb-1">Operator ID</label>
                <div className="text-sm font-data text-on-surface">{profile.id.toString().padStart(6, '0')}</div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant tracking-widest uppercase mb-1">Secure Comms</label>
                <div className="text-sm font-data text-on-surface">{profile.email}</div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant tracking-widest uppercase mb-1">Onboarding Date</label>
                <div className="text-sm font-data text-on-surface">{new Date(profile.created_at).toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant tracking-widest uppercase mb-1">System Role</label>
                <div className="text-sm font-data text-on-surface">Security Analyst</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-error">Error retrieving operator data.</div>
        )}
      </div>
    </div>
  );
};

export default Profile;
