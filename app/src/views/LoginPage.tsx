import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithGoogle } from '../services/firebase';
import { 
  Shield, 
  Leaf, 
  Package, 
  Mail, 
  Lock, 
  Eye,
  EyeOff, 
  ArrowRight, 
  Box,
  ChevronRight
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'google' | 'password'>('google');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#02183b] relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-cyan-400 rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-[55%] relative z-10 px-16 py-12 justify-between">
        {/* Logo */}
        <div className="flex items-center text-white">
          <img src="/custom-logo.png" alt="Logo" className="h-28 rounded-2xl object-contain shadow-lg" />
        </div>

        {/* Main Content */}
        <div className="mt-12">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Bảo vệ <span className="text-cyan-400">TỐI ƯU</span><br />
            AN TÂM VẬN CHUYỂN
          </h1>
          <p className="text-blue-100/80 text-lg mb-12 max-w-md leading-relaxed">
            Giải pháp bọc chống sốc chất lượng cao, bảo vệ sản phẩm của bạn trên mọi hành trình.
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Chống sốc vượt trội</h3>
                <p className="text-blue-200/70 text-sm">Bảo vệ sản phẩm tối đa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <Leaf className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Vật liệu thân thiện</h3>
                <p className="text-blue-200/70 text-sm">An toàn với môi trường</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Đa dạng kích thước</h3>
                <p className="text-blue-200/70 text-sm">Phù hợp mọi nhu cầu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Image Positioning */}
        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] xl:w-[600px] pointer-events-none opacity-90 mix-blend-lighten">
           <img src="/illustration.png" alt="Packaging" className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
        </div>


      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] bg-white lg:rounded-l-[2.5rem] flex items-center justify-center p-8 relative z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex mb-2">
              <img src="/custom-logo.png" alt="Logo" className="h-16 rounded-2xl object-contain shadow-md" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Chào mừng trở lại!</h2>
            <p className="text-gray-500 text-sm font-medium">Đăng nhập để tiếp tục quản lý đơn hàng</p>
          </div>

          {/* Tabs */}
          <div className="flex p-1.5 bg-gray-100/80 rounded-2xl">
            <button 
              onClick={() => setActiveTab('google')}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'google' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đăng nhập với Google
            </button>
            <button 
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'password' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đăng nhập với mật khẩu
            </button>
          </div>

          {/* Login Options Container */}
          <div className="space-y-6">
            {activeTab === 'google' && (
              <div className="space-y-6">
                <button 
                  onClick={signInWithGoogle}
                  className="w-full py-4 px-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:shadow-md transition-all group"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900 text-lg">Tiếp tục với Google</span>
                </button>
              </div>
            )}

            {activeTab === 'password' && (
              <form className="space-y-5" onSubmit={(e) => {
                e.preventDefault();
                alert('Tính năng đăng nhập bằng mật khẩu đang được phát triển. Vui lòng chuyển sang tab Đăng nhập với Google.');
              }}>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Nhập email của bạn" 
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Nhập mật khẩu của bạn" 
                      className="w-full pl-11 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <input type="checkbox" className="peer appearance-none w-4 h-4 border border-gray-300 rounded cursor-pointer checked:bg-blue-500 checked:border-blue-500 transition-all" />
                      <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                        <path d="M3 8L6 11L11 3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"></path>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert("Vui lòng liên hệ Admin để khôi phục mật khẩu."); }} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white rounded-2xl font-semibold shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Đăng nhập
                  <div className="bg-white/20 p-1 rounded-full">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </form>
            )}
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              Chưa có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); alert("Hệ thống hỗ trợ đăng ký tự động. Vui lòng chuyển sang tab 'Đăng nhập với Google' và chọn tài khoản của bạn để đăng nhập hoặc đăng ký mới."); }} className="font-semibold text-blue-600 hover:underline transition-all">Đăng ký ngay</a>
            </p>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-8">
            {t('auth.admin_only')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
