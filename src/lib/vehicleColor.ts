/**
 * Free-text vehicle color -> canonical key + hex.
 *
 * KEEP IN SYNC with Backend/src/services/vehicleStyle/colorMapper.js (same keys, words and hex).
 * The backend sends `colorHex` for painting; the app uses this table to show the color name
 * translated (i18n `vehicle.colors.<key>`) and as a paint fallback for older backends.
 */

export type VehicleColorKey =
  | 'white'
  | 'black'
  | 'silver'
  | 'gray'
  | 'darkGray'
  | 'lightGray'
  | 'red'
  | 'wine'
  | 'blue'
  | 'darkBlue'
  | 'lightBlue'
  | 'green'
  | 'darkGreen'
  | 'lightGreen'
  | 'yellow'
  | 'orange'
  | 'brown'
  | 'beige'
  | 'gold'
  | 'purple'
  | 'pink'
  | 'champagne'
  | 'bronze';

export const FALLBACK_COLOR_HEX = '#9CA3AF';

export const COLOR_HEX: Record<VehicleColorKey, string> = {
  white: '#F8FAFC',
  black: '#111827',
  silver: '#C0C6CE',
  gray: '#6B7280',
  darkGray: '#374151',
  lightGray: '#B8BEC6',
  red: '#C62828',
  wine: '#7B1E2B',
  blue: '#1E5BB8',
  darkBlue: '#1E2F5C',
  lightBlue: '#6FB3E8',
  green: '#2E7D32',
  darkGreen: '#1B4D2E',
  lightGreen: '#7CC47F',
  yellow: '#F2C230',
  orange: '#EF7D22',
  brown: '#6D4C3D',
  beige: '#D8C7A5',
  gold: '#C9A646',
  purple: '#6A3FA0',
  pink: '#E58FB5',
  champagne: '#E3D3B0',
  bronze: '#8C6239',
};

const BASE_WORDS: Record<string, VehicleColorKey> = {
  blanco: 'white',
  blanca: 'white',
  white: 'white',
  negro: 'black',
  negra: 'black',
  black: 'black',
  plata: 'silver',
  plateado: 'silver',
  plateada: 'silver',
  silver: 'silver',
  gris: 'gray',
  gray: 'gray',
  grey: 'gray',
  grafito: 'darkGray',
  graphite: 'darkGray',
  rojo: 'red',
  roja: 'red',
  red: 'red',
  vinotinto: 'wine',
  vino: 'wine',
  granate: 'wine',
  burdeos: 'wine',
  burgundy: 'wine',
  maroon: 'wine',
  wine: 'wine',
  azul: 'blue',
  blue: 'blue',
  celeste: 'lightBlue',
  verde: 'green',
  green: 'green',
  amarillo: 'yellow',
  amarilla: 'yellow',
  yellow: 'yellow',
  naranja: 'orange',
  anaranjado: 'orange',
  anaranjada: 'orange',
  orange: 'orange',
  cafe: 'brown',
  marron: 'brown',
  brown: 'brown',
  beige: 'beige',
  beis: 'beige',
  crema: 'beige',
  cream: 'beige',
  dorado: 'gold',
  dorada: 'gold',
  oro: 'gold',
  gold: 'gold',
  golden: 'gold',
  morado: 'purple',
  morada: 'purple',
  violeta: 'purple',
  lila: 'purple',
  purple: 'purple',
  violet: 'purple',
  rosado: 'pink',
  rosada: 'pink',
  rosa: 'pink',
  fucsia: 'pink',
  pink: 'pink',
  champana: 'champagne',
  champan: 'champagne',
  champagne: 'champagne',
  bronce: 'bronze',
  bronze: 'bronze',
};

const DARK_WORDS = new Set(['oscuro', 'oscura', 'dark', 'marino', 'navy']);
const LIGHT_WORDS = new Set(['claro', 'clara', 'light']);
const FINISH_WORDS = new Set([
  'metalico',
  'metalica',
  'metalizado',
  'metalizada',
  'metallic',
  'perlado',
  'perlada',
  'perla',
  'pearl',
  'perlescent',
  'mate',
  'matte',
  'brillante',
  'glossy',
  'solido',
  'solida',
  'solid',
]);

const SHADE_VARIANTS: Partial<
  Record<VehicleColorKey, { dark?: VehicleColorKey; light?: VehicleColorKey }>
> = {
  gray: { dark: 'darkGray', light: 'lightGray' },
  blue: { dark: 'darkBlue', light: 'lightBlue' },
  green: { dark: 'darkGreen', light: 'lightGreen' },
  red: { dark: 'wine' },
};

export interface VehicleColorMatch {
  key: VehicleColorKey | null;
  hex: string;
  /** A base color was recognized: `hex` reflects the real paint. */
  isKnown: boolean;
  /** Every word was recognized (single base color): the translated name can replace the typed text. */
  exact: boolean;
}

export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function mapVehicleColor(text: unknown): VehicleColorMatch {
  const normalized = normalizeText(text);
  const tokens = normalized ? normalized.split(' ') : [];
  const bases: VehicleColorKey[] = [];
  let dark = false;
  let light = false;
  let unknownWords = 0;

  for (const token of tokens) {
    const base = BASE_WORDS[token];
    if (base) bases.push(base);
    else if (DARK_WORDS.has(token)) dark = true;
    else if (LIGHT_WORDS.has(token)) light = true;
    else if (!FINISH_WORDS.has(token)) unknownWords += 1;
  }

  if (bases.length === 0) {
    return { key: null, hex: FALLBACK_COLOR_HEX, isKnown: false, exact: false };
  }

  let key: VehicleColorKey =
    bases.includes('silver') && bases.every((b) => b === 'silver' || b === 'gray')
      ? 'silver'
      : bases[0];
  const distinct = new Set(bases.map((b) => (b === 'gray' && key === 'silver' ? 'silver' : b)));

  const variants = SHADE_VARIANTS[key];
  if (variants) {
    if (dark && !light && variants.dark) key = variants.dark;
    else if (light && !dark && variants.light) key = variants.light;
  }

  return {
    key,
    hex: COLOR_HEX[key],
    isKnown: true,
    exact: unknownWords === 0 && distinct.size === 1,
  };
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value);
}

/** WCAG relative luminance of a #RRGGBB color (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const channel = (start: number) => {
    const c = parseInt(clean.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** WCAG contrast ratio between two #RRGGBB colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
