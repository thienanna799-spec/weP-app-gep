export type Role = 'super_admin' | 'admin' | 'lead' | 'staff' | 'nv_san_xuat' | 'nv_tron_nguyen_lieu' | 'nv_chuan_bi_hang' | 'driver' | 'nv_tai_xe' | 'pending';
export type UserStatus = 'active' | 'blocked' | 'pending' | 'inactive';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  department?: string;
  position?: string;
  lastLoginAt?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface UserLoginLog {
  id: string;
  userId: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt: string;
  logoutAt?: string;
  status: 'success' | 'failed' | 'blocked';
}

export interface UserActivityLog {
  id: string;
  userId: string;
  email: string;
  action: string;
  module: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}
