import api from '../../../services/api';
import { UserProfile, UserLoginLog, UserActivityLog, Role, UserStatus } from '../../../types/user.types';

export const adminService = {
  async getUsers(): Promise<UserProfile[]> {
    return api.get<UserProfile[]>('/users');
  },

  async updateUserRole(uid: string, role: Role): Promise<void> {
    await api.put(`/users/${uid}/role`, { role });
  },

  async updateUserStatus(uid: string, status: UserStatus): Promise<void> {
    await api.put(`/users/${uid}/status`, { status });
  },

  async deleteUser(uid: string): Promise<void> {
    await api.delete(`/users/${uid}`);
  },

  async getLoginLogs(_userId?: string): Promise<UserLoginLog[]> {
    return api.get<UserLoginLog[]>('/admin/login-logs');
  },

  async getActivityLogs(_userId?: string): Promise<UserActivityLog[]> {
    return api.get<UserActivityLog[]>('/admin/activity-logs');
  },

  async logActivity(userId: string, action: string, module: string, referenceId: string, description: string): Promise<void> {
    try {
      await api.post('/admin/activity-logs', { userId, email: '', action, module, referenceId, description });
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  },

  async logLogin(userId: string, email: string, status: 'success' | 'failed' | 'blocked' = 'success'): Promise<void> {
    try {
      await api.post('/admin/login-logs', { userId, email, status });
    } catch (e) {
      console.error('Failed to log login:', e);
    }
  },
};
