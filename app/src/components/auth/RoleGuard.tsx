import React from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from '../../types/user.types';

interface RoleGuardProps {
  userRole: Role;
  allowedRoles: Role[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ userRole, allowedRoles, children }) => {
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
