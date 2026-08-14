import React, { useState } from 'react';
import { 
  Bill, 
  Member, 
  PackageTemplate, 
  ServiceItem, 
  StoreSettings 
} from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Sparkles, 
  Phone, 
  User, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  CreditCard,
  Palette,
  ShieldCheck,
  Zap,
  Filter,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatThaiDate } from '../../utils/formatters';
import { PACKAGE_COLOR_PALETTES, getPackageColorConfig } from '../../utils/packageColors';
import { PackageManagementModal } from './PackageManagementModal';
import { TopUpMemberPackageModal } from './TopUpMemberPackageModal';

interface MembersViewProps {
  members: Member[];
  onSaveMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  packageTemplates: PackageTemplate[];
  onSavePackageTemplate: (pkg: PackageTemplate) => void;
  onDeletePackageTemplate: (pkgId: string) => void;
  services: ServiceItem[];
  bills: Bill[];
  settings: StoreSettings;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  onSaveMember,
  onDeleteMember,
  packageTemplates,
  onSavePackageTemplate,
  onDeletePackageTemplate,
  services,
  bills,
  settings,
}) => {
  // Active Main Tab: 'PACKAGES' (แพ็กเกจสีสัน) | 'MEMBERS_LIST' (กดดู รายการสมาชิก)
  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'MEMBERS_LIST'>('PACKAGES');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member>>({});
  const [isPackageMgmtModalOpen, setIsPackageMgmtModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpTargetMemberId, setTopUpTargetMemberId] = useState<string | undefined>();
  const [topUpTargetPackageId, setTopUpTargetPackageId] = useState<string | undefined>();
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // Filter members list
  const filteredMembers = members.filter((m) => {
    if (selectedLevelFilter !== 'ALL') {
      const memLevel = (m.packageLevel || m.tier || '').toLowerCase();
      if (!memLevel.includes(selectedLevelFilter.toLowerCase())) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      m.phone.includes(q) ||
      (m.packageLevel && m.packageLevel.toLowerCase().includes(q))
    );
  });

  // Calculate stats
  const totalMembers = members.length;
  const totalBalanceInSystem = members.reduce((sum, m) => sum + (m.balance || 0), 0);
  const activePackagesCount = packageTemplates.length;

  // Handle Open Create Member
  const handleOpenAddMember = () => {
    setEditingMember({
      name: '',
      nickname: '',
      phone: '',
      gender: 'M',
      packageLevel: packageTemplates[0]?.level || 'Silver',
      balance: 0,
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Open Edit Member
  const handleOpenEditMember = (member: Member) => {
    setEditingMember({
      ...member,
      packageLevel: member.packageLevel || 'Silver',
      balance: member.balance || 0,
    });
    setIsEditModalOpen(true);
  };

  // Save Member
  const handleSaveMemberForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember.name?.trim() || !editingMember.phone?.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์');
      return;
    }

    const isNew = !editingMember.id;
    const memberToSave: Member = {
      id: editingMember.id || `mem-${Date.now()}`,
      name: editingMember.name.trim(),
      nickname: editingMember.nickname?.trim() || undefined,
      phone: editingMember.phone.trim(),
      birthday: editingMember.birthday || undefined,
      gender: editingMember.gender || 'M',
      tier: (editingMember.packageLevel?.toUpperCase().includes('PLATINUM') ? 'PLATINUM' : editingMember.packageLevel?.toUpperCase().includes('GOLD') ? 'VIP_GOLD' : 'SILVER'),
      packageLevel: editingMember.packageLevel?.trim() || 'Silver',
      balance: typeof editingMember.balance === 'number' ? editingMember.balance : parseFloat(String(editingMember.balance)) || 0,
      points: editingMember.points || 0,
      totalSpent: editingMember.totalSpent || 0,
      visitCount: editingMember.visitCount || 0,
      notes: editingMember.notes?.trim() || undefined,
      createdAt: editingMember.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      packages: editingMember.packages || [],
    };

    onSaveMember(memberToSave);
    setIsEditModalOpen(false);
  };

  // Confirm Delete Member
  const handleConfirmDelete = () => {
    if (deletingMember) {
      onDeleteMember(deletingMember.id);
      setDeletingMember(null);
    }
  };

  // Top Up Member Package Handler
  const handleConfirmTopUp = (
    member: Member,
    pkg: PackageTemplate,
    paymentMethod: any
  ) => {
    const currentBalance = member.balance || 0;
    const addedValue = pkg.receivedValue;
    const newBalance = currentBalance + addedValue;

    const updatedMember: Member = {
      ...member,
      packageLevel: pkg.level || member.packageLevel || 'Gold',
      balance: newBalance,
      totalSpent: (member.totalSpent || 0) + pkg.price,
      updatedAt: new Date().toISOString(),
    };

    onSaveMember(updatedMember);

    // Optional toast alert
    alert(`🎉 เติมแพ็กเกจ ${pkg.name} สำเร็จ!\nสมาชิก: ${member.name}\nเติมยอด: +฿${pkg.receivedValue.toLocaleString()}\nยอดคงเหลือใหม่: ฿${newBalance.toLocaleString()}`);
  };

  // Quick Open Top Up for a specific member
  const handleTopUpForMember = (member: Member) => {
    setTopUpTargetMemberId(member.id);
    setTopUpTargetPackageId(undefined);
    setIsTopUpModalOpen(true);
  };

  // Quick Open Top Up for a specific package
  const handleTopUpForPackage = (pkg: PackageTemplate) => {
    setTopUpTargetPackageId(pkg.id);
    setTopUpTargetMemberId(undefined);
    setIsTopUpModalOpen(true);
  };

  // Unique Levels for filter
  const availableLevels = Array.from(
    new Set([
      ...packageTemplates.map((p) => p.level).filter(Boolean),
      ...members.map((m) => m.packageLevel).filter(Boolean),
    ])
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Tab Navigation Switcher */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-2xl shadow-xs shrink-0">
            💎
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              ระบบสมาชิก & แพ็กเกจเติมเงิน (MEMBER PACKAGES)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              แพ็กเกจสีสันแยกตามระดับ • หักยอดสมาชิกอัตโนมัติ • รายการสมาชิกพร้อมแก้ไขและลบ
            </p>
          </div>
        </div>

        {/* Big Tab Toggle: [ 💎 แพ็กเกจสมาชิก ] vs [ 📋 กดดู รายการสมาชิก ] */}
        <div className="flex items-center gap-2 w-full md:w-auto bg-stone-100 p-1.5 rounded-2xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('PACKAGES')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'PACKAGES'
                ? 'bg-stone-900 text-amber-300 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>💎 แพ็กเกจสมาชิก ({packageTemplates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEMBERS_LIST')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'MEMBERS_LIST'
                ? 'bg-stone-900 text-amber-300 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>📋 กดดู รายการสมาชิก ({members.length})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-stone-400 font-bold block uppercase tracking-wider">
            สมาชิกทั้งหมด
          </span>
          <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-0.5 block">
            {totalMembers} <span className="text-xs font-sans text-stone-500 font-normal">คน</span>
          </span>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-emerald-800 font-bold block uppercase tracking-wider">
            💰 ยอดเงินคงเหลือรวมในระบบ
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-0.5 block">
            {formatCurrency(totalBalanceInSystem)}
          </span>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-amber-800 font-bold block uppercase tracking-wider">
            🎨 แพ็กเกจที่เปิดใช้งาน
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono mt-0.5 block">
            {activePackagesCount} <span className="text-xs font-sans text-amber-800 font-normal">แพ็ก</span>
          </span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-purple-800 font-bold block uppercase tracking-wider">
            ⚡ สมาชิกระดับ VIP / Gold
          </span>
          <span className="text-xl sm:text-2xl font-black text-purple-950 font-mono mt-0.5 block">
            {members.filter((m) => (m.packageLevel || '').toLowerCase().includes('gold') || (m.packageLevel || '').toLowerCase().includes('vip') || (m.packageLevel || '').toLowerCase().includes('plat')).length} <span className="text-xs font-sans text-purple-800 font-normal">คน</span>
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 💎 แพ็กเกจสมาชิกแยกสีสัน (COLORFUL PACKAGE CARDS) */}
      {/* ======================================================== */}
      {activeTab === 'PACKAGES' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>แพ็กเกจสมาชิกแยกตามสีสัน & ระดับ</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                แต่ละแพ็กเกจแสดง: ระดับไหน • ข้อมูลแพ็กเกจ • ราคาที่จ่าย • ราคาที่ได้รับ (เครดิตเติมเงิน)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTopUpTargetMemberId(undefined);
                  setTopUpTargetPackageId(undefined);
                  setIsTopUpModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>+ เติมแพ็กเกจให้สมาชิก</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPackageMgmtModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>จัดการ / เพิ่มแพ็กเกจ</span>
              </button>
            </div>
          </div>

          {/* COLORFUL PACKAGE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {packageTemplates.map((pkg) => {
              const pColor = getPackageColorConfig(pkg.colorTheme || pkg.level);
              const bonusValue = Math.max(0, pkg.receivedValue - pkg.price);

              return (
                <div
                  key={pkg.id}
                  className={`rounded-3xl border-2 p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between relative overflow-hidden ${pColor.cardBg} ${pColor.cardBorder} ${pColor.cardHoverBorder}`}
                >
                  {/* Decorative background circle */}
                  <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${pColor.dotColor} opacity-10 pointer-events-none`} />

                  <div className="space-y-3 relative z-10">
                    {/* 1. ระดับไหน (Level Badge) */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full border shadow-2xs ${pColor.badgeBg} ${pColor.badgeText} ${pColor.badgeBorder}`}
                      >
                        ⭐ ระดับ: {pkg.level || 'Silver'}
                      </span>

                      <span className="text-[11px] font-bold text-stone-400 bg-white/80 px-2 py-0.5 rounded-md border border-stone-200/60">
                        {pColor.name.split('/')[0]}
                      </span>
                    </div>

                    {/* 2. ข้อมูลแพ็กเกจ (Package Info & Description) */}
                    <div>
                      <h4 className="text-base font-black text-stone-900 tracking-tight">
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed min-h-[36px]">
                        {pkg.description || 'แพ็กเกจเติมเงินสุดคุ้ม ใช้ได้กับทุกบริการและสินค้าในร้าน'}
                      </p>
                    </div>

                    {/* 3. ราคาที่จ่าย & 4. ราคาที่ได้รับ */}
                    <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border border-stone-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold block">
                            💳 ราคาที่จ่าย
                          </span>
                          <strong className="text-sm font-black text-stone-800 font-mono">
                            {formatCurrency(pkg.price)}
                          </strong>
                        </div>

                        <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />

                        <div className="text-right">
                          <span className="text-[10px] text-emerald-700 font-extrabold block">
                            🎁 ราคาที่ได้รับ
                          </span>
                          <strong className="text-base font-black text-emerald-800 font-mono">
                            {formatCurrency(pkg.receivedValue)}
                          </strong>
                        </div>
                      </div>

                      {bonusValue > 0 && (
                        <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                          <span className="text-amber-800 font-bold">โบนัสฟรีที่ได้รับเพิ่ม:</span>
                          <span className="font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.2 rounded-md">
                            +{formatCurrency(bonusValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button: Purchase / Top-up this package */}
                  <div className="mt-4 pt-3 border-t border-stone-200/60 relative z-10">
                    <button
                      type="button"
                      onClick={() => handleTopUpForPackage(pkg)}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5 ${pColor.accentBg} ${pColor.accentText} hover:opacity-90`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                      <span>⚡ เติมแพ็กเกจนี้ให้สมาชิก</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: 📋 กดดู รายการสมาชิก (MEMBER DIRECTORY TABLE & CARDS) */}
      {/* ======================================================== */}
      {activeTab === 'MEMBERS_LIST' && (
        <div className="space-y-4">
          {/* Search, Filter & Add Member Header */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>รายชื่อสมาชิกทั้งหมด (Member Directory)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  แสดง: ชื่อจริง-นามสกุล • เบอร์โทรศัพท์ • ชื่อเล่น • ระดับที่ซื้อแพ็กเกจ • จำนวนเงินคงเหลือ • แก้ไข & ลบได้
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddMember}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                  <span>+ เพิ่มสมาชิกใหม่</span>
                </button>
              </div>
            </div>

            {/* Search Bar and Level Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1">
              <div className="md:col-span-8 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อจริง-นามสกุล, ชื่อเล่น, เบอร์โทรศัพท์, หรือระดับ..."
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white text-stone-900 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedLevelFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
                    selectedLevelFilter === 'ALL'
                      ? 'bg-stone-900 text-amber-300 border-stone-900'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  ทั้งหมด ({members.length})
                </button>
                {availableLevels.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
                      selectedLevelFilter === lvl
                        ? 'bg-amber-500 text-stone-950 border-amber-500'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Members Table / List */}
          <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs">
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-sm font-bold text-stone-600">ไม่พบข้อมูลสมาชิกที่ค้นหา</p>
                <p className="text-xs text-stone-400">กดปุ่ม "+ เพิ่มสมาชิกใหม่" เพื่อบันทึกสมาชิกลงในระบบ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-black uppercase text-stone-500 tracking-wider">
                      <th className="py-3 px-4">ชื่อสมาชิก (ชื่อจริง - นามสกุล)</th>
                      <th className="py-3 px-3">ชื่อเล่น</th>
                      <th className="py-3 px-3">เบอร์โทรศัพท์</th>
                      <th className="py-3 px-3">ระดับที่ซื้อแพ็กเกจ</th>
                      <th className="py-3 px-4 text-right">จำนวนเงินคงเหลือ</th>
                      <th className="py-3 px-4 text-center">จัดการรายการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {filteredMembers.map((mem) => {
                      const pColor = getPackageColorConfig(mem.packageLevel);
                      return (
                        <tr key={mem.id} className="hover:bg-stone-50/60 transition group">
                          {/* 1. ชื่อสมาชิกคนนั้น (ชื่อจริงนามสกุล) */}
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 text-stone-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {mem.nickname?.slice(0, 2) || mem.name.slice(0, 1)}
                              </div>
                              <span className="text-stone-900 font-extrabold text-xs">
                                {mem.name}
                              </span>
                            </div>
                          </td>

                          {/* 2. ชื่อเล่น */}
                          <td className="py-3.5 px-3 text-stone-700 font-bold">
                            {mem.nickname ? (
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-xs">
                                {mem.nickname}
                              </span>
                            ) : (
                              <span className="text-stone-300">-</span>
                            )}
                          </td>

                          {/* 3. เบอร์โทรศัพท์ */}
                          <td className="py-3.5 px-3 text-stone-600 font-mono font-bold">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-amber-600" />
                              {mem.phone}
                            </span>
                          </td>

                          {/* 4. ระดับที่ซื้อแพ็กเกจ */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${pColor.badgeBg} ${pColor.badgeText} ${pColor.badgeBorder}`}
                            >
                              ⭐ {mem.packageLevel || 'Silver'}
                            </span>
                          </td>

                          {/* 5. จำนวนเงินคงเหลือ */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono font-black text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/70 inline-block">
                              {formatCurrency(mem.balance || 0)}
                            </span>
                          </td>

                          {/* 6. แก้ไข และ ลบได้ + เติมเงินด่วน */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick Top Up Button */}
                              <button
                                type="button"
                                onClick={() => handleTopUpForMember(mem)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-black transition cursor-pointer flex items-center gap-1"
                                title="เติมแพ็กเกจ / เติมเงิน"
                              >
                                <Zap className="w-3 h-3 text-amber-600 fill-current" />
                                <span>เติมเงิน</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditMember(mem)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                                title="แก้ไขข้อมูลสมาชิก"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeletingMember(mem)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                title="ลบสมาชิกนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT / CREATE MEMBER MODAL                      */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-stone-900">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black flex items-center justify-center text-lg shadow-xs">
                👤
              </div>
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  {editingMember.id ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
                </h3>
                <p className="text-xs text-stone-500">
                  ระบุชื่อ-นามสกุล ชื่อเล่น เบอร์โทร ระดับ และยอดเงินคงเหลือ
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveMemberForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  ชื่อ-นามสกุล (ชื่อจริง นามสกุล) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="เช่น คุณกานต์ พิริยะกุล"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ชื่อเล่น
                  </label>
                  <input
                    type="text"
                    value={editingMember.nickname || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, nickname: e.target.value })}
                    placeholder="เช่น กานต์"
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    placeholder="081-234-5678"
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold font-mono text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ระดับที่ซื้อแพ็กเกจ (Level)
                  </label>
                  <input
                    type="text"
                    value={editingMember.packageLevel || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, packageLevel: e.target.value })}
                    placeholder="เช่น Silver, Gold, Platinum, VIP"
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">
                    💰 จำนวนเงินคงเหลือ (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingMember.balance ?? 0}
                    onChange={(e) => setEditingMember({ ...editingMember, balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full bg-emerald-50 border border-emerald-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-black font-mono text-emerald-950 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  หมายเหตุ / บันทึกเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  value={editingMember.notes || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, notes: e.target.value })}
                  placeholder="เช่น ลูกค้าชอบตัดผมสไตล์วินเทจ รองทรงสูง..."
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-black transition shadow-xs cursor-pointer"
                >
                  บันทึกข้อมูลสมาชิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DELETE MEMBER CONFIRMATION                      */}
      {/* ======================================================== */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base">ยืนยันการลบสมาชิก?</h3>
              <p className="text-xs text-stone-500 mt-1">
                คุณต้องการลบ <strong>"{deletingMember.name}"</strong> (เบอร์: {deletingMember.phone}) ออกจากระบบหรือไม่?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer shadow-xs"
              >
                ลบสมาชิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PACKAGE MANAGEMENT MODAL                        */}
      {/* ======================================================== */}
      <PackageManagementModal
        isOpen={isPackageMgmtModalOpen}
        onClose={() => setIsPackageMgmtModalOpen(false)}
        packages={packageTemplates}
        onSavePackage={onSavePackageTemplate}
        onDeletePackage={onDeletePackageTemplate}
      />

      {/* ======================================================== */}
      {/* MODAL 4: TOP UP MEMBER PACKAGE MODAL                     */}
      {/* ======================================================== */}
      <TopUpMemberPackageModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        members={members}
        packages={packageTemplates}
        preSelectedMemberId={topUpTargetMemberId}
        preSelectedPackageId={topUpTargetPackageId}
        onConfirmTopUp={handleConfirmTopUp}
      />
    </div>
  );
};
