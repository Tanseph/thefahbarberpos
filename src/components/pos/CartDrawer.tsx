import React, { useState } from 'react';
import { Barber, CartItem, Member, StoreSettings } from '../../types';
import { 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  UserCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface CartDrawerProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  barbers: Barber[];
  selectedMember: Member | null;
  onOpenMemberModal: () => void;
  onRemoveMember: () => void;
  settings: StoreSettings;
  tipAmount: number;
  setTipAmount: (amount: number) => void;
  tipBarberId: string;
  setTipBarberId: (barberId: string) => void;
  pointsRedeemed: number;
  setPointsRedeemed: (pts: number) => void;
  billDiscount: number;
  setBillDiscount: (disc: number) => void;
  onProceedToPayment: () => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cart,
  setCart,
  barbers,
  selectedMember,
  onOpenMemberModal,
  onRemoveMember,
  settings,
  tipAmount,
  setTipAmount,
  tipBarberId,
  setTipBarberId,
  pointsRedeemed,
  setPointsRedeemed,
  billDiscount,
  setBillDiscount,
  onProceedToPayment,
  onClearCart,
}) => {
  const [showTipInput, setShowTipInput] = useState(false);
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  // Update item quantity
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Change barber for specific item
  const updateItemBarber = (itemId: string, barberId: string) => {
    const b = barbers.find((bar) => bar.id === barberId);
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, barberId, barberName: b ? b.nickname : item.barberName }
          : item
      )
    );
  };

  // Remove single item
  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.isPackageRedemption ? 0 : item.price * item.quantity),
    0
  );

  const itemDiscounts = cart.reduce(
    (sum, item) => sum + (item.discount || 0) * item.quantity,
    0
  );

  // Member Tier Discount
  let tierDiscountAmount = 0;
  if (selectedMember && subtotal > 0) {
    if (selectedMember.tier === 'PLATINUM') {
      tierDiscountAmount = Math.round(subtotal * 0.10);
    } else if (selectedMember.tier === 'VIP_GOLD') {
      tierDiscountAmount = Math.round(subtotal * 0.05);
    }
  }

  // Points discount
  const pointsDiscountValue = (pointsRedeemed || 0) * (settings.pointDiscountValue || 1);

  const totalDiscounts = itemDiscounts + tierDiscountAmount + billDiscount + pointsDiscountValue;
  const taxableAmount = Math.max(0, subtotal - totalDiscounts);
  const grandTotal = taxableAmount + (tipAmount || 0);

  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <aside className="bg-[#1A1A1A] border border-[#A17000]/30 rounded-3xl overflow-hidden flex flex-col shadow-2xl text-[#F5EEDC] h-full justify-between">
      {/* Top Section: Member Card */}
      <div className="p-4 sm:p-5 border-b border-white/5 bg-[#222]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-white">
            <span>💎</span> สมาชิก & ข้อมูลลูกค้า
          </h3>
          <button
            onClick={onOpenMemberModal}
            className="text-[10px] text-[#A17000] font-bold hover:underline cursor-pointer"
          >
            {selectedMember ? 'เปลี่ยนลูกค้า' : '+ เลือกลูกค้า'}
          </button>
        </div>

        {selectedMember ? (
          <div className="flex items-center justify-between p-3 bg-[#A17000]/10 rounded-xl border border-[#A17000]/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#A17000] flex items-center justify-center text-black font-bold text-xs shrink-0">
                {selectedMember.nickname?.slice(0, 2) || selectedMember.name.slice(0, 2)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {selectedMember.name} {selectedMember.nickname ? `(${selectedMember.nickname})` : ''}
                </p>
                <p className="text-[10px] text-[#A17000] truncate">
                  {selectedMember.tier === 'PLATINUM' ? 'Platinum (-10%)' : selectedMember.tier === 'VIP_GOLD' ? 'VIP Gold (-5%)' : 'Member'} • {selectedMember.points} แต้ม
                </p>
              </div>
            </div>

            <button
              onClick={onRemoveMember}
              className="text-stone-400 hover:text-rose-400 text-xs p-1"
              title="ยกเลิกการเลือกสมาชิก"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenMemberModal}
            className="w-full bg-[#0F0F0F] border border-white/10 hover:border-[#A17000] rounded-xl px-4 py-2.5 text-xs text-[#F5EEDC]/70 hover:text-white flex items-center justify-between transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#A17000]" />
              <span>ค้นหาชื่อ หรือ เบอร์โทรสมาชิก...</span>
            </span>
            <span className="text-[#A17000] font-bold text-[10px]">ค้นหา 🔍</span>
          </button>
        )}
      </div>

      {/* Middle Section: Cart Items */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-white">
            <span>🛒</span> ตะกร้าสินค้า
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#F5EEDC]/50">{totalItemsCount} รายการ</span>
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-2.5 h-2.5" /> ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Scrollable items */}
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 max-h-[280px] min-h-[120px]">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-[#F5EEDC]/40 flex flex-col items-center justify-center h-full">
              <span className="text-3xl mb-1 opacity-30">✂️</span>
              <p className="text-xs font-semibold">ยังไม่มีรายการในบิล</p>
              <p className="text-[10px] text-[#F5EEDC]/30 mt-0.5">กดเลือกบริการทางซ้ายเพื่อเริ่มคิดเงิน</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-white truncate">{item.name}</p>
                  
                  {/* Barber indicator / selector */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-[#F5EEDC]/50 italic">
                      ช่าง {item.barberName}
                    </span>
                    <select
                      value={item.barberId}
                      onChange={(e) => updateItemBarber(item.id, e.target.value)}
                      className="bg-[#0F0F0F] text-[#A17000] text-[9px] border border-white/10 rounded px-1 py-0.2 focus:outline-none cursor-pointer"
                    >
                      {barbers.filter(b => b.isActive).map(b => (
                        <option key={b.id} value={b.id} className="bg-[#1A1A1A] text-white">
                          {b.nickname}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity adjustment */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-5 h-5 rounded bg-[#2A2A2A] hover:bg-[#333] text-white flex items-center justify-center cursor-pointer text-xs"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-xs font-bold text-white min-w-[14px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-5 h-5 rounded bg-[#2A2A2A] hover:bg-[#333] text-white flex items-center justify-center cursor-pointer text-xs"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#A17000]">
                    {item.isPackageRedemption ? '0฿' : formatCurrency(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[10px] text-rose-400 hover:underline mt-1 block ml-auto cursor-pointer"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary Calculations */}
        <div className="space-y-1.5 pt-3 border-t border-white/5 text-xs">
          <div className="flex justify-between">
            <span className="text-[#F5EEDC]/50">ยอดรวม (Subtotal)</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          {tierDiscountAmount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>ส่วนลดสมาชิก ({selectedMember?.tier === 'PLATINUM' ? '10%' : '5%'})</span>
              <span>-{formatCurrency(tierDiscountAmount)}</span>
            </div>
          )}

          {/* Tips Quick Toggle */}
          <div className="flex items-center justify-between text-[#F5EEDC]/70">
            <button
              onClick={() => setShowTipInput(!showTipInput)}
              className="text-[11px] text-[#A17000] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ ให้ทิปช่าง ({tipAmount > 0 ? `${tipAmount}฿` : '0฿'})</span>
            </button>
            {tipAmount > 0 && <span className="text-[#A17000] font-bold">+{formatCurrency(tipAmount)}</span>}
          </div>

          {showTipInput && (
            <div className="flex items-center gap-1.5 py-1 bg-[#0F0F0F] p-2 rounded-xl border border-white/5">
              {[20, 50, 100, 200].map((tip) => (
                <button
                  key={tip}
                  onClick={() => setTipAmount(tipAmount === tip ? 0 : tip)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    tipAmount === tip ? 'bg-[#A17000] text-black' : 'bg-[#252525] text-stone-300'
                  }`}
                >
                  +{tip}฿
                </button>
              ))}
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-dashed border-white/20">
            <span className="font-bold text-sm text-white">ยอดสุทธิ (Total)</span>
            <span className="text-2xl font-black text-[#A17000]">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Payment Quick Launch & CTA */}
      <div className="p-4 sm:p-5 bg-[#222] border-t border-white/5 flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5EEDC]/50">
          💳 ดำเนินการชำระเงิน
        </p>

        <button
          disabled={cart.length === 0}
          onClick={onProceedToPayment}
          className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-tight shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            cart.length === 0
              ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-[#F5EEDC] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.15)]'
          }`}
        >
          <span>ชำระเงิน & พิมพ์ใบเสร็จ 🖨️</span>
        </button>
      </div>
    </aside>
  );
};
