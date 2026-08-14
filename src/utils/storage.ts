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

const STORAGE_KEYS = {
  SETTINGS: 'barbershop_settings',
  BARBERS: 'barbershop_barbers',
  SERVICES: 'barbershop_services',
  MEMBERS: 'barbershop_members',
  PACKAGES: 'barbershop_packages',
  BILLS: 'barbershop_bills',
  EXPENSES: 'barbershop_expenses',
  CASH_TRANSACTIONS: 'barbershop_cash_tx',
  CASH_DRAWER: 'barbershop_cash_drawer',
  SALARY_SLIPS: 'barbershop_salary_slips',
  ACTIVE_STAFF: 'barbershop_active_staff',
};

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
  enableSalarySlips: true,
  enableTips: true,
  enableCashDrawer: true,
  isPinProtected: false,
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
  // ตัดผม / โกนหนวด
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
    description: 'สปาผิวหน้าและโกนหนวดเกลี้ยงเกลาพร้อมทา Aftershave บำรุง',
    isActive: true,
  },
  {
    id: 'srv-4',
    code: 'HC04',
    name: '👦 ตัดผมเด็ก (Kids Haircut)',
    category: 'HAIRCUT',
    price: 250,
    durationMinutes: 30,
    description: 'ตัดผมเด็กอย่างใจเย็นและพิถีพิถัน',
    isActive: true,
  },

  // งานเคมี (ดัด / ทำสี / ทรีทเม้นท์)
  {
    id: 'srv-5',
    code: 'CH01',
    name: '🧪 ดัดวอลลุ่มเกาหลี (Korean Volume Perm)',
    category: 'CHEMICAL',
    price: 1500,
    cost: 250,
    durationMinutes: 90,
    description: 'ดัดผมเพิ่มวอลลุ่ม จัดทรงง่าย ไม่ต้องเซ็ตนาน อยู่ทรง 3-4 เดือน',
    isActive: true,
  },
  {
    id: 'srv-6',
    code: 'CH02',
    name: '🧪 ดัดดาวน์เพิร์ม กดข้าง (Down Perm)',
    category: 'CHEMICAL',
    price: 600,
    cost: 100,
    durationMinutes: 45,
    description: 'ดัดกดผมด้านข้างที่ชี้ฟูให้เรียบแบนเข้าทรงรับกับใบหน้า',
    isActive: true,
  },
  {
    id: 'srv-7',
    code: 'CH03',
    name: '🎨 ทำสีผมแฟชั่นชาย (Men Hair Color)',
    category: 'CHEMICAL',
    price: 1200,
    cost: 200,
    durationMinutes: 75,
    description: 'ทำสีผมพรีเมียม สีติดทนนาน ไม่ทำร้ายหนังศีรษะ',
    isActive: true,
  },
  {
    id: 'srv-8',
    code: 'CH04',
    name: '💆 สปาดีท็อกซ์หนังศีรษะ & นวดผ่อนคลาย (Scalp Detox Spa)',
    category: 'CHEMICAL',
    price: 450,
    cost: 50,
    durationMinutes: 40,
    description: 'ทำความสะอาดล้ำลึก ขจัดรังแคและความมัน พร้อมนวดศีรษะ',
    isActive: true,
  },

  // สินค้าจัดแต่งทรงผม & ดูแล
  {
    id: 'prd-1',
    code: 'PD01',
    name: '🧴 โพเมดสูตรน้ำ พรีเมียม (Water-based Pomade 100g)',
    category: 'PRODUCT',
    price: 490,
    cost: 220,
    durationMinutes: 0,
    stock: 24,
    trackStock: true,
    description: 'พลังยึดเกาะระดับสูง ล้างออกง่าย เงางามเป็นธรรมชาติ กลิ่นหอมอบอุ่น',
    isActive: true,
  },
  {
    id: 'prd-2',
    code: 'PD02',
    name: '🧴 แป้งเซ็ตผมแมตต์ (Matte Styling Powder 20g)',
    category: 'PRODUCT',
    price: 350,
    cost: 140,
    durationMinutes: 0,
    stock: 18,
    trackStock: true,
    description: 'เพิ่มวอลลุ่มให้โคนผม ไม่เหนียวเหนอะหนะ อยู่ทรงแบบธรรมชาติ',
    isActive: true,
  },
  {
    id: 'prd-3',
    code: 'PD03',
    name: '🧴 แชมพูขจัดรังแค & บำรุงรากผม (Anti-Hairfall Tonic Shampoo 300ml)',
    category: 'PRODUCT',
    price: 390,
    cost: 160,
    durationMinutes: 0,
    stock: 12,
    trackStock: true,
    description: 'แชมพูสูตรเย็นสดชื่น บำรุงรากผมให้แข็งแรง ลดอาการคันหนังศีรษะ',
    isActive: true,
  },
  {
    id: 'prd-4',
    code: 'PD04',
    name: '🧴 เซรั่มปลูกเคราและบำรุงผม (Beard & Hair Growth Serum 50ml)',
    category: 'PRODUCT',
    price: 550,
    cost: 250,
    durationMinutes: 0,
    stock: 8,
    trackStock: true,
    description: 'กระตุ้นการเกิดใหม่ของเส้นขนและเครา หนาดกดำ',
    isActive: true,
  },
];
export const initialServices = INITIAL_SERVICES;

export const INITIAL_PACKAGE_TEMPLATES: PackageTemplate[] = [
  {
    id: 'pkg-1',
    name: 'แพ็กเกจ Silver เริ่มต้น',
    description: 'เติมเงินสุดคุ้มระดับ Silver ใช้ได้ทุกบริการในร้าน',
    level: 'Silver',
    price: 1000,
    receivedValue: 1200,
    colorTheme: 'slate',
    isActive: true,
  },
  {
    id: 'pkg-2',
    name: 'แพ็กเกจ Gold ยอดนิยม',
    description: 'เติมเงินระดับ Gold รับโบนัสเครดิตเพิ่มพิเศษ คุ้มค่าสูงสุด',
    level: 'Gold',
    price: 2000,
    receivedValue: 2500,
    colorTheme: 'amber',
    isActive: true,
  },
  {
    id: 'pkg-3',
    name: 'แพ็กเกจ Platinum สุดคุ้ม',
    description: 'แพ็กเกจระดับ Platinum สำหรับลูกค้าประจำ คืนกำไรจุกๆ',
    level: 'Platinum',
    price: 3000,
    receivedValue: 3900,
    colorTheme: 'cyan',
    isActive: true,
  },
  {
    id: 'pkg-4',
    name: 'แพ็กเกจ VIP Diamond พรีเมียม',
    description: 'ระดับสูงสุด VIP Diamond สิทธิประโยชน์และเครดิตพิเศษเต็มพิกัด',
    level: 'VIP Diamond',
    price: 5000,
    receivedValue: 7000,
    colorTheme: 'purple',
    isActive: true,
  },
];
export const initialPackages = INITIAL_PACKAGE_TEMPLATES;

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    name: 'คุณธนากร สุขสวัสดิ์',
    nickname: 'เอก',
    phone: '081-999-8888',
    birthday: '1992-05-15',
    gender: 'M',
    tier: 'VIP_GOLD',
    packageLevel: 'Gold',
    balance: 1850,
    points: 150,
    totalSpent: 8400,
    visitCount: 12,
    notes: 'ชอบตัดทรง Two-Block เฟดข้างเบอร์ 2 เซ็ตด้านหน้าแสกกลาง',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-08-10T14:30:00.000Z',
    packages: [],
  },
  {
    id: 'mem-2',
    name: 'คุณกิตติศักดิ์ พงศ์ไพศาล',
    nickname: 'บอส',
    phone: '089-777-6666',
    birthday: '1995-11-20',
    gender: 'M',
    tier: 'PLATINUM',
    packageLevel: 'Platinum',
    balance: 3200,
    points: 380,
    totalSpent: 16500,
    visitCount: 18,
    notes: 'ตัดผมกับช่างฟ้าประจำ ดัดวอลลุ่มเกาหลีทุก 3 เดือน ผิวแพ้ง่าย',
    createdAt: '2025-11-05T09:00:00.000Z',
    updatedAt: '2026-08-12T16:00:00.000Z',
    packages: [],
  },
  {
    id: 'mem-3',
    name: 'คุณวรเมธ รัตนโชติ',
    nickname: 'อาร์ม',
    phone: '095-333-1122',
    birthday: '1998-03-08',
    gender: 'M',
    tier: 'SILVER',
    packageLevel: 'Silver',
    balance: 650,
    points: 35,
    totalSpent: 3500,
    visitCount: 4,
    notes: 'ชอบทรง Classic Pompadour โพกผ้าร้อน',
    createdAt: '2026-05-20T13:15:00.000Z',
    updatedAt: '2026-08-01T15:20:00.000Z',
    packages: [],
  },
];
export const initialMembers = INITIAL_MEMBERS;

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'ค่าไฟฟ้าประจำร้าน (มิ.ย. - ก.ค.)',
    category: 'UTILITIES',
    amount: 3850,
    date: getTodayDateString(),
    payer: 'เจ้าของร้าน',
    paymentMethod: 'TRANSFER',
    receiptNote: 'ใบเสร็จการไฟฟ้านครหลวง เลขที่ MEA-99412',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    title: 'สั่งซื้อน้ำยาเคมีดัดผม + ครีมโกนหนวด',
    category: 'CHEMICALS_EQUIPMENT',
    amount: 2400,
    date: getTodayDateString(),
    payer: 'ช่างฟ้า',
    paymentMethod: 'CASH',
    receiptNote: 'ร้านซัพพลายเออร์บาร์เบอร์ บิลเลขที่ BB-202608',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    title: 'เบิกเงินล่วงหน้าช่างกอล์ฟ',
    category: 'BARBER_ADVANCE',
    amount: 2000,
    date: getTodayDateString(),
    payer: 'ช่างกอล์ฟ',
    paymentMethod: 'CASH',
    barberId: 'barber-3',
    barberName: 'ช่างกอล์ฟ',
    receiptNote: 'เบิกเงินสดฉุกเฉิน หักในรอบเงินเดือน ส.ค. 69',
    createdAt: new Date().toISOString(),
  },
];
export const initialExpenses = INITIAL_EXPENSES;

export const generateInitialBills = (): Bill[] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentDay = today.getDate();

  const bills: Bill[] = [];
  let billSeq = 1000;

  // Sample data generators for days in current month up to today
  const sampleRounds = [
    { dayOffset: 0, time: '10:30', cust: 'คุณธนากร สุขสวัสดิ์', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, prod: { name: '🧴 โพเมดสูตรน้ำ พรีเมียม (Water-based Pomade 100g)', cat: 'PRODUCT', price: 490 }, tip: 50, pay: 'PROMPTPAY' },
    { dayOffset: 0, time: '11:45', cust: 'ลูกค้าทั่วไป (Walk-in)', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ดัดวอลลุ่มเกาหลี (Korean Volume Perm)', cat: 'CHEMICAL', price: 1500 }, tip: 100, pay: 'CASH', cashRec: 2000, cashChg: 400 },
    { dayOffset: 0, time: '14:15', cust: 'คุณวรเมธ รัตนพงศ์', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ สระ ไดร์ เซ็ตผมสไตล์วินเทจ', cat: 'HAIRCUT', price: 250 }, tip: 40, pay: 'TRANSFER' },
    { dayOffset: 0, time: '16:00', cust: 'คุณกิตติธัช วาณิชย์', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, prod: { name: '🧴 แป้งเซ็ตผมแมตต์ (Matte Styling Powder 20g)', cat: 'PRODUCT', price: 350 }, tip: 50, pay: 'SPLIT', splitCash: 400, splitTransfer: 350 },
    
    // Day -1 (Yesterday)
    { dayOffset: 1, time: '11:00', cust: 'คุณอรรถพล', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'CASH', cashRec: 500, cashChg: 100 },
    { dayOffset: 1, time: '13:30', cust: 'คุณศุภกร', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ทำสีผมแฟชั่น พรีเมียม (Hair Color & Bleaching)', cat: 'CHEMICAL', price: 1800 }, tip: 100, pay: 'TRANSFER' },
    { dayOffset: 1, time: '15:20', cust: 'คุณธีรพงษ์', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, prod: { name: '🧴 แชมพูขจัดรังแค & บำรุงรากผม', cat: 'PRODUCT', price: 390 }, tip: 30, pay: 'CASH', cashRec: 800, cashChg: 30 },
    { dayOffset: 1, time: '17:00', cust: 'คุณธวัชชัย', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ออกแบบทรงผมเฉพาะบุคคล + เซ็ตทรง', cat: 'HAIRCUT', price: 500 }, tip: 100, pay: 'TRANSFER' },

    // Day -2
    { dayOffset: 2, time: '10:30', cust: 'คุณกฤษฎา', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ดัดวอลลุ่มเกาหลี (Korean Volume Perm)', cat: 'CHEMICAL', price: 1500 }, tip: 100, pay: 'CASH', cashRec: 1600, cashChg: 0 },
    { dayOffset: 2, time: '12:00', cust: 'คุณภาคิน', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 2, time: '14:40', cust: 'คุณนพดล', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ ตัดผมเด็ก / นักเรียน', cat: 'HAIRCUT', price: 200 }, tip: 20, pay: 'CASH', cashRec: 300, cashChg: 80 },
    { dayOffset: 2, time: '16:15', cust: 'คุณวิทวัส', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ สปาดีท็อกซ์หนังศีรษะ & นวดผ่อนคลาย', cat: 'HAIRCUT', price: 450 }, prod: { name: '🧴 โพเมดสูตรน้ำ พรีเมียม (Water-based Pomade 100g)', cat: 'PRODUCT', price: 490 }, tip: 60, pay: 'PROMPTPAY' },

    // Day -3
    { dayOffset: 3, time: '11:15', cust: 'คุณสุรเชษฐ์', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 3, time: '13:00', cust: 'คุณปกรณ์', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 30, pay: 'CASH', cashRec: 400, cashChg: 20 },
    { dayOffset: 3, time: '15:30', cust: 'คุณอนุชา', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ยืดผมวอลลุ่มธรรมชาติ (Natural Hair Straightening)', cat: 'CHEMICAL', price: 1600 }, tip: 100, pay: 'TRANSFER' },

    // Day -4
    { dayOffset: 4, time: '10:45', cust: 'คุณจักรพงษ์', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'CASH', cashRec: 500, cashChg: 100 },
    { dayOffset: 4, time: '12:30', cust: 'คุณชลธี', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '✂️ ตัดแต่งทรงหนวดเครา พรีเมียม', cat: 'HAIRCUT', price: 250 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 4, time: '16:00', cust: 'คุณปิยะพงษ์', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, prod: { name: '🧴 เซรั่มปลูกเคราและบำรุงผม (Beard & Hair Growth Serum 50ml)', cat: 'PRODUCT', price: 550 }, tip: 50, pay: 'PROMPTPAY' },

    // Day -5
    { dayOffset: 5, time: '11:00', cust: 'คุณสมภพ', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 5, time: '14:00', cust: 'คุณอรรณพ', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ดัดวอลลุ่มเกาหลี (Korean Volume Perm)', cat: 'CHEMICAL', price: 1500 }, tip: 100, pay: 'CASH', cashRec: 1600, cashChg: 0 },
    
    // Day -6
    { dayOffset: 6, time: '10:00', cust: 'คุณณัฐพล', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 6, time: '13:00', cust: 'คุณภูมิภัทร', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, prod: { name: '🧴 โพเมดสูตรน้ำ พรีเมียม (Water-based Pomade 100g)', cat: 'PRODUCT', price: 490 }, tip: 50, pay: 'CASH', cashRec: 900, cashChg: 10 },
    { dayOffset: 6, time: '16:30', cust: 'คุณเฉลิมชัย', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ทำสีผมแฟชั่น พรีเมียม (Hair Color & Bleaching)', cat: 'CHEMICAL', price: 1800 }, tip: 150, pay: 'TRANSFER' },

    // Day -7
    { dayOffset: 7, time: '11:30', cust: 'คุณกิตติศักดิ์', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 7, time: '15:00', cust: 'คุณศุภวิชญ์', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ สระ ไดร์ เซ็ตผมสไตล์วินเทจ', cat: 'HAIRCUT', price: 250 }, tip: 30, pay: 'CASH', cashRec: 300, cashChg: 20 },

    // Day -8
    { dayOffset: 8, time: '10:30', cust: 'คุณวีรยุทธ', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ดัดวอลลุ่มเกาหลี (Korean Volume Perm)', cat: 'CHEMICAL', price: 1500 }, tip: 100, pay: 'TRANSFER' },
    { dayOffset: 8, time: '14:20', cust: 'คุณทินกร', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'CASH', cashRec: 400, cashChg: 0 },

    // Day -9
    { dayOffset: 9, time: '11:00', cust: 'คุณชาญชัย', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 9, time: '16:00', cust: 'คุณเอกสิทธิ์', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ออกแบบทรงผมเฉพาะบุคคล + เซ็ตทรง', cat: 'HAIRCUT', price: 500 }, tip: 100, pay: 'PROMPTPAY' },

    // Day -10
    { dayOffset: 10, time: '12:00', cust: 'คุณมนตรี', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ทำสีผมแฟชั่น พรีเมียม (Hair Color & Bleaching)', cat: 'CHEMICAL', price: 1800 }, tip: 100, pay: 'CASH', cashRec: 2000, cashChg: 100 },
    { dayOffset: 10, time: '15:30', cust: 'คุณพิชัย', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'TRANSFER' },

    // Day -11
    { dayOffset: 11, time: '10:45', cust: 'คุณชูเกียรติ', barberId: 'barber-3', barberName: 'ช่างกอล์ฟ', item: { name: '✂️ สปาดีท็อกซ์หนังศีรษะ & นวดผ่อนคลาย', cat: 'HAIRCUT', price: 450 }, tip: 50, pay: 'TRANSFER' },
    { dayOffset: 11, time: '14:00', cust: 'คุณนรินทร์', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'CASH', cashRec: 400, cashChg: 0 },

    // Day -12
    { dayOffset: 12, time: '11:30', cust: 'คุณอรรถสิทธิ์', barberId: 'barber-2', barberName: 'ช่างบอย', item: { name: '🧪 ดัดวอลลุ่มเกาหลี (Korean Volume Perm)', cat: 'CHEMICAL', price: 1500 }, tip: 100, pay: 'TRANSFER' },
    { dayOffset: 12, time: '16:15', cust: 'คุณบรรจง', barberId: 'barber-1', barberName: 'ช่างฟ้า', item: { name: '✂️ ตัดผมชายพรีเมียม (Signature Haircut)', cat: 'HAIRCUT', price: 350 }, tip: 50, pay: 'CASH', cashRec: 500, cashChg: 100 },
  ];

  sampleRounds.forEach((sr) => {
    const targetDay = Math.max(1, currentDay - sr.dayOffset);
    const dayStr = targetDay.toString().padStart(2, '0');
    const dateIso = `${year}-${month}-${dayStr}T${sr.time}:00.000Z`;

    billSeq += 1;
    const items = [
      {
        id: `citem-${billSeq}-1`,
        serviceId: 'srv-1',
        name: sr.item.name,
        category: sr.item.cat as any,
        price: sr.item.price,
        quantity: 1,
        discount: 0,
        barberId: sr.barberId,
        barberName: sr.barberName,
      }
    ];

    if (sr.prod) {
      items.push({
        id: `citem-${billSeq}-2`,
        serviceId: 'prd-1',
        name: sr.prod.name,
        category: sr.prod.cat as any,
        price: sr.prod.price,
        quantity: 1,
        discount: 0,
        barberId: sr.barberId,
        barberName: sr.barberName,
      });
    }

    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const grandTotal = subtotal + (sr.tip || 0);

    bills.push({
      id: `bill-gen-${billSeq}`,
      billNumber: `BS${year.toString().slice(-2)}${month}${dayStr}-${billSeq}`,
      date: dateIso,
      customerType: sr.cust.includes('คุณ') ? 'MEMBER' : 'GUEST',
      memberName: sr.cust,
      items,
      subtotal,
      discountTotal: 0,
      pointsDiscount: 0,
      pointsEarned: Math.floor(subtotal / 100),
      tipAmount: sr.tip || 0,
      tipBarberId: sr.tip ? sr.barberId : undefined,
      grandTotal,
      paymentMethod: sr.pay as any,
      cashReceived: sr.cashRec,
      cashChange: sr.cashChg,
      splitCashAmount: sr.splitCash,
      splitTransferAmount: sr.splitTransfer,
      status: 'COMPLETED',
      createdBy: sr.barberName,
    });
  });

  return bills;
};

export const INITIAL_BILLS: Bill[] = generateInitialBills();
export const initialBills = INITIAL_BILLS;

export const INITIAL_CASH_DRAWER: CashDrawerSummary = {
  date: getTodayDateString(),
  openingFloat: 3000,
  cashSales: 1600,
  cashInTotal: 0,
  cashOutTotal: 2000,
  cashExpenses: 4400,
  expectedBalance: -1800,
  status: 'OPEN',
};
export const initialCashDrawer = INITIAL_CASH_DRAWER;

export const INITIAL_SALARY_SLIPS: SalarySlip[] = [];
export const initialSalarySlips = INITIAL_SALARY_SLIPS;

// Safe storage wrapper
export const storage = {
  getSettings(): StoreSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  },
  saveSettings(settings: StoreSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getBarbers(): Barber[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BARBERS);
    return raw ? JSON.parse(raw) : INITIAL_BARBERS;
  },
  saveBarbers(barbers: Barber[]) {
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getServices(): ServiceItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return raw ? JSON.parse(raw) : INITIAL_SERVICES;
  },
  saveServices(services: ServiceItem[]) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getMembers(): Member[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) return INITIAL_MEMBERS;
    try {
      const parsed: Member[] = JSON.parse(raw);
      return parsed.map((m) => ({
        ...m,
        balance: typeof m.balance === 'number' ? m.balance : 0,
        packageLevel: m.packageLevel || (m.tier === 'PLATINUM' ? 'Platinum' : m.tier === 'VIP_GOLD' ? 'Gold' : m.tier === 'SILVER' ? 'Silver' : 'Standard'),
      }));
    } catch {
      return INITIAL_MEMBERS;
    }
  },
  saveMembers(members: Member[]) {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getPackageTemplates(): PackageTemplate[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    if (!raw) return INITIAL_PACKAGE_TEMPLATES;
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
      return INITIAL_PACKAGE_TEMPLATES;
    }
  },
  getPackages(): PackageTemplate[] {
    return this.getPackageTemplates();
  },
  savePackageTemplates(pkgs: PackageTemplate[]) {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(pkgs));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },
  savePackages(pkgs: PackageTemplate[]) {
    this.savePackageTemplates(pkgs);
  },

  getBills(): Bill[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    return raw ? JSON.parse(raw) : INITIAL_BILLS;
  },
  saveBills(bills: Bill[]) {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getExpenses(): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return raw ? JSON.parse(raw) : INITIAL_EXPENSES;
  },
  saveExpenses(expenses: Expense[]) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getCashTransactions(): CashTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  },
  saveCashTransactions(txs: CashTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.CASH_TRANSACTIONS, JSON.stringify(txs));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getCashDrawer(): CashDrawerSummary {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_DRAWER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayDateString()) {
        return parsed;
      }
    }
    return {
      date: getTodayDateString(),
      openingFloat: 3000,
      cashSales: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      cashExpenses: 0,
      expectedBalance: 3000,
      status: 'OPEN',
    };
  },
  saveCashDrawer(drawer: CashDrawerSummary) {
    localStorage.setItem(STORAGE_KEYS.CASH_DRAWER, JSON.stringify(drawer));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getSalarySlips(): SalarySlip[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SALARY_SLIPS);
    return raw ? JSON.parse(raw) : [];
  },
  saveSalarySlips(slips: SalarySlip[]) {
    localStorage.setItem(STORAGE_KEYS.SALARY_SLIPS, JSON.stringify(slips));
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  getActiveStaff(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STAFF) || 'barber-1';
  },
  saveActiveStaff(staffId: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF, staffId);
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  // Reset to initial demo database
  resetDemoData() {
    localStorage.clear();
    this.saveSettings(DEFAULT_SETTINGS);
    this.saveBarbers(INITIAL_BARBERS);
    this.saveServices(INITIAL_SERVICES);
    this.saveMembers(INITIAL_MEMBERS);
    this.savePackageTemplates(INITIAL_PACKAGE_TEMPLATES);
    this.saveExpenses(INITIAL_EXPENSES);
    this.saveBills(INITIAL_BILLS);
    this.saveCashDrawer(INITIAL_CASH_DRAWER);
    this.saveSalarySlips([]);
    window.dispatchEvent(new Event('barbershop_data_updated'));
  },

  resetDatabase() {
    this.resetDemoData();
  },

  exportDatabaseJSON(): string {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      settings: this.getSettings(),
      barbers: this.getBarbers(),
      services: this.getServices(),
      members: this.getMembers(),
      packageTemplates: this.getPackageTemplates(),
      bills: this.getBills(),
      expenses: this.getExpenses(),
      cashTransactions: this.getCashTransactions(),
      cashDrawer: this.getCashDrawer(),
      salarySlips: this.getSalarySlips(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) this.saveSettings(data.settings);
      if (data.barbers) this.saveBarbers(data.barbers);
      if (data.services) this.saveServices(data.services);
      if (data.members) this.saveMembers(data.members);
      if (data.packageTemplates) this.savePackageTemplates(data.packageTemplates);
      if (data.bills) this.saveBills(data.bills);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.cashTransactions) this.saveCashTransactions(data.cashTransactions);
      if (data.cashDrawer) this.saveCashDrawer(data.cashDrawer);
      if (data.salarySlips) this.saveSalarySlips(data.salarySlips);
      window.dispatchEvent(new Event('barbershop_data_updated'));
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
