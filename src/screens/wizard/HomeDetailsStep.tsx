import Field, { FieldGroup } from '../../components/Field';
import type { Quote, HomeDetails, Customer } from '../../lib/types';

const PROPERTY_TYPES = [
  'Bungalow',
  '2-Story House',
  '3-Story House',
  'Townhouse',
  'Condo',
  'Multi-unit',
  'Commercial',
] as const;

const BASEMENT = ['Yes', 'No', 'No Basement'] as const;
const ATTIC = ['New (0-5 yrs)', 'Mid (6-15 yrs)', 'Old (16+ yrs)', 'Unknown'] as const;
const HEATING = [
  'Gas furnace',
  'Electric furnace',
  'Oil furnace',
  'Propane furnace',
  'Boiler / radiators',
  'Electric baseboard',
  'Existing heat pump',
  'Other',
];

export default function HomeDetailsStep({
  quote,
  onChange,
}: {
  quote: Quote;
  onChange: (q: Quote) => void;
}) {
  const setHome = (patch: Partial<HomeDetails>) =>
    onChange({ ...quote, home: { ...quote.home, ...patch } });
  const setCustomer = (patch: Partial<Customer>) =>
    onChange({ ...quote, customer: { ...quote.customer, ...patch } });

  const c = quote.customer;
  const h = quote.home;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <p className="eyebrow">01 · Customer</p>
        <h3 style={{ fontSize: 21, margin: '6px 0 4px' }}>Who is this quote for?</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          This is what appears on the proposal and how the customer receives it.
        </p>

        <div className="grid two" style={{ marginTop: 16 }}>
          <Field label="First name">
            {(id) => (
              <input
                id={id}
                type="text"
                value={c.firstName}
                onChange={(e) => setCustomer({ firstName: e.target.value })}
              />
            )}
          </Field>
          <Field label="Last name">
            {(id) => (
              <input
                id={id}
                type="text"
                value={c.lastName}
                onChange={(e) => setCustomer({ lastName: e.target.value })}
              />
            )}
          </Field>
          <Field label="Mobile number" hint="Used for the “send to phone” button on the summary.">
            {(id) => (
              <input
                id={id}
                type="tel"
                value={c.phone}
                placeholder="(416) 555-0134"
                onChange={(e) => setCustomer({ phone: e.target.value })}
              />
            )}
          </Field>
          <Field label="Email">
            {(id) => (
              <input
                id={id}
                type="email"
                value={c.email}
                onChange={(e) => setCustomer({ email: e.target.value })}
              />
            )}
          </Field>
          <Field label="Address" style={{ gridColumn: '1 / -1' }}>
            {(id) => (
              <input
                id={id}
                type="text"
                value={c.address}
                onChange={(e) => setCustomer({ address: e.target.value })}
              />
            )}
          </Field>
          <Field label="City">
            {(id) => (
              <input
                id={id}
                type="text"
                value={c.city}
                onChange={(e) => setCustomer({ city: e.target.value })}
              />
            )}
          </Field>
          <Field label="Postal code">
            {(id) => (
              <input
                id={id}
                type="text"
                value={c.postalCode}
                onChange={(e) => setCustomer({ postalCode: e.target.value })}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">02 · Property essentials</p>
        <h3 style={{ fontSize: 21, margin: '6px 0 4px' }}>Build the home profile</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          These drive product sizing and the operating-cost estimates on the proposal. Every field is
          optional.
        </p>

        <div className="grid" style={{ gap: 18, marginTop: 16 }}>
          <FieldGroup label="Property type">
            <div className="chips">
              {PROPERTY_TYPES.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={h.propertyType === p}
                  className={`chip${h.propertyType === p ? ' on' : ''}`}
                  onClick={() => setHome({ propertyType: h.propertyType === p ? '' : p })}
                >
                  {p}
                </button>
              ))}
            </div>
          </FieldGroup>

          <div className="grid three">
            <Field label="Above-ground sq ft" hint="Exclude basement area.">
              {(id) => (
                <input
                  id={id}
                  type="number"
                  value={h.squareFeet}
                  onChange={(e) => setHome({ squareFeet: e.target.value })}
                />
              )}
            </Field>
            <Field label="Year built">
              {(id) => (
                <input
                  id={id}
                  type="number"
                  value={h.yearBuilt}
                  onChange={(e) => setHome({ yearBuilt: e.target.value })}
                />
              )}
            </Field>
            <Field label="Bathrooms" hint="Sizes the tankless water heater.">
              {(id) => (
                <input
                  id={id}
                  type="number"
                  value={h.bathrooms}
                  onChange={(e) => setHome({ bathrooms: e.target.value })}
                />
              )}
            </Field>
            <Field label="People in the home" hint="Hot-water demand context.">
              {(id) => (
                <input
                  id={id}
                  type="number"
                  value={h.occupants}
                  onChange={(e) => setHome({ occupants: e.target.value })}
                />
              )}
            </Field>
          </div>

          <FieldGroup label="Finished basement">
            <div className="chips">
              {BASEMENT.map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={h.finishedBasement === b}
                  className={`chip${h.finishedBasement === b ? ' on' : ''}`}
                  onClick={() => setHome({ finishedBasement: h.finishedBasement === b ? '' : b })}
                >
                  {b}
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Attic insulation age">
            <div className="chips">
              {ATTIC.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={h.atticInsulationAge === a}
                  className={`chip${h.atticInsulationAge === a ? ' on' : ''}`}
                  onClick={() =>
                    setHome({ atticInsulationAge: h.atticInsulationAge === a ? '' : a })
                  }
                >
                  {a}
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Existing heating source">
            <div className="chips">
              {HEATING.map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={h.existingHeating === x}
                  className={`chip${h.existingHeating === x ? ' on' : ''}`}
                  onClick={() => setHome({ existingHeating: h.existingHeating === x ? '' : x })}
                >
                  {x}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>
      </section>
    </div>
  );
}
