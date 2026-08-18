import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { brand } from '../brand';
import { login, type User } from '../lib/auth';

export default function Login({
  onSignedIn,
  user,
}: {
  onSignedIn: (u: User) => void;
  user: User | null;
}) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const found = login(username, password);
    if (!found) {
      setError('That username and password did not match. Check with your administrator.');
      setBusy(false);
      return;
    }
    onSignedIn(found);
    navigate('/', { replace: true });
  };

  return (
    <div className="login">
      <section className="login-story">
        <span className="badge-live">
          <i /> Private team workspace
        </span>
        <div>
          <p className="eyebrow" style={{ color: 'var(--accent-2)' }}>
            {brand.name}
          </p>
          <h1>
            Every customer.
            <br />
            Every job.
            <br />
            <span>One clear view.</span>
          </h1>
        </div>
        <p>
          Build a full home-comfort proposal at the kitchen table — products, pricing, financing and
          the install date, in one visit.
        </p>
        <div className="row wrap" style={{ gap: 8 }}>
          {['Quotes', 'Financing', 'Scheduling', 'Catalogue'].map((c) => (
            <span key={c} className="chip" style={{ background: 'rgba(255,255,255,.1)', border: 0, color: '#fff' }}>
              {c}
            </span>
          ))}
        </div>
      </section>

      <main className="login-main">
        <form className="login-card" onSubmit={submit}>
          <img className="login-logo" src={brand.logo} alt={brand.name} />
          <div>
            <p className="eyebrow">Team quoter</p>
            <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>Welcome back.</h2>
            <p className="muted" style={{ margin: 0 }}>
              Sign in with the account your administrator set up for you.
            </p>
          </div>

          <div className="field">
            <label htmlFor="u">Username</label>
            <input
              id="u"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
          </div>

          <div className="field">
            <label htmlFor="p">Password</label>
            <input
              id="p"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="pill warn" style={{ padding: '10px 14px', borderRadius: 12 }}>
              {error}
            </div>
          )}

          <button className="btn primary block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="muted" style={{ fontSize: 12.5, margin: 0, textAlign: 'center' }}>
            Protected team access — activity is tied to your quoter profile.
          </p>
        </form>
      </main>
    </div>
  );
}
