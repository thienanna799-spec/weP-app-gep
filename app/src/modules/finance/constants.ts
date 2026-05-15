/**
 * Finance Module — Constants
 * ──────────────────────────
 * Shared constants used across finance components.
 */

import { DatePreset } from './types';

/** Chart color palette */
export const CHART_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899',
];

/** Date preset options for filter bar */
export const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'this_week', label: 'Tuần này' },
  { key: 'this_month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
  { key: 'this_quarter', label: 'Quý này' },
  { key: 'this_year', label: 'Năm nay' },
  { key: 'all', label: 'Tất cả' },
  { key: 'custom', label: 'Tùy chọn' },
];

/** Short date formatter (dd/MM) */
export const fmtShortDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
