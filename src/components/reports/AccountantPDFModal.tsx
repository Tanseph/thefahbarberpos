import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Calendar, 
  Users, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  Layers, 
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Bill, Expense, Barber, StoreSettings } from '../../types';
import { formatCurrency, formatNumber, formatThaiDate, formatThaiMonthYear, getTodayDateString } from '../../utils/formatters';

interface AccountantPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'DAILY' | 'MONTHLY';
  selectedDate: string;
  selectedMonth: string;
  bills: Bill[];
  expenses: Expense[];
  barbers: Barber[];
  settings: StoreSettings;
  onExportCSV?: () => void;
}

export const AccountantPDFModal: React.FC<AccountantPDFModalProps> = ({
  isOpen,
  onClose,
  reportType,
  selectedDate,
  selectedMonth,
  bills,
  expenses,
  barbers,
  settings,
  onExportCSV,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const reportRefNo = reportType === 'DAILY' 
    ? `REP-D-${selectedDate.replace(/-/g, '')}`
    : `REP-M-${selectedMonth.replace(/-/g, '')}`;

  // Filter bills & expenses based on type
  const targetBills = reportType === 'DAILY'
    ? bills.filter((b) => b.date.startsWith(selectedDate) && b.status !== 'VOIDED')
    : bills.filter((b) => b.date.startsWith(selectedMonth) && b.status !== 'VOIDED');

  const targetExpenses = reportType === 'DAILY'
    ? expenses.filter((e) => e.date.startsWith(selectedDate))
    : expenses.filter((e) => e.date.startsWith(selectedMonth));

  // 1. Core Financial Aggregates
  let totalCash = 0;
  let totalTransfer = 0;
  let totalHeads = 0;
  let haircutSales = 0;
  let chemicalSales = 0;
  let productSales = 0;
  let tipsTotal = 0;

  targetBills.forEach((bill) => {
    if (bill.paymentMethod === 'CASH') {
      totalCash += bill.grandTotal;
    } else if (bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY' || bill.paymentMethod === 'CREDIT_CARD') {
      totalTransfer += bill.grandTotal;
    } else if (bill.paymentMethod === 'SPLIT') {
      totalCash += bill.splitCashAmount || 0;
      totalTransfer += bill.splitTransferAmount || 0;
    } else if (bill.paymentMethod === 'MEMBER') {
      totalTransfer += bill.grandTotal;
    }

    if (bill.tipAmount) tipsTotal += bill.tipAmount;

    bill.items.forEach((item) => {
      if (item.category === 'HAIRCUT') {
        haircutSales += item.price * item.quantity - (item.discount || 0);
        totalHeads += item.quantity;
      } else if (item.category === 'CHEMICAL') {
        chemicalSales += item.price * item.quantity - (item.discount || 0);
      } else if (item.category === 'PRODUCT') {
        productSales += item.price * item.quantity - (item.discount || 0);
      } else {
        haircutSales += item.price * item.quantity - (item.discount || 0);
      }
    });
  });

  const grossRevenue = totalCash + totalTransfer;
  const totalExpensesAmount = targetExpenses.reduce((s, e) => s + e.amount, 0);
  const netIncome = grossRevenue - totalExpensesAmount;

  // 2. Expenses by Category for Accountants
  const expenseCategoryMap: Record<string, number> = {
    'UTILITIES': 0,
    'RENT': 0,
    'CHEMICALS_EQUIPMENT': 0,
    'SUPPLIES': 0,
    'FOOD_WELFARE': 0,
    'MAINTENANCE': 0,
    'MARKETING': 0,
    'BARBER_ADVANCE': 0,
    'OTHER': 0,
  };

  const categoryLabels: Record<string, string> = {
    'UTILITIES': 'ค่าน้ำ-ค่าไฟ-อินเทอร์เน็ต (Utilities)',
    'RENT': 'ค่าเช่าสถานที่ / ค่าบริการพื้นที่ (Rent)',
    'CHEMICALS_EQUIPMENT': 'ค่าอุปกรณ์-น้ำยาเคมีภัณฑ์ (Chemicals & Tools)',
    'SUPPLIES': 'ค่าของใช้สิ้นเปลืองในร้าน (Supplies)',
    'FOOD_WELFARE': 'ค่าอาหาร-สวัสดิการพนักงาน (Welfare & Meals)',
    'MAINTENANCE': 'ค่าซ่อมบำรุงรักษาอุปกรณ์ (Maintenance)',
    'MARKETING': 'ค่าโฆษณาและการตลาด (Marketing)',
    'BARBER_ADVANCE': 'เงินเบิกล่วงหน้าพนักงาน (Staff Advance)',
    'OTHER': 'ค่าใช้จ่ายเบ็ดเตล็ดอื่นๆ (Miscellaneous)',
  };

  targetExpenses.forEach((exp) => {
    const cat = exp.category || 'OTHER';
    expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + exp.amount;
  });

  // 3. Barber Breakdown
  const barberStats = barbers.map((b) => {
    const bBills = targetBills.filter((tb) =>
      tb.items.some((i) => i.barberId === b.id) || tb.tipBarberId === b.id
    );

    let bHeads = 0;
    let bHaircut = 0;
    let bChemical = 0;
    let bProduct = 0;
    let bTips = 0;

    bBills.forEach((tb) => {
      if (tb.tipBarberId === b.id && tb.tipAmount) {
        bTips += tb.tipAmount;
      }
      tb.items.forEach((item) => {
        if (item.barberId === b.id) {
          const itemAmt = item.price * item.quantity - (item.discount || 0);
          if (item.category === 'HAIRCUT') {
            bHaircut += itemAmt;
            bHeads += item.quantity;
          } else if (item.category === 'CHEMICAL') {
            bChemical += itemAmt;
          } else if (item.category === 'PRODUCT') {
            bProduct += itemAmt;
          } else {
            bHaircut += itemAmt;
          }
        }
      });
    });

    const bTotal = bHaircut + bChemical + bProduct + bTips;
    return {
      barber: b,
      heads: bHeads,
      haircut: bHaircut,
      chemical: bChemical,
      product: bProduct,
      tips: bTips,
      total: bTotal,
    };
  }).filter((st) => st.total > 0 || st.heads > 0);

  // 4. Monthly Ledger Data (if MONTHLY)
  const [yearNum, monthNum] = selectedMonth.split('-').map((v) => parseInt(v, 10));
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const thaiDayNamesShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  interface MonthRow {
    dayNum: number;
    dayName: string;
    heads: number;
    cash: number;
    transfer: number;
    total: number;
    expenses: number;
    net: number;
    billsCount: number;
  }

  const monthlyLedgerRows: MonthRow[] = [];
  if (reportType === 'MONTHLY') {
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d.toString().padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayStr}`;
      const dateObj = new Date(yearNum, monthNum - 1, d);
      const dayOfWeek = dateObj.getDay();

      const dayBills = targetBills.filter((b) => b.date.startsWith(dateStr));
      const dayExpenses = targetExpenses.filter((e) => e.date.startsWith(dateStr));

      let dCash = 0;
      let dTransfer = 0;
      let dHeads = 0;

      dayBills.forEach((b) => {
        if (b.paymentMethod === 'CASH') dCash += b.grandTotal;
        else if (b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY' || b.paymentMethod === 'CREDIT_CARD' || b.paymentMethod === 'MEMBER') dTransfer += b.grandTotal;
        else if (b.paymentMethod === 'SPLIT') {
          dCash += b.splitCashAmount || 0;
          dTransfer += b.splitTransferAmount || 0;
        }

        const hCount = b.items.filter((i) => i.category === 'HAIRCUT').reduce((s, i) => s + i.quantity, 0);
        dHeads += hCount > 0 ? hCount : 1;
      });

      const dTotal = dCash + dTransfer;
      const dExp = dayExpenses.reduce((s, e) => s + e.amount, 0);

      monthlyLedgerRows.push({
        dayNum: d,
        dayName: thaiDayNamesShort[dayOfWeek],
        heads: dHeads,
        cash: dCash,
        transfer: dTransfer,
        total: dTotal,
        expenses: dExp,
        net: dTotal - dExp,
        billsCount: dayBills.length,
      });
    }
  }

  // --- PDF GENERATION ENGINE ---
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      // Create high-res canvas from the DOM container
      const element = printRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for crisp, print-quality text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Subsequent pages if long document
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const fileName = reportType === 'DAILY'
        ? `Accountant_Daily_Report_${selectedDate}_${settings.storeName.replace(/\s+/g, '_')}.pdf`
        : `Accountant_Monthly_Report_${selectedMonth}_${settings.storeName.replace(/\s+/g, '_')}.pdf`;

      pdf.save(fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง หรือใช้ปุ่มพิมพ์แทน');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-stone-100 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-stone-300 overflow-hidden my-auto">
        {/* Top Control Bar */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-base shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  {reportType === 'DAILY' ? 'รายงานสรุปบัญชีรายวัน (Daily Report)' : 'รายงานสรุปบัญชีรายเดือน (Monthly Accountant Ledger)'}
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  PDF Standard A4
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {reportType === 'DAILY' 
                  ? `ประจำวันที่ ${formatThaiDate(selectedDate, true)}`
                  : `ประจำเดือน ${formatThaiMonthYear(selectedMonth)} (งวดบัญชี)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-bold"
              title="พิมพ์เอกสารออกเครื่องพิมพ์"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์</span>
            </button>

            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer hidden md:flex items-center gap-1.5 text-xs font-bold"
                title="ส่งออกเป็นไฟล์ CSV/Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>CSV</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 rounded-xl text-xs font-black transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                  <span>ดาวน์โหลดสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-200/80 flex justify-center">
          {/* Printable A4 Styled Sheet */}
          <div 
            ref={printRef}
            id="accountant-pdf-sheet"
            className="w-full max-w-[800px] bg-white text-stone-900 p-8 sm:p-10 shadow-lg rounded-sm border border-stone-300 font-sans text-xs space-y-6"
            style={{ minHeight: '1120px' }}
          >
            {/* ================================================================= */}
            {/* 1. DOCUMENT HEADER & STORE IDENTITY */}
            {/* ================================================================= */}
            <div className="border-b-2 border-stone-900 pb-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl && (
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo" 
                        className="w-12 h-12 rounded-xl object-contain border border-stone-200"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <h1 className="text-xl font-black text-stone-950 tracking-tight">
                        {settings.storeName || 'Barber Shop POS'}
                      </h1>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                        Financial Statement & Revenue Accounting Report
                      </p>
                    </div>
                  </div>
                  {settings.taxId && (
                    <p className="text-[11px] text-stone-600 font-mono">
                      เลขประจำตัวผู้เสียภาษี (Tax ID): <strong>{settings.taxId}</strong>
                    </p>
                  )}
                </div>

                {/* Document Metadata Block */}
                <div className="text-right bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1 min-w-[200px]">
                  <div className="text-[10px] font-extrabold uppercase text-stone-500">
                    เลขที่เอกสาร / Ref No.
                  </div>
                  <div className="font-mono font-black text-xs text-stone-900">
                    {reportRefNo}
                  </div>
                  <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-200">
                    วันที่พิมพ์เอกสาร: <span className="font-semibold text-stone-800">{formatThaiDate(todayStr, true)}</span>
                  </div>
                  <div className="text-[10px] text-stone-500">
                    สถานะ: <span className="text-emerald-700 font-bold">● บัญชีสมบูรณ์ (Verified)</span>
                  </div>
                </div>
              </div>

              {/* Title Ribbon */}
              <div className="mt-4 pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-stone-900 uppercase">
                    {reportType === 'DAILY' ? '📋 รายงานสรุปรายได้และรายจ่ายประจำวัน' : '📊 รายงานสมุดรายวันรับ-จ่ายและงบกำไรขาดทุนประจำเดือน'}
                  </h2>
                  <p className="text-xs text-stone-600 font-medium">
                    สำหรับนักบัญชี, เจ้าหน้าที่การเงิน และยื่นภาษี (Accounting & Tax Clearance)
                  </p>
                </div>
                <div className="bg-amber-100 text-amber-950 font-black px-3 py-1.5 rounded-lg border border-amber-300 text-xs text-center font-mono">
                  {reportType === 'DAILY'
                    ? `งวดวันที่: ${formatThaiDate(selectedDate)}`
                    : `งวดบัญชี: ${formatThaiMonthYear(selectedMonth)}`}
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 2. EXECUTIVE FINANCIAL SUMMARY MATRIX (ตารางสรุป 6 ช่องสำคัญ) */}
            {/* ================================================================= */}
            <div>
              <div className="text-xs font-black uppercase text-stone-700 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>1. สรุปผลการดำเนินงานสุทธิ (Income Statement Summary)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {/* 1. Heads */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-stone-500">จำนวนหัวบริการ</div>
                  <div className="text-sm font-black text-stone-900 font-mono mt-0.5">
                    {formatNumber(totalHeads)} <span className="text-[10px] font-normal">หัว</span>
                  </div>
                  <div className="text-[9px] text-stone-400 font-mono">{targetBills.length} บิล</div>
                </div>

                {/* 2. Cash */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-emerald-800">เงินสดจริง (Cash)</div>
                  <div className="text-sm font-black text-emerald-800 font-mono mt-0.5">
                    {formatCurrency(totalCash)}
                  </div>
                  <div className="text-[9px] text-emerald-600 font-mono">ตรวจนับในลิ้นชัก</div>
                </div>

                {/* 3. Transfer */}
                <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-cyan-800">เงินโอน (Bank/QR)</div>
                  <div className="text-sm font-black text-cyan-800 font-mono mt-0.5">
                    {formatCurrency(totalTransfer)}
                  </div>
                  <div className="text-[9px] text-cyan-600 font-mono">ตรงกับ Statement</div>
                </div>

                {/* 4. Total Sales */}
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-black text-amber-950">รวมรายรับทั้งหมด</div>
                  <div className="text-sm font-black text-amber-950 font-mono mt-0.5">
                    {formatCurrency(grossRevenue)}
                  </div>
                  <div className="text-[9px] text-amber-800 font-mono">Gross Revenue</div>
                </div>

                {/* 5. Expenses */}
                <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-rose-800">ค่าใช้จ่ายรวม</div>
                  <div className="text-sm font-black text-rose-700 font-mono mt-0.5">
                    -{formatCurrency(totalExpensesAmount)}
                  </div>
                  <div className="text-[9px] text-rose-600 font-mono">{targetExpenses.length} รายการ</div>
                </div>

                {/* 6. Net Profit */}
                <div className="bg-stone-900 text-white rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold text-amber-300">กำไรสุทธิ (Net)</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">
                    {formatCurrency(netIncome)}
                  </div>
                  <div className="text-[9px] text-stone-300 font-mono">หลังหักค่าใช้จ่าย</div>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 3. REVENUE BREAKDOWN & PAYMENT METHOD RECONCILIATION */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Breakdown Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800 text-[11px] border-b border-stone-200 flex justify-between items-center">
                  <span>2. จำแนกรายรับตามหมวดหมู่บริการ (Revenue by Service)</span>
                  <span className="text-[10px] text-stone-500 font-mono">หน่วย: บาท (THB)</span>
                </div>
                <table className="w-full text-[11px] border-collapse font-sans">
                  <tbody className="divide-y divide-stone-100">
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-700">✂️ ค่าบริการตัดผม ออกแบบทรง (Haircuts)</td>
                      <td className="p-2 text-right font-mono font-bold text-stone-900">{formatCurrency(haircutSales)}</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-700">🧪 ค่าบริการเคมี ดัด/ยืด/ทำสี (Chemical)</td>
                      <td className="p-2 text-right font-mono font-bold text-stone-900">{formatCurrency(chemicalSales)}</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-700">🧴 ค่าขายสินค้าปลีก/ทรีตเมนต์ (Products)</td>
                      <td className="p-2 text-right font-mono font-bold text-stone-900">{formatCurrency(productSales)}</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-700">💖 เงินทิปพนักงาน (Tips Collected)</td>
                      <td className="p-2 text-right font-mono font-bold text-pink-600">{formatCurrency(tipsTotal)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-amber-50/70 border-t border-amber-200 font-bold font-mono">
                    <tr>
                      <td className="p-2 text-amber-950 font-sans font-black">รวมยอดขายและบริการทั้งหมด</td>
                      <td className="p-2 text-right text-amber-950 font-black text-xs">{formatCurrency(grossRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Reconciliation Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800 text-[11px] border-b border-stone-200 flex justify-between items-center">
                  <span>3. กระทบยอดการรับเงิน (Payment Method Reconciliation)</span>
                  <span className="text-[10px] text-stone-500 font-mono">ตรวจยอดจริง</span>
                </div>
                <table className="w-full text-[11px] border-collapse font-sans">
                  <tbody className="divide-y divide-stone-100">
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-700 flex items-center justify-between">
                        <span>💵 เงินสดในลิ้นชัก (Cash Inflow)</span>
                        <span className="text-[9px] text-stone-400 font-mono">
                          ({grossRevenue > 0 ? ((totalCash / grossRevenue) * 100).toFixed(1) : 0}%)
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-800">{formatCurrency(totalCash)}</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-700 flex items-center justify-between">
                        <span>📱 โอนผ่านบัญชี / QR PromptPay</span>
                        <span className="text-[9px] text-stone-400 font-mono">
                          ({grossRevenue > 0 ? ((totalTransfer / grossRevenue) * 100).toFixed(1) : 0}%)
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-cyan-800">{formatCurrency(totalTransfer)}</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-500">💳 บัตรเครดิต / ช่องทางอื่น</td>
                      <td className="p-2 text-right font-mono text-stone-400">฿0</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-2 text-stone-500">👥 หักจากกระเป๋าแพ็กเกจสมาชิก</td>
                      <td className="p-2 text-right font-mono text-stone-400">฿0</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-emerald-50/70 border-t border-emerald-200 font-bold font-mono">
                    <tr>
                      <td className="p-2 text-emerald-950 font-sans font-black">รวมยอดรับชำระสุทธิ (Reconciled)</td>
                      <td className="p-2 text-right text-emerald-950 font-black text-xs">{formatCurrency(totalCash + totalTransfer)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 4. EXPENSES STATEMENT BY ACCOUNTING CATEGORY */}
            {/* ================================================================= */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800 text-[11px] border-b border-stone-200 flex justify-between items-center">
                <span>4. จำแนกค่าใช้จ่ายตามผังบัญชี (Store Expenses by Account Classification)</span>
                <span className="text-[10px] text-rose-700 font-mono font-bold">
                  รวมรายจ่าย: {formatCurrency(totalExpensesAmount)}
                </span>
              </div>
              <div className="p-3 bg-white">
                {targetExpenses.length === 0 ? (
                  <div className="text-center py-3 text-stone-400 text-[11px]">
                    ไม่มีบันทึกรายการค่าใช้จ่ายในงวดนี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(expenseCategoryMap).map(([catKey, amount]) => {
                      if (amount === 0) return null;
                      return (
                        <div key={catKey} className="bg-stone-50 border border-stone-200 rounded-lg p-2 flex justify-between items-center text-[10px]">
                          <span className="text-stone-700 truncate mr-2">{categoryLabels[catKey] || catKey}</span>
                          <strong className="font-mono text-rose-700 shrink-0 font-bold">
                            {formatCurrency(amount)}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ================================================================= */}
            {/* 5. BARBER PRODUCTION & REVENUE LEDGER (ช่างและผลงาน) */}
            {/* ================================================================= */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800 text-[11px] border-b border-stone-200 flex justify-between items-center">
                <span>5. สรุปรายได้แยกตามช่างผู้ปฏิบัติงาน (Barber Production & Commission Log)</span>
                <span className="text-[10px] text-stone-500 font-mono">{barberStats.length} พนักงาน</span>
              </div>
              <table className="w-full text-[10.5px] border-collapse">
                <thead className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-2 text-left">ชื่อช่าง</th>
                    <th className="p-2 text-center">จำนวนหัว</th>
                    <th className="p-2 text-right">ค่าตัดผม (฿)</th>
                    <th className="p-2 text-right">ค่าเคมี (฿)</th>
                    <th className="p-2 text-right">ค่าสินค้า (฿)</th>
                    <th className="p-2 text-right">ทิป (฿)</th>
                    <th className="p-2 text-right font-black text-amber-950 bg-amber-50/60">รวมผลงาน (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {barberStats.map((st) => (
                    <tr key={st.barber.id} className="hover:bg-stone-50">
                      <td className="p-2 font-sans font-bold text-stone-900">
                        ช่าง{st.barber.nickname} <span className="text-[9px] text-stone-400 font-normal">({st.barber.name})</span>
                      </td>
                      <td className="p-2 text-center font-bold text-stone-800">{formatNumber(st.heads)} หัว</td>
                      <td className="p-2 text-right text-stone-700">{formatCurrency(st.haircut)}</td>
                      <td className="p-2 text-right text-stone-700">{formatCurrency(st.chemical)}</td>
                      <td className="p-2 text-right text-stone-700">{formatCurrency(st.product)}</td>
                      <td className="p-2 text-right text-pink-600">{formatCurrency(st.tips)}</td>
                      <td className="p-2 text-right font-black text-amber-950 bg-amber-50/30">{formatCurrency(st.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-100 font-mono font-bold text-stone-900 border-t-2 border-stone-300 text-[11px]">
                  <tr>
                    <td className="p-2 font-sans font-black">รวมพนักงานทุกคน</td>
                    <td className="p-2 text-center text-amber-900">{formatNumber(totalHeads)} หัว</td>
                    <td className="p-2 text-right">{formatCurrency(haircutSales)}</td>
                    <td className="p-2 text-right">{formatCurrency(chemicalSales)}</td>
                    <td className="p-2 text-right">{formatCurrency(productSales)}</td>
                    <td className="p-2 text-right text-pink-600">{formatCurrency(tipsTotal)}</td>
                    <td className="p-2 text-right font-black text-amber-950 bg-amber-100/70">{formatCurrency(grossRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ================================================================= */}
            {/* 6. MONTHLY DAILY JOURNAL TABLE (ถ้าเป็นรายงานรายเดือน) */}
            {/* ================================================================= */}
            {reportType === 'MONTHLY' && (
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800 text-[11px] border-b border-stone-200 flex justify-between items-center">
                  <span>6. สมุดรายวันรับ-จ่ายตลอดทั้งเดือน (Monthly Daily Journal Ledger)</span>
                  <span className="text-[10px] text-stone-500 font-mono">วันที่ 1 ถึง {daysInMonth} {formatThaiMonthYear(selectedMonth)}</span>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-[10px] border-collapse font-mono">
                    <thead className="sticky top-0 bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-1.5 text-center w-12 font-sans">วันที่</th>
                        <th className="p-1.5 text-center w-10 font-sans">วัน</th>
                        <th className="p-1.5 text-center font-sans">จำนวนหัว</th>
                        <th className="p-1.5 text-right text-emerald-800">เงินสด (฿)</th>
                        <th className="p-1.5 text-right text-cyan-800">เงินโอน (฿)</th>
                        <th className="p-1.5 text-right font-black text-amber-950 bg-amber-50/60">รวมยอดขาย (฿)</th>
                        <th className="p-1.5 text-right text-rose-700">ค่าใช้จ่าย (฿)</th>
                        <th className="p-1.5 text-right font-black text-stone-900">กำไรสุทธิ (฿)</th>
                        <th className="p-1.5 text-center w-14 font-sans">บิล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {monthlyLedgerRows.map((row) => (
                        <tr key={row.dayNum} className="hover:bg-stone-50">
                          <td className="p-1.5 text-center font-bold text-stone-900 font-sans">{row.dayNum}</td>
                          <td className={`p-1.5 text-center font-sans ${row.dayName === 'ส.' || row.dayName === 'อา.' ? 'text-rose-500 font-bold' : 'text-stone-500'}`}>
                            {row.dayName}
                          </td>
                          <td className="p-1.5 text-center font-sans">{row.heads > 0 ? `${row.heads} หัว` : '-'}</td>
                          <td className="p-1.5 text-right text-emerald-800">{row.cash > 0 ? formatCurrency(row.cash) : '0฿'}</td>
                          <td className="p-1.5 text-right text-cyan-800">{row.transfer > 0 ? formatCurrency(row.transfer) : '0฿'}</td>
                          <td className="p-1.5 text-right font-black text-amber-950 bg-amber-50/30">{row.total > 0 ? formatCurrency(row.total) : '0฿'}</td>
                          <td className="p-1.5 text-right text-rose-600">{row.expenses > 0 ? `-${formatCurrency(row.expenses)}` : '0฿'}</td>
                          <td className={`p-1.5 text-right font-black ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {formatCurrency(row.net)}
                          </td>
                          <td className="p-1.5 text-center font-sans text-stone-500">{row.billsCount > 0 ? `${row.billsCount}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-stone-900 text-white font-bold border-t border-stone-800 text-[10.5px]">
                      <tr>
                        <td colSpan={2} className="p-2 text-amber-300 font-sans">รวมทั้งเดือน</td>
                        <td className="p-2 text-center text-amber-300 font-sans">{formatNumber(totalHeads)} หัว</td>
                        <td className="p-2 text-right text-emerald-300">{formatCurrency(totalCash)}</td>
                        <td className="p-2 text-right text-cyan-300">{formatCurrency(totalTransfer)}</td>
                        <td className="p-2 text-right text-amber-300 font-black">{formatCurrency(grossRevenue)}</td>
                        <td className="p-2 text-right text-rose-300">-{formatCurrency(totalExpensesAmount)}</td>
                        <td className="p-2 text-right text-emerald-300 font-black">{formatCurrency(netIncome)}</td>
                        <td className="p-2 text-center text-stone-300 font-sans">{targetBills.length}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 7. DAILY BILL TRANSACTION LOG (ถ้าเป็นรายงานรายวัน) */}
            {/* ================================================================= */}
            {reportType === 'DAILY' && (
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800 text-[11px] border-b border-stone-200 flex justify-between items-center">
                  <span>6. บันทึกรายการบิลประจำวัน (Daily Transaction Register)</span>
                  <span className="text-[10px] text-stone-500 font-mono">{targetBills.length} บิล</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[10px] border-collapse font-mono">
                    <thead className="sticky top-0 bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-1.5 text-left font-sans">เวลา</th>
                        <th className="p-1.5 text-left">เลขที่บิล</th>
                        <th className="p-1.5 text-left font-sans">ลูกค้า</th>
                        <th className="p-1.5 text-left font-sans">ช่าง</th>
                        <th className="p-1.5 text-center font-sans">วิธีชำระ</th>
                        <th className="p-1.5 text-right font-black text-amber-950">ยอดสุทธิ (฿)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {targetBills.map((b) => {
                        const timeStr = b.date ? new Date(b.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
                        const barberNames = Array.from(new Set(b.items.map((i) => i.barberName))).join(', ');
                        return (
                          <tr key={b.id} className="hover:bg-stone-50">
                            <td className="p-1.5 text-stone-500 font-sans">{timeStr} น.</td>
                            <td className="p-1.5 font-bold text-stone-900">{b.billNumber}</td>
                            <td className="p-1.5 text-stone-700 font-sans">{b.memberName || 'Walk-in'}</td>
                            <td className="p-1.5 text-amber-900 font-sans font-bold">{barberNames || '-'}</td>
                            <td className="p-1.5 text-center font-sans">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                b.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                              }`}>
                                {b.paymentMethod === 'CASH' ? 'เงินสด' : 'เงินโอน'}
                              </span>
                            </td>
                            <td className="p-1.5 text-right font-black text-amber-950">{formatCurrency(b.grandTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 8. ACCOUNTANT SIGN-OFF & CERTIFICATION BLOCK */}
            {/* ================================================================= */}
            <div className="pt-6 border-t-2 border-stone-300">
              <div className="text-[10px] text-stone-400 italic mb-4 text-center">
                ข้าพเจ้าขอรับรองว่ารายการรายรับ-รายจ่าย ยอดเงินสด และเงินโอนทั้งหมดตามรายงานฉบับนี้ถูกต้องตามเอกสารหลักฐานจริงทุกประการ
              </div>
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                {/* Sign 1: Cashier / Prepared by */}
                <div className="space-y-2">
                  <div className="h-10 border-b border-stone-400 border-dashed flex items-end justify-center pb-1">
                    <span className="text-[10px] text-stone-400">ลงชื่อ .................................................</span>
                  </div>
                  <div className="font-bold text-stone-800 text-[11px]">(...................................................)</div>
                  <div className="text-[10px] text-stone-500">ผู้จัดทำรายงาน / แคชเชียร์ (Prepared by)</div>
                  <div className="text-[9px] text-stone-400">วันที่: ..... / ..... / ..........</div>
                </div>

                {/* Sign 2: Accountant / Verified by */}
                <div className="space-y-2">
                  <div className="h-10 border-b border-stone-400 border-dashed flex items-end justify-center pb-1">
                    <span className="text-[10px] text-stone-400">ลงชื่อ .................................................</span>
                  </div>
                  <div className="font-bold text-stone-800 text-[11px]">(...................................................)</div>
                  <div className="text-[10px] text-stone-500">ผู้ตรวจสอบ / นักบัญชี (Verified by)</div>
                  <div className="text-[9px] text-stone-400">วันที่: ..... / ..... / ..........</div>
                </div>

                {/* Sign 3: Owner / Approved by */}
                <div className="space-y-2">
                  <div className="h-10 border-b border-stone-400 border-dashed flex items-end justify-center pb-1">
                    <span className="text-[10px] text-stone-400">ลงชื่อ .................................................</span>
                  </div>
                  <div className="font-bold text-stone-800 text-[11px]">(...................................................)</div>
                  <div className="text-[10px] text-stone-500">เจ้าของกิจการ / ผู้อนุมัติ (Approved by)</div>
                  <div className="text-[9px] text-stone-400">วันที่: ..... / ..... / ..........</div>
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div className="mt-6 pt-3 border-t border-stone-200 flex justify-between items-center text-[9px] text-stone-400 font-mono">
                <span>System Generated by BarberShop POS &amp; Accounting System</span>
                <span>Ref: {reportRefNo} | Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar Actions */}
        <div className="bg-white px-5 py-3 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>เอกสารถูกจัดรูปแบบมาตรฐาน A4 สำหรับนำไปลงบันทึกโปรแกรมบัญชีและยื่นภาษี</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังแปลงไฟล์ PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด PDF ทันที</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
