import React, { useState, useEffect, useRef } from 'react';
import { Barber, ServiceCategory, ServiceItem, StoreSettings } from '../../types';
import { 
  Store, 
  Users, 
  Scissors, 
  Shield, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  KeyRound, 
  RotateCcw,
  CheckCircle2,
  X,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Percent,
  Sparkles,
  Check,
  Palette,
  Paintbrush
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../../utils/formatters';
import { BRAND_COLOR_PRESETS, DEFAULT_BRAND_COLOR, applyBrandTheme } from '../../utils/brandTheme';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  barbers: Barber[];
  onSaveBarber: (barber: Barber) => void;
  onDeleteBarber: (barberId: string) => void;
  services: ServiceItem[];
  onSaveService: (service: ServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  onResetFactoryData: () => void;
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  barbers,
  onSaveBarber,
  onDeleteBarber,
  services,
  onSaveService,
  onDeleteService,
  onResetFactoryData,
}) => {
  const [activeTab, setActiveTab] = useState<'STORE' | 'BARBERS' | 'SERVICES' | 'SYSTEM'>('STORE');

  // Form states for store settings
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingCommissions, setIsSavingCommissions] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Factory Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Barber Modal
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Partial<Barber>>({});
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null);

  // Service Item Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceItem>>({});
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  // Helper to show rich animated toast & optional sparkle effect
  const showToast = (title: string, description?: string, type: 'success' | 'info' | 'warning' = 'success', triggerConfetti = false) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);

    if (triggerConfetti) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#fbbf24']
        });
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('ขนาดไฟล์ภาพใหญ่เกินไป', 'กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 3MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const updated = { ...formData, logoUrl: dataUrl };
        setFormData(updated);
        onSaveSettings(updated);
        showToast('อัพโหลดโลโก้ร้านสำเร็จ', 'บันทึกรูปภาพโลโก้ใหม่ลงระบบเรียบร้อยแล้ว', 'success', true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    const updated = { ...formData, logoUrl: '' };
    setFormData(updated);
    onSaveSettings(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('ลบโลโก้ร้านเรียบร้อย', 'เปลี่ยนกลับเป็นโลโก้เริ่มต้นของระบบ', 'info');
  };

  // Handle save store settings (Store Name & Logo only)
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    onSaveSettings(formData);

    setTimeout(() => {
      setIsSavingStore(false);
      showToast('บันทึกข้อมูลร้านค้าสำเร็จ!', `ชื่อร้าน: "${formData.storeName}" ถูกอัปเดตเรียบร้อยแล้ว`, 'success', true);
    }, 350);
  };

  // Handle save global commission rates
  const handleSaveCommissions = () => {
    setIsSavingCommissions(true);
    onSaveSettings(formData);

    setTimeout(() => {
      setIsSavingCommissions(false);
      showToast(
        'บันทึกอัตราคอมมิชชั่นรวมสำเร็จ!',
        `ตัดผม ${formData.haircutCommissionRate ?? 50}% | เคมี ${formData.chemicalCommissionRate ?? 40}% | สินค้า ${formData.productCommissionRate ?? 10}%`,
        'success',
        true
      );
    }, 350);
  };

  // Handle save Admin PIN
  const handleSavePin = () => {
    const pinToSave = (formData.adminPin || '').trim();
    if (pinToSave.length < 4) {
      showToast('รหัส PIN ต้องมี 4-6 หลัก', 'กรุณากรอกรหัส PIN เป็นตัวเลขอย่างน้อย 4 หลัก', 'warning');
      return;
    }
    setIsSavingPin(true);
    const updatedSettings: StoreSettings = {
      ...formData,
      adminPin: pinToSave,
      isPinProtected: true,
    };
    setFormData(updatedSettings);
    onSaveSettings(updatedSettings);

    setTimeout(() => {
      setIsSavingPin(false);
      showToast('บันทึกรหัส PIN สำเร็จ!', `รหัส PIN ความปลอดภัย (${pinToSave}) ถูกอัปเดตเรียบร้อยแล้ว`, 'success', true);
    }, 350);
  };

  // Barber Actions
  const handleOpenAddBarber = () => {
    setEditingBarber({
      name: '',
      nickname: '',
      phone: '',
      baseSalary: undefined,
      minGuarantee: 0,
      isActive: true,
    });
    setIsBarberModalOpen(true);
  };

  const handleOpenEditBarber = (b: Barber) => {
    setEditingBarber({ ...b });
    setIsBarberModalOpen(true);
  };

  const handleSaveBarberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber.name || !editingBarber.nickname) return;

    const isNew = !editingBarber.id;
    const saved: Barber = {
      id: editingBarber.id || `barber-${Date.now()}`,
      name: editingBarber.name.trim(),
      nickname: editingBarber.nickname.trim(),
      phone: editingBarber.phone?.trim() || '',
      baseSalary: Number(editingBarber.baseSalary) || 0,
      minGuarantee: 0,
      baseSalaryGuarantee: 0,
      isActive: editingBarber.isActive ?? true,
    };

    onSaveBarber(saved);
    setIsBarberModalOpen(false);
    showToast(
      isNew ? 'เพิ่มช่างใหม่สำเร็จ!' : 'อัปเดตข้อมูลช่างเรียบร้อย!',
      `ช่าง${saved.nickname} (${saved.name}) พร้อมให้บริการในระบบ`,
      'success',
      true
    );
  };

  const handleConfirmDeleteBarber = () => {
    if (!deletingBarberId) return;
    const targetBarber = barbers.find((b) => b.id === deletingBarberId);
    onDeleteBarber(deletingBarberId);
    setDeletingBarberId(null);
    showToast(
      'ลบข้อมูลช่างเรียบร้อย',
      targetBarber ? `ลบช่าง${targetBarber.nickname} ออกจากระบบแล้ว` : undefined,
      'info'
    );
  };

  // Service Actions
  const handleOpenAddService = () => {
    setEditingService({
      name: '',
      category: 'HAIRCUT',
      price: 350,
      durationMinutes: 45,
      description: '',
      stock: undefined,
      isActive: true,
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: ServiceItem) => {
    setEditingService({ ...s });
    setIsServiceModalOpen(true);
  };

  const handleSaveServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService.name || !editingService.price) return;

    const isNew = !editingService.id;
    const saved: ServiceItem = {
      id: editingService.id || `srv-${Date.now()}`,
      name: editingService.name.trim(),
      category: editingService.category || 'HAIRCUT',
      price: Number(editingService.price) || 0,
      durationMinutes: Number(editingService.durationMinutes) || 30,
      description: editingService.description?.trim() || '',
      stock: editingService.category === 'PRODUCT' ? Number(editingService.stock) || 0 : undefined,
      isActive: editingService.isActive ?? true,
    };

    onSaveService(saved);
    setIsServiceModalOpen(false);
    showToast(
      isNew ? 'เพิ่มรายการบริการใหม่สำเร็จ!' : 'แก้ไขรายการบริการเรียบร้อย!',
      `${saved.name} - ราคา ${formatCurrency(saved.price)}`,
      'success',
      true
    );
  };

  const handleConfirmDeleteService = () => {
    if (!deletingServiceId) return;
    const targetService = services.find((s) => s.id === deletingServiceId);
    onDeleteService(deletingServiceId);
    setDeletingServiceId(null);
    showToast(
      'ลบรายการบริการเรียบร้อย',
      targetService ? `ลบ "${targetService.name}" ออกจากเมนูแล้ว` : undefined,
      'info'
    );
  };

  const handleExecuteFactoryReset = () => {
    onResetFactoryData();
    setIsResetModalOpen(false);
    showToast(
      'รีเซ็ตระบบกลับสู่ค่าเริ่มต้นสำเร็จ!',
      'คืนค่าข้อมูลตัวอย่างตั้งต้นของร้าน ช่าง และบริการทั้งหมดเรียบร้อยแล้ว',
      'success',
      true
    );
  };

  return (
    <div className="space-y-4 relative">
      {/* Dynamic Floating Toast Notifications with Animations */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
                toast.type === 'warning'
                  ? 'bg-amber-950/90 text-amber-200 border-amber-500/50 shadow-amber-950/40'
                  : toast.type === 'info'
                  ? 'bg-stone-900/95 text-stone-200 border-stone-700 shadow-stone-950/40'
                  : 'bg-stone-900/95 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                  toast.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : toast.type === 'info'
                    ? 'bg-stone-700 text-stone-300'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {toast.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : toast.type === 'info' ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-white">
                  <span>{toast.title}</span>
                  {toast.type === 'success' && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                {toast.description && (
                  <p className="text-[11px] text-stone-300 mt-0.5 leading-snug break-words">
                    {toast.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition hover:bg-stone-800 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 font-black flex items-center justify-center text-xl shadow-xs shrink-0">
            ⚙️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              ตั้งค่าระบบร้าน & ข้อมูลช่าง (BARBERSHOP SETTINGS)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              จัดการข้อมูลชื่อร้าน โลโก้ ค่าคอมมิชชั่นรวม รายชื่อช่าง และรหัส PIN
            </p>
          </div>
        </div>

        {/* Sub-tab Switchers with tactile press feedback */}
        <div className="flex items-center bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {[
            { id: 'STORE', label: '💈 ข้อมูลร้าน & โลโก้', icon: <Store className="w-3.5 h-3.5" /> },
            { id: 'BARBERS', label: '✂️ ช่าง & คอมมิชชั่นรวม', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'SERVICES', label: '🏷️ เมนูบริการ & สต็อก', icon: <Scissors className="w-3.5 h-3.5" /> },
            { id: 'SYSTEM', label: '🔒 รหัส PIN & รีเซ็ต', icon: <Shield className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: STORE & LOGO SETTINGS ONLY (ชื่อร้าน กับ อัพโหลดโลโก้ เท่านั้น) */}
      {activeTab === 'STORE' && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveStore}
          className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 max-w-3xl"
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="space-y-1">
              <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-700" />
                <span>ข้อมูลร้านค้าและโลโก้ร้าน (Store Profile & Logo)</span>
              </h3>
              <p className="text-xs text-stone-500">
                กำหนดชื่อร้านค้าและอัปโหลดภาพโลโก้ประจำร้านเพื่อแสดงบนหัวแอปและใบเสร็จ
              </p>
            </div>
          </div>

          {/* 1. Store Logo Upload Area */}
          <div className="space-y-3 bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>1. โลโก้ร้านค้า (Store Logo)</span>
              </label>
              <span className="text-[11px] text-stone-500 font-medium">
                ขนาดแนะนำ: สี่เหลี่ยมจัตุรัส (1:1) สูงสุด 3MB
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 bg-white border-2 border-dashed border-stone-300 rounded-2xl p-5 hover:border-amber-400 transition-colors">
              {/* Preview Avatar Box */}
              {formData.logoUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={formData.logoUrl}
                    alt="Store Logo"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-stone-50"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2.5 -right-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 shadow-lg transition-all active:scale-90 cursor-pointer"
                    title="ลบรูปโลโก้"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-amber-50/80 border-2 border-dashed border-amber-300/80 flex flex-col items-center justify-center text-amber-800 shrink-0 shadow-inner">
                  <ImageIcon className="w-8 h-8 stroke-[1.5] text-amber-600" />
                  <span className="text-[10px] font-bold mt-1 text-amber-700">ไม่มีโลโก้</span>
                </div>
              )}

              {/* Upload & Remove Controls */}
              <div className="space-y-2.5 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 active:bg-amber-600 text-stone-950 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>{formData.logoUrl ? 'เปลี่ยนรูปภาพโลโก้' : 'อัปโหลดภาพโลโก้ร้าน'}</span>
                  </label>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 active:scale-95 text-stone-700 hover:text-rose-600 border border-stone-200 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      ลบโลโก้
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  รองรับไฟล์รูปภาพ PNG, JPG, JPEG, GIF หรือ WebP รูปภาพจะถูกปรับและแสดงผลอัตโนมัติบนหัวแอป
                </p>
              </div>
            </div>
          </div>

          {/* 2. Store Name Input Only */}
          <div className="space-y-2 bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5">
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-600" />
                <span>2. ชื่อร้านซาลอน / บาร์เบอร์ (Store Name)</span>
                <span className="text-rose-500 font-black">*</span>
              </span>
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="เช่น THE FAH BARBER & SALON"
              className="w-full bg-white border border-stone-300 focus:border-amber-500 focus:ring-3 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm sm:text-base font-black text-stone-900 focus:outline-none transition-all placeholder:text-stone-400"
            />
            <p className="text-[11px] text-stone-500">
              ชื่อร้านจะแสดงบนแถบเมนูด้านบน หัวสลิปเงินเดือน และใบเสร็จรับเงิน
            </p>
          </div>

          {/* 3. Brand Color Setting (ธีมสีประจำร้าน & CSS Variables) */}
          <div className="space-y-4 bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-black shadow-xs"
                  style={{
                    backgroundColor: formData.brandColor || DEFAULT_BRAND_COLOR,
                    color: '#ffffff',
                  }}
                >
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span>3. ธีมสีประจำร้าน (Brand Color & Themes)</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </label>
                  <p className="text-[11px] text-stone-500">
                    เลือกสีเอกลักษณ์ของร้านเพื่อปรับเปลี่ยน CSS Variables ของปุ่ม แถบ Header และส่วนประกอบหลักทั่วทั้งระบบ
                  </p>
                </div>
              </div>

              {/* Active Color Badge */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                <span 
                  className="w-4 h-4 rounded-full shadow-xs shrink-0" 
                  style={{ backgroundColor: formData.brandColor || DEFAULT_BRAND_COLOR }}
                />
                <span className="font-mono text-xs font-black text-stone-800 uppercase">
                  {formData.brandColor || DEFAULT_BRAND_COLOR}
                </span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-stone-600 block">
                🎨 ชุดสียอดนิยมสำหรับร้านบาร์เบอร์และซาลอน (Preset Palettes):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {BRAND_COLOR_PRESETS.map((preset) => {
                  const isSelected = (formData.brandColor || DEFAULT_BRAND_COLOR).toUpperCase() === preset.hex.toUpperCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, brandColor: preset.hex };
                        setFormData(updated);
                        applyBrandTheme(preset.hex, formData.brandHeaderStyle || 'light');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col gap-2 relative active:scale-95 ${
                        isSelected
                          ? 'bg-white border-stone-900 shadow-md ring-2 ring-stone-900/10'
                          : 'bg-white/80 hover:bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-7 h-7 rounded-xl shadow-xs flex items-center justify-center text-xs font-black shrink-0 transition-transform"
                          style={{
                            backgroundColor: preset.hex,
                            color: '#ffffff',
                          }}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : preset.badgeEmoji}
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-stone-900 text-white uppercase">
                            เลือกอยู่
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {preset.name}
                        </div>
                        <div className="font-mono text-[10px] text-stone-400 font-semibold">
                          {preset.hex}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Color Picker */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    id="brand-color-picker"
                    value={formData.brandColor || DEFAULT_BRAND_COLOR}
                    onChange={(e) => {
                      const color = e.target.value;
                      const updated = { ...formData, brandColor: color };
                      setFormData(updated);
                      applyBrandTheme(color, formData.brandHeaderStyle || 'light');
                    }}
                    className="w-11 h-11 rounded-xl cursor-pointer border-2 border-stone-200 p-0.5 bg-white shadow-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="brand-color-picker" className="text-xs font-black text-stone-800 flex items-center gap-1.5 cursor-pointer">
                    <Paintbrush className="w-3.5 h-3.5 text-stone-500" />
                    <span>เลือกสีกำหนดเอง (Custom HEX Color Picker)</span>
                  </label>
                  <p className="text-[11px] text-stone-400">
                    คลิกเพื่อเปิดตารางจานสี หรือพิมพ์รหัสโค้ดสี HEX ที่ต้องการ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-stone-400 font-mono">HEX:</span>
                <input
                  type="text"
                  maxLength={7}
                  value={formData.brandColor || DEFAULT_BRAND_COLOR}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('#')) val = '#' + val;
                    const updated = { ...formData, brandColor: val };
                    setFormData(updated);
                    if (/^#[0-9A-F]{6}$/i.test(val)) {
                      applyBrandTheme(val, formData.brandHeaderStyle || 'light');
                    }
                  }}
                  className="w-28 bg-stone-50 border border-stone-300 focus:border-stone-900 rounded-xl px-3 py-2 text-xs font-mono font-black text-stone-900 uppercase focus:outline-none"
                  placeholder="#D97706"
                />
              </div>
            </div>

            {/* Header Style Mode Selection */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <span>🖼️ สไตล์พื้นหลังแถบ Header ด้านบน (Header Styling):</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const updated: StoreSettings = { ...formData, brandHeaderStyle: 'light' };
                    setFormData(updated);
                    applyBrandTheme(formData.brandColor, 'light');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    (formData.brandHeaderStyle || 'light') === 'light'
                      ? 'bg-stone-50 border-stone-900 ring-2 ring-stone-900/10 shadow-xs'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-300 shadow-2xs flex items-center justify-center text-xs">
                    ☀️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-stone-900">
                      พื้นหลังสีขาวโมเดิร์น (Clean Light with Brand Accent)
                    </div>
                    <div className="text-[10px] text-stone-500">
                      แถบเมนูสีขาว สะอาดตา เน้นปุ่มและแท็บตามสีแบรนด์
                    </div>
                  </div>
                  {(formData.brandHeaderStyle || 'light') === 'light' && (
                    <Check className="w-4 h-4 text-stone-900 stroke-[3]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updated: StoreSettings = { ...formData, brandHeaderStyle: 'brand' };
                    setFormData(updated);
                    applyBrandTheme(formData.brandColor, 'brand');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    formData.brandHeaderStyle === 'brand'
                      ? 'bg-stone-50 border-stone-900 ring-2 ring-stone-900/10 shadow-xs'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg shadow-2xs flex items-center justify-center text-xs text-white"
                    style={{ backgroundColor: formData.brandColor || DEFAULT_BRAND_COLOR }}
                  >
                    👑
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-stone-900">
                      พื้นหลังสีแบรนด์เต็มรูปแบบ (Full Brand Banner)
                    </div>
                    <div className="text-[10px] text-stone-500">
                      เปลี่ยนสีแถบหัวข้อด้านบนทั้งหมดให้เป็นสีประจำร้าน
                    </div>
                  </div>
                  {formData.brandHeaderStyle === 'brand' && (
                    <Check className="w-4 h-4 text-stone-900 stroke-[3]" />
                  )}
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="bg-stone-100/80 border border-stone-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">
                  <span>👀 ตัวอย่างการแสดงผลจริง (Live Branding Preview):</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  CSS Variables: --brand-primary, --btn-primary-bg
                </span>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-2xs flex flex-wrap items-center gap-3">
                {/* Sample Button */}
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-default transition-all"
                  style={{
                    backgroundColor: formData.brandColor || DEFAULT_BRAND_COLOR,
                    color: '#ffffff',
                  }}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>ปุ่มหลักของร้าน (Primary Button)</span>
                </button>

                {/* Sample Badge */}
                <span
                  className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1"
                  style={{
                    backgroundColor: `rgba(${formData.brandColor ? parseInt(formData.brandColor.slice(1,3), 16) || 217 : 217}, ${formData.brandColor ? parseInt(formData.brandColor.slice(3,5), 16) || 119 : 119}, ${formData.brandColor ? parseInt(formData.brandColor.slice(5,7), 16) || 6 : 6}, 0.15)`,
                    color: formData.brandColor || DEFAULT_BRAND_COLOR,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>ป้ายกำกับร้าน (Store Badge)</span>
                </span>

                {/* Sample Tag */}
                <span
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold border"
                  style={{
                    borderColor: formData.brandColor || DEFAULT_BRAND_COLOR,
                    color: formData.brandColor || DEFAULT_BRAND_COLOR,
                  }}
                >
                  💈 {formData.storeName || 'BARBERSHOP'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Save Button with Tactile Feedback & Effect */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSavingStore}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 active:translate-y-0.5 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {isSavingStore ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>บันทึกข้อมูลร้านค้า</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}

      {/* TAB 2: BARBERS & GLOBAL COMMISSION */}
      {activeTab === 'BARBERS' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Global Commission Rates Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-stone-50 border-2 border-amber-300/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-sm">
                    ⚡ อัตราค่าคอมมิชชั่นรวมของร้าน (Store-wide Commission Rates)
                  </h3>
                  <p className="text-xs text-stone-500">
                    กำหนดอัตราส่วนแบ่งคอมมิชชั่นแบบรวมทั้งร้าน แยกตามประเภทงานบริการและสินค้า (คำนวณเหมือนกันทุกช่าง)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveCommissions}
                disabled={isSavingCommissions}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 active:translate-y-0.5 text-amber-300 text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-75"
              >
                {isSavingCommissions ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                    <span>บันทึกอัตราคอมมิชชั่นรวม</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Haircut Commission */}
              <div className="bg-white border border-amber-200 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>✂️</span>
                    <span>ค่าคอมตัดผม (% Haircut)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">%</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.haircutCommissionRate ?? 50}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        haircutCommissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-amber-50/50 border border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 text-base font-black text-stone-900 font-mono focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700">
                    %
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 block">
                  ตัวอย่าง: ตัด 350฿ ได้ค่าคอม {Math.round(350 * ((formData.haircutCommissionRate ?? 50) / 100))}฿
                </span>
              </div>

              {/* 2. Chemical Commission */}
              <div className="bg-white border border-amber-200 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🧪</span>
                    <span>ค่าคอมเคมี (% Chemical)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">%</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.chemicalCommissionRate ?? 40}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        chemicalCommissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-amber-50/50 border border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 text-base font-black text-stone-900 font-mono focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700">
                    %
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 block">
                  ตัวอย่าง: ดัด 1,500฿ ได้ค่าคอม {Math.round(1500 * ((formData.chemicalCommissionRate ?? 40) / 100))}฿
                </span>
              </div>

              {/* 3. Product Commission */}
              <div className="bg-white border border-amber-200 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🧴</span>
                    <span>ค่าคอมขายสินค้า (% Product)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">%</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.productCommissionRate ?? 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productCommissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-amber-50/50 border border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 text-base font-black text-stone-900 font-mono focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700">
                    %
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 block">
                  ตัวอย่าง: ขายแว็กซ์ 350฿ ได้ค่าคอม {Math.round(350 * ((formData.productCommissionRate ?? 10) / 100))}฿
                </span>
              </div>
            </div>
          </div>

          {/* Barbers List */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span>รายชื่อช่างตัดผมในร้าน</span>
                </h3>
                <p className="text-xs text-stone-500">
                  จัดการข้อมูลช่าง และกำหนดเงินเดือนฐาน
                </p>
              </div>

              <button
                onClick={handleOpenAddBarber}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300 text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
                <span>+ เพิ่มช่างใหม่</span>
              </button>
            </div>

            {barbers.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-2xl space-y-2">
                <Users className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-bold text-stone-600">ยังไม่มีรายชื่อช่างในระบบ</p>
                <p className="text-[11px] text-stone-400">กดปุ่ม "+ เพิ่มช่างใหม่" ด้านบนเพื่อเพิ่มช่างคนแรกของร้าน</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {barbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 hover:border-amber-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shadow-2xs">
                          {barber.nickname?.slice(0, 2) || barber.name.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-stone-900">{barber.name}</h4>
                          <span className="text-[11px] text-amber-900 font-bold block">
                            (ช่าง{barber.nickname})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditBarber(barber)}
                          className="p-1.5 rounded-lg bg-white hover:bg-stone-200 active:scale-90 border border-stone-200 text-stone-700 transition-all cursor-pointer"
                          title="แก้ไขข้อมูลช่าง"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingBarberId(barber.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-90 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                          title="ลบช่าง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between">
                      <span className="text-stone-500 font-bold">เงินเดือนฐาน:</span>
                      <strong className="text-stone-900 font-mono text-xs font-black">
                        {formatCurrency(barber.baseSalary || 0)} / เดือน
                      </strong>
                    </div>

                    <div className="text-[11px] text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/60 flex items-center justify-between">
                      <span>⚡ คอมมิชชั่นรวม:</span>
                      <span className="font-bold font-mono">
                        ตัด {formData.haircutCommissionRate ?? 50}% | เคมี {formData.chemicalCommissionRate ?? 40}% | สินค้า {formData.productCommissionRate ?? 10}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 3: SERVICES & STOCK */}
      {activeTab === 'SERVICES' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-700" />
                <span>เมนูบริการและสต็อกสินค้าหน้าร้าน</span>
              </h3>
              <p className="text-xs text-stone-500">จัดการราคาตัดผม เคมี และสต็อกสินค้า</p>
            </div>

            <button
              onClick={handleOpenAddService}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300 text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
              <span>+ เพิ่มรายการใหม่</span>
            </button>
          </div>

          {services.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-2xl space-y-2">
              <Scissors className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-600">ยังไม่มีรายการบริการหรือสินค้าในระบบ</p>
              <p className="text-[11px] text-stone-400">กดปุ่ม "+ เพิ่มรายการใหม่" ด้านบนเพื่อเพิ่มบริการตัดผม เคมี หรือสินค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex items-start justify-between gap-3 hover:border-amber-300 transition-all shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-stone-900">{srv.name}</span>
                    </div>
                    <span className="text-[11px] text-stone-500 block">
                      หมวด: {srv.category === 'HAIRCUT' ? 'ตัดผม' : srv.category === 'CHEMICAL' ? 'เคมี' : 'สินค้า'} • {srv.durationMinutes} นาที
                    </span>
                    {srv.category === 'PRODUCT' && (
                      <span className="text-[11px] text-emerald-700 font-bold block">
                        คงเหลือในสต็อก: {srv.stock ?? 0} ชิ้น
                      </span>
                    )}
                    <span className="text-sm font-black text-amber-900 font-mono block">
                      {formatCurrency(srv.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditService(srv)}
                      className="p-1.5 rounded-lg bg-white hover:bg-stone-200 active:scale-90 border border-stone-200 text-stone-700 transition-all cursor-pointer"
                      title="แก้ไขบริการ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingServiceId(srv.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-90 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                      title="ลบบริการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 4: SYSTEM PIN & FACTORY RESET */}
      {activeTab === 'SYSTEM' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6 max-w-2xl"
        >
          {/* Admin PIN Configuration */}
          <div className="space-y-3">
            <h3 className="font-black text-stone-900 text-sm flex items-center gap-2 pb-2 border-b border-stone-100">
              <KeyRound className="w-4 h-4 text-amber-700" />
              <span>รหัส PIN สำหรับความปลอดภัยของเจ้าของร้าน</span>
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                รหัส PIN ลับ 4-6 หลัก (ใช้ในการเข้าถึงเมนูตั้งค่าและแก้ไขข้อมูลสำคัญ):
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  maxLength={6}
                  value={formData.adminPin || '1234'}
                  onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                  className="w-36 bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2.5 text-center text-lg font-black tracking-widest text-amber-900 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSavePin}
                  disabled={isSavingPin}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-75"
                >
                  {isSavingPin ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-amber-400" />
                      <span>บันทึก PIN</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Factory Reset Section */}
          <div className="pt-5 border-t border-stone-100 space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <RotateCcw className="w-5 h-5" />
              <h3 className="font-black text-sm">
                รีเซ็ตข้อมูลระบบกลับเป็นค่าเริ่มต้นโรงงาน (Factory Reset)
              </h3>
            </div>
            
            <p className="text-xs text-stone-600 leading-relaxed">
              การรีเซ็ตจะล้างข้อมูลที่บันทึกไว้ในเบราว์เซอร์ และคืนค่าข้อมูลตัวอย่างตั้งต้นของร้าน ช่างตัดผม เมนูบริการ และประวัติรายการทั้งหมด
            </p>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>รีเซ็ตข้อมูลเป็นค่าเริ่มต้นโรงงาน</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* CONFIRMATION MODAL: FACTORY RESET */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-stone-900">
                ยืนยันการรีเซ็ตข้อมูลโรงงาน?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดในระบบกลับสู่ค่าเริ่มต้น? ข้อมูลบิลขาย รายจ่าย และยอดสมาชิกที่บันทึกไว้จะถูกรีเซ็ต
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs font-bold transition-all cursor-pointer flex-1"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteFactoryReset}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition-all cursor-pointer shadow-md flex-1"
              >
                ยืนยันรีเซ็ตข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barber Create/Edit Modal */}
      {isBarberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-900 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-700" />
                <span>{editingBarber.id ? 'แก้ไขข้อมูลช่าง' : 'เพิ่มช่างตัดผมใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsBarberModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBarberSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ชื่อ-นามสกุลจริง</label>
                <input
                  type="text"
                  required
                  value={editingBarber.name || ''}
                  onChange={(e) => setEditingBarber({ ...editingBarber, name: e.target.value })}
                  placeholder="เช่น ชานนท์ สุขเกษม"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ชื่อเล่น (เรียกหน้าร้าน)</label>
                  <input
                    type="text"
                    required
                    value={editingBarber.nickname || ''}
                    onChange={(e) => setEditingBarber({ ...editingBarber, nickname: e.target.value })}
                    placeholder="เช่น นนท์"
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">เบอร์โทร</label>
                  <input
                    type="text"
                    value={editingBarber.phone || ''}
                    onChange={(e) => setEditingBarber({ ...editingBarber, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  เงินเดือนฐาน (บาท / เดือน)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 font-mono">฿</span>
                  <input
                    type="number"
                    min="0"
                    value={editingBarber.baseSalary === undefined || editingBarber.baseSalary === 0 ? '' : editingBarber.baseSalary}
                    onChange={(e) => setEditingBarber({ ...editingBarber, baseSalary: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    placeholder="กรอกฐานเงินเดือน (หากไม่มีปล่อยว่างไว้ได้)"
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  * หากไม่มีเงินเดือนประจำ (รับเฉพาะค่าคอมมิชชั่นตามผลงาน) ให้ปล่อยว่างไว้ได้เลยครับ
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <span className="font-bold block">ℹ️ อัตราค่าคอมมิชชั่น:</span>
                <span>
                  ช่างทุกคนใช้ส่วนแบ่งคอมมิชชั่นรวมของร้าน (ตัดผม {formData.haircutCommissionRate ?? 50}%, เคมี {formData.chemicalCommissionRate ?? 40}%, ขายสินค้า {formData.productCommissionRate ?? 10}%)
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs font-bold transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300 text-xs font-black shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>บันทึกข้อมูลช่าง</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Create/Edit Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-900 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-700" />
                <span>{editingService.id ? 'แก้ไขรายการบริการ' : 'เพิ่มรายการบริการใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ชื่อรายการ</label>
                <input
                  type="text"
                  required
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="เช่น ตัดผมชายสไตล์วินเทจ"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">หมวดหมู่</label>
                  <select
                    value={editingService.category || 'HAIRCUT'}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value as ServiceCategory })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  >
                    <option value="HAIRCUT">✂️ งานตัดผม (HAIRCUT)</option>
                    <option value="CHEMICAL">🧪 งานเคมี/ดัด/ทำสี (CHEMICAL)</option>
                    <option value="PRODUCT">🧴 สินค้าหน้าร้าน (PRODUCT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingService.price || 0}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-amber-900 font-mono font-bold"
                  />
                </div>
              </div>

              {editingService.category === 'PRODUCT' ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">จำนวนคงเหลือในสต็อก (ชิ้น)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingService.stock || 0}
                    onChange={(e) => setEditingService({ ...editingService, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 font-mono font-bold"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ระยะเวลาโดยประมาณ (นาที)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={editingService.durationMinutes || 30}
                    onChange={(e) => setEditingService({ ...editingService, durationMinutes: parseInt(e.target.value, 10) || 30 })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs font-bold transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300 text-xs font-black shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>บันทึกรายการ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Barber Confirmation Modal */}
      {deletingBarberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-stone-900 space-y-4">
            <h3 className="text-sm font-black text-stone-900">ยืนยันการลบข้อมูลช่าง?</h3>
            <p className="text-xs text-stone-500">
              คุณต้องการลบข้อมูลช่างท่านนี้ออกจากระบบใช่หรือไม่? ประวัติการทำงานในอดีตจะยังคงอยู่
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBarberId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 active:scale-95 text-stone-700 text-xs font-bold transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDeleteBarber}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all"
              >
                ลบช่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
      {deletingServiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-stone-900 space-y-4">
            <h3 className="text-sm font-black text-stone-900">ยืนยันการลบรายการบริการ?</h3>
            <p className="text-xs text-stone-500">
              คุณต้องการลบรายการนี้ออกจากเมนูหรือไม่?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingServiceId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 active:scale-95 text-stone-700 text-xs font-bold transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDeleteService}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all"
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
