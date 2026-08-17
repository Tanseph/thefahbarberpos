import React, { useState } from 'react';
import { Barber, Bill, Expense, ExpenseCategory, ServiceItem, StoreSettings, PaymentMethod } from '../../types';
import { 
  Users, 
  Calendar, 
  Wallet, 
  Download, 
  Printer, 
  Sparkles, 
  Scissors, 
  FlaskConical, 
  ShoppingBag, 
  HeartHandshake, 
  FileSpreadsheet, 
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  Receipt,
  Sun,
  Eye,
  ArrowRight,
  Filter,
  CheckCircle2,
  PieChart,
  BarChart3,
  Search,
  Edit,
  Trash2,
  Split,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingDown,
  Percent,
  CheckCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Trophy,
  Crown,
  Activity,
  Award,
  Zap
} from 'lucide-react';
import { 
  formatCurrency, 
  formatNumber, 
  formatThaiDate, 
  formatThaiMonthYear, 
  getCurrentPeriodString, 
  getTodayDateString 
} from '../../utils/formatters';
import { ReceiptModal } from '../pos/ReceiptModal';
import { EditBillModal } from '../pos/EditBillModal';
import { DeleteBillModal } from '../pos/DeleteBillModal';
import { MergeBillsModal } from '../pos/MergeBillsModal';
import { UnmergeConfirmModal } from '../pos/UnmergeConfirmModal';
import { AccountantPDFModal } from './AccountantPDFModal';

interface ReportsViewProps {
  bills: Bill[];
  expenses: Expense[];
  barbers: Barber[];
  services: ServiceItem[];
  settings: StoreSettings;
  onUpdateBill?: (bill: Bill) => void;
  onDeleteBill?: (billId: string) => void;
  onMergeBills?: (updatedBills: Bill[]) => void;
  onUnmergeBill?: (mergedBill: Bill) => void;
  onVoidBill?: (billId: string, reason: string) => void;
}

type MainReportTab = 'DAILY' | 'MONTHLY' | 'ALL_IN_ONE';

const EXPENSE_CATEGORIES_MAP: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  RENT: { label: 'ค่าเช่าร้าน', emoji: '🏢', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  CHEMICALS_EQUIPMENT: { label: 'เคมีภัณฑ์และอุปกรณ์', emoji: '🧪', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  SUPPLIES: { label: 'น้ำยา/ใบมีด/ของใช้สิ้นเปลือง', emoji: '🧴', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  UTILITIES: { label: 'ค่าน้ำ/ค่าไฟ/อินเทอร์เน็ต', emoji: '⚡', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  BARBER_ADVANCE: { label: 'เบิกเงินล่วงหน้าช่าง', emoji: '💵', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  SALARY_DRAW: { label: 'เบิกเงินล่วงหน้า/ค่าแรง', emoji: '💼', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  FOOD_WELFARE: { label: 'อาหารและสวัสดิการทีมงาน', emoji: '🍱', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  SNACK_DRINK: { label: 'น้ำดื่ม/ขนมรับรองลูกค้า', emoji: '☕', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  MARKETING: { label: 'การตลาดและโฆษณา', emoji: '📢', color: 'text-pink-700 bg-pink-50 border-pink-200' },
  MAINTENANCE: { label: 'ซ่อมแซมและบำรุงรักษา', emoji: '🔧', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  OTHER: { label: 'ค่าใช้จ่ายเบ็ดเตล็ด', emoji: '📦', color: 'text-stone-700 bg-stone-100 border-stone-200' },
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  bills,
  expenses,
  barbers,
  services,
  settings,
  onUpdateBill,
  onDeleteBill,
  onMergeBills,
  onUnmergeBill,
  onVoidBill,
}) => {
  const todayStr = getTodayDateString();
  const currentMonthStr = getCurrentPeriodString();

  // Top-level Navigation Mode: DAILY vs MONTHLY vs ALL_IN_ONE
  const [activeTab, setActiveTab] = useState<MainReportTab>('DAILY');

  // Selected filters
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [tableFilter, setTableFilter] = useState<'ALL_DAYS' | 'ACTIVE_DAYS'>('ALL_DAYS');
  const [billSearchQuery, setBillSearchQuery] = useState<string>('');
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<Bill | null>(null);

  // Modals for Bill Edit & Delete
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [unmergingBill, setUnmergingBill] = useState<Bill | null>(null);

  // Merge Bills Modal State
  const [isMergeBillsModalOpen, setIsMergeBillsModalOpen] = useState<boolean>(false);
  const [initialMergeBillIds, setInitialMergeBillIds] = useState<string[]>([]);

  const handleOpenMergeBillsModal = (preselectedBillId?: string) => {
    if (preselectedBillId) {
      setInitialMergeBillIds([preselectedBillId]);
    } else {
      setInitialMergeBillIds([]);
    }
    setIsMergeBillsModalOpen(true);
  };

  const handleConfirmMergeBills = (updatedBills: Bill[]) => {
    if (onMergeBills) {
      onMergeBills(updatedBills);
    } else if (onUpdateBill) {
      updatedBills.forEach((b) => onUpdateBill(b));
    }
  };

  // Accountant PDF Report Modal State
  const [showAccountantPDFModal, setShowAccountantPDFModal] = useState<boolean>(false);
  const [accountantPDFReportType, setAccountantPDFReportType] = useState<'DAILY' | 'MONTHLY'>('DAILY');

  const handleOpenPDFReport = (type: 'DAILY' | 'MONTHLY') => {
    setAccountantPDFReportType(type);
    setShowAccountantPDFModal(true);
  };

  // Quick switch payment method handler
  const handleQuickTogglePaymentMethod = (bill: Bill) => {
    if (!onUpdateBill) return;
    let nextMethod: PaymentMethod = 'TRANSFER';
    if (bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY') {
      nextMethod = 'CASH';
    } else if (bill.paymentMethod === 'CASH') {
      nextMethod = 'SPLIT';
    } else {
      nextMethod = 'TRANSFER';
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

  // Helper Date Shifts
  const handleSetDayOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    setSelectedDate(dateStr);
    setSelectedMonth(`${y}-${m}`);
  };

  const handleSetMonthOffset = (offsetMonths: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offsetMonths);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleStepMonth = (direction: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    const nextY = d.getFullYear();
    const nextM = (d.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${nextY}-${nextM}`);
  };

  // ==========================================
  // 1. FINANCIAL AGGREGATE CALCULATOR HELPER
  // ==========================================
  const calculateFinancialMetrics = (targetBills: Bill[], targetExpenses: Expense[]) => {
    const completedBills = targetBills.filter((b) => b.status === 'COMPLETED');
    const voidedBills = targetBills.filter((b) => b.status === 'VOIDED');

    let grossHaircut = 0;
    let grossChemical = 0;
    let grossProduct = 0;
    let grossPackage = 0;
    let grossOther = 0;
    let totalTips = 0;
    let totalDiscount = 0;
    let totalPointsDiscount = 0;
    let totalHeads = 0;

    let cashRevenue = 0;
    let transferRevenue = 0;
    let memberBalanceDeducted = 0;
    let splitCashTotal = 0;
    let splitTransferTotal = 0;

    completedBills.forEach((b) => {
      // Payment Breakdown
      if (b.paymentMethod === 'CASH') {
        cashRevenue += b.grandTotal;
      } else if (b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY' || b.paymentMethod === 'CREDIT_CARD') {
        transferRevenue += b.grandTotal;
      } else if (b.paymentMethod === 'SPLIT') {
        const c = b.splitCashAmount || 0;
        const t = b.splitTransferAmount || Math.max(0, b.grandTotal - c);
        cashRevenue += c;
        transferRevenue += t;
        splitCashTotal += c;
        splitTransferTotal += t;
      } else if (b.paymentMethod === 'MEMBER') {
        memberBalanceDeducted += b.grandTotal;
      }

      totalTips += b.tipAmount || 0;
      totalDiscount += b.discountTotal || 0;
      totalPointsDiscount += b.pointsDiscount || 0;

      let billHaircutCount = 0;
      b.items.forEach((item) => {
        const itemGross = item.price * item.quantity;
        if (item.category === 'HAIRCUT') {
          grossHaircut += itemGross;
          totalHeads += item.quantity;
          billHaircutCount += item.quantity;
        } else if (item.category === 'CHEMICAL') {
          grossChemical += itemGross;
        } else if (item.category === 'PRODUCT') {
          grossProduct += itemGross;
        } else if (item.category === 'PACKAGE') {
          grossPackage += itemGross;
        } else {
          grossOther += itemGross;
        }
      });

      // If no haircut items in bill, treat customer visit as 1 head
      if (billHaircutCount === 0 && b.items.length > 0) {
        totalHeads += 1;
      }
    });

    const grossSalesBeforeDiscount = grossHaircut + grossChemical + grossProduct + grossPackage + grossOther;
    const totalDiscountsGiven = totalDiscount + totalPointsDiscount;
    const grandTotalRevenue = completedBills.reduce((s, b) => s + b.grandTotal, 0);

    // Expenses Aggregates
    let totalExpenseAmount = 0;
    let cashExpenseAmount = 0;
    let transferExpenseAmount = 0;
    const expenseByCategory: Record<string, { label: string; emoji: string; amount: number; count: number }> = {};

    // Initialize all category keys
    Object.keys(EXPENSE_CATEGORIES_MAP).forEach((catKey) => {
      const info = EXPENSE_CATEGORIES_MAP[catKey as ExpenseCategory];
      expenseByCategory[catKey] = { label: info.label, emoji: info.emoji, amount: 0, count: 0 };
    });

    targetExpenses.forEach((exp) => {
      totalExpenseAmount += exp.amount;
      if (exp.paymentMethod === 'CASH') {
        cashExpenseAmount += exp.amount;
      } else {
        transferExpenseAmount += exp.amount;
      }

      const cat = exp.category || 'OTHER';
      if (!expenseByCategory[cat]) {
        const info = EXPENSE_CATEGORIES_MAP[cat as ExpenseCategory] || EXPENSE_CATEGORIES_MAP.OTHER;
        expenseByCategory[cat] = { label: info.label, emoji: info.emoji, amount: 0, count: 0 };
      }
      expenseByCategory[cat].amount += exp.amount;
      expenseByCategory[cat].count += 1;
    });

    // P&L Net
    const netOperatingProfit = grandTotalRevenue - totalExpenseAmount;
    const profitMarginPercent = grandTotalRevenue > 0 ? (netOperatingProfit / grandTotalRevenue) * 100 : 0;
    const netCashFlow = cashRevenue - cashExpenseAmount;

    // Average per Bill / Head
    const avgTicketSize = completedBills.length > 0 ? grandTotalRevenue / completedBills.length : 0;
    const avgPerHead = totalHeads > 0 ? grandTotalRevenue / totalHeads : 0;

    return {
      completedBills,
      voidedBills,
      totalBillsCount: completedBills.length,
      voidedBillsCount: voidedBills.length,
      totalHeads,
      grossHaircut,
      grossChemical,
      grossProduct,
      grossPackage,
      grossOther,
      grossSalesBeforeDiscount,
      totalDiscountsGiven,
      totalTips,
      grandTotalRevenue,
      cashRevenue,
      transferRevenue,
      memberBalanceDeducted,
      splitCashTotal,
      splitTransferTotal,
      totalExpenseAmount,
      cashExpenseAmount,
      transferExpenseAmount,
      expenseByCategory,
      netOperatingProfit,
      profitMarginPercent,
      netCashFlow,
      avgTicketSize,
      avgPerHead,
    };
  };

  // --- 2. BARBER PERFORMANCE CALCULATOR HELPER ---
  const calculateBarberStats = (targetBills: Bill[]) => {
    const completedBills = targetBills.filter((b) => b.status === 'COMPLETED');
    const stats = barbers.map((barber) => {
      let haircutSales = 0;
      let haircutCount = 0;
      let chemicalSales = 0;
      let chemicalCount = 0;
      let productSales = 0;
      let productCount = 0;
      let tipTotal = 0;

      completedBills.forEach((b) => {
        b.items.forEach((item) => {
          if (item.barberId === barber.id) {
            const itemTotal = item.isPackageRedemption ? 0 : item.price * item.quantity - (item.discount || 0);
            if (item.category === 'HAIRCUT') {
              haircutSales += itemTotal;
              haircutCount += item.quantity;
            } else if (item.category === 'CHEMICAL') {
              chemicalSales += itemTotal;
              chemicalCount += item.quantity;
            } else if (item.category === 'PRODUCT') {
              productSales += itemTotal;
              productCount += item.quantity;
            } else {
              haircutSales += itemTotal;
              haircutCount += item.quantity;
            }
          }
        });

        if (b.tipBarberId === barber.id) {
          tipTotal += b.tipAmount || 0;
        }
      });

      const totalSalesWithoutTip = haircutSales + chemicalSales + productSales;
      const totalGenerated = totalSalesWithoutTip + tipTotal;
      const totalHeads = haircutCount;

      return {
        barber,
        haircutSales,
        haircutCount,
        chemicalSales,
        chemicalCount,
        productSales,
        productCount,
        tipTotal,
        totalSalesWithoutTip,
        totalGenerated,
        totalHeads,
      };
    });

    const totalHaircut = stats.reduce((s, b) => s + b.haircutSales, 0);
    const totalHaircutCount = stats.reduce((s, b) => s + b.haircutCount, 0);
    const totalChemical = stats.reduce((s, b) => s + b.chemicalSales, 0);
    const totalChemicalCount = stats.reduce((s, b) => s + b.chemicalCount, 0);
    const totalProduct = stats.reduce((s, b) => s + b.productSales, 0);
    const totalProductCount = stats.reduce((s, b) => s + b.productCount, 0);
    const totalTips = stats.reduce((s, b) => s + b.tipTotal, 0);
    const grandTotalGenerated = stats.reduce((s, b) => s + b.totalGenerated, 0);

    return {
      stats,
      totalHaircut,
      totalHaircutCount,
      totalChemical,
      totalChemicalCount,
      totalProduct,
      totalProductCount,
      totalTips,
      grandTotalGenerated,
    };
  };

  // Filter bills & expenses
  const dailyBills = bills.filter((b) => b.date.startsWith(selectedDate));
  const dailyExpenses = expenses.filter((e) => e.date.startsWith(selectedDate));
  const dailyFinancials = calculateFinancialMetrics(dailyBills, dailyExpenses);
  const dailyBarberData = calculateBarberStats(dailyBills);

  const monthlyBills = bills.filter((b) => b.date.startsWith(selectedMonth));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const monthlyFinancials = calculateFinancialMetrics(monthlyBills, monthlyExpenses);
  const monthlyBarberData = calculateBarberStats(monthlyBills);

  // --- 3. FULL MONTH DAILY LEDGER TABLE (Day 1 to End of Month) ---
  const [yearNum, monthNum] = selectedMonth.split('-').map((v) => parseInt(v, 10));
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  interface DailyLedgerRow {
    dayNum: number;
    dateStr: string;
    dayName: string;
    isWeekend: boolean;
    isToday: boolean;
    heads: number;
    cash: number;
    transfer: number;
    total: number;
    expenses: number;
    net: number;
    billsCount: number;
  }

  const thaiDayNamesShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const monthlyLedger: DailyLedgerRow[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d.toString().padStart(2, '0');
    const fullDateStr = `${selectedMonth}-${dayStr}`;
    const dateObj = new Date(yearNum, monthNum - 1, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = fullDateStr === todayStr;

    const dayBills = monthlyBills.filter((b) => b.date.startsWith(fullDateStr) && b.status === 'COMPLETED');
    const dayExpenses = monthlyExpenses.filter((e) => e.date.startsWith(fullDateStr));

    let dayCash = 0;
    let dayTransfer = 0;
    let dayHeads = 0;

    dayBills.forEach((b) => {
      if (b.paymentMethod === 'CASH') {
        dayCash += b.grandTotal;
      } else if (b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY' || b.paymentMethod === 'CREDIT_CARD') {
        dayTransfer += b.grandTotal;
      } else if (b.paymentMethod === 'SPLIT') {
        dayCash += b.splitCashAmount || 0;
        dayTransfer += b.splitTransferAmount || 0;
      } else if (b.paymentMethod === 'MEMBER') {
        dayTransfer += b.grandTotal;
      }

      const haircutItemCount = b.items.filter((i) => i.category === 'HAIRCUT').reduce((s, i) => s + i.quantity, 0);
      dayHeads += haircutItemCount > 0 ? haircutItemCount : 1;
    });

    const dayTotal = dayCash + dayTransfer;
    const dayExpenseTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
    const dayNet = dayTotal - dayExpenseTotal;

    monthlyLedger.push({
      dayNum: d,
      dateStr: fullDateStr,
      dayName: thaiDayNamesShort[dayOfWeek],
      isWeekend,
      isToday,
      heads: dayHeads,
      cash: dayCash,
      transfer: dayTransfer,
      total: dayTotal,
      expenses: dayExpenseTotal,
      net: dayNet,
      billsCount: dayBills.length,
    });
  }

  const displayedLedger = tableFilter === 'ACTIVE_DAYS' 
    ? monthlyLedger.filter((row) => row.billsCount > 0 || row.expenses > 0)
    : monthlyLedger;

  // --- TOP PERFORMING SERVICES & BUSINESS PULSE AGGREGATION ---
  const calculateTopServices = (targetBills: Bill[]) => {
    const completedBills = targetBills.filter((b) => b.status === 'COMPLETED');
    const serviceMap = new Map<string, {
      name: string;
      category: string;
      revenue: number;
      count: number;
      barberNames: Set<string>;
    }>();

    let totalServiceRevenue = 0;
    let totalServiceCount = 0;

    completedBills.forEach((b) => {
      b.items.forEach((item) => {
        const itemGross = item.isPackageRedemption
          ? 0
          : Math.max(0, (item.price * item.quantity) - (item.discount || 0));

        totalServiceRevenue += itemGross;
        totalServiceCount += item.quantity;

        const serviceName = item.name?.trim() || (item.category === 'HAIRCUT' ? 'ตัดผมมาตรฐาน' : 'บริการทั่วไป');
        const existing = serviceMap.get(serviceName);
        if (existing) {
          existing.revenue += itemGross;
          existing.count += item.quantity;
          if (item.barberName) existing.barberNames.add(item.barberName);
        } else {
          const barberSet = new Set<string>();
          if (item.barberName) barberSet.add(item.barberName);
          serviceMap.set(serviceName, {
            name: serviceName,
            category: item.category || 'HAIRCUT',
            revenue: itemGross,
            count: item.quantity,
            barberNames: barberSet,
          });
        }
      });
    });

    const sortedServices = Array.from(serviceMap.values()).sort(
      (a, b) => b.revenue - a.revenue || b.count - a.count
    );

    return {
      sortedServices,
      topService: sortedServices[0] || null,
      runnerUpService: sortedServices[1] || null,
      thirdService: sortedServices[2] || null,
      totalServiceRevenue,
      totalServiceCount,
    };
  };

  const monthlyTopServices = calculateTopServices(monthlyBills);

  // Previous Month Revenue Comparison (MoM)
  const prevMonthDate = new Date(yearNum, monthNum - 2, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${(prevMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const prevMonthBills = bills.filter((b) => b.date.startsWith(prevMonthStr) && b.status === 'COMPLETED');
  const prevMonthRevenue = prevMonthBills.reduce((sum, b) => sum + b.grandTotal, 0);

  const momRevenueDiff = monthlyFinancials.grandTotalRevenue - prevMonthRevenue;
  const momRevenuePercent = prevMonthRevenue > 0
    ? ((momRevenueDiff) / prevMonthRevenue) * 100
    : null;

  const activeDaysCount = displayedLedger.filter((row) => row.billsCount > 0).length;
  const dailyAverageRevenue = monthlyFinancials.grandTotalRevenue / Math.max(1, activeDaysCount || 1);

  // Filtered daily bills for search
  const filteredDailyBills = dailyBills.filter((b) => {
    if (!billSearchQuery) return true;
    const q = billSearchQuery.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      (b.memberName && b.memberName.toLowerCase().includes(q)) ||
      (b.createdBy && b.createdBy.toLowerCase().includes(q)) ||
      b.items.some((i) => i.name.toLowerCase().includes(q) || i.barberName.toLowerCase().includes(q))
    );
  });

  // --- 4. EXPORT CSV FOR ACCOUNTANT ---
  const handleExportCSV = (mode: 'DAILY' | 'MONTHLY') => {
    let csv = '\uFEFF';

    if (mode === 'DAILY') {
      csv += `รายงานสรุปรายได้และงบกำไรขาดทุนรายวัน (Accountant Daily Statement),${settings.storeName}\n`;
      csv += `ประจำวันที่,${formatThaiDate(selectedDate, true)}\n`;
      csv += `วันที่พิมพ์รายงาน,${formatThaiDate(todayStr, true)}\n\n`;

      csv += `1. งบสรุปรายได้และกำไรสุทธิประจำวัน (Daily P&L Statement)\n`;
      csv += `หมวดรายการ,จำนวนเงิน (บาท),หมายเหตุ\n`;
      csv += `รายได้ค่าบริการตัดผม & ออกแบบทรง,${dailyFinancials.grossHaircut},${dailyFinancials.totalHeads} หัว\n`;
      csv += `รายได้งานเคมี ดัด/ยืด/ทำสี,${dailyFinancials.grossChemical},-\n`;
      csv += `รายได้ขายสินค้าจัดแต่งทรง,${dailyFinancials.grossProduct},-\n`;
      csv += `รายได้ค่าทิปช่าง,${dailyFinancials.totalTips},-\n`;
      csv += `หัก: ส่วนลดและโปรโมชั่น,-${dailyFinancials.totalDiscountsGiven},-\n`;
      csv += `รวมรายรับสุทธิ (Net Revenue),${dailyFinancials.grandTotalRevenue},จำนวน ${dailyFinancials.totalBillsCount} บิล\n`;
      csv += `หัก: ค่าใช้จ่ายดำเนินงานทั้งหมด (Total Expenses),-${dailyFinancials.totalExpenseAmount},จำนวน ${dailyExpenses.length} รายการ\n`;
      csv += `กำไรจากการดำเนินงานสุทธิ (Net Operating Profit),${dailyFinancials.netOperatingProfit},อัตรากำไร ${dailyFinancials.profitMarginPercent.toFixed(1)}%\n\n`;

      csv += `2. การแบ่งแยกช่องทางการรับเงิน (Cash Flow Breakdown)\n`;
      csv += `เงินสดรับหน้าร้าน (Cash),${dailyFinancials.cashRevenue},บาท\n`;
      csv += `เงินโอน/PromptPay/QR (Transfer),${dailyFinancials.transferRevenue},บาท\n`;
      csv += `หักยอดเงินในกระเป๋าสมาชิก (Member Balance),${dailyFinancials.memberBalanceDeducted},บาท\n`;
      csv += `เงินสดคงเหลือสุทธิหลังหักรายจ่ายเงินสด (Net Cash on hand),${dailyFinancials.netCashFlow},บาท\n\n`;

      csv += `3. สรุปผลงานและส่วนแบ่งช่าง (Barber Performance)\n`;
      csv += `ช่าง,จำนวนหัว (คน),ค่าตัดผม (บาท),ค่าเคมี (บาท),ค่าสินค้า (บาท),ค่าทิป (บาท),รวมยอดที่สร้างให้ร้าน (บาท)\n`;
      dailyBarberData.stats.forEach((st) => {
        csv += `ช่าง${st.barber.nickname} (${st.barber.name}),${st.totalHeads},${st.haircutSales},${st.chemicalSales},${st.productSales},${st.tipTotal},${st.totalGenerated}\n`;
      });
      csv += `รวมทั้งหมด,${dailyBarberData.totalHaircutCount},${dailyBarberData.totalHaircut},${dailyBarberData.totalChemical},${dailyBarberData.totalProduct},${dailyBarberData.totalTips},${dailyBarberData.grandTotalGenerated}\n\n`;

      csv += `4. รายละเอียดรายการบิลทั้งหมดประจำวัน\n`;
      csv += `เวลา,เลขที่บิล,ลูกค้า,ช่าง,รายการ,ช่องทางชำระเงิน,ส่วนลด (บาท),ทิป (บาท),ยอดสุทธิ (บาท),สถานะ\n`;
      dailyBills.forEach((b) => {
        const timeStr = b.date ? new Date(b.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
        const barberNames = Array.from(new Set(b.items.map((i) => i.barberName))).join(', ');
        const itemNames = b.items.map((i) => `${i.name} x${i.quantity}`).join(' | ');
        csv += `${timeStr},${b.billNumber},"${b.memberName || 'ลูกค้าทั่วไป'}","${barberNames}","${itemNames}",${b.paymentMethod},${b.discountTotal || 0},${b.tipAmount || 0},${b.grandTotal},${b.status}\n`;
      });
    } else {
      csv += `รายงานสมุดรายวันและงบรายได้รายเดือนสำหรับนักบัญชี (Monthly General Ledger),${settings.storeName}\n`;
      csv += `ประจำเดือน,${formatThaiMonthYear(selectedMonth)}\n`;
      csv += `วันที่พิมพ์รายงาน,${formatThaiDate(todayStr, true)}\n\n`;

      csv += `1. งบสรุปรายได้และกำไรสุทธิประจำเดือน (Monthly Income Statement)\n`;
      csv += `หมวดรายการ,จำนวนเงิน (บาท),สัดส่วน (%)\n`;
      csv += `รายได้ค่าบริการตัดผม & ออกแบบทรง,${monthlyFinancials.grossHaircut},${monthlyFinancials.grandTotalRevenue > 0 ? ((monthlyFinancials.grossHaircut / monthlyFinancials.grandTotalRevenue) * 100).toFixed(1) : 0}%\n`;
      csv += `รายได้งานเคมี ดัด/ยืด/ทำสี,${monthlyFinancials.grossChemical},${monthlyFinancials.grandTotalRevenue > 0 ? ((monthlyFinancials.grossChemical / monthlyFinancials.grandTotalRevenue) * 100).toFixed(1) : 0}%\n`;
      csv += `รายได้ขายสินค้าจัดแต่งทรง,${monthlyFinancials.grossProduct},${monthlyFinancials.grandTotalRevenue > 0 ? ((monthlyFinancials.grossProduct / monthlyFinancials.grandTotalRevenue) * 100).toFixed(1) : 0}%\n`;
      csv += `รายได้ค่าทิปช่าง,${monthlyFinancials.totalTips},-\n`;
      csv += `หัก: ส่วนลดและโปรโมชั่น,-${monthlyFinancials.totalDiscountsGiven},-\n`;
      csv += `รวมรายรับสุทธิทั้งเดือน (Net Revenue),${monthlyFinancials.grandTotalRevenue},100%\n`;
      csv += `หัก: ค่าใช้จ่ายดำเนินงานทั้งหมด,-${monthlyFinancials.totalExpenseAmount},-\n`;
      csv += `กำไรสุทธิจากการดำเนินงาน (Net Operating Profit),${monthlyFinancials.netOperatingProfit},อัตรากำไร ${monthlyFinancials.profitMarginPercent.toFixed(1)}%\n\n`;

      csv += `2. ตารางสมุดรายวันรับ-จ่ายตลอดทั้งเดือน (Daily Ledger Breakdown)\n`;
      csv += `วันที่,วัน,จำนวนหัว,เงินสด (บาท),เงินโอน (บาท),รวมยอดขายรายวัน (บาท),ค่าใช้จ่าย (บาท),กำไรสุทธิ (บาท),จำนวนบิล\n`;
      monthlyLedger.forEach((row) => {
        csv += `${row.dayNum},${row.dayName},${row.heads},${row.cash},${row.transfer},${row.total},${row.expenses},${row.net},${row.billsCount}\n`;
      });
      csv += `รวมทั้งเดือน,-,${monthlyFinancials.totalHeads},${monthlyFinancials.cashRevenue},${monthlyFinancials.transferRevenue},${monthlyFinancials.grandTotalRevenue},${monthlyFinancials.totalExpenseAmount},${monthlyFinancials.netOperatingProfit},${monthlyFinancials.totalBillsCount}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACCOUNTING_${mode}_${mode === 'DAILY' ? selectedDate : selectedMonth}_${settings.storeName.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="accounting-dashboard-view" className="space-y-6 pb-12 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ========================================================================= */}
      {/* TOP EXECUTIVE BAR & VIEW TABS SWITCHER                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-xl shadow-xs border border-amber-400">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                แดชบอร์ดงบการเงิน & รายงานบัญชี
              </h2>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                มาตรฐานนักบัญชี (P&L Audit)
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              สรุปงบรายได้, จำแนกค่าใช้จ่าย, กระทบยอดเงินสด/โอน และผลงานช่าง ครบถ้วนพร้อมตรวจสอบ
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/90 border border-stone-200 rounded-2xl p-1.5 shadow-2xs w-full lg:w-auto justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setActiveTab('DAILY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'DAILY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>☀️ สรุปรายวัน (Daily)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MONTHLY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'MONTHLY'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 สรุปรายเดือน (Monthly)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL_IN_ONE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ALL_IN_ONE'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-amber-600" />
            <span>งบการเงิน & สถิติภาพรวม</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ EXECUTIVE BUSINESS PULSE SUMMARY CARD (MONTHLY REVENUE & TOP SERVICE)   */}
      {/* ========================================================================= */}
      <div className="bg-stone-900 text-stone-100 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        {/* Subtle accent glows */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row of Pulse Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-sans">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Executive Business Pulse (ภาพรวมชีพจรธุรกิจ & ตัวชี้วัดสำคัญ)</span>
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
              <span>รอบเดือน: <strong className="text-amber-300 font-bold">{formatThaiMonthYear(selectedMonth)}</strong></span>
              <span className="text-stone-600">•</span>
              <span>{monthlyFinancials.totalBillsCount} บิลสำเร็จ</span>
              <span className="text-stone-600">•</span>
              <span>{monthlyFinancials.totalHeads} หัว</span>
            </div>
          </div>

          {/* Dual Main Pulse Cards: Monthly Revenue & Top Performing Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Monthly Revenue Card */}
            <div className="bg-stone-800/80 border border-stone-700/80 hover:border-amber-500/40 transition rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Monthly Revenue (รายได้รวมประจำเดือน)</span>
                  </span>
                  
                  <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                      {formatCurrency(monthlyFinancials.grandTotalRevenue)}
                    </span>
                    {momRevenuePercent !== null ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 border ${
                        momRevenuePercent >= 0 
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                          : 'bg-rose-950/80 text-rose-300 border-rose-800'
                      }`}>
                        {momRevenuePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        <span>{momRevenuePercent >= 0 ? '+' : ''}{momRevenuePercent.toFixed(1)}% vs เดือนก่อน</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 font-medium">
                        (รอบเดือนปัจจุบัน)
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Sub-metrics breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-stone-700/60 text-xs">
                <div className="bg-stone-900/80 rounded-xl p-2.5 border border-stone-800 space-y-0.5">
                  <span className="text-[10px] text-stone-400 font-semibold block">กำไรสุทธิ (Net Profit)</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    {formatCurrency(monthlyFinancials.netOperatingProfit)}
                  </span>
                  <span className="text-[10px] text-emerald-500/90 block font-medium">
                    (มาร์จิ้น {monthlyFinancials.profitMarginPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="bg-stone-900/80 rounded-xl p-2.5 border border-stone-800 space-y-0.5">
                  <span className="text-[10px] text-stone-400 font-semibold block">เงินสด / เงินโอน</span>
                  <div className="font-mono font-bold text-stone-200 text-xs truncate">
                    <span className="text-emerald-300">💵 {formatCurrency(monthlyFinancials.cashRevenue)}</span>
                  </div>
                  <div className="font-mono font-bold text-stone-300 text-[11px] truncate">
                    <span className="text-cyan-300">📲 {formatCurrency(monthlyFinancials.transferRevenue)}</span>
                  </div>
                </div>
                <div className="bg-stone-900/80 rounded-xl p-2.5 border border-stone-800 space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-stone-400 font-semibold block">เฉลี่ยต่อวันทำงาน</span>
                  <span className="font-mono font-bold text-amber-300 text-sm block">
                    {formatCurrency(dailyAverageRevenue)}
                  </span>
                  <span className="text-[10px] text-stone-400 block font-medium">
                    จาก {activeDaysCount || 1} วันที่มีรายการ
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Top Performing Service Card */}
            <div className="bg-stone-800/80 border border-stone-700/80 hover:border-amber-500/40 transition rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 w-full">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Top Performing Service (บริการที่ทำยอดสูงสุด)</span>
                  </span>
                  
                  {monthlyTopServices.topService ? (
                    <div className="pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {monthlyTopServices.topService.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-stone-950 flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3 h-3 text-stone-950 fill-stone-950" />
                          <span>อันดับ 1</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-700 text-stone-200 border border-stone-600">
                          {monthlyTopServices.topService.category === 'HAIRCUT' ? '✂️ ตัดผม' : monthlyTopServices.topService.category === 'CHEMICAL' ? '🧪 งานเคมี' : monthlyTopServices.topService.category === 'PRODUCT' ? '🧴 สินค้า' : 'บริการ'}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-baseline gap-3 flex-wrap">
                        <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                          {formatCurrency(monthlyTopServices.topService.revenue)}
                        </span>
                        <span className="text-xs text-stone-300 font-medium">
                          ยอดขาย <strong className="text-white font-mono font-black">{formatNumber(monthlyTopServices.topService.count)}</strong> ครั้ง/ชิ้น
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-stone-400">
                      ยังไม่มีรายการบริการในรอบเดือนนี้
                    </div>
                  )}
                </div>

                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              {/* Sub-details for Top Service */}
              {monthlyTopServices.topService && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-stone-700/60 text-xs">
                  <div className="bg-stone-900/80 rounded-xl p-2.5 border border-stone-800 space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-semibold block">สัดส่วนรายได้บริการ</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {monthlyTopServices.totalServiceRevenue > 0 
                        ? `${((monthlyTopServices.topService.revenue / monthlyTopServices.totalServiceRevenue) * 100).toFixed(1)}%` 
                        : '0%'}
                    </span>
                    <span className="text-[10px] text-stone-500 block">ของยอดบริการทั้งหมด</span>
                  </div>
                  <div className="bg-stone-900/80 rounded-xl p-2.5 border border-stone-800 space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-semibold block">ราคาเฉลี่ย / ครั้ง</span>
                    <span className="font-mono font-bold text-stone-200 text-sm">
                      {formatCurrency(monthlyTopServices.topService.count > 0 ? monthlyTopServices.topService.revenue / monthlyTopServices.topService.count : 0)}
                    </span>
                    <span className="text-[10px] text-stone-500 block">ต่อการให้บริการ</span>
                  </div>
                  <div className="bg-stone-900/80 rounded-xl p-2.5 border border-stone-800 space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-stone-400 font-semibold block">🥈 อันดับ 2 รองลงมา</span>
                    <span className="font-bold text-stone-300 text-xs truncate block" title={monthlyTopServices.runnerUpService ? `${monthlyTopServices.runnerUpService.name} (${formatCurrency(monthlyTopServices.runnerUpService.revenue)})` : 'ไม่มี'}>
                      {monthlyTopServices.runnerUpService ? `${monthlyTopServices.runnerUpService.name}` : '-'}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 block truncate">
                      {monthlyTopServices.runnerUpService ? `${formatCurrency(monthlyTopServices.runnerUpService.revenue)} (${monthlyTopServices.runnerUpService.count} ครั้ง)` : '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ☀️ DAILY FINANCIAL STATEMENT (งบรายได้และบัญชีรายวัน)              */}
      {/* ========================================================================= */}
      {activeTab === 'DAILY' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Daily Filter & Quick Actions Bar */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 mr-1">
                <Sun className="w-4 h-4 text-amber-600" /> เลือกวันที่:
              </span>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setSelectedMonth(e.target.value.slice(0, 7));
                }}
                className="bg-white border border-amber-300 text-stone-900 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs cursor-pointer"
              />

              {/* Quick Pills */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetDayOffset(0)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDayOffset(1)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
                >
                  เมื่อวาน
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDayOffset(2)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
                >
                  2 วันก่อน
                </button>
              </div>
            </div>

            {/* Actions for Daily */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleOpenPDFReport('DAILY')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                title="เปิดเอกสารรายงานสรุปรายได้-รายจ่ายรายวันสำหรับนักบัญชี (PDF)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>โหลด Report บัญชีรายวัน (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportCSV('DAILY')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV (Excel)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl transition cursor-pointer"
                title="พิมพ์"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 5 Financial KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Heads */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" /> จำนวนหัวลูกค้า
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-black">
                  💈
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {formatNumber(dailyFinancials.totalHeads)} <span className="text-xs font-bold text-stone-500">หัว</span>
                </div>
                <div className="text-[11px] text-stone-400 font-medium mt-0.5">
                  จากทั้งหมด {dailyFinancials.totalBillsCount} บิล
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>เฉลี่ยต่อหัว</span>
                <strong className="font-mono text-stone-800">{formatCurrency(dailyFinancials.avgPerHead)}</strong>
              </div>
            </div>

            {/* 2. Cash */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" /> เงินสดรับ (Cash)
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  💵
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {formatCurrency(dailyFinancials.cashRevenue)}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  {dailyFinancials.grandTotalRevenue > 0 ? Math.round((dailyFinancials.cashRevenue / dailyFinancials.grandTotalRevenue) * 100) : 0}% ของยอดรับวันนี้
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>หักรายจ่ายเงินสด</span>
                <span className="text-rose-600 font-mono">-{formatCurrency(dailyFinancials.cashExpenseAmount)}</span>
              </div>
            </div>

            {/* 3. Transfer */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-600" /> เงินโอน (Transfer)
                </span>
                <span className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-xs font-black">
                  📱
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-cyan-700 font-mono">
                  {formatCurrency(dailyFinancials.transferRevenue)}
                </div>
                <div className="text-[11px] text-cyan-800 font-medium mt-0.5">
                  {dailyFinancials.grandTotalRevenue > 0 ? Math.round((dailyFinancials.transferRevenue / dailyFinancials.grandTotalRevenue) * 100) : 0}% ของยอดรับวันนี้
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>PromptPay / ธนาคาร</span>
                <span className="font-mono text-cyan-800">เข้าบัญชี</span>
              </div>
            </div>

            {/* 4. Total Sales */}
            <div className="bg-amber-50/70 border border-amber-300/80 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" /> รวมยอดขายสุทธิ
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center text-xs font-black">
                  💰
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-amber-950 font-mono">
                  {formatCurrency(dailyFinancials.grandTotalRevenue)}
                </div>
                <div className="text-[11px] text-amber-900 font-medium mt-0.5">
                  เงินสด + เงินโอน
                </div>
              </div>
              <div className="text-[10px] text-amber-800 pt-1 border-t border-amber-200/60 font-semibold flex justify-between">
                <span>ทิปช่างวันนี้</span>
                <span className="font-mono">{formatCurrency(dailyFinancials.totalTips)}</span>
              </div>
            </div>

            {/* 5. Net Profit */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> กำไรสุทธิวันนี้
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  📈
                </span>
              </div>
              <div className="my-2">
                <div className={`text-2xl font-black font-mono ${dailyFinancials.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(dailyFinancials.netOperatingProfit)}
                </div>
                <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                  หักรายจ่าย: -{formatCurrency(dailyFinancials.totalExpenseAmount)}
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>อัตรากำไร (Margin)</span>
                <strong className={`font-mono ${dailyFinancials.profitMarginPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {dailyFinancials.profitMarginPercent.toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Daily Income Statement (งบกำไรขาดทุนรายวันแบบมาตรฐานบัญชี) */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center text-sm font-black">
                  📑
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
                    งบกำไรขาดทุนย่อประจำวัน (Daily Statement of Income)
                  </h3>
                  <p className="text-xs text-stone-500">
                    ประจำวันที่ {formatThaiDate(selectedDate, false)} • แสดงโครงสร้างรายได้และรายจ่ายตามหลักการบัญชี
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">กำไรจากการดำเนินงานสุทธิ</span>
                <strong className={`text-base font-black font-mono ${dailyFinancials.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(dailyFinancials.netOperatingProfit)}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Revenue Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 text-stone-500 font-extrabold text-[11px] uppercase tracking-wider border-b border-stone-100">
                  <span>1. รายรับจากการดำเนินงาน (Revenue)</span>
                  <span>จำนวนเงิน (บาท)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50/70 border border-stone-200/60">
                  <span className="text-stone-700 font-medium flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-600" />
                    รายได้ค่าบริการตัดผม & ออกแบบทรง ({dailyFinancials.totalHeads} หัว)
                  </span>
                  <strong className="font-mono text-stone-900">{formatCurrency(dailyFinancials.grossHaircut)}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50/70 border border-stone-200/60">
                  <span className="text-stone-700 font-medium flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-600" />
                    รายได้งานเคมี ดัด / ยืด / ทำสี
                  </span>
                  <strong className="font-mono text-stone-900">{formatCurrency(dailyFinancials.grossChemical)}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50/70 border border-stone-200/60">
                  <span className="text-stone-700 font-medium flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                    รายได้ขายสินค้าจัดแต่งทรง & บำรุงผม
                  </span>
                  <strong className="font-mono text-stone-900">{formatCurrency(dailyFinancials.grossProduct)}</strong>
                </div>

                {dailyFinancials.totalTips > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-pink-50/50 border border-pink-200/60">
                    <span className="text-pink-900 font-medium flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-pink-500" />
                      รายได้ค่าทิปช่าง
                    </span>
                    <strong className="font-mono text-pink-700">{formatCurrency(dailyFinancials.totalTips)}</strong>
                  </div>
                )}

                {dailyFinancials.totalDiscountsGiven > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-200/60 text-rose-800">
                    <span className="font-medium flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-rose-600" />
                      หัก: ส่วนลดและโปรโมชั่น
                    </span>
                    <strong className="font-mono text-rose-700">-{formatCurrency(dailyFinancials.totalDiscountsGiven)}</strong>
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-100/60 border border-amber-300 font-black text-amber-950 mt-1">
                  <span>รวมรายรับสุทธิ (Net Revenue)</span>
                  <span className="font-mono text-sm">{formatCurrency(dailyFinancials.grandTotalRevenue)}</span>
                </div>
              </div>

              {/* Right Column: Expenses Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 text-stone-500 font-extrabold text-[11px] uppercase tracking-wider border-b border-stone-100">
                  <span>2. ค่าใช้จ่ายดำเนินงาน (Operating Expenses)</span>
                  <span>จำนวนเงิน (บาท)</span>
                </div>

                {dailyExpenses.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 bg-stone-50 rounded-2xl border border-stone-200/60">
                    ไม่มีรายการค่าใช้จ่ายในวันนี้
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {dailyExpenses.map((exp) => {
                      const catInfo = EXPENSE_CATEGORIES_MAP[exp.category] || EXPENSE_CATEGORIES_MAP.OTHER;
                      return (
                        <div key={exp.id} className="flex items-center justify-between p-2 rounded-xl bg-stone-50/70 border border-stone-200/60">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{catInfo.emoji}</span>
                            <div>
                              <span className="text-stone-800 font-medium block">{exp.title}</span>
                              <span className="text-[10px] text-stone-400">
                                {catInfo.label} • {exp.paymentMethod === 'CASH' ? '💵 เงินสด' : '📱 เงินโอน'} {exp.paidTo ? `• จ่ายให้: ${exp.paidTo}` : ''}
                              </span>
                            </div>
                          </div>
                          <strong className="font-mono text-rose-600">-{formatCurrency(exp.amount)}</strong>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200 font-black text-rose-950 mt-1">
                  <span>รวมค่าใช้จ่ายดำเนินงานทั้งหมด</span>
                  <span className="font-mono text-sm text-rose-700">-{formatCurrency(dailyFinancials.totalExpenseAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Barber Revenue Breakdown Box */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black flex items-center justify-center text-lg shadow-2xs">
                  ✂️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
                    ยอดรายได้และผลงานช่างแต่ละคน ({formatThaiDate(selectedDate)})
                  </h3>
                  <p className="text-xs text-stone-500">
                    แจกแจงละเอียด: ค่าตัดผม • ค่าเคมี • ค่าสินค้า • ค่าทิป และจำนวนหัวที่ทำได้
                  </p>
                </div>
              </div>
            </div>

            {/* Barber Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {dailyBarberData.stats.map((st) => {
                const percentOfTotal = dailyBarberData.grandTotalGenerated > 0 
                  ? Math.round((st.totalGenerated / dailyBarberData.grandTotalGenerated) * 100) 
                  : 0;

                return (
                  <div
                    key={st.barber.id}
                    className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3 relative flex flex-col justify-between hover:border-amber-300 transition"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        >
                          {st.barber.nickname.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            ช่าง{st.barber.nickname}
                            <span className="text-[10px] text-stone-500 font-normal font-mono">({st.barber.name})</span>
                          </h4>
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            {st.totalHeads} หัว ({percentOfTotal}% ของร้าน)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">รวมยอดช่าง</span>
                        <strong className="text-sm font-black text-stone-900 font-mono block">
                          {formatCurrency(st.totalGenerated)}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <Scissors className="w-3.5 h-3.5 text-amber-600" /> ค่าตัดผม ({st.haircutCount} หัว)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.haircutSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <FlaskConical className="w-3.5 h-3.5 text-cyan-600" /> ค่าเคมี ดัด/ยืด/ย้อม ({st.chemicalCount} งาน)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.chemicalSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> ค่าขายสินค้า ({st.productCount} ชิ้น)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.productSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <HeartHandshake className="w-3.5 h-3.5 text-pink-500" /> ค่าทิป
                        </span>
                        <strong className="text-pink-600 font-bold font-mono text-xs">
                          {formatCurrency(st.tipTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Table for Day */}
            <div className="overflow-x-auto rounded-2xl border border-stone-200 mt-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-stone-100/80 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">ช่างตัดผม</th>
                    <th className="p-3 text-center">จำนวนหัว (Heads)</th>
                    <th className="p-3 text-right">ค่าตัดผม (฿)</th>
                    <th className="p-3 text-right">ค่าเคมี (฿)</th>
                    <th className="p-3 text-right">ค่าขายสินค้า (฿)</th>
                    <th className="p-3 text-right">ค่าทิป (฿)</th>
                    <th className="p-3 text-right bg-amber-50/60 font-black text-amber-900">รวมรายได้สร้างให้ร้าน (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {dailyBarberData.stats.map((st) => (
                    <tr key={st.barber.id} className="hover:bg-stone-50 transition">
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        />
                        <span>ช่าง{st.barber.nickname}</span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-stone-800">
                        {formatNumber(st.totalHeads)} หัว
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.haircutSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.chemicalSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.productSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-pink-600 font-semibold">
                        {formatCurrency(st.tipTotal)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-950 bg-amber-50/40">
                        {formatCurrency(st.totalGenerated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-100 font-black text-stone-900 text-xs border-t-2 border-stone-300">
                  <tr>
                    <td className="p-3">รวมช่างทุกคนวันนี้</td>
                    <td className="p-3 text-center font-mono text-amber-900">{formatNumber(dailyBarberData.totalHaircutCount)} หัว</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(dailyBarberData.totalHaircut)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(dailyBarberData.totalChemical)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(dailyBarberData.totalProduct)}</td>
                    <td className="p-3 text-right font-mono text-pink-600">{formatCurrency(dailyBarberData.totalTips)}</td>
                    <td className="p-3 text-right font-mono text-sm text-amber-950 bg-amber-100/70">
                      {formatCurrency(dailyBarberData.grandTotalGenerated)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Daily Bills Breakdown Table */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-stone-900 text-sm">
                  รายการบิลทั้งหมดของวันที่ {formatThaiDate(selectedDate)} ({dailyBills.length} บิล)
                </h3>
              </div>

              {/* Merge Bills Button & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {dailyBills.filter(b => b.status !== 'VOIDED').length >= 2 && (
                  <button
                    type="button"
                    onClick={() => handleOpenMergeBillsModal()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-stone-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs whitespace-nowrap"
                    title="รวม 2 บิลขึ้นไปที่ชำระเงินพร้อมกันเป็นบิลเดียว (เช่น โอนรวม 1 สลิป)"
                  >
                    <Layers className="w-3.5 h-3.5 text-stone-950" />
                    <span>🔗 รวมบิล (Merge Bills)</span>
                  </button>
                )}

                {/* Search in Bills */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาเลขบิล, ชื่อลูกค้า, ช่าง..."
                    value={billSearchQuery}
                    onChange={(e) => setBillSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {filteredDailyBills.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                ไม่มีรายการบิลในวันที่เลือก
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-200 max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-stone-100 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200 z-10 shadow-xs">
                    <tr>
                      <th className="p-2.5">เวลา</th>
                      <th className="p-2.5">เลขที่บิล</th>
                      <th className="p-2.5">ลูกค้า</th>
                      <th className="p-2.5">ช่าง</th>
                      <th className="p-2.5">รายการบริการ / สินค้า</th>
                      <th className="p-2.5 text-center">วิธีชำระเงิน (สลับได้)</th>
                      <th className="p-2.5 text-right">ทิป (฿)</th>
                      <th className="p-2.5 text-right font-black text-amber-950 bg-amber-50/70">ยอดรวมสุทธิ (฿)</th>
                      <th className="p-2.5 text-center">จัดการบิล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white font-mono">
                    {filteredDailyBills.map((bill) => {
                      const timeStr = bill.date 
                        ? new Date(bill.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                        : '-';
                      const barberNames = Array.from(new Set(bill.items.map((i) => i.barberName))).join(', ');

                      return (
                        <tr key={bill.id} className={`transition ${bill.status === 'VOIDED' ? 'bg-rose-50/50 opacity-60 line-through' : 'hover:bg-stone-50'}`}>
                          <td className="p-2.5 font-bold text-stone-500 font-sans">{timeStr} น.</td>
                          <td className="p-2.5 font-bold text-stone-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{bill.billNumber}</span>
                              {bill.isMerged && (
                                <span
                                  className="px-1.5 py-0.5 rounded-md text-[9px] bg-purple-100 text-purple-800 font-bold flex items-center gap-0.5 border border-purple-200"
                                  title={`รวมจ่ายกับบิล ${bill.mergedWithBillNumbers?.map((n) => `#${n}`).join(', ') || ''}`}
                                >
                                  <Layers className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                                  <span>
                                    {bill.mergedWithBillNumbers && bill.mergedWithBillNumbers.length > 0
                                      ? `รวม #${bill.mergedWithBillNumbers.join(', #')}`
                                      : 'รวมบิล'}
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 font-sans font-medium text-stone-800">
                            {bill.memberName || 'ลูกค้าทั่วไป (Walk-in)'}
                          </td>
                          <td className="p-2.5 font-sans font-bold text-amber-800">
                            {barberNames || '-'}
                          </td>
                          <td className="p-2.5 font-sans text-stone-600 max-w-xs truncate">
                            {bill.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            <button
                              type="button"
                              onClick={() => handleQuickTogglePaymentMethod(bill)}
                              title="คลิกเพื่อสลับวิธีชำระเงินด่วน (โอน ⇄ เงินสด ⇄ แบ่งจ่าย)"
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer hover:scale-105 active:scale-95 shadow-2xs ${
                                bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY'
                                  ? 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200'
                                  : bill.paymentMethod === 'CASH'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                  : bill.paymentMethod === 'SPLIT'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
                                  : 'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              {bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY' ? '📱 โอน/QR ⇄' : bill.paymentMethod === 'CASH' ? '💵 เงินสด ⇄' : bill.paymentMethod === 'SPLIT' ? '🔄 สลับ ⇄' : `${bill.paymentMethod} ⇄`}
                            </button>
                          </td>
                          <td className="p-2.5 text-right text-pink-600 font-semibold">
                            {bill.tipAmount ? formatCurrency(bill.tipAmount) : '-'}
                          </td>
                          <td className="p-2.5 text-right font-black text-amber-950 bg-amber-50/40">
                            {formatCurrency(bill.grandTotal)}
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedBillForReceipt(bill)}
                                className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                                title="ดูใบเสร็จ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {(bill.isMerged || (bill.originalBills && bill.originalBills.length > 0)) ? (
                                onUnmergeBill && (
                                  <button
                                    type="button"
                                    onClick={() => setUnmergingBill(bill)}
                                    className="p-1 text-purple-700 hover:text-purple-950 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                                    title="ยกเลิกรวมบิล และแยกกลับเป็นบิลเดิม (มีป๊อปอัพยืนยัน)"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenMergeBillsModal(bill.id)}
                                  className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                                  title="รวมบิลนี้กับบิลอื่น (เช่น ลูกค้า 2 คนโอนรวม 1 สลิป)"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingBill(bill)}
                                className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="แก้ไขบิล / เปลี่ยนช่าง / เปลี่ยนวิธีชำระเงิน"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingBill(bill)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="ลบบิลออกจากระบบ"
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

      {/* ========================================================================= */}
      {/* MODE 2: 📅 MONTHLY GENERAL LEDGER (สมุดรายวัน & งบรายเดือน)               */}
      {/* ========================================================================= */}
      {activeTab === 'MONTHLY' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Monthly Filter Bar */}
          <div className="bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStepMonth(-1)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepMonth(1)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-amber-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                />
              </div>

              {/* Quick Month Pills */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedMonth === currentMonthStr
                      ? 'bg-amber-500 text-stone-950 shadow-2xs ring-2 ring-amber-400/40'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  เดือนนี้
                </button>
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(1)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-800 text-stone-300 hover:bg-stone-700 transition cursor-pointer"
                >
                  เดือนที่แล้ว (-1)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(2)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-800 text-stone-300 hover:bg-stone-700 transition cursor-pointer hidden sm:inline-block"
                >
                  ย้อนหลัง 2 เดือน
                </button>
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(3)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-800 text-stone-300 hover:bg-stone-700 transition cursor-pointer hidden md:inline-block"
                >
                  ย้อนหลัง 3 เดือน
                </button>
              </div>
            </div>

            {/* Monthly Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <span className="text-xs text-amber-300 font-bold bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-500/30">
                📅 {formatThaiMonthYear(selectedMonth)}
              </span>
              <button
                type="button"
                onClick={() => handleOpenPDFReport('MONTHLY')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                title="เปิดเอกสารรายงานสมุดรายวันและงบรายได้รายเดือนสำหรับนักบัญชี (PDF)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>โหลด Report บัญชีรายเดือน (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportCSV('MONTHLY')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV (Excel)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-xl transition cursor-pointer"
                title="พิมพ์รายงาน"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly 5 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Monthly Heads */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" /> จำนวนหัวทั้งเดือน
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-black">
                  💈
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {formatNumber(monthlyFinancials.totalHeads)} <span className="text-xs font-bold text-stone-500">หัว</span>
                </div>
                <div className="text-[11px] text-stone-400 font-medium mt-0.5">
                  จากทั้งหมด {monthlyFinancials.totalBillsCount} บิล
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>เฉลี่ยต่อวัน</span>
                <strong className="font-mono text-stone-800">{(monthlyFinancials.totalHeads / daysInMonth).toFixed(1)} หัว</strong>
              </div>
            </div>

            {/* 2. Monthly Cash */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" /> เงินสดทั้งเดือน (Cash)
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  💵
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {formatCurrency(monthlyFinancials.cashRevenue)}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  {monthlyFinancials.grandTotalRevenue > 0 ? Math.round((monthlyFinancials.cashRevenue / monthlyFinancials.grandTotalRevenue) * 100) : 0}% ของยอดทั้งเดือน
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>หักรายจ่ายเงินสด</span>
                <span className="text-rose-600 font-mono">-{formatCurrency(monthlyFinancials.cashExpenseAmount)}</span>
              </div>
            </div>

            {/* 3. Monthly Transfer */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-600" /> เงินโอนทั้งเดือน (Transfer)
                </span>
                <span className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-xs font-black">
                  📱
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-cyan-700 font-mono">
                  {formatCurrency(monthlyFinancials.transferRevenue)}
                </div>
                <div className="text-[11px] text-cyan-800 font-medium mt-0.5">
                  {monthlyFinancials.grandTotalRevenue > 0 ? Math.round((monthlyFinancials.transferRevenue / monthlyFinancials.grandTotalRevenue) * 100) : 0}% ของยอดทั้งเดือน
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>PromptPay / ธนาคาร</span>
                <span className="font-mono text-cyan-800">เข้าบัญชี</span>
              </div>
            </div>

            {/* 4. Monthly Total */}
            <div className="bg-amber-50/70 border border-amber-300/80 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" /> รวมยอดขายทั้งเดือน
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center text-xs font-black">
                  💰
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-amber-950 font-mono">
                  {formatCurrency(monthlyFinancials.grandTotalRevenue)}
                </div>
                <div className="text-[11px] text-amber-900 font-medium mt-0.5">
                  เงินสด + เงินโอน
                </div>
              </div>
              <div className="text-[10px] text-amber-800 pt-1 border-t border-amber-200/60 font-semibold flex justify-between">
                <span>ทิปช่างทั้งเดือน</span>
                <span className="font-mono">{formatCurrency(monthlyFinancials.totalTips)}</span>
              </div>
            </div>

            {/* 5. Monthly Net Profit */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> กำไรสุทธิทั้งเดือน
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  📈
                </span>
              </div>
              <div className="my-2">
                <div className={`text-2xl font-black font-mono ${monthlyFinancials.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(monthlyFinancials.netOperatingProfit)}
                </div>
                <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                  หักรายจ่ายร้าน: -{formatCurrency(monthlyFinancials.totalExpenseAmount)}
                </div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex justify-between">
                <span>อัตรากำไร (Margin)</span>
                <strong className={`font-mono ${monthlyFinancials.profitMarginPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {monthlyFinancials.profitMarginPercent.toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Monthly Barber Revenue Breakdown Box */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black flex items-center justify-center text-lg shadow-2xs">
                  ✂️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
                    ยอดรายได้สะสมของช่างแต่ละคนประจำเดือน {formatThaiMonthYear(selectedMonth)}
                  </h3>
                  <p className="text-xs text-stone-500">
                    สรุปผลงานช่างทั้งเดือน: ค่าตัดผม • ค่าเคมี • ค่าสินค้า • ค่าทิป และจำนวนหัว
                  </p>
                </div>
              </div>
            </div>

            {/* Barber Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {monthlyBarberData.stats.map((st) => {
                const percentOfTotal = monthlyBarberData.grandTotalGenerated > 0 
                  ? Math.round((st.totalGenerated / monthlyBarberData.grandTotalGenerated) * 100) 
                  : 0;

                return (
                  <div
                    key={st.barber.id}
                    className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3 relative flex flex-col justify-between hover:border-amber-300 transition"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        >
                          {st.barber.nickname.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            ช่าง{st.barber.nickname}
                            <span className="text-[10px] text-stone-500 font-normal font-mono">({st.barber.name})</span>
                          </h4>
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            {st.totalHeads} หัว ({percentOfTotal}% ของร้าน)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">รวมทั้งเดือน</span>
                        <strong className="text-sm font-black text-stone-900 font-mono block">
                          {formatCurrency(st.totalGenerated)}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <Scissors className="w-3.5 h-3.5 text-amber-600" /> ค่าตัดผม ({st.haircutCount} หัว)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.haircutSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <FlaskConical className="w-3.5 h-3.5 text-cyan-600" /> ค่าเคมี ดัด/ยืด/ย้อม ({st.chemicalCount} งาน)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.chemicalSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> ค่าขายสินค้า ({st.productCount} ชิ้น)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.productSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <HeartHandshake className="w-3.5 h-3.5 text-pink-500" /> ค่าทิป
                        </span>
                        <strong className="text-pink-600 font-bold font-mono text-xs">
                          {formatCurrency(st.tipTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Table for Month */}
            <div className="overflow-x-auto rounded-2xl border border-stone-200 mt-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-stone-100/80 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">ช่างตัดผม</th>
                    <th className="p-3 text-center">จำนวนหัว (Heads)</th>
                    <th className="p-3 text-right">ค่าตัดผม (฿)</th>
                    <th className="p-3 text-right">ค่าเคมี (฿)</th>
                    <th className="p-3 text-right">ค่าขายสินค้า (฿)</th>
                    <th className="p-3 text-right">ค่าทิป (฿)</th>
                    <th className="p-3 text-right bg-amber-50/60 font-black text-amber-900">รวมรายได้ทั้งหมด (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {monthlyBarberData.stats.map((st) => (
                    <tr key={st.barber.id} className="hover:bg-stone-50 transition">
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        />
                        <span>ช่าง{st.barber.nickname}</span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-stone-800">
                        {formatNumber(st.totalHeads)} หัว
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.haircutSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.chemicalSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.productSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-pink-600 font-semibold">
                        {formatCurrency(st.tipTotal)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-950 bg-amber-50/40">
                        {formatCurrency(st.totalGenerated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-100 font-black text-stone-900 text-xs border-t-2 border-stone-300">
                  <tr>
                    <td className="p-3">รวมช่างทุกคนทั้งเดือน</td>
                    <td className="p-3 text-center font-mono text-amber-900">{formatNumber(monthlyBarberData.totalHaircutCount)} หัว</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(monthlyBarberData.totalHaircut)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(monthlyBarberData.totalChemical)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(monthlyBarberData.totalProduct)}</td>
                    <td className="p-3 text-right font-mono text-pink-600">{formatCurrency(monthlyBarberData.totalTips)}</td>
                    <td className="p-3 text-right font-mono text-sm text-amber-950 bg-amber-100/70">
                      {formatCurrency(monthlyBarberData.grandTotalGenerated)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* FULL MONTH GENERAL LEDGER TABLE (สมุดรายวันรับ-จ่าย วันที่ 1 ถึงสิ้นเดือน) */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-black flex items-center justify-center text-lg shadow-2xs">
                  🗓️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                    สมุดรายวันรับ-จ่ายทั้งเดือน (วันที่ 1 ถึง {daysInMonth} {formatThaiMonthYear(selectedMonth)})
                  </h3>
                  <p className="text-xs text-stone-500">
                    แจกแจงเงินสด เงินโอน จำนวนหัว ยอดขายรวม และกำไรสุทธิในแต่ละวันเพื่อนำไปลงโปรแกรมบัญชีได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-stone-100 border border-stone-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setTableFilter('ALL_DAYS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tableFilter === 'ALL_DAYS'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    แสดงครบทุกวัน (1 - {daysInMonth})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableFilter('ACTIVE_DAYS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tableFilter === 'ACTIVE_DAYS'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    เฉพาะวันที่มีรายการ
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPDFReport('MONTHLY')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 rounded-xl text-xs font-black transition cursor-pointer"
                  title="ดาวน์โหลดสมุดรายวันเป็น PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>PDF รายงานบัญชี</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCSV('MONTHLY')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200 max-h-[550px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-stone-100 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200 z-10 shadow-xs">
                  <tr>
                    <th className="p-3 text-center w-16">วันที่</th>
                    <th className="p-3 text-center w-14">วัน</th>
                    <th className="p-3 text-center">จำนวนหัว (Heads)</th>
                    <th className="p-3 text-right text-emerald-800">💵 เงินสด (฿)</th>
                    <th className="p-3 text-right text-cyan-800">📱 เงินโอน (฿)</th>
                    <th className="p-3 text-right font-black text-amber-900 bg-amber-50/70">💰 รวมยอดขายวันนั้น (฿)</th>
                    <th className="p-3 text-right text-rose-700">💸 ค่าใช้จ่าย (฿)</th>
                    <th className="p-3 text-right font-black text-stone-900">📈 กำไรสุทธิ (฿)</th>
                    <th className="p-3 text-center w-20">จำนวนบิล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white font-mono">
                  {displayedLedger.map((row) => {
                    const hasActivity = row.billsCount > 0 || row.expenses > 0;

                    return (
                      <tr
                        key={row.dayNum}
                        className={`transition ${
                          row.isToday
                            ? 'bg-amber-50/60 font-semibold'
                            : row.isWeekend
                            ? 'bg-stone-50/50 hover:bg-stone-100/80'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <td className="p-2.5 text-center font-bold text-stone-900 font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <span>{row.dayNum}</span>
                            {row.isToday && (
                              <span className="bg-amber-500 text-white text-[9px] px-1 py-0.2 rounded-md font-bold">
                                วันนี้
                              </span>
                            )}
                          </div>
                        </td>

                        <td
                          className={`p-2.5 text-center font-sans text-[11px] font-bold ${
                            row.dayName === 'ส.' || row.dayName === 'อา.'
                              ? 'text-rose-500'
                              : 'text-stone-500'
                          }`}
                        >
                          {row.dayName}
                        </td>

                        <td className="p-2.5 text-center font-sans font-bold text-stone-800">
                          {row.heads > 0 ? (
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-black">
                              {formatNumber(row.heads)} หัว
                            </span>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>

                        <td className="p-2.5 text-right font-bold text-emerald-800">
                          {row.cash > 0 ? formatCurrency(row.cash) : <span className="text-stone-300 font-normal">0฿</span>}
                        </td>

                        <td className="p-2.5 text-right font-bold text-cyan-800">
                          {row.transfer > 0 ? formatCurrency(row.transfer) : <span className="text-stone-300 font-normal">0฿</span>}
                        </td>

                        <td className="p-2.5 text-right font-black text-amber-950 bg-amber-50/50">
                          {row.total > 0 ? (
                            <span className="text-xs font-black">{formatCurrency(row.total)}</span>
                          ) : (
                            <span className="text-stone-300 font-normal">0฿</span>
                          )}
                        </td>

                        <td className="p-2.5 text-right text-rose-600 font-medium">
                          {row.expenses > 0 ? `-${formatCurrency(row.expenses)}` : <span className="text-stone-300 font-normal">0฿</span>}
                        </td>

                        <td className="p-2.5 text-right font-black">
                          {hasActivity ? (
                            <span className={row.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                              {formatCurrency(row.net)}
                            </span>
                          ) : (
                            <span className="text-stone-300 font-normal">0฿</span>
                          )}
                        </td>

                        <td className="p-2.5 text-center font-sans text-[11px] text-stone-500">
                          {row.billsCount > 0 ? `${row.billsCount} บิล` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="sticky bottom-0 bg-stone-900 text-white font-mono text-xs border-t-2 border-stone-800 z-10 shadow-lg">
                  <tr>
                    <td colSpan={2} className="p-3 font-bold font-sans text-amber-300 text-xs">
                      รวมทั้งเดือน ({formatThaiMonthYear(selectedMonth)})
                    </td>
                    <td className="p-3 text-center font-sans font-black text-amber-300">
                      {formatNumber(monthlyFinancials.totalHeads)} หัว
                    </td>
                    <td className="p-3 text-right font-black text-emerald-300">
                      {formatCurrency(monthlyFinancials.cashRevenue)}
                    </td>
                    <td className="p-3 text-right font-black text-cyan-300">
                      {formatCurrency(monthlyFinancials.transferRevenue)}
                    </td>
                    <td className="p-3 text-right font-black text-amber-300 text-sm bg-stone-800/80">
                      {formatCurrency(monthlyFinancials.grandTotalRevenue)}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-300">
                      -{formatCurrency(monthlyFinancials.totalExpenseAmount)}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-300 text-sm">
                      {formatCurrency(monthlyFinancials.netOperatingProfit)}
                    </td>
                    <td className="p-3 text-center font-sans font-bold text-stone-300">
                      {monthlyFinancials.totalBillsCount} บิล
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: 📊 FINANCIAL ANALYTICS & P&L OVERVIEW (งบการเงิน & สถิติภาพรวม)   */}
      {/* ========================================================================= */}
      {activeTab === 'ALL_IN_ONE' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Executive Comparative Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" /> ตารางเปรียบเทียบตัวชี้วัดทางการเงิน (Key Financial Metrics)
              </span>
              <span className="text-xs text-stone-500">
                วัน: <strong className="text-stone-900">{formatThaiDate(selectedDate)}</strong> | เดือน: <strong className="text-stone-900">{formatThaiMonthYear(selectedMonth)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
              {/* Metric 1: Heads & Tickets */}
              <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-stone-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" /> ปริมาณลูกค้า & บิล
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">Traffic</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-stone-900 font-mono text-sm">{formatNumber(dailyFinancials.totalHeads)} หัว ({dailyFinancials.totalBillsCount} บิล)</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-stone-900 font-mono text-sm">{formatNumber(monthlyFinancials.totalHeads)} หัว ({monthlyFinancials.totalBillsCount} บิล)</strong>
                  </div>
                </div>
              </div>

              {/* Metric 2: Cash Volume */}
              <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-stone-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" /> ยอดเงินสดรับจริง (Cash)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">In-Hand</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-emerald-800 font-mono text-sm">{formatCurrency(dailyFinancials.cashRevenue)}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-emerald-800 font-mono text-sm">{formatCurrency(monthlyFinancials.cashRevenue)}</strong>
                  </div>
                </div>
              </div>

              {/* Metric 3: Bank Transfer */}
              <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-stone-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-cyan-600" /> ยอดเงินโอน/PromptPay
                  </span>
                  <span className="text-[10px] bg-cyan-100 text-cyan-900 px-1.5 py-0.5 rounded font-bold">Banking</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-cyan-800 font-mono text-sm">{formatCurrency(dailyFinancials.transferRevenue)}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-cyan-800 font-mono text-sm">{formatCurrency(monthlyFinancials.transferRevenue)}</strong>
                  </div>
                </div>
              </div>

              {/* Metric 4: Net Operating Profit */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-extrabold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-700" /> กำไรจากการดำเนินงานสุทธิ
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-black">Net P&L</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-amber-200">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-emerald-700 font-mono text-sm">{formatCurrency(dailyFinancials.netOperatingProfit)}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-amber-200">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-emerald-700 font-mono text-sm">{formatCurrency(monthlyFinancials.netOperatingProfit)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Categories & Expenses Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Category Distribution */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="text-xs font-black uppercase text-stone-800 flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-amber-600" /> สัดส่วนโครงสร้างรายได้ทั้งเดือน (Revenue by Category)
                </h4>
                <span className="text-xs font-mono font-bold text-stone-600">
                  รวม {formatCurrency(monthlyFinancials.grandTotalRevenue)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Haircut */}
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-amber-950 flex items-center gap-2">
                      <span>✂️ บริการตัดผม & ออกแบบทรง</span>
                      <span className="text-[10px] text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                        {monthlyFinancials.totalHeads} หัว
                      </span>
                    </span>
                    <strong className="font-mono text-amber-950 text-sm">{formatCurrency(monthlyFinancials.grossHaircut)}</strong>
                  </div>
                  <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${monthlyFinancials.grandTotalRevenue > 0 ? (monthlyFinancials.grossHaircut / monthlyFinancials.grandTotalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-amber-800 flex justify-between">
                    <span>สัดส่วน: {monthlyFinancials.grandTotalRevenue > 0 ? ((monthlyFinancials.grossHaircut / monthlyFinancials.grandTotalRevenue) * 100).toFixed(1) : 0}%</span>
                    <span>เฉลี่ย: {monthlyFinancials.totalHeads > 0 ? formatCurrency(monthlyFinancials.grossHaircut / monthlyFinancials.totalHeads) : '0฿'}/หัว</span>
                  </div>
                </div>

                {/* Chemical */}
                <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-cyan-950 flex items-center gap-2">
                      <span>🧪 บริการงานเคมี ดัด / ยืด / ทำสี</span>
                    </span>
                    <strong className="font-mono text-cyan-950 text-sm">{formatCurrency(monthlyFinancials.grossChemical)}</strong>
                  </div>
                  <div className="w-full bg-cyan-200/70 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-600 h-full rounded-full transition-all"
                      style={{ width: `${monthlyFinancials.grandTotalRevenue > 0 ? (monthlyFinancials.grossChemical / monthlyFinancials.grandTotalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-cyan-800 flex justify-between">
                    <span>สัดส่วน: {monthlyFinancials.grandTotalRevenue > 0 ? ((monthlyFinancials.grossChemical / monthlyFinancials.grandTotalRevenue) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>

                {/* Product */}
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-purple-950 flex items-center gap-2">
                      <span>🧴 สินค้าจัดแต่งทรงผม & ดูแลผม</span>
                    </span>
                    <strong className="font-mono text-purple-950 text-sm">{formatCurrency(monthlyFinancials.grossProduct)}</strong>
                  </div>
                  <div className="w-full bg-purple-200/70 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${monthlyFinancials.grandTotalRevenue > 0 ? (monthlyFinancials.grossProduct / monthlyFinancials.grandTotalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-purple-800 flex justify-between">
                    <span>สัดส่วน: {monthlyFinancials.grandTotalRevenue > 0 ? ((monthlyFinancials.grossProduct / monthlyFinancials.grandTotalRevenue) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>

                {/* Tips */}
                {monthlyFinancials.totalTips > 0 && (
                  <div className="flex justify-between items-center p-2.5 rounded-2xl bg-pink-50/60 border border-pink-200">
                    <span className="font-bold text-pink-950 flex items-center gap-2">
                      <span>💖 ค่าทิปช่างสะสม</span>
                    </span>
                    <strong className="font-mono text-pink-950 text-sm">{formatCurrency(monthlyFinancials.totalTips)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Expense Classification by Category */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="text-xs font-black uppercase text-stone-800 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" /> จำแนกหมวดหมู่ค่าใช้จ่ายทั้งเดือน (Expense Breakdown)
                </h4>
                <span className="text-xs font-mono font-bold text-rose-600">
                  รวม -{formatCurrency(monthlyFinancials.totalExpenseAmount)}
                </span>
              </div>

              {monthlyExpenses.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs bg-stone-50 rounded-2xl">
                  ไม่มีรายการค่าใช้จ่ายในเดือนนี้
                </div>
              ) : (
                <div className="space-y-2 text-xs max-h-[330px] overflow-y-auto pr-1">
                  {Object.entries(monthlyFinancials.expenseByCategory)
                    .filter(([_, cat]) => cat.amount > 0)
                    .sort((a, b) => b[1].amount - a[1].amount)
                    .map(([catKey, catData]) => {
                      const percentOfExpense = monthlyFinancials.totalExpenseAmount > 0 
                        ? (catData.amount / monthlyFinancials.totalExpenseAmount) * 100 
                        : 0;

                      return (
                        <div key={catKey} className="p-3 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-stone-800 flex items-center gap-2">
                              <span>{catData.emoji} {catData.label}</span>
                              <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200 font-medium">
                                {catData.count} รายการ
                              </span>
                            </span>
                            <strong className="font-mono text-rose-700 text-sm">-{formatCurrency(catData.amount)}</strong>
                          </div>
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-rose-500 h-full rounded-full transition-all"
                              style={{ width: `${percentOfExpense}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-stone-400 flex justify-between">
                            <span>สัดส่วนค่าใช้จ่าย: {percentOfExpense.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal Preview */}
      <ReceiptModal
        isOpen={Boolean(selectedBillForReceipt)}
        onClose={() => setSelectedBillForReceipt(null)}
        bill={selectedBillForReceipt}
        settings={settings}
      />

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
          onUnmergeBill={onUnmergeBill}
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

      {/* Professional Accountant PDF Report Modal */}
      {showAccountantPDFModal && (
        <AccountantPDFModal
          isOpen={showAccountantPDFModal}
          onClose={() => setShowAccountantPDFModal(false)}
          reportType={accountantPDFReportType}
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          bills={bills}
          expenses={expenses}
          barbers={barbers}
          settings={settings}
          onExportCSV={() => handleExportCSV(accountantPDFReportType)}
        />
      )}

      {/* Merge Bills Modal */}
      {isMergeBillsModalOpen && (
        <MergeBillsModal
          isOpen={isMergeBillsModalOpen}
          onClose={() => setIsMergeBillsModalOpen(false)}
          dailyBills={dailyBills}
          initialSelectedBillIds={initialMergeBillIds}
          barbers={barbers}
          onConfirmMerge={handleConfirmMergeBills}
          settings={settings}
        />
      )}

      {/* Unmerge Confirmation Modal */}
      {unmergingBill && (
        <UnmergeConfirmModal
          isOpen={!!unmergingBill}
          onClose={() => setUnmergingBill(null)}
          bill={unmergingBill}
          allBills={bills}
          onConfirmUnmerge={(b) => {
            if (onUnmergeBill) onUnmergeBill(b);
            setUnmergingBill(null);
          }}
        />
      )}
    </div>
  );
};
