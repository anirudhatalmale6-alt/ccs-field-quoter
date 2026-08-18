/**
 * Differential test: our finance engine vs the original quoter's, across every
 * plan / term / amount / down-payment combination. Any mismatch is a failure.
 *
 *   node scripts/verify-finance.mjs
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = path.join(here, '.finance.build.mjs');

await build({
  entryPoints: [path.join(here, '..', 'src', 'lib', 'finance.ts')],
  outfile: tmp,
  format: 'esm',
  bundle: false,
  logLevel: 'silent',
});

const ours = await import(`file://${tmp}`);
const orig = await import(
  'file:///var/lib/freelancer/projects/40655849/ccs-quoter/extract/finance-Cg8aqgFd.js'
);

// original export map (from `export{D as A,L as B,f as D,_ as E,N as M,O as P,S as R,$ as a,w as b,q as c,F as d,I as e,x as f,E as m,C as p}`)
const origCalculate = orig.c;
const origTerms = orig.a;
const origDealerCost = orig.d;
const origDescription = orig.p;
const origFee = orig.R;
const origMin = orig.M;

const PLANS = ['standard', 'deferral', 'equal12', 'buydown', 'stretch'];
const AMOUNTS = [0, 500, 999, 1000, 2800, 4500, 8600, 10000, 10001, 15400, 27500, 64000];
const DOWNS = [0, 500, 2000, 9000];
const DEFERRALS = [3, 6, 9, 12];
const BUYDOWN_RATES = [8.95, 9.95];
const BUYDOWN_MONTHS = [24, 36, 48, 60];

const round = (n) => (typeof n === 'number' ? Math.round(n * 1e6) / 1e6 : n);
const norm = (r) => ({
  principal: round(r.principal),
  payoffMonths: r.payoffMonths,
  totalPaid: round(r.totalPaid),
  totalInterest: round(r.totalInterest),
  monthsEarly: r.monthsEarly,
  belowMin: r.belowMin,
  phases: r.phases.map((p) => ({
    label: p.label,
    aprLabel: p.aprLabel,
    monthly: round(p.monthly),
    highlight: !!p.highlight,
  })),
});

let checks = 0;
const failures = [];

const compare = (label, a, b) => {
  checks++;
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x !== y) failures.push({ label, ours: x, original: y });
};

// constants
compare('REGISTRATION_FEE', ours.REGISTRATION_FEE, origFee);
compare('MIN_FINANCED', ours.MIN_FINANCED, origMin);

for (const plan of PLANS) {
  for (const amount of AMOUNTS) {
    compare(`termsFor(${plan}, ${amount})`, ours.termsFor(plan, amount), origTerms(plan, amount));

    for (const amortMonths of ours.termsFor(plan, amount)) {
      for (const downPayment of DOWNS) {
        const variants = [];
        if (plan === 'deferral') {
          for (const d of DEFERRALS) variants.push({ deferralMonths: d });
        } else if (plan === 'buydown') {
          for (const r of BUYDOWN_RATES)
            for (const m of BUYDOWN_MONTHS) variants.push({ buydownRate: r, buydownMonths: m });
        } else {
          variants.push({});
        }

        for (const extra of variants) {
          const input = { enabled: true, amount, downPayment, plan, amortMonths, ...extra };
          const label = JSON.stringify(input);
          compare(`calculate ${label}`, norm(ours.calculate(input)), norm(origCalculate(input)));
          compare(`dealerCost ${label}`, ours.dealerCost(input), origDealerCost(input));
          compare(`description ${label}`, ours.planDescription(input), origDescription(input));
        }
      }
    }
  }
}

fs.rmSync(tmp, { force: true });

console.log(`ran ${checks} comparisons across ${PLANS.length} plans`);
if (failures.length === 0) {
  console.log('PASS — every value matches the original quoter exactly.');
} else {
  console.log(`FAIL — ${failures.length} mismatches`);
  for (const f of failures.slice(0, 10)) {
    console.log('\n ', f.label);
    console.log('   ours    :', f.ours);
    console.log('   original:', f.original);
  }
  process.exitCode = 1;
}
