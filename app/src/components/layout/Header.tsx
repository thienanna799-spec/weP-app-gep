import React from 'react';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../../types/user.types';
import { logout } from '../../services/authService';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  profile: UserProfile;
  title: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tl', label: 'Filipino', flag: '🇵🇭' },
];

const Header: React.FC<HeaderProps> = ({ profile, title, isCollapsed, onToggleCollapse }) => {
  const { i18n, t } = useTranslation();

  const currentIndex = LANGUAGES.findIndex(l => l.code === i18n.language);
  const currentLang = LANGUAGES[currentIndex >= 0 ? currentIndex : 0];

  // One-click cycle: VI → EN → TL → VI
  const cycleLang = () => {
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    const nextLang = LANGUAGES[nextIndex];
    i18n.changeLanguage(nextLang.code);
    localStorage.setItem('lang', nextLang.code);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-end sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {/* One-click language cycle button */}
        <button
          onClick={cycleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-gray-200 hover:bg-blue-50 hover:border-blue-200 active:scale-95 transition-all cursor-pointer select-none"
          title={`${currentLang.label} — Click to switch`}
        >
          <span className="text-base leading-none">{currentLang.flag}</span>
          <span className="text-gray-700 font-extrabold tracking-wide">{currentLang.code.toUpperCase()}</span>
        </button>

        {/* Notification Center */}
        <NotificationCenter />
        
        <div className="h-8 w-px bg-gray-200"></div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900 leading-none">{profile.name}</span>
            <span className="text-xs text-gray-500 mt-1">{t(`roles.${profile.role}`)}</span>
          </div>
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-gray-200">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile.name[0].toUpperCase()
            )}
          </div>
          <button 
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title={t('auth.logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
