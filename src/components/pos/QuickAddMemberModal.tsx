import React, { useState } from 'react';
import { Member } from '../../types';
import { X, UserPlus, Phone, User, DollarSign } from 'lucide-react';

interface QuickAddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMember: (member: Member) => void;
  initialPhone?: string;
}

export const QuickAddMemberModal: React.FC<QuickAddMemberModalProps> = ({
  isOpen,
  onClose,
  onSaveMember,
  initialPhone = '',
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [packageLevel, setPackageLevel] = useState('Silver');
  const [balance, setBalance] = useState<string>('0');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์');
      return;
    }

    const numBalance = parseFloat(balance) || 0;

    const newMember: Member = {
      id: `mem-${Date.now()}`,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      phone: phone.trim(),
      gender: 'M',
      tier: packageLevel.toUpperCase().includes('PLATINUM') ? 'PLATINUM' : packageLevel.toUpperCase().includes('GOLD') ? 'VIP_GOLD' : 'SILVER',
      packageLevel: packageLevel.trim() || 'Silver',
      balance: numBalance,
      points: 0,
      totalSpent: 0,
      visitCount: 0,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      packages: [],
    };

    onSaveMember(newMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black flex items-center justify-center text-lg shadow-xs">
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
              สมัครสมาชิกใหม่ (Quick Add)
            </h3>
            <p className="text-xs text-stone-500">บันทึกข้อมูลและเติมยอดแพ็กเกจทันที</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              ชื่อ-นามสกุล (ชื่อจริง นามสกุล) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น คุณกานต์ พิริยะกุล"
              className="w-full bg-stone-50 border border-stone-300 focus:border-amber-400 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ชื่อเล่น
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น กานต์"
                className="w-full bg-stone-50 border border-stone-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081-234-5678"
                className="w-full bg-stone-50 border border-stone-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold font-mono text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ระดับแพ็กเกจ
              </label>
              <input
                type="text"
                value={packageLevel}
                onChange={(e) => setPackageLevel(e.target.value)}
                placeholder="เช่น Silver, Gold, Platinum"
                className="w-full bg-stone-50 border border-stone-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1">
                💰 ยอดเงินคงเหลือเริ่มต้น (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="w-full bg-emerald-50 border border-emerald-300 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-black font-mono text-emerald-950 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              หมายเหตุ (ถ้ามี)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ลูกค้าประจำ ช่างประจำ..."
              className="w-full bg-stone-50 border border-stone-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-black text-xs transition active:scale-98 shadow-sm cursor-pointer"
            >
              บันทึกและเลือกสมาชิกนี้
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
