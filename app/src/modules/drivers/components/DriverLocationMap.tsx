import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPin, Navigation, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import api from '../../../services/api';
import { Driver } from '../types';
import { DRIVER_STATUS_LABELS } from '../constants';
import { useSocket } from '../../../hooks/useSocket';
import MapCanvas from './MapCanvas';
import DriverGrid from './DriverGrid';
interface GpsLog {
  id: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

interface DriverMapProps {
  drivers: Driver[];
}

// Unique colors for each driver (up to 12, then repeats)
const DRIVER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#e11d48', // rose
  '#84cc16', // lime
];

const STATUS_ICONS: Record<string, string> = {
  available: '🟢',
  delivering: '🚚',
  leave: '😴',
  inactive: '⚫',
  blocked: '🔒',
};

export const DriverLocationMap: React.FC<DriverMapProps> = ({ drivers }) => {
  const [gpsLogs, setGpsLogs] = useState<GpsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [focusedDriver, setFocusedDriver] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<GpsLog[]>('/drivers/locations');
      setGpsLogs(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch GPS logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // ✅ Fix BUG 9: Subscribe to socket for real-time GPS push from APK
  useSocket({
    onDriverVehicleUpdate: (data: any) => {
      if (data?.action === 'gps_update') {
        fetchLocations();
      }
    },
  });

  // Only track and display active drivers (available or delivering)
  const activeDrivers = useMemo(() => {
    return drivers.filter(d => d.status === 'delivering' || d.status === 'available');
  }, [drivers]);

  // Assign each driver a unique color by index
  const driverColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    activeDrivers.forEach((d, i) => {
      map[d.id] = DRIVER_COLORS[i % DRIVER_COLORS.length];
    });
    return map;
  }, [activeDrivers]);

  const driverLocations = activeDrivers.map(driver => {
    const logs = gpsLogs.filter(g => g.driverId === driver.id);
    const latest = logs.length > 0 ? logs[0] : null;
    return { driver, gps: latest };
  }).filter(d => d.gps && d.gps.lat !== 0 && d.gps.lng !== 0);

  const driversWithoutGPS = activeDrivers.filter(
    d => !driverLocations.find(dl => dl.driver.id === d.id)
  );

  const focused = focusedDriver
    ? driverLocations.find(d => d.driver.id === focusedDriver)
    : null;

  const center = focused?.gps
    ? { lat: focused.gps.lat, lng: focused.gps.lng }
    : driverLocations.length > 0
      ? { lat: driverLocations[0].gps!.lat, lng: driverLocations[0].gps!.lng }
      : { lat: 10.762622, lng: 106.660172 };

  // Build Leaflet map with unique colored markers per driver
  const mapHtml = useMemo(() => {
    const markers = driverLocations.map(({ driver, gps }) => {
      const color = driverColorMap[driver.id] || '#64748b';
      const statusLabel = DRIVER_STATUS_LABELS[driver.status] || driver.status;
      const statusIcon = STATUS_ICONS[driver.status] || '📍';
      const time = gps ? new Date(gps.timestamp).toLocaleTimeString('vi-VN') : '';
      const isFocused = focusedDriver === driver.id;
      const initials = driver.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
      return `
        // Circle marker
        L.circleMarker([${gps!.lat}, ${gps!.lng}], {
          radius: ${isFocused ? 16 : 12},
          fillColor: '${color}',
          color: '#fff',
          weight: ${isFocused ? 4 : 2},
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map).bindPopup(\`
          <div style="font-family:system-ui;min-width:160px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900">${initials}</div>
              <div>
                <p style="font-weight:900;font-size:13px;margin:0">${driver.name}</p>
                <p style="font-size:10px;color:#94a3b8;font-family:monospace;margin:0">${driver.code}</p>
              </div>
            </div>
            <p style="font-size:11px;margin:6px 0 0">${statusIcon} ${statusLabel}</p>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:6px 0"/>
            <p style="font-size:9px;color:#94a3b8;margin:0">📍 ${gps!.lat.toFixed(6)}, ${gps!.lng.toFixed(6)}</p>
            <p style="font-size:9px;color:#94a3b8;margin:2px 0 0">🕒 ${time}</p>
          </div>
        \`);

        // Name label next to marker
        L.marker([${gps!.lat}, ${gps!.lng}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:${color};color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;font-family:system-ui;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15);border:2px solid #fff;transform:translate(16px,-8px)">${driver.name}</div>',
            iconSize: [0, 0]
          })
        }).addTo(map);
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%}
  .leaflet-popup-content-wrapper{border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.12)}
  .leaflet-popup-content{margin:12px 14px}
</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:true}).setView([${center.lat},${center.lng}],${focusedDriver ? 15 : 13});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap',
    maxZoom:19
  }).addTo(map);
  ${markers}
  ${driverLocations.length > 1 && !focusedDriver ? `
    var bounds = L.latLngBounds([${driverLocations.map(d => `[${d.gps!.lat},${d.gps!.lng}]`).join(',')}]);
    map.fitBounds(bounds, {padding: [50, 50]});
  ` : ''}
<\/script>
</body></html>`;
  }, [driverLocations, center, focusedDriver, driverColorMap]);

  return (
    <div className="space-y-4">
      <MapCanvas 
        driverLocations={driverLocations}
        driversWithoutGPS={driversWithoutGPS}
        focusedDriver={focusedDriver}
        driverColorMap={driverColorMap}
        lastRefresh={lastRefresh}
        loading={loading}
        onRefresh={fetchLocations}
      />

      <DriverGrid 
        driverLocations={driverLocations}
        driversWithoutGPS={driversWithoutGPS}
        focusedDriver={focusedDriver}
        driverColorMap={driverColorMap}
        onFocusDriver={setFocusedDriver}
      />
    </div>
  );
};
