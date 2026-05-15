import React from 'react';
import Badge from '../../../components/ui/Badge';
import { DRIVER_STATUS_LABELS, DRIVER_STATUS_COLORS, VEHICLE_STATUS_LABELS, VEHICLE_STATUS_COLORS } from '../constants';
import { DriverStatus, VehicleStatus } from '../types';

export const DriverStatusBadge: React.FC<{ status: DriverStatus }> = ({ status }) => {
  return (
    <Badge variant={DRIVER_STATUS_COLORS[status] || 'gray'}>
      {DRIVER_STATUS_LABELS[status] || status}
    </Badge>
  );
};

export const VehicleStatusBadge: React.FC<{ status: VehicleStatus }> = ({ status }) => {
  return (
    <Badge variant={VEHICLE_STATUS_COLORS[status] || 'gray'}>
      {VEHICLE_STATUS_LABELS[status] || status}
    </Badge>
  );
};
