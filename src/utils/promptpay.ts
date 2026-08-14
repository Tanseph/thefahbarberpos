import QRCode from 'qrcode';

/**
 * Generate EMVCo QR Code Payload for PromptPay (Thailand)
 * Supports Mobile numbers (e.g. 0812345678) and Citizen/Tax ID (13 digits)
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Clean target (digits only)
  const cleanedTarget = target.replace(/[^0-9]/g, '');

  let formattedTarget = '';
  let targetType = '01'; // 01 for mobile, 02 for citizen ID/tax ID

  if (cleanedTarget.length === 10 && cleanedTarget.startsWith('0')) {
    // Thai Mobile: 0812345678 -> 0066812345678
    formattedTarget = '0066' + cleanedTarget.substring(1);
    targetType = '01';
  } else if (cleanedTarget.length === 13) {
    // Citizen ID or Tax ID
    formattedTarget = cleanedTarget;
    targetType = '02';
  } else if (cleanedTarget.length === 15) {
    // E-Wallet ID
    formattedTarget = cleanedTarget;
    targetType = '03';
  } else {
    // Fallback format
    formattedTarget = cleanedTarget.padStart(13, '0');
    targetType = '02';
  }

  // Tag 29: Merchant Account Info (PromptPay)
  const aid = formatTag('00', 'A000000677010111');
  const merchant = formatTag(targetType, formattedTarget);
  const tag29 = formatTag('29', `${aid}${merchant}`);

  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', amount ? '12' : '11'); // Point of Initiation: 12 (Dynamic) or 11 (Static)
  payload += tag29;
  payload += formatTag('53', '764'); // Transaction Currency (764 = THB)

  if (amount && amount > 0) {
    payload += formatTag('54', amount.toFixed(2)); // Transaction Amount
  }

  payload += formatTag('58', 'TH'); // Country Code

  // Checksum Tag 63
  const checksumPrefix = '6304';
  const dataForCrc = payload + checksumPrefix;
  const checksum = crc16(dataForCrc);

  return dataForCrc + checksum;
}

export async function generatePromptPayQRDataUrl(target: string, amount?: number): Promise<string> {
  const payload = generatePromptPayPayload(target, amount);
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    throw err;
  }
}
