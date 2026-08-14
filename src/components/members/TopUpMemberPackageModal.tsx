import React, { useState, useEffect } from 'react';
import { Member, PackageTemplate, PaymentMethod } from '../../types';
import { X, Sparkles, Check, CreditCard, Banknote, QrCode, ArrowRight, User } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getPackageColorConfig } from '../../utils/packageColors';

interface TopUpMemberPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  packages: PackageTemplate[];
  preSelectedMemberId?: string;
  preSelectedPackageId?: string;
  onConfirmTopUp: (
    member: Member,
    pkg: PackageTemplate,
    paymentMethod: PaymentMethod
  ) => void;
}

export const TopUpMemberPackageModal: React.FC<TopUpMemberPackageModalProps> = ({
  isOpen,
  onClose,
  members,
  packages,
  preSelectedMemberId,
  preSelectedPackageId,
  onConfirmTopUp,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [memberSearch, setMemberSearch] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (preSelectedMemberId) {
        setSelectedMemberId(preSelectedMemberId);
      } else if (members.length > 0) {
        setSelectedMemberId(members[0].id);
      }

      if (preSelectedPackageId) {
        setSelectedPkgId(preSelectedPackageId);
      } else if (packages.length > 0) {
        setSelectedPkgId(packages[0].id);
      }
    }
  }, [isOpen, preSelectedMemberId, preSelectedPackageId, members, packages]);

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === selectedMemberId);
  const currentPackage = packages.find((p) => p.id === selectedPkgId);
  const colorConfig = currentPackage ? getPackageColorConfig(currentPackage.colorTheme) : null;

  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      m.phone.includes(q)
    );
  });

  const bonusAmount = currentPackage
    ? Math.max(0, currentPackage.receivedValue - currentPackage.price)
    : 0;

  const handleConfirm = () => {
    if (!currentMember || !currentPackage) {
      alert('กรุณาเลือกสมาชิกและแพ็กเกจที่ต้องการเติม');
      return;
    }
    onConfirmTopUp(currentMember, currentPackage, paymentMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative text-stone-900 max-h-[90vh] flex flex-col justify-between">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 font-black flex items-center justify-center text-lg shadow-xs">
            💎
          </div>
          <div>
            <h3 className="font-black text-stone-900 text-base tracking-tight">
              ซื้อ / เติมแพ็กเกจสมาชิก
            </h3>
            <p className="text-xs text-stone-500">
              เติมยอดเงินคงเหลือและปรับระดับแพ็กเกจให้สมาชิก
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          {/* 1. เลือกสมาชิก */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block flex items-center justify-between">
              <span>1. เลือกสมาชิกที่ต้องการซื้อแพ็กเกจ</span>
              <span className="text-[11px] font-normal text-stone-400">
                {members.length} สมาชิกในระบบ
              </span>
            </label>

            {members.length > 5 && (
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="พิมพ์ค้นหาชื่อ / เบอร์โทรสมาชิก..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-stone-50/50 rounded-xl border border-stone-200/60">
              {filteredMembers.map((mem) => {
                const isSelected = mem.id === selectedMemberId;
                return (
                  <div
                    key={mem.id}
                    onClick={() => setSelectedMemberId(mem.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-amber-300 text-stone-700'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="font-bold truncate text-stone-900">
                        {mem.name} {mem.nickname ? `(${mem.nickname})` : ''}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {mem.phone} • ระดับ: {mem.packageLevel || 'ทั่วไป'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-extrabold text-amber-800 font-mono block">
                        {formatCurrency(mem.balance || 0)}
                      </span>
                      <span className="text-[9px] text-stone-400">คงเหลือ</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. เลือกแพ็กเกจ (Package Color Theme Cards) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              2. เลือกแพ็กเกจที่ต้องการซื้อ
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = pkg.id === selectedPkgId;
                const pColor = getPackageColorConfig(pkg.colorTheme);
                const pBonus = Math.max(0, pkg.receivedValue - pkg.price);

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative ${pColor.cardBg} ${
                      isSelected
                        ? `${pColor.cardBorder} ring-2 ring-amber-400 shadow-xs scale-[1.01]`
                        : 'border-stone-200/80 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${pColor.badgeBg} ${pColor.badgeText} ${pColor.badgeBorder}`}
                      >
                        {pkg.level || 'Member'}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-300 text-xs flex items-center justify-center font-black">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="font-extrabold text-xs text-stone-900 truncate">
                      {pkg.name}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {pkg.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">ราคาที่จ่าย</span>
                        <strong className="text-stone-900 font-mono font-bold">
                          {formatCurrency(pkg.price)}
                        </strong>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-300 mx-1" />
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          ราคาที่ได้รับ
                        </span>
                        <strong className="text-emerald-700 font-mono font-black">
                          {formatCurrency(pkg.receivedValue)}
                        </strong>
                      </div>
                    </div>

                    {pBonus > 0 && (
                      <div className="mt-1 text-[10px] text-center text-amber-800 bg-amber-100/70 font-bold py-0.5 rounded-md">
                        ✨ ได้โบนัสเพิ่ม +{formatCurrency(pBonus)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. วิธีชำระเงินที่ร้านได้รับ */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">
              3. วิธีชำระเงินค่าแพ็กเกจ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-blue-50 border-blue-400 text-blue-950 ring-1 ring-blue-300'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>📱 เงินโอน / พร้อมเพย์</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-300'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>💵 เงินสด</span>
              </button>
            </div>
          </div>

          {/* 4. สรุปผลการเติมเงิน */}
          {currentMember && currentPackage && (
            <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-400">
                <span>สมาชิก:</span>
                <strong className="text-stone-100 font-bold">
                  {currentMember.name} ({currentMember.phone})
                </strong>
              </div>
              <div className="flex justify-between items-center text-stone-400">
                <span>แพ็กเกจ & ระดับ:</span>
                <span className="text-amber-300 font-extrabold">
                  {currentPackage.level} • {currentPackage.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-400">
                <span>ราคาที่ต้องชำระ:</span>
                <span className="text-white font-mono font-bold text-sm">
                  {formatCurrency(currentPackage.price)}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
                <span className="text-amber-200 font-bold">ยอดเงินคงเหลือใหม่หลังเติม:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {formatCurrency((currentMember.balance || 0) + currentPackage.receivedValue)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!currentMember || !currentPackage}
            className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ยืนยันการซื้อแพ็กเกจ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
