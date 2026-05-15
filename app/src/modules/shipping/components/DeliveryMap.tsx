/**
 * DeliveryMap — Leaflet/OpenStreetMap based delivery tracking map
 *
 * Features:
 * - Warehouse marker (blue), Customer destination (red), Driver position (amber pulsing)
 * - Route polyline drawn from GPS logs + delivery logs
 * - Smooth realtime updates: only moves marker + extends polyline (no map reset)
 * - Legend overlay, auto-fit bounds on first load
 */
import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GpsPoint {
  lat: number;
  lng: number;
  timestamp?: string;
}

interface DeliveryMapProps {
  deliveryLogs: GpsPoint[];
  gpsLogs: GpsPoint[];
  customerAddress?: string;
  warehouseLat?: number;
  warehouseLng?: number;
  customerLat?: number;
  customerLng?: number;
  driverName?: string;
  vehiclePlate?: string;
  className?: string;
}

// Default warehouse location (275 Nguyễn Trãi, Thanh Xuân, Hà Nội)
const WAREHOUSE = { lat: 20.9933, lng: 105.8067 };

// Reusable icon factories
const makeIcon = (color: string, size = 18) => L.divIcon({
  html: `<div style="background:${color};border:3px solid #fff;border-radius:50%;width:${size}px;height:${size}px;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
  className: '',
});

const driverIconHtml = `
  <div style="position:relative;width:28px;height:28px">
    <div style="position:absolute;inset:0;background:#f59e0b;border-radius:50%;opacity:.3;animation:ping 1.5s infinite"></div>
    <div style="position:absolute;inset:3px;background:#f59e0b;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">
      <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
    </div>
  </div>
  <style>@keyframes ping{0%{transform:scale(1);opacity:.4}75%,100%{transform:scale(2);opacity:0}}</style>`;

const driverIcon = L.divIcon({
  html: driverIconHtml,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  className: '',
});

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  deliveryLogs = [],
  gpsLogs = [],
  warehouseLat = WAREHOUSE.lat,
  warehouseLng = WAREHOUSE.lng,
  customerLat,
  customerLng,
  driverName,
  vehiclePlate,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const hasFittedRef = useRef(false);

  // Combine all GPS points sorted by time
  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    // Delivery log GPS
    deliveryLogs.forEach(l => { if (l.lat && l.lng) pts.push([l.lat, l.lng]); });
    // GPS logs
    gpsLogs.forEach(l => { if (l.lat && l.lng) pts.push([l.lat, l.lng]); });
    return pts;
  }, [deliveryLogs, gpsLogs]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [warehouseLat, warehouseLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Attribution in corner
    L.control.attribution({ position: 'bottomright', prefix: '© OSM' }).addTo(map);

    // Warehouse marker (static)
    L.marker([warehouseLat, warehouseLng], { icon: makeIcon('#3b82f6') })
      .addTo(map)
      .bindPopup('<b>🏭 Kho hàng GEP</b><br/>275 Nguyễn Trãi, Thanh Xuân');

    // Customer destination (static)
    if (customerLat && customerLng) {
      L.marker([customerLat, customerLng], { icon: makeIcon('#ef4444') })
        .addTo(map)
        .bindPopup('<b>📍 Điểm giao hàng</b>');
    }

    // Polyline (will be updated)
    polylineRef.current = L.polyline([], {
      color: '#6366f1',
      weight: 4,
      opacity: 0.8,
      dashArray: '8 4',
      smoothFactor: 1.5,
    }).addTo(map);

    // Driver marker (will be updated)
    driverMarkerRef.current = L.marker([warehouseLat, warehouseLng], {
      icon: driverIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    const popupContent = driverName
      ? `<b>🚚 ${driverName}</b>${vehiclePlate ? `<br/>${vehiclePlate}` : ''}`
      : '<b>🚚 Tài xế</b>';
    driverMarkerRef.current.bindPopup(popupContent);

    mapRef.current = map;

    // Force a resize after mount (fixes grey tiles)
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
      polylineRef.current = null;
      hasFittedRef.current = false;
    };
  }, []); // Mount only once

  // Update polyline + driver marker on data change (NO map reset)
  useEffect(() => {
    if (!mapRef.current || !polylineRef.current || !driverMarkerRef.current) return;

    // Update polyline
    polylineRef.current.setLatLngs(allPoints);

    // Update driver marker position
    if (allPoints.length > 0) {
      const lastPos = allPoints[allPoints.length - 1];
      driverMarkerRef.current.setLatLng(lastPos);
    }

    // Fit bounds only on first data load
    if (!hasFittedRef.current && allPoints.length > 0) {
      const bounds = L.latLngBounds([
        [warehouseLat, warehouseLng],
        ...allPoints,
      ]);
      if (customerLat && customerLng) bounds.extend([customerLat, customerLng]);
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
      hasFittedRef.current = true;
    }
  }, [allPoints, warehouseLat, warehouseLng, customerLat, customerLng]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full rounded-xl" style={{ minHeight: 350 }} />
      
      {/* Live indicator */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md border border-slate-100">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Live</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-100 z-[1000]">
        <div className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
            <span>Kho hàng</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
            <span>Điểm giao</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow" />
            <span>Tài xế</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-[3px] rounded" style={{ background: 'repeating-linear-gradient(90deg, #6366f1 0, #6366f1 6px, transparent 6px, transparent 10px)' }} />
            <span>Lộ trình</span>
          </div>
        </div>
      </div>

      {/* Driver overlay */}
      {driverName && (
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-100 z-[1000]">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Tài xế</p>
          <p className="text-xs font-bold text-slate-900">{driverName}</p>
          {vehiclePlate && <p className="text-[10px] text-slate-500 font-mono">{vehiclePlate}</p>}
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
