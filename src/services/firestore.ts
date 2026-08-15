import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs, 
  onSnapshot, 
  writeBatch,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Barber,
  Bill,
  CashDrawerSummary,
  Expense,
  Member,
  PackageTemplate,
  SalarySlip,
  ServiceItem,
  StoreSettings
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_CASH_DRAWER
} from '../utils/storage';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (with databaseId if specified in config)
export const db: Firestore = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId)
  : getFirestore(app);

// Helper to sanitize store email identifier for Firestore paths
export function sanitizeStoreId(email: string): string {
  if (!email || typeof email !== 'string') return 'default_store';
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return clean || 'default_store';
}

// Firestore Subcollection Names under stores/{storeId}/
export const STORE_COLLECTIONS = {
  SETTINGS: 'settings',
  BARBERS: 'barbers',
  SERVICES: 'services',
  PACKAGES: 'packages',
  MEMBERS: 'members',
  BILLS: 'bills',
  EXPENSES: 'expenses',
  CASH_DRAWER: 'cash_drawer',
  SALARY_SLIPS: 'salary_slips',
  SYSTEM: 'system',
};

// Helper to clean any undefined values which Firestore rejects
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

// Seed initial store data for a specific store account if it's completely new
export async function seedInitialDataIfEmpty(storeEmail: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const systemCol = collection(db, 'stores', storeId, STORE_COLLECTIONS.SYSTEM);
    const initSnap = await getDocs(systemCol);
    
    // If store was already initialized in the past, do not re-seed
    if (!initSnap.empty) {
      return;
    }

    const barbersCol = collection(db, 'stores', storeId, STORE_COLLECTIONS.BARBERS);
    const billsCol = collection(db, 'stores', storeId, STORE_COLLECTIONS.BILLS);
    const barbersSnap = await getDocs(barbersCol);
    const billsSnap = await getDocs(billsCol);

    if (barbersSnap.empty && billsSnap.empty) {
      console.log(`🌱 Initializing clean store workspace for: ${storeEmail} (${storeId})...`);
      const batch = writeBatch(db);

      // Mark store system as initialized
      const initDocRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SYSTEM, 'init_status');
      batch.set(initDocRef, { 
        email: storeEmail, 
        storeId, 
        initializedAt: new Date().toISOString(), 
        isSeeded: true 
      });

      const cleanEmail = storeEmail.trim().toLowerCase();
      const defaultName = cleanEmail === 'thefahbarber@gmail.com'
        ? 'THE FAH BARBER & SALON'
        : cleanEmail.includes('@')
        ? `${cleanEmail.split('@')[0].toUpperCase()} BARBERSHOP`
        : 'ร้านตัดผม (BARBERSHOP)';

      // 1. Clean Settings for this store account
      const settingsDocRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SETTINGS, 'store_config');
      batch.set(settingsDocRef, cleanForFirestore({ 
        ...DEFAULT_SETTINGS, 
        storeName: defaultName,
        promptPayName: defaultName,
        address: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.address : '',
        phone: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.phone : '',
        taxId: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.taxId : '',
        promptPayId: cleanEmail === 'thefahbarber@gmail.com' ? DEFAULT_SETTINGS.promptPayId : '',
        updatedAt: new Date().toISOString() 
      }));

      // 2. Fresh Cash Drawer (0 balances)
      batch.set(doc(db, 'stores', storeId, STORE_COLLECTIONS.CASH_DRAWER, 'current'), cleanForFirestore(INITIAL_CASH_DRAWER));

      await batch.commit();
      console.log(`✅ Clean store workspace for ${storeEmail} created successfully (No old data/clean state)!`);
    } else {
      const initDocRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SYSTEM, 'init_status');
      await setDoc(initDocRef, { 
        email: storeEmail, 
        storeId, 
        initializedAt: new Date().toISOString(), 
        isSeeded: true 
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error seeding store data:', error);
  }
}

// Reset Firestore Database for the CURRENT STORE back to clean factory state (Wipes everything completely)
export async function resetFirestoreToFactory(storeEmail: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);

    // 1. Delete all barbers
    const barbersSnap = await getDocs(collection(db, 'stores', storeId, STORE_COLLECTIONS.BARBERS));
    await Promise.all(barbersSnap.docs.map(d => deleteDoc(d.ref)));

    // 2. Delete all services
    const servicesSnap = await getDocs(collection(db, 'stores', storeId, STORE_COLLECTIONS.SERVICES));
    await Promise.all(servicesSnap.docs.map(d => deleteDoc(d.ref)));

    // 3. Delete all packages
    const pkgSnap = await getDocs(collection(db, 'stores', storeId, STORE_COLLECTIONS.PACKAGES));
    await Promise.all(pkgSnap.docs.map(d => deleteDoc(d.ref)));

    // 4. Delete all members
    const membersSnap = await getDocs(collection(db, 'stores', storeId, STORE_COLLECTIONS.MEMBERS));
    await Promise.all(membersSnap.docs.map(d => deleteDoc(d.ref)));

    // 5. Delete all bills
    const billsSnap = await getDocs(collection(db, 'stores', storeId, STORE_COLLECTIONS.BILLS));
    await Promise.all(billsSnap.docs.map(d => deleteDoc(d.ref)));

    // 6. Delete all expenses
    const expSnap = await getDocs(collection(db, 'stores', storeId, STORE_COLLECTIONS.EXPENSES));
    await Promise.all(expSnap.docs.map(d => deleteDoc(d.ref)));

    // 7. Delete all salary slips
    const slipsSnap = await getDocs(collection(db, 'stores', storeId, STORE_COLLECTIONS.SALARY_SLIPS));
    await Promise.all(slipsSnap.docs.map(d => deleteDoc(d.ref)));

    // 8. Reset Settings & Cash Drawer
    const batch = writeBatch(db);
    const settingsDocRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SETTINGS, 'store_config');
    batch.set(settingsDocRef, cleanForFirestore({
      ...DEFAULT_SETTINGS,
      storeName: storeEmail.split('@')[0].toUpperCase() + ' BARBERSHOP',
      updatedAt: new Date().toISOString()
    }));

    const emptyDrawer = {
      date: new Date().toISOString().split('T')[0],
      openingFloat: 0,
      cashSales: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      cashExpenses: 0,
      expectedBalance: 0,
      status: 'OPEN'
    };
    batch.set(doc(db, 'stores', storeId, STORE_COLLECTIONS.CASH_DRAWER, 'current'), cleanForFirestore(emptyDrawer));

    // Update system marker
    batch.set(doc(db, 'stores', storeId, STORE_COLLECTIONS.SYSTEM, 'init_status'), { 
      email: storeEmail, 
      storeId, 
      resetAt: new Date().toISOString(), 
      isSeeded: true 
    });

    await batch.commit();
    console.log(`✅ Factory Reset Firestore for [${storeEmail}] completed cleanly.`);
  } catch (err) {
    console.error('Error resetting Firestore store to factory:', err);
  }
}

// ================= Realtime Firestore Hooks / Helpers (Scoped to storeEmail) =================

// Sync Settings
export function subscribeSettings(storeEmail: string, callback: (settings: StoreSettings) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SETTINGS, 'store_config');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as StoreSettings);
    }
  }, (err) => {
    console.error('Firestore settings subscription error:', err);
  });
}

export async function saveSettingsToFirestore(storeEmail: string, settings: StoreSettings) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SETTINGS, 'store_config');
    await setDoc(docRef, cleanForFirestore({ ...settings, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (err) {
    console.error('Failed to save settings to Firestore:', err);
  }
}

// Sync Barbers
export function subscribeBarbers(storeEmail: string, callback: (barbers: Barber[]) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  return onSnapshot(collection(db, 'stores', storeId, STORE_COLLECTIONS.BARBERS), (snap) => {
    const list: Barber[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Barber);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore barbers subscription error:', err);
  });
}

export async function saveBarberToFirestore(storeEmail: string, barber: Barber) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.BARBERS, barber.id);
    await setDoc(docRef, cleanForFirestore(barber), { merge: true });
  } catch (err) {
    console.error('Failed to save barber to Firestore:', err);
  }
}

export async function deleteBarberFromFirestore(storeEmail: string, barberId: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.BARBERS, barberId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete barber from Firestore:', err);
  }
}

// Sync Services
export function subscribeServices(storeEmail: string, callback: (services: ServiceItem[]) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  return onSnapshot(collection(db, 'stores', storeId, STORE_COLLECTIONS.SERVICES), (snap) => {
    const list: ServiceItem[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as ServiceItem);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore services subscription error:', err);
  });
}

export async function saveServiceToFirestore(storeEmail: string, service: ServiceItem) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SERVICES, service.id);
    await setDoc(docRef, cleanForFirestore(service), { merge: true });
  } catch (err) {
    console.error('Failed to save service to Firestore:', err);
  }
}

export async function deleteServiceFromFirestore(storeEmail: string, serviceId: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SERVICES, serviceId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete service from Firestore:', err);
  }
}

// Sync Packages
export function subscribePackages(storeEmail: string, callback: (packages: PackageTemplate[]) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  return onSnapshot(collection(db, 'stores', storeId, STORE_COLLECTIONS.PACKAGES), (snap) => {
    const list: PackageTemplate[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as PackageTemplate);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore packages subscription error:', err);
  });
}

export async function savePackageToFirestore(storeEmail: string, pkg: PackageTemplate) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.PACKAGES, pkg.id);
    await setDoc(docRef, cleanForFirestore(pkg), { merge: true });
  } catch (err) {
    console.error('Failed to save package to Firestore:', err);
  }
}

export async function deletePackageFromFirestore(storeEmail: string, pkgId: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.PACKAGES, pkgId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete package from Firestore:', err);
  }
}

// Sync Members
export function subscribeMembers(storeEmail: string, callback: (members: Member[]) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  return onSnapshot(collection(db, 'stores', storeId, STORE_COLLECTIONS.MEMBERS), (snap) => {
    const list: Member[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Member);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore members subscription error:', err);
  });
}

export async function saveMemberToFirestore(storeEmail: string, member: Member) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.MEMBERS, member.id);
    await setDoc(docRef, cleanForFirestore(member), { merge: true });
  } catch (err) {
    console.error('Failed to save member to Firestore:', err);
  }
}

export async function deleteMemberFromFirestore(storeEmail: string, memberId: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.MEMBERS, memberId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete member from Firestore:', err);
  }
}

// Sync Bills
export function subscribeBills(storeEmail: string, callback: (bills: Bill[]) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  return onSnapshot(collection(db, 'stores', storeId, STORE_COLLECTIONS.BILLS), (snap) => {
    const list: Bill[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Bill);
    });
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore bills subscription error:', err);
  });
}

export async function saveBillToFirestore(storeEmail: string, bill: Bill) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.BILLS, bill.id);
    await setDoc(docRef, cleanForFirestore(bill), { merge: true });
  } catch (err) {
    console.error('Failed to save bill to Firestore:', err);
  }
}

export async function deleteBillFromFirestore(storeEmail: string, billId: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.BILLS, billId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete bill from Firestore:', err);
  }
}

// Sync Expenses
export function subscribeExpenses(storeEmail: string, callback: (expenses: Expense[]) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  return onSnapshot(collection(db, 'stores', storeId, STORE_COLLECTIONS.EXPENSES), (snap) => {
    const list: Expense[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Expense);
    });
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore expenses subscription error:', err);
  });
}

export async function saveExpenseToFirestore(storeEmail: string, expense: Expense) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.EXPENSES, expense.id);
    await setDoc(docRef, cleanForFirestore(expense), { merge: true });
  } catch (err) {
    console.error('Failed to save expense to Firestore:', err);
  }
}

export async function deleteExpenseFromFirestore(storeEmail: string, expenseId: string) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.EXPENSES, expenseId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete expense from Firestore:', err);
  }
}

// Sync Cash Drawer
export function subscribeCashDrawer(storeEmail: string, callback: (drawer: CashDrawerSummary) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.CASH_DRAWER, 'current');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CashDrawerSummary);
    }
  }, (err) => {
    console.error('Firestore drawer subscription error:', err);
  });
}

export async function saveCashDrawerToFirestore(storeEmail: string, drawer: CashDrawerSummary) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.CASH_DRAWER, 'current');
    await setDoc(docRef, cleanForFirestore(drawer), { merge: true });
  } catch (err) {
    console.error('Failed to save cash drawer to Firestore:', err);
  }
}

// Sync Salary Slips
export function subscribeSalarySlips(storeEmail: string, callback: (slips: SalarySlip[]) => void) {
  const storeId = sanitizeStoreId(storeEmail);
  return onSnapshot(collection(db, 'stores', storeId, STORE_COLLECTIONS.SALARY_SLIPS), (snap) => {
    const list: SalarySlip[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as SalarySlip);
    });
    list.sort((a, b) => {
      const timeA = new Date(a.issueDate || a.month || 0).getTime();
      const timeB = new Date(b.issueDate || b.month || 0).getTime();
      return timeB - timeA;
    });
    callback(list);
  }, (err) => {
    console.error('Firestore salary slips subscription error:', err);
  });
}

export async function saveSalarySlipToFirestore(storeEmail: string, slip: SalarySlip) {
  try {
    const storeId = sanitizeStoreId(storeEmail);
    const docRef = doc(db, 'stores', storeId, STORE_COLLECTIONS.SALARY_SLIPS, slip.id);
    await setDoc(docRef, cleanForFirestore(slip), { merge: true });
  } catch (err) {
    console.error('Failed to save salary slip to Firestore:', err);
  }
}
