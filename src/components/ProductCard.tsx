import { useMemo, useState } from 'react';
import { money } from '../brand';
import type { Product } from '../lib/types';

function Dots({ score }: { score: number }) {
  return (
    <span className="dots">
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`dot${i <= score ? ' on' : ''}`} />
      ))}
    </span>
  );
}

/** Same four comparison bars the original shows: comfort, efficiency, sound, price. */
function ratingScores(product: Product, siblings: Product[]) {
  const spec = product.spec;
  const comfort = spec?.comfort?.score ?? 3;

  const effValues = siblings
    .map((p) => p.spec?.efficiency?.value ?? p.spec?.efficiency2?.value)
    .filter((v): v is number => typeof v === 'number');
  const eff = product.spec?.efficiency?.value ?? product.spec?.efficiency2?.value;
  const efficiency = scale(eff, effValues);

  const dbValues = siblings.map((p) => p.spec?.soundDb).filter((v): v is number => typeof v === 'number');
  // quieter is better, so invert
  const sound = spec?.soundDb != null ? 6 - scale(spec.soundDb, dbValues) : comfort;

  const priceValues = siblings.map((p) => p.quotePrice).filter((v): v is number => typeof v === 'number');
  // cheaper scores higher on the "price" bar
  const price = product.quotePrice != null ? 6 - scale(product.quotePrice, priceValues) : 3;

  return { comfort, efficiency, sound: clamp(sound), price: clamp(price) };
}

const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

function scale(value: number | undefined, all: number[]): number {
  if (value == null || all.length === 0) return 3;
  const min = Math.min(...all);
  const max = Math.max(...all);
  if (max === min) return 3;
  return clamp(1 + ((value - min) / (max - min)) * 4);
}

export default function ProductCard({
  product,
  siblings,
  picked,
  sizes,
  onSize,
  onAdd,
}: {
  product: Product;
  siblings: Product[];
  picked: boolean;
  sizes: Product[];
  onSize: (id: string) => void;
  onAdd: (product: Product) => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const scores = useMemo(() => ratingScores(product, siblings), [product, siblings]);
  const spec = product.spec;
  const showWas = product.regularPrice != null && product.quotePrice != null && product.regularPrice > product.quotePrice;

  return (
    <article className={`product${picked ? ' picked' : ''}`}>
      <div className="product-head">
        <div className="product-img">
          {product.image && imgOk ? (
            <img src={product.image} alt="" loading="lazy" onError={() => setImgOk(false)} />
          ) : (
            <span className="ph">🏷️</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {product.brand && <div className="brand-tag">{product.brand}</div>}
          <div className="product-title">{product.model ?? product.category}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {product.size}
          </div>
          {spec?.warranty && (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {spec.warranty}
            </div>
          )}
        </div>

        <div className="ratings">
          <span className="rating">
            Comfort <Dots score={scores.comfort} />
          </span>
          <span className="rating">
            Efficiency <Dots score={scores.efficiency} />
          </span>
          <span className="rating">
            Sound <Dots score={scores.sound} />
          </span>
          <span className="rating">
            Price <Dots score={scores.price} />
          </span>
        </div>
      </div>

      {sizes.length > 1 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div className="field">
            <label htmlFor={`size-${product.id}`}>Size</label>
            <select id={`size-${product.id}`} value={product.id} onChange={(e) => onSize(e.target.value)}>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="badges">
        {spec?.efficiency && <span className="badge">{spec.efficiency.label}</span>}
        {spec?.efficiency2 && <span className="badge">{spec.efficiency2.label}</span>}
        {product.runCost && <span className="badge">~{money(product.runCost.cost)}/yr to run</span>}
        {spec?.soundDb != null && <span className="badge">as low as {spec.soundDb} dBA</span>}
      </div>

      {spec?.features?.length ? (
        <ul className="features">
          {spec.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : null}

      {spec?.cons?.length ? (
        <details className="tradeoffs">
          <summary>Trade-offs &amp; details</summary>
          <ul>
            {spec.cons.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {product.runCost && (
            <p style={{ marginBottom: 0 }}>Running cost basis: {product.runCost.basis}</p>
          )}
        </details>
      ) : null}

      <div className="product-foot">
        <div>
          <div className="eyebrow" style={{ marginBottom: 2 }}>
            Installed price
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="price">
              {product.quotePrice != null ? money(product.quotePrice) : 'Price on request'}
            </span>
            {showWas && <span className="price-was">{money(product.regularPrice!)}</span>}
          </div>
        </div>
        <button className={`btn ${picked ? '' : 'primary'}`} onClick={() => onAdd(product)}>
          {picked ? '✓ Added' : '+ Add'}
        </button>
      </div>
    </article>
  );
}
