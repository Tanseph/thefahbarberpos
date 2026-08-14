import React from 'react';
import { Barber } from '../../types';
import { Scissors, Check } from 'lucide-react';

interface BarberSelectorProps {
  barbers: Barber[];
  selectedBarberId: string;
  onSelectBarber: (barberId: string) => void;
}

export const BarberSelector: React.FC<BarberSelectorProps> = ({
  barbers,
  selectedBarberId,
  onSelectBarber,
}) => {
  const activeBarbers = barbers.filter(b => b.isActive);

  return (
    <div className="bg-[#1A1A1A] border border-[#A17000]/20 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#A17000] flex items-center gap-2">
          <span>👨🏻‍🎨</span>
          <span>เลือกช่างผู้ให้บริการ (BARBER SELECTION)</span>
        </h2>
        <span className="text-[11px] text-[#F5EEDC]/60">
          ช่างทั้งหมด {activeBarbers.length} ท่าน
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
        {activeBarbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;
          return (
            <button
              key={barber.id}
              onClick={() => onSelectBarber(barber.id)}
              className={`flex flex-col items-center gap-1.5 p-2.5 min-w-[84px] rounded-xl transition-all border cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-[#A17000] text-black ring-2 ring-[#A17000] ring-offset-2 ring-offset-[#0F0F0F] border-transparent font-bold shadow-[0_0_15px_rgba(161,112,0,0.3)]'
                  : 'bg-[#1A1A1A] hover:bg-[#252525] border-white/5 hover:border-[#A17000]/30 text-[#F5EEDC]'
              }`}
            >
              {/* Avatar circle */}
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shadow-inner overflow-hidden ${
                  isSelected ? 'bg-black/20 text-black border-2 border-black/20' : 'bg-[#2A2A2A] text-white border border-white/10'
                }`}
                style={{ backgroundColor: isSelected ? undefined : barber.color || '#2A2A2A' }}
              >
                {barber.avatar ? (
                  <img src={barber.avatar} alt={barber.nickname} className="w-full h-full object-cover" />
                ) : (
                  <span>{barber.nickname.slice(0, 2)}</span>
                )}
              </div>

              <span className="text-xs font-bold truncate max-w-[76px]">
                {barber.nickname}
              </span>

              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
                  isSelected ? 'bg-black/20 text-black' : 'text-[#A17000] bg-[#A17000]/10 border border-[#A17000]/20'
                }`}
              >
                ตัด {barber.haircutCommissionRate || 40}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
