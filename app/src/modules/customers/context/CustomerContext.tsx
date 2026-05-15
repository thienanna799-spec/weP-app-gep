/**
 * CustomerContext – Global State for Customer Module
 * ─────────────────────────────────────────────────────────
 * Single source of truth for ALL customer data.
 * All tabs/components MUST consume from this context.
 * 
 * Features:
 *   • Unified customer[] with pricingRules included
 *   • Debounced search + multi-dimension filters
 *   • Auto-refresh after mutations (import, edit, delete)
 *   • Loading/error state management
 *   • Toast notifications on sync
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { Customer } from '../types';
import { useSocket } from '../../../hooks/useSocket';

// ── Filter Interface ──────────────────────────────────────
export interface CustomerFilters {
  search?: string;
  type?: string;
  province?: string;
  platform?: string;
  status?: string;
  group?: string;
  boss?: string;
}

// ── Context Interface ─────────────────────────────────────
interface CustomerContextValue {
  // Data
  customers: Customer[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  // Filters
  filters: CustomerFilters;
  setFilters: (f: CustomerFilters) => void;
  setFilter: <K extends keyof CustomerFilters>(key: K, value: CustomerFilters[K]) => void;

  // Actions
  refetch: () => Promise<void>;
  updateCustomerLocally: (id: string, updates: Partial<Customer>) => void;
  removeCustomerLocally: (id: string) => void;

  // Computed
  stats: {
    total: number;
    active: number;
    inactive: number;
    stopped: number;
    totalPricingRules: number;
  };
  uniqueGroups: string[];
  uniqueBosses: string[];
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────
export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [filters, setFiltersState] = useState<CustomerFilters>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchCustomers = useCallback(async (f?: CustomerFilters) => {
    const currentFilters = f || filtersRef.current;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.type) params.type = currentFilters.type;
      if (currentFilters.province) params.province = currentFilters.province;
      if (currentFilters.platform) params.platform = currentFilters.platform;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.group) params.group = currentFilters.group;
      if (currentFilters.boss) params.boss = currentFilters.boss;
      const qs = new URLSearchParams(params).toString();
      const data = await api.get<Customer[]>(`/customers${qs ? `?${qs}` : ''}`);
      setCustomers(data);
      setError(null);
      setLastFetchedAt(Date.now());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(filters);
    }, filters.search ? 400 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters.search, filters.type, filters.province, filters.platform, filters.status, filters.group, filters.boss, fetchCustomers]);

  // ✅ Real-time sync: Auto-refresh customer data when orders change
  useSocket({
    onOrderUpdate: () => {
      // Delay slightly to let backend transactions complete
      setTimeout(() => fetchCustomers(), 500);
    },
    onShippingUpdate: () => {
      setTimeout(() => fetchCustomers(), 500);
    },
  });

  // ── Filter setters ────────────────────────────────────
  const setFilters = useCallback((f: CustomerFilters) => setFiltersState(f), []);
  const setFilter = useCallback(<K extends keyof CustomerFilters>(key: K, value: CustomerFilters[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Local mutations (optimistic updates) ──────────────
  const updateCustomerLocally = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const removeCustomerLocally = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Computed values ───────────────────────────────────
  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.operationalStatus === 'active').length,
    inactive: customers.filter(c => c.operationalStatus === 'inactive').length,
    stopped: customers.filter(c => c.operationalStatus === 'stopped').length,
    totalPricingRules: customers.reduce((sum, c) => sum + (c.pricingRules?.length || 0), 0),
  }), [customers]);

  const uniqueGroups = useMemo(() =>
    [...new Set(customers.map(c => c.groupName).filter(Boolean))] as string[],
  [customers]);

  const uniqueBosses = useMemo(() =>
    [...new Set(customers.map(c => c.boss).filter(Boolean))] as string[],
  [customers]);

  const value: CustomerContextValue = {
    customers,
    loading,
    error,
    lastFetchedAt,
    filters,
    setFilters,
    setFilter,
    refetch: () => fetchCustomers(),
    updateCustomerLocally,
    removeCustomerLocally,
    stats,
    uniqueGroups,
    uniqueBosses,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────
export const useCustomerStore = (): CustomerContextValue => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomerStore must be used within CustomerProvider');
  return ctx;
};
