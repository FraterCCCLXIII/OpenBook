/** Normalize admin/public hex (3- or 6-digit with #). */
export function normalizeBrandHex(raw: string | undefined | null): string | null {
  const s = raw?.trim() ?? '';
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const h = s.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return null;
}

/** Theme default; keep in sync with `index.css` @theme --color-brand. */
export const DEFAULT_BRAND_HEX = '#439a82';

export function resolveStaffBrandHex(raw: string | undefined | null): string {
  return normalizeBrandHex(raw) ?? DEFAULT_BRAND_HEX;
}

/** Darker shade for hover / secondary brand UI (multiplicative in sRGB). */
export function hexToDarkenedRgb(hex: string, factor = 0.72): string {
  const n = normalizeBrandHex(hex);
  if (!n) return '#024225';
  const h = n.slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}
