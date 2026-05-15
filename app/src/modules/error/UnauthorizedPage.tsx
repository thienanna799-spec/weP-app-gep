import React from 'react';
import { Lock, Home, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout } from '../../services/authService';

const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-6 bg-red-50 text-red-600 rounded-full mb-6">
        <Lock className="w-16 h-16" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.unauthorized')}</h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('auth.unauthorized_desc')}</p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/dashboard" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold"
        >
          <Home className="w-5 h-5" />
          <span>{t('auth.go_home')}</span>
        </Link>
        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-200"
        >
          <UserX className="w-5 h-5" />
          <span>{t('auth.logout_switch')}</span>
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
