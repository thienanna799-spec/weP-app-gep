import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { UserProfile } from '../../types/user.types';
import { SIDEBAR_CONFIG } from '../../config/sidebar';
import { Menu } from 'lucide-react';

interface AppLayoutProps {
  profile: UserProfile;
}

const AppLayout: React.FC<AppLayoutProps> = ({ profile }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Desktop Collapse State - Persistence via localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('gep_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const nextState = !prev;
      localStorage.setItem('gep_sidebar_collapsed', String(nextState));
      return nextState;
    });
  };

  const location = useLocation();
  const { t } = useTranslation();
  
  const currentNav = SIDEBAR_CONFIG.find(item => item.path === location.pathname);
  const pageTitle = currentNav ? t(currentNav.labelKey) : t('nav.dashboard');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        profile={profile} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden h-16 px-4 flex items-center justify-between bg-white border-b border-gray-200 shrink-0">
          <img 
            src="https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw" 
            alt="Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Global Page Header Portal - Aligns vertically with the Sidebar Logo (h-16) on Desktop */}
        <div id="page-header-portal" className="w-full shrink-0 z-30 lg:h-16 lg:px-8 lg:flex lg:items-center px-4 pt-4 lg:pt-0"></div>
        
        <main className="flex-1 flex flex-col overflow-y-auto p-4 pt-4 lg:p-8 lg:pt-2 custom-scrollbar">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
