import api from './api';
import { Role } from '../types/user.types';

export const updateUserRole = async (uid: string, role: Role) => {
  return api.put(`/users/${uid}/role`, { role });
};

export const updateUserStatus = async (uid: string, status: 'active' | 'blocked') => {
  return api.put(`/users/${uid}/status`, { status });
};
