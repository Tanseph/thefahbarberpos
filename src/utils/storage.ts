import {
  Barber,
  Bill,
  CashDrawerSummary,
  CashTransaction,
  Expense,
  Member,
  PackageTemplate,
  SalarySlip,
  ServiceItem,
  StoreSettings
} from '../types';
import { getCurrentPeriodString, getTodayDateString } from './formatters';

export function sanitizeStoreId(email: string): string {
  if (!email || typeof email !== 'string') return 'default_store';
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return clean || 'default_store';
}

const AUTH_KEY = 'barbershop_active_account_email';
const SAVED_ACCOUNTS_KEY = 'barbershop_saved_accounts';

function getStoreKey(baseKey: string, email?: string): string {
  const activeEmail = email || localStorage.getItem(AUTH_KEY) || 'default_store';
  const id = sanitizeStoreId(activeEmail);
  return `barberpos_${id}_${baseKey}`;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'THE FAH BARBER & SALON',
  storeSlogan: 'พรีเมียมบาร์เบอร์ช็อป สไตล์โมเดิร์นคลาสสิก',
  address: '88/9 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  phone: '089-123-4567',
  taxId: '0105566089912',
  logoUrl: '',
  promptPayId: '0891234567',
  promptPayName: 'นาย บาร์เบอร์ มาสเตอร์ (THE FAH BARBER)',
  receiptFooterMessage: 'ขอบคุณที่ไว้วางใจให้เราดูแลทรงผมของคุณ ✨💈 แล้วพบกันใหม่ครับ!',
  currency: '฿',
  haircutCommissionRate: 50, // ค่าตัด 50%
  chemicalCommissionRate: 40, // ค่าเคมี 40%
  productCommissionRate: 10, // ค่าขายสินค้า 10%
  enablePoints: true,
  bahtPerPoint: 100, // 100 บาท = 1 แต้ม
  pointDiscountValue: 1, // 1 แต้ม = 1 บาท
  brandColor: '#D97706',
  brandHeaderStyle: 'light',
  enableSalarySlips: true,
  enableTips: true,
  enableCashDrawer: true,
  isPinProtected: true,
  adminPin: '1234',
};
export const initialSettings = DEFAULT_SETTINGS;

export const INITIAL_BARBERS: Barber[] = [
  {
    id: 'barber-1',
    name: 'ชานนท์ สุขเกษม',
    nickname: 'ฟ้า',
    phone: '081-111-2222',
    color: '#D97706',
    employeeCode: 'EMP-001',
    idCardNumber: '1-1002-00345-67-8',
    bankName: 'กสิกรไทย (KBANK)',
    bankAccountNumber: '045-2-34567-8',
    positionTitle: 'หัวหน้าช่าง / ช่างผมอาวุโส (Master Barber)',
    department: 'แผนกช่างผมและบริการ',
    startDate: '2023-01-15',
    baseSalary: 15000,
    baseSalaryGuarantee: 15000,
    minGuarantee: 15000,
    serviceComRate: 50,
    productComRate: 15,
    haircutCommissionRate: 50,
    chemicalCommissionRate: 40,
    productCommissionRate: 15,
    roleAllowance: 3000,
    isActive: true,
    notes: 'เชี่ยวชาญการตัดเฟด (Skin Fade) และออกแบบทรงผมเฉพาะบุคคล',
  },
  {
    id: 'barber-2',
    name: 'ธนภูมิ เลิศวิจิตร',
    nickname: 'บอย',
    phone: '082-222-3333',
    color: '#2563EB',
    employeeCode: 'EMP-002',
    idCardNumber: '1-1004-00567-89-1',
    bankName: 'ไทยพาณิชย์ (SCB)',
    bankAccountNumber: '123-4-56789-0',
    positionTitle: 'ช่างตัดผมเคมีและสไตลิสต์ (Senior Stylist)',
    department: 'แผนกช่างผมและบริการ',
    startDate: '2023-06-01',
    baseSalary: 15000,
    baseSalaryGuarantee: 15000,
    minGuarantee: 15000,
    serviceComRate: 50,
    productComRate: 10,
    haircutCommissionRate: 50,
    chemicalCommissionRate: 45,
    productCommissionRate: 10,
    roleAllowance: 1500,
    isActive: true,
    notes: 'มือหนึ่งงานดัดผมสไตล์เกาหลี (Korean Perm) และยืดวอลลุ่ม',
  },
  {
    id: 'barber-3',
    name: 'วรพล ภักดีรัตน์',
    nickname: 'กอล์ฟ',
    phone: '083-333-4444',
    color: '#059669',
    employeeCode: 'EMP-003',
    idCardNumber: '1-1008-00912-34-5',
    bankName: 'กรุงเทพ (BBL)',
    bankAccountNumber: '234-5-67890-1',
    positionTitle: 'ช่างตัดผมมืออาชีพ (Professional Barber)',
    department: 'แผนกช่างผมและบริการ',
    startDate: '2024-02-10',
    baseSalary: 12000,
    baseSalaryGuarantee: 12000,
    minGuarantee: 12000,
    serviceComRate: 50,
    productComRate: 10,
    haircutCommissionRate: 50,
    chemicalCommissionRate: 40,
    productCommissionRate: 10,
    roleAllowance: 0,
    isActive: true,
    notes: 'ชำนาญการโกนหนวด โพกผ้าอุ่น และตัดผมวินเทจสไตล์ Pompadour',
  },
];
export const initialBarbers = INITIAL_BARBERS;

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    code: 'HC01',
    name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)',
    category: 'HAIRCUT',
    price: 350,
    durationMinutes: 45,
    description: 'สระผม + ออกแบบทรงผม + ตัดเฟด + เซ็ตติ้งจัดแต่งทรง',
    isActive: true,
  },
  {
    id: 'srv-2',
    code: 'HC02',
    name: '✂️ ตัดผม + โกนหนวดโพกผ้าอุ่น (Haircut & Hot Towel Shave)',
    category: 'HAIRCUT',
    price: 550,
    durationMinutes: 60,
    description: 'ตัดผมพรีเมียมพร้อมโกนหนวดด้วยใบมีดคมกริบและผ้าร้อนอโรม่า',
    isActive: true,
  },
  {
    id: 'srv-3',
    code: 'HC03',
    name: '🪒 โกนหนวดกันเครา โพกผ้าร้อน (Hot Towel Shave)',
    category: 'HAIRCUT',
    price: 250,
    durationMinutes: 30,
    description: 'โกนหนวดเกลี้ยงเกลาด้วยโฟมอุ่นและผ้าร้อนผ่อนคลายกล้ามเนื้อ',
    isActive: true,
  },
  {
    id: 'srv-4',
    code: 'CH01',
    name: '🧪 ดัดวอลลุ่มสไตล์เกาหลี (Korean Volume Perm)',
    category: 'CHEMICAL',
    price: 1500,
    durationMinutes: 90,
    description: 'เพิ่มวอลลุ่มให้ผมดูหนา มีมิติ จัดทรงง่าย สไตล์โอปป้า',
    isActive: true,
  },
  {
    id: 'srv-5',
    code: 'CH02',
    name: '🧪 ย้อมสีผมแฟชั่น / ปิดผมขาว (Hair Color)',
    category: 'CHEMICAL',
    price: 1200,
    durationMinutes: 75,
    description: 'สีย้อมออร์แกนิก กลิ่นไม่ฉุน ถนอมเส้นผมและหนังศีรษะ',
    isActive: true,
  },
  {
    id: 'srv-6',
    code: 'CH03',
    name: '🧪 ดัดฟอยล์สไตล์ฮิปฮอป (Foil Perm / Twist Perm)',
    category: 'CHEMICAL',
    price: 1800,
    durationMinutes: 120,
    description: 'ดัดผมแนวสตรีท เท็กซ์เจอร์ชัด อยู่ทรงนาน',
    isActive: true,
  },
  {
    id: 'srv-7',
    code: 'TR01',
    name: '💆 สปาดีท็อกซ์หนังศีรษะ & สระไดร์ (Scalp Detox Spa)',
    category: 'OTHER',
    price: 450,
    durationMinutes: 45,
    description: 'ขจัดสารเคมีและสิ่งอุดตัน นวดกดจุดผ่อนคลายศีรษะ',
    isActive: true,
  },
  {
    id: 'srv-8',
    code: 'PR01',
    name: '🧴 แว็กซ์แต่งผมโพเมดสูตรน้ำ (Water-based Pomade 100g)',
    category: 'PRODUCT',
    price: 490,
    durationMinutes: 0,
    description: 'พลังจัดทรงสูง ล้างออกง่าย ให้ความเงาปานกลาง',
    isActive: true,
  },
];
export const initialServices = INITIAL_SERVICES;

export const INITIAL_PACKAGE_TEMPLATES: PackageTemplate[] = [
  {
    id: 'pkg-1',
    level: 'Silver',
    name: 'แพ็กเกจ Silver Saver 2,000฿ (คุ้มค่าตัดผม)',
    price: 2000,
    receivedValue: 2400,
    validityDays: 180,
    colorTheme: 'slate',
    description: 'เติมเงิน 2,000 บาท ได้รับมูลค่า 2,400 บาท สำหรับใช้บริการตัดผมและโกนหนวด',
    isActive: true,
  },
  {
    id: 'pkg-2',
    level: 'Gold',
    name: 'แพ็กเกจ Gold Grooming 3,000฿ (ยอดนิยม)',
    price: 3000,
    receivedValue: 3800,
    validityDays: 365,
    colorTheme: 'amber',
    description: 'เติมเงิน 3,000 บาท ได้รับมูลค่า 3,800 บาท ใช้ได้ทุกบริการรวมทั้งงานเคมี',
    isActive: true,
  },
  {
    id: 'pkg-3',
    level: 'Platinum',
    name: 'แพ็กเกจ Platinum VIP 5,000฿ (สุดคุ้มรับเพิ่ม 1,500฿)',
    price: 5000,
    receivedValue: 6500,
    validityDays: 365,
    colorTheme: 'cyan',
    description: 'เติมเงิน 5,000 บาท ได้รับมูลค่า 6,500 บาท สิทธิ์พิเศษรับของสมนาคุณ',
    isActive: true,
  },
];
export const initialPackages = INITIAL_PACKAGE_TEMPLATES;

export const INITIAL_MEMBERS: Member[] = [];
export const initialMembers: Member[] = [];

export const INITIAL_BILLS: Bill[] = [];
export const initialBills: Bill[] = [];

export const INITIAL_EXPENSES: Expense[] = [];
export const initialExpenses: Expense[] = [];

export const INITIAL_CASH_DRAWER: CashDrawerSummary = {
  date: getTodayDateString(),
  openingFloat: 0,
  cashSales: 0,
  cashInTotal: 0,
  cashOutTotal: 0,
  cashExpenses: 0,
  expectedBalance: 0,
  status: 'OPEN',
};
export const initialCashDrawer = INITIAL_CASH_DRAWER;

export const INITIAL_SALARY_SLIPS: SalarySlip[] = [];
export const initialSalarySlips: SalarySlip[] = [];

export const storage = {
  // Account & Multi-tenant Helpers
  getActiveAccountEmail(): string | null {
    return localStorage.getItem(AUTH_KEY);
  },

  setActiveAccountEmail(email: string) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    localStorage.setItem(AUTH_KEY, cleanEmail);
    this.addSavedAccount(cleanEmail);
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getSavedAccounts(): string[] {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : ['thefahbarber@gmail.com'];
      return Array.from(new Set(list));
    } catch {
      return ['thefahbarber@gmail.com'];
    }
  },

  addSavedAccount(email: string) {
    const list = this.getSavedAccounts();
    const cleanEmail = email.trim().toLowerCase();
    if (!list.includes(cleanEmail)) {
      list.push(cleanEmail);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
    }
  },

  removeSavedAccount(email: string) {
    const list = this.getSavedAccounts().filter(e => e !== email.trim().toLowerCase());
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  // Store-Scoped Getters and Setters
  getSettings(email?: string): StoreSettings {
    const key = getStoreKey('settings', email);
    const raw = localStorage.getItem(key);
    const activeEmail = email || localStorage.getItem(AUTH_KEY) || '';
    const cleanEmail = activeEmail.trim().toLowerCase();
    
    // For primary account default, use store name; for any other new store, generate clean custom name
    const defaultName = cleanEmail === 'thefahbarber@gmail.com'
      ? 'THE FAH BARBER & SALON'
      : cleanEmail.includes('@')
      ? `${cleanEmail.split('@')[0].toUpperCase()} BARBERSHOP`
      : 'ร้านตัดผม (BARBERSHOP)';

    const baseConfig: StoreSettings = {
      ...DEFAULT_SETTINGS,
      storeName: defaultName,
      promptPayName: defaultName,
      address: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.address : '',
      phone: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.phone : '',
      taxId: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.taxId : '',
      promptPayId: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.promptPayId : '',
    };

    if (!raw) return baseConfig;
    try {
      return { ...baseConfig, ...JSON.parse(raw) };
    } catch {
      return baseConfig;
    }
  },
  saveSettings(settings: StoreSettings, email?: string) {
    const key = getStoreKey('settings', email);
    localStorage.setItem(key, JSON.stringify(settings));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getBarbers(email?: string): Barber[] {
    const key = getStoreKey('barbers', email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },
  saveBarbers(barbers: Barber[], email?: string) {
    const key = getStoreKey('barbers', email);
    localStorage.setItem(key, JSON.stringify(barbers));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getServices(email?: string): ServiceItem[] {
    const key = getStoreKey('services', email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },
  saveServices(services: ServiceItem[], email?: string) {
    const key = getStoreKey('services', email);
    localStorage.setItem(key, JSON.stringify(services));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getMembers(email?: string): Member[] {
    const key = getStoreKey('members', email);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed: Member[] = JSON.parse(raw);
      return parsed.map((m) => ({
        ...m,
        balance: typeof m.balance === 'number' ? m.balance : 0,
        packageLevel: m.packageLevel || (m.tier === 'PLATINUM' ? 'Platinum' : m.tier === 'VIP_GOLD' ? 'Gold' : m.tier === 'SILVER' ? 'Silver' : 'Standard'),
      }));
    } catch {
      return [];
    }
  },
  saveMembers(members: Member[], email?: string) {
    const key = getStoreKey('members', email);
    localStorage.setItem(key, JSON.stringify(members));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getPackageTemplates(email?: string): PackageTemplate[] {
    const key = getStoreKey('packages', email);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed: PackageTemplate[] = JSON.parse(raw);
      return parsed.map((p, idx) => {
        const defaultColors = ['slate', 'amber', 'cyan', 'purple', 'emerald', 'rose', 'indigo', 'orange'];
        return {
          ...p,
          level: p.level || (p.price >= 5000 ? 'VIP Diamond' : p.price >= 3000 ? 'Platinum' : p.price >= 2000 ? 'Gold' : 'Silver'),
          receivedValue: typeof p.receivedValue === 'number' ? p.receivedValue : (p.originalValue || p.price),
          colorTheme: p.colorTheme || defaultColors[idx % defaultColors.length],
        };
      });
    } catch {
      return [];
    }
  },
  getPackages(email?: string): PackageTemplate[] {
    return this.getPackageTemplates(email);
  },
  savePackageTemplates(pkgs: PackageTemplate[], email?: string) {
    const key = getStoreKey('packages', email);
    localStorage.setItem(key, JSON.stringify(pkgs));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },
  savePackages(pkgs: PackageTemplate[], email?: string) {
    this.savePackageTemplates(pkgs, email);
  },

  getBills(email?: string): Bill[] {
    const key = getStoreKey('bills', email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },
  saveBills(bills: Bill[], email?: string) {
    const key = getStoreKey('bills', email);
    localStorage.setItem(key, JSON.stringify(bills));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getExpenses(email?: string): Expense[] {
    const key = getStoreKey('expenses', email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },
  saveExpenses(expenses: Expense[], email?: string) {
    const key = getStoreKey('expenses', email);
    localStorage.setItem(key, JSON.stringify(expenses));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getCashTransactions(email?: string): CashTransaction[] {
    const key = getStoreKey('cash_tx', email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },
  saveCashTransactions(txs: CashTransaction[], email?: string) {
    const key = getStoreKey('cash_tx', email);
    localStorage.setItem(key, JSON.stringify(txs));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getCashDrawer(email?: string): CashDrawerSummary {
    const key = getStoreKey('cash_drawer', email);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayDateString()) {
        return parsed;
      }
    }
    return {
      date: getTodayDateString(),
      openingFloat: 0,
      cashSales: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      cashExpenses: 0,
      expectedBalance: 0,
      status: 'OPEN',
    };
  },
  saveCashDrawer(drawer: CashDrawerSummary, email?: string) {
    const key = getStoreKey('cash_drawer', email);
    localStorage.setItem(key, JSON.stringify(drawer));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getSalarySlips(email?: string): SalarySlip[] {
    const key = getStoreKey('salary_slips', email);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },
  saveSalarySlips(slips: SalarySlip[], email?: string) {
    const key = getStoreKey('salary_slips', email);
    localStorage.setItem(key, JSON.stringify(slips));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getActiveStaff(email?: string): string {
    const key = getStoreKey('active_staff', email);
    return localStorage.getItem(key) || 'barber-1';
  },
  saveActiveStaff(staffId: string, email?: string) {
    const key = getStoreKey('active_staff', email);
    localStorage.setItem(key, staffId);
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  // Reset CURRENT STORE to 100% clean factory database (WIPES EVERYTHING)
  resetDemoData(email?: string) {
    const storeEmail = email || this.getActiveAccountEmail();
    const id = sanitizeStoreId(storeEmail);

    // Remove all local storage keys for this store
    const keysToRemove = [
      `barberpos_${id}_settings`,
      `barberpos_${id}_barbers`,
      `barberpos_${id}_services`,
      `barberpos_${id}_members`,
      `barberpos_${id}_packages`,
      `barberpos_${id}_bills`,
      `barberpos_${id}_expenses`,
      `barberpos_${id}_cash_tx`,
      `barberpos_${id}_cash_drawer`,
      `barberpos_${id}_salary_slips`,
      `barberpos_${id}_active_staff`,
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Save blank / factory clean defaults
    this.saveSettings({
      ...DEFAULT_SETTINGS,
      storeName: storeEmail.split('@')[0].toUpperCase() + ' BARBERSHOP',
    }, storeEmail);
    this.saveBarbers([], storeEmail);
    this.saveServices([], storeEmail);
    this.saveMembers([], storeEmail);
    this.savePackageTemplates([], storeEmail);
    this.saveExpenses([], storeEmail);
    this.saveBills([], storeEmail);
    this.saveCashDrawer({
      date: getTodayDateString(),
      openingFloat: 0,
      cashSales: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      cashExpenses: 0,
      expectedBalance: 0,
      status: 'OPEN',
    }, storeEmail);
    this.saveSalarySlips([], storeEmail);
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  resetDatabase(email?: string) {
    this.resetDemoData(email);
  },

  exportDatabaseJSON(email?: string): string {
    const data = {
      exportDate: new Date().toISOString(),
      accountEmail: email || this.getActiveAccountEmail(),
      version: '2.0.0',
      settings: this.getSettings(email),
      barbers: this.getBarbers(email),
      services: this.getServices(email),
      members: this.getMembers(email),
      packageTemplates: this.getPackageTemplates(email),
      bills: this.getBills(email),
      expenses: this.getExpenses(email),
      cashTransactions: this.getCashTransactions(email),
      cashDrawer: this.getCashDrawer(email),
      salarySlips: this.getSalarySlips(email),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseJSON(jsonStr: string, email?: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      const targetEmail = email || data.accountEmail || this.getActiveAccountEmail();
      if (data.settings) this.saveSettings(data.settings, targetEmail);
      if (data.barbers) this.saveBarbers(data.barbers, targetEmail);
      if (data.services) this.saveServices(data.services, targetEmail);
      if (data.members) this.saveMembers(data.members, targetEmail);
      if (data.packageTemplates) this.savePackageTemplates(data.packageTemplates, targetEmail);
      if (data.bills) this.saveBills(data.bills, targetEmail);
      if (data.expenses) this.saveExpenses(data.expenses, targetEmail);
      if (data.cashTransactions) this.saveCashTransactions(data.cashTransactions, targetEmail);
      if (data.cashDrawer) this.saveCashDrawer(data.cashDrawer, targetEmail);
      if (data.salarySlips) this.saveSalarySlips(data.salarySlips, targetEmail);
      window.dispatchEvent(new Event('barbershop_data_updated'));
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
