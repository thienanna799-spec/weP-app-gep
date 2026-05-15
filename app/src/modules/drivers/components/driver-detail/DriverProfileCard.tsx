import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Driver } from '../../types';
import { DriverStatusBadge } from '../StatusBadges';

interface DriverProfileCardProps {
  driver: Driver;
}

export const DriverProfileCard: React.FC<DriverProfileCardProps> = ({ driver }) => (
  <div className="md:w-1/3 flex flex-col items-center">
    <img 
      src={driver.avatar || `https://ui-avatars.com/api/?name=${driver.name}&size=256`} 
      alt={driver.name} 
      className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-sm mb-4 object-cover" 
      referrerPolicy="no-referrer"
    />
    <h3 className="text-xl font-black text-slate-900">{driver.name}</h3>
    <p className="text-xs font-mono font-bold text-blue-600 mb-2">{driver.code}</p>
    <DriverStatusBadge status={driver.status} />
    
    <div className="w-full mt-6 space-y-3 pt-6 border-t border-slate-100">
       <div className="flex items-center gap-3 text-sm text-slate-600">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>{driver.phone}</span>
       </div>
       <div className="flex items-center gap-3 text-sm text-slate-600">
          <Mail className="w-4 h-4 text-slate-400" />
          <span className="truncate">{driver.email}</span>
       </div>
       <div className="flex items-center gap-3 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-xs">{driver.address}</span>
       </div>
    </div>
  </div>
);
