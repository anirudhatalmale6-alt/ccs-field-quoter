/**
 * Financing engine.
 *
 * Rebuilt to match the original quoter's Abode Financial rate card exactly —
 * same rate-factor table, same plan rules, same rounding. Verified against the
 * live calculator (see scripts/verify-finance.mjs).
 */

export const MIN_FINANCED = 1000;
export const REGISTRATION_FEE = 99.95;

export const STANDARD_APR = 12.95;
export const DEFERRAL_APR = 14.95;
export const STRETCH_APR = 16.95;

/** Published monthly factors for the standard plan. Used in preference to the
 *  amortisation formula so the payments match the printed rate card. */
const STANDARD_FACTORS: Record<number, number> = {
  60: 0.0222,
  120: 0.0143,
  144: 0.0131,
  180: 0.012,
};

/** The deferral plan has one published factor; every other term is computed. */
const DEFERRAL_FACTORS: Record<number, number> = { 180: 0.014 };

export type PlanId = 'standard' | 'deferral' | 'equal12' | 'buydown' | 'stretch';

export const PLAN_TERMS: Record<PlanId, number[]> = {
  standard: [60, 120, 144, 180],
  deferral: [60, 120, 144, 180],
  equal12: [12],
  buydown: [120, 144, 180],
  stretch: [60, 120, 144, 180],
};

export const PLAN_LABELS: Record<PlanId, string> = {
  standard: `Standard · ${STANDARD_APR}%`,
  deferral: 'Deferred start',
  equal12: '12 × 0%',
  buydown: 'Rate buydown',
  stretch: `Stretch · ${STRETCH_APR}%`,
};

export const DEFERRAL_MONTH_OPTIONS = [3, 6];
export const BUYDOWN_RATES = [8.95, 9.95];
export const BUYDOWN_MONTHS = [24, 36, 48, 60];

const EXTENDED_TERM = 240;
const EXTENDED_TERM_THRESHOLD = 10000;

/** Terms available for a plan. The 240-month term only unlocks above $10,000. */
export function termsFor(plan: PlanId, amount: number): number[] {
  const base = PLAN_TERMS[plan];
  return amount > EXTENDED_TERM_THRESHOLD && plan !== 'equal12'
    ? [...base, EXTENDED_TERM]
    : base;
}

/** Dealer cost of the plan, as a percentage of the financed amount. */
const DEFERRAL_DEALER_COST: Record<number, number> = { 3: 2.95, 6: 6.5, 9: 9.5, 12: 12.5 };
const BUYDOWN_DEALER_COST: Record<number, Record<number, number>> = {
  8.95: { 24: 5.95, 36: 7.95, 48: 8.95, 60: 9.95 },
  9.95: { 24: 4.95, 36: 5.95, 48: 7.95, 60: 8.95 },
};

export interface FinanceInput {
  enabled: boolean;
  amount: number;
  downPayment: number;
  plan: PlanId;
  amortMonths: number;
  deferralMonths?: number;
  buydownRate?: number;
  buydownMonths?: number;
  /** legacy quotes stored a plain term — migrated on read */
  termMonths?: number;
}

export const defaultFinance: FinanceInput = {
  enabled: false,
  amount: 0,
  downPayment: 0,
  plan: 'standard',
  amortMonths: 120,
};

export interface FinancePhase {
  label: string;
  aprLabel: string;
  monthly: number;
  highlight?: boolean;
}

export interface FinanceResult {
  principal: number;
  phases: FinancePhase[];
  payoffMonths: number;
  totalPaid: number;
  totalInterest: number;
  monthsEarly: number;
  belowMin: boolean;
}

export function dealerCost(input: FinanceInput): number | null {
  switch (input.plan) {
    case 'standard':
      return 0;
    case 'equal12':
      return 12;
    case 'deferral':
      return DEFERRAL_DEALER_COST[input.deferralMonths ?? 6] ?? null;
    case 'buydown':
      return BUYDOWN_DEALER_COST[input.buydownRate ?? 8.95]?.[input.buydownMonths ?? 36] ?? null;
    default:
      return null;
  }
}

export function planDescription(input: FinanceInput): string {
  const years = Math.round((input.amortMonths / 12) * 10) / 10;
  switch (input.plan) {
    case 'equal12':
      return '12 equal monthly payments · 0% interest';
    case 'deferral': {
      const d = input.deferralMonths ?? 6;
      return `No payments for ${d} months, then ${DEFERRAL_APR}% APR · ${years}-year amortization (${d + input.amortMonths} months total)`;
    }
    case 'buydown':
      return `${input.buydownRate ?? 8.95}% APR for the first ${input.buydownMonths ?? 36} months, then ${STANDARD_APR}% · ${years}-year amortization`;
    case 'stretch':
      return `${STRETCH_APR}% APR · ${years}-year amortization`;
    default:
      return `${STANDARD_APR}% APR · ${years}-year amortization`;
  }
}

/** Standard amortised payment. */
export function payment(apr: number, months: number, principal: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const r = apr / 100 / 12;
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** Migrate a legacy `termMonths` quote onto the plan model. */
export function migrate(input: FinanceInput): FinanceInput {
  if (input.plan) return input;
  const term = input.termMonths ?? 120;
  const amort = PLAN_TERMS.standard.reduce(
    (best, t) => (Math.abs(t - term) < Math.abs(best - term) ? t : best),
    120
  );
  return { ...input, plan: 'standard', amortMonths: amort };
}

export function calculate(raw: FinanceInput): FinanceResult {
  const input = migrate(raw);
  const principal = Math.max(0, input.amount - Math.max(0, input.downPayment ?? 0));
  const belowMin = principal > 0 && principal < MIN_FINANCED;

  const result = (
    phases: FinancePhase[],
    payoffMonths: number,
    totalPaid: number,
    monthsEarly = 0
  ): FinanceResult => ({
    principal,
    phases,
    payoffMonths,
    totalPaid,
    totalInterest: Math.max(0, totalPaid - principal),
    monthsEarly,
    belowMin,
  });

  if (principal <= 0) return result([], 0, 0);

  if (input.plan === 'equal12') {
    const monthly = principal / 12;
    return result(
      [{ label: '12 equal payments', aprLabel: '0% interest', monthly, highlight: true }],
      12,
      principal
    );
  }

  if (input.plan === 'deferral') {
    const defer = input.deferralMonths ?? 6;
    const factor = DEFERRAL_FACTORS[input.amortMonths];
    const monthly =
      factor != null ? principal * factor : payment(DEFERRAL_APR, input.amortMonths, principal);
    return result(
      [
        { label: `First ${defer} months`, aprLabel: 'No payments', monthly: 0, highlight: true },
        { label: `Month ${defer + 1} onward`, aprLabel: `${DEFERRAL_APR}% APR`, monthly },
      ],
      defer + input.amortMonths,
      monthly * input.amortMonths
    );
  }

  if (input.plan === 'buydown') {
    const rate = input.buydownRate ?? 8.95;
    const introMonths = Math.min(input.buydownMonths ?? 36, input.amortMonths);
    const introPayment = payment(rate, input.amortMonths, principal);
    const afterPayment = payment(STANDARD_APR, input.amortMonths, principal);

    // amortise the intro period at the bought-down rate...
    const introRate = rate / 100 / 12;
    let balance = principal;
    for (let i = 0; i < introMonths; i++) balance = balance * (1 + introRate) - introPayment;
    balance = Math.max(0, balance);

    // ...then run the remaining balance at the standard rate to find the real payoff
    const stdRate = STANDARD_APR / 100 / 12;
    let months = 0;
    let finalPayment = 0;
    while (balance > 0.005 && months < input.amortMonths * 2) {
      const interest = balance * stdRate;
      finalPayment = Math.min(afterPayment, balance + interest);
      balance = balance + interest - finalPayment;
      months++;
    }

    const totalPaid =
      introPayment * introMonths + (months > 0 ? afterPayment * (months - 1) + finalPayment : 0);
    const payoffMonths = introMonths + months;

    return result(
      [
        {
          label: `Months 1–${introMonths}`,
          aprLabel: `${rate}% APR`,
          monthly: introPayment,
          highlight: true,
        },
        ...(months > 0
          ? [
              {
                label: `Month ${introMonths + 1} onward`,
                aprLabel: `${STANDARD_APR}% APR`,
                monthly: afterPayment,
              },
            ]
          : []),
      ],
      payoffMonths,
      totalPaid,
      Math.max(0, input.amortMonths - payoffMonths)
    );
  }

  if (input.plan === 'stretch') {
    const monthly = payment(STRETCH_APR, input.amortMonths, principal);
    return result(
      [
        {
          label: `${input.amortMonths} months`,
          aprLabel: `${STRETCH_APR}% APR`,
          monthly,
          highlight: true,
        },
      ],
      input.amortMonths,
      monthly * input.amortMonths
    );
  }

  // standard
  const factor = STANDARD_FACTORS[input.amortMonths];
  const monthly =
    factor != null ? principal * factor : payment(STANDARD_APR, input.amortMonths, principal);
  return result(
    [
      {
        label: `${input.amortMonths} months`,
        aprLabel: `${STANDARD_APR}% APR`,
        monthly,
        highlight: true,
      },
    ],
    input.amortMonths,
    monthly * input.amortMonths
  );
}
