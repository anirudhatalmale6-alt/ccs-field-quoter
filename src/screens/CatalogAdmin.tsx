import { useEffect, useMemo, useRef, useState } from 'react';
import Topbar from '../components/Topbar';
import { money } from '../brand';
import { can, type User } from '../lib/auth';
import {
  allProducts,
  categories,
  exportCatalog,
  importCatalog,
  removeProduct,
  resetCatalog,
  slugify,
  subscribe,
  upsertProduct,
} from '../lib/catalog';
import type { Product } from '../lib/types';

const blank = (): Product => ({
  id: '',
  category: '',
  brand: '',
  model: '',
  size: '',
  unit: null,
  value: null,
  regularPrice: null,
  costPrice: null,
  salePrice: null,
  quotePrice: null,
  needsManualPrice: true,
  image: null,
  spec: null,
  runCost: null,
  specRows: [],
});

export default function CatalogAdmin({ user }: { user: User }) {
  const [, force] = useState(0);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => subscribe(() => force((n) => n + 1)), []);

  const products = allProducts();
  const cats = categories();

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!needle ||
          [p.brand, p.model, p.size, p.category].join(' ').toLowerCase().includes(needle))
    );
  }, [products, filter, category]);

  if (!can(user, 'catalog.edit')) {
    return (
      <>
        <Topbar title="Product catalogue" />
        <div className="content">
          <div className="page">
            <div className="empty">
              Your account does not have permission to edit the catalogue.
            </div>
          </div>
        </div>
      </>
    );
  }

  const save = () => {
    if (!editing) return;
    const next = { ...editing };
    if (!next.category.trim()) {
      alert('Give the product a category — that is what puts it on the right wizard step.');
      return;
    }
    if (!next.id) {
      next.id = slugify(
        [next.category, next.brand, next.model, next.size].filter(Boolean).join('-')
      );
    }
    upsertProduct(next);
    setEditing(null);
  };

  const doImport = async (file: File) => {
    try {
      importCatalog(await file.text());
      alert('Catalogue imported.');
    } catch (e) {
      alert(`That file could not be imported: ${(e as Error).message}`);
    }
  };

  const download = () => {
    const blob = new Blob([exportCatalog()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalogue.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <Topbar
        title="Product catalogue"
        actions={
          <>
            <button className="btn sm" onClick={download}>
              Export
            </button>
            <button className="btn sm" onClick={() => fileRef.current?.click()}>
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
            />
            <button className="btn primary sm" onClick={() => setEditing(blank())}>
              + Add product
            </button>
          </>
        }
      />

      <div className="content">
        <div className="page" style={{ maxWidth: 1180 }}>
          <div className="hero">
            <p className="eyebrow">Admin</p>
            <h2>Products &amp; pricing</h2>
            <p>
              Change a price, add a new model, or bring in a whole new brand. Anything you save here
              appears in the quote wizard immediately — no code, no deploy.
            </p>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <input
                type="text"
                placeholder="Search brand, model or size"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: 220 }}
              >
                <option value="">All categories ({products.length})</option>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="card flush">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Product</th>
                  <th className="num">Cost</th>
                  <th className="num">Regular</th>
                  <th className="num">Sale</th>
                  <th className="num">Quoted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {p.category}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {[p.brand, p.model].filter(Boolean).join(' ')}
                      </div>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {p.size}
                      </div>
                    </td>
                    <td className="num muted">{p.costPrice != null ? money(p.costPrice) : '—'}</td>
                    <td className="num muted">
                      {p.regularPrice != null ? money(p.regularPrice) : '—'}
                    </td>
                    <td className="num">{p.salePrice != null ? money(p.salePrice) : '—'}</td>
                    <td className="num" style={{ fontWeight: 800 }}>
                      {p.quotePrice != null ? money(p.quotePrice) : '—'}
                    </td>
                    <td className="num">
                      <button className="btn ghost sm" onClick={() => setEditing({ ...p })}>
                        Edit
                      </button>
                      <button
                        className="btn ghost sm danger"
                        onClick={() => {
                          if (confirm(`Remove ${[p.brand, p.model, p.size].join(' ')}?`))
                            removeProduct(p.id);
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <div className="empty">Nothing matches that search.</div>}
          </section>

          <button
            className="btn ghost danger"
            style={{ alignSelf: 'start' }}
            onClick={() => {
              if (confirm('Reset the catalogue back to the shipped list? Your edits will be lost.'))
                resetCatalog();
            }}
          >
            Reset catalogue to defaults
          </button>
        </div>
      </div>

      {editing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,34,51,.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            zIndex: 50,
          }}
          onClick={() => setEditing(null)}
        >
          <div
            className="card"
            style={{ width: 'min(640px,100%)', maxHeight: '86vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow">{editing.id ? 'Edit product' : 'New product'}</p>
            <h3 style={{ fontSize: 22, margin: '6px 0 16px' }}>
              {[editing.brand, editing.model].filter(Boolean).join(' ') || 'Product details'}
            </h3>

            <div className="grid two">
              <div className="field">
                <label>Category</label>
                <input
                  list="cats"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                />
                <datalist id="cats">
                  {cats.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <span className="hint">Decides which wizard step it shows on.</span>
              </div>
              <div className="field">
                <label>Brand</label>
                <input
                  value={editing.brand ?? ''}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Model</label>
                <input
                  value={editing.model ?? ''}
                  onChange={(e) => setEditing({ ...editing, model: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Size</label>
                <input
                  value={editing.size}
                  onChange={(e) => setEditing({ ...editing, size: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Cost price</label>
                <input
                  type="number"
                  value={editing.costPrice ?? ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      costPrice: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
                <span className="hint">Internal only — never shown to a customer.</span>
              </div>
              <div className="field">
                <label>Regular price</label>
                <input
                  type="number"
                  value={editing.regularPrice ?? ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      regularPrice: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="field">
                <label>Sale price</label>
                <input
                  type="number"
                  value={editing.salePrice ?? ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      salePrice: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
                <span className="hint">If set, this is what the customer is quoted.</span>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Image URL</label>
                <input
                  value={editing.image ?? ''}
                  placeholder="https://… or /product-images/your-photo.jpg"
                  onChange={(e) => setEditing({ ...editing, image: e.target.value || null })}
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Selling points (one per line)</label>
                <textarea
                  rows={4}
                  value={(editing.spec?.features ?? []).join('\n')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      spec: {
                        ...(editing.spec ?? {}),
                        features: e.target.value.split('\n').filter(Boolean),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="row" style={{ marginTop: 18, gap: 10 }}>
              <button className="btn primary" onClick={save}>
                Save product
              </button>
              <button className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <div className="spacer" />
              <span className="muted" style={{ fontSize: 13 }}>
                Quoted price ={' '}
                {editing.salePrice ?? editing.regularPrice
                  ? money(editing.salePrice ?? editing.regularPrice!)
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
