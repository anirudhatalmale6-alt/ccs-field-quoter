import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { money } from '../brand';
import type { User } from '../lib/auth';
import { can } from '../lib/auth';
import {
  customerName,
  duplicateQuote,
  listQuotes,
  newQuote,
  removeQuote,
  saveQuote,
  subscribe,
  totals,
} from '../lib/quotes';
import type { Quote, QuoteStatus } from '../lib/types';

const COLUMNS: { key: QuoteStatus; label: string; hint: string }[] = [
  { key: 'draft', label: 'Drafts', hint: 'Still being prepared' },
  { key: 'sent', label: 'Sent', hint: 'Waiting on the customer' },
  { key: 'signed', label: 'Signed', hint: 'Ready to schedule' },
  { key: 'scheduled', label: 'Scheduled', hint: 'Install booked' },
  { key: 'cancelled', label: 'Cancelled', hint: 'No longer active' },
];

export default function QuotesPipeline({ user }: { user: User }) {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>(() => listQuotes());
  const [search, setSearch] = useState('');

  useEffect(() => subscribe(() => setQuotes(listQuotes())), []);

  const visible = useMemo(() => {
    const mine = can(user, 'quotes.view_all')
      ? quotes
      : quotes.filter((q) => q.createdBy === user.username);
    const needle = search.trim().toLowerCase();
    if (!needle) return mine;
    return mine.filter((q) =>
      [q.number, customerName(q), q.customer.phone, q.customer.email, q.customer.address]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [quotes, search, user]);

  const start = () => {
    const q = saveQuote(newQuote(user.username));
    navigate(`/quotes/${q.id}/home-details`);
  };

  return (
    <>
      <Topbar
        title="Quotes"
        actions={
          <button className="btn primary" onClick={start}>
            + New quote
          </button>
        }
      />
      <div className="content">
        <div className="page" style={{ maxWidth: 1180 }}>
          <div className="hero">
            <p className="eyebrow">Sales workflow</p>
            <h2>Quotes pipeline</h2>
            <p>Follow every proposal from draft through to a booked installation.</p>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <input
              type="text"
              placeholder="Search customer, quote number, phone or address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))' }}>
            {COLUMNS.map((col) => {
              const items = visible.filter((q) => q.status === col.key);
              return (
                <section key={col.key} className="card" style={{ padding: 14 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '.06em' }}>
                        {col.label.toUpperCase()}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {col.hint}
                      </div>
                    </div>
                    <span className="pill grey">{items.length}</span>
                  </div>

                  <div className="grid" style={{ gap: 8, marginTop: 12 }}>
                    {items.length === 0 && (
                      <div className="empty" style={{ padding: 20, fontSize: 13 }}>
                        Nothing here yet
                      </div>
                    )}
                    {items.map((q) => (
                      <article
                        key={q.id}
                        className="card"
                        style={{ padding: 12, cursor: 'pointer', boxShadow: 'none' }}
                        onClick={() => navigate(`/quotes/${q.id}/summary`)}
                      >
                        <div style={{ fontWeight: 700 }}>{customerName(q)}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {q.number} · {q.lines.length} item{q.lines.length === 1 ? '' : 's'}
                        </div>
                        <div style={{ fontWeight: 800, marginTop: 6 }}>{money(totals(q).total)}</div>
                        <div className="row no-print" style={{ gap: 6, marginTop: 8 }}>
                          <button
                            className="btn ghost sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const copy = duplicateQuote(q.id);
                              if (copy) navigate(`/quotes/${copy.id}/summary`);
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            className="btn ghost sm danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete quote ${q.number}?`)) removeQuote(q.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
