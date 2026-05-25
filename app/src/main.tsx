import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n'; // Initialize i18n before everything
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import { initSecurityGuard } from './utils/security-guard';

// Khởi động lớp bảo mật giao diện
initSecurityGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
