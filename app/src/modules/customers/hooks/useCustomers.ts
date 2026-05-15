/**
 * useCustomers – Main data hook for customer list (CRM v2)
 * ─────────────────────────────────────────────────────────
 * Supports debounced search + multi-dimension CRM filters.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import { Customer } from '../types';

export interface CustomerFilters {
  search?: string;
  type?: string;
  province?: string;
  platform?: string;
  status?: string;
  group?: string;
  boss?: string;
}

export const useCustomers = (filters: CustomerFilters = {}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(async (f: CustomerFilters) => {
    setLoading(true);
    try {
      const params: any = {};
      if (f.search) params.search = f.search;
      if (f.type) params.type = f.type;
      if (f.province) params.province = f.province;
      if (f.platform) params.platform = f.platform;
      if (f.status) params.status = f.status;
      if (f.group) params.group = f.group;
      if (f.boss) params.boss = f.boss;
      const qs = new URLSearchParams(params).toString();
      const data = await api.get<Customer[]>(`/customers${qs ? `?${qs}` : ''}`);
      setCustomers(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search — waits 400ms after last keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(filters);
    }, filters.search ? 400 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters.search, filters.type, filters.province, filters.platform, filters.status, filters.group, filters.boss, fetchCustomers]);

  return { customers, loading, error, refetch: () => fetchCustomers(filters) };
};
