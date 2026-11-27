import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { createDemoSeedData } from './demo-seed';
import { DemoInboxMessage } from './demo-models';

export const DEMO_DB_NAME = 'ims_portfolio_demo';
export const DEMO_DB_VERSION = 1;
export const DEMO_STORE_NAMES = [
  'users',
  'clients',
  'invoices',
  'invitations',
  'portal_accounts',
  'demo_inbox'
] as const;

export type DemoStoreName = typeof DEMO_STORE_NAMES[number];

const DEMO_STORAGE_KEYS = [
  'auth_token',
  'auth_username',
  'auth_display_name',
  'client_auth_token',
  'client_auth_name',
  'client_auth_email',
  'ims_demo_welcome_dismissed'
];

@Injectable({
  providedIn: 'root'
})
export class DemoDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private initPromise: Promise<void> | null = null;

  readonly unreadInboxCount$ = new BehaviorSubject<number>(0);
  readonly dataChanged$ = new Subject<void>();

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DEMO_DB_NAME, DEMO_DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of DEMO_STORE_NAMES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.seedIfEmpty();
    return this.initPromise;
  }

  private async seedIfEmpty(): Promise<void> {
    const db = await this.openDb();
    const existingUsers = await this.getAllRaw<any>(db, 'users');
    if (existingUsers.length === 0) {
      await this.writeSeedBundle(db);
    }
    await this.refreshUnreadCount();
  }

  private async writeSeedBundle(db: IDBDatabase): Promise<void> {
    const seed = createDemoSeedData();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([...DEMO_STORE_NAMES], 'readwrite');
      for (const storeName of DEMO_STORE_NAMES) {
        const store = tx.objectStore(storeName);
        store.clear();
        for (const item of seed[storeName]) {
          store.put(item);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async resetDemoData(): Promise<void> {
    const db = await this.openDb();
    await this.writeSeedBundle(db);
    for (const key of DEMO_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    await this.refreshUnreadCount();
    this.dataChanged$.next();
  }

  async getAll<T>(storeName: DemoStoreName): Promise<T[]> {
    await this.ensureInitialized();
    const db = await this.openDb();
    return this.getAllRaw<T>(db, storeName);
  }

  async getById<T>(storeName: DemoStoreName, id: number): Promise<T | undefined> {
    await this.ensureInitialized();
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T extends { id: number }>(storeName: DemoStoreName, value: T): Promise<T> {
    await this.ensureInitialized();
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    if (storeName === 'demo_inbox') {
      await this.refreshUnreadCount();
    }
    this.dataChanged$.next();
    return value;
  }

  async putAll<T extends { id: number }>(storeName: DemoStoreName, values: T[]): Promise<void> {
    await this.ensureInitialized();
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of values) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    if (storeName === 'demo_inbox') {
      await this.refreshUnreadCount();
    }
    this.dataChanged$.next();
  }

  async deleteById(storeName: DemoStoreName, id: number): Promise<void> {
    await this.ensureInitialized();
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    if (storeName === 'demo_inbox') {
      await this.refreshUnreadCount();
    }
    this.dataChanged$.next();
  }

  async nextId(storeName: DemoStoreName): Promise<number> {
    const all = await this.getAll<{ id: number }>(storeName);
    if (all.length === 0) return 1;
    return Math.max(...all.map(item => Number(item.id) || 0)) + 1;
  }

  async refreshUnreadCount(): Promise<void> {
    const db = await this.openDb();
    const messages = await this.getAllRaw<DemoInboxMessage>(db, 'demo_inbox');
    this.unreadInboxCount$.next(messages.filter(m => !m.read).length);
  }

  private getAllRaw<T>(db: IDBDatabase, storeName: DemoStoreName): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }
}
