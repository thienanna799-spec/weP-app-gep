import React from 'react';
import { Users, Truck, Map as MapIcon, Fuel, BarChart3, Plus, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Hook (all state + actions)
import { useDriverPageState } from './hooks/useDriverPageState';

// Components
import { DriverStatsCards } from './components/DriverStatsCards';
import { DriverTable } from './components/DriverTable';
import { VehicleTable } from './components/VehicleTable';
import { DriverDetail } from './components/DriverDetail';
import { VehicleDetail } from './components/VehicleDetail';
import { DriverForm } from './components/DriverForm';
import { VehicleForm } from './components/VehicleForm';
import { AssignDriverModal } from './components/AssignDriverModal';
import { DriverLocationMap } from './components/DriverLocationMap';
import { DriverStatsTab } from './components/DriverStatsTab';
import DriverLogsTab from './components/DriverLogsTab';
import { DRIVER_STATUS_LABELS } from './constants';

const TABS = [
  { id: 'drivers', label: 'Tài xế', icon: Users },
  { id: 'vehicles', label: 'Đội xe', icon: Truck },
  { id: 'map', label: 'Bản đồ', icon: MapIcon },
  { id: 'logs', label: 'Nhật ký', icon: Fuel },
  { id: 'stats', label: 'Báo cáo', icon: BarChart3 },
] as const;

const DriverTeamPage: React.FC = () => {
  const s = useDriverPageState();

  if (s.driversLoading || s.vehiclesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Đội ngũ Tài xế</h1>
          <p className="text-sm text-slate-500">Quản lý tài xế, phương tiện và theo dõi vận hành.</p>
        </div>
        <div className="flex gap-2">
          {s.activeTab === 'drivers' && (
            <Button onClick={() => { s.setSelectedDriver(null); s.setIsDriverModalOpen(true); }} className="shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-2" /> Thêm tài xế
            </Button>
          )}
        </div>
      </div>

      <DriverStatsCards stats={s.stats} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit overflow-x-auto max-w-full">
        {TABS.map(tab => {
          const isActive = s.activeTab === tab.id;
          let badgeCount = null;
          if (tab.id === 'drivers') badgeCount = s.drivers.length;
          if (tab.id === 'vehicles') badgeCount = s.vehicles.length;

          return (
            <button
              key={tab.id}
              onClick={() => s.setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {badgeCount !== null && (
                <span className={
                  isActive 
                    ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white" 
                    : "px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600"
                }>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {s.activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Tìm tên hoặc mã tài xế..." className="pl-10" value={s.searchTerm} onChange={(e) => s.setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <select value={s.statusFilter} onChange={(e) => s.setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20">
                <option value="">Tất cả trạng thái</option>
                {Object.entries(DRIVER_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <DriverTable 
            drivers={s.filteredDrivers} vehicles={s.vehicles}
            onView={(d) => { s.setSelectedDriver(d); s.setIsDetailOpen(true); }}
            onEdit={(d) => { s.setSelectedDriver(d); s.setIsDriverModalOpen(true); }}
            onBlock={s.handleBlockDriver}
            onAssign={(d) => { s.setSelectedDriver(d); s.setIsAssignModalOpen(true); }}
          />
        </div>
      )}

      {s.activeTab === 'vehicles' && (
        <VehicleTable 
          vehicles={s.filteredVehicles} 
          onView={(v) => { s.setSelectedVehicle(v); s.setIsDetailOpen(true); }}
          onEdit={(v) => { s.setSelectedVehicle(v); s.setIsVehicleModalOpen(true); }}
          onAdd={() => { s.setSelectedVehicle(null); s.setIsVehicleModalOpen(true); }}
        />
      )}

      {s.activeTab === 'map' && <DriverLocationMap drivers={s.drivers} />}

      {s.activeTab === 'logs' && (
        <DriverLogsTab fuelLogs={s.fuelLogs} maintenances={s.maintenances} drivers={s.drivers} vehicles={s.vehicles} />
      )}

      {s.activeTab === 'stats' && (
        <DriverStatsTab drivers={s.drivers} stats={s.stats} totalVehicles={s.vehicles.length} fuelLogsCount={s.fuelLogs.length} maintenancesCount={s.maintenances.length} />
      )}

      {/* Modals */}
      <Modal isOpen={s.isDriverModalOpen} onClose={() => s.setIsDriverModalOpen(false)} title={s.selectedDriver ? 'Cập nhật tài xế' : 'Thêm tài xế mới'}>
        <DriverForm initialData={s.selectedDriver || undefined} onSubmit={s.handleDriverSubmit} onCancel={() => s.setIsDriverModalOpen(false)} loading={s.isFormLoading} />
      </Modal>

      <Modal isOpen={s.isVehicleModalOpen} onClose={() => s.setIsVehicleModalOpen(false)} title={s.selectedVehicle ? 'Cập nhật phương tiện' : 'Thêm xe mới'}>
        <VehicleForm initialData={s.selectedVehicle || undefined} onSubmit={s.handleVehicleSubmit} onCancel={() => s.setIsVehicleModalOpen(false)} loading={s.isFormLoading} />
      </Modal>

      <Modal 
        isOpen={s.isDetailOpen} 
        onClose={() => { s.setIsDetailOpen(false); s.setSelectedDriver(null); s.setSelectedVehicle(null); }} 
        title={s.selectedDriver ? 'Chi tiết tài xế' : 'Chi tiết phương tiện'}
        size="lg"
      >
        {s.selectedDriver ? (
          <DriverDetail 
            driver={s.selectedDriver} 
            vehicle={
              (s.selectedDriver.todayVehicleId
                ? s.vehicles.find(v => v.id === s.selectedDriver!.todayVehicleId)
                : null)
              || s.vehicles.find(v => v.id === s.selectedDriver!.currentVehicleId)
              || undefined
            }
            onClose={() => s.setIsDetailOpen(false)} 
          />
        ) : s.selectedVehicle ? (
          <VehicleDetail 
            vehicle={s.selectedVehicle} 
            maintenances={s.maintenances.filter(m => m.vehicleId === s.selectedVehicle!.id)}
            fuelLogs={s.fuelLogs.filter(f => f.vehicleId === s.selectedVehicle!.id)}
            onClose={() => s.setIsDetailOpen(false)}
          />
        ) : null}
      </Modal>

      {s.selectedDriver && (
        <AssignDriverModal 
          isOpen={s.isAssignModalOpen}
          onClose={() => s.setIsAssignModalOpen(false)}
          driver={s.selectedDriver}
          vehicles={s.vehicles}
          onAssign={s.handleAssignVehicle}
          loading={s.isFormLoading}
        />
      )}
    </div>
  );
};

export default DriverTeamPage;
