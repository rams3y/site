import React, { useState } from 'react';
import { 
  Grid3X3, 
  List, 
  SearchX, 
  ChevronLeft, 
  ChevronRight,
  Send,
  Sparkles
} from 'lucide-react';
import { LifecellNumber } from '../types';
import { NumberCard } from './NumberCard';

interface NumberGridProps {
  numbers: LifecellNumber[];
  onCopyNumber: (formatted: string) => void;
  onResetFilters: () => void;
}

export const NumberGrid: React.FC<NumberGridProps> = ({
  numbers,
  onCopyNumber,
  onResetFilters,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const itemsPerPage = 18;

  const totalPages = Math.ceil(numbers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentNumbers = numbers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when numbers length change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [numbers.length]);

  return (
    <section className="space-y-6">
      {/* Top controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111113] border border-[#222225] p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-white">
            Каталог номерів Rams3y Number
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono-num text-xs font-bold border border-blue-500/20">
            {numbers.length} доступно
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#161618] p-1 rounded-xl border border-[#2a2a2c]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Сітка карток"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden md:inline">Картки</span>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'compact'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Компактний список"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Список</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {numbers.length === 0 ? (
        <div className="bg-[#111113] border border-[#222225] rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">За вашим фільтром номерів не знайдено</h3>
          <p className="text-sm text-zinc-400">
            Спробуйте скинути фільтри або напишіть у Telegram для індивідуального підбору будь-якого номера.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onResetFilters}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#1a1a1c] text-white font-bold text-xs border border-[#2a2a2c] transition-colors"
            >
              Скинути фільтри
            </button>
            <a
              href="https://t.me/lil_rams3y"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Написати в Telegram</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Card Grid / List */}
          <div className={`grid gap-4 sm:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {currentNumbers.map((item) => (
              <NumberCard
                key={item.id}
                item={item}
                onCopyNumber={onCopyNumber}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#222225] flex-wrap gap-4">
              <div className="text-xs text-zinc-400 font-medium">
                Показано <span className="text-white font-mono-num">{startIndex + 1}</span> - <span className="text-white font-mono-num">{Math.min(startIndex + itemsPerPage, numbers.length)}</span> із <span className="text-blue-400 font-mono-num">{numbers.length}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="prev-page-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-[#161618] border border-[#2a2a2c] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (totalPages > 6 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                    if (Math.abs(page - currentPage) === 3) {
                      return <span key={page} className="px-1 text-zinc-600">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      id={`page-btn-${page}`}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl font-mono-num text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'bg-[#161618] hover:bg-[#1a1a1c] text-zinc-300 border border-[#2a2a2c]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  id="next-page-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-[#161618] border border-[#2a2a2c] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
