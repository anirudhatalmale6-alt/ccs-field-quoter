import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { brand, money } from '../brand';
import { customerName, listQuotes, subscribe, totals } from '../lib/quotes';
import type { Quote } from '../lib/types';

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Schedule() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>(() => listQuotes());
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));

  useEffect(() => subscribe(() => setQuotes(listQuotes())), []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(anchor);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [anchor]
  );

  const booked = quotes.filter((q) => q.booking?.date);
  const unscheduled = quotes.filter((q) => q.status === 'signed' && !q.booking?.date);

  const shift = (weeks: number) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + weeks * 7);
    setAnchor(d);
  };

  return (
    <>
      <Topbar
        title="Schedule"
        actions={
          <>
            <button className="btn sm" onClick={() => shift(-1)}>
              ‹ Prev
            </button>
            <button className="btn sm" onClick={() => setAnchor(startOfWeek(new Date()))}>
              This week
            </button>
            <button className="btn sm" onClick={() => shift(1)}>
              Next ›
            </button>
          </>
        }
      />
      <div className="content">
        <div className="page" style={{ maxWidth: 1180 }}>
          <div className="hero">
            <p className="eyebrow">Install board</p>
            <h2>
              Week of{' '}
              {anchor.toLocaleDateString(brand.locale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <p>
              Every quote a customer finalises lands here automatically with its arrival window.
            </p>
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}
          >
            {days.map((d) => {
              const key = iso(d);
              const jobs = booked.filter((q) => q.booking!.date === key);
              const today = key === iso(new Date());
              return (
                <section
                  key={key}
                  className="card"
                  style={{ padding: 12, borderColor: today ? 'var(--accent)' : undefined }}
                >
                  <div style={{ fontWeight: 800 }}>
                    {d.toLocaleDateString(brand.locale, { weekday: 'short' })}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                    {d.toLocaleDateString(brand.locale, { day: 'numeric', month: 'short' })}
                  </div>

                  {jobs.length === 0 && (
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      —
                    </div>
                  )}

                  {jobs.map((q) => (
                    <article
                      key={q.id}
                      className="card"
                      style={{
                        padding: 10,
                        marginBottom: 8,
                        boxShadow: 'none',
                        cursor: 'pointer',
                        background: 'rgba(var(--accent-rgb),.07)',
                      }}
                      onClick={() => navigate(`/quotes/${q.id}/summary`)}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{customerName(q)}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {q.booking!.slot}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4 }}>
                        {money(totals(q).total)}
                      </div>
                    </article>
                  ))}
                </section>
              );
            })}
          </div>

          <section className="card">
            <p className="eyebrow">Signed, not yet booked</p>
            <h3 style={{ fontSize: 20, margin: '6px 0 10px' }}>Waiting for a date</h3>
            {unscheduled.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Nothing waiting — every signed quote has an install date.
              </p>
            ) : (
              <div className="grid two">
                {unscheduled.map((q) => (
                  <article
                    key={q.id}
                    className="card"
                    style={{ padding: 12, cursor: 'pointer' }}
                    onClick={() => navigate(`/quotes/${q.id}/summary`)}
                  >
                    <div style={{ fontWeight: 700 }}>{customerName(q)}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      {q.number} · {money(totals(q).total)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
