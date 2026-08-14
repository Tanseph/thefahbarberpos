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
  initialBarbers, 
  initialBills, 
  initialCashDrawer, 
  initialExpenses, 
  initialMembers, 
  initialPackages, 
  initialSalarySlips, 
  initialServices, 
  initialSettings, 
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

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'POS' | 'MEMBERS' | 'EXPENSES' | 'DRAWER' | 'SALARY' | 'REPORTS' | 'SETTINGS'>('POS');

  // Application Data States (synced with storage + Firestore cloud)
  const [settings, setSettings] = useState<StoreSettings>(() => storage.getSettings());
  const [barbers, setBarbers] = useState<Barber[]>(() => storage.getBarbers());
  const [services, setServices] = useState<ServiceItem[]>(() => storage.getServices());
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>(() => storage.getPackages());
  const [members, setMembers] = useState<Member[]>(() => storage.getMembers());
  const [bills, setBills] = useState<Bill[]>(() => storage.getBills());
  const [expenses, setExpenses] = useState(() => storage.getExpenses());
  const [cashDrawer, setCashDrawer] = useState<CashDrawerSummary>(() => storage.getCashDrawer());
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>(() => storage.getSalarySlips());

  // Cloud Sync Status Indicator
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Active Staff in session
  const [activeStaffId, setActiveStaffId] = useState<string>(() => barbers[0]?.id || '');

  // PIN Protection State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetTab, setPinTargetTab] = useState<'SETTINGS' | 'SALARY' | null>(null);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);

  // 1. Initial Firestore Seed & Real-Time Sync Listeners across all devices
  useEffect(() => {
    // Seed initial data to cloud if new database
    seedInitialDataIfEmpty().catch(console.error);

    // Subscribe to real-time changes from Firestore
    const unsubSettings = subscribeSettings((newSettings) => {
      setSettings(newSettings);
      storage.saveSettings(newSettings);
      setIsCloudConnected(true);
    });

    const unsubBarbers = subscribeBarbers((newBarbers) => {
      setBarbers(newBarbers);
      storage.saveBarbers(newBarbers);
      setIsCloudConnected(true);
    });

    const unsubServices = subscribeServices((newServices) => {
      setServices(newServices);
      storage.saveServices(newServices);
      setIsCloudConnected(true);
    });

    const unsubPackages = subscribePackages((newPackages) => {
      setPackageTemplates(newPackages);
      storage.savePackages(newPackages);
      setIsCloudConnected(true);
    });

    const unsubMembers = subscribeMembers((newMembers) => {
      setMembers(newMembers);
      storage.saveMembers(newMembers);
      setIsCloudConnected(true);
    });

    const unsubBills = subscribeBills((newBills) => {
      setBills(newBills);
      storage.saveBills(newBills);
      setIsCloudConnected(true);
    });

    const unsubExpenses = subscribeExpenses((newExpenses) => {
      setExpenses(newExpenses);
      storage.saveExpenses(newExpenses);
      setIsCloudConnected(true);
    });

    const unsubDrawer = subscribeCashDrawer((newDrawer) => {
      setCashDrawer(newDrawer);
      storage.saveCashDrawer(newDrawer);
      setIsCloudConnected(true);
    });

    const unsubSalary = subscribeSalarySlips((newSlips) => {
      setSalarySlips(newSlips);
      storage.saveSalarySlips(newSlips);
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
  }, []);

  // Ensure active staff is valid when barbers update
  useEffect(() => {
    if (barbers.length > 0 && !barbers.some(b => b.id === activeStaffId)) {
      setActiveStaffId(barbers[0].id);
    }
  }, [barbers, activeStaffId]);

  // Tab switching with PIN protection
  const handleTabChange = (tab: string) => {
    const normalizedTab: typeof activeTab = 
      tab === 'CASH_DRAWER' ? 'DRAWER' : 
      tab === 'SALARY_SLIPS' ? 'SALARY' : 
      (tab as typeof activeTab);

    if ((normalizedTab === 'SETTINGS' || normalizedTab === 'SALARY') && settings.isPinProtected && !isAuthenticatedAdmin) {
      setPinTargetTab(normalizedTab as 'SETTINGS' | 'SALARY');
      setIsPinModalOpen(true);
      return;
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

  // State mutations with cloud sync
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    saveSettingsToFirestore(newSettings);
  };

  const handleAddBill = (newBill: Bill) => {
    setBills((prev) => [newBill, ...prev]);
    saveBillToFirestore(newBill);
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills((prev) => prev.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
    saveBillToFirestore(updatedBill);
  };

  const handleDeleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    deleteBillFromFirestore(billId);
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
    saveMemberToFirestore(member);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    deleteMemberFromFirestore(memberId);
  };

  const handleSaveExpense = (expense: typeof expenses[0]) => {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        return prev.map((e) => (e.id === expense.id ? expense : e));
      }
      return [expense, ...prev];
    });
    saveExpenseToFirestore(expense);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    deleteExpenseFromFirestore(expenseId);
  };

  const handleSaveBarber = (barber: Barber) => {
    setBarbers((prev) => {
      const idx = prev.findIndex((b) => b.id === barber.id);
      if (idx >= 0) {
        return prev.map((b) => (b.id === barber.id ? barber : b));
      }
      return [...prev, barber];
    });
    saveBarberToFirestore(barber);
  };

  const handleDeleteBarber = (barberId: string) => {
    setBarbers((prev) => prev.filter((b) => b.id !== barberId));
    deleteBarberFromFirestore(barberId);
  };

  const handleSaveService = (service: ServiceItem) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id);
      if (idx >= 0) {
        return prev.map((s) => (s.id === service.id ? service : s));
      }
      return [...prev, service];
    });
    saveServiceToFirestore(service);
  };

  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    deleteServiceFromFirestore(serviceId);
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
    savePackageToFirestore(pkg);
  };

  const handleDeletePackageTemplate = (pkgId: string) => {
    setPackageTemplates((prev) => prev.filter((p) => p.id !== pkgId));
    deletePackageFromFirestore(pkgId);
  };

  const handleUpdateCashDrawer = (newDrawer: CashDrawerSummary) => {
    setCashDrawer(newDrawer);
    storage.saveCashDrawer(newDrawer);
    saveCashDrawerToFirestore(newDrawer);
  };

  const handleSaveSalarySlip = (slip: SalarySlip) => {
    setSalarySlips((prev) => {
      const idx = prev.findIndex((s) => s.id === slip.id);
      if (idx >= 0) {
        return prev.map((s) => (s.id === slip.id ? slip : s));
      }
      return [slip, ...prev];
    });
    saveSalarySlipToFirestore(slip);
  };

  // Factory Reset
  const handleResetFactoryData = () => {
    storage.resetDemoData();
    setSettings(initialSettings);
    setBarbers(initialBarbers);
    setServices(initialServices);
    setPackageTemplates(initialPackages);
    setMembers(initialMembers);
    setBills(initialBills);
    setExpenses(initialExpenses);
    setCashDrawer(initialCashDrawer);
    setSalarySlips(initialSalarySlips);
    resetFirestoreToFactory().catch(console.error);
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
        isCloudConnected={isCloudConnected}
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
            Cloud Realtime Synced
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
        title="การเข้าถึงส่วนที่มีความสำคัญ (Admin Security)"
      />
    </div>
  );
}
