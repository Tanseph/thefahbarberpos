import React, { useState } from 'react';
import { Barber, Bill, PaymentMethod, StoreSettings } from '../../types';
import { 
  X, 
  Receipt, 
  Printer, 
  Ban, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Clock, 
  AlertTriangle,
  Edit,
  Trash2,
  Wallet,
  QrCode,
  Split,
  CreditCard,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatThaiDate } from '../../utils/formatters';
import { EditBillModal } from './EditBillModal';
import { DeleteBillModal } from './DeleteBillModal';

interface DailyBillsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bills: Bill[];
  barbers?: Barber[];
  onSelectBillForReceipt?: (bill: Bill) => void;
  onReprintBill?: (bill: Bill) => void;
  onVoidBill: (billId: string, reason: string) => void;
  onUpdateBill?: (bill: Bill) => void;
  onDeleteBill?: (billId: string) => void;
  settings?: StoreSettings;
}

export const DailyBillsDrawer: React.FC<DailyBillsDrawerProps> = ({
  isOpen,
  onClose,
  bills,
  barbers = [],
  onSelectBillForReceipt,
  onReprintBill,
  onVoidBill,
  onUpdateBill,
  onDeleteBill,
  settings,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [voidingBillId, setVoidingBillId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  if (!isOpen) return null;

  const filteredBills = bills.filter((b) => {
    if (filter !== 'ALL' && b.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      (b.memberName && b.memberName.toLowerCase().includes(q)) ||
      (b.memberPhone && b.memberPhone.includes(q))
    );
  });

  const handlePrint = (bill: Bill) => {
    if (onSelectBillForReceipt) {
      onSelectBillForReceipt(bill);
    } else if (onReprintBill) {
      onReprintBill(bill);
    }
  };

  const handleConfirmVoid = () => {
    if (!voidingBillId || !voidReason.trim()) return;
    onVoidBill(voidingBillId, voidReason.trim());
    setVoidingBillId(null);
    setVoidReason('');
  };

  // Quick Switch Payment Method (1-click toggler: CASH -> TRANSFER -> SPLIT -> CASH)
  const handleQuickTogglePaymentMethod = (bill: Bill) => {
    if (!onUpdateBill) return;
    let nextMethod: PaymentMethod = 'CASH';
    if (bill.paymentMethod === 'CASH') {
      nextMethod = 'TRANSFER';
    } else if (bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY') {
      nextMethod = 'SPLIT';
    } else {
      nextMethod = 'CASH';
    }

    const half = Math.round(bill.grandTotal / 2);
    const updated: Bill = {
      ...bill,
      paymentMethod: nextMethod,
      splitCashAmount: nextMethod === 'SPLIT' ? half : undefined,
      splitTransferAmount: nextMethod === 'SPLIT' ? (bill.grandTotal - half) : undefined,
      cashReceived: nextMethod === 'CASH' ? bill.grandTotal : bill.cashReceived,
    };
    onUpdateBill(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border-l border-stone-200 w-full max-w-lg h-full p-4 sm:p-5 shadow-2xl flex flex-col justify-between text-stone-800 overflow-hidden">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center text-sm shadow-xs font-bold">
                <Receipt className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm tracking-tight">ประวัติบิลขายวันนี้</h3>
                <span className="text-[11px] text-stone-500">ทั้งหมด {bills.length} บิล (แก้ไข/ลบ/สลับชำระได้)</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Tabs */}
          <div className="space-y-2.5 my-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเลขที่บิล, ชื่อลูกค้า, เบอร์โทร..."
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-400 focus:bg-white rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['ALL', 'COMPLETED', 'VOIDED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    filter === tab
                      ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {tab === 'ALL' && 'ทั้งหมด'}
                  {tab === 'COMPLETED' && '✅ สำเร็จ'}
                  {tab === 'VOIDED' && '❌ ยกเลิก'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bill List Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1">
          {filteredBills.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50 text-stone-300" />
              <p className="text-xs">ไม่พบบิลที่ค้นหา</p>
            </div>
          ) : (
            filteredBills.map((bill) => {
              const isVoided = bill.status === 'VOIDED';

              return (
                <div
                  key={bill.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isVoided
                      ? 'bg-rose-50/40 border-rose-200 opacity-75'
                      : 'bg-stone-50/80 border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 font-mono">
                          #{bill.billNumber}
                        </span>
                        {isVoided ? (
                          <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                            <XCircle className="w-2.5 h-2.5" /> ยกเลิกแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> สำเร็จ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formatThaiDate(bill.date, true)}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-stone-700">{bill.memberName || 'ลูกค้าทั่วไป'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-black font-mono ${isVoided ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                        {formatCurrency(bill.grandTotal)}
                      </span>
                      
                      {/* Payment method badge with quick click-to-swap support */}
                      <button
                        type="button"
                        onClick={() => handleQuickTogglePaymentMethod(bill)}
                        title="คลิกเพื่อสลับวิธีชำระเงินด่วน (เงินสด ⇄ โอน ⇄ แบ่งจ่าย)"
                        className={`text-[10px] block mt-0.5 px-2 py-0.5 rounded-lg border font-bold transition cursor-pointer hover:scale-105 active:scale-95 ${
                          bill.paymentMethod === 'CASH'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                            : bill.paymentMethod === 'SPLIT'
                            ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                            : 'bg-stone-100 text-stone-800 border-stone-200'
                        }`}
                      >
                        {bill.paymentMethod === 'CASH' ? '💵 เงินสด ⇄' : bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY' ? '📱 โอน/QR ⇄' : bill.paymentMethod === 'SPLIT' ? '🔄 สลับ ⇄' : bill.paymentMethod}
                      </button>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/70 space-y-0.5 mb-2.5">
                    {bill.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{i.name} (x{i.quantity}) • ช่าง{i.barberName}</span>
                        <span className="font-semibold text-stone-900">{formatCurrency(i.price * i.quantity)}</span>
                      </div>
                    ))}
                    {bill.tipAmount > 0 && (
                      <div className="flex justify-between text-pink-600 font-medium pt-1 border-t border-stone-100">
                        <span>💖 ทิปช่าง</span>
                        <span>{formatCurrency(bill.tipAmount)}</span>
                      </div>
                    )}
                  </div>

                  {isVoided && bill.voidReason && (
                    <p className="text-[10px] text-rose-600 italic mb-2">
                      เหตุผลยกเลิก: {bill.voidReason} ({formatThaiDate(bill.voidedAt || bill.date, true)})
                    </p>
                  )}

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-stone-200/60 flex-wrap">
                    {/* Left: Quick Switch payment & Edit */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingBill(bill)}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="แก้ไขบิล"
                      >
                        <Edit className="w-3 h-3 text-amber-700" />
                        <span>แก้ไขบิล</span>
                      </button>

                      <button
                        onClick={() => setDeletingBill(bill)}
                        className="px-2 py-1 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="ลบบิลออกจากระบบ (มีป๊อปอัพยืนยัน)"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบ</span>
                      </button>
                    </div>

                    {/* Right: Print & Void */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePrint(bill)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-stone-500" />
                        <span>พิมพ์</span>
                      </button>

                      {!isVoided && (
                        <button
                          onClick={() => {
                            setVoidingBillId(bill.id);
                            setVoidReason('');
                          }}
                          className="px-2 py-1 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                          title="ยกเลิกบิล (Void)"
                        >
                          <Ban className="w-3 h-3" />
                          <span>ยกเลิก</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Edit Bill Modal */}
        {editingBill && (
          <EditBillModal
            isOpen={!!editingBill}
            onClose={() => setEditingBill(null)}
            bill={editingBill}
            barbers={barbers}
            onSaveBill={(updated) => {
              if (onUpdateBill) onUpdateBill(updated);
              setEditingBill(null);
            }}
          />
        )}

        {/* Delete Bill Modal with Confirmation Popup */}
        {deletingBill && (
          <DeleteBillModal
            isOpen={!!deletingBill}
            onClose={() => setDeletingBill(null)}
            bill={deletingBill}
            onConfirmDelete={(billId) => {
              if (onDeleteBill) onDeleteBill(billId);
              setDeletingBill(null);
            }}
          />
        )}

        {/* Void Confirmation Modal Overlay inside Drawer */}
        {voidingBillId && (
          <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <div className="bg-white border border-rose-200 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>ยืนยันการยกเลิกบิล (Void Bill)</span>
              </div>
              <p className="text-xs text-stone-600">
                การยกเลิกบิลจะคืนแต้มและตัดยอดขายออกทันที กรุณาระบุเหตุผลการยกเลิก:
              </p>
              <textarea
                autoFocus
                rows={2}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="เช่น ลูกค้าเปลี่ยนใจ, คิดเงินผิดรายการ..."
                className="w-full bg-stone-50 border border-stone-200 focus:border-rose-400 rounded-xl p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none resize-none"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setVoidingBillId(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-100 cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  disabled={!voidReason.trim()}
                  onClick={handleConfirmVoid}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                >
                  ยืนยันยกเลิกบิล
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
