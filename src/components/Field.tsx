import { useId, type ReactNode } from 'react';

/**
 * A labelled form control. The label is always tied to the input it describes,
 * so screen readers announce it and tapping the label focuses the field.
 */
export default function Field({
  label,
  hint,
  children,
  style,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
  style?: React.CSSProperties;
}) {
  const id = useId();
  return (
    <div className="field" style={style}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Same, for a group of chip buttons where there is no single input to label. */
export function FieldGroup({
  label,
  hint,
  children,
  style,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <fieldset
      className="field"
      style={{ border: 0, padding: 0, margin: 0, ...style }}
    >
      <legend className="field-label" style={{ padding: 0 }}>
        {label}
      </legend>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </fieldset>
  );
}
