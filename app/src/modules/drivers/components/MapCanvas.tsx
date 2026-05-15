import React, { useMemo } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { DRIVER_STATUS_LABELS } from '../constants';

interface MapCanvasProps {
  driverLocations: any[];
  driversWithoutGPS: any[];
  focusedDriver: string | null;
  driverColorMap: Record<string, string>;
  lastRefresh: Date;
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_ICONS: Record<string, string> = {
  available: '🟢',
  delivering: '🚚',
  leave: '😴',
  inactive: '⚫',
  blocked: '🔒',
};

export default function MapCanvas({
  driverLocations,
  driversWithoutGPS,
  focusedDriver,
  driverColorMap,
  lastRefresh,
  loading,
  onRefresh
}: MapCanvasProps) {

  const focused = focusedDriver
    ? driverLocations.find(d => d.driver.id === focusedDriver)
    : null;

  const center = focused?.gps
    ? { lat: focused.gps.lat, lng: focused.gps.lng }
    : driverLocations.length > 0
      ? { lat: driverLocations[0].gps!.lat, lng: driverLocations[0].gps!.lng }
      : { lat: 10.762622, lng: 106.660172 };

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
              <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900">\${initials}</div>
              <div>
                <p style="font-weight:900;font-size:13px;margin:0">\${driver.name}</p>
                <p style="font-size:10px;color:#94a3b8;font-family:monospace;margin:0">\${driver.code}</p>
              </div>
            </div>
            <p style="font-size:11px;margin:6px 0 0">\${statusIcon} \${statusLabel}</p>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:6px 0"/>
            <p style="font-size:9px;color:#94a3b8;margin:0">📍 \${gps!.lat.toFixed(6)}, \${gps!.lng.toFixed(6)}</p>
            <p style="font-size:9px;color:#94a3b8;margin:2px 0 0">🕒 \${time}</p>
          </div>
        \`);

        // Name label next to marker
        L.marker([${gps!.lat}, ${gps!.lng}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:${color};color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;font-family:system-ui;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15);border:2px solid #fff;transform:translate(16px,-8px)">\${driver.name}</div>',
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
    <Card className="p-0 overflow-hidden relative border-none shadow-lg bg-white">
      <div className="relative h-[500px]">
        <iframe
          key={`map-${focusedDriver}-${driverLocations.length}-${lastRefresh.getTime()}`}
          srcDoc={mapHtml}
          className="w-full h-full border-0"
          title="Driver Map"
        />

        {/* Bottom-right refresh */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={onRefresh}
            className={`w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`}
            title="Làm mới vị trí"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom-left info */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-slate-100">
            <div className="flex items-center justify-between gap-4 mb-1">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Vị trí tài xế
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">
                {lastRefresh.toLocaleTimeString('vi-VN')}
              </span>
            </div>
            <div className="flex gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500">{driverLocations.length} có GPS</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-slate-500">{driversWithoutGPS.length} không GPS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
