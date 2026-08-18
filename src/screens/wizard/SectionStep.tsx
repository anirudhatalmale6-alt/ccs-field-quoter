import { useMemo, useState } from 'react';
import ProductCard from '../../components/ProductCard';
import { money } from '../../brand';
import { categoryContent, sectionProducts, sectionRepairs } from '../../lib/catalog';
import { addLine, removeLine } from '../../lib/quotes';
import type { Product, Quote, SectionDef } from '../../lib/types';

/** Products of the same family (same brand + model) differ only by size. */
const familyKey = (p: Product) => `${p.category}|${p.brand ?? ''}|${p.model ?? ''}`;

function families(products: Product[]) {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const k = familyKey(p);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(p);
  }
  return [...map.values()];
}

export default function SectionStep({
  section,
  quote,
  onChange,
}: {
  section: SectionDef;
  quote: Quote;
  onChange: (q: Quote) => void;
}) {
  const [tab, setTab] = useState<'upgrades' | 'repairs'>('upgrades');
  const [chosenSize, setChosenSize] = useState<Record<string, string>>({});

  const equipment = useMemo(() => sectionProducts(section), [section]);
  const repairs = useMemo(() => sectionRepairs(section), [section]);
  const picked = new Set(quote.lines.map((l) => l.id));

  const toggleProduct = (product: Product) => {
    if (picked.has(product.id)) {
      onChange(removeLine(quote, product.id));
      return;
    }
    onChange(
      addLine(quote, {
        id: product.id,
        kind: 'product',
        sectionKey: section.key,
        name: [product.brand, product.model].filter(Boolean).join(' ') || product.category,
        detail: [product.category, product.size].filter(Boolean).join(' · '),
        qty: 1,
        unitPrice: product.quotePrice ?? 0,
        regularPrice: product.regularPrice,
        image: product.image,
      })
    );
  };

  const toggleRepair = (service: {
    id: string;
    service: string;
    category: string;
    priceFrom: number;
    priceTo: number;
    flatRate: boolean;
    summary: string;
  }) => {
    if (picked.has(service.id)) {
      onChange(removeLine(quote, service.id));
      return;
    }
    onChange(
      addLine(quote, {
        id: service.id,
        kind: 'repair',
        sectionKey: section.key,
        name: service.service,
        detail: `${service.category} repair · ${service.summary}`,
        qty: 1,
        unitPrice: service.priceFrom,
        regularPrice: null,
        image: null,
      })
    );
  };

  const hasEquipment = equipment.length > 0;
  const hasRepairs = repairs.length > 0;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <p className="eyebrow">Product selection</p>
        <h3 style={{ fontSize: 26, margin: '6px 0 6px' }}>
          {section.icon} {section.label}
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {section.intro}
        </p>

        {(hasEquipment || hasRepairs) && (
          <div className="row" style={{ marginTop: 14, gap: 8 }}>
            {hasEquipment && (
              <button
                className={`chip${tab === 'upgrades' ? ' on' : ''}`}
                onClick={() => setTab('upgrades')}
              >
                Upgrades
              </button>
            )}
            {hasRepairs && (
              <button
                className={`chip${tab === 'repairs' ? ' on' : ''}`}
                onClick={() => setTab('repairs')}
              >
                Repairs
              </button>
            )}
          </div>
        )}
      </section>

      {!hasEquipment && !hasRepairs && (
        <div className="empty">
          Nothing is set up under {section.label} yet. Add products for this section in the product
          catalogue and they will appear here automatically.
        </div>
      )}

      {tab === 'upgrades' &&
        equipment.map(({ category, products }) => {
          const content = categoryContent[category];
          return (
            <section key={category} className="grid" style={{ gap: 12 }}>
              <div>
                <p className="eyebrow">{category}</p>
                {content?.summary && (
                  <p className="muted" style={{ margin: '4px 0 0', maxWidth: '70ch' }}>
                    {content.summary}
                  </p>
                )}
              </div>

              <div className="product-grid">
                {families(products).map((family) => {
                  const activeId = chosenSize[familyKey(family[0])] ?? family[0].id;
                  const active = family.find((p) => p.id === activeId) ?? family[0];
                  return (
                    <ProductCard
                      key={familyKey(family[0])}
                      product={active}
                      siblings={products}
                      sizes={family}
                      picked={picked.has(active.id)}
                      onSize={(id) =>
                        setChosenSize((s) => ({ ...s, [familyKey(family[0])]: id }))
                      }
                      onAdd={toggleProduct}
                    />
                  );
                })}
              </div>

              {content?.scope?.length ? (
                <details className="card" style={{ padding: 16 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                    What the {category.toLowerCase()} installation includes
                  </summary>
                  <ul className="muted" style={{ lineHeight: 1.6, marginBottom: 0 }}>
                    {content.scope.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          );
        })}

      {tab === 'repairs' &&
        repairs.map(({ category, services }) => (
          <section key={category} className="card flush">
            <div style={{ padding: '16px 16px 0' }}>
              <p className="eyebrow">{category} repairs</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>What is involved</th>
                  <th className="num">Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.service}</td>
                    <td className="muted" style={{ fontSize: 14 }}>
                      {s.summary}
                    </td>
                    <td className="num">
                      {s.flatRate ? money(s.priceFrom) : `${money(s.priceFrom)} – ${money(s.priceTo)}`}
                    </td>
                    <td className="num">
                      <button
                        className={`btn sm${picked.has(s.id) ? '' : ' primary'}`}
                        onClick={() => toggleRepair({ ...s, category })}
                      >
                        {picked.has(s.id) ? '✓ Added' : '+ Add'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
    </div>
  );
}
