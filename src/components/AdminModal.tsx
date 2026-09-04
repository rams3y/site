import React, { useState, useMemo } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Download, 
  Upload, 
  RotateCcw, 
  Key, 
  Sliders, 
  Database,
  ArrowUpDown,
  Tag,
  AlertCircle,
  Save,
  Layers,
  Sparkles,
  Phone
} from 'lucide-react';
import { LifecellNumber, LifecellCode, NumberCategory } from '../types';
import { numberService } from '../services/numberService';
import { CATEGORIES_META, formatPhoneNumber } from '../data/lifecellNumbers';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  numbers: LifecellNumber[];
  onNumbersUpdated: (updatedNumbers: LifecellNumber[]) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  numbers,
  onNumbersUpdated,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => numberService.isAdminLoggedIn());
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Active tab: 'list' | 'add' | 'bulk_price' | 'backup'
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'bulk_price' | 'backup'>('list');

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ---------------- LIST TAB STATE ----------------
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminCodeFilter, setAdminCodeFilter] = useState<'all' | LifecellCode>('all');
  const [adminCatFilter, setAdminCatFilter] = useState<'all' | NumberCategory>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  // Inline editing item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<NumberCategory>('bronze');
  const [editBadge, setEditBadge] = useState<string>('');
  const [editFormatted, setEditFormatted] = useState<string>('');

  // ---------------- ADD FORM STATE ----------------
  const [addCode, setAddCode] = useState<LifecellCode>('063');
  const [addDigits, setAddDigits] = useState<string>(''); // 7 digits
  const [addPrice, setAddPrice] = useState<number>(1500);
  const [addCategory, setAddCategory] = useState<NumberCategory>('silver');
  const [addBadge, setAddBadge] = useState<string>('HIT');
  const [addPattern, setAddPattern] = useState<string>('');

  // ---------------- BULK PRICE STATE ----------------
  const [bulkMode, setBulkMode] = useState<'add_fixed' | 'subtract_fixed' | 'percent_add' | 'percent_subtract' | 'set_fixed'>('add_fixed');
  const [bulkValue, setBulkValue] = useState<number>(500);
  const [bulkTargetCat, setBulkTargetCat] = useState<'all' | NumberCategory>('all');
  const [bulkTargetCode, setBulkTargetCode] = useState<'all' | LifecellCode>('all');

  // ---------------- PASSWORD CHANGE STATE ----------------
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmNewPass, setConfirmNewPass] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await numberService.verifyAdmin(passwordInput);
      if (res.success) {
        setIsAuthenticated(true);
        setPasswordInput('');
        showToast('Успішний вхід в панель адміністратора!');
      } else {
        setAuthError(res.message || 'Невірний пароль');
      }
    } catch (err: any) {
      setAuthError('Помилка сервера при перевірці');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    numberService.logoutAdmin();
    setIsAuthenticated(false);
    showToast('Вихід виконано');
  };

  // Filtered numbers in list view
  const filteredList = useMemo(() => {
    return numbers.filter((item) => {
      if (adminCodeFilter !== 'all' && item.code !== adminCodeFilter) return false;
      if (adminCatFilter !== 'all' && item.category !== adminCatFilter) return false;
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase().replace(/[\s\-()]/g, '');
        const raw = item.rawNumber.toLowerCase();
        const fmt = item.formatted.toLowerCase().replace(/[\s\-()]/g, '');
        if (!raw.includes(q) && !fmt.includes(q)) return false;
      }
      return true;
    });
  }, [numbers, adminCodeFilter, adminCatFilter, adminSearch]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  // Handle inline edit start
  const startEditing = (item: LifecellNumber) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditCategory(item.category);
    setEditBadge(item.badge || '');
    setEditFormatted(item.formatted);
  };

  // Handle inline edit save
  const saveInlineEdit = async (item: LifecellNumber) => {
    const catMeta = CATEGORIES_META.find(c => c.id === editCategory);
    const updates: Partial<LifecellNumber> = {
      price: editPrice,
      category: editCategory,
      categoryName: catMeta ? catMeta.title : item.categoryName,
      badge: (editBadge as any) || undefined,
      formatted: editFormatted || item.formatted,
    };

    const res = await numberService.updateNumber(item.id, updates);
    if (res.success) {
      const updatedAll = numbers.map(n => n.id === item.id ? { ...n, ...updates } : n);
      onNumbersUpdated(updatedAll);
      numberService.saveLocalCache(updatedAll);
      setEditingId(null);
      showToast(`Номер ${item.formatted} оновлено!`);
    } else {
      showToast(res.message || 'Помилка оновлення', 'error');
    }
  };

  // Delete single item
  const handleDeleteItem = async (item: LifecellNumber) => {
    if (!window.confirm(`Видалити номер ${item.formatted} (${item.price} ₴) з бази?`)) return;

    const res = await numberService.deleteNumber(item.id);
    if (res.success) {
      const updatedAll = numbers.filter(n => n.id !== item.id);
      onNumbersUpdated(updatedAll);
      numberService.saveLocalCache(updatedAll);
      showToast(`Номер ${item.formatted} видалено`);
    } else {
      showToast(res.message || 'Помилка видалення', 'error');
    }
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Видалити ${selectedIds.size} вибраних номерів з бази?`)) return;

    const idsArray: string[] = Array.from(selectedIds);
    const res = await numberService.bulkDelete(idsArray);
    if (res.success) {
      const updatedAll = numbers.filter(n => !selectedIds.has(n.id));
      onNumbersUpdated(updatedAll);
      numberService.saveLocalCache(updatedAll);
      setSelectedIds(new Set());
      showToast(`Успішно видалено ${idsArray.length} номерів`);
    } else {
      showToast(res.message || 'Помилка масового видалення', 'error');
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllCurrentPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      paginatedList.forEach(item => next.add(item.id));
      return next;
    });
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Auto classify on typing 7 digits
  const handleDigitsChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 7);
    setAddDigits(clean);
    
    // Auto guess category & pattern if 7 digits
    if (clean.length === 7) {
      const digits = clean.split('');
      const allSame = digits.every(d => d === digits[0]);
      if (allSame || clean === '0000007') {
        setAddCategory('vip');
        setAddBadge('EXCLUSIVE');
        setAddPattern(`Сім однакових цифр ${digits[0]}`);
      } else if (/(.)\1{4}/.test(clean)) {
        setAddCategory('platinum');
        setAddBadge('TOP');
        setAddPattern(`П'ять однакових цифр`);
      } else if (/(.)\1{3}/.test(clean)) {
        setAddCategory('gold');
        setAddBadge('HOT');
        setAddPattern(`Чотири однакові цифри`);
      } else if (clean.endsWith('0000') || clean.includes('0000')) {
        setAddCategory('thousands');
        setAddBadge('HIT');
        setAddPattern(`Круглий тисячник`);
      } else if ((clean[0] === clean[2] && clean[2] === clean[4] && clean[1] === clean[3] && clean[3] === clean[5]) || /(..)\1\1/.test(clean)) {
        setAddCategory('butterfly');
        setAddBadge('HIT');
        setAddPattern(`Ритмічні пари`);
      } else if (clean[0] === clean[6] && clean[1] === clean[5] && clean[2] === clean[4]) {
        setAddCategory('silver');
        setAddBadge('TOP');
        setAddPattern(`Дзеркальна комбінація`);
      }
    }
  };

  // Add new number submit
  const handleAddNewNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addDigits.length !== 7) {
      showToast('Введіть рівно 7 цифр номера', 'error');
      return;
    }

    const rawNumber = `${addCode}${addDigits}`;
    const formatted = formatPhoneNumber(addCode, addDigits);
    const catMeta = CATEGORIES_META.find(c => c.id === addCategory);

    let op: 'kyivstar' | 'vodafone' | 'lifecell' = 'lifecell';
    let opName = 'Lifecell';
    if (['067', '068', '096', '097', '098', '077'].includes(addCode)) {
      op = 'kyivstar';
      opName = 'Київстар';
    } else if (['050', '066', '095', '099', '075'].includes(addCode)) {
      op = 'vodafone';
      opName = 'Vodafone';
    }

    const newItem: Partial<LifecellNumber> = {
      rawNumber,
      formatted,
      code: addCode,
      operator: op,
      operatorName: opName,
      category: addCategory,
      categoryName: catMeta ? catMeta.title : 'Красивий номер',
      price: Number(addPrice) || 1000,
      badge: (addBadge as any) || undefined,
      patternType: addPattern || `Номер: ${formatted}`,
      memorability: 8,
      viewsCount: 150,
    };

    const res = await numberService.addNumber(newItem);
    if (res.success && res.item) {
      const updatedAll = [res.item, ...numbers];
      onNumbersUpdated(updatedAll);
      numberService.saveLocalCache(updatedAll);
      setAddDigits('');
      setAddPattern('');
      showToast(`Номер ${formatted} успішно додано в каталог!`);
      setActiveTab('list');
    } else {
      showToast(res.message || 'Помилка додавання номера', 'error');
    }
  };

  // Bulk Price Submit
  const handleBulkPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(bulkValue) || bulkValue === 0) {
      showToast('Введіть коректне значення зміни', 'error');
      return;
    }

    const res = await numberService.bulkPriceAdjust({
      mode: bulkMode,
      value: bulkValue,
      category: bulkTargetCat !== 'all' ? bulkTargetCat : undefined,
      code: bulkTargetCode !== 'all' ? bulkTargetCode : undefined,
    });

    if (res.success) {
      // Reload all numbers
      const refreshed = await numberService.getAllNumbers();
      onNumbersUpdated(refreshed);
      showToast(res.message || 'Ціни оновлено!');
    } else {
      showToast(res.message || 'Помилка оновлення цін', 'error');
    }
  };

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(numbers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rams3y_catalog_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Завантажено резервну копію (${numbers.length} номерів)`);
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && json.length > 0 && json[0].rawNumber) {
          if (window.confirm(`Імпортувати ${json.length} номерів? Це замінить поточну базу.`)) {
            const res = await numberService.bulkImport(json, true);
            if (res.success) {
              onNumbersUpdated(json);
              numberService.saveLocalCache(json);
              showToast(`Успішно імпортовано ${json.length} номерів!`);
            } else {
              showToast(res.message || 'Помилка збереження на сервері', 'error');
            }
          }
        } else {
          showToast('Невірний формат файлу JSON. Очікується масив номерів.', 'error');
        }
      } catch (err) {
        showToast('Помилка парсингу JSON файлу', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to default
  const handleResetCatalog = async () => {
    if (!window.confirm('Ви впевнені, що хочете скинути каталог до початкової бази? Усі ваші додані зміни буде скасовано.')) {
      return;
    }
    const res = await numberService.resetToDefault();
    if (res.success) {
      const refreshed = await numberService.getAllNumbers();
      onNumbersUpdated(refreshed);
      showToast('Базу скинуто до початкової!');
    } else {
      showToast(res.message || 'Помилка скидання', 'error');
    }
  };

  // Change password submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmNewPass) {
      showToast('Нові паролі не співпадають', 'error');
      return;
    }
    if (newPass.length < 4) {
      showToast('Пароль має бути від 4 символів', 'error');
      return;
    }

    const res = await numberService.changePassword(currentPass, newPass);
    if (res.success) {
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
      showToast('Пароль адміністратора успішно оновлено!');
    } else {
      showToast(res.message || 'Помилка зміни пароля', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        id="admin-panel-container"
        className="bg-[#121214] border border-[#2d2d32] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#252529] flex items-center justify-between bg-[#161619]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">Адмін-панель Rams3y Number</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono-num text-[11px] font-bold border border-blue-500/30">
                  {numbers.length} номерів
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Керування базою на сервері (локальний JSON файл)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2c2c32] text-xs font-semibold text-zinc-300 border border-[#333338] transition-colors"
              >
                Вийти
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#222226] hover:bg-[#2c2c32] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800/40' 
              : 'bg-red-950/80 text-red-300 border-b border-red-800/40'
          }`}>
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Not Authenticated: Login View */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Вхід для власника</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Введіть пароль адміністратора для доступу до додавання, видалення та зміни цін номерів.
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div>
                <div className="relative">
                  <input
                    id="admin-password-input"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Пароль"
                    className="w-full px-4 py-3 bg-[#18181c] border border-[#333339] rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    autoFocus
                  />
                  {!passwordInput && (
                    <button
                      type="button"
                      onClick={() => setPasswordInput('R4m$ey#2026_xK9@vQ7!Wz')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      
                    </button>
                  )}
                </div>
                {authError && (
                  <p className="text-red-400 text-xs text-left mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
                <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between px-1">
                  <span>Пароль за замовчуванням:</span>
                  <code className="bg-[#242429] px-1.5 py-0.5 rounded text-zinc-300 font-mono">rams3y2026</code>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading || !passwordInput}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Увійти в адмінку</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 px-6 border-b border-[#252529] bg-[#141417] overflow-x-auto">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'list' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Каталог & Редагування ({numbers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'add' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати новий номер</span>
              </button>

              <button
                onClick={() => setActiveTab('bulk_price')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'bulk_price' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Масова зміна цін</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'backup' 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Резервні копії & Пароль</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0f0f11]">
              {/* TAB 1: LIST & EDIT */}
              {activeTab === 'list' && (
                <div className="space-y-4">
                  {/* Filter & Search Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#151518] p-3 rounded-xl border border-[#27272b]">
                    <div className="sm:col-span-2 relative">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Пошук за номером (063..., 777...)"
                        value={adminSearch}
                        onChange={(e) => { setAdminSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-3 py-1.5 bg-[#1c1c20] border border-[#303036] rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                      <div>
                        <select
                          value={adminCodeFilter}
                          onChange={(e) => { setAdminCodeFilter(e.target.value as any); setPage(1); }}
                          className="w-full px-3 py-1.5 bg-[#1c1c20] border border-[#303036] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        >
                          <option value="all">Всі коди (Київстар, VF, Life)</option>
                          <optgroup label="Київстар">
                            <option value="067">067 (Київстар)</option>
                            <option value="068">068 (Київстар)</option>
                            <option value="096">096 (Київстар)</option>
                            <option value="097">097 (Київстар)</option>
                            <option value="098">098 (Київстар)</option>
                            <option value="077">077 (Київстар)</option>
                          </optgroup>
                          <optgroup label="Vodafone">
                            <option value="050">050 (Vodafone)</option>
                            <option value="066">066 (Vodafone)</option>
                            <option value="095">095 (Vodafone)</option>
                            <option value="099">099 (Vodafone)</option>
                            <option value="075">075 (Vodafone)</option>
                          </optgroup>
                          <optgroup label="Lifecell">
                            <option value="063">063 (Lifecell)</option>
                            <option value="073">073 (Lifecell)</option>
                            <option value="093">093 (Lifecell)</option>
                          </optgroup>
                        </select>
                      </div>

                    <div>
                      <select
                        value={adminCatFilter}
                        onChange={(e) => { setAdminCatFilter(e.target.value as any); setPage(1); }}
                        className="w-full px-3 py-1.5 bg-[#1c1c20] border border-[#303036] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">Всі категорії</option>
                        {CATEGORIES_META.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bulk Actions Toolbar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllCurrentPage}
                        className="px-2.5 py-1 bg-[#1a1a1d] hover:bg-[#242428] border border-[#2f2f35] rounded-md text-zinc-300 font-medium text-[11px]"
                      >
                        Вибрати всі на сторінці
                      </button>
                      {selectedIds.size > 0 && (
                        <>
                          <button
                            onClick={deselectAll}
                            className="px-2.5 py-1 bg-[#1a1a1d] hover:bg-[#242428] border border-[#2f2f35] rounded-md text-zinc-400 text-[11px]"
                          >
                            Зняти вибір ({selectedIds.size})
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-md text-red-300 font-bold text-[11px] flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Видалити вибрані ({selectedIds.size})
                          </button>
                        </>
                      )}
                    </div>

                    <div className="text-zinc-400 font-mono-num text-[11px]">
                      Знайдено: <strong className="text-white">{filteredList.length}</strong> з {numbers.length}
                    </div>
                  </div>

                  {/* Table of numbers */}
                  <div className="border border-[#252529] rounded-xl overflow-hidden bg-[#131316]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#18181c] border-b border-[#28282e] text-zinc-400 font-semibold text-[11px]">
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3">Форматований номер</th>
                            <th className="p-3">Код</th>
                            <th className="p-3">Категорія</th>
                            <th className="p-3">Ціна (грн)</th>
                            <th className="p-3">Бейдж</th>
                            <th className="p-3 text-right">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f1f24]">
                          {paginatedList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-zinc-500">
                                Номерів не знайдено за поточними фільтрами
                              </td>
                            </tr>
                          ) : (
                            paginatedList.map((item, idx) => {
                              const isSelected = selectedIds.has(item.id);
                              const isEditing = editingId === item.id;

                              return (
                                <tr 
                                  key={item.id}
                                  className={`hover:bg-[#1a1a1e] transition-colors ${
                                    isSelected ? 'bg-blue-950/20' : ''
                                  }`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelect(item.id)}
                                      className="rounded bg-[#202024] border-[#383840] text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                  </td>

                                  <td className="p-3 font-mono-num font-bold text-white">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editFormatted}
                                        onChange={(e) => setEditFormatted(e.target.value)}
                                        className="px-2 py-1 bg-[#1e1e24] border border-blue-500 rounded text-xs text-white font-mono"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span>{item.formatted}</span>
                                        <span className="text-[10px] text-zinc-500 font-normal">({item.rawNumber})</span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-[#1e1e24] border border-[#303036] font-mono text-zinc-300 text-[11px] font-bold">
                                      {item.code}
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    {isEditing ? (
                                      <select
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value as any)}
                                        className="px-2 py-1 bg-[#1e1e24] border border-blue-500 rounded text-xs text-white"
                                      >
                                        {CATEGORIES_META.filter(c => c.id !== 'all').map(c => (
                                          <option key={c.id} value={c.id}>{c.shortTitle}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-zinc-300 font-medium text-[11px]">
                                        {item.categoryName || item.category}
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-3 font-mono-num">
                                    {isEditing ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={editPrice}
                                          onChange={(e) => setEditPrice(Number(e.target.value))}
                                          className="w-24 px-2 py-1 bg-[#1e1e24] border border-blue-500 rounded text-xs text-blue-400 font-bold font-mono"
                                        />
                                        <span className="text-zinc-500">₴</span>
                                      </div>
                                    ) : (
                                      <span className="font-extrabold text-blue-400 text-sm">
                                        {item.price.toLocaleString()} ₴
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    {isEditing ? (
                                      <select
                                        value={editBadge}
                                        onChange={(e) => setEditBadge(e.target.value)}
                                        className="px-2 py-1 bg-[#1e1e24] border border-blue-500 rounded text-xs text-white"
                                      >
                                        <option value="">Без бейджа</option>
                                        <option value="EXCLUSIVE">EXCLUSIVE</option>
                                        <option value="TOP">TOP</option>
                                        <option value="HOT">HOT</option>
                                        <option value="HIT">HIT</option>
                                        <option value="NEW">NEW</option>
                                        <option value="DISCOUNT">DISCOUNT</option>
                                      </select>
                                    ) : (
                                      item.badge ? (
                                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold">
                                          {item.badge}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-600">—</span>
                                      )
                                    )}
                                  </td>

                                  <td className="p-3 text-right">
                                    {isEditing ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => saveInlineEdit(item)}
                                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                                          title="Зберегти"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setEditingId(null)}
                                          className="p-1.5 rounded-lg bg-[#27272d] hover:bg-[#32323a] text-zinc-400 hover:text-white"
                                          title="Скасувати"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => startEditing(item)}
                                          className="p-1.5 rounded-lg hover:bg-[#25252c] text-zinc-400 hover:text-blue-400 transition-colors"
                                          title="Редагувати ціну / дані"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(item)}
                                          className="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors"
                                          title="Видалити номер"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="p-3 bg-[#161619] border-t border-[#252529] flex items-center justify-between text-xs">
                        <div className="text-zinc-400">
                          Сторінка <strong className="text-white">{page}</strong> з {totalPages}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded bg-[#202024] hover:bg-[#2a2a30] disabled:opacity-40 text-zinc-200"
                          >
                            Назад
                          </button>
                          <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded bg-[#202024] hover:bg-[#2a2a30] disabled:opacity-40 text-zinc-200"
                          >
                            Вперед
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ADD NEW NUMBER */}
              {activeTab === 'add' && (
                <div className="max-w-2xl mx-auto bg-[#141417] p-6 rounded-2xl border border-[#27272c] space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#252529]">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Додавання нового номера в каталог</h3>
                      <p className="text-xs text-zinc-400">Номер миттєво з'явиться на сайті та збережеться у базі на сервері</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddNewNumber} className="space-y-4">
                    {/* Code and 7 digits */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Код оператора
                        </label>
                        <select
                          value={addCode}
                          onChange={(e) => setAddCode(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm font-bold text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                        >
                          <optgroup label="Київстар">
                            <option value="067">067 (Київстар)</option>
                            <option value="068">068 (Київстар)</option>
                            <option value="096">096 (Київстар)</option>
                            <option value="097">097 (Київстар)</option>
                            <option value="098">098 (Київстар)</option>
                            <option value="077">077 (Київстар)</option>
                          </optgroup>
                          <optgroup label="Vodafone">
                            <option value="050">050 (Vodafone)</option>
                            <option value="066">066 (Vodafone)</option>
                            <option value="095">095 (Vodafone)</option>
                            <option value="099">099 (Vodafone)</option>
                            <option value="075">075 (Vodafone)</option>
                          </optgroup>
                          <optgroup label="Lifecell">
                            <option value="063">063 (Lifecell)</option>
                            <option value="073">073 (Lifecell)</option>
                            <option value="093">093 (Lifecell)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          7 цифр номера
                        </label>
                        <input
                          type="text"
                          maxLength={7}
                          value={addDigits}
                          onChange={(e) => handleDigitsChange(e.target.value)}
                          placeholder="Наприклад: 7771122"
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm font-bold text-white font-mono focus:outline-none focus:border-blue-500 tracking-wider"
                          required
                        />
                      </div>
                    </div>

                    {/* Preview box */}
                    {addDigits.length === 7 && (
                      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Попередній вигляд:</span>
                          <span className="text-lg font-black text-white font-mono-num">
                            +38 ({formatPhoneNumber(addCode, addDigits)})
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                          {CATEGORIES_META.find(c => c.id === addCategory)?.shortTitle}
                        </span>
                      </div>
                    )}

                    {/* Price and Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Ціна для продажу (грн)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={100}
                            step={50}
                            value={addPrice}
                            onChange={(e) => setAddPrice(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm font-bold text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                            required
                          />
                          <span className="absolute right-3.5 top-2.5 text-zinc-500 font-bold text-xs">₴</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Категорія
                        </label>
                        <select
                          value={addCategory}
                          onChange={(e) => setAddCategory(e.target.value as NumberCategory)}
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        >
                          {CATEGORIES_META.filter(c => c.id !== 'all').map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Badge and Pattern Note */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Маркетинговий бейдж
                        </label>
                        <select
                          value={addBadge}
                          onChange={(e) => setAddBadge(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Без бейджа</option>
                          <option value="EXCLUSIVE">EXCLUSIVE (Ексклюзив)</option>
                          <option value="TOP">TOP (Топ)</option>
                          <option value="HOT">HOT (Гаряча ціна)</option>
                          <option value="HIT">HIT (Хіт продажів)</option>
                          <option value="NEW">NEW (Новинка)</option>
                          <option value="DISCOUNT">DISCOUNT (Вигідний)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Опис комбінації / паттерн
                        </label>
                        <input
                          type="text"
                          value={addPattern}
                          onChange={(e) => setAddPattern(e.target.value)}
                          placeholder="Наприклад: Дзеркало 77-11-22"
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={addDigits.length !== 7}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Додати номер у каталог</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: BULK PRICE ADJUSTMENT */}
              {activeTab === 'bulk_price' && (
                <div className="max-w-2xl mx-auto bg-[#141417] p-6 rounded-2xl border border-[#27272c] space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#252529]">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Інструмент масової зміни цін</h3>
                      <p className="text-xs text-zinc-400">Швидка націнка або знижка для всього каталогу чи окремих категорій</p>
                    </div>
                  </div>

                  <form onSubmit={handleBulkPriceSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Тип операції
                      </label>
                      <select
                        value={bulkMode}
                        onChange={(e) => setBulkMode(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="add_fixed">+ Додати фіксовану суму (грн) до кожного номера</option>
                        <option value="subtract_fixed">- Відняти фіксовану суму (грн) від кожного номера</option>
                        <option value="percent_add">+ Збільшити на відсоток (%)</option>
                        <option value="percent_subtract">- Зменшити на відсоток (%)</option>
                        <option value="set_fixed">Встановити точну фіксовану ціну (грн)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Значення {bulkMode.includes('percent') ? '(у відсотках %)' : '(у гривнях ₴)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={bulkValue}
                        onChange={(e) => setBulkValue(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-sm font-bold text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Цільова категорія
                        </label>
                        <select
                          value={bulkTargetCat}
                          onChange={(e) => setBulkTargetCat(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="all">Усі категорії</option>
                          {CATEGORIES_META.filter(c => c.id !== 'all').map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Цільовий код
                        </label>
                        <select
                          value={bulkTargetCode}
                          onChange={(e) => setBulkTargetCode(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                        >
                          <option value="all">Усі коди (Київстар, VF, Life)</option>
                          <optgroup label="Київстар">
                            <option value="067">067 (Київстар)</option>
                            <option value="068">068 (Київстар)</option>
                            <option value="096">096 (Київстар)</option>
                            <option value="097">097 (Київстар)</option>
                            <option value="098">098 (Київстар)</option>
                            <option value="077">077 (Київстар)</option>
                          </optgroup>
                          <optgroup label="Vodafone">
                            <option value="050">050 (Vodafone)</option>
                            <option value="066">066 (Vodafone)</option>
                            <option value="095">095 (Vodafone)</option>
                            <option value="099">099 (Vodafone)</option>
                            <option value="075">075 (Vodafone)</option>
                          </optgroup>
                          <optgroup label="Lifecell">
                            <option value="063">063 (Lifecell)</option>
                            <option value="073">073 (Lifecell)</option>
                            <option value="093">093 (Lifecell)</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>Застосувати зміну цін</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: BACKUP & SETTINGS */}
              {activeTab === 'backup' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Backup Box */}
                  <div className="bg-[#141417] p-6 rounded-2xl border border-[#27272c] space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#252529]">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Save className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Резервні копії бази (JSON)</h3>
                        <p className="text-xs text-zinc-400">Збереження повної копії номерів на комп'ютер чи телефон</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleExportJSON}
                        className="p-4 rounded-xl bg-[#1a1a1e] hover:bg-[#222228] border border-[#2d2d34] flex flex-col items-start gap-2 text-left group transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Експорт бази (.json)</span>
                          <span className="text-[11px] text-zinc-400">Завантажити поточний файл бази</span>
                        </div>
                      </button>

                      <label className="p-4 rounded-xl bg-[#1a1a1e] hover:bg-[#222228] border border-[#2d2d34] flex flex-col items-start gap-2 text-left group transition-all cursor-pointer">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportJSON}
                          className="hidden"
                        />
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Імпорт бази (.json)</span>
                          <span className="text-[11px] text-zinc-400">Відновити з файлу резервної копії</span>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleResetCatalog}
                        className="w-full py-2.5 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-800/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Скинути каталог до початкової бази (1 936 номерів)</span>
                      </button>
                    </div>
                  </div>

                  {/* Change Password Box */}
                  <div className="bg-[#141417] p-6 rounded-2xl border border-[#27272c] space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#252529]">
                      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Зміна пароля адміністратора</h3>
                        <p className="text-xs text-zinc-400">Встановіть новий секретний пароль для входу</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                          Поточний пароль:
                        </label>
                        <input
                          type="password"
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          placeholder="Поточний пароль"
                          className="w-full px-3 py-2 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                            Новий пароль:
                          </label>
                          <input
                            type="password"
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            placeholder="Новий пароль (мін. 4 симв.)"
                            className="w-full px-3 py-2 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                            Повторіть новий пароль:
                          </label>
                          <input
                            type="password"
                            value={confirmNewPass}
                            onChange={(e) => setConfirmNewPass(e.target.value)}
                            placeholder="Повторіть пароль"
                            className="w-full px-3 py-2 bg-[#1a1a1e] border border-[#33333a] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-5 bg-[#25252b] hover:bg-[#303038] text-white text-xs font-bold rounded-xl border border-[#3a3a44] transition-colors cursor-pointer"
                      >
                        Оновити пароль
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
