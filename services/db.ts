
import { SyncIntent } from '../types';

const DB_NAME = 'dentsched-db';
const DB_VERSION = 1;
const STORES = ['actionQueue', 'syncConflicts', 'patients', 'appointments', 'settings'];

// Fix: Renamed variable to avoid conflict with exported 'db' object.
let dbConnection: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (dbConnection) return resolve(dbConnection);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject('Error opening IndexedDB');
        request.onsuccess = (event) => {
            dbConnection = (event.target as IDBOpenDBRequest).result;
            resolve(dbConnection);
        };
        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            STORES.forEach(storeName => {
                if (!dbInstance.objectStoreNames.contains(storeName)) {
                    dbInstance.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
    });
};

// Fix: The 'db' export is now unambiguous.
export const db = {
    get: async <T>(storeName: string, key: string): Promise<T | undefined> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    getAll: async <T>(storeName: string): Promise<T[]> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    set: async <T>(storeName: string, value: T): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    del: async (storeName: string, key: string): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
};
