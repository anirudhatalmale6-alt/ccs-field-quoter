import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { brand } from '../brand';
import { can, logout, ROLE_LABELS, type User } from '../lib/auth';
import { newQuote, saveQuote } from '../lib/quotes';

function Logo() {
  const [broken, setBroken] = useState(false);
  return (
    <div className="sidebar-logo">
      {!broken ? (
        <img
          className="sidebar-mark"
          src={brand.logoMark}
          alt=""
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="logo-mark">{brand.initials}</span>
      )}
      <span>
        Canadian
        <br />
        <em>Comfort</em>
        <br />
        Solutions
      </span>
    </div>
  );
}

export default function Shell({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const navigate = useNavigate();

  const startQuote = () => {
    const q = saveQuote(newQuote(user.username));
    navigate(`/quotes/${q.id}/home-details`);
  };

  const signOut = () => {
    logout();
    onSignOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Logo />

        <button className="btn primary block" onClick={startQuote}>
          + New quote
        </button>

        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/quotes">Quotes</NavLink>
          <NavLink to="/schedule">Schedule</NavLink>

          <span className="nav-label">Tools</span>
          <NavLink to="/financing">Financing</NavLink>
          {can(user, 'catalog.edit') && <NavLink to="/catalog">Product catalogue</NavLink>}
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{user.displayName}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {ROLE_LABELS[user.role]}
            </div>
          </div>
          <button className="btn ghost sm" onClick={signOut} title="Sign out">
            ⏻
          </button>
        </div>
      </aside>

      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
