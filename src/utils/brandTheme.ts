export interface BrandColorPreset {
  id: string;
  name: string;
  thaiName: string;
  hex: string;
  description: string;
  badgeEmoji: string;
}

export const BRAND_COLOR_PRESETS: BrandColorPreset[] = [
  {
    id: 'amber-gold',
    name: 'Amber Gold',
    thaiName: 'สีทองอำพัน (Classic Gold)',
    hex: '#D97706',
    description: 'โทนสีคลาสสิกบาร์เบอร์ อบอุ่น เรียบหรู พรีเมียม',
    badgeEmoji: '👑',
  },
  {
    id: 'emerald-green',
    name: 'Forest Emerald',
    thaiName: 'สีเขียวมรกต (Modern Emerald)',
    hex: '#059669',
    description: 'สดชื่น โมเดิร์นซาลอน เป็นธรรมชาติและสบายตา',
    badgeEmoji: '🌿',
  },
  {
    id: 'sapphire-blue',
    name: 'Royal Sapphire',
    thaiName: 'สีน้ำเงินรอยัลบลู (Gentleman Blue)',
    hex: '#2563EB',
    description: 'สุขุม สไตล์สุภาพบุรุษ น่าเชื่อถือ มืออาชีพ',
    badgeEmoji: '💎',
  },
  {
    id: 'crimson-ruby',
    name: 'Ruby Crimson',
    thaiName: 'สีแดงทับทิม (Ruby Crimson)',
    hex: '#E11D48',
    description: 'โดดเด่น ทันสมัย มีพลังและสะดุดตา',
    badgeEmoji: '🍒',
  },
  {
    id: 'amethyst-purple',
    name: 'Amethyst Purple',
    thaiName: 'สีม่วงอเมทิสต์ (Stylish Purple)',
    hex: '#7C3AED',
    description: 'แฟชั่นนิสต้า หรูหรา มีความคิดสร้างสรรค์',
    badgeEmoji: '✨',
  },
  {
    id: 'bronze-coffee',
    name: 'Bronze Espresso',
    thaiName: 'สีทองแดงเอสเปรสโซ่ (Vintage Bronze)',
    hex: '#92400E',
    description: 'วินเทจ บาร์เบอร์แท้ อบอุ่น สไตล์คลาสสิกร่วมสมัย',
    badgeEmoji: '☕',
  },
  {
    id: 'slate-onyx',
    name: 'Slate Onyx',
    thaiName: 'สีดำโอนิกซ์ (Minimal Onyx)',
    hex: '#334155',
    description: 'มินิมอล โมโนโครม เรียบหรู ชัดเจน ไร้กาลเวลา',
    badgeEmoji: '🖤',
  },
  {
    id: 'teal-ocean',
    name: 'Ocean Teal',
    thaiName: 'สีเขียวหัวเป็ดน้ำทะเล (Ocean Teal)',
    hex: '#0D9488',
    description: 'สปาซาลอน ผ่อนคลาย สะอาด โมเดิร์นพรีเมียม',
    badgeEmoji: '🌊',
  },
  {
    id: 'indigo-night',
    name: 'Midnight Indigo',
    thaiName: 'สีมิดไนท์อินดิโก้ (Deep Indigo)',
    hex: '#4F46E5',
    description: 'ลุ่มลึก ทันสมัย ไฮเทคและคมชัด',
    badgeEmoji: '🌌',
  },
  {
    id: 'coral-orange',
    name: 'Sunset Orange',
    thaiName: 'สีส้มซันเซ็ต (Sunset Orange)',
    hex: '#EA580C',
    description: 'กระปรี้กระเปร่า มีชีวิตชีวา เป็นกันเอง',
    badgeEmoji: '🔥',
  },
];

export const DEFAULT_BRAND_COLOR = '#D97706';

/**
 * Converts Hex string (#RRGGBB or #RGB) to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { r: 217, g: 119, b: 6 }; // Default amber
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Adjust brightness of Hex color (percent: -100 to 100)
 */
export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;
  
  const newR = Math.min(255, Math.max(0, Math.round(factor > 0 ? r + (255 - r) * factor : r * (1 + factor))));
  const newG = Math.min(255, Math.max(0, Math.round(factor > 0 ? g + (255 - g) * factor : g * (1 + factor))));
  const newB = Math.min(255, Math.max(0, Math.round(factor > 0 ? b + (255 - b) * factor : b * (1 + factor))));

  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

/**
 * Determine contrast text color (white or dark) based on luminance
 */
export function getContrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Calculate relative luminance according to WCAG
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#1C1917' : '#FFFFFF';
}

/**
 * Applies the Brand Color and associated CSS variables to the document
 */
export function applyBrandTheme(brandHex?: string, headerBgMode: 'brand' | 'light' | 'subtle' = 'subtle') {
  if (typeof document === 'undefined') return;

  const hex = brandHex && brandHex.startsWith('#') ? brandHex : DEFAULT_BRAND_COLOR;
  const { r, g, b } = hexToRgb(hex);
  const hoverHex = adjustBrightness(hex, -15);
  const activeHex = adjustBrightness(hex, -25);
  const lightHex = adjustBrightness(hex, 85);
  const textColor = getContrastTextColor(hex);
  const root = document.documentElement;

  // Set core brand variables
  root.style.setProperty('--brand-primary', hex);
  root.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--brand-primary-hover', hoverHex);
  root.style.setProperty('--brand-primary-active', activeHex);
  root.style.setProperty('--brand-primary-light', `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--brand-primary-subtle', `rgba(${r}, ${g}, ${b}, 0.05)`);
  root.style.setProperty('--brand-primary-border', `rgba(${r}, ${g}, ${b}, 0.25)`);
  root.style.setProperty('--brand-primary-text', textColor);
  root.style.setProperty('--brand-ring', `rgba(${r}, ${g}, ${b}, 0.35)`);

  // Button Variables
  root.style.setProperty('--btn-primary-bg', hex);
  root.style.setProperty('--btn-primary-hover', hoverHex);
  root.style.setProperty('--btn-primary-active', activeHex);
  root.style.setProperty('--btn-primary-text', textColor);
  root.style.setProperty('--btn-primary-shadow', `0 4px 14px 0 rgba(${r}, ${g}, ${b}, 0.35)`);

  // Header Variables
  if (headerBgMode === 'brand') {
    root.style.setProperty('--header-bg', hex);
    root.style.setProperty('--header-text', textColor);
    root.style.setProperty('--header-subnav-bg', adjustBrightness(hex, -12));
    root.style.setProperty('--header-border', adjustBrightness(hex, -20));
    root.style.setProperty('--header-badge-bg', 'rgba(255, 255, 255, 0.2)');
    root.style.setProperty('--header-badge-text', textColor);
  } else {
    root.style.setProperty('--header-bg', '#FFFFFF');
    root.style.setProperty('--header-text', '#1C1917');
    root.style.setProperty('--header-subnav-bg', `rgba(${r}, ${g}, ${b}, 0.04)`);
    root.style.setProperty('--header-border', `rgba(${r}, ${g}, ${b}, 0.18)`);
    root.style.setProperty('--header-badge-bg', `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.style.setProperty('--header-badge-text', hex);
  }
}
