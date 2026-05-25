import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_CONFIG, isModuleAllowed } from '../../config/sidebar';
import { UserProfile } from '../../types/user.types';
import NotificationCenter from './NotificationCenter';
import { logout } from '../../services/authService';
import { useStockSummary } from '../../modules/inventory/hooks/useStockSummary';
import { useOrderAlerts } from '../../modules/orders/hooks/useOrderAlerts';
import { useShippingAlerts } from '../../modules/shipping/hooks/useShippingAlerts';
import { useProductionOrderAlerts } from '../../modules/production-orders/hooks/useProductionOrderAlerts';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: 'VN' },
  { code: 'en', label: 'English', flag: 'EN' },
];

interface SidebarProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ profile, isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { t, i18n } = useTranslation();
  const { alertCount } = useStockSummary();
  const { pendingApprovalCount, unpaidCount, totalAlerts: orderAlertCount } = useOrderAlerts();
  const { activeCount: shippingAlertCount } = useShippingAlerts();
  const { activeCount: productionAlertCount } = useProductionOrderAlerts();

  const currentIndex = LANGUAGES.findIndex(l => l.code === i18n.language);
  const currentLang = LANGUAGES[currentIndex >= 0 ? currentIndex : 0];

  const cycleLang = () => {
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    const nextLang = LANGUAGES[nextIndex];
    i18n.changeLanguage(nextLang.code);
    localStorage.setItem('lang', nextLang.code);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isCollapsed ? 'w-20' : 'w-52'} bg-slate-900 text-white flex flex-col
        transition-all duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-center bg-white relative transition-all duration-300 px-2`}>
          <img 
            src={isCollapsed 
              ? "https://lh3.googleusercontent.com/d/1KxZVakEwk6H2zJX8y9tj3OIja5iroARR" 
              : "https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw"} 
            alt="Logo" 
            className={`w-auto object-contain transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-14'}`}
            referrerPolicy="no-referrer"
          />
          <button onClick={onClose} className="lg:hidden absolute right-4 p-1 text-slate-500 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>

          {/* Desktop Boundary Toggle */}
          {onToggleCollapse && (
            <button 
              onClick={onToggleCollapse}
              className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-50 bg-white border border-gray-200 p-1 rounded-full text-slate-400 hover:text-blue-600 shadow-sm transition-transform hover:scale-110"
              title="Toggle Sidebar"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>



        {/* Fixed Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {/* Navigation */}
          <nav className="flex-1 py-3 px-3 space-y-0.5">
          {SIDEBAR_CONFIG.filter(item => {
            return isModuleAllowed(item.id, profile.role);
          }).map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isCollapsed ? 'm-auto' : ''}`} />
              {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300 flex-1">{t(item.labelKey)}</span>}
              
              {item.id === 'inventory' && alertCount > 0 && (
                <span className={`
                  ${isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'}
                  bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse
                `}>
                  {alertCount}
                </span>
              )}

              {item.id === 'orders' && orderAlertCount > 0 && (
                <span
                  title={`${pendingApprovalCount} chờ duyệt · ${unpaidCount} chưa thanh toán`}
                  className={`
                    ${isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'}
                    bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse
                  `}
                >
                  {orderAlertCount}
                </span>
              )}

              {item.id === 'production_orders' && productionAlertCount > 0 && (
                <span
                  title={`${productionAlertCount} lệnh cần xử lý`}
                  className={`
                    ${isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'}
                    bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse
                  `}
                >
                  {productionAlertCount}
                </span>
              )}

              {item.id === 'shipping' && shippingAlertCount > 0 && (
                <span
                  title={`${shippingAlertCount} đơn hàng cần chuẩn bị/xuất kho/giao hàng`}
                  className={`
                    ${isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'}
                    bg-violet-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse
                  `}
                >
                  {shippingAlertCount}
                </span>
              )}
            </NavLink>
          ))}
          </nav>

          {/* User Footer */}
          <div className="p-3 border-t border-slate-800 shrink-0 sticky bottom-0 bg-slate-900 z-10">
          {!isCollapsed ? (
            <>
              {/* Expanded Mode */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  onClick={cycleLang}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all"
                  title={`${currentLang.label} — Click to switch`}
                >
                  <span className="text-white font-extrabold tracking-wide">{currentLang.code.toUpperCase()}</span>
                </button>
                <NotificationCenter placement="right" />
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title={t('auth.logout')}>
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-xl">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-slate-700">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile.name[0].toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white leading-none truncate">{profile.name}</span>
                  <span className="text-xs text-slate-400 mt-1 truncate">{t(`roles.${profile.role}`)}</span>
                </div>
              </div>
            </>
          ) : (
            /* Collapsed Mode */
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-slate-700" title={profile.name}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name[0].toUpperCase()
                )}
              </div>
              <div className="w-full h-px bg-slate-800"></div>
              <NotificationCenter placement="right" />
              <button
                onClick={cycleLang}
                className="w-9 h-9 flex items-center justify-center text-xs font-extrabold rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all"
                title={`${currentLang.label} — Click to switch`}
              >
                {currentLang.code.toUpperCase()}
              </button>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title={t('auth.logout')}>
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      </aside>
    </>
  );
};

export default Sidebar;
