import React, { useState, useEffect } from 'react';
import { 
  Barber, 
  Bill, 
  CashDrawerSummary, 
  Member, 
  PackageTemplate, 
  SalarySlip, 
  ServiceItem, 
  StoreSettings 
} from './types';
import { 
  DEFAULT_SETTINGS,
  storage 
} from './utils/storage';
import {
  seedInitialDataIfEmpty,
  resetFirestoreToFactory,
  subscribeSettings,
  saveSettingsToFirestore,
  subscribeBarbers,
  saveBarberToFirestore,
  deleteBarberFromFirestore,
  subscribeServices,
  saveServiceToFirestore,
  deleteServiceFromFirestore,
  subscribePackages,
  savePackageToFirestore,
  deletePackageFromFirestore,
  subscribeMembers,
  saveMemberToFirestore,
  deleteMemberFromFirestore,
  subscribeBills,
  saveBillToFirestore,
  deleteBillFromFirestore,
  subscribeExpenses,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  subscribeCashDrawer,
  saveCashDrawerToFirestore,
  subscribeSalarySlips,
  saveSalarySlipToFirestore
} from './services/firestore';
import { Header } from './components/Header';
import { POSView } from './components/pos/POSView';
import { MembersView } from './components/members/MembersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CashDrawerView } from './components/drawer/CashDrawerView';
import { SalaryView } from './components/salary/SalaryView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { PINModal } from './components/PINModal';
import { LoginModal } from './components/LoginModal';
import { applyBrandTheme } from './utils/brandTheme';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'POS' | 'MEMBERS' | 'EXPENSES' | 'DRAWER' | 'SALARY' | 'REPORTS' | 'SETTINGS'>('POS');

  // Active Store Account Email (e.g. thefahbarber@gmail.com)
  const [accountEmail, setAccountEmail] = useState<string | null>(() => storage.getActiveAccountEmail());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => !storage.getActiveAccountEmail());

  // Application Data States (scoped by accountEmail and synced with Firestore real-time)
  const [settings, setSettings] = useState<StoreSettings>(() => storage.getSettings(accountEmail || undefined));
  const [barbers, setBarbers] = useState<Barber[]>(() => storage.getBarbers(accountEmail || undefined));
  const [services, setServices] = useState<ServiceItem[]>(() => storage.getServices(accountEmail || undefined));
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>(() => storage.getPackages(accountEmail || undefined));
  const [members, setMembers] = useState<Member[]>(() => storage.getMembers(accountEmail || undefined));
  const [bills, setBills] = useState<Bill[]>(() => storage.getBills(accountEmail || undefined));
  const [expenses, setExpenses] = useState<ReturnType<typeof storage.getExpenses>>(() => storage.getExpenses(accountEmail || undefined));
  const [cashDrawer, setCashDrawer] = useState<CashDrawerSummary>(() => storage.getCashDrawer(accountEmail || undefined));
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>(() => storage.getSalarySlips(accountEmail || undefined));

  // Cloud Sync Status Indicator
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Active Staff in session
  const [activeStaffId, setActiveStaffId] = useState<string>(() => barbers[0]?.id || '');

  // PIN Protection State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetTab, setPinTargetTab] = useState<'SETTINGS' | 'SALARY' | null>(null);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);

  // 1. Re-initialize & Real-Time Sync Listeners when Account Email changes
  useEffect(() => {
    if (!accountEmail) return;

    // Immediately reset and load local dataset for this account to prevent stale data flash
    setSettings(storage.getSettings(accountEmail));
    setBarbers(storage.getBarbers(accountEmail));
    setServices(storage.getServices(accountEmail));
    setPackageTemplates(storage.getPackages(accountEmail));
    setMembers(storage.getMembers(accountEmail));
    setBills(storage.getBills(accountEmail));
    setExpenses(storage.getExpenses(accountEmail));
    setCashDrawer(storage.getCashDrawer(accountEmail));
    setSalarySlips(storage.getSalarySlips(accountEmail));
    setActiveStaffId('');

    // Seed initial workspace for this store account if brand new (clean state)
    seedInitialDataIfEmpty(accountEmail).catch(console.error);

    // Subscribe to real-time changes from Firestore for this specific account
    const unsubSettings = subscribeSettings(accountEmail, (newSettings) => {
      setSettings(newSettings);
      storage.saveSettings(newSettings, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubBarbers = subscribeBarbers(accountEmail, (newBarbers) => {
      setBarbers(newBarbers);
      storage.saveBarbers(newBarbers, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubServices = subscribeServices(accountEmail, (newServices) => {
      setServices(newServices);
      storage.saveServices(newServices, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubPackages = subscribePackages(accountEmail, (newPackages) => {
      setPackageTemplates(newPackages);
      storage.savePackages(newPackages, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubMembers = subscribeMembers(accountEmail, (newMembers) => {
      setMembers(newMembers);
      storage.saveMembers(newMembers, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubBills = subscribeBills(accountEmail, (newBills) => {
      setBills(newBills);
      storage.saveBills(newBills, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubExpenses = subscribeExpenses(accountEmail, (newExpenses) => {
      setExpenses(newExpenses);
      storage.saveExpenses(newExpenses, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubDrawer = subscribeCashDrawer(accountEmail, (newDrawer) => {
      setCashDrawer(newDrawer);
      storage.saveCashDrawer(newDrawer, accountEmail);
      setIsCloudConnected(true);
    });

    const unsubSalary = subscribeSalarySlips(accountEmail, (newSlips) => {
      setSalarySlips(newSlips);
      storage.saveSalarySlips(newSlips, accountEmail);
      setIsCloudConnected(true);
    });

    return () => {
      unsubSettings();
      unsubBarbers();
      unsubServices();
      unsubPackages();
      unsubMembers();
      unsubBills();
      unsubExpenses();
      unsubDrawer();
      unsubSalary();
    };
  }, [accountEmail]);

  // Apply Dynamic Brand Color & Header Styling to CSS Variables
  useEffect(() => {
    applyBrandTheme(settings.brandColor, settings.brandHeaderStyle || 'light');
  }, [settings.brandColor, settings.brandHeaderStyle]);

  // Ensure active staff is valid when barbers update
  useEffect(() => {
    if (barbers.length > 0 && !barbers.some(b => b.id === activeStaffId)) {
      setActiveStaffId(barbers[0].id);
    }
  }, [barbers, activeStaffId]);

  // Handle Account Login / Switching
  const handleLoginAccount = (newEmail: string) => {
    const clean = newEmail.trim().toLowerCase();
    storage.setActiveAccountEmail(clean);
    setAccountEmail(clean);

    // Immediately load local cache for this store account
    setSettings(storage.getSettings(clean));
    setBarbers(storage.getBarbers(clean));
    setServices(storage.getServices(clean));
    setPackageTemplates(storage.getPackages(clean));
    setMembers(storage.getMembers(clean));
    setBills(storage.getBills(clean));
    setExpenses(storage.getExpenses(clean));
    setCashDrawer(storage.getCashDrawer(clean));
    setSalarySlips(storage.getSalarySlips(clean));

    setIsLoginModalOpen(false);
    setIsAuthenticatedAdmin(false);
    setActiveTab('POS');
  };

  // Explicit Logout Handler
  const handleLogout = () => {
    storage.logout();
    setAccountEmail(null);
    setIsLoginModalOpen(true);
    setIsAuthenticatedAdmin(false);
    setActiveStaffId('');
  };

  // Tab switching with PIN protection
  const handleTabChange = (tab: string) => {
    const normalizedTab: typeof activeTab = 
      tab === 'CASH_DRAWER' ? 'DRAWER' : 
      tab === 'SALARY_SLIPS' ? 'SALARY' : 
      (tab as typeof activeTab);

    // Require PIN verification for SETTINGS and SALARY whenever admin is not authenticated
    if ((normalizedTab === 'SETTINGS' || normalizedTab === 'SALARY') && !isAuthenticatedAdmin) {
      setPinTargetTab(normalizedTab as 'SETTINGS' | 'SALARY');
      setIsPinModalOpen(true);
      return;
    }

    // When navigating away to normal operational tabs (POS, Reports, etc.), lock admin state
    if (normalizedTab !== 'SETTINGS' && normalizedTab !== 'SALARY') {
      setIsAuthenticatedAdmin(false);
    }

    setActiveTab(normalizedTab);
  };

  const handlePinSuccess = () => {
    setIsAuthenticatedAdmin(true);
    setIsPinModalOpen(false);
    if (pinTargetTab) {
      setActiveTab(pinTargetTab);
      setPinTargetTab(null);
    }
  };

  const handleRequestPinLock = () => {
    setIsAuthenticatedAdmin(false);
    if (activeTab === 'SETTINGS' || activeTab === 'SALARY') {
      setActiveTab('POS');
    }
  };

  // State mutations with cloud sync scoped by accountEmail
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    if (accountEmail) {
      storage.saveSettings(newSettings, accountEmail);
      saveSettingsToFirestore(accountEmail, newSettings);
    }
  };

  const handleAddBill = (newBill: Bill) => {
    setBills((prev) => [newBill, ...prev]);
    if (accountEmail) {
      saveBillToFirestore(accountEmail, newBill);
    }
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills((prev) => prev.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
    if (accountEmail) {
      saveBillToFirestore(accountEmail, updatedBill);
    }
  };

  const handleDeleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    if (accountEmail) {
      deleteBillFromFirestore(accountEmail, billId);
    }
  };

  const handleMergeBills = (updatedBills: Bill[]) => {
    setBills((prev) => {
      const updatedMap = new Map(updatedBills.map((b) => [b.id, b]));
      return prev.map((b) => updatedMap.get(b.id) || b);
    });
    if (accountEmail) {
      updatedBills.forEach((b) => saveBillToFirestore(accountEmail, b));
    }
  };

  const handleUnmergeBill = (targetBill: Bill) => {
    // 1. If legacy consolidated bill with originalBills stored
    if (targetBill.originalBills && targetBill.originalBills.length > 0) {
      handleDeleteBill(targetBill.id);
      targetBill.originalBills.forEach((originalB) => {
        handleAddBill({
          ...originalB,
          isMerged: false,
          mergedGroupId: undefined,
          mergedWithBillNumbers: undefined,
          originalBills: undefined,
        });
      });
      return;
    }

    // 2. Linked merge bills (separate bills with group link)
    const groupId = targetBill.mergedGroupId;
    const targetWithNumbers = targetBill.mergedWithBillNumbers || [];

    const relatedBills = bills.filter(
      (b) =>
        (groupId && b.mergedGroupId === groupId) ||
        b.id === targetBill.id ||
        (targetWithNumbers.length > 0 && targetWithNumbers.includes(b.billNumber))
    );

    const billsToUnmerge = relatedBills.length > 0 ? relatedBills : [targetBill];

    const unmergedList: Bill[] = billsToUnmerge.map((b) => ({
      ...b,
      isMerged: false,
      mergedGroupId: undefined,
      mergedWithBillNumbers: undefined,
      originalBills: undefined,
      paymentReference: b.paymentReference && b.paymentReference.startsWith('โอนรวม') ? undefined : b.paymentReference,
    }));

    setBills((prev) => {
      const unmergedMap = new Map(unmergedList.map((b) => [b.id, b]));
      return prev.map((b) => unmergedMap.get(b.id) || b);
    });

    if (accountEmail) {
      unmergedList.forEach((b) => saveBillToFirestore(accountEmail, b));
    }
  };

  const handleVoidBill = (billId: string, reason: string) => {
    const targetBill = bills.find((b) => b.id === billId);
    if (targetBill && targetBill.memberId && targetBill.memberDeductedAmount && targetBill.memberDeductedAmount > 0) {
      const member = members.find((m) => m.id === targetBill.memberId);
      if (member) {
        const updatedMember = {
          ...member,
          balance: (member.balance || 0) + targetBill.memberDeductedAmount!,
          updatedAt: new Date().toISOString(),
        };
        handleSaveMember(updatedMember);
      }
    }
    
    if (targetBill) {
      const voidedBill: Bill = {
        ...targetBill,
        status: 'VOIDED',
        voidReason: reason,
        voidedAt: new Date().toISOString(),
      };
      handleUpdateBill(voidedBill);
    }
  };

  const handleSaveMember = (member: Member) => {
    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === member.id);
      if (idx >= 0) {
        return prev.map((m) => (m.id === member.id ? member : m));
      }
      return [member, ...prev];
    });
    if (accountEmail) {
      saveMemberToFirestore(accountEmail, member);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (accountEmail) {
      deleteMemberFromFirestore(accountEmail, memberId);
    }
  };

  const handleSaveExpense = (expense: typeof expenses[0]) => {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        return prev.map((e) => (e.id === expense.id ? expense : e));
      }
      return [expense, ...prev];
    });
    if (accountEmail) {
      saveExpenseToFirestore(accountEmail, expense);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    if (accountEmail) {
      deleteExpenseFromFirestore(accountEmail, expenseId);
    }
  };

  const handleSaveBarber = (barber: Barber) => {
    setBarbers((prev) => {
      const idx = prev.findIndex((b) => b.id === barber.id);
      if (idx >= 0) {
        return prev.map((b) => (b.id === barber.id ? barber : b));
      }
      return [...prev, barber];
    });
    if (accountEmail) {
      saveBarberToFirestore(accountEmail, barber);
    }
  };

  const handleDeleteBarber = (barberId: string) => {
    setBarbers((prev) => prev.filter((b) => b.id !== barberId));
    if (accountEmail) {
      deleteBarberFromFirestore(accountEmail, barberId);
    }
  };

  const handleSaveService = (service: ServiceItem) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id);
      if (idx >= 0) {
        return prev.map((s) => (s.id === service.id ? service : s));
      }
      return [...prev, service];
    });
    if (accountEmail) {
      saveServiceToFirestore(accountEmail, service);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    if (accountEmail) {
      deleteServiceFromFirestore(accountEmail, serviceId);
    }
  };

  const handleUpdateServicesStock = (serviceId: string, deltaStock: number) => {
    const current = services.find((s) => s.id === serviceId);
    if (current && current.stock !== undefined) {
      const updated = { ...current, stock: Math.max(0, current.stock + deltaStock) };
      handleSaveService(updated);
    }
  };

  const handleSavePackageTemplate = (pkg: PackageTemplate) => {
    setPackageTemplates((prev) => {
      const idx = prev.findIndex((p) => p.id === pkg.id);
      if (idx >= 0) {
        return prev.map((p) => (p.id === pkg.id ? pkg : p));
      }
      return [...prev, pkg];
    });
    if (accountEmail) {
      savePackageToFirestore(accountEmail, pkg);
    }
  };

  const handleDeletePackageTemplate = (pkgId: string) => {
    setPackageTemplates((prev) => prev.filter((p) => p.id !== pkgId));
    if (accountEmail) {
      deletePackageFromFirestore(accountEmail, pkgId);
    }
  };

  const handleUpdateCashDrawer = (newDrawer: CashDrawerSummary) => {
    setCashDrawer(newDrawer);
    if (accountEmail) {
      storage.saveCashDrawer(newDrawer, accountEmail);
      saveCashDrawerToFirestore(accountEmail, newDrawer);
    }
  };

  const handleSaveSalarySlip = (slip: SalarySlip) => {
    setSalarySlips((prev) => {
      const idx = prev.findIndex((s) => s.id === slip.id);
      if (idx >= 0) {
        return prev.map((s) => (s.id === slip.id ? slip : s));
      }
      return [slip, ...prev];
    });
    if (accountEmail) {
      saveSalarySlipToFirestore(accountEmail, slip);
    }
  };

  // Factory Reset for the CURRENT STORE (100% complete wipe of all data)
  const handleResetFactoryData = () => {
    if (!accountEmail) return;
    storage.resetDemoData(accountEmail);
    const freshSettings: StoreSettings = {
      ...DEFAULT_SETTINGS,
      storeName: accountEmail.split('@')[0].toUpperCase() + ' BARBERSHOP',
    };
    setSettings(freshSettings);
    setBarbers([]);
    setServices([]);
    setPackageTemplates([]);
    setMembers([]);
    setBills([]);
    setExpenses([]);
    setCashDrawer({
      date: new Date().toISOString().split('T')[0],
      openingFloat: 0,
      cashSales: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      cashExpenses: 0,
      expectedBalance: 0,
      status: 'OPEN',
    });
    setSalarySlips([]);
    resetFirestoreToFactory(accountEmail).catch(console.error);
    setActiveTab('POS');
  };

  const currentStaff = barbers.find((b) => b.id === activeStaffId) || barbers[0];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 font-sans selection:bg-amber-200 selection:text-stone-900 flex flex-col justify-between">
      {/* Sticky Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        settings={settings}
        barbers={barbers}
        activeStaffId={activeStaffId}
        onSelectStaff={setActiveStaffId}
        isAuthenticatedAdmin={isAuthenticatedAdmin}
        onRequestPinLock={handleRequestPinLock}
        isCloudConnected={isCloudConnected}
        currentAccountEmail={accountEmail}
        onSwitchAccount={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        todaySalesTotal={bills.filter(b => b.status === 'COMPLETED' && b.date?.startsWith(new Date().toISOString().slice(0, 10))).reduce((sum, b) => sum + (b.grandTotal || 0), 0)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-12">
        {activeTab === 'POS' && (
          <POSView
            services={services}
            packageTemplates={packageTemplates}
            barbers={barbers}
            members={members}
            onSaveMember={handleSaveMember}
            bills={bills}
            onAddBill={handleAddBill}
            onUpdateBill={handleUpdateBill}
            onDeleteBill={handleDeleteBill}
            onMergeBills={handleMergeBills}
            onUnmergeBill={handleUnmergeBill}
            onVoidBill={handleVoidBill}
            settings={settings}
            cashDrawer={cashDrawer}
            onUpdateCashDrawer={handleUpdateCashDrawer}
            activeStaffId={activeStaffId}
            onUpdateServicesStock={handleUpdateServicesStock}
          />
        )}

        {activeTab === 'MEMBERS' && (
          <MembersView
            members={members}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            packageTemplates={packageTemplates}
            onSavePackageTemplate={handleSavePackageTemplate}
            onDeletePackageTemplate={handleDeletePackageTemplate}
            services={services}
            bills={bills}
            settings={settings}
          />
        )}

        {activeTab === 'EXPENSES' && (
          <ExpensesView
            expenses={expenses}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            settings={settings}
          />
        )}

        {activeTab === 'DRAWER' && (
          <CashDrawerView
            cashDrawer={cashDrawer}
            onUpdateCashDrawer={handleUpdateCashDrawer}
            bills={bills}
            expenses={expenses}
            settings={settings}
            activeStaffName={currentStaff?.nickname || 'ช่างประจำร้าน'}
          />
        )}

        {activeTab === 'SALARY' && (
          <SalaryView
            barbers={barbers}
            bills={bills}
            expenses={expenses}
            salarySlips={salarySlips}
            onSaveSalarySlip={handleSaveSalarySlip}
            settings={settings}
          />
        )}

        {activeTab === 'REPORTS' && (
          <ReportsView
            bills={bills}
            expenses={expenses}
            barbers={barbers}
            services={services}
            settings={settings}
            onUpdateBill={handleUpdateBill}
            onDeleteBill={handleDeleteBill}
            onMergeBills={handleMergeBills}
            onUnmergeBill={handleUnmergeBill}
            onVoidBill={handleVoidBill}
          />
        )}

        {activeTab === 'SETTINGS' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            barbers={barbers}
            onSaveBarber={handleSaveBarber}
            onDeleteBarber={handleDeleteBarber}
            services={services}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
            onResetFactoryData={handleResetFactoryData}
          />
        )}
      </main>

      {/* Sleek Bottom Bar Footer */}
      <footer className="h-8 bg-stone-100 flex items-center justify-between px-4 sm:px-6 border-t border-stone-200 text-[11px] text-stone-500">
        <div className="flex items-center gap-2">
          <span>💈 {settings.storeName || 'BARBERSHOP'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Realtime Synced ({accountEmail})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>📍 {settings.address || 'สาขาหลัก'}</span>
        </div>
      </footer>

      {/* Security PIN Modal */}
      <PINModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinTargetTab(null);
        }}
        onSuccess={handlePinSuccess}
        correctPin={settings.adminPin || '1234'}
        title={pinTargetTab === 'SETTINGS' ? '🔒 ยืนยันรหัส PIN เข้าสู่หน้าตั้งค่า' : '🔒 ยืนยันรหัส PIN ผู้ดูแลร้าน'}
        subtitle={`กรุณากรอกรหัส PIN ${settings.adminPin?.length || 4} หลักเพื่อเข้าถึงข้อมูล (รหัสเริ่มต้น: ${settings.adminPin || '1234'})`}
      />

      {/* Multi-Account Login / Switch Store Modal */}
      <LoginModal
        isOpen={!accountEmail || isLoginModalOpen}
        currentEmail={accountEmail || ''}
        onLogin={handleLoginAccount}
        onClose={() => {
          if (accountEmail) setIsLoginModalOpen(false);
        }}
        canClose={Boolean(accountEmail)}
      />
    </div>
  );
}
