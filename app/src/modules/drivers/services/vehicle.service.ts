import api from '../../../services/api';
import { Vehicle, VehicleMaintenance } from '../types';

export const vehicleService = {
  async getVehicles(): Promise<Vehicle[]> {
    return api.get<Vehicle[]>('/vehicles');
  },

  async getVehicle(id: string): Promise<Vehicle | null> {
    try { return await api.get<Vehicle>(`/vehicles/${id}`); }
    catch { return null; }
  },

  async create(data: Omit<Vehicle, 'id'>): Promise<string> {
    const vehicle = await api.post<Vehicle>('/vehicles', data);
    return vehicle.id;
  },

  async update(id: string, data: Partial<Vehicle>): Promise<void> {
    await api.put(`/vehicles/${id}`, data);
  },

  async getMaintenances(vehicleId?: string): Promise<VehicleMaintenance[]> {
    if (vehicleId) return api.get<VehicleMaintenance[]>(`/vehicles/${vehicleId}/maintenances`);
    return [];
  },

  async addMaintenance(data: Omit<VehicleMaintenance, 'id'>): Promise<string> {
    const maint = await api.post<VehicleMaintenance>(`/vehicles/${data.vehicleId}/maintenances`, data);
    return maint.id;
  },
};
