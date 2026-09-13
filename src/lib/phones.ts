const DIGITS = /[^\d+]/g;

export function normalizeIndianPhone(raw: string): string | null {
  if (!raw) return null;
  let value = raw.trim().replace(DIGITS, "");
  if (!value) return null;

  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  if (value.startsWith("+")) {
    const digits = value.slice(1);
    if (digits.length < 10) return null;
    return `+${digits}`;
  }

  if (value.startsWith("0") && value.length === 11) {
    value = value.slice(1);
  }

  if (value.startsWith("91") && value.length === 12) {
    return `+${value}`;
  }

  if (value.length === 10) {
    return `+91${value}`;
  }

  if (value.length >= 11 && value.length <= 15) {
    return `+${value}`;
  }

  return null;
}

export function displayPhone(phone: string): string {
  if (phone.startsWith("+91") && phone.length === 13) {
    return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
  }
  return phone;
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
