import { db } from '../firebase';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { LifecellNumber, ServiceResult } from '../types';

const ADMIN_PASSWORD = 'R4m$ey#2026_xK9@vQ7!Wz';
const COLLECTION_NAME = 'numbers';

class NumberService {
  private adminLoggedIn = false;

  isAdminLoggedIn(): boolean {
    return this.adminLoggedIn || sessionStorage.getItem('rams3y_admin_auth') === 'true';
  }

  async verifyAdmin(password: string): Promise<ServiceResult> {
    if (password === ADMIN_PASSWORD) {
      this.adminLoggedIn = true;
      sessionStorage.setItem('rams3y_admin_auth', 'true');
      return { success: true, message: 'Успішний вхід' };
    }
    return { success: false, message: 'Невірний пароль адміністратора' };
  }

  logoutAdmin(): void {
    this.adminLoggedIn = false;
    sessionStorage.removeItem('rams3y_admin_auth');
  }

  async changePassword(currentPass: string, newPass: string): Promise<ServiceResult> {
    return { success: false, message: 'Зміна пароля недоступна — пароль встановлено в коді проекту' };
  }

  async getAllNumbers(): Promise<LifecellNumber[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as LifecellNumber));
    } catch (err) {
      console.error('Firestore getAllNumbers error:', err);
      return [];
    }
  }

  subscribeToNumbers(callback: (numbers: LifecellNumber[]) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(q, (snap) => {
      const numbers = snap.docs.map(d => ({ id: d.id, ...d.data() } as LifecellNumber));
      callback(numbers);
    }, (err) => {
      console.error('Firestore subscribe error:', err);
    });
  }

  async addNumber(item: Partial<LifecellNumber>): Promise<ServiceResult> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...item, createdAt: serverTimestamp(),
      });
      return { success: true, item: { id: docRef.id, ...item } as LifecellNumber };
    } catch (err: any) {
      return { success: false, message: err.message || 'Помилка додавання' };
    }
  }

  async updateNumber(id: string, updates: Partial<LifecellNumber>): Promise<ServiceResult> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), updates as any);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Помилка оновлення' };
    }
  }

  async deleteNumber(id: string): Promise<ServiceResult> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Помилка видалення' };
    }
  }

  async bulkDelete(ids: string[]): Promise<ServiceResult> {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => batch.delete(doc(db, COLLECTION_NAME, id)));
      await batch.commit();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Помилка масового видалення' };
    }
  }

  async bulkPriceAdjust(params: {
    mode: 'add_fixed' | 'subtract_fixed' | 'percent_add' | 'percent_subtract' | 'set_fixed';
    value: number; category?: string; code?: string;
  }): Promise<ServiceResult> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        const item = d.data() as LifecellNumber;
        if (params.category && item.category !== params.category) return;
        if (params.code && item.code !== params.code) return;
        let newPrice = item.price;
        switch (params.mode) {
          case 'add_fixed': newPrice = item.price + params.value; break;
          case 'subtract_fixed': newPrice = item.price - params.value; break;
          case 'percent_add': newPrice = Math.round(item.price * (1 + params.value / 100)); break;
          case 'percent_subtract': newPrice = Math.round(item.price * (1 - params.value / 100)); break;
          case 'set_fixed': newPrice = params.value; break;
        }
        if (newPrice < 0) newPrice = 0;
        batch.update(d.ref, { price: newPrice });
      });
      await batch.commit();
      return { success: true, message: 'Ціни оновлено для всіх номерів' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Помилка оновлення цін' };
    }
  }

  async bulkImport(items: LifecellNumber[], replace: boolean): Promise<ServiceResult> {
    try {
      if (replace) {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        const delBatch = writeBatch(db);
        snap.docs.forEach(d => delBatch.delete(d.ref));
        await delBatch.commit();
      }
      const addBatch = writeBatch(db);
      items.forEach(item => {
        const { id, ...data } = item;
        const ref = doc(collection(db, COLLECTION_NAME));
        addBatch.set(ref, { ...data, createdAt: serverTimestamp() });
      });
      await addBatch.commit();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Помилка імпорту' };
    }
  }

  async resetToDefault(): Promise<ServiceResult> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Помилка скидання' };
    }
  }

  saveLocalCache(numbers: LifecellNumber[]): void {
    try {
      localStorage.setItem('rams3y_catalog_numbers_v3', JSON.stringify(numbers));
    } catch (e) {}
  }
}

export const numberService = new NumberService();
