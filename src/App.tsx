import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Phone, Star, X, Sliders, Sparkles, TrendingUp, Crown } from 'lucide-react';
import { LifecellNumber, FilterState, NumberCategory, OperatorType, LifecellCode } from './types';
import { numberService } from './services/numberService';
import { CATEGORIES_META, ALL_CODES, getCodeOperator } from './data/lifecellNumbers';
import { AdminModal } from './components/AdminModal';

const App: React.FC = () => {
  const [numbers, setNumbers] = useState<LifecellNumber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminOpen, setAdminOpen] = useState<boolean>(false);
  const [selectedNumber, setSelectedNumber] = useState<LifecellNumber | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    operator: 'all', code: 'all', category: 'all',
    minPrice: 0, maxPrice: 100000, searchQuery: '', sortBy: 'popular',
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const unsub = numberService.subscribeToNumbers((fetched) => {
      setNumbers(fetched);
      numberService.saveLocalCache(fetched);
      setLoading(false);
    });
    try {
      const cached = localStorage.getItem('rams3y_catalog_numbers_v3');
      if (cached) { setNumbers(JSON.parse(cached)); setLoading(false); }
    } catch (e) {}
    return () => unsub();
  }, []);

  const handleNumbersUpdated = (updated: LifecellNumber[]) => setNumbers(updated);

  const filteredNumbers = useMemo(() => {
    let result = [...numbers];
    if (filters.operator !== 'all') result = result.filter(n => n.operator === filters.operator);
    if (filters.code !== 'all') result = result.filter(n => n.code === filters.code);
    if (filters.category !== 'all') result = result.filter(n => n.category === filters.category);
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().replace(/[\s\-()]/g, '');
      result = result.filter(n =>
        n.rawNumber.includes(q) ||
        n.formatted.toLowerCase().replace(/[\s\-()]/g, '').includes(q)
      );
    }
    result = result.filter(n => n.price >= filters.minPrice && n.price <= filters.maxPrice);
    switch (filters.sortBy) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'memorability': result.sort((a, b) => b.memorability - a.memorability); break;
      default: result.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }
    return result;
  }, [numbers, filters]);

  const getCategoryMeta = (cat: NumberCategory) =>
    CATEGORIES_META.find(c => c.id === cat) || CATEGORIES_META[0];
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Rams3y</h1>
              <p className="text-xs text-gray-400">Каталог красивих номерів</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
              <Filter className="w-5 h-5" />
            </button>
            <button onClick={() => setAdminOpen(true)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Пошук номера..."
              value={filters.searchQuery}
              onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {showFilters && (
          <div className="max-w-7xl mx-auto px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.operator}
                onChange={e => setFilters({ ...filters, operator: e.target.value as OperatorType })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Всі оператори</option>
                <option value="lifecell">Lifecell</option>
                <option value="vodafone">Vodafone</option>
                <option value="kyivstar">Kyivstar</option>
              </select>
              <select
                value={filters.code}
                onChange={e => setFilters({ ...filters, code: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Всі коди</option>
                {ALL_CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filters.category}
                onChange={e => setFilters({ ...filters, category: e.target.value as NumberCategory })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Всі категорії</option>
                {CATEGORIES_META.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <select
                value={filters.sortBy}
                onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="popular">Популярні</option>
                <option value="price_asc">Ціна ↑</option>
                <option value="price_desc">Ціна ↓</option>
                <option value="memorability">Запам'ятовуваність</option>
              </select>
            </div>
          </div>
        )}
      </header>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilters({ ...filters, category: 'all' })}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filters.category === 'all' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Всі
          </button>
          {CATEGORIES_META.map(c => (
            <button
              key={c.id}
              onClick={() => setFilters({ ...filters, category: c.id })}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filters.category === c.id ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {c.icon} {c.title}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="flex gap-4 text-sm text-gray-400">
          <span>Знайдено: <span className="text-white font-semibold">{filteredNumbers.length}</span></span>
          <span>Всього: <span className="text-white font-semibold">{numbers.length}</span></span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Завантаження бази номерів...</div>
          </div>
        ) : filteredNumbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Phone className="w-12 h-12 mb-4 opacity-50" />
            <p>Номерів не знайдено. Спробуйте змінити фільтри.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNumbers.map(item => {
              const catMeta = getCategoryMeta(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedNumber(item)}
                  className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-cyan-500/50 transition cursor-pointer overflow-hidden"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${catMeta.gradient} transition-opacity`} />
                  {item.badge && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    </div>
                  )}
                  <div className="text-3xl mb-2">{catMeta.icon}</div>
                  <div className="text-lg font-mono font-bold text-white mb-1">{item.formatted}</div>
                  <div className="text-xs text-gray-400 mb-3">{item.operatorName}</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Ціна</div>
                      <div className="text-xl font-bold text-cyan-400">{item.price} ₴</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${catMeta.gradient} text-white font-medium`}>
                      {catMeta.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      {selectedNumber && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedNumber(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-3xl mb-2">{getCategoryMeta(selectedNumber.category).icon}</div>
                <h2 className="text-2xl font-mono font-bold text-white">{selectedNumber.formatted}</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedNumber.operatorName}</p>
              </div>
              <button onClick={() => setSelectedNumber(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedNumber.patternType && (
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-500 mb-1">Патерн</div>
                <div className="text-sm text-gray-300">{selectedNumber.patternType}</div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs text-gray-500">Ціна</div>
                <div className="text-3xl font-bold text-cyan-400">{selectedNumber.price} ₴</div>
              </div>
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryMeta(selectedNumber.category).gradient} text-white font-medium`}>
                {selectedNumber.categoryName}
              </div>
            </div>

            <a
              href={`tel:+38${selectedNumber.rawNumber}`}
              className="block w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-xl text-center transition"
            >
              <Phone className="w-5 h-5 inline mr-2" /> Зателефонувати
            </a>
          </div>
        </div>
      )}

      <AdminModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        numbers={numbers}
        onNumbersUpdated={handleNumbersUpdated}
      />

      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        <p>Rams3y © 2026 — Каталог красивих номерів</p>
      </footer>
    </div>
  );
};

export default App;
