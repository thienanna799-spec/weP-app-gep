/**
 * useCustomerSearch – Fast autocomplete hook for order/shipping forms
 * ─────────────────────────────────────────────────────────
 * Debounced search with 300ms delay, minimum 2 chars.
 * Returns lightweight customer list for dropdown suggestions.
 */

import { useState, useRef, useCallback } from 'react';
import { customerService } from '../services/customer.service';
import { Customer } from '../types';

export const useCustomerSearch = () => {
  const [results, setResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await customerService.search(query);
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setIsOpen(false);
  }, []);

  return { results, isSearching, isOpen, search, close, clear };
};
