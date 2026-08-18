import { useMemo, useState } from 'react';
import { brand, money } from '../../brand';
import type { User } from '../../lib/auth';
import {
  BUYDOWN_MONTHS,
  BUYDOWN_RATES,
  DEFERRAL_MONTH_OPTIONS,
  MIN_FINANCED,
  PLAN_LABELS,
  REGISTRATION_FEE,
  calculate,
  planDescription,
  termsFor,
  type PlanId,
} from '../../lib/finance';
import { removeLine, setLineQty, shareUrl, totals, customerName } from '../../lib/quotes';
import type { Quote } from '../../lib/types';

const SLOTS = ['Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)'];

export default function SummaryStep({
  quote,
  onChange,
  user,
}: {
  quote: Quote;
  onChange: (q: Quote) => void;
  user: User;
}) {
  const [copied, setCopied] = useState(false);
  const t = useMemo(() => totals(quote), [quote]);

  const finance = { ...quote.finance, amount: t.total };
  const result = useMemo(() => calculate(finance), [finance]);
  const terms = termsFor(finance.plan, finance.amount);

  const setFinance = (patch: Partial<typeof finance>) => {
    const next = { ...quote.finance, ...patch };
    // keep the term valid when the plan changes
    const allowed = termsFor(next.plan, t.total);
    if (!allowed.includes(next.amortMonths)) next.amortMonths = allowed[0];
    onChange({ ...quote, finance: next });
  };

  const link = shareUrl(quote);
  const message = `Hi ${quote.customer.firstName || 'there'}, here is your ${brand.name} quote ${quote.number} for ${money(t.total)}: ${link}`;

  const smsHref = `sms:${quote.customer.phone.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(message)}`;
  const mailHref = `mailto:${quote.customer.email}?subject=${encodeURIComponent(
    `Your ${brand.name} quote ${quote.number}`
  )}&body=${encodeURIComponent(message)}`;

  const copy = async () => {
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalize = () => {
    onChange({
      ...quote,
      status: 'signed',
      booking: quote.booking ?? { date: '', slot: SLOTS[0], notes: '' },
    });
  };

  const book = (patch: Partial<NonNullable<Quote['booking']>>) => {
    const booking = { date: '', slot: SLOTS[0], notes: '', ...quote.booking, ...patch };
    onChange({ ...quote, booking, status: booking.date ? 'scheduled' : quote.status });
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      {/* ------------------------------------------------------------ lines */}
      <section className="card flush">
        <div style={{ padding: '18px 18px 0' }}>
          <p className="eyebrow">Proposal for {customerName(quote)}</p>
          <h3 style={{ fontSize: 24, margin: '6px 0 2px' }}>Your recommended package</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Quote {quote.number} · prepared by {user.displayName}
          </p>
        </div>

        {quote.lines.length === 0 ? (
          <div className="empty" style={{ margin: 18, border: 'none' }}>
            Nothing added yet. Step back through the sections and add the options you are
            recommending.
          </div>
        ) : (
          <table style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Price</th>
                <th className="num">Total</th>
                <th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{l.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {l.detail}
                    </div>
                  </td>
                  <td className="num" style={{ width: 92 }}>
                    <input
                      className="no-print"
                      type="number"
                      min={1}
                      value={l.qty}
                      style={{ width: 72, textAlign: 'right' }}
                      onChange={(e) => onChange(setLineQty(quote, l.id, Number(e.target.value)))}
                    />
                  </td>
                  <td className="num">{money(l.unitPrice)}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {money(l.unitPrice * l.qty)}
                  </td>
                  <td className="num no-print">
                    <button className="btn ghost sm danger" onClick={() => onChange(removeLine(quote, l.id))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ----------------------------------------------------------- totals */}
      <div className="grid two" style={{ alignItems: 'start' }}>
        <section className="card">
          <p className="eyebrow">Discount &amp; tax</p>
          <div className="grid two" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Discount</label>
              <input
                type="number"
                min={0}
                value={quote.discount.value}
                onChange={(e) =>
                  onChange({
                    ...quote,
                    discount: { ...quote.discount, value: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div className="field">
              <label>Type</label>
              <select
                value={quote.discount.kind}
                onChange={(e) =>
                  onChange({
                    ...quote,
                    discount: { ...quote.discount, kind: e.target.value as 'amount' | 'percent' },
                  })
                }
              >
                <option value="amount">Fixed amount</option>
                <option value="percent">Percent</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="totals">
            <div className="line">
              <span className="muted">Subtotal</span>
              <span>{money(t.subtotal)}</span>
            </div>
            {t.savings > 0 && (
              <div className="line">
                <span className="muted">Package saving</span>
                <span style={{ color: 'var(--good)' }}>−{money(t.savings)}</span>
              </div>
            )}
            {t.discount > 0 && (
              <div className="line">
                <span className="muted">Discount</span>
                <span style={{ color: 'var(--good)' }}>−{money(t.discount)}</span>
              </div>
            )}
            <div className="line">
              <span className="muted">{brand.taxLabel}</span>
              <span>{money(t.tax)}</span>
            </div>
            <div className="line grand">
              <span>Total</span>
              <span>{money(t.total)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* -------------------------------------------------------- financing */}
      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <p className="eyebrow">Monthly payment option</p>
            <h3 style={{ fontSize: 22, margin: '6px 0 0' }}>Financing</h3>
          </div>
          <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={quote.finance.enabled}
              style={{ width: 18, height: 18 }}
              onChange={(e) => setFinance({ enabled: e.target.checked })}
            />
            <span style={{ fontWeight: 700 }}>Show on the proposal</span>
          </label>
        </div>

        <div className="row wrap" style={{ gap: 8, marginTop: 16 }}>
          {(Object.keys(PLAN_LABELS) as PlanId[]).map((p) => (
            <button
              key={p}
              className={`chip${finance.plan === p ? ' on' : ''}`}
              onClick={() => setFinance({ plan: p })}
            >
              {PLAN_LABELS[p]}
            </button>
          ))}
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          {planDescription(finance)}
        </p>

        <div className="grid three" style={{ marginTop: 8 }}>
          <div className="field">
            <label>Financed amount</label>
            <input type="text" value={money(t.total, 2)} readOnly />
            <span className="hint">Follows the quote total.</span>
          </div>
          <div className="field">
            <label>Down payment</label>
            <input
              type="number"
              min={0}
              value={quote.finance.downPayment}
              onChange={(e) => setFinance({ downPayment: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Amortization</label>
            <select
              value={finance.amortMonths}
              onChange={(e) => setFinance({ amortMonths: Number(e.target.value) })}
            >
              {terms.map((m) => (
                <option key={m} value={m}>
                  {m} months ({Math.round((m / 12) * 10) / 10} yr)
                </option>
              ))}
            </select>
          </div>

          {finance.plan === 'deferral' && (
            <div className="field">
              <label>Deferral</label>
              <select
                value={finance.deferralMonths ?? 6}
                onChange={(e) => setFinance({ deferralMonths: Number(e.target.value) })}
              >
                {DEFERRAL_MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} months
                  </option>
                ))}
              </select>
            </div>
          )}

          {finance.plan === 'buydown' && (
            <>
              <div className="field">
                <label>Intro rate</label>
                <select
                  value={finance.buydownRate ?? 8.95}
                  onChange={(e) => setFinance({ buydownRate: Number(e.target.value) })}
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
                  value={finance.buydownMonths ?? 36}
                  onChange={(e) => setFinance({ buydownMonths: Number(e.target.value) })}
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

        <div className="grid" style={{ gap: 8, marginTop: 16 }}>
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

        {result.principal > 0 && (
          <p className="muted" style={{ marginTop: 12, fontSize: 13.5 }}>
            Total paid {money(result.totalPaid, 2)} · interest {money(result.totalInterest, 2)} ·
            payoff {result.payoffMonths} months
            {result.monthsEarly > 0 && ` (${result.monthsEarly} months early)`} · plus a one-time{' '}
            {money(REGISTRATION_FEE, 2)} registration fee.
          </p>
        )}
      </section>

      {/* ------------------------------------------------------------ share */}
      <section className="card no-print">
        <p className="eyebrow">Send it to the customer</p>
        <h3 style={{ fontSize: 22, margin: '6px 0 4px' }}>Share this quote</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Opens your own messaging app with the link ready to send — no cost, works anywhere you
          have signal.
        </p>

        <div className="row wrap" style={{ marginTop: 14, gap: 10 }}>
          <a
            className={`btn primary${quote.customer.phone ? '' : ' disabled'}`}
            href={smsHref}
            aria-disabled={!quote.customer.phone}
          >
            Send to phone
          </a>
          <a className="btn" href={mailHref}>
            Send by email
          </a>
          <button className="btn" onClick={copy}>
            {copied ? '✓ Link copied' : 'Copy link'}
          </button>
          <button className="btn" onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Customer link</label>
          <input type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        </div>
      </section>

      {/* --------------------------------------------------------- finalize */}
      <section className="card no-print">
        <p className="eyebrow">Close the sale</p>
        <h3 style={{ fontSize: 22, margin: '6px 0 4px' }}>Finalise &amp; book the install</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Picking a date puts this job straight onto the schedule board.
        </p>

        {!quote.booking ? (
          <button className="btn primary" style={{ marginTop: 12 }} onClick={finalize} disabled={!quote.lines.length}>
            Finalise this quote
          </button>
        ) : (
          <div className="grid three" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Install date</label>
              <input
                type="date"
                value={quote.booking.date}
                onChange={(e) => book({ date: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Arrival window</label>
              <select value={quote.booking.slot} onChange={(e) => book({ slot: e.target.value })}>
                {SLOTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Notes for the crew</label>
              <input value={quote.booking.notes} onChange={(e) => book({ notes: e.target.value })} />
            </div>
          </div>
        )}

        {quote.booking?.date && (
          <p className="pill good" style={{ marginTop: 14, padding: '8px 14px' }}>
            Booked for {new Date(quote.booking.date + 'T00:00:00').toLocaleDateString(brand.locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            · {quote.booking.slot}
          </p>
        )}
      </section>
    </div>
  );
}
