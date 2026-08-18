import { useMemo, useState } from 'react';
import Field from './Field';
import { money } from '../brand';
import { DEFAULT_RATES, batterySavings } from '../lib/batterySavings';

/**
 * Sits on the Battery Storage step. The technician asks what the customer's
 * bill runs to and gets a savings figure to talk to.
 */
export default function BatterySavingsPanel() {
  const [bill, setBill] = useState<string>('');
  const [rates, setRates] = useState(DEFAULT_RATES);

  const result = useMemo(
    () =>
      batterySavings({
        avgMonthlyBill: bill ? Number(bill) : null,
        highPeakRate: rates.high,
        midPeakRate: rates.mid,
        lowPeakRate: rates.low,
      }),
    [bill, rates]
  );

  return (
    <section className="card">
      <p className="eyebrow">Talking point</p>
      <h3 style={{ fontSize: 21, margin: '6px 0 4px' }}>What could a battery save them?</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Charges overnight on cheap power and runs the house through the expensive hours. Ask what
        their bill runs to and this gives you a figure to talk to.
      </p>

      <div className="grid two" style={{ marginTop: 16 }}>
        <Field label="Average electricity bill ($/month)">
          {(id) => (
            <input
              id={id}
              type="number"
              min={0}
              placeholder="e.g. 250"
              value={bill}
              onChange={(e) => setBill(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="grid three" style={{ marginTop: 12 }}>
        <Field label="High-peak $/kWh">
          {(id) => (
            <input
              id={id}
              type="number"
              step="0.001"
              value={rates.high}
              onChange={(e) => setRates({ ...rates, high: Number(e.target.value) })}
            />
          )}
        </Field>
        <Field label="Mid-peak $/kWh">
          {(id) => (
            <input
              id={id}
              type="number"
              step="0.001"
              value={rates.mid}
              onChange={(e) => setRates({ ...rates, mid: Number(e.target.value) })}
            />
          )}
        </Field>
        <Field label="Low-peak $/kWh">
          {(id) => (
            <input
              id={id}
              type="number"
              step="0.001"
              value={rates.low}
              onChange={(e) => setRates({ ...rates, low: Number(e.target.value) })}
            />
          )}
        </Field>
      </div>

      {result && result.annual > 0 && (
        <div
          className="card"
          style={{ background: 'var(--faint)', boxShadow: 'none', marginTop: 16 }}
        >
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>
              Estimated electricity savings
            </span>
            <span
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--good)',
              }}
            >
              ~{money(result.annual)}/yr
            </span>
          </div>
          <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
            ~{money(result.monthly)}/mo by shifting to 80% low-peak / 20% mid-peak power — about{' '}
            {result.percent}% off the energy portion of the bill.
          </p>
        </div>
      )}
    </section>
  );
}
