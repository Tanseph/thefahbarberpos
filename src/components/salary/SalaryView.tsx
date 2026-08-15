import React, { useState } from 'react';
import { Barber, Bill, Expense, SalarySlip, StoreSettings } from '../../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  User,
  Scissors,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  Percent,
  Coins,
  Sparkles,
  Edit3,
  Eye,
  PlusCircle,
  Building2,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatNumber, formatThaiMonthYear, getTodayDateString } from '../../utils/formatters';
import { SalarySlipModal } from './SalarySlipModal';

interface SalaryViewProps {
  bills: Bill[];
  barbers: Barber[];
  expenses: Expense[];
  salarySlips: SalarySlip[];
  settings: StoreSettings;
  onSaveSalarySlip: (slip: SalarySlip) => void;
  onUpdateBarber?: (barber: Barber) => void;
}

export const SalaryView: React.FC<SalaryViewProps> = ({
  bills,
  barbers,
  expenses,
  salarySlips,
  settings,
  onSaveSalarySlip,
  onUpdateBarber,
}) => {
  // Selected Month Filter (YYYY-MM)
  const currentYearMonth = getTodayDateString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [selectedBarberForSlip, setSelectedBarberForSlip] = useState<Barber | null>(null);

  // Month navigation helpers
  const handleStepMonth = (direction: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextY}-${nextM}`);
  };

  const handleSetMonthOffset = (offsetMonths: number) => {
    const today = new Date();
    const target = new Date(today.getFullYear(), today.getMonth() - offsetMonths, 1);
    const nextY = target.getFullYear();
    const nextM = String(target.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextY}-${nextM}`);
  };

  // Month Bills filter
  const monthBills = bills.filter((b) => b.status === 'COMPLETED' && b.date.startsWith(selectedMonth));

  // Compute live calculations for each barber in the selected month
  const barberPayrollData = barbers.filter((b) => b.isActive).map((barber) => {
    // 1. Calculate service sales, chemical sales, product sales done by this barber
    let haircutSales = 0;
    let chemicalSales = 0;
    let productSales = 0;
    let headsCount = 0;

    monthBills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (item.barberId === barber.id) {
          const itemTotal = item.isPackageRedemption ? 0 : item.price * item.quantity;
          if (item.category === 'HAIRCUT') {
            haircutSales += itemTotal;
            headsCount += item.quantity;
          } else if (item.category === 'CHEMICAL') {
            chemicalSales += itemTotal;
          } else if (item.category === 'PRODUCT') {
            productSales += itemTotal;
          } else {
            haircutSales += itemTotal;
            headsCount += item.quantity;
          }
        }
      });
    });

    const totalServiceSales = haircutSales + chemicalSales;

    // 2. Tips earned by this barber from POS
    const barberTips = monthBills
      .filter((b) => b.tipBarberId === barber.id && (b.tipAmount || 0) > 0)
      .reduce((sum, b) => sum + (b.tipAmount || 0), 0);

    // 3. Commissions Calculation
    const haircutComRate = (settings.haircutCommissionRate !== undefined ? settings.haircutCommissionRate : (barber.haircutCommissionRate ?? 50)) / 100;
    const chemicalComRate = (settings.chemicalCommissionRate !== undefined ? settings.chemicalCommissionRate : (barber.chemicalCommissionRate ?? 40)) / 100;
    const productComRate = (settings.productCommissionRate !== undefined ? settings.productCommissionRate : (barber.productCommissionRate ?? 10)) / 100;

    const haircutCommission = Math.round(haircutSales * haircutComRate);
    const chemicalCommission = Math.round(chemicalSales * chemicalComRate);
    const serviceCommission = haircutCommission + chemicalCommission;
    const productCommission = Math.round(productSales * productComRate);
    const totalCommissions = serviceCommission + productCommission;

    // 4. Base Salary & Guaranteed Income Rule:
    // "การคำนวนรายได้ของช่าง เป็นแบบนี้ เช่น เงินเดือน 15000 บาท แต่ถ้าเดือนนั้นทำยอดไม่ถึงฐานเงินเดือน ก็จะได้รายได้เป็นเท่าเงินเดือน แต่ถ้าทำยอดได้เกินเงินเดือน ก็จะได้ตามยอดที่ทำเลย"
    const existingSlip = salarySlips.find(
      (s) => s.barberId === barber.id && s.month === selectedMonth
    );

    const baseSalary = existingSlip?.baseSalary !== undefined 
      ? existingSlip.baseSalary 
      : (barber.baseSalary || barber.baseSalaryGuarantee || barber.minGuarantee || 15000);

    const isBelowBase = totalCommissions < baseSalary;
    const guaranteeTopup = isBelowBase ? (baseSalary - totalCommissions) : 0;
    const effectiveMainIncome = isBelowBase ? baseSalary : totalCommissions;

    // Additional earnings (บวกเพิ่มให้ต่างหากเสมอ เช่น ค่าตำแหน่ง, OT, เบี้ยขยัน, ทิป)
    const roleAllowance = existingSlip?.positionAllowance ?? barber.roleAllowance ?? 0;
    const overtimePay = existingSlip?.overtimePay ?? 0;
    const attendanceBonus = existingSlip?.attendanceBonus ?? 0;
    const transportAllowance = existingSlip?.transportAllowance ?? 0;
    const specialBonus = existingSlip?.specialBonus ?? 0;
    const otherEarnings = existingSlip?.otherEarnings ?? 0;
    const finalTips = existingSlip?.tipTotal !== undefined ? existingSlip.tipTotal : barberTips;

    const totalAllowances = roleAllowance + overtimePay + attendanceBonus + transportAllowance + specialBonus + otherEarnings + finalTips;

    // Gross Earnings = รายได้หลัก (ฐานการันตีหรือยอดคอมจริง) + เงินเพิ่มพิเศษทั้งหมด
    const grossEarnings = existingSlip?.grossEarnings !== undefined
      ? existingSlip.grossEarnings
      : (effectiveMainIncome + totalAllowances);

    // 5. Deductions
    // Auto calculate advances from expenses if not overridden in existing slip
    const barberExpensesAdvance = expenses
      .filter(
        (e) =>
          e.category === 'BARBER_ADVANCE' &&
          (e.barberId === barber.id || e.paidTo?.includes(barber.nickname) || e.payer?.includes(barber.nickname)) &&
          e.date.startsWith(selectedMonth)
      )
      .reduce((sum, e) => sum + e.amount, 0);

    const advanceDeduction = existingSlip?.advanceDeduction !== undefined 
      ? existingSlip.advanceDeduction 
      : barberExpensesAdvance;

    const socialSecurity = existingSlip?.socialSecurity ?? 0;
    const taxDeduction = existingSlip?.taxDeduction ?? 0;
    const providentFund = existingSlip?.providentFund ?? 0;
    const lateAbsenceDeduction = existingSlip?.lateAbsenceDeduction ?? 0;
    const uniformToolDeduction = existingSlip?.uniformToolDeduction ?? 0;
    const otherDeduction = existingSlip?.otherDeduction ?? 0;

    const totalDeductions = existingSlip?.totalDeductions !== undefined
      ? existingSlip.totalDeductions
      : (advanceDeduction + socialSecurity + taxDeduction + providentFund + lateAbsenceDeduction + uniformToolDeduction + otherDeduction);

    const netPayable = existingSlip?.netPayable !== undefined
      ? existingSlip.netPayable
      : Math.max(0, grossEarnings - totalDeductions);

    return {
      barber,
      headsCount,
      haircutSales,
      chemicalSales,
      productSales,
      totalServiceSales,
      haircutCommission,
      chemicalCommission,
      serviceCommission,
      productCommission,
      totalCommissions,
      barberTips: finalTips,
      baseSalary,
      isBelowBase,
      guaranteeTopup,
      roleAllowance,
      overtimePay,
      attendanceBonus,
      transportAllowance,
      specialBonus,
      otherEarnings,
      grossEarnings,
      advanceDeduction,
      socialSecurity,
      taxDeduction,
      providentFund,
      lateAbsenceDeduction,
      uniformToolDeduction,
      otherDeduction,
      totalDeductions,
      netPayable,
      status: existingSlip?.status || 'PENDING',
      slipId: existingSlip?.id,
      existingSlip,
    };
  });

  const totalPayrollGross = barberPayrollData.reduce((s, b) => s + b.grossEarnings, 0);
  const totalNetPayable = barberPayrollData.reduce((s, b) => s + b.netPayable, 0);
  const totalCommissions = barberPayrollData.reduce((s, b) => s + b.totalCommissions, 0);
  const totalTips = barberPayrollData.reduce((s, b) => s + b.barberTips, 0);
  const totalHeads = barberPayrollData.reduce((s, b) => s + b.headsCount, 0);

  const handleOpenSlip = (item: typeof barberPayrollData[0]) => {
    const slip: SalarySlip = item.existingSlip || {
      id: item.slipId || `slip-${item.barber.id}-${selectedMonth}`,
      barberId: item.barber.id,
      barberName: item.barber.name,
      barberNickname: item.barber.nickname,
      employeeCode: item.barber.employeeCode || 'EMP-001',
      idCardNumber: item.barber.idCardNumber || '-',
      bankName: item.barber.bankName || 'กสิกรไทย (KBANK)',
      bankAccountNumber: item.barber.bankAccountNumber || '-',
      positionTitle: item.barber.positionTitle || 'ช่างตัดผมมืออาชีพ (Senior Barber)',
      department: item.barber.department || 'แผนกช่างผมและบริการ',
      month: selectedMonth,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'โอนเงินผ่านบัญชีธนาคาร',
      
      baseSalary: item.baseSalary,
      minGuarantee: item.baseSalary,
      headsCount: item.headsCount,
      haircutSalesTotal: item.haircutSales,
      haircutComPercent: settings.haircutCommissionRate !== undefined ? settings.haircutCommissionRate : (item.barber.haircutCommissionRate ?? 50),
      haircutCommission: item.haircutCommission,
      chemicalSalesTotal: item.chemicalSales,
      chemicalComPercent: settings.chemicalCommissionRate !== undefined ? settings.chemicalCommissionRate : (item.barber.chemicalCommissionRate ?? 40),
      chemicalCommission: item.chemicalCommission,
      serviceSalesTotal: item.totalServiceSales,
      serviceComPercent: settings.haircutCommissionRate !== undefined ? settings.haircutCommissionRate : (item.barber.haircutCommissionRate ?? 50),
      serviceCommission: item.serviceCommission,
      productSalesTotal: item.productSales,
      productComPercent: settings.productCommissionRate !== undefined ? settings.productCommissionRate : (item.barber.productCommissionRate ?? 10),
      productCommission: item.productCommission,
      guaranteeTopup: item.guaranteeTopup,
      overtimePay: item.overtimePay,
      attendanceBonus: item.attendanceBonus,
      positionAllowance: item.roleAllowance,
      transportAllowance: item.transportAllowance,
      specialBonus: item.specialBonus,
      tipTotal: item.barberTips,
      otherEarnings: item.otherEarnings,
      
      advanceDeduction: item.advanceDeduction,
      socialSecurity: item.socialSecurity,
      taxPercent: item.existingSlip?.taxPercent ?? 0,
      taxDeduction: item.taxDeduction,
      providentFund: item.providentFund,
      lateAbsenceDeduction: item.lateAbsenceDeduction,
      uniformToolDeduction: item.uniformToolDeduction,
      otherDeduction: item.otherDeduction,
      
      grossEarnings: item.grossEarnings,
      totalDeductions: item.totalDeductions,
      netPayable: item.netPayable,
      status: item.status,
      paidAt: item.status === 'PAID' ? new Date().toISOString() : undefined,
    };

    setSelectedSlip(slip);
    setSelectedBarberForSlip(item.barber);
  };

  const handleTogglePaidStatus = (item: typeof barberPayrollData[0]) => {
    const nextStatus = item.status === 'PAID' ? 'PENDING' : 'PAID';
    const slip: SalarySlip = {
      ...(item.existingSlip || {
        id: item.slipId || `slip-${item.barber.id}-${selectedMonth}`,
        barberId: item.barber.id,
        barberName: item.barber.name,
        barberNickname: item.barber.nickname,
        month: selectedMonth,
        baseSalary: item.baseSalary,
        haircutCommission: item.haircutCommission,
        chemicalCommission: item.chemicalCommission,
        serviceSalesTotal: item.totalServiceSales,
        serviceComPercent: item.barber.haircutCommissionRate || 50,
        serviceCommission: item.serviceCommission,
        productSalesTotal: item.productSales,
        productComPercent: item.barber.productCommissionRate || 10,
        productCommission: item.productCommission,
        guaranteeTopup: item.guaranteeTopup,
        overtimePay: item.overtimePay,
        attendanceBonus: item.attendanceBonus,
        positionAllowance: item.roleAllowance,
        transportAllowance: item.transportAllowance,
        specialBonus: item.specialBonus,
        tipTotal: item.barberTips,
        otherEarnings: item.otherEarnings,
        advanceDeduction: item.advanceDeduction,
        socialSecurity: item.socialSecurity,
        taxDeduction: item.taxDeduction,
        providentFund: item.providentFund,
        lateAbsenceDeduction: item.lateAbsenceDeduction,
        uniformToolDeduction: item.uniformToolDeduction,
        otherDeduction: item.otherDeduction,
        grossEarnings: item.grossEarnings,
        totalDeductions: item.totalDeductions,
        netPayable: item.netPayable,
      }),
      status: nextStatus,
      paidAt: nextStatus === 'PAID' ? new Date().toISOString() : undefined,
    };

    onSaveSalarySlip(slip);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 font-black flex items-center justify-center text-xl shadow-xs shrink-0">
            📑
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                สลิปเงินเดือน & รายได้ค่าคอมมิชชั่นช่าง (PAYROLL & COMMISSION)
              </h2>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                ประกันฐานเงินเดือน + คอมมิชชั่นผลงาน
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              คำนวณฐานเงินเดือนการันตี (หากทำยอดไม่ถึงได้เท่าฐานเงินเดือน หากทำเกินได้ตามจริง) พร้อมปรับแต่งสลิปและพิมพ์ใบสลิปมาตรฐานบริษัท
            </p>
          </div>
        </div>

        {/* Month Selector Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start sm:justify-end">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => handleStepMonth(-1)}
              className="p-1.5 rounded-xl bg-white hover:bg-stone-200 text-stone-700 shadow-2xs transition cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleStepMonth(1)}
              className="p-1.5 rounded-xl bg-white hover:bg-stone-200 text-stone-700 shadow-2xs transition cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSetMonthOffset(0)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedMonth === currentYearMonth
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => handleSetMonthOffset(1)}
              className="px-2.5 py-2 rounded-xl text-xs font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition cursor-pointer"
            >
              เดือนที่แล้ว
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* 1. Total Net Payable */}
        <div className="bg-amber-50/80 border border-amber-300 rounded-3xl p-4 shadow-xs">
          <span className="text-xs font-bold text-amber-950 block">ยอดจ่ายเงินเดือนสุทธิรวม</span>
          <div className="text-2xl font-black text-amber-950 font-mono mt-1">
            {formatCurrency(totalNetPayable)}
          </div>
          <span className="text-[11px] text-amber-800 font-medium mt-0.5 block">
            สำหรับช่างทั้งหมด {barberPayrollData.length} ท่าน
          </span>
        </div>

        {/* 2. Total Commissions */}
        <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs">
          <span className="text-xs font-bold text-stone-600 block">ค่าคอมมิชชั่นรวมทั้งร้าน</span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {formatCurrency(totalCommissions)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
            งานตัดผม + เคมี + ขายสินค้า
          </span>
        </div>

        {/* 3. Total Tips */}
        <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs">
          <span className="text-xs font-bold text-stone-600 block">เงินทิปสะสมรวม</span>
          <div className="text-2xl font-black text-cyan-700 font-mono mt-1">
            {formatCurrency(totalTips)}
          </div>
          <span className="text-[11px] text-stone-400 font-medium mt-0.5 block">
            ทิปตรงจากลูกค้า
          </span>
        </div>

        {/* 4. Total Heads Handled */}
        <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs">
          <span className="text-xs font-bold text-stone-600 block">จำนวนหัวที่ตัดทั้งหมด</span>
          <div className="text-2xl font-black text-stone-900 font-mono mt-1">
            {formatNumber(totalHeads)} <span className="text-sm font-bold text-stone-500">หัว</span>
          </div>
          <span className="text-[11px] text-stone-400 font-medium mt-0.5 block">
            จากทั้งหมด {monthBills.length} บิล
          </span>
        </div>
      </div>

      {/* Main Barber Payroll Table */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-600" />
              ตารางสรุปรายได้และค่าคอมรายบุคคล ({formatThaiMonthYear(selectedMonth)})
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              คลิกปุ่ม <strong>"แก้ไข / สลิปเงินเดือน"</strong> เพื่อปรับแต่งตัวเลข กรอกรายการหัก/เบิก หรือพิมพ์สลิปเงินเดือนมาตรฐาน
            </p>
          </div>

          <span className="text-xs text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl font-bold border border-amber-200">
            รอบเดือน: {formatThaiMonthYear(selectedMonth)}
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">ช่างผู้ให้บริการ</th>
                <th className="p-3 text-center">จำนวนหัว</th>
                <th className="p-3 text-right">ยอดตัดผม</th>
                <th className="p-3 text-right">ยอดเคมี</th>
                <th className="p-3 text-right">ยอดสินค้า</th>
                <th className="p-3 text-right">ค่าคอมที่ทำได้</th>
                <th className="p-3 text-right">ฐานการันตี</th>
                <th className="p-3 text-right">รายได้หลักที่ได้</th>
                <th className="p-3 text-right">ทิป/อื่นๆ</th>
                <th className="p-3 text-right">หักเบิก/SSF</th>
                <th className="p-3 text-right">ยอดสุทธิ (Net)</th>
                <th className="p-3 text-center">สถานะ</th>
                <th className="p-3 text-center">จัดการสลิป</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {barberPayrollData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <User className="w-8 h-8 text-stone-300" />
                      <p className="text-sm font-bold text-stone-600">ยังไม่มีข้อมูลช่างในระบบ</p>
                      <p className="text-xs text-stone-400">กรุณาเพิ่มรายชื่อช่างในเมนู "ตั้งค่าระบบ" เพื่อเริ่มคำนวณเงินเดือนและค่าคอมมิชชั่น</p>
                    </div>
                  </td>
                </tr>
              ) : (
                barberPayrollData.map((item) => {
                const isPaid = item.status === 'PAID';
                return (
                  <tr key={item.barber.id} className="hover:bg-amber-50/30 transition">
                    {/* Barber Name */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: item.barber.color || '#D97706' }}
                        >
                          {item.barber.nickname.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-stone-900 font-bold text-sm">
                              ช่าง{item.barber.nickname}
                            </strong>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ({item.barber.employeeCode || 'EMP'})
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 block">{item.barber.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Heads */}
                    <td className="p-3 text-center font-bold text-stone-800">
                      {item.headsCount} หัว
                    </td>

                    {/* Haircut Sales */}
                    <td className="p-3 text-right font-mono text-stone-700">
                      {formatCurrency(item.haircutSales)}
                    </td>

                    {/* Chemical Sales */}
                    <td className="p-3 text-right font-mono text-stone-700">
                      {formatCurrency(item.chemicalSales)}
                    </td>

                    {/* Product Sales */}
                    <td className="p-3 text-right font-mono text-stone-700">
                      {formatCurrency(item.productSales)}
                    </td>

                    {/* Commissions Earned */}
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      +{formatCurrency(item.totalCommissions)}
                    </td>

                    {/* Base Salary Guarantee */}
                    <td className="p-3 text-right text-stone-700 font-mono">
                      {formatCurrency(item.baseSalary)}
                    </td>

                    {/* Effective Main Income according to Rule */}
                    <td className="p-3 text-right">
                      {item.isBelowBase ? (
                        <div>
                          <span className="font-bold text-amber-900 font-mono block">
                            {formatCurrency(item.baseSalary)}
                          </span>
                          <span className="text-[10px] text-cyan-700 font-bold block">
                            ชดเชย +{formatCurrency(item.guaranteeTopup)}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-emerald-800 font-mono block">
                            {formatCurrency(item.totalCommissions)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            🌟 ทะลุเป้า
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Tips & Extras */}
                    <td className="p-3 text-right font-mono text-cyan-700">
                      +{formatCurrency(item.barberTips + item.roleAllowance + item.overtimePay + item.attendanceBonus + item.specialBonus + item.otherEarnings)}
                    </td>

                    {/* Deductions */}
                    <td className="p-3 text-right font-mono text-rose-600">
                      {item.totalDeductions > 0 ? `-${formatCurrency(item.totalDeductions)}` : '0฿'}
                    </td>

                    {/* Net Payable */}
                    <td className="p-3 text-right font-mono font-black text-sm text-amber-950 bg-amber-50/60">
                      {formatCurrency(item.netPayable)}
                    </td>

                    {/* Status Badge & Toggle */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleTogglePaidStatus(item)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {isPaid ? '🟢 จ่ายแล้ว' : '🟡 รอจ่าย'}
                      </button>
                    </td>

                    {/* View/Edit Slip Button */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenSlip(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs shadow-2xs transition cursor-pointer active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>สลิปเงินเดือน</span>
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
            <tfoot className="bg-stone-900 text-white font-mono text-xs border-t-2 border-stone-800">
              <tr>
                <td className="p-3 font-sans font-bold text-amber-300">รวมทั้งหมด ({barberPayrollData.length} ท่าน)</td>
                <td className="p-3 text-center font-sans font-black text-amber-300">{totalHeads} หัว</td>
                <td className="p-3 text-right font-bold text-stone-200">
                  {formatCurrency(barberPayrollData.reduce((s, b) => s + b.haircutSales, 0))}
                </td>
                <td className="p-3 text-right font-bold text-stone-200">
                  {formatCurrency(barberPayrollData.reduce((s, b) => s + b.chemicalSales, 0))}
                </td>
                <td className="p-3 text-right font-bold text-stone-200">
                  {formatCurrency(barberPayrollData.reduce((s, b) => s + b.productSales, 0))}
                </td>
                <td className="p-3 text-right font-black text-emerald-300">
                  +{formatCurrency(totalCommissions)}
                </td>
                <td className="p-3 text-right font-bold text-stone-300">
                  {formatCurrency(barberPayrollData.reduce((s, b) => s + b.baseSalary, 0))}
                </td>
                <td className="p-3 text-right font-bold text-amber-300">
                  {formatCurrency(barberPayrollData.reduce((s, b) => s + (b.isBelowBase ? b.baseSalary : b.totalCommissions), 0))}
                </td>
                <td className="p-3 text-right font-black text-cyan-300">
                  +{formatCurrency(totalTips)}
                </td>
                <td className="p-3 text-right font-bold text-rose-300">
                  -{formatCurrency(barberPayrollData.reduce((s, b) => s + b.totalDeductions, 0))}
                </td>
                <td className="p-3 text-right font-black text-amber-300 text-sm bg-stone-800">
                  {formatCurrency(totalNetPayable)}
                </td>
                <td colSpan={2} className="p-3 text-center font-sans text-[11px] text-stone-400">
                  ครบถ้วนทุกช่าง
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payslip Modal with Edit & Live Preview */}
      <SalarySlipModal
        isOpen={!!selectedSlip}
        onClose={() => {
          setSelectedSlip(null);
          setSelectedBarberForSlip(null);
        }}
        slip={selectedSlip}
        barber={selectedBarberForSlip}
        settings={settings}
        expenses={expenses}
        onSave={(updatedSlip) => {
          onSaveSalarySlip(updatedSlip);
          setSelectedSlip(updatedSlip);
        }}
      />
    </div>
  );
};
