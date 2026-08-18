import { useMemo } from 'react';
import Field, { FieldGroup } from '../../components/Field';
import { money } from '../../brand';
import {
  EXISTING_DEPTHS,
  PRICE_PER_SQ_FT,
  estimateBasis,
  estimatedArea,
  priceForArea,
  resolveArea,
  type AreaMode,
  type InsulationState,
} from '../../lib/insulation';
import { addLine, removeLine } from '../../lib/quotes';
import type { Quote } from '../../lib/types';

const LINE_ID = 'attic-insulation-r60';

const MODES: { key: AreaMode; label: string }[] = [
  { key: 'estimate', label: 'Estimate' },
  { key: 'dimensions', label: 'Length × Width' },
  { key: 'manual', label: 'Enter sq ft' },
];

export default function InsulationStep({
  quote,
  onChange,
}: {
  quote: Quote;
  onChange: (q: Quote) => void;
}) {
  const state = quote.insulation;
  const area = useMemo(() => resolveArea(state, quote.home), [state, quote.home]);
  const price = priceForArea(area);
  const added = quote.lines.some((l) => l.id === LINE_ID);

  const set = (patch: Partial<InsulationState>) =>
    onChange({ ...quote, insulation: { ...state, ...patch } });

  const toggle = () => {
    if (added) {
      onChange(removeLine(quote, LINE_ID));
      return;
    }
    if (!price || !area) return;
    onChange(
      addLine(quote, {
        id: LINE_ID,
        kind: 'custom',
        sectionKey: 'insulation',
        name: 'Attic insulation top-up to R-60',
        detail: `${area.toLocaleString()} sq ft · blown fiberglass, 20–23 in`,
        qty: 1,
        unitPrice: price,
        regularPrice: null,
        image: null,
      })
    );
  };

  // keep an already-added line in step with the measurements
  const stale = added && price != null && quote.lines.find((l) => l.id === LINE_ID)?.unitPrice !== price;

  const applyUpdate = () => {
    if (!price || !area) return;
    onChange({
      ...quote,
      lines: quote.lines.map((l) =>
        l.id === LINE_ID
          ? {
              ...l,
              unitPrice: price,
              detail: `${area.toLocaleString()} sq ft · blown fiberglass, 20–23 in`,
            }
          : l
      ),
    });
  };

  const estimate = estimatedArea(quote.home);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <p className="eyebrow">Product selection</p>
        <h3 style={{ fontSize: 26, margin: '6px 0 6px' }}>🏠 Attic Insulation</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Top up the attic to R-60 — 20–23 inches of blown fiberglass for year-round comfort.
        </p>
      </section>

      <section className="card">
        <p className="eyebrow">Attic area</p>
        <p className="muted" style={{ margin: '4px 0 14px', fontSize: 13 }}>
          Used to size the R-60 top-up. Priced at {money(PRICE_PER_SQ_FT, 2)} per square foot
          installed.
        </p>

        <div className="chips">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={state.areaMode === m.key}
              className={`chip${state.areaMode === m.key ? ' on' : ''}`}
              onClick={() => set({ areaMode: m.key })}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {state.areaMode === 'estimate' &&
            (estimate != null ? (
              <p style={{ fontSize: 15, margin: 0 }}>
                Estimated attic area: <strong>{estimate.toLocaleString()} sq ft</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {' '}
                  · {estimateBasis(quote.home)}
                </span>
              </p>
            ) : (
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Add the home's above-ground square footage and property type back on Home Details
                for an automatic estimate — or measure it with Length × Width.
              </p>
            ))}

          {state.areaMode === 'dimensions' && (
            <div className="grid three">
              <Field label="Length (ft)">
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={0}
                    placeholder="40"
                    value={state.lengthFt ?? ''}
                    onChange={(e) =>
                      set({ lengthFt: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                )}
              </Field>
              <Field label="Width (ft)">
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={0}
                    placeholder="30"
                    value={state.widthFt ?? ''}
                    onChange={(e) =>
                      set({ widthFt: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                )}
              </Field>
              <div className="field">
                <span className="field-label">Area</span>
                <div style={{ fontWeight: 800, fontSize: 20, paddingTop: 6 }}>
                  {area ? `${area.toLocaleString()} sq ft` : '—'}
                </div>
              </div>
            </div>
          )}

          {state.areaMode === 'manual' && (
            <Field label="Attic area (sq ft)" style={{ maxWidth: 260 }}>
              {(id) => (
                <input
                  id={id}
                  type="number"
                  min={0}
                  placeholder="1100"
                  value={state.manualSqft ?? ''}
                  onChange={(e) =>
                    set({ manualSqft: e.target.value ? Number(e.target.value) : null })
                  }
                />
              )}
            </Field>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <FieldGroup label="Existing insulation depth">
            <div className="chips">
              {EXISTING_DEPTHS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={state.existingDepth === d}
                  className={`chip${state.existingDepth === d ? ' on' : ''}`}
                  onClick={() => set({ existingDepth: state.existingDepth === d ? '' : d })}
                >
                  {d}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>
      </section>

      <section className="card">
        <div className="row wrap" style={{ justifyContent: 'space-between', gap: 14 }}>
          <div>
            <p className="eyebrow">Installed price</p>
            <div className="price" style={{ marginTop: 4 }}>
              {price != null ? money(price) : 'Measure the attic first'}
            </div>
            {area != null && (
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                {area.toLocaleString()} sq ft × {money(PRICE_PER_SQ_FT, 2)}/sq ft
              </p>
            )}
          </div>

          <div className="row" style={{ gap: 10 }}>
            {stale && (
              <button className="btn" onClick={applyUpdate}>
                Update to {money(price!)}
              </button>
            )}
            <button className={`btn ${added ? '' : 'primary'}`} onClick={toggle} disabled={!price}>
              {added ? '✓ Added — remove' : '+ Add to quote'}
            </button>
          </div>
        </div>

        <details className="tradeoffs" style={{ padding: '14px 0 0' }}>
          <summary>What the installation includes</summary>
          <ul>
            <li>Inspect the attic and confirm existing depth and coverage</li>
            <li>Seal and box any open penetrations before topping up</li>
            <li>Install baffles at the eaves so soffit ventilation stays clear</li>
            <li>Blow in fiberglass to an even 20–23 inches (R-60)</li>
            <li>Mark the depth and leave the hatch insulated and weather-stripped</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
