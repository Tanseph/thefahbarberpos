/**
 * Thai Baht Text Converter (แปลงตัวเลขเป็นตัวหนังสือภาษาไทย บาทถ้วน)
 * Accurately handles integer and decimal satang values according to Royal Institute rules.
 */

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertSection(numStr: string): string {
  let result = '';
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(i), 10);
    const pos = len - i - 1;

    if (digit !== 0) {
      if (pos === 1 && digit === 1) {
        result += 'สิบ';
      } else if (pos === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (pos === 0 && digit === 1 && len > 1 && numStr.charAt(len - 2) !== '0') {
        result += 'เอ็ด';
      } else {
        result += THAI_DIGITS[digit] + THAI_UNITS[pos];
      }
    }
  }

  return result;
}

export function formatThaiBahtText(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Split into Baht and Satang
  const fixed = absAmount.toFixed(2);
  const parts = fixed.split('.');
  const bahtPart = parts[0];
  const satangPart = parts[1];

  let bahtText = '';
  const len = bahtPart.length;

  // Millions grouping
  if (len > 6) {
    const millionsCount = Math.floor((len - 1) / 6);
    let remaining = bahtPart;

    for (let m = millionsCount; m >= 0; m--) {
      const chunkLen = remaining.length - m * 6;
      if (chunkLen > 0) {
        const chunk = remaining.substring(0, chunkLen);
        remaining = remaining.substring(chunkLen);
        bahtText += convertSection(chunk) + (m > 0 ? 'ล้าน' : '');
      }
    }
  } else {
    bahtText = convertSection(bahtPart);
  }

  if (bahtText === '') {
    bahtText = 'ศูนย์';
  }

  let satangText = '';
  const satangNum = parseInt(satangPart, 10);
  if (satangNum > 0) {
    satangText = convertSection(satangPart) + 'สตางค์';
  } else {
    satangText = 'ถ้วน';
  }

  const prefix = isNegative ? 'ลบ' : '';
  return `${prefix}${bahtText}บาท${satangText}`;
}

export const thaiBahtText = formatThaiBahtText;
