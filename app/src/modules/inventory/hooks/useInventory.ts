import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { ProductRoll } from '../types';
import { useSocket } from '../../../hooks/useSocket';

export const useInventory = () => {
  const [rolls, setRolls] = useState<ProductRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ProductRoll[]>('/rolls');
      setRolls(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

 