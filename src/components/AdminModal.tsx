import React, { useState, useMemo } from 'react';
import {
  X, Lock, Plus, Trash2, Edit3, Check, Search, Download, Upload,
  RotateCcw, Key, Sliders, Database, ArrowUpDown, Tag, AlertCircle,
  Save, Layers, Sparkles, Phone
} from 'lucide-react';
import { LifecellNumber, LifecellCode, NumberCategory, ServiceResult } from '../types';
import { numberService } from '../services/numberService';
import { CATEGORIES_META, formatPhoneNumber, getCodeOperator, ALL_CODES } from '../data/lifecellNumbers';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  numbers: LifecellNumber[];
  onNumbersUpdated: (updatedNumbers: LifecellNumber[]) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen, onClose, numbers, onNumbersUpdated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => numberService.isAdminLoggedIn());
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'bulk_price' | 'backup'>('list');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminCodeFilter, setAdminCodeFilter] = useState<'all' | LifecellCode>('all');
  const [adminCatFilter, setAdminCatFilter] = useState<'all' | NumberCategory>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<NumberCategory>('bronze');
  const [editBadge, setEditBadge] = useState<string>('');
  const [editFormatted, setEditFormatted] = useState<string>('');
  const [addCode, setAddCode] = useState<LifecellCode>('063');
  const [addDigits, setAddDigits] = useState<string>('');
  const [addPrice, setAddPrice] = useState<number>(1500);
  const [addCategory, setAddCategory] = useState<NumberCategory>('silver');
  const [addBadge, setAddBadge] = useState<string>('HIT');
  const [addPattern, setAddPattern] = useState<string>('');
  const [bulkMode, setBulkMode] = useState<'add_fixed' | 'subtract_fixed' | 'percent_add' | 'percent_subtract' | 'set_fixed'>('add_fixed');
  const [bulkValue, setBulkValue] = useState<number>(500);
  const [bulkTargetCat, setBulkTargetCat] = useState<'all' | NumberCategory>('all');
  const [bulkTargetCode, setBulkTargetCode] = useState<'all' | LifecellCode>('all');
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmNewPass, setConfirmNewPass] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const startEditing = (item: LifecellNumber) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditCategory(item.category);
    setEditBadge(item.badge || '');
    setEditFormatted(item.formatted);
  };

  const saveInlineEdit = async (item: LifecellNumber) => {
    const catMeta = CATEGORIES_META.find(c => c.id === editCategory);
    const updates: Partial<LifecellNumber> = {
      price: editPrice, category: editCategory,
      categoryName: catMeta ? catMeta.title : item.categoryName,
      badge: (editBadge as any) || undefined, formatted: editFormatted || item.formatted,
    };
    const res = await numberService.updateNumber(item.id, updates);
    if (res.success) {
      showToast(`Номер ${item.formatted} оновлено!`);
      setEditingId(null);
    } else {
      showToast(res.message || 'Помилка оновлення', 'error');
    }
  };

  const handleDeleteItem = async (item: LifecellNumber) => {
    if (!window.confirm(`Видалити номер ${item.formatted} (${item.price} ₴) з бази?`)) return;
    const res = await numberService.deleteNumber(item.id);
    if (res.success) showToast(`Номер ${item.formatted} видалено`);
    else showToast(res.message || 'Помилка видалення', 'error');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Видалити ${selectedIds.size} вибраних номерів з бази?`)) return;
    const idsArray: string[] = Array.from(selectedIds);
    const res = await numberService.bulkDelete(idsArray);
    if (res.success) { setSelectedIds(new Set()); showToast(`Успішно видалено ${idsArray.length} номерів`); }
    else showToast(res.message || 'Помилка масового видалення', 'error');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const selectAllCurrentPage = () => {
    setSelectedIds(prev => { const next = new Set(prev); paginatedList.forEach(item => next.add(item.id)); return next; });
  };
  const deselectAll = () => setSelectedIds(new Set());

  const handleDigitsChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 7);
    setAddDigits(clean);
    if (clean.length === 7) {
      const digits = clean.split('');
      const allSame = digits.every(d => d === digits[0]);
      if (allSame || clean === '0000007') { setAddCategory('vip'); setAddBadge('EXCLUSIVE'); setAddPattern(`Сім однакових цифр ${digits[0]}`); }
      else if (/(.)\1{4}/.test(clean)) { setAddCategory('platinum'); setAddBadge('TOP'); setAddPattern(`П'ять однакових цифр`); }
      else if (/(.)\1{3}/.test(clean)) { setAddCategory('gold'); setAddBadge('HOT'); setAddPattern(`Чотири однакові цифри`); }
      else if (clean.endsWith('0000') || clean.includes('0000')) { setAddCategory('thousands'); setAddBadge('HIT'); setAddPattern(`Круглий тисячник`); }
      else if ((clean[0] === clean[2] && clean[2] === clean[4] && clean[1] === clean[3] && clean[3] === clean[5]) || /(..)\1\1/.test(clean)) { setAddCategory('butterfly'); setAddBadge('HIT'); setAddPattern(`Ритмічні пари`); }
      else if (clean[0] === clean[6] && clean[1] === clean[5] && clean[2] === clean[4]) { setAddCategory('silver'); setAddBadge('TOP'); setAddPattern(`Дзеркальна комбінація`); }
    }
  };

  const handleAddNewNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addDigits.length !== 7) { showToast('Введіть рівно 7 цифр номера', 'error'); return; }
    const rawNumber = `${addCode}${addDigits}`;
    const formatted = formatPhoneNumber(addCode, addDigits);
    const catMeta = CATEGORIES_META.find(c => c.id === addCategory);
    const { operator, operatorName } = getCodeOperator(addCode);
    const newItem: Partial<LifecellNumber> = {
      rawNumber, formatted, code: addCode, operator, operatorName,
      category: addCategory, categoryName: catMeta ? catMeta.title : 'Срібло',
      price: addPrice, badge: (addBadge as any) || undefined,
      patternType: addPattern, memorability: 50, viewsCount: 0,
    };
    const res = await numberService.addNumber(newItem);
    if (res.success) { showToast(`Номер ${formatted} додано в базу!`); setAddDigits(''); setAddPattern(''); setAddPrice(1500); }
    else showToast(res.message || 'Помилка додавання', 'error');
  };

  const handleBulkPrice = async () => {
    const res = await numberService.bulkPriceAdjust({
      mode: bulkMode, value: bulkValue,
      category: bulkTargetCat === 'all' ? undefined : bulkTargetCat,
      code: bulkTargetCode === 'all' ? undefined : bulkTargetCode,
    });
    if (res.success) showToast(res.message || 'Ціни оновлено');
    else showToast(res.message || 'Помилка', 'error');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(numbers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rams3y-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('Експорт виконано');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const items = JSON.parse(text) as LifecellNumber[];
      const res = await numberService.bulkImport(items, true);
      if (res.success) showToast(`Імпортовано ${items.length} номерів`);
      else showToast(res.message || 'Помилка імпорту', 'error');
    } catch (err: any) { showToast('Помилка читання файлу', 'error'); }
  };

  const handleReset = async () => {
    if (!window.confirm('Видалити ВСІ номери з бази? Цю дію не можна скасувати!')) return;
    const res = await numberService.resetToDefault();
    if (res.success) showToast('Базу очищено');
    else showToast(res.message || 'Помилка', 'error');
  };

  if (!isOpen) return null;
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-cyan-400" /> Адмін-панель
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Пароль адміністратора</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Введіть пароль"
                autoFocus
              />
            </div>
            {authError && (
              <div className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {authLoading ? 'Перевірка...' : 'Увійти'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl mx-4 my-8 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" /> Адмін-панель
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{numbers.length} номерів у базі</span>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition">Вийти</button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="flex gap-1 p-3 border-b border-gray-700 flex-wrap">
          {[
            { id: 'list', label: 'Список номерів', icon: Database },
            { id: 'add', label: 'Додати номер', icon: Plus },
            { id: 'bulk_price', label: 'Масові ціни', icon: ArrowUpDown },
            { id: 'backup', label: 'Експорт / Імпорт', icon: Download },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {toastMessage && (
          <div className={`mx-4 mt-3 px-4 py-2 rounded-lg text-sm ${
            toastMessage.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'
          }`}>
            {toastMessage.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'list' && (
            <div>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Пошук номера..."
                    value={adminSearch}
                    onChange={e => setAdminSearch(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <select
                  value={adminCodeFilter}
                  onChange={e => setAdminCodeFilter(e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">Всі коди</option>
                  {ALL_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={adminCatFilter}
                  onChange={e => setAdminCatFilter(e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">Всі категорії</option>
                  {CATEGORIES_META.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button onClick={selectAllCurrentPage} className="text-xs text-cyan-400 hover:text-cyan-300">Виділити всі на сторінці</button>
                <button onClick={deselectAll} className="text-xs text-gray-400 hover:text-white">Скасувати</button>
                {selectedIds.size > 0 && (
                  <button onClick={handleBulkDelete} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Видалити ({selectedIds.size})
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left p-2"><input type="checkbox" onChange={e => e.target.checked ? selectAllCurrentPage() : deselectAll()} /></th>
                      <th className="text-left p-2">Номер</th>
                      <th className="text-left p-2">Оператор</th>
                      <th className="text-left p-2">Категорія</th>
                      <th className="text-right p-2">Ціна</th>
                      <th className="text-left p-2">Бейдж</th>
                      <th className="text-center p-2">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.map(item => (
                      <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-2"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                        <td className="p-2 text-white font-mono">
                          {editingId === item.id ? (
                            <input value={editFormatted} onChange={e => setEditFormatted(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white w-48" />
                          ) : item.formatted}
                        </td>
                        <td className="p-2 text-gray-300">{item.operatorName}</td>
                        <td className="p-2">
                          {editingId === item.id ? (
                            <select value={editCategory} onChange={e => setEditCategory(e.target.value as NumberCategory)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white">
                              {CATEGORIES_META.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                          ) : (
                            <span className="text-gray-300">{item.categoryName}</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {editingId === item.id ? (
                            <input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white w-24 text-right" />
                          ) : (
                            <span className="text-cyan-400 font-semibold">{item.price} ₴</span>
                          )}
                        </td>
                        <td className="p-2">
                          {editingId === item.id ? (
                            <input value={editBadge} onChange={e => setEditBadge(e.target.value)} placeholder="—" className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white w-20" />
                          ) : (
                            item.badge ? <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded">{item.badge}</span> : '—'
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-2">
                            {editingId === item.id ? (
                              <>
                                <button onClick={() => saveInlineEdit(item)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditing(item)} className="text-cyan-400 hover:text-cyan-300"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteItem(item)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-30">←</button>
                  <span className="text-gray-400 text-sm">Сторінка {page} з {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-30">→</button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'add' && (
            <form onSubmit={handleAddNewNumber} className="max-w-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Код оператора</label>
                  <select value={addCode} onChange={e => setAddCode(e.target.value as LifecellCode)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white">
                    {ALL_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">7 цифр номера</label>
                  <input type="text" value={addDigits} onChange={e => handleDigitsChange(e.target.value)} placeholder="1234567" maxLength={7} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Ціна (₴)</label>
                  <input type="number" value={addPrice} onChange={e => setAddPrice(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Категорія</label>
                  <select value={addCategory} onChange={e => setAddCategory(e.target.value as NumberCategory)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white">
                    {CATEGORIES_META.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Бейдж</label>
                  <input type="text" value={addBadge} onChange={e => setAddBadge(e.target.value)} placeholder="HIT, TOP, VIP..." className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Патерн (опис)</label>
                  <input type="text" value={addPattern} onChange={e => setAddPattern(e.target.value)} placeholder="Опис комбінації" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              {addDigits.length === 7 && (
                <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
                  Попередній перегляд: <span className="text-cyan-400 font-mono">{formatPhoneNumber(addCode, addDigits)}</span> — {addPrice} ₴
                </div>
              )}
              <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
                <Plus className="w-5 h-5" /> Додати в базу
              </button>
            </form>
          )}

          {activeTab === 'bulk_price' && (
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Режим зміни ціни</label>
                <select value={bulkMode} onChange={e => setBulkMode(e.target.value as any)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  <option value="add_fixed">Додати фіксовану суму (+₴)</option>
                  <option value="subtract_fixed">Відняти фіксовану суму (−₴)</option>
                  <option value="percent_add">Збільшити на %</option>
                  <option value="percent_subtract">Зменшити на %</option>
                  <option value="set_fixed">Встановити фіксовану ціну (₴)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Значення</label>
                <input type="number" value={bulkValue} onChange={e => setBulkValue(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Категорія (фільтр)</label>
                  <select value={bulkTargetCat} onChange={e => setBulkTargetCat(e.target.value as any)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white">
                    <option value="all">Всі категорії</option>
                    {CATEGORIES_META.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Код (фільтр)</label>
                  <select value={bulkTargetCode} onChange={e => setBulkTargetCode(e.target.value as any)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white">
                    <option value="all">Всі коди</option>
                    {ALL_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleBulkPrice} className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" /> Застосувати до всіх
              </button>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="max-w-2xl space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Експорт бази</h3>
                <p className="text-sm text-gray-400">Завантажити всі номери у JSON-файл</p>
                <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
                  <Download className="w-5 h-5" /> Експортувати JSON
                </button>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Імпорт бази</h3>
                <p className="text-sm text-gray-400">Замінити всі номери даними з JSON-файлу</p>
                <label className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer w-fit">
                  <Upload className="w-5 h-5" /> Вибрати файл
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
              <div className="space-y-3 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-red-400">Небезпечна зона</h3>
                <p className="text-sm text-gray-400">Видалити всі номери з бази</p>
                <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" /> Очистити базу
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
