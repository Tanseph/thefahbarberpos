/**
 * Formatters and Helper Utilities for BarberShop POS
 */

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '฿0';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('THB', '฿');
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('th-TH').format(num);
}

export function formatThaiDate(dateInput: string | Date, includeTime = false): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // BE

    if (includeTime) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year} ${hours}:${minutes} น.`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
}

export function getThaiMonthName(monthNumber: number): string {
  const thaiFullMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return thaiFullMonths[monthNumber - 1] || `${monthNumber}`;
}

export function formatThaiMonthYear(periodStr: string): string {
  // periodStr in format "YYYY-MM"
  if (!periodStr || !periodStr.includes('-')) return periodStr;
  const [yearStr, monthStr] = periodStr.split('-');
  const monthIndex = parseInt(monthStr, 10);
  const thaiMonth = getThaiMonthName(monthIndex);
  const thaiYear = parseInt(yearStr, 10) + 543;
  return `${thaiMonth} ${thaiYear}`;
}

export function generateBillNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BS${year}${month}${day}-${random}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentPeriodString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}
