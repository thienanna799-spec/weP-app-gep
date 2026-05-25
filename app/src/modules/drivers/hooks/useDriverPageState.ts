import { useState, useMemo, useEffect } from 'react';
import { useDrivers } from './useDrivers';
import { useVehicles } from './useVehicles';
import { useFuelLogs } from './useFuelLogs';
import { useVehicleMaintenances } from './useVehicleMaintenances';
import { driverService } from '../services/driver.service';
import { vehicleService } from '../services/vehicle.service';
import { useSocket } from '../../../hooks/useSocket';
import { Driver, Vehicle } from '../types';

export type ActiveTab = 'drivers' | 'vehicles' | 'map' | 'logs' | 'stats' | 'ocr-audit';

export function useDriverPageState() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('drivers');
  const { drivers, loading: driversLoading, refetch: refetchDrivers } = useDrivers();
  const { vehicles, loading: vehiclesLoading, refetch: refetchVehicles } = useVehicles();
  const { fuelLogs } = useFuelLogs();
  const { maintenances } = useVehicleMaintenances();

  // Real-time: auto-refresh drivers when APK users register or check-in vehicles
  useSocket({
    onUserUpdate: () => refetchDrivers(),
    onDriverVehicleUpdate: () => { refetchDrivers(); refetchVehicles(); },
    onShippingUpdate: () => refetchDrivers(), // status changes from shipping
  });

  // Polling fallback: auto-refresh every 30s to catch any missed socket events
  useEffect(() => {
    const interval = setInterval(() => {
      refetchDrivers();
      refetchVehicles();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchDrivers, refetchVehicles]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Keep selectedDriver in sync with latest data after refetch
  useEffect(() => {
    if (selectedDriver && drivers.length > 0) {
      const fresh = drivers.find(d => d.id === selectedDriver.id);
      if (fresh && fresh !== selectedDriver) {
        setSelectedDriver(fresh);
      }
    }
  }, [drivers]);

  // Memos for filtering
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => 
      (d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!statusFilter || d.status === statusFilter)
    );
  }, [drivers, searchTerm, statusFilter]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  // KPI Calculations — fetch real delivery stats from shipping orders
  const [deliveryStats, setDeliveryStats] = useState({ successful: 0, failed: 0 });
  useEffect(() => {
    // ✅ Fix BUG 6: Count from shipping orders, not daily-logs
    import('../../../services/api').then(({ default: api }) => {
      api.get<any[]>('/shipping').then(orders => {
        const successful = orders.filter((o: any) => o.status === 'giao_thanh_cong').length;
        const failed = orders.filter((o: any) => o.status === 'giao_that_bai').length;
        setDeliveryStats({ successful, failed });
      }).catch(() => {});
    });
  }, [drivers]); // re-fetch when drivers change (socket triggered)

  const stats = useMemo(() => ({
    totalDrivers: drivers.length,
    deliveringDrivers: drivers.filter(d => d.status === 'delivering').length,
    availableDrivers: drivers.filter(d => d.status === 'available').length,
    activeVehicles: vehicles.filter(v => v.status === 'available' || v.status === 'in_use').length,
    maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
    successfulDeliveries: deliveryStats.successful,
    failedDeliveries: deliveryStats.failed,
    totalFuelCost: fuelLogs.reduce((acc, l) => acc + (l.amount || 0), 0),
    totalMaintenanceCost: maintenances.reduce((acc, l) => acc + (l.cost || 0), 0)
  }), [drivers, vehicles, fuelLogs, maintenances, deliveryStats]);

  // Actions
  const handleDriverSubmit = async (data: Partial<Driver>) => {
    setIsFormLoading(true);
    try {
      if (selectedDriver) {
        await driverService.update(selectedDriver.id, data);
      } else {
        await driverService.create(data as Omit<Driver, 'id'>);
      }
      setIsDriverModalOpen(false);
      setSelectedDriver(null);
      refetchDrivers();
    } catch (error: any) {
      console.error(error);
      alert('Lỗi: ' + (error.message || 'Không thể lưu tài xế'));
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleVehicleSubmit = async (data: Partial<Vehicle>) => {
    setIsFormLoading(true);
    try {
      if (selectedVehicle) {
        await vehicleService.update(selectedVehicle.id, data);
      } else {
        await vehicleService.create(data as Omit<Vehicle, 'id'>);
      }
      setIsVehicleModalOpen(false);
      setSelectedVehicle(null);
      refetchVehicles();
    } catch (error: any) {
      console.error(error);
      alert('Lỗi: ' + (error.message || 'Không thể lưu phương tiện'));
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleAssignVehicle = async (vId: string) => {
    if (!selectedDriver) return;
    setIsFormLoading(true);
    try {
      await driverService.update(selectedDriver.id, { currentVehicleId: vId });
      await vehicleService.update(vId, { status: 'in_use' });
      setIsAssignModalOpen(false);
      setSelectedDriver(null);
      refetchDrivers();
      refetchVehicles();
    } catch (error) {
      console.error(error);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleBlockDriver = async (d: Driver) => {
    const action = d.status === 'blocked' ? 'Mở khóa' : 'Khóa';
    if (!confirm(`${action} tài xế ${d.name}?`)) return;
    try {
      await driverService.update(d.id, { status: d.status === 'blocked' ? 'available' : 'blocked' });
      refetchDrivers();
    } catch (e: any) {
      alert('Lỗi: ' + (e.message || 'Không thể cập nhật'));
    }
  };

  return {
    // Tab
    activeTab, setActiveTab,
    // Data
    drivers, vehicles, fuelLogs, maintenances,
    driversLoading, vehiclesLoading,
    // Filters
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    filteredDrivers, filteredVehicles,
    // Stats
    stats,
    // Modals
    isDriverModalOpen, setIsDriverModalOpen,
    isVehicleModalOpen, setIsVehicleModalOpen,
    isAssignModalOpen, setIsAssignModalOpen,
    selectedDriver, setSelectedDriver,
    selectedVehicle, setSelectedVehicle,
    isDetailOpen, setIsDetailOpen,
    isFormLoading,
    // Actions
    handleDriverSubmit,
    handleVehicleSubmit,
    handleAssignVehicle,
    handleBlockDriver,
  };
}
