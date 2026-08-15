import React, { useState } from 'react';
import { PackageTemplate } from '../../types';
import { X, Sparkles, Trash2, Edit3, Plus, ArrowRight, Palette, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { PACKAGE_COLOR_PALETTES, getPackageColorConfig } from '../../utils/packageColors';

interface PackageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: PackageTemplate[];
  onSavePackage: (pkg: PackageTemplate) => void;
  onDeletePackage: (pkgId: string) => void;
}

export const PackageManagementModal: React.FC<PackageManagementModalProps> = ({
  isOpen,
  onClose,
  packages,
  onSavePackage,
  onDeletePackage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<PackageTemplate | null>(null);
  const [level, setLevel] = useState('Silver');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(1000);
  const [receivedValue, setReceivedValue] = useState(1200);
  const [colorTheme, setColorTheme] = useState('slate');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setLevel('Silver');
    setName('');
    setDescription('');
    setPrice(1000);
    setReceivedValue(1200);
    setColorTheme('slate');
    setIsEditing(true);
  };

  const handleOpenEdit = (pkg: PackageTemplate) => {
    setEditingId(pkg.id);
    setLevel(pkg.level || 'Silver');
    setName(pkg.name);
    setDescription(pkg.description || '');
    setPrice(pkg.price);
    setReceivedValue(pkg.receivedValue || pkg.price);
    setColorTheme(pkg.colorTheme || 'amber');
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPkg: PackageTemplate = {
      id: editingId || `pkg-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      level: level.trim() || 'Silver',
      price: Number(price) || 0,
      receivedValue: Number(receivedValue) || Number(price),
      colorTheme: colorTheme || 'amber',
      isActive: true,
    };

    onSavePackage(newPkg);
    setIsEditing(false);
  };

  const colorOptions = Object.values(PACKAGE_COLOR_PALETTES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative text-stone-900 max-h-[90vh] flex flex-col justify-between">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 font-black flex items-center justify-center text-lg shadow-xs">
              🎨
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base tracking-tight">
                จัดการแพ็กเกจสมาชิกแบบมีสีสัน (Colorful Member Packages)
              </h3>
              <p className="text-xs text-stone-500">
                กำหนดระดับแพ็กเกจ ข้อมูล ราคาที่จ่าย และราคาที่ได้รับ (เครดิตเติมเงิน)
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black transition shadow-xs cursor-pointer mr-8"
            >
              <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
              <span>สร้างแพ็กเกจใหม่</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto my-4 pr-1">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                {editingId ? 'แก้ไขข้อมูลแพ็กเกจ' : 'สร้างแพ็กเกจสีสันใหม่'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ระดับแพ็กเกจ (Level) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="เช่น Silver, Gold, Platinum, VIP Diamond"
                    className="w-full bg-white border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ชื่อแพ็กเกจ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น แพ็กเกจ Gold สุดคุ้ม"
                    className="w-full bg-white border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ข้อมูลแพ็กเกจ / คำอธิบาย
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น เติมเงินสุดคุ้มระดับ Gold รับโบนัสเครดิตเพิ่ม ใช้ได้ทุกบริการและสินค้าในร้าน"
                  className="w-full bg-white border border-stone-300 focus:border-amber-500 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none resize-none"
                />
              </div>

              {/* Price Paid vs Received Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-3.5 rounded-2xl border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    💰 ราคาที่จ่าย (บาท) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="1000"
                    className="w-full bg-stone-50 border border-stone-300 focus:border-stone-500 rounded-xl px-3 py-2 text-sm text-stone-900 font-black font-mono focus:outline-none"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    จำนวนเงินจริงที่ลูกค้าต้องชำระ
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    🎁 ราคาที่ได้รับ / เครดิตเข้ากระเป๋า (บาท) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={receivedValue}
                    onChange={(e) => setReceivedValue(parseFloat(e.target.value) || 0)}
                    placeholder="1200"
                    className="w-full bg-emerald-50/60 border border-emerald-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-emerald-950 font-black font-mono focus:outline-none"
                  />
                  <span className="text-[11px] text-emerald-600 mt-1 block font-bold">
                    โบนัสที่ได้รับเพิ่ม: +{formatCurrency(Math.max(0, receivedValue - price))}
                  </span>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-600" />
                  <span>เลือกธีมสีสันของแพ็กเกจ:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colorOptions.map((c) => {
                    const isSelected = colorTheme === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColorTheme(c.id)}
                        className={`p-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? `${c.cardBorder} ${c.badgeBg} ${c.badgeText} ring-2 ring-amber-400 font-black`
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full ${c.accentBg}`} />
                          <span className="truncate">{c.name.split('/')[0]}</span>
                        </span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-white cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black shadow-xs cursor-pointer"
                >
                  บันทึกแพ็กเกจ
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {packages.length === 0 ? (
                <div className="col-span-2 p-12 text-center text-stone-400 bg-stone-50 rounded-2xl">
                  <Palette className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                  <p className="text-xs font-semibold">ยังไม่มีแพ็กเกจในระบบ</p>
                </div>
              ) : (
                packages.map((pkg) => {
                  const pColor = getPackageColorConfig(pkg.colorTheme);
                  const bonus = Math.max(0, pkg.receivedValue - pkg.price);

                  return (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-2xl border-2 transition-all shadow-xs relative flex flex-col justify-between ${pColor.cardBg} ${pColor.cardBorder}`}
                    >
                      <div>
                        {/* Level badge & Action buttons */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${pColor.badgeBg} ${pColor.badgeText} ${pColor.badgeBorder} shadow-2xs`}
                          >
                            ⭐ {pkg.level || 'Standard'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(pkg)}
                              className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-700 shadow-2xs border border-stone-200 transition cursor-pointer"
                              title="แก้ไข"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingPackage(pkg)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-2xs transition cursor-pointer"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Package Info */}
                        <h4 className="font-black text-sm text-stone-900 tracking-tight">
                          {pkg.name}
                        </h4>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {pkg.description || 'แพ็กเกจเติมเงินสุดคุ้มสำหรับสมาชิก'}
                        </p>
                      </div>

                      {/* Price Paid vs Received Value */}
                      <div className="mt-4 pt-3 border-t border-stone-200/80">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-stone-500 font-bold block">
                              ราคาที่จ่าย
                            </span>
                            <span className="text-sm font-black text-stone-900 font-mono">
                              {formatCurrency(pkg.price)}
                            </span>
                          </div>

                          <ArrowRight className="w-4 h-4 text-stone-300" />

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-700 font-extrabold block">
                              ราคาที่ได้รับ
                            </span>
                            <span className="text-base font-black text-emerald-800 font-mono">
                              {formatCurrency(pkg.receivedValue)}
                            </span>
                          </div>
                        </div>

                        {bonus > 0 && (
                          <div className="mt-2 text-center text-[10px] font-bold text-amber-900 bg-amber-100/80 py-1 rounded-lg">
                            ✨ กำไรลูกค้า: +{formatCurrency(bonus)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Delete Package Confirmation Popup Modal */}
      {deletingPackage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm p-5 shadow-2xl relative text-stone-900 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-black text-stone-900">
                ยืนยันการลบแพ็กเกจ?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบแพ็กเกจ <span className="font-bold text-stone-900">"{deletingPackage.name}"</span> (ราคา {formatCurrency(deletingPackage.price)}) ออกจากระบบ?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs font-bold transition-all cursor-pointer flex-1"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePackage(deletingPackage.id);
                  setDeletingPackage(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition-all cursor-pointer shadow-sm flex-1"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
