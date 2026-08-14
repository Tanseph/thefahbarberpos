import React from 'react';
import { Search, X, Sparkles, Scissors, FlaskConical, Package, Gift } from 'lucide-react';
import { ItemCategory } from '../../types';

interface CategoryFilterProps {
  selectedCategory: string; // 'ALL' | ItemCategory
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  const categories: { id: string; label: string; icon: React.ReactNode; emoji: string }[] = [
    { id: 'ALL', label: 'ทั้งหมด', emoji: '🌟', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'HAIRCUT', label: 'บริการตัดผม', emoji: '✂️', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'CHEMICAL', label: 'งานเคมี', emoji: '🧪', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'PRODUCT', label: 'สินค้าดูแล', emoji: '🧴', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'PACKAGE', label: 'แพ็กเกจ', emoji: '🎁', icon: <Gift className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#F5EEDC]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาบริการ, ตัดผม, ดัดวอลลุ่ม, โพเมด, หรือรหัสสินค้า..."
          className="w-full bg-[#0F0F0F] border border-white/10 focus:border-[#A17000] text-white placeholder-stone-500 rounded-xl pl-10 pr-10 py-2.5 text-xs md:text-sm focus:outline-none transition shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = counts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-[#A17000] text-black border-[#A17000] shadow-[0_0_12px_rgba(161,112,0,0.3)]'
                  : 'bg-[#1A1A1A] border-white/5 text-[#F5EEDC]/80 hover:bg-[#252525] hover:text-white'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-[#2A2A2A] text-[#F5EEDC]/60'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
