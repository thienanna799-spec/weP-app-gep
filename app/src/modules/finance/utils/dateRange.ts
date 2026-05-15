/**
 * Finance Module — Date Range Utility
 * ────────────────────────────────────
 * Calculates date ranges based on preset selections.
 */

import { DatePreset } from '../types';

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/**
 * Returns a { from, to } date range for a given preset.
 */
export function getDateRange(
  preset: DatePreset,
  customFrom?: string,
  customTo?: string,
): { from: Date; to: Date } {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };

    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }

    case 'this_week': {
      const day = now.getDay() || 7;
      const mon = new Date(now);
      mon.setDate(now.getDate() - day + 1);
      return { from: startOfDay(mon), to: endOfDay(now) };
    }

    case 'this_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
      };

    case 'last_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      };

    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), q * 3, 1),
        to: endOfDay(now),
      };
    }

    case 'this_year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: endOfDay(now),
      };

    case 'all':
      return {
        from: new Date(2020, 0, 1),
        to: endOfDay(now),
      };

    case 'custom':
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : new Date(2020, 0, 1),
        to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now),
      };

    default:
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
      };
  }
}
