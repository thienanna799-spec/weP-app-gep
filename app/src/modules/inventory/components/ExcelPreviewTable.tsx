/**
 * ExcelPreviewTable — Preview table for Excel import with dynamic columns
 */

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ExcelRow {
  [key: string]: any;
}

interface Props {
  rows: ExcelRow[];
  formatNoteValue: (val: any) => string;
}

const ExcelPreviewTable: React.FC<Props> = ({ rows, formatNoteValue }) => {
  const allColumns = rows.length > 0
    ? Object.keys(rows[0]).filter(k => k !== '__rowNum__')
    : [];

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="text-left text-xs min-w-max">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-3 py-2 w-8 bg-slate-50 sticky left-0 z-20">#</th>
              {allColumns.map(col => (
                <th key={col} className="px-3 py-2 whitespace-nowrap bg-slate-50">{col}</th>
              ))}
              <th className="px-3 py-2 text-center bg-slate-50">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const productName = row['TÊN SP'] || row.product_name;
              const hasError = !productName;
              return (
                <tr key={idx} className={`${hasError ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-3 py-2 text-slate-400 font-mono bg-white sticky left-0 border-r border-slate-100">{idx + 1}</td>
                  {allColumns.map(col => (
                    <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[250px] truncate">
                      {formatNoteValue(row[col]) || '—'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    {hasError
                      ? <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                      : <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExcelPreviewTable;
