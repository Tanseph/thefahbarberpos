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
  INITIAL_BARBERS,
  INITIAL_SERVICES,
  INITIAL_PACKAGE_TEMPLATES,
  INITIAL_MEMBERS,
  INITIAL_BILLS,
  INITIAL_EXPENSES,
  INITIAL_CASH_DRAWER,
  INITIAL_SALARY_SLIPS
} from '../utils/storage';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (with databaseId if specified in config)
export const db: Firestore = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection Names
export const COLLECTIONS = {
  SETTINGS: 'settings',
  BARBERS: 'barbers',
  SERVICES: 'services',
  PACKAGES: 'packages',
  MEMBERS: 'members',
  BILLS: 'bills',
  EXPENSES: 'expenses',
  CASH_DRAWER: 'cash_drawer',
  SALARY_SLIPS: 'salary_slips',
};

// Helper to clean any undefined values which Firestore rejects
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

// Seed initial store data if Firestore collection is completely empty
export async function seedInitialDataIfEmpty() {
  try {
    const settingsDocRef = doc(db, COLLECTIONS.SETTINGS, 'store_config');
    
    // Check if bills or barbers exist
    const barbersSnap = await getDocs(collection(db, COLLECTIONS.BARBERS));
    if (barbersSnap.empty) {
      console.log('🌱 Seeding initial barber shop data to Firestore...');
      const batch = writeBatch(db);

      // 1. Settings
      batch.set(settingsDocRef, cleanForFirestore({ ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() }));

      // 2. Barbers
      INITIAL_BARBERS.forEach((barber) => {
        batch.set(doc(db, COLLECTIONS.BARBERS, barber.id), cleanForFirestore(barber));
      });

      // 3. Services
      INITIAL_SERVICES.forEach((service) => {
        batch.set(doc(db, COLLECTIONS.SERVICES, service.id), cleanForFirestore(service));
      });

      // 4. Packages
      INITIAL_PACKAGE_TEMPLATES.forEach((pkg) => {
        batch.set(doc(db, COLLECTIONS.PACKAGES, pkg.id), cleanForFirestore(pkg));
      });

      // 5. Members
      INITIAL_MEMBERS.forEach((member) => {
        batch.set(doc(db, COLLECTIONS.MEMBERS, member.id), cleanForFirestore(member));
      });

      // 6. Bills
      INITIAL_BILLS.forEach((bill) => {
        batch.set(doc(db, COLLECTIONS.BILLS, bill.id), cleanForFirestore(bill));
      });

      // 7. Expenses
      INITIAL_EXPENSES.forEach((exp) => {
        batch.set(doc(db, COLLECTIONS.EXPENSES, exp.id), cleanForFirestore(exp));
      });

      // 8. Cash Drawer
      batch.set(doc(db, COLLECTIONS.CASH_DRAWER, 'current'), cleanForFirestore(INITIAL_CASH_DRAWER));

      // 9. Salary Slips
      INITIAL_SALARY_SLIPS.forEach((slip) => {
        batch.set(doc(db, COLLECTIONS.SALARY_SLIPS, slip.id), cleanForFirestore(slip));
      });

      await batch.commit();
      console.log('✅ Firestore seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding initial Firestore data:', error);
  }
}

// Reset Firestore Database back to factory demo state
export async function resetFirestoreToFactory() {
  try {
    const batch = writeBatch(db);

    // 1. Settings
    batch.set(doc(db, COLLECTIONS.SETTINGS, 'store_config'), cleanForFirestore({ ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() }));

    // 2. Barbers
    INITIAL_BARBERS.forEach((barber) => {
      batch.set(doc(db, COLLECTIONS.BARBERS, barber.id), cleanForFirestore(barber));
    });

    // 3. Services
    INITIAL_SERVICES.forEach((service) => {
      batch.set(doc(db, COLLECTIONS.SERVICES, service.id), cleanForFirestore(service));
    });

    // 4. Packages
    INITIAL_PACKAGE_TEMPLATES.forEach((pkg) => {
      batch.set(doc(db, COLLECTIONS.PACKAGES, pkg.id), cleanForFirestore(pkg));
    });

    // 5. Members
    INITIAL_MEMBERS.forEach((member) => {
      batch.set(doc(db, COLLECTIONS.MEMBERS, member.id), cleanForFirestore(member));
    });

    // 6. Bills
    INITIAL_BILLS.forEach((bill) => {
      batch.set(doc(db, COLLECTIONS.BILLS, bill.id), cleanForFirestore(bill));
    });

    // 7. Expenses
    INITIAL_EXPENSES.forEach((exp) => {
      batch.set(doc(db, COLLECTIONS.EXPENSES, exp.id), cleanForFirestore(exp));
    });

    // 8. Cash Drawer
    batch.set(doc(db, COLLECTIONS.CASH_DRAWER, 'current'), cleanForFirestore(INITIAL_CASH_DRAWER));

    // 9. Salary Slips
    INITIAL_SALARY_SLIPS.forEach((slip) => {
      batch.set(doc(db, COLLECTIONS.SALARY_SLIPS, slip.id), cleanForFirestore(slip));
    });

    await batch.commit();
  } catch (err) {
    console.error('Error resetting Firestore to factory:', err);
  }
}

// ================= Realtime Firestore Hooks / Helpers =================

// Sync Settings
export function subscribeSettings(callback: (settings: StoreSettings) => void) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'store_config');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as StoreSettings);
    }
  }, (err) => {
    console.error('Firestore settings subscription error:', err);
  });
}

export async function saveSettingsToFirestore(settings: StoreSettings) {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'store_config');
    await setDoc(docRef, cleanForFirestore({ ...settings, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (err) {
    console.error('Failed to save settings to Firestore:', err);
  }
}

// Sync Barbers
export function subscribeBarbers(callback: (barbers: Barber[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.BARBERS), (snap) => {
    const list: Barber[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Barber);
    });
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.error('Firestore barbers subscription error:', err);
  });
}

export async function saveBarberToFirestore(barber: Barber) {
  try {
    const docRef = doc(db, COLLECTIONS.BARBERS, barber.id);
    await setDoc(docRef, cleanForFirestore(barber), { merge: true });
  } catch (err) {
    console.error('Failed to save barber to Firestore:', err);
  }
}

export async function deleteBarberFromFirestore(barberId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.BARBERS, barberId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete barber from Firestore:', err);
  }
}

// Sync Services
export function subscribeServices(callback: (services: ServiceItem[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.SERVICES), (snap) => {
    const list: ServiceItem[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as ServiceItem);
    });
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.error('Firestore services subscription error:', err);
  });
}

export async function saveServiceToFirestore(service: ServiceItem) {
  try {
    const docRef = doc(db, COLLECTIONS.SERVICES, service.id);
    await setDoc(docRef, cleanForFirestore(service), { merge: true });
  } catch (err) {
    console.error('Failed to save service to Firestore:', err);
  }
}

export async function deleteServiceFromFirestore(serviceId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete service from Firestore:', err);
  }
}

// Sync Packages
export function subscribePackages(callback: (packages: PackageTemplate[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.PACKAGES), (snap) => {
    const list: PackageTemplate[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as PackageTemplate);
    });
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.error('Firestore packages subscription error:', err);
  });
}

export async function savePackageToFirestore(pkg: PackageTemplate) {
  try {
    const docRef = doc(db, COLLECTIONS.PACKAGES, pkg.id);
    await setDoc(docRef, cleanForFirestore(pkg), { merge: true });
  } catch (err) {
    console.error('Failed to save package to Firestore:', err);
  }
}

export async function deletePackageFromFirestore(pkgId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.PACKAGES, pkgId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete package from Firestore:', err);
  }
}

// Sync Members
export function subscribeMembers(callback: (members: Member[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.MEMBERS), (snap) => {
    const list: Member[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Member);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore members subscription error:', err);
  });
}

export async function saveMemberToFirestore(member: Member) {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, member.id);
    await setDoc(docRef, cleanForFirestore(member), { merge: true });
  } catch (err) {
    console.error('Failed to save member to Firestore:', err);
  }
}

export async function deleteMemberFromFirestore(memberId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete member from Firestore:', err);
  }
}

// Sync Bills
export function subscribeBills(callback: (bills: Bill[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.BILLS), (snap) => {
    const list: Bill[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Bill);
    });
    // Sort bills by date descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore bills subscription error:', err);
  });
}

export async function saveBillToFirestore(bill: Bill) {
  try {
    const docRef = doc(db, COLLECTIONS.BILLS, bill.id);
    await setDoc(docRef, cleanForFirestore(bill), { merge: true });
  } catch (err) {
    console.error('Failed to save bill to Firestore:', err);
  }
}

export async function deleteBillFromFirestore(billId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.BILLS, billId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete bill from Firestore:', err);
  }
}

// Sync Expenses
export function subscribeExpenses(callback: (expenses: Expense[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.EXPENSES), (snap) => {
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

export async function saveExpenseToFirestore(expense: Expense) {
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expense.id);
    await setDoc(docRef, cleanForFirestore(expense), { merge: true });
  } catch (err) {
    console.error('Failed to save expense to Firestore:', err);
  }
}

export async function deleteExpenseFromFirestore(expenseId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expenseId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete expense from Firestore:', err);
  }
}

// Sync Cash Drawer
export function subscribeCashDrawer(callback: (drawer: CashDrawerSummary) => void) {
  const docRef = doc(db, COLLECTIONS.CASH_DRAWER, 'current');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CashDrawerSummary);
    }
  }, (err) => {
    console.error('Firestore drawer subscription error:', err);
  });
}

export async function saveCashDrawerToFirestore(drawer: CashDrawerSummary) {
  try {
    const docRef = doc(db, COLLECTIONS.CASH_DRAWER, 'current');
    await setDoc(docRef, cleanForFirestore(drawer), { merge: true });
  } catch (err) {
    console.error('Failed to save cash drawer to Firestore:', err);
  }
}

// Sync Salary Slips
export function subscribeSalarySlips(callback: (slips: SalarySlip[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.SALARY_SLIPS), (snap) => {
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

export async function saveSalarySlipToFirestore(slip: SalarySlip) {
  try {
    const docRef = doc(db, COLLECTIONS.SALARY_SLIPS, slip.id);
    await setDoc(docRef, cleanForFirestore(slip), { merge: true });
  } catch (err) {
    console.error('Failed to save salary slip to Firestore:', err);
  }
}
