import React, { useState } from 'react';
import { Lock, Home, UserX, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { getVisibleModules } from '../../config/sidebar';

const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error(error);
      setIsLoggingOut(false);
    }
  };

  const visibleModules = profile ? getVisibleModules(profile.role) : [];
  const hasAccess = visibleModules.length > 0;

  const handleGoHome = () => {
    if (hasAccess) {
      navigate(visibleModules[0].path);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-6 bg-red-50 text-red-600 rounded-full mb-6">
        <Lock className="w-16 h-16" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.unauthorized')}</h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {profile?.role === 'pending' 
          ? "Tài khoản của bạn đã được đăng nhập nhưng chưa được Admin phân quyền. Vui lòng liên hệ quản trị viên để được cấp quyền sử dụng hệ thống."
          : t('auth.unauthorized_desc')}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {hasAccess && (
          <button 
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold active:scale-95"
          >
            <Home className="w-5 h-5" />
            <span>{t('auth.go_home')}</span>
          </button>
        )}
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed min-w-[280px]"
        >
          {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserX className="w-5 h-5" />}
          <span>{isLoggingOut ? "Đang xử lý..." : t('auth.logout_switch')}</span>
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
