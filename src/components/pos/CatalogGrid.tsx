import React from 'react';
import { ServiceItem, PackageTemplate } from '../../types';
import { Plus, Clock, PackageCheck, AlertTriangle, Sparkles, Gift } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface CatalogGridProps {
  services: ServiceItem[];
  packages: PackageTemplate[];
  selectedCategory: string;
  searchQuery: string;
  onAddToCart: (item: ServiceItem | PackageTemplate, isPackage?: boolean) => void;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  services,
  packages,
  selectedCategory,
  searchQuery,
  onAddToCart,
}) => {
  const query = searchQuery.trim().toLowerCase();

  // Filter services
  const filteredServices = services.filter((item) => {
    if (!item.isActive) return false;
    if (selectedCategory !== 'ALL' && selectedCategory !== 'PACKAGE' && item.category !== selectedCategory) {
      return false;
    }
    if (selectedCategory === 'PACKAGE') return false;

    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      (item.code && item.code.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    if (!pkg.isActive) return false;
    if (selectedCategory !== 'ALL' && selectedCategory !== 'PACKAGE') return false;
    if (!query) return true;
    return (
      pkg.name.toLowerCase().includes(query) ||
      (pkg.description && pkg.description.toLowerCase().includes(query))
    );
  });

  const hasResults = filteredServices.length > 0 || filteredPackages.length > 0;

  if (!hasResults) {
    return (
      <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-12 text-center text-[#F5EEDC]/50">
        <Sparkles className="w-10 h-10 text-[#A17000]/60 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white">ไม่พบบริการหรือสินค้าที่ค้นหา</h4>
        <p className="text-xs text-[#F5EEDC]/50 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
      </div>
    );
  }

  const getItemEmoji = (item: ServiceItem) => {
    if (item.category === 'CHEMICAL') return '🧪';
    if (item.category === 'PRODUCT') return '🧴';
    if (item.name.includes('โกนหนวด') || item.name.includes('Shave') || item.name.includes('Beard')) return '🪒';
    if (item.name.includes('สระ') || item.name.includes('Wash') || item.name.includes('Treatment')) return '✨';
    return '✂️';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 content-start">
      {/* Services and Products */}
      {filteredServices.map((item) => {
        const isOutOfStock = item.trackStock && (item.stock ?? 0) <= 0;
        const isLowStock = item.trackStock && (item.stock ?? 0) > 0 && (item.stock ?? 0) <= 3;
        const emoji = getItemEmoji(item);

        return (
          <div
            key={item.id}
            onClick={() => !isOutOfStock && onAddToCart(item)}
            className={`group bg-[#1A1A1A] p-3 rounded-2xl border transition-all relative flex flex-col justify-between select-none ${
              isOutOfStock
                ? 'border-white/5 opacity-40 cursor-not-allowed'
                : 'border-white/5 hover:border-[#A17000]/60 hover:bg-[#202020] hover:shadow-[0_0_15px_rgba(161,112,0,0.15)] cursor-pointer active:scale-98'
            }`}
          >
            <div>
              {/* Feature Icon Container */}
              <div className="h-24 bg-[#252525] rounded-xl mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform relative overflow-hidden">
                <span>{emoji}</span>
                {item.code && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/50 text-[#A17000] border border-white/5">
                    {item.code}
                  </span>
                )}
                {item.durationMinutes > 0 && (
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/60 text-[#F5EEDC]/80 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[#A17000]" />
                    {item.durationMinutes}m
                  </span>
                )}
              </div>

              {/* Title & Info */}
              <p className="text-xs font-bold text-white mb-1 line-clamp-1 group-hover:text-[#A17000] transition-colors">
                {item.name}
              </p>

              {item.description && (
                <p className="text-[10px] text-[#F5EEDC]/60 line-clamp-1 mb-2">
                  {item.description}
                </p>
              )}

              {item.trackStock && (
                <div className="mb-2">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md inline-flex items-center gap-1 font-semibold ${
                      isOutOfStock
                        ? 'bg-rose-500/20 text-rose-400'
                        : isLowStock
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-[#2A2A2A] text-stone-300'
                    }`}
                  >
                    สต็อก: {item.stock}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
              <p className="text-sm font-black text-[#A17000]">
                {formatCurrency(item.price)}
              </p>

              <button
                disabled={isOutOfStock}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isOutOfStock
                    ? 'bg-[#2A2A2A] text-stone-600'
                    : 'bg-[#A17000] text-black font-bold group-hover:scale-110 shadow-sm'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Package Templates */}
      {filteredPackages.map((pkg) => (
        <div
          key={pkg.id}
          onClick={() => onAddToCart(pkg, true)}
          className="group bg-[#1A1A1A] p-3 rounded-2xl border border-[#A17000]/40 hover:border-[#A17000] hover:bg-[#202020] transition-all relative flex flex-col justify-between cursor-pointer active:scale-98 select-none shadow-[0_0_12px_rgba(161,112,0,0.1)]"
        >
          <div>
            <div className="h-24 bg-[#252525] rounded-xl mb-3 flex flex-col items-center justify-center text-3xl group-hover:scale-110 transition-transform relative overflow-hidden border border-[#A17000]/20">
              <span>🎟️</span>
              <span className="absolute top-1.5 right-1.5 text-[9px] bg-[#A17000] text-black font-extrabold px-1.5 py-0.2 rounded">
                {pkg.totalSessions} ครั้ง
              </span>
            </div>

            <p className="text-xs font-bold text-white mb-1 line-clamp-1 group-hover:text-[#A17000] transition-colors">
              {pkg.name}
            </p>
            <p className="text-[10px] text-[#F5EEDC]/60 line-clamp-1 mb-2">
              {pkg.description || 'แพ็กเกจสุดคุ้มสำหรับสมาชิก'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
            <div>
              <p className="text-sm font-black text-[#A17000]">
                {formatCurrency(pkg.price)}
              </p>
              {pkg.originalValue > pkg.price && (
                <span className="text-[9px] text-[#F5EEDC]/40 line-through">
                  {formatCurrency(pkg.originalValue)}
                </span>
              )}
            </div>

            <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#A17000] text-black font-bold group-hover:scale-110 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
