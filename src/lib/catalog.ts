import productsSeed from '../data/products.json';
import repairsSeed from '../data/repairs.json';
import categoryContentSeed from '../data/categoryContent.json';
import sectionsSeed from '../data/sections.json';
import type { CategoryContent, Product, RepairGroup, SectionDef } from './types';

/**
 * The catalogue ships with the app as a seed and is then kept in local storage
 * so the admin catalogue editor can change it without a deploy. Swap the two
 * `load`/`persist` helpers for Supabase calls to move it to the cloud.
 */

const KEY = 'ccs.catalog.v1';

interface CatalogState {
  products: Product[];
  repairs: RepairGroup[];
}

const seed = (): CatalogState => ({
  products: productsSeed as unknown as Product[],
  repairs: repairsSeed as unknown as RepairGroup[],
});

function load(): CatalogState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as CatalogState;
    if (!parsed?.products?.length) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

let state = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const sections = sectionsSeed as SectionDef[];
export const categoryContent = categoryContentSeed as Record<string, CategoryContent>;

export const allProducts = () => state.products;
export const allRepairs = () => state.repairs;

export const productById = (id: string) => state.products.find((p) => p.id === id) ?? null;

export const productsInCategory = (category: string) =>
  state.products.filter((p) => p.category === category);

export const categories = () => [...new Set(state.products.map((p) => p.category))];

export const repairsInCategory = (category: string) =>
  state.repairs.find((g) => g.category === category)?.services ?? [];

/** Products for a wizard section, grouped by category in catalogue order. */
export function sectionProducts(section: SectionDef): { category: string; products: Product[] }[] {
  return section.equipment
    .map((category) => ({ category, products: productsInCategory(category) }))
    .filter((g) => g.products.length > 0);
}

export function sectionRepairs(section: SectionDef) {
  return section.repairs
    .map((category) => ({ category, services: repairsInCategory(category) }))
    .filter((g) => g.services.length > 0);
}

// ---------------------------------------------------------------- editor API

export function upsertProduct(product: Product) {
  const i = state.products.findIndex((p) => p.id === product.id);
  const next = { ...product, quotePrice: product.salePrice ?? product.regularPrice ?? null };
  next.needsManualPrice = next.quotePrice == null;
  if (i >= 0) state.products[i] = next;
  else state.products.push(next);
  persist();
}

export function removeProduct(id: string) {
  state.products = state.products.filter((p) => p.id !== id);
  persist();
}

export function upsertRepair(category: string, service: RepairGroup['services'][number]) {
  let group = state.repairs.find((g) => g.category === category);
  if (!group) {
    group = { category, services: [] };
    state.repairs.push(group);
  }
  const i = group.services.findIndex((s) => s.id === service.id);
  const next = { ...service, flatRate: service.priceFrom === service.priceTo };
  if (i >= 0) group.services[i] = next;
  else group.services.push(next);
  persist();
}

export function removeRepair(category: string, id: string) {
  const group = state.repairs.find((g) => g.category === category);
  if (!group) return;
  group.services = group.services.filter((s) => s.id !== id);
  persist();
}

export function resetCatalog() {
  state = seed();
  persist();
}

export function exportCatalog() {
  return JSON.stringify(state, null, 2);
}

export function importCatalog(json: string) {
  const parsed = JSON.parse(json) as CatalogState;
  if (!parsed?.products?.length) throw new Error('That file has no products in it.');
  state = parsed;
  persist();
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
