/**
 * DateFilterBar — Date preset selector + custom range picker
 */

import React from 'react';
import { Filter } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { DATE_PRESETS } from '../constants';
import type { DatePreset } from '../types';

interface Props {
  datePreset: DatePreset;
  setDatePreset: (p: DatePreset) => void;
  customFrom: string;
  setCustomFrom: (v: string) => void;
  customTo: string;
  setCustomTo: (v: string) => void;
}

const DateFilterBar: React.FC<Props> = ({
  datePreset, setDatePreset,
  customFrom, setCustomFrom, customTo, setCustomTo,
}) => (
  <Card className="p-4 bg-white shadow-sm">
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="w-4 h-4 text-slate-400 mr-1" />
      {DATE_PRESETS.map(p => (
        <button
          key={p.key}
          onClick={() => setDatePreset(p.key)}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            datePreset === p.key
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>

    {datePreset === 'custom' && (
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Từ:</label>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Đến:</label>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>
    )}
  </Card>
);

export default DateFilterBar;
