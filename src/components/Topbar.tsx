import type { ReactNode } from 'react';

export default function Topbar({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="topbar no-print">
      <h1>{title}</h1>
      <div className="row">{actions}</div>
    </header>
  );
}
