import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-6 bg-yellow-50 text-yellow-600 rounded-full mb-6">
        <AlertTriangle className="w-16 h-16" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-xl text-gray-600 mb-8 text-balance">{t('auth.not_found_desc')}</p>
      <Link 
        to="/dashboard" 
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
      >
        <Home className="w-5 h-5" />
        <span className="font-bold">{t('auth.go_home')}</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
