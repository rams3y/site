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
      console.error('Firestore get
