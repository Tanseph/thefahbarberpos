import React, { useState, useEffect } from 'react';
import { Barber, SalarySlip, StoreSettings, Expense } from '../../types';
import { 
  Printer, 
  X, 
  FileText, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  Eye, 
  Edit3, 
  Coins, 
  Calculator, 
  Building2, 
  User, 
  DollarSign, 
  MinusCircle, 
  PlusCircle, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  Percent,
  Scissors,
  FlaskConical,
  Package,
  Info
} from 'lucide-react';
import { formatCurrency, formatThaiDate, getThaiMonthName, formatThaiMonthYear } from '../../utils/formatters';
import { thaiBahtText } from '../../utils/thaiBahtText';

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: SalarySlip | null;
  barber: Barber | null;
  settings: StoreSettings;
  expenses?: Expense[];
  onSave?: (updatedSlip: SalarySlip) => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({
  isOpen,
  onClose,
  slip,
  barber,
  settings,
  expenses = [],
  onSave,
}) => {
  // Active view tab: 'EDIT' or 'PREVIEW'
  const [activeTab, setActiveTab] = useState<'EDIT' | 'PREVIEW'>('PREVIEW');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State for all customizable payslip fields
  const [employeeCode, setEmployeeCode] = useState(slip?.employeeCode || barber?.employeeCode || 'EMP-001');
  const [employeeName, setEmployeeName] = useState(slip?.barberName || barber?.name || '');
  const [nickname, setNickname] = useState(slip?.barberNickname || barber?.nickname || '');
  const [positionTitle, setPositionTitle] = useState(slip?.positionTitle || barber?.positionTitle || 'ช่างตัดผมมืออาชีพ (Senior Barber)');
  const [department, setDepartment] = useState(slip?.department || barber?.department || 'แผนกช่างผมและบริการ');
  const [idCardNumber, setIdCardNumber] = useState(slip?.idCardNumber || barber?.idCardNumber || '-');
  const [bankName, setBankName] = useState(slip?.bankName || barber?.bankName || 'กสิกรไทย (KBANK)');
  const [bankAccountNumber, setBankAccountNumber] = useState(slip?.bankAccountNumber || barber?.bankAccountNumber || '-');
  const [paymentDate, setPaymentDate] = useState(
    slip?.paymentDate || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(slip?.paymentMethod || 'โอนเงินผ่านบัญชีธนาคาร');
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'DRAFT'>(slip?.status || 'PENDING');

  // Performance / Service breakdown fields
  const [headsCount, setHeadsCount] = useState<number>(slip?.headsCount ?? 0);
  const [haircutSalesTotal, setHaircutSalesTotal] = useState<number>(slip?.haircutSalesTotal ?? 0);
  const [haircutComPercent, setHaircutComPercent] = useState<number>(
    slip?.haircutComPercent ?? barber?.haircutCommissionRate ?? 50
  );
  const [haircutCommission, setHaircutCommission] = useState<number>(slip?.haircutCommission ?? 0);

  const [chemicalSalesTotal, setChemicalSalesTotal] = useState<number>(slip?.chemicalSalesTotal ?? 0);
  const [chemicalComPercent, setChemicalComPercent] = useState<number>(
    slip?.chemicalComPercent ?? barber?.chemicalCommissionRate ?? 40
  );
  const [chemicalCommission, setChemicalCommission] = useState<number>(slip?.chemicalCommission ?? 0);

  const [productSalesTotal, setProductSalesTotal] = useState<number>(slip?.productSalesTotal ?? 0);
  const [productComPercent, setProductComPercent] = useState<number>(
    slip?.productComPercent ?? barber?.productCommissionRate ?? 10
  );
  const [productCommission, setProductCommission] = useState<number>(slip?.productCommission ?? 0);

  // Earnings Fields (กรอกตัวเลขเองได้)
  const [baseSalary, setBaseSalary] = useState<number>(slip?.baseSalary ?? barber?.baseSalary ?? 15000);
  const [overtimePay, setOvertimePay] = useState<number>(slip?.overtimePay ?? 0);
  const [attendanceBonus, setAttendanceBonus] = useState<number>(slip?.attendanceBonus ?? 0);
  const [positionAllowance, setPositionAllowance] = useState<number>(
    slip?.positionAllowance ?? barber?.roleAllowance ?? 0
  );
  const [transportAllowance, setTransportAllowance] = useState<number>(slip?.transportAllowance ?? 0);
  const [specialBonus, setSpecialBonus] = useState<number>(slip?.specialBonus ?? 0);
  const [tipTotal, setTipTotal] = useState<number>(slip?.tipTotal ?? 0);
  const [otherEarnings, setOtherEarnings] = useState<number>(slip?.otherEarnings ?? 0);
  const [otherEarningsDescription, setOtherEarningsDescription] = useState<string>(
    slip?.otherEarningsDescription || 'เงินพิเศษอื่นๆ'
  );

  // Deductions Fields (กรอกตัวเลขเองได้)
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(slip?.advanceDeduction ?? 0);
  const [socialSecurity, setSocialSecurity] = useState<number>(slip?.socialSecurity ?? 0);
  const [taxPercent, setTaxPercent] = useState<number>(slip?.taxPercent ?? 0);
  const [taxDeduction, setTaxDeduction] = useState<number>(slip?.taxDeduction ?? 0);
  const [providentFund, setProvidentFund] = useState<number>(slip?.providentFund ?? 0);
  const [lateAbsenceDeduction, setLateAbsenceDeduction] = useState<number>(slip?.lateAbsenceDeduction ?? 0);
  const [uniformToolDeduction, setUniformToolDeduction] = useState<number>(slip?.uniformToolDeduction ?? 0);
  const [otherDeduction, setOtherDeduction] = useState<number>(slip?.otherDeduction ?? 0);
  const [otherDeductionDescription, setOtherDeductionDescription] = useState<string>(
    slip?.otherDeductionDescription || 'หักค่าปรับ/อื่นๆ'
  );

  const [notes, setNotes] = useState<string>(slip?.notes || '');

  // Month Period parsing
  const selectedMonth = slip?.month || '2026-08';
  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthName = getThaiMonthName(parseInt(monthStr || '8', 10));
  const thaiYear = parseInt(yearStr || '2026', 10) + 543;
  const periodText = `ประจำเดือน ${monthName} ${thaiYear}`;

  // Sync state when slip or barber changes
  useEffect(() => {
    if (slip) {
      setEmployeeCode(slip.employeeCode || barber?.employeeCode || 'EMP-001');
      setEmployeeName(slip.barberName || barber?.name || '');
      setNickname(slip.barberNickname || barber?.nickname || '');
      setPositionTitle(slip.positionTitle || barber?.positionTitle || 'ช่างตัดผมมืออาชีพ (Senior Barber)');
      setDepartment(slip.department || barber?.department || 'แผนกช่างผมและบริการ');
      setIdCardNumber(slip.idCardNumber || barber?.idCardNumber || '-');
      setBankName(slip.bankName || barber?.bankName || 'กสิกรไทย (KBANK)');
      setBankAccountNumber(slip.bankAccountNumber || barber?.bankAccountNumber || '-');
      setPaymentDate(slip.paymentDate || new Date().toISOString().split('T')[0]);
      setPaymentMethod(slip.paymentMethod || 'โอนเงินผ่านบัญชีธนาคาร');
      setStatus(slip.status || 'PENDING');

      setHeadsCount(slip.headsCount ?? 0);
      setHaircutSalesTotal(slip.haircutSalesTotal ?? 0);
      setHaircutComPercent(slip.haircutComPercent ?? barber?.haircutCommissionRate ?? 50);
      setHaircutCommission(slip.haircutCommission ?? 0);

      setChemicalSalesTotal(slip.chemicalSalesTotal ?? 0);
      setChemicalComPercent(slip.chemicalComPercent ?? barber?.chemicalCommissionRate ?? 40);
      setChemicalCommission(slip.chemicalCommission ?? 0);

      setProductSalesTotal(slip.productSalesTotal ?? 0);
      setProductComPercent(slip.productComPercent ?? barber?.productCommissionRate ?? 10);
      setProductCommission(slip.productCommission ?? 0);

      setBaseSalary(slip.baseSalary ?? barber?.baseSalary ?? 15000);
      setOvertimePay(slip.overtimePay ?? 0);
      setAttendanceBonus(slip.attendanceBonus ?? 0);
      setPositionAllowance(slip.positionAllowance ?? barber?.roleAllowance ?? 0);
      setTransportAllowance(slip.transportAllowance ?? 0);
      setSpecialBonus(slip.specialBonus ?? 0);
      setTipTotal(slip.tipTotal ?? 0);
      setOtherEarnings(slip.otherEarnings ?? 0);
      setOtherEarningsDescription(slip.otherEarningsDescription || 'เงินพิเศษอื่นๆ');

      setAdvanceDeduction(slip.advanceDeduction ?? 0);
      setSocialSecurity(slip.socialSecurity ?? 0);
      setTaxPercent(slip.taxPercent ?? 0);
      setTaxDeduction(slip.taxDeduction ?? 0);
      setProvidentFund(slip.providentFund ?? 0);
      setLateAbsenceDeduction(slip.lateAbsenceDeduction ?? 0);
      setUniformToolDeduction(slip.uniformToolDeduction ?? 0);
      setOtherDeduction(slip.otherDeduction ?? 0);
      setOtherDeductionDescription(slip.otherDeductionDescription || 'หักค่าปรับ/อื่นๆ');
      setNotes(slip.notes || '');
    } else if (barber) {
      setEmployeeCode(barber.employeeCode || 'EMP-001');
      setEmployeeName(barber.name || '');
      setNickname(barber.nickname || '');
      setPositionTitle(barber.positionTitle || 'ช่างตัดผมมืออาชีพ (Senior Barber)');
      setDepartment(barber.department || 'แผนกช่างผมและบริการ');
      setIdCardNumber(barber.idCardNumber || '-');
      setBankName(barber.bankName || 'กสิกรไทย (KBANK)');
      setBankAccountNumber(barber.bankAccountNumber || '-');
      setBaseSalary(barber.baseSalary || 15000);
      setPositionAllowance(barber.roleAllowance || 0);
      setHaircutComPercent(barber.haircutCommissionRate ?? 50);
      setChemicalComPercent(barber.chemicalCommissionRate ?? 40);
      setProductComPercent(barber.productCommissionRate ?? 10);
    }
  }, [slip, barber]);

  // =========================================================================
  // Mathematical Calculation Logic:
  // 1. ยอดรวมคอมมิชชั่น = ตัดผม + เคมี + สินค้า
  // 2. รายได้หลัก = Math.max(baseSalary, totalEarnedCommissions)
  //    - ถ้าทำยอดไม่ถึงฐาน (เช่น 1,200 < 15,000) -> ได้รายได้หลักเท่าฐานเงินเดือนการันตี (15,000)
  //      โดยมีค่าชดเชยการันตี (Guarantee Top-up) = 15,000 - 1,200 = 13,800 บาท
  //    - ถ้าทำยอดเกินฐาน (เช่น 17,000 > 15,000) -> ได้ตามยอดคอมมิชชั่นจริง (17,000)
  // 3. เงินเพิ่มพิเศษ (ค่าตำแหน่ง, OT, เบี้ยขยัน, ค่าเดินทาง, ทิป, โบนัส) = บวกเพิ่มให้ต่างหาก ไม่เกี่ยวกับยอดทำได้
  //    - เช่น ฐาน 15,000 + ค่าตำแหน่ง 3,000 -> ถ้าทำยอดไม่ถึงได้ 18,000 (15,000 + 3,000)
  //    - เช่น ฐาน 15,000 + ค่าตำแหน่ง 3,000 -> ถ้าทำยอดได้ 17,000 จะได้ 20,000 (17,000 + 3,000)
  // 4. Gross Earnings = รายได้หลัก + เงินเพิ่มพิเศษทั้งหมด
  // 5. Total Deductions = Advance + SSF + Tax + Provident + Late + Uniform + Other
  // 6. Net Payable = Gross Earnings - Total Deductions
  // =========================================================================
  const totalEarnedCommissions = haircutCommission + chemicalCommission + productCommission;
  const isCommissionBelowBase = totalEarnedCommissions < baseSalary;
  const autoGuaranteeTopup = isCommissionBelowBase ? Math.max(0, baseSalary - totalEarnedCommissions) : 0;
  const effectiveMainIncome = isCommissionBelowBase ? baseSalary : totalEarnedCommissions;

  // Additional Allowances (เงินเพิ่มพิเศษที่บวกให้ต่างหากเสมอ)
  const totalAllowances = 
    positionAllowance + 
    overtimePay + 
    attendanceBonus + 
    transportAllowance + 
    specialBonus + 
    tipTotal + 
    otherEarnings;

  // Gross Earnings = รายได้หลัก + เงินได้พิเศษ
  const grossEarnings = effectiveMainIncome + totalAllowances;

  // Auto calculate tax when taxPercent is changed
  const handleSelectTaxPercent = (pct: number) => {
    setTaxPercent(pct);
    if (pct <= 0) {
      setTaxDeduction(0);
    } else {
      setTaxDeduction(Math.round(grossEarnings * (pct / 100)));
    }
  };

  // Auto fetch advances from expenses
  const handleAutoFetchAdvances = () => {
    if (!barber) return;
    const barberExpensesAdvance = expenses
      .filter(
        (e) =>
          e.category === 'BARBER_ADVANCE' &&
          (e.barberId === barber.id || e.paidTo?.includes(barber.nickname) || e.payer?.includes(barber.nickname)) &&
          e.date.startsWith(selectedMonth)
      )
      .reduce((sum, e) => sum + e.amount, 0);
    setAdvanceDeduction(barberExpensesAdvance);
  };

  // Total Deductions
  const totalDeductions = 
    advanceDeduction + 
    socialSecurity + 
    taxDeduction + 
    providentFund + 
    lateAbsenceDeduction + 
    uniformToolDeduction + 
    otherDeduction;

  // Net Salary Payable
  const netPayable = Math.max(0, grossEarnings - totalDeductions);
  const bahtText = thaiBahtText(netPayable);

  // Quick helper to recalculate haircut com
  const handleUpdateHaircutSales = (sales: number, pct: number) => {
    setHaircutSalesTotal(sales);
    setHaircutComPercent(pct);
    setHaircutCommission(Math.round(sales * (pct / 100)));
  };

  // Quick helper to recalculate chemical com
  const handleUpdateChemicalSales = (sales: number, pct: number) => {
    setChemicalSalesTotal(sales);
    setChemicalComPercent(pct);
    setChemicalCommission(Math.round(sales * (pct / 100)));
  };

  // Quick helper to recalculate product com
  const handleUpdateProductSales = (sales: number, pct: number) => {
    setProductSalesTotal(sales);
    setProductComPercent(pct);
    setProductCommission(Math.round(sales * (pct / 100)));
  };

  // Save handler
  const handleSave = () => {
    if (!barber) return;
    const updatedSlip: SalarySlip = {
      id: slip?.id || `slip-${barber.id}-${selectedMonth}`,
      barberId: barber.id,
      barberName: employeeName,
      barberNickname: nickname,
      employeeCode,
      idCardNumber,
      bankName,
      bankAccountNumber,
      positionTitle,
      department,
      month: selectedMonth,
      period: periodText,
      issueDate: new Date().toISOString(),
      paymentDate,
      paymentMethod,
      
      baseSalary,
      minGuarantee: baseSalary,
      headsCount,
      haircutSalesTotal,
      haircutComPercent,
      haircutCommission,
      chemicalSalesTotal,
      chemicalComPercent,
      chemicalCommission,
      serviceSalesTotal: haircutSalesTotal + chemicalSalesTotal,
      serviceComPercent: haircutComPercent,
      serviceCommission: haircutCommission + chemicalCommission,
      productSalesTotal,
      productComPercent,
      productCommission,
      guaranteeTopup: autoGuaranteeTopup,
      overtimePay,
      attendanceBonus,
      positionAllowance,
      transportAllowance,
      specialBonus,
      tipTotal,
      otherEarnings,
      otherEarningsDescription,
      
      advanceDeduction,
      socialSecurity,
      taxPercent,
      taxDeduction,
      providentFund,
      lateAbsenceDeduction,
      uniformToolDeduction,
      otherDeduction,
      otherDeductionDescription,
      
      grossEarnings,
      totalDeductions,
      netPayable,
      status,
      paidAt: status === 'PAID' ? new Date().toISOString() : undefined,
      notes,
    };

    if (onSave) {
      onSave(updatedSlip);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('PREVIEW');
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !barber) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-5xl p-4 sm:p-6 shadow-2xl relative text-white max-h-[96vh] flex flex-col justify-between">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
              📑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                  สลิปเงินเดือน & รายได้ช่าง - {employeeName} (ช่าง{nickname})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-amber-300 border border-stone-700">
                  {periodText}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  status === 'PAID'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {status === 'PAID' ? '🟢 จ่ายเงินแล้ว' : '🟡 รอจ่ายเงิน'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                รหัสพนักงาน: <span className="text-stone-200 font-mono font-bold">{employeeCode}</span> | ตำแหน่ง: <span className="text-stone-200">{positionTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="bg-stone-950 p-1 rounded-2xl border border-stone-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'PREVIEW'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>พรีวิวสลิป</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EDIT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'EDIT'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขตัวเลข</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition cursor-pointer border border-stone-700"
              title="พิมพ์ใบสลิปเงินเดือน"
            >
              <Printer className="w-4 h-4 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 max-h-[calc(96vh-130px)]">
          
          {activeTab === 'EDIT' ? (
            /* ======================================================== */
            /* TAB 1: EDIT FORM (แก้ไขรายละเอียดและตัวเลขทั้งหมดได้อย่างอิสระ) */
            /* ======================================================== */
            <div className="space-y-4">
              {/* Formula & Policy Reminder Banner */}
              <div className="bg-gradient-to-r from-amber-950/40 via-stone-800/60 to-purple-950/40 border border-amber-500/30 rounded-2xl p-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-amber-300 text-xs">
                      สูตรการคำนวณเงินเดือนและการันตีรายได้ (Guaranteed Base vs Actual Commission):
                    </h5>
                    <p className="text-stone-300 leading-relaxed">
                      • <strong>รายได้หลัก:</strong> หากยอดคอมมิชชั่นรวม ({formatCurrency(totalEarnedCommissions)}) น้อยกว่าฐานการันตี ({formatCurrency(baseSalary)}) ช่างจะได้รับเต็มฐานการันตี <strong>{formatCurrency(baseSalary)} บาท</strong> (ระบบชดเชยส่วนต่าง +{formatCurrency(autoGuaranteeTopup)} บาทให้อัตโนมัติ)
                    </p>
                    <p className="text-purple-300 leading-relaxed">
                      • <strong>เงินเพิ่มพิเศษ (ค่าตำแหน่ง, OT, เบี้ยขยัน, ทิป, โบนัส):</strong> บวกเพิ่มให้ต่างหากเสมอในทุกกรณี ไม่นับรวมในฐานการันตี
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                      isCommissionBelowBase 
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30' 
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {isCommissionBelowBase 
                        ? `🛡️ รายได้หลัก: การันตีฐาน ${formatCurrency(baseSalary)} (ชดเชย +${formatCurrency(autoGuaranteeTopup)})` 
                        : `🌟 รายได้หลัก: ได้ตามยอดจริง ${formatCurrency(totalEarnedCommissions)}`}
                    </span>
                    {totalAllowances > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 font-bold border border-purple-500/30">
                        + เงินเพิ่มพิเศษ: {formatCurrency(totalAllowances)}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-black">
                      = รวมเงินได้ทั้งหมด: {formatCurrency(grossEarnings)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: ข้อมูลบริษัทและพนักงาน (Company & Employee Info) */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-4 space-y-3">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-700 pb-2">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. ข้อมูลพนักงาน & รายละเอียดการจ่ายเงิน (Employee & Pay Details)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">รหัสพนักงาน:</label>
                    <input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="EMP-001"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">ชื่อ-นามสกุล:</label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">ชื่อเล่น:</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">ตำแหน่งงาน:</label>
                    <input
                      type="text"
                      value={positionTitle}
                      onChange={(e) => setPositionTitle(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">แผนก:</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">เลขบัตรประชาชน (13 หลัก):</label>
                    <input
                      type="text"
                      value={idCardNumber}
                      onChange={(e) => setIdCardNumber(e.target.value)}
                      placeholder="1-1002-00345-67-8"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">ธนาคาร & เลขที่บัญชี:</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="ธนาคาร เช่น กสิกรไทย"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2 py-1.5 text-[11px] text-white focus:border-amber-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="เลขที่บัญชี"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2 py-1.5 text-[11px] text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 font-bold block mb-1">วันที่จ่ายเงิน & สถานะ:</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2 py-1.5 text-[11px] text-white font-mono focus:border-amber-400 focus:outline-none cursor-pointer"
                      />
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className={`w-full border rounded-xl px-2 py-1.5 text-[11px] font-bold focus:outline-none ${
                          status === 'PAID' ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200' : 'bg-amber-900/60 border-amber-500 text-amber-200'
                        }`}
                      >
                        <option value="PENDING">🟡 รอจ่าย</option>
                        <option value="PAID">🟢 จ่ายแล้ว</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Earnings & Deductions Tables (Editable Number Inputs) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 2.1 รายการได้ (EARNINGS) */}
                <div className="bg-stone-800/80 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                    <h4 className="font-extrabold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>รายการได้ (Earnings Breakdown)</span>
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      รวมได้: {formatCurrency(grossEarnings)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Sub-section A: รายได้หลักและการแจกแจงค่าบริการ */}
                    <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-amber-400" />
                          <span>ก. รายได้หลัก & แจกแจงยอดบริการ</span>
                        </span>
                        <span className="text-[10px] text-stone-400">
                          สรุปรายได้หลัก: <strong className="text-emerald-300 font-mono text-xs">{formatCurrency(effectiveMainIncome)}</strong>
                        </span>
                      </div>

                      {/* Base Salary Input */}
                      <div className="bg-stone-950/70 p-2.5 rounded-xl border border-cyan-500/30 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-cyan-300 text-xs block">ฐานเงินเดือนการันตี (Guaranteed Base):</span>
                            <span className="text-[10px] text-stone-400">รายได้การันตีขั้นต่ำต่อเดือนของช่าง</span>
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              value={baseSalary}
                              onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-cyan-500/50 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Haircut Service Breakdown */}
                      <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-stone-200 text-xs">งานตัดผม & บริการทั่วไป (Haircut & Shave):</span>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            จำนวนหัว: <input
                              type="number"
                              value={headsCount}
                              onChange={(e) => setHeadsCount(Number(e.target.value) || 0)}
                              className="w-12 bg-stone-900 border border-stone-700 rounded px-1 text-center text-amber-300 font-mono text-[11px]"
                            /> หัว
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] text-stone-400 block mb-0.5">ยอดขายบริการ (บาท):</label>
                            <input
                              type="number"
                              value={haircutSalesTotal}
                              onChange={(e) => handleUpdateHaircutSales(Number(e.target.value) || 0, haircutComPercent)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-stone-200 focus:border-amber-400 focus:outline-none"
                              placeholder="ยอดขายตัดผม"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-stone-400 block mb-0.5">อัตราคอม (%):</label>
                            <input
                              type="number"
                              value={haircutComPercent}
                              onChange={(e) => handleUpdateHaircutSales(haircutSalesTotal, Number(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-emerald-400 block mb-0.5 font-bold">คอมมิชชั่นที่ได้ (บาท):</label>
                            <input
                              type="number"
                              value={haircutCommission}
                              onChange={(e) => setHaircutCommission(Number(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Chemical Service Breakdown */}
                      <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                            <span className="font-bold text-stone-200 text-xs">งานบริการเคมี (Chemical - ดัด/ยืด/ทำสี):</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] text-stone-400 block mb-0.5">ยอดขายเคมี (บาท):</label>
                            <input
                              type="number"
                              value={chemicalSalesTotal}
                              onChange={(e) => handleUpdateChemicalSales(Number(e.target.value) || 0, chemicalComPercent)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-stone-200 focus:border-amber-400 focus:outline-none"
                              placeholder="ยอดขายเคมี"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-stone-400 block mb-0.5">อัตราคอม (%):</label>
                            <input
                              type="number"
                              value={chemicalComPercent}
                              onChange={(e) => handleUpdateChemicalSales(chemicalSalesTotal, Number(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-purple-300 focus:border-purple-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-emerald-400 block mb-0.5 font-bold">คอมมิชชั่นที่ได้ (บาท):</label>
                            <input
                              type="number"
                              value={chemicalCommission}
                              onChange={(e) => setChemicalCommission(Number(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Product Service Breakdown */}
                      <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-bold text-stone-200 text-xs">ยอดขายสินค้าหน้าร้าน (Products):</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] text-stone-400 block mb-0.5">ยอดขายสินค้า (บาท):</label>
                            <input
                              type="number"
                              value={productSalesTotal}
                              onChange={(e) => handleUpdateProductSales(Number(e.target.value) || 0, productComPercent)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-stone-200 focus:border-amber-400 focus:outline-none"
                              placeholder="ยอดขายสินค้า"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-stone-400 block mb-0.5">อัตราคอม (%):</label>
                            <input
                              type="number"
                              value={productComPercent}
                              onChange={(e) => handleUpdateProductSales(productSalesTotal, Number(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-blue-300 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-emerald-400 block mb-0.5 font-bold">คอมมิชชั่นที่ได้ (บาท):</label>
                            <input
                              type="number"
                              value={productCommission}
                              onChange={(e) => setProductCommission(Number(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Summary & Guarantee Status Indicator */}
                      <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isCommissionBelowBase 
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' 
                          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      }`}>
                        <div className="flex items-center justify-between font-bold">
                          <span>รวมคอมมิชชั่นที่ทำได้จริง:</span>
                          <span className="font-mono text-sm">{formatCurrency(totalEarnedCommissions)} บาท</span>
                        </div>
                        {isCommissionBelowBase ? (
                          <div className="flex items-center justify-between pt-1 border-t border-cyan-800/60 text-cyan-300">
                            <span>🛡️ เงินชดเชยการันตีรายได้ (Guarantee Top-up):</span>
                            <span className="font-bold font-mono">+{formatCurrency(autoGuaranteeTopup)} บาท</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-1 border-t border-emerald-800/60 text-emerald-300">
                            <span>⭐ ยอดคอมมิชชั่นเกินฐานการันตี:</span>
                            <span className="font-bold">ได้รับตามยอดจริง {formatCurrency(totalEarnedCommissions)} บาท</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub-section B: เงินได้บวกเพิ่มพิเศษ (บวกให้ต่างหากเสมอ) */}
                    <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-700/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-purple-300 text-[11px] uppercase tracking-wider">
                          ข. เงินเพิ่มพิเศษ & สวัสดิการ (บวกเพิ่มให้ต่างหาก)
                        </span>
                        <span className="text-[10px] text-purple-400">
                          รวมเงินเพิ่ม: <strong className="font-mono text-xs text-purple-300">+{formatCurrency(totalAllowances)}</strong>
                        </span>
                      </div>

                      {/* Role Allowance */}
                      <div className="flex items-center justify-between gap-3 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                        <div>
                          <span className="font-bold text-stone-200 block text-xs">ค่าตำแหน่ง / ทักษะพิเศษ (Position Allowance):</span>
                          <span className="text-[10px] text-stone-400">เงินประจำตำแหน่ง (บวกเพิ่มทุกกรณี)</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={positionAllowance}
                            onChange={(e) => setPositionAllowance(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Overtime Pay (OT) */}
                      <div className="flex items-center justify-between gap-3 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                        <div>
                          <span className="font-bold text-stone-200 block text-xs">ค่าล่วงเวลา (Overtime / OT):</span>
                          <span className="text-[10px] text-stone-400">ทำงานนอกเวลาปกติ</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={overtimePay}
                            onChange={(e) => setOvertimePay(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Attendance Bonus */}
                      <div className="flex items-center justify-between gap-3 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                        <div>
                          <span className="font-bold text-stone-200 block text-xs">เบี้ยขยัน (Attendance Bonus):</span>
                          <span className="text-[10px] text-stone-400">ไม่ขาด ไม่ลา ไม่มาสาย</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={attendanceBonus}
                            onChange={(e) => setAttendanceBonus(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Transport / Food Allowance */}
                      <div className="flex items-center justify-between gap-3 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                        <div>
                          <span className="font-bold text-stone-200 block text-xs">ค่าเดินทาง / ค่าอาหาร:</span>
                          <span className="text-[10px] text-stone-400">เบี้ยเลี้ยงการเดินทาง</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={transportAllowance}
                            onChange={(e) => setTransportAllowance(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Customer Tips */}
                      <div className="flex items-center justify-between gap-3 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                        <div>
                          <span className="font-bold text-stone-200 block text-xs">เงินทิปจากลูกค้า (Tips):</span>
                          <span className="text-[10px] text-stone-400">ทิปสะสมจากระบบ POS</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={tipTotal}
                            onChange={(e) => setTipTotal(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Bonus / Special Incentive */}
                      <div className="flex items-center justify-between gap-3 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                        <div>
                          <span className="font-bold text-stone-200 block text-xs">โบนัส / เงินรางวัลพิเศษ:</span>
                          <span className="text-[10px] text-stone-400">Performance Incentive</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={specialBonus}
                            onChange={(e) => setSpecialBonus(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Other Earnings */}
                      <div className="flex items-center justify-between gap-3 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={otherEarningsDescription}
                            onChange={(e) => setOtherEarningsDescription(e.target.value)}
                            placeholder="ชื่อรายได้อื่นๆ"
                            className="bg-transparent border-b border-stone-600 text-stone-200 font-bold text-xs pb-0.5 focus:outline-none focus:border-amber-400 w-full"
                          />
                          <span className="text-[10px] text-stone-400 block mt-0.5">รายได้อื่นๆ นอกเหนือจากข้างต้น</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={otherEarnings}
                            onChange={(e) => setOtherEarnings(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2.2 รายการหัก (DEDUCTIONS) */}
                <div className="bg-stone-800/80 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                    <h4 className="font-extrabold text-rose-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>รายการหัก (Deductions Breakdown)</span>
                    </h4>
                    <span className="text-[11px] font-bold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-500/30">
                      รวมหัก: -{formatCurrency(totalDeductions)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Advance Withdrawal */}
                    <div className="flex items-center justify-between gap-3 bg-stone-900/60 p-2 rounded-xl border border-stone-700/60">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-200 block text-xs">หักเงินเบิกล่วงหน้า (Advance):</span>
                          <button
                            type="button"
                            onClick={handleAutoFetchAdvances}
                            className="text-[10px] bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-600/40 px-1.5 py-0.5 rounded cursor-pointer transition font-bold"
                            title="ดึงยอดเบิกของช่างคนนี้จากบันทึกรายจ่ายร้าน"
                          >
                            ⚡ ดึงจากรายจ่ายร้าน
                          </button>
                        </div>
                        <span className="text-[10px] text-stone-400">เงินยืม/เงินเบิกระหว่างเดือน</span>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={advanceDeduction}
                          onChange={(e) => setAdvanceDeduction(Number(e.target.value) || 0)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Social Security */}
                    <div className="flex items-center justify-between gap-3 bg-stone-900/60 p-2 rounded-xl border border-stone-700/60">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-200 block text-xs">หักประกันสังคม (Social Security):</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSocialSecurity(750)}
                              className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded cursor-pointer transition"
                            >
                              750฿
                            </button>
                            <button
                              type="button"
                              onClick={() => setSocialSecurity(Math.min(750, Math.round(baseSalary * 0.05)))}
                              className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded cursor-pointer transition"
                            >
                              5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setSocialSecurity(0)}
                              className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded cursor-pointer transition"
                            >
                              0฿
                            </button>
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-400">เงินสมทบกองทุนประกันสังคม</span>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={socialSecurity}
                          onChange={(e) => setSocialSecurity(Number(e.target.value) || 0)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Withholding Tax with Percentage selection */}
                    <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5 text-rose-400" />
                            <span className="font-bold text-stone-200 text-xs">ภาษีหัก ณ ที่จ่าย (Withholding Tax):</span>
                          </div>
                          <span className="text-[10px] text-stone-400">ภาษีเงินได้หัก ณ ที่จ่าย เช่น ค่าจ้างทำของ/คอมมิชชั่น</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={taxDeduction}
                            onChange={(e) => setTaxDeduction(Number(e.target.value) || 0)}
                            className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                            placeholder="จำนวนเงินภาษี"
                          />
                        </div>
                      </div>

                      {/* Percentage Quick Presets */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-[10px]">
                        <span className="text-stone-400 font-bold">เลือกอัตราภาษี (%):</span>
                        <div className="flex items-center gap-1">
                          {[
                            { label: '0%', val: 0 },
                            { label: '1%', val: 1 },
                            { label: '3% (บริการ/ฟรีแลนซ์)', val: 3 },
                            { label: '5%', val: 5 },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => handleSelectTaxPercent(item.val)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                                taxPercent === item.val
                                  ? 'bg-rose-600 text-white font-black'
                                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Provident Fund */}
                    <div className="flex items-center justify-between gap-3 bg-stone-900/60 p-2 rounded-xl border border-stone-700/60">
                      <div>
                        <span className="font-bold text-stone-200 block text-xs">กองทุนสำรองเลี้ยงชีพ / สะสม:</span>
                        <span className="text-[10px] text-stone-400">Provident Fund Deduction</span>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={providentFund}
                          onChange={(e) => setProvidentFund(Number(e.target.value) || 0)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Late / Absence Deduction */}
                    <div className="flex items-center justify-between gap-3 bg-stone-900/60 p-2 rounded-xl border border-stone-700/60">
                      <div>
                        <span className="font-bold text-stone-200 block text-xs">หักขาดงาน / ลาเกิน / มาสาย:</span>
                        <span className="text-[10px] text-stone-400">Absence & Late Penalty</span>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={lateAbsenceDeduction}
                          onChange={(e) => setLateAbsenceDeduction(Number(e.target.value) || 0)}
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Uniform / Tools / Penalty */}
                    <div className="flex items-center justify-between gap-3 bg-stone-900/60 p-2 rounded-xl border border-stone-700/60">
                      <div>
                        <span className="font-bold text-stone-200 block text-xs">หักค่าชุดเครื่องแบบ / อุปกรณ์:</span>
                        <span className="text-[10px] text-stone-400">Uniform & Equipment Charge</span>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={uniformToolDeduction}
                          onChange={(e) => setUniformToolDeduction(Number(e.target.value) || 0)}
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Other Deductions */}
                    <div className="flex items-center justify-between gap-3 bg-stone-900/60 p-2 rounded-xl border border-stone-700/60">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={otherDeductionDescription}
                          onChange={(e) => setOtherDeductionDescription(e.target.value)}
                          placeholder="ชื่อรายการหักอื่นๆ"
                          className="bg-transparent border-b border-stone-600 text-stone-200 font-bold text-xs pb-0.5 focus:outline-none focus:border-rose-400 w-full"
                        />
                        <span className="text-[10px] text-stone-400 block mt-0.5">รายการหักอื่นๆ นอกเหนือจากข้างต้น</span>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={otherDeduction}
                          onChange={(e) => setOtherDeduction(Number(e.target.value) || 0)}
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Notes & Net Summary */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-[11px] text-stone-400 font-bold block mb-1">หมายเหตุท้ายสลิป (Remarks / Notes):</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น โอนเข้าบัญชีธนาคารเรียบร้อยแล้ว, ขอบคุณสำหรับความทุ่มเทในการทำงาน"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="bg-stone-950 border border-amber-500/40 rounded-2xl p-3.5 text-right min-w-[240px] shadow-md">
                  <span className="text-[11px] text-stone-400 font-bold block">
                    ยอดเงินได้สุทธิ (Net Payable):
                  </span>
                  <div className="text-2xl font-black text-amber-400 font-mono tracking-tight mt-0.5">
                    {formatCurrency(netPayable)}
                  </div>
                  <span className="text-[11px] text-amber-300/90 font-bold block mt-1">
                    ({bahtText})
                  </span>
                </div>
              </div>

              {/* Action Save Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('PREVIEW')}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>ดูพรีวิวตัวสลิป</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-stone-950" />
                      <span>บันทึกสำเร็จ!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>💾 บันทึกสลิปเงินเดือน</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 2: LIVE PREVIEW (สลิปเงินเดือนรูปแบบมาตรฐานบริษัทสวยงามและเป็นทางการ) */
            /* ======================================================== */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-stone-800/60 px-4 py-2 rounded-2xl border border-stone-700/60 text-xs text-stone-300">
                <span>📄 พรีวิวตัวสลิปเงินเดือนมาตรฐานบริษัท (พิมพ์บนกระดาษ A4/A5 ได้คมชัด)</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('EDIT')}
                  className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขตัวเลขในสลิป</span>
                </button>
              </div>

              {/* Printable Payslip Container */}
              <div
                id="printable-payslip"
                className="bg-white text-stone-900 font-sans p-6 sm:p-8 rounded-2xl shadow-2xl border border-stone-300 max-w-2xl mx-auto space-y-4"
              >
                {/* 1. Company Header */}
                <div className="flex justify-between items-start border-b-2 border-stone-900 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💈</span>
                      <h1 className="font-black text-lg text-stone-950 tracking-tight uppercase">
                        {settings.storeName}
                      </h1>
                    </div>
                    <p className="text-[11px] text-stone-600 max-w-sm leading-relaxed">{settings.address}</p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-600">
                      <span>โทร: <strong className="text-stone-800">{settings.phone}</strong></span>
                      {settings.taxId && (
                        <span>เลขประจำตัวผู้เสียภาษี: <strong className="text-stone-800 font-mono">{settings.taxId}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-block bg-stone-900 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg uppercase tracking-wider shadow-xs">
                      ใบจ่ายเงินเดือน & สลิปค่าตอบแทน
                    </div>
                    <p className="text-xs font-black text-stone-900 mt-1">{periodText}</p>
                    <p className="text-[11px] text-stone-500">
                      วันที่จ่ายเงิน: <strong className="text-stone-800 font-mono">{formatThaiDate(paymentDate)}</strong>
                    </p>
                  </div>
                </div>

                {/* 2. Employee Info Metadata Table */}
                <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-stone-500 block text-[10px]">รหัสพนักงาน (Emp Code):</span>
                      <strong className="text-stone-900 font-mono">{employeeCode}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px]">ชื่อ-นามสกุลพนักงาน:</span>
                      <strong className="text-stone-900">{employeeName}</strong>
                      <span className="text-amber-900 font-bold text-[11px] block">(ช่าง{nickname})</span>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px]">ตำแหน่ง / แผนก:</span>
                      <strong className="text-stone-900 block">{positionTitle}</strong>
                      <span className="text-stone-500 text-[10px] block">{department}</span>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px]">เลขบัตรประชาชน:</span>
                      <strong className="text-stone-800 font-mono text-[11px]">{idCardNumber}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px]">ธนาคารผู้รับเงิน:</span>
                      <strong className="text-stone-800">{bankName}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px]">เลขที่บัญชี:</span>
                      <strong className="text-stone-900 font-mono">{bankAccountNumber}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px]">ช่องทางการจ่าย:</span>
                      <strong className="text-stone-800">{paymentMethod}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px]">สถานะการจ่าย:</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {status === 'PAID' ? 'ชำระเรียบร้อย' : 'รอการจ่าย'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2.5 Performance & Service Commission Breakdown Box */}
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                    <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-stone-700" />
                      <span>รายละเอียดผลงานและค่าคอมมิชชั่นประจำงวด (Service & Commission Breakdown)</span>
                    </span>
                    <span className="text-[11px] font-bold text-stone-700 font-mono">
                      ฐานการันตี: {formatCurrency(baseSalary)} บาท
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    {/* Haircut Breakdown */}
                    <div className="bg-white p-2 rounded-lg border border-stone-200">
                      <span className="font-bold text-stone-800 block text-xs">✂️ งานตัดผม & โกนหนวด</span>
                      <div className="text-stone-600 mt-1 space-y-0.5">
                        {headsCount > 0 && <div>จำนวน: <strong>{headsCount} หัว</strong></div>}
                        <div>ยอดบริการ: <strong>{formatCurrency(haircutSalesTotal)}</strong> บ.</div>
                        <div>อัตราคอม: <strong>{haircutComPercent}%</strong></div>
                        <div className="text-emerald-800 font-bold pt-1 border-t border-stone-100 flex justify-between">
                          <span>ค่าคอมมิชชั่น:</span>
                          <span className="font-mono">+{formatCurrency(haircutCommission)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chemical Breakdown */}
                    <div className="bg-white p-2 rounded-lg border border-stone-200">
                      <span className="font-bold text-stone-800 block text-xs">🧪 งานบริการเคมี</span>
                      <div className="text-stone-600 mt-1 space-y-0.5">
                        <div>ยอดบริการเคมี: <strong>{formatCurrency(chemicalSalesTotal)}</strong> บ.</div>
                        <div>อัตราคอม: <strong>{chemicalComPercent}%</strong></div>
                        <div className="text-emerald-800 font-bold pt-1 border-t border-stone-100 flex justify-between">
                          <span>ค่าคอมมิชชั่น:</span>
                          <span className="font-mono">+{formatCurrency(chemicalCommission)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Products Breakdown */}
                    <div className="bg-white p-2 rounded-lg border border-stone-200">
                      <span className="font-bold text-stone-800 block text-xs">🧴 ยอดขายสินค้าหน้าร้าน</span>
                      <div className="text-stone-600 mt-1 space-y-0.5">
                        <div>ยอดขายสินค้า: <strong>{formatCurrency(productSalesTotal)}</strong> บ.</div>
                        <div>อัตราคอม: <strong>{productComPercent}%</strong></div>
                        <div className="text-emerald-800 font-bold pt-1 border-t border-stone-100 flex justify-between">
                          <span>ค่าคอมมิชชั่น:</span>
                          <span className="font-mono">+{formatCurrency(productCommission)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-100 px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold text-xs text-stone-800">
                    <span>รวมคอมมิชชั่นผลงานที่ทำได้จริง (Total Commission):</span>
                    <span className="font-mono font-black text-emerald-800">{formatCurrency(totalEarnedCommissions)} บาท</span>
                  </div>
                </div>

                {/* 3. Earnings & Deductions 2-Column Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  
                  {/* Left Column: รายการเงินได้ (EARNINGS) */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="bg-stone-100 text-stone-900 font-extrabold px-3 py-2 border-b border-stone-200 flex justify-between">
                        <span>รายการเงินได้ (EARNINGS)</span>
                        <span>จำนวนเงิน (บาท)</span>
                      </div>

                      <div className="divide-y divide-stone-100 px-3 py-1 text-stone-700">
                        {/* 1. Main Income: Guaranteed Base or Commissions */}
                        {isCommissionBelowBase ? (
                          <>
                            {/* Line 1: Actual commission */}
                            <div className="flex justify-between py-1.5">
                              <div>
                                <span className="text-stone-800 font-semibold block">ค่าคอมมิชชั่นผลงานที่ทำได้</span>
                                <span className="text-[10px] text-stone-500 block">Actual Commissions</span>
                              </div>
                              <span className="font-semibold text-emerald-800 font-mono self-center">+{formatCurrency(totalEarnedCommissions)}</span>
                            </div>

                            {/* Line 2: Guarantee Top-up */}
                            <div className="flex justify-between py-1.5 bg-cyan-50/70 -mx-3 px-3">
                              <div>
                                <span className="font-bold text-cyan-950 block">เงินชดเชยการันตีรายได้</span>
                                <span className="text-[10px] text-cyan-700 block">Guarantee Top-up (ชดเชยครบฐาน {formatCurrency(baseSalary)})</span>
                              </div>
                              <span className="font-bold font-mono text-cyan-900 self-center">+{formatCurrency(autoGuaranteeTopup)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {haircutCommission > 0 && (
                              <div className="flex justify-between py-1.5">
                                <div>
                                  <span className="text-stone-800 block">ค่าคอมมิชชั่นตัดผม ({haircutComPercent}%)</span>
                                  <span className="text-[10px] text-stone-400 block">Haircut Commission</span>
                                </div>
                                <span className="font-semibold text-emerald-800 font-mono self-center">+{formatCurrency(haircutCommission)}</span>
                              </div>
                            )}

                            {chemicalCommission > 0 && (
                              <div className="flex justify-between py-1.5">
                                <div>
                                  <span className="text-stone-800 block">ค่าคอมมิชชั่นเคมี ({chemicalComPercent}%)</span>
                                  <span className="text-[10px] text-stone-400 block">Chemical Commission</span>
                                </div>
                                <span className="font-semibold text-emerald-800 font-mono self-center">+{formatCurrency(chemicalCommission)}</span>
                              </div>
                            )}

                            {productCommission > 0 && (
                              <div className="flex justify-between py-1.5">
                                <div>
                                  <span className="text-stone-800 block">ค่าคอมมิชชั่นสินค้า ({productComPercent}%)</span>
                                  <span className="text-[10px] text-stone-400 block">Product Commission</span>
                                </div>
                                <span className="font-semibold text-emerald-800 font-mono self-center">+{formatCurrency(productCommission)}</span>
                              </div>
                            )}

                            <div className="text-[10px] text-emerald-700 font-semibold py-1 bg-emerald-50/50 -mx-3 px-3">
                              ✓ ยอดคอมมิชชั่นรวม {formatCurrency(totalEarnedCommissions)} (เกินฐานเงินเดือน {formatCurrency(baseSalary)} ได้รับตามยอดผลงานจริง)
                            </div>
                          </>
                        )}

                        {/* 2. Position Allowance (ค่าตำแหน่ง บวกเพิ่มให้ต่างหากเสมอ) */}
                        {positionAllowance > 0 && (
                          <div className="flex justify-between py-1.5 bg-purple-50/30 -mx-3 px-3">
                            <div>
                              <span className="font-semibold text-purple-950 block">ค่าตำแหน่ง / ทักษะพิเศษ</span>
                              <span className="text-[10px] text-purple-700/80 block">Position Allowance (เงินเพิ่มพิเศษ)</span>
                            </div>
                            <span className="font-bold font-mono text-purple-900 self-center">+{formatCurrency(positionAllowance)}</span>
                          </div>
                        )}

                        {/* OT */}
                        {overtimePay > 0 && (
                          <div className="flex justify-between py-1.5">
                            <div>
                              <span className="font-semibold text-stone-800 block">ค่าล่วงเวลา (Overtime)</span>
                              <span className="text-[10px] text-stone-400 block">OT</span>
                            </div>
                            <span className="font-semibold font-mono self-center">+{formatCurrency(overtimePay)}</span>
                          </div>
                        )}

                        {/* Attendance Bonus */}
                        {attendanceBonus > 0 && (
                          <div className="flex justify-between py-1.5">
                            <div>
                              <span className="font-semibold text-stone-800 block">เบี้ยขยัน (Attendance)</span>
                              <span className="text-[10px] text-stone-400 block">ไม่ขาด/ลา/มาสาย</span>
                            </div>
                            <span className="font-semibold font-mono self-center">+{formatCurrency(attendanceBonus)}</span>
                          </div>
                        )}

                        {/* Transport */}
                        {transportAllowance > 0 && (
                          <div className="flex justify-between py-1.5">
                            <div>
                              <span className="font-semibold text-stone-800 block">ค่าเดินทาง / เบี้ยเลี้ยง</span>
                              <span className="text-[10px] text-stone-400 block">Transport Allowance</span>
                            </div>
                            <span className="font-semibold font-mono self-center">+{formatCurrency(transportAllowance)}</span>
                          </div>
                        )}

                        {/* Tips */}
                        {tipTotal > 0 && (
                          <div className="flex justify-between py-1.5 text-amber-900 bg-amber-50/40 -mx-3 px-3">
                            <div>
                              <span className="font-semibold block">เงินทิปจากลูกค้า (Tips)</span>
                              <span className="text-[10px] text-amber-700/80 block">Customer Tips</span>
                            </div>
                            <span className="font-semibold font-mono self-center">+{formatCurrency(tipTotal)}</span>
                          </div>
                        )}

                        {/* Special Bonus */}
                        {specialBonus > 0 && (
                          <div className="flex justify-between py-1.5">
                            <div>
                              <span className="font-semibold text-stone-800 block">โบนัส / เงินรางวัลพิเศษ</span>
                              <span className="text-[10px] text-stone-400 block">Special Bonus</span>
                            </div>
                            <span className="font-semibold font-mono self-center">+{formatCurrency(specialBonus)}</span>
                          </div>
                        )}

                        {/* Other Earnings */}
                        {otherEarnings > 0 && (
                          <div className="flex justify-between py-1.5">
                            <div>
                              <span className="font-semibold text-stone-800 block">{otherEarningsDescription}</span>
                              <span className="text-[10px] text-stone-400 block">Other Earnings</span>
                            </div>
                            <span className="font-semibold font-mono self-center">+{formatCurrency(otherEarnings)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-stone-50 px-3 py-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                      <span>รวมเงินได้ทั้งหมด (Gross)</span>
                      <span className="text-emerald-800 font-mono text-sm">{formatCurrency(grossEarnings)}</span>
                    </div>
                  </div>

                  {/* Right Column: รายการหัก (DEDUCTIONS) */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="bg-stone-100 text-stone-900 font-extrabold px-3 py-2 border-b border-stone-200 flex justify-between">
                        <span>รายการหัก (DEDUCTIONS)</span>
                        <span>จำนวนเงิน (บาท)</span>
                      </div>

                      <div className="divide-y divide-stone-100 px-3 py-1 text-stone-700">
                        {/* Advance */}
                        {advanceDeduction > 0 && (
                          <div className="flex justify-between py-1.5">
                            <span>หักเบิกล่วงหน้า (Advance)</span>
                            <span className="font-semibold text-rose-700 font-mono">-{formatCurrency(advanceDeduction)}</span>
                          </div>
                        )}

                        {/* Social Security */}
                        {socialSecurity > 0 && (
                          <div className="flex justify-between py-1.5">
                            <span>หักประกันสังคม (SSF)</span>
                            <span className="font-semibold text-rose-700 font-mono">-{formatCurrency(socialSecurity)}</span>
                          </div>
                        )}

                        {/* Tax */}
                        {taxDeduction > 0 && (
                          <div className="flex justify-between py-1.5">
                            <div>
                              <span className="block">หักภาษี ณ ที่จ่าย (Withholding Tax)</span>
                              {taxPercent > 0 && <span className="text-[10px] text-stone-400 block">อัตรา {taxPercent}%</span>}
                            </div>
                            <span className="font-semibold text-rose-700 font-mono self-center">-{formatCurrency(taxDeduction)}</span>
                          </div>
                        )}

                        {/* Provident Fund */}
                        {providentFund > 0 && (
                          <div className="flex justify-between py-1.5">
                            <span>กองทุนสำรองเลี้ยงชีพ</span>
                            <span className="font-semibold text-rose-700 font-mono">-{formatCurrency(providentFund)}</span>
                          </div>
                        )}

                        {/* Late / Absence */}
                        {lateAbsenceDeduction > 0 && (
                          <div className="flex justify-between py-1.5">
                            <span>หักขาดงาน / มาสาย</span>
                            <span className="font-semibold text-rose-700 font-mono">-{formatCurrency(lateAbsenceDeduction)}</span>
                          </div>
                        )}

                        {/* Uniform / Tools */}
                        {uniformToolDeduction > 0 && (
                          <div className="flex justify-between py-1.5">
                            <span>หักค่าชุด / อุปกรณ์</span>
                            <span className="font-semibold text-rose-700 font-mono">-{formatCurrency(uniformToolDeduction)}</span>
                          </div>
                        )}

                        {/* Other Deduction */}
                        {otherDeduction > 0 && (
                          <div className="flex justify-between py-1.5">
                            <span>{otherDeductionDescription}</span>
                            <span className="font-semibold text-rose-700 font-mono">-{formatCurrency(otherDeduction)}</span>
                          </div>
                        )}

                        {totalDeductions === 0 && (
                          <div className="py-6 text-center text-stone-400 italic text-[11px]">
                            ไม่มีรายการหักในงวดนี้
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-stone-50 px-3 py-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                      <span>รวมรายการหัก (Deductions)</span>
                      <span className="text-rose-700 font-mono text-sm">
                        {totalDeductions > 0 ? `-${formatCurrency(totalDeductions)}` : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Net Salary Payable Box */}
                <div className="bg-stone-900 text-white p-4 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
                        ยอดเงินได้สุทธิที่ได้รับ (NET SALARY PAYABLE)
                      </span>
                      <span className="text-[10px] text-stone-400">
                        (รวมเงินได้ทั้งหมด - รวมรายการหัก)
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
                      {formatCurrency(netPayable)}
                    </span>
                  </div>

                  <div className="text-xs text-stone-200 font-bold pt-1.5 border-t border-stone-800 flex items-center justify-between">
                    <span>จำนวนเงินตัวอักษร:</span>
                    <span className="text-amber-200 font-bold">{bahtText}</span>
                  </div>
                </div>

                {/* Notes if any */}
                {notes && (
                  <div className="text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <strong>หมายเหตุ:</strong> {notes}
                  </div>
                )}

                {/* 5. Dual Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-300 text-center text-xs">
                  <div className="space-y-6">
                    <div className="border-b border-stone-400 w-44 mx-auto pt-6"></div>
                    <div>
                      <p className="font-bold text-stone-900">(........................................................)</p>
                      <p className="text-[11px] text-stone-500 font-medium">ผู้มีอำนาจจ่ายเงิน / ผู้จัดการร้าน</p>
                      <p className="text-[10px] text-stone-400">วันที่: ..... / ..... / ..........</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-stone-400 w-44 mx-auto pt-6"></div>
                    <div>
                      <p className="font-bold text-stone-900">{employeeName}</p>
                      <p className="text-[11px] text-stone-500 font-medium">พนักงานผู้รับเงิน (ช่าง{nickname})</p>
                      <p className="text-[10px] text-stone-400">วันที่: ..... / ..... / ..........</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">
              สถานะ: <strong className={status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}>
                {status === 'PAID' ? 'ชำระเงินแล้ว' : 'รอชำระเงิน'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>พิมพ์สลิป</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
