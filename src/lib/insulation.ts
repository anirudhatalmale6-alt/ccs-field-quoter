import type { HomeDetails } from './types';

/**
 * Attic insulation — a measured item rather than a catalogue product.
 * Rules match the original quoter: R-60 top-up priced per square foot of
 * attic area, with the area either estimated from the home profile, measured
 * length × width, or typed in directly.
 */

/** Installed price per square foot of attic area for the R-60 top-up. */
export const PRICE_PER_SQ_FT = 3;

export const EXISTING_DEPTHS = [
  'None / bare',
  '~R-12 (4-5 in)',
  '~R-20 (6-8 in)',
  '~R-32 (10-12 in)',
  '~R-40 (14-16 in)',
  'Unknown',
] as const;

export type AreaMode = 'estimate' | 'dimensions' | 'manual';

export interface InsulationState {
  areaMode: AreaMode;
  lengthFt: number | null;
  widthFt: number | null;
  manualSqft: number | null;
  existingDepth: string;
}

export const defaultInsulation: InsulationState = {
  areaMode: 'estimate',
  lengthFt: null,
  widthFt: null,
  manualSqft: null,
  existingDepth: '',
};

/** Attic footprint estimated from the home profile. */
export function estimatedArea(home: HomeDetails): number | null {
  const sqft = Number(home.squareFeet);
  if (!sqft || sqft <= 0) return null;
  if (home.propertyType === 'Bungalow') return Math.round(sqft * 1.05);
  if (home.propertyType === '3-Story House') return Math.round((sqft / 3) * 1.1);
  return Math.round((sqft / 2) * 1.05);
}

/** How that estimate was arrived at — shown under the figure. */
export function estimateBasis(home: HomeDetails): string {
  if (home.propertyType === 'Bungalow') return 'bungalow — above-ground sq ft × 1.05';
  if (home.propertyType === '3-Story House') return '3-story — sq ft ÷ 3 × 1.10';
  return '2-story assumption — sq ft ÷ 2 × 1.05';
}

/** The area actually used for pricing, given the chosen mode. */
export function resolveArea(state: InsulationState, home: HomeDetails): number | null {
  if (state.areaMode === 'manual') return state.manualSqft;
  if (state.areaMode === 'dimensions') {
    return state.lengthFt && state.widthFt ? Math.round(state.lengthFt * state.widthFt) : null;
  }
  return estimatedArea(home);
}

export const priceForArea = (area: number | null): number | null =>
  area && area > 0 ? Math.round(area * PRICE_PER_SQ_FT) : null;
