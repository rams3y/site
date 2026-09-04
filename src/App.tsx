import React, { useState, useMemo, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  HeroBanner 
} from './components/HeroBanner';
import { 
  CategoryTabs 
} from './components/CategoryTabs';
import { 
  FiltersSidebar 
} from './components/FiltersSidebar';
import { 
  NumberGrid 
} from './components/NumberGrid';
import { 
  Footer 
} from './components/Footer';
import { 
  AdminModal 
} from './components/AdminModal';
import { 
  LIFECELL_NUMBERS 
} from './data/lifecellNumbers';
import { 
  numberService 
} from './services/numberService';
import { 
  FilterState, 
  LifecellNumber, 
  NumberCategory, 
  OperatorType 
} from './types';
import { Check } from 'lucide-react';

export const App: React.FC = () => {
  // Main catalog numbers state
  const [numbers, setNumbers] = useState<LifecellNumber[]>(() => {
    try {
      const cached = localStorage.getItem('rams3y_catalog_numbers_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return LIFECELL_NUMBERS;
  });

  // Admin Modal state
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    return window.location.hash === '#admin';
  });

  // Load latest numbers from server on mount
  useEffect(() => {
    numberService.getAllNumbers().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setNumbers(fetched);
      }
    });

    // Listen for hash change (#admin)
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Keyboard shortcut (Ctrl + Shift + A or Ctrl + Alt + A) to open admin
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey) && (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф')) {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    operator: 'all',
    code: 'all',
    category: 'all',
    minPrice: 0,
    maxPrice: 1000000,
    searchQuery: '',
    sortBy: 'popular',
  });

  // Copied toast state
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Filter and sort numbers
  const filteredNumbers = useMemo(() => {
    return numbers.filter((item) => {
      // Operator filter
      if (filters.operator !== 'all' && item.operator !== filters.operator) {
        return false;
      }

      // Code filter
      if (filters.code !== 'all' && item.code !== filters.code) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Price filter
      if (item.price < filters.minPrice || item.price > filters.maxPrice) {
        return false;
      }

      // Search filter (searches raw number, formatted number, pattern, category, operator)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().replace(/[\s\-()]/g, '');
        const raw = item.rawNumber.toLowerCase();
        const formatted = item.formatted.toLowerCase().replace(/[\s\-()]/g, '');
        const pattern = item.patternType.toLowerCase();
        const cat = item.categoryName.toLowerCase();
        const opName = (item.operatorName || '').toLowerCase();

        const matchesQuery = 
          raw.includes(query) || 
          formatted.includes(query) || 
          pattern.includes(query) || 
          cat.includes(query) ||
          opName.includes(query);

        if (!matchesQuery) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'memorability':
          return b.memorability - a.memorability;
        case 'newest':
          return b.viewsCount - a.viewsCount;
        case 'popular':
        default:
          return b.viewsCount - a.viewsCount;
      }
    });
  }, [numbers, filters]);

  // Dynamic category counts for currently selected operator
  const categoryCounts = useMemo(() => {
    const subset = filters.operator === 'all' 
      ? numbers 
      : numbers.filter(n => n.operator === filters.operator);

    const counts: Record<string, number> = { all: subset.length };
    subset.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [numbers, filters.operator]);

  const handleResetFilters = () => {
    setFilters({
      operator: 'all',
      code: 'all',
      category: 'all',
      minPrice: 0,
      maxPrice: 1000000,
      searchQuery: '',
      sortBy: 'popular',
    });
  };

  const handleCopyNumber = (formatted: string) => {
    setCopiedToast(formatted);
    setTimeout(() => {
      setCopiedToast(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header with Rams3y Number Branding & Contacts & Hidden Admin Button */}
      <Header onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Hero Banner with Operator switcher, Code selectors & Search */}
      <HeroBanner
        selectedOperator={filters.operator}
        onSelectOperator={(operator: OperatorType) => setFilters(f => ({ ...f, operator, code: 'all' }))}
        selectedCode={filters.code}
        onSelectCode={(code: string) => setFilters(f => ({ ...f, code }))}
        searchQuery={filters.searchQuery}
        onSearchChange={(searchQuery: string) => setFilters(f => ({ ...f, searchQuery }))}
        totalNumbersCount={numbers.length}
      />

      {/* Interactive Category Tabs */}
      <CategoryTabs
        selectedCategory={filters.category}
        onSelectCategory={(category: 'all' | NumberCategory) => setFilters(f => ({ ...f, category }))}
        categoryCounts={categoryCounts}
      />

      {/* Main Content Area: Sidebar Filters & Number Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-1">
            <FiltersSidebar
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={handleResetFilters}
              totalFiltered={filteredNumbers.length}
            />
          </div>

          {/* Catalog Number Cards */}
          <div className="lg:col-span-3">
            <NumberGrid
              numbers={filteredNumbers}
              onCopyNumber={handleCopyNumber}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Admin Panel Modal (Secure for Owner) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          if (window.location.hash === '#admin') {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
        numbers={numbers}
        onNumbersUpdated={(updated) => {
          setNumbers(updated);
        }}
      />

      {/* Copied Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161618] border border-blue-500/40 shadow-2xl shadow-blue-500/20 text-white px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold">Номер скопійовано в буфер!</p>
            <p className="text-[11px] text-zinc-400 font-mono-num">+38 ({copiedToast})</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
