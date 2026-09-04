import React from 'react';
import { 
  Sparkles, 
  Shield, 
  Award, 
  Gem, 
  Crown, 
  Repeat, 
  Layers, 
  Hash, 
  TrendingUp, 
  Tag 
} from 'lucide-react';
import { NumberCategory } from '../types';
import { CATEGORIES_META } from '../data/lifecellNumbers';

interface CategoryTabsProps {
  selectedCategory: 'all' | NumberCategory;
  onSelectCategory: (cat: 'all' | NumberCategory) => void;
  categoryCounts: Record<string, number>;
}

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'all': return Sparkles;
    case 'silver': return Shield;
    case 'gold': return Award;
    case 'platinum': return Gem;
    case 'vip': return Crown;
    case 'mirror': return Repeat;
    case 'butterfly': return Layers;
    case 'thousands': return Hash;
    case 'ladder': return TrendingUp;
    case 'bronze': return Tag;
    default: return Sparkles;
  }
};

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <div className="w-full border-b border-[#222225] bg-[#111113]/95 sticky top-20 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar scroll-smooth">
          {CATEGORIES_META.map((cat) => {
            const Icon = getCategoryIcon(cat.id);
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                id={`category-tab-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                    : 'bg-[#161618] text-zinc-300 hover:bg-[#1a1a1c] hover:text-white border border-[#2a2a2c]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                <span>{cat.shortTitle}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono-num font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#111113] text-zinc-400 border border-[#222225]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
