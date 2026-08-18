import { useMemo, useState } from 'react';
import Topbar from '../components/Topbar';
import { money } from '../brand';
import {
  BUYDOWN_MONTHS,
  BUYDOWN_RATES,
  DEFERRAL_MONTH_OPTIONS,
  MIN_FINANCED,
  PLAN_LABELS,
  REGISTRATION_FEE,
  calculate,
  defaultFinance,
  planDescription,
  termsFor,
  type FinanceInput,
  type PlanId,
} from '../lib/finance';

export default function FinanceCalculator() {
  const [input, setInput] = useState<FinanceInput>({
    ...defaultFinance,
    enabled: true,
    amount: 10000,
  });

  const terms = termsFor(input.plan, input.amount);
  const result = useMemo(() => calculate(input), [input]);

  const patch = (p: Partial<FinanceInput>) => {
    const next = { ...input, ...p };
    const allowed = termsFor(next.plan, next.amount);
    if (!allowed.includes(next.amortMonths)) next.amortMonths = allowed[0];
    setInput(next);
  };

  return (
    <>
      <Topbar title="Financing" />
      <div className="content">
        <div className="page">
          <div className="hero">
            <p className="eyebrow">Rate card</p>
            <h2>Financing calculator</h2>
            <p>
              The same engine that prices the financing offer on every quote. Use it to answer “what
              would that cost a month?” on the spot.
            </p>
          </div>

          <section className="card">
            <div className="row wrap" style={{ gap: 8 }}>
              {(Object.keys(PLAN_LABELS) as PlanId[]).map((p) => (
                <button
                  key={p}
                  className={`chip${input.plan === p ? ' on' : ''}`}
                  onClick={() => patch({ plan: p })}
                >
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>

            <p className="muted" style={{ marginTop: 14 }}>
              {planDescription(input)}
            </p>

            <div className="grid three" style={{ marginTop: 8 }}>
              <div className="field">
                <label>Financed amount</label>
                <input
                  type="number"
                  min={0}
                  value={input.amount}
                  onChange={(e) => patch({ amount: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Down payment</label>
                <input
                  type="number"
                  min={0}
                  value={input.downPayment}
                  onChange={(e) => patch({ downPayment: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Amortization</label>
                <select
                  value={input.amortMonths}
                  onChange={(e) => patch({ amortMonths: Number(e.target.value) })}
                >
                  {terms.map((m) => (
                    <option key={m} value={m}>
                      {m} months ({Math.round((m / 12) * 10) / 10} yr)
                    </option>
                  ))}
                </select>
              </div>

              {input.plan === 'deferral' && (
                <div className="field">
                  <label>Deferral</label>
                  <select
                    value={input.deferralMonths ?? 6}
                    onChange={(e) => patch({ deferralMonths: Number(e.target.value) })}
                  >
                    {DEFERRAL_MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} months
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {input.plan === 'buydown' && (
                <>
                  <div className="field">
                    <label>Intro rate</label>
                    <select
                      value={input.buydownRate ?? 8.95}
                      onChange={(e) => patch({ buydownRate: Number(e.target.value) })}
                    >
                      {BUYDOWN_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Intro period</label>
                    <select
                      value={input.buydownMonths ?? 36}
                      onChange={(e) => patch({ buydownMonths: Number(e.target.value) })}
                    >
                      {BUYDOWN_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m} months
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card">
            <p className="eyebrow">Monthly payment</p>
            <div className="grid" style={{ gap: 8, marginTop: 12 }}>
              {result.phases.map((p) => (
                <div key={p.label} className={`finance-phase${p.highlight ? ' hl' : ''}`}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.label}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {p.aprLabel}
                    </div>
                  </div>
                  <b>{money(p.monthly, 2)}/mo</b>
                </div>
              ))}
            </div>

            {result.belowMin && (
              <p className="pill warn" style={{ marginTop: 12, padding: '8px 14px' }}>
                Financing needs a minimum of {money(MIN_FINANCED)}.
              </p>
            )}

            <div className="totals" style={{ marginTop: 18 }}>
              <div className="line">
                <span className="muted">Principal</span>
                <span>{money(result.principal, 2)}</span>
              </div>
              <div className="line">
                <span className="muted">Total paid</span>
                <span>{money(result.totalPaid, 2)}</span>
              </div>
              <div className="line">
                <span className="muted">Interest</span>
                <span>{money(result.totalInterest, 2)}</span>
              </div>
              <div className="line">
                <span className="muted">Payoff</span>
                <span>
                  {result.payoffMonths} months
                  {result.monthsEarly > 0 && ` (${result.monthsEarly} early)`}
                </span>
              </div>
              <div className="line">
                <span className="muted">Registration fee</span>
                <span>+{money(REGISTRATION_FEE, 2)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
