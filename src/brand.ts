/**
 * Every piece of branding lives here. Change this one file and the whole app
 * — login, sidebar, quote header, public quote page, PDF — follows.
 */
export const brand = {
  name: 'Canadian Comfort Solutions',
  shortName: 'CCS',
  initials: 'CCS',
  tagline: 'Home comfort, done properly.',

  // shown on quotes and the public quote page
  phone: '+1 647-385-7954',
  email: 'heyitsali092@gmail.com',
  address: '',
  website: '',

  /** Full lockup — login screen, quote header, customer-facing page. */
  logo: '/logo.png',
  /** Shield only — sidebar and anywhere tight. */
  logoMark: '/logo-mark.png',

  colors: {
    // sampled straight out of the logo artwork
    accent: '#002E69', // Canadian Comfort navy
    accent2: '#2E6FE6',
    accentRgb: '0, 46, 105',
    onAccent: '#FFFFFF',
    /** the red from the wordmark — used sparingly, for emphasis */
    brandRed: '#E01528',
    bg: '#F5F8FB',
    bg2: '#FFFFFF',
    panel: '#FFFFFF',
    panel2: '#F2F6FA',
    border: 'rgba(13, 34, 51, 0.10)',
    text: '#12233B',
    muted: '#5D6B84',
    faint: 'rgba(13, 34, 51, 0.045)',
    track: 'rgba(13, 34, 51, 0.12)',
    good: '#12A15C',
    warn: '#E01528',
    navBg: '#001C40',
    navText: '#E8EEF6',
    navMuted: 'rgba(232, 238, 246, 0.6)',
  },

  /** Ontario HST. Change here if you quote in another province. */
  taxRate: 0.13,
  taxLabel: 'HST (13%)',
  currency: 'CAD',
  locale: 'en-CA',
} as const;

export function applyBrandTheme(): void {
  const r = document.documentElement;
  const c = brand.colors;
  const vars: Record<string, string> = {
    '--accent': c.accent,
    '--accent-2': c.accent2,
    '--accent-rgb': c.accentRgb,
    '--on-accent': c.onAccent,
    '--bg': c.bg,
    '--bg-2': c.bg2,
    '--panel': c.panel,
    '--panel-2': c.panel2,
    '--border': c.border,
    '--text': c.text,
    '--muted': c.muted,
    '--faint': c.faint,
    '--track': c.track,
    '--good': c.good,
    '--warn': c.warn,
    '--nav-bg': c.navBg,
    '--nav-text': c.navText,
    '--nav-muted': c.navMuted,
    '--brand-red': c.brandRed,
  };
  for (const [k, v] of Object.entries(vars)) r.style.setProperty(k, v);
}

export const money = (n: number, digits = 0) =>
  n.toLocaleString(brand.locale, {
    style: 'currency',
    currency: brand.currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
