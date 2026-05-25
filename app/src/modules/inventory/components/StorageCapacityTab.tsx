import React from 'react';
import { useStorageCapacity } from '../../../hooks/useStorageCapacity';

import { WarehouseConfig } from './warehouseConfig';

export const StorageCapacityTab: React.FC<{ config: WarehouseConfig }> = ({ config }) => {
  const { capacity, loading, error, refetch } = useStorageCapacity(config.zones);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !capacity) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p>{error || 'Không thể tải dữ liệu diện tích kho'}</p>
        <button onClick={refetch} className="mt-2 px-4 py-2 bg-red-100 rounded hover:bg-red-200">
          Thử lại
        </button>
      </div>
    );
  }

  const {
    total_area,
    used_area,
    available_area,
    total_slots,
    used_slots,
    usage_percent
  } = capacity;

  let statusColor = 'bg-blue-500';
  let alertMessage = null;

  if (usage_percent > 95) {
    statusColor = 'bg-red-600';
    alertMessage = { type: 'critical', text: 'CẢNH BÁO KHẨN CẤP: Kho đã gần đầy (>95%)! Cần xuất kho ngay lập tức.' };
  } else if (usage_percent > 85) {
    statusColor = 'bg-orange-500';
    alertMessage = { type: 'danger', text: 'Cảnh báo mức cao: Sức chứa kho sắp cạn kiệt (>85%). Vui lòng lên kế hoạch di dời.' };
  } else if (usage_percent > 70) {
    statusColor = 'bg-yellow-500';
    alertMessage = { type: 'warning', text: 'Cảnh báo: Kho đang dần đầy (>70%).' };
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Quản lý diện tích lưu kho</h2>
        <button 
          onClick={refetch}
          className="px-3 py-1 bg-white border border-slate-200 rounded text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <span>↻</span> Làm mới
        </button>
      </div>

      {alertMessage && (
        <div className={`p-4 rounded-lg font-medium ${
          alertMessage.type === 'critical' ? 'bg-red-100 text-red-800 border border-red-300' :
          alertMessage.type === 'danger' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
          'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}>
          ⚠️ {alertMessage.text}
        </div>
      )}

      {/* Progress Dashboard */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Mức độ sử dụng</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{usage_percent.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium">Còn trống</p>
            <p className="text-lg font-bold text-green-600">{available_area.toFixed(2)} m²</p>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${statusColor}`}
            style={{ width: `${Math.min(usage_percent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            📏 Thông số diện tích (m²)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tổng diện tích kho</span>
              <span className="font-bold text-slate-800">{total_area} m²</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Diện tích đã dùng</span>
              <span className="font-bold text-blue-600">{used_area.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Diện tích khả dụng</span>
              <span className="font-bold text-green-600">{available_area.toFixed(2)} m²</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            📦 Phân bổ Slot (0.6m × 0.6m)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tổng số slot</span>
              <span className="font-bold text-slate-800">{total_slots} slot</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Slot đã dùng (cuộn)</span>
              <span className="font-bold text-blue-600">{used_slots.toFixed(2)} slot</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Slot còn lại</span>
              <span className="font-bold text-green-600">{(total_slots - used_slots).toFixed(2)} slot</span>
            </div>
            <div className="text-xs text-slate-400 mt-2 border-t pt-2">
              *1 slot = 1 cuộn cao 2m (0.36 m²). Cuộn thấp hơn sẽ chiếm tỷ lệ tương ứng.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
