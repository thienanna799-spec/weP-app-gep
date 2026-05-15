import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { VehicleMaintenance } from '../types';

export const useVehicleMaintenances = (vehicleId?: string) => {
  const [maintenances, setMaintenances] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Fix BUG 4: Fetch ALL maintenances when no vehicleId provided
      const endpoint = vehicleId
        ? `/vehicles/${vehicleId}/maintenances`
        : '/maintenances';
      const data = await api.get<VehicleMaintenance[]>(endpoint);
      setMaintenances(data);
    } catch (e) {
      console.error('Error fetching vehicle maintenances:', e);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { maintenances, loading, refetch: fetch };
};
