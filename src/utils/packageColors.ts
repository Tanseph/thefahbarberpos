export interface PackageColorConfig {
  id: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBg: string;
  cardBorder: string;
  cardHoverBorder: string;
  accentBg: string;
  accentText: string;
  headerGradient: string;
  dotColor: string;
}

export const PACKAGE_COLOR_PALETTES: Record<string, PackageColorConfig> = {
  slate: {
    id: 'slate',
    name: 'Silver / เงินซิลเวอร์',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    cardBg: 'bg-gradient-to-b from-slate-50/90 via-white to-slate-50/50',
    cardBorder: 'border-slate-300/80',
    cardHoverBorder: 'hover:border-slate-500',
    accentBg: 'bg-slate-800',
    accentText: 'text-slate-100',
    headerGradient: 'from-slate-700 via-slate-800 to-slate-900',
    dotColor: 'bg-slate-400',
  },
  amber: {
    id: 'amber',
    name: 'Gold / ทองพรีเมียม',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    cardBg: 'bg-gradient-to-b from-amber-50/90 via-white to-amber-50/40',
    cardBorder: 'border-amber-300/90',
    cardHoverBorder: 'hover:border-amber-500',
    accentBg: 'bg-amber-700',
    accentText: 'text-amber-50',
    headerGradient: 'from-amber-600 via-amber-700 to-yellow-700',
    dotColor: 'bg-amber-500',
  },
  cyan: {
    id: 'cyan',
    name: 'Platinum / ฟ้าแพลทินัม',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900',
    badgeBorder: 'border-cyan-300',
    cardBg: 'bg-gradient-to-b from-cyan-50/90 via-white to-cyan-50/40',
    cardBorder: 'border-cyan-300/90',
    cardHoverBorder: 'hover:border-cyan-500',
    accentBg: 'bg-cyan-800',
    accentText: 'text-cyan-50',
    headerGradient: 'from-cyan-700 via-teal-700 to-blue-800',
    dotColor: 'bg-cyan-500',
  },
  purple: {
    id: 'purple',
    name: 'VIP Diamond / ม่วงไดมอนด์',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
    cardBg: 'bg-gradient-to-b from-purple-50/90 via-white to-purple-50/40',
    cardBorder: 'border-purple-300/90',
    cardHoverBorder: 'hover:border-purple-500',
    accentBg: 'bg-purple-800',
    accentText: 'text-purple-50',
    headerGradient: 'from-purple-700 via-indigo-800 to-purple-900',
    dotColor: 'bg-purple-500',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald / เขียวมรกต',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    cardBg: 'bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/40',
    cardBorder: 'border-emerald-300/90',
    cardHoverBorder: 'hover:border-emerald-500',
    accentBg: 'bg-emerald-800',
    accentText: 'text-emerald-50',
    headerGradient: 'from-emerald-700 via-teal-800 to-emerald-900',
    dotColor: 'bg-emerald-500',
  },
  rose: {
    id: 'rose',
    name: 'Ruby Rose / แดงทับทิม',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    cardBg: 'bg-gradient-to-b from-rose-50/90 via-white to-rose-50/40',
    cardBorder: 'border-rose-300/90',
    cardHoverBorder: 'hover:border-rose-500',
    accentBg: 'bg-rose-800',
    accentText: 'text-rose-50',
    headerGradient: 'from-rose-700 via-pink-800 to-rose-900',
    dotColor: 'bg-rose-500',
  },
  orange: {
    id: 'orange',
    name: 'Sunset Orange / ส้มสดใส',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
    cardBg: 'bg-gradient-to-b from-orange-50/90 via-white to-orange-50/40',
    cardBorder: 'border-orange-300/90',
    cardHoverBorder: 'hover:border-orange-500',
    accentBg: 'bg-orange-800',
    accentText: 'text-orange-50',
    headerGradient: 'from-orange-600 via-amber-700 to-orange-800',
    dotColor: 'bg-orange-500',
  },
  indigo: {
    id: 'indigo',
    name: 'Royal Blue / กรมท่ารอยัล',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-300',
    cardBg: 'bg-gradient-to-b from-indigo-50/90 via-white to-indigo-50/40',
    cardBorder: 'border-indigo-300/90',
    cardHoverBorder: 'hover:border-indigo-500',
    accentBg: 'bg-indigo-800',
    accentText: 'text-indigo-50',
    headerGradient: 'from-indigo-700 via-blue-800 to-indigo-950',
    dotColor: 'bg-indigo-500',
  },
};

export const getPackageColorConfig = (themeKey?: string): PackageColorConfig => {
  if (!themeKey) return PACKAGE_COLOR_PALETTES.amber;
  const key = themeKey.toLowerCase();
  if (PACKAGE_COLOR_PALETTES[key]) {
    return PACKAGE_COLOR_PALETTES[key];
  }
  // Keyword matching
  if (key.includes('silver') || key.includes('slate') || key.includes('gray')) return PACKAGE_COLOR_PALETTES.slate;
  if (key.includes('gold') || key.includes('amber') || key.includes('yellow')) return PACKAGE_COLOR_PALETTES.amber;
  if (key.includes('platinum') || key.includes('cyan') || key.includes('sky')) return PACKAGE_COLOR_PALETTES.cyan;
  if (key.includes('vip') || key.includes('diamond') || key.includes('purple')) return PACKAGE_COLOR_PALETTES.purple;
  if (key.includes('green') || key.includes('emerald')) return PACKAGE_COLOR_PALETTES.emerald;
  if (key.includes('red') || key.includes('rose') || key.includes('pink')) return PACKAGE_COLOR_PALETTES.rose;
  if (key.includes('orange')) return PACKAGE_COLOR_PALETTES.orange;
  if (key.includes('blue') || key.includes('indigo')) return PACKAGE_COLOR_PALETTES.indigo;

  return PACKAGE_COLOR_PALETTES.amber;
};
