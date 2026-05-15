import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { UserProfile, UserLoginLog, UserActivityLog } from '../../../types/user.types';

export const useAdmin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loginLogs, setLoginLogs] = useState<UserLoginLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, loginData, activityData] = await Promise.all([
        api.get<UserProfile[]>('/users'),
        api.get<UserLoginLog[]>('/admin/login-logs'),
        api.get<UserActivityLog[]>('/admin/activity-logs'),
      ]);
      setUsers(usersData);
      setLoginLogs(loginData);
      setActivityLogs(activityData);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { users, loginLogs, activityLogs, loading, refetch: fetchAll };
};
