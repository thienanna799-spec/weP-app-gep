import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../../components/ui/Card';
import api from '../../../services/api';
import PhotoLightbox from './PhotoLightbox';
import { useSocket } from '../../../hooks/useSocket';
import { exportLogsToExcel } from './logs/excelExport';

// Sub-components
import { DailyLog, DisplayRow, DriverLogsTabProps } from './logs/LogsTypes';
import { LogsStatsBar } from './logs/LogsStatsBar';
import { LogsFilterBar } from './logs/LogsFilterBar';
import { LogsTableHeader, LogsTableRow } from './logs/LogsTableRow';

const DriverLogsTab: React.FC<DriverLogsTabProps> = ({ drivers, vehicles }) => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const hasFetched = useRef(false);

  // Filters
  const [filterPlate, setFilterPlate] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 15;

  // isManualRefresh: true when user changes filters (reset page), false for background
  const isManualRef = useRef(true);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent && !hasFetched.current) setLoading(true);
    try {
      let url = '/daily-logs?';
      if (dateFrom) url += `from=${dateFrom}&`;
      if (dateTo) url += `to=${dateTo}&`;
      if (filterPlate) url += `plateNumber=${encodeURIComponent(filterPlate)}&`;
      if (filterDriver) url += `driverId=${filterDriver}&`;
      const data = await api.get<DailyLog[]>(url);
      setLogs(data);
      if (!silent && isManualRef.current) setPage(1);
      hasFetched.current = true;
    } catch (err) {
      console.error('Failed to fetch daily logs:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterPlate, filterDriver]);

  useEffect(() => {
    isManualRef.current = true;
    fetchLogs();
    // Auto-refresh every 30s (silent — no spinner, no page reset)
    const interval = setInterval(() => {
      isManualRef.current = false;
      fetchLogs(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Real-time: instant silent refresh when driver checks in/out/adds fuel via APK
  useSocket({
    onDriverVehicleUpdate: () => { isManualRef.current = false; fetchLogs(true); },
  });

  const openLightbox = (src: string, alt: string) => setLightbox({ src, alt });

  // Flatten logs into display rows
  const displayRows: DisplayRow[] = [];
  for (const log of logs) {
    const fuelCount = log.fuelEntries?.length || 0;
    const groupSize = 1 + fuelCount;
    displayRows.push({ type: 'session', log, isFirst: true, groupSize });
    if (log.fuelEntries) {
      for (const entry of log.fuelEntries) {
        displayRows.push({ type: 'fuel', log, fuelEntry: entry, isFirst: false, groupSize });
      }
    }
  }

  // Pagination on display rows
  const totalPages = Math.ceil(displayRows.length / perPage);
  const paginatedRows = displayRows.slice((page - 1) * perPage, page * perPage);

  // Excel Export
  const handleExportExcel = useCallback(() => {
    exportLogsToExcel(displayRows, dateFrom, dateTo);
  }, [displayRows, dateFrom, dateTo]);

  // Stats
  const totalKm = logs.reduce((sum, l) => sum + (l.totalKm || 0), 0);
  const allFuel = logs.flatMap(l => l.fuelEntries || []);
  const totalFuelCost = allFuel.reduce((sum, f) => sum + (f.fuelCost || 0), 0);

  return (
    <div className="space-y-4">
      <LogsStatsBar
        totalSessions={logs.length}
        totalKm={totalKm}
        totalFuelEntries={allFuel.length}
        totalFuelCost={totalFuelCost}
      />

      <LogsFilterBar
        dateFrom={dateFrom} dateTo={dateTo}
        filterPlate={filterPlate} filterDriver={filterDriver}
        drivers={drivers} vehicles={vehicles} loading={loading}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        onFilterPlateChange={setFilterPlate} onFilterDriverChange={setFilterDriver}
        onRefresh={fetchLogs}
        onExport={handleExportExcel}
      />

      {/* Data Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <LogsTableHeader />
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-medium">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search className="w-8 h-8" />
                      <p className="text-sm font-bold">Chưa có nhật ký</p>
                      <p className="text-[10px]">Dữ liệu sẽ hiện khi tài xế check-in/đổ xăng qua APK</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <LogsTableRow
                    key={`${row.log.id}-${row.type}-${row.fuelEntry?.id || 'session'}`}
                    row={row}
                    stt={(page - 1) * perPage + idx + 1}
                    onViewPhoto={openLightbox}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium">
              Hiện {(page - 1) * perPage + 1}–{Math.min(page * perPage, displayRows.length)} / {displayRows.length} dòng
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors ${
                      p === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Lightbox */}
      {lightbox && (
        <PhotoLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

export default DriverLogsTab;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          