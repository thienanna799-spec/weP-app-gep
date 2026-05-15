import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getWarehouseConfig } from '../modules/inventory/components/warehouseConfig';

export interface ZoneUsage {
  id: string;
  name: string;
  area: number;
  used_area: number;
  roll_count: number;
  usage_percent: number;
}

export interface StorageCapacityData {
  total_area: number;
  used_area: number;
  available_area: number;
  total_slots: number;
  used_slots: number;
  usage_percent: number;
  zones: ZoneUsage[];
}

export const useStorageCapacity = () => {
  const [capacity, setCapacity] = useState<StorageCapacityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const config = getWarehouseConfig();
      const zonesParam = config.z