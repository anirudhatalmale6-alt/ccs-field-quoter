/**
 * Battery backup savings estimate.
 *
 * A home battery charges overnight on cheap power and discharges through the
 * expensive hours, so the saving is the gap between what the household pays for
 * energy today and what it would pay buying almost all of it off-peak.
 *
 * Same model and constants as the original quoter.
 */

/** Default time-of-use split of a household's consumption. */
export const DEFAULT_SPLIT = { high: 0.4, mid: 0.3, low: 0.3 };

/** What the split becomes once a battery is shifting the load. */
const BATTERY_SPLIT = { mid: 0.2, low: 0.8 };

/** Only the energy portion of the bill can be shifted — the rest is delivery and fixed charges. */
const SHIFTABLE_SHARE = 0.6;

/** Ontario time-of-use rates, editable on screen. */
export const DEFAULT_RATES = { high: 0.158, mid: 0.122, low: 0.076 };

export interface BatteryInput {
  avgMonthlyBill: number | null;
  highPeakRate: number | null;
  midPeakRate: number | null;
  lowPeakRate: number | null;
  usageSplit?: { high: number; mid: number; low: number } | null;
}

export interface BatterySavings {
  monthly: number;
  annual: number;
  currentRate: number;
  batteryRate: number;
  percent: number;
}

/** Normalise a usage split to fractions that add up to 1. */
function normaliseSplit(split: BatteryInput['usageSplit']) {
  if (!split) return null;
  const total = (split.high ?? 0) + (split.mid ?? 0) + (split.low ?? 0);
  if (total <= 0) return null;
  return { high: split.high / total, mid: split.mid / total, low: split.low / total };
}

export function batterySavings(input: BatteryInput): BatterySavings | null {
  const { avgMonthlyBill, highPeakRate, midPeakRate, lowPeakRate } = input;
  if (!avgMonthlyBill || avgMonthlyBill <= 0) return null;
  if (highPeakRate == null || midPeakRate == null || lowPeakRate == null) return null;

  const split = normaliseSplit(input.usageSplit) ?? DEFAULT_SPLIT;

  const currentRate =
    highPeakRate * split.high + midPeakRate * split.mid + lowPeakRate * split.low;
  const batteryRate = lowPeakRate * BATTERY_SPLIT.low + midPeakRate * BATTERY_SPLIT.mid;
  if (currentRate <= 0) return null;

  const fraction = Math.max(0, 1 - batteryRate / currentRate);
  const monthly = Math.round(avgMonthlyBill * SHIFTABLE_SHARE * fraction);

  return {
    monthly,
    annual: monthly * 12,
    currentRate,
    batteryRate,
    percent: Math.round(fraction * 100),
  };
}
