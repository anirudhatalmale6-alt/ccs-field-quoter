import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Topbar from '../../components/Topbar';
import { sections } from '../../lib/catalog';
import { getQuote, saveQuote, totals, customerName } from '../../lib/quotes';
import { money } from '../../brand';
import type { Quote } from '../../lib/types';
import type { User } from '../../lib/auth';
import HomeDetailsStep from './HomeDetailsStep';
import SectionStep from './SectionStep';
import SummaryStep from './SummaryStep';

export interface StepDef {
  key: string;
  slug: string;
  label: string;
  icon?: string;
}

export const STEPS: StepDef[] = [
  { key: 'property', slug: 'home-details', label: 'Home Details', icon: '⌂' },
  ...sections.map((s) => ({ key: s.key, slug: slugFor(s.key), label: s.label, icon: s.icon })),
  { key: 'summary', slug: 'summary', label: 'Summary', icon: '✓' },
];

function slugFor(key: string) {
  return (
    {
      waterHeaters: 'water-heaters',
      heating: 'heating',
      cooling: 'ac-heat-pumps',
      insulation: 'attic-insulation',
      airQuality: 'air-purification',
      waterPurification: 'water-purification',
      battery: 'battery-storage',
    }[key] ?? key
  );
}

export default function Wizard({ user }: { user: User }) {
  const { id, '*': rest } = useParams();
  const navigate = useNavigate();
  const slug = (rest || 'home-details').split('/')[0];
  const [quote, setQuote] = useState<Quote | null>(() => (id ? getQuote(id) : null));

  useEffect(() => {
    if (id) setQuote(getQuote(id));
  }, [id]);

  const update = useCallback(
    (next: Quote) => {
      setQuote(next);
      saveQuote(next);
    },
    []
  );

  const idx = STEPS.findIndex((s) => s.slug === slug);
  const step = STEPS[idx] ?? STEPS[0];
  const t = useMemo(() => (quote ? totals(quote) : null), [quote]);

  if (!id) return <Navigate to="/quotes" replace />;
  if (!quote) {
    return (
      <>
        <Topbar title="Quote" />
        <div className="content">
          <div className="page">
            <div className="empty">
              That quote could not be found. It may have been deleted.
              <div style={{ marginTop: 14 }}>
                <button className="btn" onClick={() => navigate('/quotes')}>
                  Back to quotes
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const go = (n: number) => {
    const next = STEPS[Math.max(0, Math.min(STEPS.length - 1, n))];
    navigate(`/quotes/${id}/${next.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const section = sections.find((s) => s.key === step.key);
  const selectedCount = quote.lines.reduce((n, l) => n + l.qty, 0);

  return (
    <>
      <Topbar
        title={step.label}
        actions={
          <>
            <span className="pill grey">{quote.number}</span>
            <span className="pill">{selectedCount} item{selectedCount === 1 ? '' : 's'}</span>
            {t && <span className="pill good">{money(t.total)}</span>}
            <button className="btn sm" onClick={() => navigate('/quotes')}>
              Save &amp; close
            </button>
          </>
        }
      />

      <div className="content">
        <div className="page" style={{ maxWidth: 1180 }}>
          <div className="hero no-print">
            <p className="eyebrow">Quote studio · {customerName(quote)}</p>
            <h2>{step.label}</h2>
            <p>Build the same clear proposal your customer will review, sign and book from.</p>
            <div style={{ marginTop: 18 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="eyebrow">Proposal progress</span>
                <span className="eyebrow">
                  Step {idx + 1} / {STEPS.length}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="wizard">
            <nav className="steps no-print">
              {STEPS.map((s, i) => (
                <button
                  key={s.key}
                  className={`step${i === idx ? ' on' : ''}${i < idx ? ' done' : ''}`}
                  onClick={() => go(i)}
                >
                  <span className="step-index">{i < idx ? '✓' : s.icon ?? i + 1}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>

            <div>
              {step.key === 'property' && <HomeDetailsStep quote={quote} onChange={update} />}
              {section && <SectionStep key={section.key} section={section} quote={quote} onChange={update} />}
              {step.key === 'summary' && (
                <SummaryStep quote={quote} onChange={update} user={user} />
              )}

              <div className="wizard-bar no-print">
                <button className="btn" onClick={() => go(idx - 1)} disabled={idx === 0}>
                  ‹ Back
                </button>
                <button
                  className="btn primary"
                  onClick={() => go(idx + 1)}
                  disabled={idx === STEPS.length - 1}
                >
                  Continue ›
                </button>
                <div className="spacer" />
                <button className="btn" onClick={() => go(STEPS.length - 1)}>
                  Finish ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
