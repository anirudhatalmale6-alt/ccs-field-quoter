import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { money } from '../brand';
import type { User } from '../lib/auth';
import { allProducts } from '../lib/catalog';
import { customerName, listQuotes, newQuote, saveQuote, subscribe, totals } from '../lib/quotes';
import type { Quote } from '../lib/types';

export default function Dashboard({ user }: { user: User }) {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>(() => listQuotes());

  useEffect(() => subscribe(() => setQuotes(listQuotes())), []);

  const open = quotes.filter((q) => q.status === 'draft' || q.status === 'sent');
  const booked = quotes.filter((q) => q.booking?.date);
  const pipeline = open.reduce((sum, q) => sum + totals(q).total, 0);

  const start = () => {
    const q = saveQuote(newQuote(user.username));
    navigate(`/quotes/${q.id}/home-details`);
  };

  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <button className="btn primary" onClick={start}>
            + New quote
          </button>
        }
      />
      <div className="content">
        <div className="page">
          <div className="hero">
            <p className="eyebrow">Field quoter</p>
            <h2>Welcome back, {user.displayName.split(' ')[0]}.</h2>
            <p>
              Build a full proposal at the kitchen table — products and pricing, a monthly payment,
              then book the install before you leave.
            </p>
            <button className="btn primary" style={{ marginTop: 16 }} onClick={start}>
              Start a new quote
            </button>
          </div>

          <div className="grid three">
            <div className="stat">
              <b>{open.length}</b>
              <span>Open quotes</span>
            </div>
            <div className="stat">
              <b>{money(pipeline)}</b>
              <span>Pipeline value</span>
            </div>
            <div className="stat">
              <b>{booked.length}</b>
              <span>Installs booked</span>
            </div>
            <div className="stat">
              <b>{allProducts().length}</b>
              <span>Products in catalogue</span>
            </div>
          </div>

          <section className="card flush">
            <div style={{ padding: '18px 18px 0' }}>
              <p className="eyebrow">Recent</p>
              <h3 style={{ fontSize: 20, margin: '6px 0 12px' }}>Latest quotes</h3>
            </div>
            {quotes.length === 0 ? (
              <div className="empty" style={{ margin: 18, border: 'none' }}>
                No quotes yet. Hit “New quote” to build your first one.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Quote</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.slice(0, 6).map((q) => (
                    <tr
                      key={q.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/quotes/${q.id}/summary`)}
                    >
                      <td style={{ fontWeight: 700 }}>{q.number}</td>
                      <td>{customerName(q)}</td>
                      <td>
                        <span className="pill grey">{q.status}</span>
                      </td>
                      <td className="num">{money(totals(q).total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
