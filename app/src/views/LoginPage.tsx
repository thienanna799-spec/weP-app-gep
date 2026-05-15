import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { signInWithGoogle } from '../services/firebase';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-8">
        <div className="space-y-2">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-20 h-20 object-contain mx-auto mb-4" 
            onError={(e: any) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg shadow-blue-200">B</div>
          <h1 className="text-3xl font-bold text-gray-900">{t('auth.app_title')}</h1>
          <p className="text-gray-500">{t('auth.app_subtitle')}</p>
        </div>
        
        <Button onClick={signInWithGoogle} className="w-full py-4 text-lg">
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
          {t('auth.login_with_google')}
        </Button>
        
        <p className="text-xs text-gray-400">
          {t('auth.admin_only')}
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
