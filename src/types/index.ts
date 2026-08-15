export type MemberTier = 'MEMBER' | 'VIP_GOLD' | 'PLATINUM' | 'SILVER' | 'GOLD' | 'DIAMOND' | string;

export interface Member {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  birthday?: string;
  gender?: 'M' | 'F' | 'OTHER';
  tier: MemberTier;
  packageLevel?: string; // ระดับที่ซื้อแพ็กเกจ เช่น Silver, Gold, Platinum, VIP
  balance: number; // จำนวนเงินคงเหลือในกระเป๋า/แพ็กเกจ
  points: number;
  totalSpent: number;
  visitCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  packages?: MemberPackage[];
}

export interface MemberPackage {
  id: string;
  packageId: string;
  packageName: string;
  totalSessions?: number;
  remainingSessions?: number;
  purchaseDate: string;
  expiryDate?: string;
  pricePaid: number;
  receivedValue?: number;
  notes?: string;
}

export interface PackageTemplate {
  id: string;
  name: string;
  description: string;
  level: string; // ระดับไหน เช่น 'Silver', 'Gold', 'Platinum', 'VIP', 'Diamond'
  price: number; // ราคาที่จ่าย
  receivedValue: number; // ราคาที่ได้รับ (มูลค่าเครดิตในแพ็กเกจ)
  colorTheme: string; // ธีมสีสัน เช่น 'emerald', 'blue', 'amber', 'purple', 'rose', 'cyan', 'indigo', 'orange'
  serviceId?: string;
  totalSessions?: number;
  originalValue?: number;
  validityDays?: number;
  isActive: boolean;
}

export interface Barber {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  avatar?: string;
  color?: string;
  employeeCode?: string;
  idCardNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  positionTitle?: string;
  department?: string;
  startDate?: string;
  baseSalary?: number;
  baseSalaryGuarantee?: number;
  minGuarantee?: number;
  serviceComRate?: number;
  productComRate?: number;
  haircutCommissionRate?: number;
  chemicalCommissionRate?: number;
  productCommissionRate?: number;
  roleAllowance?: number;
  isActive: boolean;
  notes?: string;
}

export type ItemCategory = 'HAIRCUT' | 'CHEMICAL' | 'PRODUCT' | 'PACKAGE' | 'OTHER';
export type ServiceCategory = ItemCategory;

export interface ServiceItem {
  id: string;
  code?: string;
  name: string;
  category: ItemCategory;
  price: number;
  cost?: number;
  durationMinutes: number;
  customCommissionRate?: number;
  stock?: number;
  trackStock?: boolean;
  image?: string;
  description?: string;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  serviceId: string;
  name: string;
  category: ItemCategory;
  price: number;
  quantity: number;
  discount: number;
  barberId: string;
  barberName: string;
  isPackageRedemption?: boolean;
  memberPackageId?: string;
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'SPLIT' | 'MEMBER' | 'PROMPTPAY' | 'CREDIT_CARD';

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  customerType: 'GUEST' | 'MEMBER';
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  pointsDiscount: number;
  pointsRedeemed?: number;
  pointsEarned: number;
  tipAmount: number;
  tipBarberId?: string;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  cashChange?: number;
  splitCashAmount?: number;
  splitTransferAmount?: number;
  paymentReference?: string;
  memberDeductedAmount?: number; // ยอดที่หักจากยอดเงินสมาชิก
  memberBalanceBefore?: number; // ยอดคงเหลือก่อนหัก
  memberBalanceAfter?: number; // ยอดคงเหลือหลังหัก
  status: 'COMPLETED' | 'VOIDED';
  voidReason?: string;
  voidedAt?: string;
  notes?: string;
  createdBy: string;
}

export type ExpenseCategory = 
  | 'UTILITIES' 
  | 'CHEMICALS_EQUIPMENT' 
  | 'SUPPLIES'
  | 'RENT' 
  | 'BARBER_ADVANCE' 
  | 'SALARY_DRAW'
  | 'FOOD_WELFARE' 
  | 'SNACK_DRINK'
  | 'MAINTENANCE'
  | 'MARKETING'
  | 'OTHER';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  payer?: string;
  paidTo?: string;
  paymentMethod: 'CASH' | 'TRANSFER';
  barberId?: string;
  barberName?: string;
  receiptNote?: string;
  note?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface CashTransaction {
  id: string;
  type: 'OPENING' | 'CASH_IN' | 'CASH_OUT' | 'SALE' | 'EXPENSE' | 'CLOSING';
  amount: number;
  reason: string;
  date: string;
  staffName: string;
  billId?: string;
  expenseId?: string;
}

export interface CashDrawerMovement {
  id: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  reason: string;
  staffName?: string;
  performedBy?: string;
  timestamp: string;
}

export interface CashDrawerSummary {
  date: string;
  openingFloat: number;
  cashSales: number;
  cashInTotal: number;
  cashOutTotal: number;
  cashExpenses: number;
  expectedBalance: number;
  actualCounted?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  movements?: CashDrawerMovement[];
  openedAt?: string;
  openedBy?: string;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
}

export interface SalarySlip {
  id: string;
  barberId: string;
  barberName: string;
  barberNickname?: string;
  employeeCode?: string;
  idCardNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  positionTitle?: string;
  department?: string;
  startDate?: string;
  month: string;
  period?: string;
  issueDate?: string;
  paymentDate?: string;
  paymentMethod?: 'BANK_TRANSFER' | 'CASH' | string;
  
  // Earnings (รายได้)
  baseSalary: number; // ฐานเงินเดือนการันตี
  minGuarantee?: number; // ยอดประกันรายได้ขั้นต่ำ
  headsCount?: number; // จำนวนหัวที่ให้บริการ
  haircutSalesTotal?: number; // ยอดขายบริการตัดผม
  haircutComPercent?: number; // % คอมมิชชั่นตัดผม
  haircutCommission?: number; // ค่าคอมมิชชั่นตัดผม
  chemicalSalesTotal?: number; // ยอดขายบริการเคมี
  chemicalComPercent?: number; // % คอมมิชชั่นเคมี
  chemicalCommission?: number; // ค่าคอมมิชชั่นเคมี
  serviceSalesTotal: number;
  serviceComPercent: number;
  serviceCommission: number;
  productSalesTotal: number;
  productComPercent: number;
  productCommission: number;
  guaranteeTopup: number; // ส่วนเติมเต็มการันตีเงินเดือน
  overtimePay?: number; // ค่าล่วงเวลา (OT)
  attendanceBonus?: number; // เบี้ยขยัน
  positionAllowance?: number; // ค่าตำแหน่ง / ทักษะพิเศษ
  transportAllowance?: number; // ค่าเดินทาง / เบี้ยเลี้ยง
  specialBonus?: number; // เงินรางวัล / โบนัสพิเศษ
  tipTotal: number; // เงินทิปจากลูกค้า
  otherEarnings?: number; // รายได้อื่นๆ
  otherEarningsDescription?: string; // รายละเอียดรายได้อื่นๆ
  
  // Deductions (รายการหัก)
  advanceDeduction: number; // หักเงินเบิกล่วงหน้า
  socialSecurity: number; // หักประกันสังคม
  taxPercent?: number; // % ภาษีหัก ณ ที่จ่าย (เช่น 0%, 1%, 3%, 5%)
  taxDeduction: number; // หักภาษี ณ ที่จ่าย
  providentFund?: number; // กองทุนสำรองเลี้ยงชีพ / กองทุนสะสม
  lateAbsenceDeduction?: number; // หักขาดงาน / มาสาย
  uniformToolDeduction?: number; // หักค่าเครื่องแบบ / อุปกรณ์ / ค่าปรับ
  otherDeduction: number; // หักอื่นๆ
  otherDeductionDescription?: string; // รายละเอียดรายการหักอื่นๆ
  
  // Summary (สรุปยอด)
  grossEarnings: number;
  totalDeductions: number;
  netPayable: number;
  
  status: 'PENDING' | 'PAID' | 'DRAFT';
  paidAt?: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  storeSlogan: string;
  address: string;
  phone: string;
  taxId: string;
  logoUrl?: string;
  promptPayId: string;
  promptPayName: string;
  receiptFooterMessage: string;
  currency: string;
  
  // Store-wide Global Commission Rates
  haircutCommissionRate: number; // % ค่าตัดรวมทั้งร้าน เช่น 50%
  chemicalCommissionRate: number; // % ค่าเคมีรวมทั้งร้าน เช่น 40%
  productCommissionRate: number; // % ค่าขายสินค้ารวมทั้งร้าน เช่น 10%

  enablePoints?: boolean;
  bahtPerPoint?: number;
  pointDiscountValue?: number;
  
  brandColor?: string; // รหัสสีประจำแบรนด์ เช่น #D97706, #059669, #2563EB
  brandHeaderStyle?: 'light' | 'brand' | 'dark'; // สไตล์สีพื้นหลังของแถบ Header

  enableSalarySlips?: boolean;
  enableTips?: boolean;
  enableCashDrawer?: boolean;

  isPinProtected?: boolean;
  adminPin: string;
}

export type ActiveTab = 
  | 'POS' 
  | 'REPORTS' 
  | 'MEMBERS' 
  | 'EXPENSES' 
  | 'CASH_DRAWER' 
  | 'DRAWER'
  | 'SALARY'
  | 'SALARY_SLIPS' 
  | 'SETTINGS';
