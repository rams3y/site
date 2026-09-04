import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Smartphone, 
  X,
  Send,
  MessageCircle
} from 'lucide-react';
import { OperatorType } from '../types';
import { OPERATORS_META } from '../data/lifecellNumbers';

interface HeroBannerProps {
  selectedOperator: OperatorType;
  onSelectOperator: (op: OperatorType) => void;
  selectedCode: string;
  onSelectCode: (code: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalNumbersCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  selectedOperator,
  onSelectOperator,
  selectedCode,
  onSelectCode,
  searchQuery,
  onSearchChange,
  totalNumbersCount,
}) => {
  const [maskDigits, setMaskDigits] = useState<string[]>(['', '', '', '', '', '', '']);

  const handleMaskChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const newMask = [...maskDigits];
    newMask[index] = clean;
    setMaskDigits(newMask);

    // Auto advance focus
    if (clean && index < 6) {
      const nextInput = document.getElementById(`mask-digit-${index + 1}`);
      nextInput?.focus();
    }

    // Build combined search
    const filledDigits = newMask.filter(d => d !== '').join('');
    if (filledDigits) {
      onSearchChange(filledDigits);
    }
  };

  const handleMaskKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !maskDigits[index] && index > 0) {
      const prevInput = document.getElementById(`mask-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const clearMask = () => {
    setMaskDigits(['', '', '', '', '', '', '']);
    onSearchChange('');
  };

  // Get active codes based on selected operator
  const currentOperatorMeta = OPERATORS_META.find(o => o.id === selectedOperator);
  const activeCodes = currentOperatorMeta ? ['all', ...currentOperatorMeta.codes] : ['all'];

  return (
    <div className="relative overflow-hidden bg-[#0a0a0b] border-b border-[#222225] py-8 sm:py-12">
      {/* Background glow highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Каталог ексклюзивних номерів Київстар, Vodafone, Lifecell ({totalNumbersCount.toLocaleString()} в наявності)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Rams3y <span className="text-blue-400">Number</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Преміальні, золоті, платинові та красиві номери <strong className="text-sky-400">Київстар</strong>, <strong className="text-red-400">Vodafone</strong>, <strong className="text-amber-400">Lifecell</strong>. Всі сім-картки фізичні, швидка відправка Новою Поштою по всій Україні, офіційна оплата на ФОП.
          </p>

          {/* Quick contact banner */}
          <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
            <a 
              href="https://t.me/lil_rams3y" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Замовити в Telegram: @lil_rams3y</span>
            </a>
            <a 
              href="viber://chat?number=%2B380638637717" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161618] hover:bg-[#1a1a1c] text-purple-400 border border-[#2a2a2c] font-bold text-xs transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Viber: 063 863 77 17</span>
            </a>
          </div>
        </div>

        {/* Interactive Search & Filter Box */}
        <div className="mt-8 max-w-3xl mx-auto bg-[#111113] border border-[#222225] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/80 backdrop-blur-xl space-y-4">
          
          {/* Operator Switcher Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Оберіть оператора:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {OPERATORS_META.map((op) => {
                const isSelected = selectedOperator === op.id;
                let activeBtnClass = 'bg-blue-500 text-white shadow-md shadow-blue-500/25 border-blue-400';
                if (op.id === 'kyivstar') activeBtnClass = 'bg-sky-500 text-white shadow-md shadow-sky-500/25 border-sky-400';
                if (op.id === 'vodafone') activeBtnClass = 'bg-red-600 text-white shadow-md shadow-red-500/25 border-red-400';
                if (op.id === 'lifecell') activeBtnClass = 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 border-amber-400';

                return (
                  <button
                    key={op.id}
                    id={`hero-op-btn-${op.id}`}
                    onClick={() => {
                      onSelectOperator(op.id);
                      onSelectCode('all');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? activeBtnClass
                        : 'bg-[#161618] hover:bg-[#1a1a1c] text-zinc-300 border-[#2a2a2c]'
                    }`}
                  >
                    <span>{op.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Switcher */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#222225]">
            <span className="text-xs font-semibold text-zinc-400">Код номера:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeCodes.map((code) => {
                const isSelected = selectedCode === code;
                return (
                  <button
                    key={code}
                    id={`hero-code-btn-${code}`}
                    onClick={() => onSelectCode(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                        : 'bg-[#1a1a1c] hover:bg-[#222225] text-zinc-300 border border-[#333336]'
                    }`}
                  >
                    {code === 'all' ? 'Всі коди' : `( ${code} )`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Text Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="hero-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Пошук за цифрами або типом (наприклад: 777, 0000, 714, золотий)..."
              className="w-full pl-11 pr-10 py-3 bg-[#161618] border border-[#2a2a2c] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono-num"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mask Search: Pick exact digit positions */}
          <div className="pt-2 border-t border-[#222225]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>Підбір за маскою останніх 7 цифр:</span>
              </span>
              {maskDigits.some(d => d !== '') && (
                <button
                  onClick={clearMask}
                  className="text-[11px] text-zinc-400 hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Очистити маску
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <div className="px-2.5 py-2 rounded-xl bg-[#161618] border border-[#2a2a2c] text-blue-400 font-mono-num font-bold text-xs sm:text-sm">
                +38 ({selectedCode === 'all' ? '0XX' : selectedCode})
              </div>

              {maskDigits.map((digit, idx) => (
                <React.Fragment key={idx}>
                  <input
                    id={`mask-digit-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleMaskChange(idx, e.target.value)}
                    onKeyDown={(e) => handleMaskKeyDown(idx, e)}
                    placeholder="X"
                    className={`w-8 h-10 sm:w-10 sm:h-11 text-center font-mono-num font-black text-sm sm:text-base rounded-xl border transition-all focus:outline-none focus:scale-105 ${
                      digit
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-[#161618] border-[#2a2a2c] text-zinc-400 hover:border-[#3a3a3c] focus:border-blue-500'
                    }`}
                  />
                  {(idx === 2 || idx === 4) && (
                    <span className="text-zinc-600 font-bold">-</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
