import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  BarChart3, 
  Users, 
  Receipt, 
  Coins, 
  FileText, 
  Settings as SettingsIcon, 
  Shield, 
  Clock,
  Sparkles,
  Cloud,
  CloudOff,
  LogOut
} from 'lucide-react';
import { ActiveTab, Barber, StoreSettings } from '../types';
import { formatThaiDate } from '../utils/formatters';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: StoreSettings;
  barbers?: Barber[];
  activeStaffId?: string;
  onSelectStaff?: (staffId: string) => void;
  onRequestPinLock?: () => void;
  isAuthenticatedAdmin?: boolean;
  todaySalesTotal?: number;
  isCloudConnected?: boolean;
  currentAccountEmail?: string | null;
  onSwitchAccount?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onRequestPinLock,
  isAuthenticatedAdmin = false,
  todaySalesTotal = 0,
  isCloudConnected = true,
  currentAccountEmail,
  onSwitchAccount,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems: { id: ActiveTab; label: string; emoji: string }[] = [
    { id: 'POS', label: 'POS ขายหน้าร้าน', emoji: '✂️' },
    { id: 'REPORTS', label: 'รายงาน & บัญชี', emoji: '📊' },
    { id: 'MEMBERS', label: 'สมาชิก & คอร์ส', emoji: '🧸' },
    { id: 'EXPENSES', label: 'บันทึกรายจ่าย', emoji: '💸' },
    { id: 'DRAWER', label: 'เงินในเก๊ะ', emoji: '👛' },
    { id: 'SALARY', label: 'สลิปเงินเดือน', emoji: '📑' },
    { id: 'SETTINGS', label: 'ตั้งค่าระบบ', emoji: '⚙️' },
  ];

  const isBrandHeader = settings.brandHeaderStyle === 'brand';

  return (
    <header 
      id="main-app-header"
      className={`sticky top-0 z-30 backdrop-blur-md border-b shadow-xs transition-colors duration-300 ${
        isBrandHeader 
          ? 'bg-[var(--header-bg)] text-[var(--header-text)] border-[var(--header-border)]' 
          : 'bg-white/95 border-[var(--header-border)] text-stone-900'
      }`}
      style={{
        borderBottomColor: 'var(--header-border)',
      }}
    >
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Identity & Logo */}
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img
              id="header-store-logo"
              src={settings.logoUrl}
              alt={settings.storeName}
              className="w-10 h-10 rounded-2xl object-cover shadow-xs transition-transform hover:scale-105"
              style={{
                border: '2px solid var(--brand-primary)',
              }}
            />
          ) : (
            <div 
              id="header-default-icon"
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-xs transition-transform hover:scale-105"
              style={{
                backgroundColor: 'var(--brand-primary-light)',
                border: '1.5px solid var(--brand-primary)',
                color: 'var(--brand-primary)',
              }}
            >
              💈
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 
                id="header-store-name"
                className="text-sm sm:text-base font-extrabold tracking-tight"
                style={{
                  color: isBrandHeader ? 'var(--header-text)' : 'inherit',
                }}
              >
                {settings.storeName || 'BARBERSHOP'}
              </h1>
              <span 
                id="header-pos-badge"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all"
                style={{
                  backgroundColor: 'var(--brand-primary-light)',
                  color: 'var(--brand-primary)',
                  borderColor: 'var(--brand-primary-border)',
                  borderWidth: '1px',
                }}
              >
                <Sparkles className="w-2.5 h-2.5 text-[var(--brand-primary)]" /> POS
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60" title="ฐานข้อมูลคลาวด์ Realtime ซิงค์ข้ามทุกเครื่อง">
                <Cloud className="w-2.5 h-2.5 text-emerald-600" /> Realtime Cloud
              </span>
            </div>
            <p 
              id="header-store-slogan"
              className="text-[11px] opacity-75 hidden sm:block truncate max-w-xs sm:max-w-md"
            >
              {settings.storeSlogan ? settings.storeSlogan : 'ระบบบริหารจัดการร้านบาร์เบอร์ & ซาลอน'}
            </p>
          </div>
        </div>

        {/* Right Tools & Status */}
        <div className="flex items-center gap-2.5">
          {/* Clock */}
          <div 
            id="header-clock"
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors"
            style={{
              backgroundColor: isBrandHeader ? 'rgba(255, 255, 255, 0.15)' : 'var(--brand-primary-subtle)',
              border: '1px solid var(--header-border)',
              color: isBrandHeader ? 'var(--header-text)' : '#57534e',
            }}
          >
            <Clock className="w-3.5 h-3.5 opacity-70" />
            <span className="font-mono text-[11px] font-medium">
              {formatThaiDate(currentTime, false)} • {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Today Total */}
          <div 
            id="header-today-total"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold shadow-2xs"
          >
            <span className="text-emerald-700">☀️ ยอดวันนี้:</span>
            <span className="font-extrabold font-mono">฿{todaySalesTotal.toLocaleString()}</span>
          </div>

          {/* Account Store Badge & Log out */}
          {currentAccountEmail && (
            <div 
              id="header-account-badge"
              className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border shadow-2xs transition-colors"
              style={{
                backgroundColor: isBrandHeader ? 'rgba(255, 255, 255, 0.2)' : 'rgba(245, 245, 244, 0.9)',
                borderColor: 'var(--header-border)',
              }}
            >
              <div className="flex items-center gap-1 text-stone-700">
                <span className="text-stone-400 text-xs">👤</span>
                <span 
                  className="truncate max-w-[120px] sm:max-w-[160px] text-xs font-extrabold"
                  style={{
                    color: isBrandHeader ? 'var(--header-text)' : '#1c1917',
                  }}
                  title={currentAccountEmail}
                >
                  {currentAccountEmail}
                </span>
              </div>
              <button
                id="header-logout-button"
                onClick={onLogout || onSwitchAccount}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 active:scale-95 text-rose-600 hover:text-rose-700 rounded-full border border-stone-200 hover:border-rose-300 transition cursor-pointer text-xs font-black shadow-2xs"
                title="คลิกเพื่อลงชื่อออก (Log out)"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>ลงชื่อออก</span>
              </button>
            </div>
          )}

          {/* PIN Lock / Admin Status */}
          {isAuthenticatedAdmin ? (
            <button
              id="header-pin-lock-button"
              onClick={onRequestPinLock}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-950 rounded-full border border-amber-300 transition cursor-pointer text-xs font-extrabold shadow-2xs"
              title="สิทธิ์ผู้ดูแลระบบเปิดอยู่ (คลิกเพื่อล็อคความปลอดภัย)"
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>🔓 แอดมิน (คลิกล็อค)</span>
            </button>
          ) : (
            <button
              id="header-pin-lock-button"
              onClick={() => setActiveTab('SETTINGS')}
              className="p-1.5 bg-stone-100/80 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200/80 transition cursor-pointer shadow-2xs"
              title="ระบบความปลอดภัย PIN แอดมิน"
            >
              <Shield className="w-4 h-4 text-stone-500" />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div 
        id="header-navigation-bar"
        className="border-t transition-colors duration-300"
        style={{
          backgroundColor: 'var(--header-subnav-bg)',
          borderTopColor: 'var(--header-border)',
        }}
      >
        <nav className="max-w-7xl mx-auto flex items-center gap-1.5 px-4 sm:px-6 py-1.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isProtected = (item.id === 'SETTINGS' || item.id === 'SALARY') && !isAuthenticatedAdmin;
            return (
              <button
                id={`header-nav-tab-${item.id.toLowerCase()}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? 'shadow-xs font-black'
                    : 'text-stone-600 hover:bg-black/5 hover:text-stone-900'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)',
                        boxShadow: 'var(--btn-primary-shadow)',
                      }
                    : {}
                }
              >
                <span className="text-sm">{item.emoji}</span>
                <span>{item.label}</span>
                {isProtected && (
                  <span className="text-[10px] text-stone-400 font-mono" title="ต้องใส่รหัส PIN ก่อนเข้า">
                    🔒
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
