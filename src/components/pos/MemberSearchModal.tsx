import React, { useState } from 'react';
import { Member } from '../../types';
import { Search, X, UserPlus, Phone, Check, CreditCard, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getPackageColorConfig } from '../../utils/packageColors';

interface MemberSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  selectedMember?: Member | null;
  onSelectMember: (member: Member | null) => void;
  onOpenQuickAdd: (phoneQuery?: string) => void;
}

export const MemberSearchModal: React.FC<MemberSearchModalProps> = ({
  isOpen,
  onClose,
  members,
  selectedMember,
  onSelectMember,
  onOpenQuickAdd,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      (m.packageLevel && m.packageLevel.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative text-stone-800 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black flex items-center justify-center text-lg shadow-xs">
            🧸
          </div>
          <div>
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
              เลือกลูกค้าสมาชิก (Member Lookup)
            </h3>
            <p className="text-xs text-stone-500">
              ค้นหาด้วยชื่อจริง, ชื่อเล่น หรือเบอร์โทรศัพท์ เพื่อตัดยอดเงินคงเหลืออัตโนมัติ
            </p>
          </div>
        </div>

        {/* Search and Quick Add Bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์ชื่อจริง, ชื่อเล่น หรือเบอร์โทรศัพท์..."
              className="w-full bg-stone-50 border border-stone-200 focus:border-amber-400 focus:bg-white text-stone-900 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none"
            />
          </div>
          <button
            onClick={() => onOpenQuickAdd(query)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ สมัครสมาชิก</span>
          </button>
        </div>

        {/* Selected Member Active Banner */}
        {selectedMember && (
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3.5 mb-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-stone-950 font-black flex items-center justify-center text-xs shadow-xs">
                {selectedMember.nickname?.slice(0, 2) || selectedMember.name.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-stone-900">{selectedMember.name}</span>
                  {selectedMember.nickname && (
                    <span className="text-xs text-amber-900 font-bold">({selectedMember.nickname})</span>
                  )}
                  <span className="text-[10px] font-black uppercase bg-stone-900 text-amber-300 px-2 py-0.5 rounded-full">
                    ⭐ {selectedMember.packageLevel || 'Silver'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-stone-600 mt-0.5">
                  <span>เบอร์: <strong className="text-stone-800 font-mono">{selectedMember.phone}</strong></span>
                  <span>
                    💰 ยอดเงินคงเหลือ: <strong className="text-emerald-700 font-mono font-black">{formatCurrency(selectedMember.balance || 0)}</strong>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onSelectMember(null)}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1 bg-white hover:bg-rose-50 rounded-lg border border-rose-200 transition cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {/* Member List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px]">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <p className="text-sm font-bold">ไม่พบข้อมูลสมาชิก</p>
              <p className="text-xs mt-1">กดปุ่ม "+ สมัครสมาชิก" ด้านบนเพื่อเพิ่มลูกค้าท่านนี้ได้ทันที</p>
            </div>
          ) : (
            filteredMembers.map((mem) => {
              const isSelected = selectedMember?.id === mem.id;
              const pColor = getPackageColorConfig(mem.packageLevel);
              const balance = mem.balance || 0;

              return (
                <div
                  key={mem.id}
                  className={`bg-stone-50/70 border rounded-2xl p-3.5 transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/60 shadow-xs'
                      : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-700 font-black flex items-center justify-center text-sm shrink-0">
                        {mem.nickname?.slice(0, 2) || mem.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-stone-900 truncate">{mem.name}</span>
                          {mem.nickname && (
                            <span className="text-[11px] text-amber-800 font-bold">
                              ({mem.nickname})
                            </span>
                          )}
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${pColor.badgeBg} ${pColor.badgeText} ${pColor.badgeBorder}`}>
                            ⭐ {mem.packageLevel || 'Silver'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                          <span className="flex items-center gap-1 font-mono font-medium text-stone-700">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {mem.phone}
                          </span>
                          <span className="text-stone-400">•</span>
                          <span className="flex items-center gap-1">
                            <span>ยอดคงเหลือ:</span>
                            <strong className="text-emerald-700 font-mono font-black">
                              {formatCurrency(balance)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectMember(isSelected ? null : mem);
                        if (!isSelected) onClose();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 shadow-xs'
                          : 'bg-stone-900 hover:bg-stone-800 text-amber-300 shadow-2xs'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{isSelected ? 'เลือกแล้ว' : 'เลือกลูกค้า'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
