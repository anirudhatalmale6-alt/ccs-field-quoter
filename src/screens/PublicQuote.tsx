import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { brand, money } from '../brand';
import { calculate, REGISTRATION_FEE } from '../lib/finance';
import { customerName, getQuoteByToken, totals } from '../lib/quotes';

/**
 * What the customer sees when they open the link the technician sent them.
 * No login, no navigation — just the proposal.
 */
export default function PublicQuote() {
  const { token } = useParams();
  const quote = useMemo(() => (token ? getQuoteByToken(token) : null), [token]);

  if (!quote) {
    return (
      <div className="login-main" style={{ minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 420 }}>
          <h2 style={{ fontSize: 24 }}>Quote not found</h2>
          <p className="muted">This quote link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  const t = totals(quote);
  const finance = calculate({ ...quote.finance, amount: t.total });
  const headline = finance.phases.find((p) => p.highlight) ?? finance.phases[0];

  return (
    <div className="content" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="page">
        <header className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="logo-mark" style={{ width: 48, height: 48, fontSize: 15 }}>
            {brand.initials}
          </span>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 19 }}>
              {brand.name}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {[brand.phone, brand.email, brand.website].filter(Boolean).join(' · ') || brand.tagline}
            </div>
          </div>
          <div className="spacer" />
          <span className="pill grey">{quote.number}</span>
        </header>

        <div className="hero">
          <p className="eyebrow">Prepared for</p>
          <h2>{customerName(quote)}</h2>
          <p>
            {[quote.customer.address, quote.customer.city, quote.customer.postalCode]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>

        <section className="card flush">
          <table>
            <thead>
              <tr>
                <th>Your package</th>
                <th className="num">Qty</th>
                <th className="num">Total</th>
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
                  <td className="num">{l.qty}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {money(l.unitPrice * l.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="totals">
            <div className="line">
              <span className="muted">Subtotal</span>
              <span>{money(t.subtotal)}</span>
            </div>
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

        {quote.finance.enabled && headline && (
          <section className="card">
            <p className="eyebrow">Or pay monthly</p>
            <div className="finance-phase hl" style={{ marginTop: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{headline.label}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {headline.aprLabel}
                </div>
              </div>
              <b>{money(headline.monthly, 2)}/mo</b>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              On approved credit. A one-time {money(REGISTRATION_FEE, 2)} registration fee applies.
            </p>
          </section>
        )}

        {quote.booking?.date && (
          <section className="card">
            <p className="eyebrow">Your installation</p>
            <h3 style={{ fontSize: 20, margin: '6px 0 0' }}>
              {new Date(quote.booking.date + 'T00:00:00').toLocaleDateString(brand.locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              · {quote.booking.slot}
            </h3>
          </section>
        )}

        <div className="row no-print" style={{ justifyContent: 'center', paddingBottom: 30 }}>
          <button className="btn primary" onClick={() => window.print()}>
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
