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
  CloudOff
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
  todaySalesTotal?: number;
  isCloudConnected?: boolean;
  currentAccountEmail?: string;
  onSwitchAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onRequestPinLock,
  todaySalesTotal = 0,
  isCloudConnected = true,
  currentAccountEmail,
  onSwitchAccount,
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

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Identity & Logo */}
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.storeName}
              className="w-10 h-10 rounded-2xl object-cover border border-[#E8E2D5] shadow-xs transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-9 h-9 bg-[#FAF6F0] border border-[#E8E2D5] rounded-2xl flex items-center justify-center text-lg shadow-xs transition-transform hover:scale-105">
              💈
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-800">
                {settings.storeName || 'BARBERSHOP'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" /> POS
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60" title="ฐานข้อมูลคลาวด์ Realtime ซิงค์ข้ามทุกเครื่อง">
                <Cloud className="w-2.5 h-2.5 text-emerald-600" /> Realtime Cloud
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              {settings.storeSlogan ? settings.storeSlogan : 'ระบบบริหารจัดการร้านบาร์เบอร์ & ซาลอน'}
            </p>
          </div>
        </div>

        {/* Right Tools & Status */}
        <div className="flex items-center gap-2.5">
          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-50 border border-stone-200/70 text-stone-600 text-xs">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono text-[11px] font-medium">
              {formatThaiDate(currentTime, false)} • {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Today Total */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold">
            <span className="text-emerald-700">☀️ ยอดวันนี้:</span>
            <span className="font-extrabold font-mono">฿{todaySalesTotal.toLocaleString()}</span>
          </div>

          {/* Account Store Badge & Switcher */}
          {currentAccountEmail && (
            <button
              onClick={onSwitchAccount}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200/80 active:scale-95 text-stone-700 rounded-full border border-stone-200/80 transition cursor-pointer text-xs font-bold shadow-2xs"
              title="คลิกเพื่อสลับร้าน หรือ ออกจากระบบ"
            >
              <span className="text-stone-500 text-[11px]">ร้าน:</span>
              <span className="truncate max-w-[130px] text-stone-900 font-extrabold">{currentAccountEmail}</span>
              <span className="text-[10px] text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md font-bold">
                สลับร้าน
              </span>
            </button>
          )}

          {/* PIN Lock */}
          {settings.isPinProtected && (
            <button
              onClick={onRequestPinLock}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl border border-stone-200 transition cursor-pointer"
              title="PIN Admin"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="border-t border-stone-100 bg-[#FAF9F6]">
        <nav className="max-w-7xl mx-auto flex items-center gap-1.5 px-4 sm:px-6 py-1.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                }`}
              >
                <span className="text-sm">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
