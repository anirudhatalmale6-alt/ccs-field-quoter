import { brand } from '../brand';
import { defaultFinance } from './finance';
import { defaultInsulation } from './insulation';
import type { Customer, HomeDetails, Quote, QuoteLine, QuoteStatus } from './types';

const KEY = 'ccs.quotes.v1';
const COUNTER = 'ccs.quoteNumber.v1';

const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const emit = () => listeners.forEach((l) => l());

function read(): Quote[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Quote[];
    // quotes saved before a field existed still have to open cleanly
    return raw.map((q) => ({
      ...q,
      insulation: q.insulation ?? { ...defaultInsulation },
      finance: { ...defaultFinance, ...q.finance },
    }));
  } catch {
    return [];
  }
}

function write(quotes: Quote[]) {
  localStorage.setItem(KEY, JSON.stringify(quotes));
  emit();
}

export const emptyCustomer = (): Customer => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: 'ON',
  postalCode: '',
  notes: '',
});

export const emptyHome = (): HomeDetails => ({
  propertyType: '',
  squareFeet: '',
  yearBuilt: '',
  bathrooms: '',
  occupants: '',
  finishedBasement: '',
  atticInsulationAge: '',
  existingHeating: '',
});

function nextNumber(): string {
  const n = Number(localStorage.getItem(COUNTER) ?? '1000') + 1;
  localStorage.setItem(COUNTER, String(n));
  return `Q-${n}`;
}

const token = () =>
  (crypto.randomUUID?.() ?? String(Math.random()).slice(2)).replace(/-/g, '').slice(0, 16);

export function newQuote(createdBy: string): Quote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    number: nextNumber(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy,
    customer: emptyCustomer(),
    home: emptyHome(),
    lines: [],
    discount: { kind: 'amount', value: 0 },
    taxRate: brand.taxRate,
    finance: { ...defaultFinance },
    insulation: { ...defaultInsulation },
    booking: null,
    shareToken: token(),
  };
}

export const listQuotes = () =>
  read().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

export const getQuote = (id: string) => read().find((q) => q.id === id) ?? null;

export const getQuoteByToken = (t: string) => read().find((q) => q.shareToken === t) ?? null;

export function saveQuote(quote: Quote) {
  const quotes = read();
  const i = quotes.findIndex((q) => q.id === quote.id);
  const next = { ...quote, updatedAt: new Date().toISOString() };
  if (i >= 0) quotes[i] = next;
  else quotes.push(next);
  write(quotes);
  return next;
}

export function removeQuote(id: string) {
  write(read().filter((q) => q.id !== id));
}

export function duplicateQuote(id: string): Quote | null {
  const source = getQuote(id);
  if (!source) return null;
  const now = new Date().toISOString();
  const copy: Quote = {
    ...structuredClone(source),
    id: crypto.randomUUID?.() ?? String(Date.now()),
    number: nextNumber(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    booking: null,
    shareToken: token(),
  };
  return saveQuote(copy);
}

export function setStatus(id: string, status: QuoteStatus) {
  const q = getQuote(id);
  if (q) saveQuote({ ...q, status });
}

// -------------------------------------------------------------------- totals

export interface Totals {
  subtotal: number;
  regularSubtotal: number;
  savings: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export function totals(quote: Quote): Totals {
  const subtotal = quote.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const regularSubtotal = quote.lines.reduce(
    (sum, l) => sum + (l.regularPrice ?? l.unitPrice) * l.qty,
    0
  );
  const discount =
    quote.discount.kind === 'percent'
      ? (subtotal * Math.max(0, quote.discount.value)) / 100
      : Math.max(0, quote.discount.value);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * quote.taxRate;
  return {
    subtotal,
    regularSubtotal,
    savings: Math.max(0, regularSubtotal - subtotal),
    discount,
    taxable,
    tax,
    total: taxable + tax,
  };
}

export function addLine(quote: Quote, line: QuoteLine): Quote {
  const i = quote.lines.findIndex((l) => l.id === line.id);
  const lines = [...quote.lines];
  if (i >= 0) lines[i] = { ...lines[i], qty: lines[i].qty + line.qty };
  else lines.push(line);
  return { ...quote, lines };
}

export const removeLine = (quote: Quote, id: string): Quote => ({
  ...quote,
  lines: quote.lines.filter((l) => l.id !== id),
});

export const setLineQty = (quote: Quote, id: string, qty: number): Quote => ({
  ...quote,
  lines: quote.lines
    .map((l) => (l.id === id ? { ...l, qty: Math.max(0, qty) } : l))
    .filter((l) => l.qty > 0),
});

export const customerName = (q: Quote) =>
  [q.customer.firstName, q.customer.lastName].filter(Boolean).join(' ').trim() || 'New customer';

/** Public link a technician shares with the customer. */
export const shareUrl = (q: Quote) =>
  `${window.location.origin}${import.meta.env.BASE_URL}q/${q.shareToken}`;
