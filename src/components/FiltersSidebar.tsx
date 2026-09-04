import React from 'react';
import { 
  RotateCcw, 
  SlidersHorizontal, 
  Check, 
  Smartphone, 
  Send, 
  MessageCircle 
} from 'lucide-react';
import { FilterState, OperatorType } from '../types';
import { OPERATORS_META } from '../data/lifecellNumbers';

interface FiltersSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
}) => {
  const handleOperatorSelect = (operator: OperatorType) => {
    onFilterChange({ ...filters, operator, code: 'all' });
  };

  const handleCodeSelect = (code: string) => {
    onFilterChange({ ...filters, code });
  };

  const handlePricePreset = (min: number, max: number) => {
    onFilterChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onFilterChange({ ...filters, sortBy });
  };

  // Get active codes for selected operator
  const currentOpMeta = OPERATORS_META.find(o => o.id === filters.operator);
  const availableCodes = currentOpMeta ? ['all', ...currentOpMeta.codes] : ['all'];

  return (
    <aside className="bg-[#111113] border border-[#222225] rounded-2xl p-5 space-y-6 sticky top-28">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <span>Фільтри каталогу</span>
        </div>
        <button
          id="reset-filters-btn"
          onClick={onResetFilters}
          className="text-xs text-zinc-400 hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Скинути</span>
        </button>
      </div>

      {/* Operator Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
          Оператор зв'язку:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {OPERATORS_META.map((op) => {
            const isSelected = filters.operator === op.id;
            return (
              <button
                key={op.id}
                id={`sidebar-op-${op.id}`}
                onClick={() => handleOperatorSelect(op.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                    : 'bg-[#161618] text-zinc-300 hover:bg-[#1a1a1c] border border-[#2a2a2c]'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{op.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
          Код номера:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
          {availableCodes.map((code) => {
            const isSelected = filters.code === code;
            return (
              <button
                key={code}
                id={`filter-code-${code}`}
                onClick={() => handleCodeSelect(code)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-[#161618] text-zinc-300 hover:bg-[#1a1a1c] border border-[#2a2a2c]'
                }`}
              >
                <span>{code === 'all' ? 'Всі коди' : code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Ціна (грн):
          </label>
          <span className="text-[11px] text-blue-400 font-mono-num font-bold">
            {filters.minPrice.toLocaleString()} ₴ — {filters.maxPrice >= 500000 ? 'Будь-яка' : `${filters.maxPrice.toLocaleString()} ₴`}
          </span>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-zinc-500 block mb-1">Від:</span>
            <div className="relative">
              <input
                id="filter-min-price"
                type="number"
                min={0}
                max={1000000}
                step={100}
                value={filters.minPrice}
                onChange={(e) => onFilterChange({ ...filters, minPrice: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-[#161618] border border-[#2a2a2c] rounded-lg text-xs font-mono-num text-white focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-zinc-500">₴</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block mb-1">До:</span>
            <div className="relative">
              <input
                id="filter-max-price"
                type="number"
                min={500}
                max={1000000}
                step={500}
                value={filters.maxPrice}
                onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) || 1000000 })}
                className="w-full px-2.5 py-1.5 bg-[#161618] border border-[#2a2a2c] rounded-lg text-xs font-mono-num text-white focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-zinc-500">₴</span>
            </div>
          </div>
        </div>

        {/* Quick price presets */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => handlePricePreset(0, 2000)}
            className="px-2 py-1.5 rounded-lg bg-[#161618] hover:bg-[#1a1a1c] border border-[#2a2a2c] text-[11px] font-medium text-zinc-300 text-center transition-colors cursor-pointer"
          >
            до 2 000 ₴
          </button>
          <button
            onClick={() => handlePricePreset(2000, 5000)}
            className="px-2 py-1.5 rounded-lg bg-[#161618] hover:bg-[#1a1a1c] border border-[#2a2a2c] text-[11px] font-medium text-zinc-300 text-center transition-colors cursor-pointer"
          >
            2 000 - 5 000 ₴
          </button>
          <button
            onClick={() => handlePricePreset(5000, 15000)}
            className="px-2 py-1.5 rounded-lg bg-[#161618] hover:bg-[#1a1a1c] border border-[#2a2a2c] text-[11px] font-medium text-zinc-300 text-center transition-colors cursor-pointer"
          >
            5 000 - 15 000 ₴
          </button>
          <button
            onClick={() => handlePricePreset(15000, 1000000)}
            className="px-2 py-1.5 rounded-lg bg-[#161618] hover:bg-[#1a1a1c] border border-[#2a2a2c] text-[11px] font-medium text-blue-400 text-center transition-colors cursor-pointer"
          >
            від 15 000 ₴+
          </button>
        </div>
      </div>

      {/* Sort By Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
          Сортування:
        </label>
        <select
          id="filter-sort-by"
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
          className="w-full px-3 py-2 bg-[#161618] border border-[#2a2a2c] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="popular">За популярністю</option>
          <option value="price_asc">Від дешевших до дорогих</option>
          <option value="price_desc">Від дорогих до дешевших</option>
          <option value="memorability">За легкістю запам'ятовування</option>
          <option value="newest">Нові надходження</option>
        </select>
      </div>

      {/* Info Card in Sidebar */}
      <div className="bg-[#161618]/60 border border-[#2a2a2c] rounded-xl p-3.5 space-y-2.5 text-xs text-zinc-400">
        <div className="flex items-center gap-2 text-white font-bold">
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>Підібрати під замовлення</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Потрібна індивідуальна дата народження, автономер або корпоративна серія номерів?
        </p>
        <a
          href="https://t.me/lil_rams3y"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Написати менеджеру</span>
        </a>
      </div>
    </aside>
  );
};
