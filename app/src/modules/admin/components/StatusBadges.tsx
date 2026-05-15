import React from 'react';
import Badge from '../../../components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { Role } from '../../../types/user.types';

export const UserRoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const { t } = useTranslation();
  switch (role) {
    case 'super_admin': return <Badge variant="red" className="font-black uppercase tracking-tighter">{t('roles.super_admin')}</Badge>;
    case 'admin': return <Badge variant="blue" className="font-bold">{t('roles.admin')}</Badge>;
    case 'staff': return <Badge variant="purple" className="font-medium">{t('roles.staff')}</Badge>;
    case 'driver': return <Badge variant="amber" className="font-medium">{t('roles.driver')}</Badge>;
    case 'pending': return <Badge variant="gray" className="italic">{t('roles.pending')}</Badge>;
    default: return <Badge variant="gray">{role}</Badge>;
  }
};

export const UserStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  switch (status) {
    case 'active': return <Badge variant="green" className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" /> {t('status.active')}</Badge>;
    case 'blocked': return <Badge variant="red">{t('status.blocked')}</Badge>;
    case 'pending': return <Badge variant="yellow">{t('roles.pending')}</Badge>;
    case 'inactive': return <Badge variant="gray">{t('status.inactive')}</Badge>;
    default: return <Badge variant="gray">{status}</Badge>;
  }
};
