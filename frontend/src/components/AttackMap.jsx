import { useState, useMemo, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import { useTheme } from '../context/ThemeContext';
import { Globe, Target } from 'lucide-react';

// World topology URL
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Known IP-to-location mock mapping (realistic IPs → coordinates)
const IP_GEO_DB = {
  '192.168': { name: 'Local Network', coords: [77.1025, 28.7041] },
  '10.0':    { name: 'Internal Net', coords: [72.8777, 19.0760] },
  '203.0':   { name: 'China', coords: [116.4074, 39.9042] },
  '185.':    { name: 'Russia', coords: [37.6173, 55.7558] },
  '45.':     { name: 'Netherlands', coords: [4.9041, 52.3676] },
  '91.':     { name: 'Ukraine', coords: [30.5234, 50.4501] },
  '77.':     { name: 'Turkey', coords: [32.8597, 39.9334] },
  '156.':    { name: 'South Korea', coords: [126.978, 37.5665] },
  '41.':     { name: 'Nigeria', coords: [3.3792, 6.5244] },
  '200.':    { name: 'Brazil', coords: [-43.1729, -22.9068] },
  '89.':     { name: 'Romania', coords: [26.1025, 44.4268] },
  '5.':      { name: 'Germany', coords: [13.4050, 52.5200] },
  '62.':     { name: 'UK', coords: [-0.1276, 51.5074] },
  '198.':    { name: 'USA East', coords: [-74.006, 40.7128] },
  '172.':    { name: 'USA West', coords: [-122.4194, 37.7749] },
  '103.':    { name: 'Singapore', coords: [103.8198, 1.3521] },
  '146.':    { name: 'Australia', coords: [151.2093, -33.8688] },
  '58.':     { name: 'Japan', coords: [139.6917, 35.6895] },
  '14.':     { name: 'India', coords: [77.5946, 12.9716] },
};

// Target (your server location — Mumbai, India)
const TARGET_COORDS = [72.8777, 19.0760];

function resolveIPLocation(ip) {
  if (!ip) return null;
  for (const prefix of Object.keys(IP_GEO_DB)) {
    if (ip.startsWith(prefix)) {
      return IP_GEO_DB[prefix];
    }
  }
  // Fallback: generate deterministic coords from IP octets
  const octets = ip.split('.').map(Number);
  const lng = ((octets[0] * 7 + octets[1] * 3) % 360) - 180;
  const lat = ((octets[2] * 5 + octets[3] * 2) % 180) - 90;
  return { name: `Unknown (${ip})`, coords: [lng, lat] };
}

const AttackMap = ({ topIps = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimPhase((p) => (p + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const attackOrigins = useMemo(() => {
    const origins = [];
    const seen = new Set();
    topIps.forEach((entry) => {
      const loc = resolveIPLocation(entry.ip);
      if (loc && !seen.has(loc.name)) {
        seen.add(loc.name);
        origins.push({
          ip: entry.ip,
          count: entry.count,
          ...loc,
        });
      }
    });
    return origins;
  }, [topIps]);

  // Country-wise count aggregation
  const countryStats = useMemo(() => {
    const map = {};
    attackOrigins.forEach((o) => {
      map[o.name] = (map[o.name] || 0) + o.count;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [attackOrigins]);

  return (
    <div className="card relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <Globe size={14} className="text-primary" />
          Global Threat Topology
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-error">
            <div className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
            LIVE
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border border-on-surface/5" 
           style={{ background: isDark ? 'rgb(14,15,20)' : 'rgb(230,235,242)' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [30, 20] }}
          style={{ width: '100%', height: 'auto' }}
          viewBox="0 0 800 450"
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isDark ? 'rgba(136, 150, 179, 0.08)' : 'rgba(71, 84, 103, 0.1)'}
                  stroke={isDark ? 'rgba(136, 150, 179, 0.15)' : 'rgba(71, 84, 103, 0.15)'}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: isDark ? 'rgba(0, 209, 255, 0.1)' : 'rgba(26, 115, 232, 0.1)', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Attack lines from source → target */}
          {attackOrigins.map((origin, idx) => (
            <Line
              key={`line-${idx}`}
              from={origin.coords}
              to={TARGET_COORDS}
              stroke="rgba(255, 59, 92, 0.4)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="4 3"
              className="animate-pulse"
              style={{
                animationDelay: `${idx * 300}ms`,
                animationDuration: '2s',
              }}
            />
          ))}

          {/* Source markers (attackers) */}
          {attackOrigins.map((origin, idx) => (
            <Marker
              key={`marker-${idx}`}
              coordinates={origin.coords}
              onMouseEnter={() => setHoveredMarker(idx)}
              onMouseLeave={() => setHoveredMarker(null)}
            >
              {/* Ping ring */}
              <circle
                r={6 + (origin.count / 3)}
                fill="none"
                stroke="rgba(255, 59, 92, 0.3)"
                strokeWidth={1}
                className="animate-ping"
                style={{ animationDuration: `${2 + idx * 0.5}s` }}
              />
              {/* Core dot */}
              <circle
                r={3 + Math.min(origin.count / 5, 4)}
                fill="rgba(255, 59, 92, 0.9)"
                stroke="rgba(255, 59, 92, 0.3)"
                strokeWidth={2}
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(255, 59, 92, 0.6))',
                  cursor: 'pointer',
                }}
              />
              {/* Hover tooltip */}
              {hoveredMarker === idx && (
                <g>
                  <rect
                    x={-55}
                    y={-38}
                    width={110}
                    height={28}
                    rx={4}
                    fill={isDark ? 'rgb(30, 31, 37)' : '#ffffff'}
                    stroke="rgba(255, 59, 92, 0.3)"
                    strokeWidth={1}
                    style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
                  />
                  <text
                    textAnchor="middle"
                    y={-22}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '8px',
                      fill: isDark ? '#e3e1e9' : '#101828',
                      fontWeight: 'bold',
                    }}
                  >
                    {origin.name} · {origin.count} alerts
                  </text>
                  <text
                    textAnchor="middle"
                    y={-13}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '7px',
                      fill: 'rgb(255, 59, 92)',
                    }}
                  >
                    SRC: {origin.ip}
                  </text>
                </g>
              )}
            </Marker>
          ))}

          {/* Target marker (your server) */}
          <Marker coordinates={TARGET_COORDS}>
            <circle r={8} fill="none" stroke="rgba(0, 229, 122, 0.3)" strokeWidth={2} className="animate-ping" />
            <circle r={5} fill="rgba(0, 229, 122, 0.9)" stroke="rgba(0, 229, 122, 0.4)" strokeWidth={3}
                    style={{ filter: 'drop-shadow(0 0 10px rgba(0, 229, 122, 0.7))' }} />
            <text
              textAnchor="start"
              x={12}
              y={4}
              style={{
                fontFamily: 'monospace',
                fontSize: '8px',
                fill: 'rgba(0, 229, 122, 0.9)',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
              }}
            >
              HQ
            </text>
          </Marker>
        </ComposableMap>

        {/* Overlay gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
             style={{ background: `linear-gradient(transparent, ${isDark ? 'rgb(30, 31, 37)' : '#ffffff'})` }} />
      </div>

      {/* Country Stats */}
      {countryStats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {countryStats.map(([country, count], idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-on-surface/5 rounded-lg px-3 py-2 hover:bg-error/10 transition-colors cursor-default group"
            >
              <Target size={10} className="text-error/60 group-hover:text-error shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-on-surface truncate">{country}</span>
                <span className="text-[9px] font-data text-on-surface-variant">{count} hits</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttackMap;
