import type { RepairService } from './types';

/**
 * Repairs are quoted as a range. The technician picks a job size on site and
 * the price lands at the matching point in that range — same interpolation the
 * original quoter uses.
 */

export const JOB_SIZES = ['Small', 'Medium', 'Large', 'X-Large'] as const;
export type JobSize = (typeof JOB_SIZES)[number];

const FRACTION: Record<JobSize, number> = {
  Small: 0,
  Medium: 0.4,
  Large: 0.7,
  'X-Large': 1,
};

export function repairPrice(service: RepairService, size: JobSize): number {
  if (service.flatRate) return service.priceFrom;
  return Math.round(service.priceFrom + FRACTION[size] * (service.priceTo - service.priceFrom));
}
