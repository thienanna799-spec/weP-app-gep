import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Material } from '../types/material.types';

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Material[]>('/materials');
      setMaterials(data);
    } catch (e) {
      console.error('Error fetching materials:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { materials, loading, refetch: fetch };
};
