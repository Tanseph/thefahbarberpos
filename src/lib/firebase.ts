import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Barber,
  ProductItem,
  SaleBill,
  ShopExpense,
  QueueBooking,
  ShopSettings,
} from '../types';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Skill Standard Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local cache fallback.');
    }
    return false;
  }
}

// Generate a safe shop ID from an email
export function getShopIdFromEmail(email: string): string {
  const sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  return `shop_${sanitized}`;
}

// Cloud sync services for tenant shop
export interface CloudShopData {
  settings?: ShopSettings;
  barbers?: Barber[];
  products?: ProductItem[];
  bills?: SaleBill[];
  expenses?: ShopExpense[];
  queues?: QueueBooking[];
}

export async function saveShopSettingsToCloud(shopId: string, email: string, settings: ShopSettings) {
  const docPath = `shops/${shopId}`;
  try {
    await setDoc(
      doc(db, 'shops', shopId),
      {
        id: shopId,
        email,
        shopName: settings.shopName || 'BarberPOS',
        settings,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function saveDocumentToCloud<T extends { id: string }>(
  shopId: string,
  subCollection: 'barbers' | 'products' | 'bills' | 'expenses' | 'queues',
  item: T
) {
  const docPath = `shops/${shopId}/${subCollection}/${item.id}`;
  try {
    await setDoc(doc(db, 'shops', shopId, subCollection, item.id), item, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function deleteDocumentFromCloud(
  shopId: string,
  subCollection: 'barbers' | 'products' | 'bills' | 'expenses' | 'queues',
  itemId: string
) {
  const docPath = `shops/${shopId}/${subCollection}/${itemId}`;
  try {
    await deleteDoc(doc(db, 'shops', shopId, subCollection, itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// Real-time listener for entire shop workspace
export function subscribeToShopData(
  shopId: string,
  callbacks: {
    onSettings?: (settings: ShopSettings) => void;
    onBarbers?: (barbers: Barber[]) => void;
    onProducts?: (products: ProductItem[]) => void;
    onBills?: (bills: SaleBill[]) => void;
    onExpenses?: (expenses: ShopExpense[]) => void;
    onQueues?: (queues: QueueBooking[]) => void;
  }
): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];

  // 1. Settings
  try {
    const unsubSettings = onSnapshot(
      doc(db, 'shops', shopId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.settings && callbacks.onSettings) {
            callbacks.onSettings(data.settings as ShopSettings);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `shops/${shopId}`)
    );
    unsubs.push(unsubSettings);
  } catch (e) {
    console.error('Error listening to shop settings', e);
  }

  // 2. Barbers
  try {
    const unsubBarbers = onSnapshot(
      collection(db, 'shops', shopId, 'barbers'),
      (snap) => {
        if (callbacks.onBarbers && !snap.empty) {
          const items: Barber[] = [];
          snap.forEach((d) => items.push(d.data() as Barber));
          callbacks.onBarbers(items);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `shops/${shopId}/barbers`)
    );
    unsubs.push(unsubBarbers);
  } catch (e) {
    console.error('Error listening to barbers', e);
  }

  // 3. Products
  try {
    const unsubProducts = onSnapshot(
      collection(db, 'shops', shopId, 'products'),
      (snap) => {
        if (callbacks.onProducts && !snap.empty) {
          const items: ProductItem[] = [];
          snap.forEach((d) => items.push(d.data() as ProductItem));
          callbacks.onProducts(items);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `shops/${shopId}/products`)
    );
    unsubs.push(unsubProducts);
  } catch (e) {
    console.error('Error listening to products', e);
  }

  // 4. Bills
  try {
    const unsubBills = onSnapshot(
      collection(db, 'shops', shopId, 'bills'),
      (snap) => {
        if (callbacks.onBills && !snap.empty) {
          const items: SaleBill[] = [];
          snap.forEach((d) => items.push(d.data() as SaleBill));
          callbacks.onBills(items);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `shops/${shopId}/bills`)
    );
    unsubs.push(unsubBills);
  } catch (e) {
    console.error('Error listening to bills', e);
  }

  // 5. Expenses
  try {
    const unsubExpenses = onSnapshot(
      collection(db, 'shops', shopId, 'expenses'),
      (snap) => {
        if (callbacks.onExpenses && !snap.empty) {
          const items: ShopExpense[] = [];
          snap.forEach((d) => items.push(d.data() as ShopExpense));
          callbacks.onExpenses(items);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `shops/${shopId}/expenses`)
    );
    unsubs.push(unsubExpenses);
  } catch (e) {
    console.error('Error listening to expenses', e);
  }

  // 6. Queues
  try {
    const unsubQueues = onSnapshot(
      collection(db, 'shops', shopId, 'queues'),
      (snap) => {
        if (callbacks.onQueues && !snap.empty) {
          const items: QueueBooking[] = [];
          snap.forEach((d) => items.push(d.data() as QueueBooking));
          callbacks.onQueues(items);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `shops/${shopId}/queues`)
    );
    unsubs.push(unsubQueues);
  } catch (e) {
    console.error('Error listening to queues', e);
  }

  return unsubs;
}
