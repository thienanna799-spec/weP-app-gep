import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { Material } from '../types';

export const useMaterialsModule = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Material[]>('/materials');
      setMaterials(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { materials, loading, error, refetch: fetch };
};
