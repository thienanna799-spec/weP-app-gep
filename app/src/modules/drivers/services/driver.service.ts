import api from '../../../services/api';
import { Driver, FuelLog, GpsLog } from '../types';

export const driverService = {
  async getDrivers(): Promise<Driver[]> {
    return api.get<Driver[]>('/drivers');
  },

  async getDriver(id: string): Promise<Driver | null> {
    try { return await api.get<Driver>(`/drivers/${id}`); }
    catch { return null; }
  },

  async create(data: Omit<Driver, 'id'>): Promise<string> {
    const driver = await api.post<Driver>('/drivers', data);
    return driver.id;
  },

  async update(id: string, data: Partial<Driver>): Promise<void> {
    await api.put(`/drivers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },

  async getFuelLogs(driverId?: string): Promise<FuelLog[]> {
    const qs = driverId ? `?driverId=${driverId}` : '';
    return api.get<FuelLog[]>(`/fuel-logs${qs}`);
  },

  async addFuelLog(data: Omit<FuelLog, 'id'>): Promise<string> {
    const log = await api.post<FuelLog>('/fuel-logs', data);
    return log.id;
  },

  async updateLocation(driverId: string, lat: number, lng: number): Promise<void> {
    await api.put(`/drivers/${driverId}/location`, { lat, lng });
  },
};
