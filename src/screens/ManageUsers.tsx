import { useState } from 'react';
import Topbar from '../components/Topbar';
import Field from '../components/Field';
import {
  PERMISSIONS,
  ROLE_LABELS,
  can,
  currentUser,
  listUsers,
  removeUser,
  upsertUser,
  type Role,
  type User,
} from '../lib/auth';

const ROLES: Role[] = ['technician', 'manager', 'admin'];

const PERMISSION_LABELS: Record<string, string> = {
  'quotes.create': 'Create quotes',
  'quotes.view_all': "See everyone's quotes",
  'schedule.view': 'See the schedule',
  'catalog.edit': 'Edit the catalogue',
  'users.manage': 'Manage users',
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

const blank = (): User => ({
  username: '',
  password: '',
  displayName: '',
  role: 'technician',
  createdAt: new Date().toISOString(),
});

export default function ManageUsers({ user }: { user: User }) {
  const [users, setUsers] = useState<User[]>(() => listUsers());
  const [editing, setEditing] = useState<User | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState('');

  const refresh = () => setUsers(listUsers());

  if (!can(user, 'users.manage')) {
    return (
      <>
        <Topbar title="Team" />
        <div className="content">
          <div className="page">
            <div className="empty">Only an admin can manage team logins.</div>
          </div>
        </div>
      </>
    );
  }

  const save = () => {
    if (!editing) return;
    const username = editing.username.trim();
    if (!username) return setError('Give them a username to sign in with.');
    if (!editing.password) return setError('Set a password.');

    const clash = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (isNew && clash) return setError('That username is already taken.');

    upsertUser({ ...editing, username, displayName: editing.displayName.trim() || username });
    refresh();
    setEditing(null);
    setError('');
  };

  const remove = (target: User) => {
    if (target.username === user.username) {
      alert('You cannot delete the account you are signed in with.');
      return;
    }
    const admins = users.filter((u) => u.role === 'admin');
    if (target.role === 'admin' && admins.length <= 1) {
      alert('That is the only admin account. Make someone else an admin first.');
      return;
    }
    if (confirm(`Remove ${target.displayName || target.username}?`)) {
      removeUser(target.username);
      refresh();
    }
  };

  const signedInAs = currentUser()?.username;

  return (
    <>
      <Topbar
        title="Team"
        actions={
          <button
            className="btn primary sm"
            onClick={() => {
              setEditing(blank());
              setIsNew(true);
              setError('');
            }}
          >
            + Add person
          </button>
        }
      />

      <div className="content">
        <div className="page">
          <div className="hero">
            <p className="eyebrow">Admin</p>
            <h2>Team logins</h2>
            <p>
              Everyone gets their own username and password. What they can see and change depends on
              the role you give them.
            </p>
          </div>

          <section className="card flush">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Can do</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username}>
                    <td style={{ fontWeight: 700 }}>
                      {u.displayName || u.username}
                      {u.username === signedInAs && (
                        <span className="pill" style={{ marginLeft: 8 }}>
                          you
                        </span>
                      )}
                    </td>
                    <td className="muted">{u.username}</td>
                    <td>
                      <span className="pill grey">{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {PERMISSIONS[u.role].map((p) => PERMISSION_LABELS[p] ?? p).join(' · ')}
                    </td>
                    <td className="num">
                      <button
                        className="btn ghost sm"
                        onClick={() => {
                          setEditing({ ...u });
                          setIsNew(false);
                          setError('');
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn ghost sm danger" onClick={() => remove(u)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <p className="eyebrow">What each role can do</p>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    {ALL_PERMISSIONS.map((p) => (
                      <th key={p} className="num">
                        {PERMISSION_LABELS[p]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((r) => (
                    <tr key={r}>
                      <td style={{ fontWeight: 700 }}>{ROLE_LABELS[r]}</td>
                      {ALL_PERMISSIONS.map((p) => (
                        <td key={p} className="num">
                          {PERMISSIONS[r].includes(p) ? (
                            <span style={{ color: 'var(--good)', fontWeight: 800 }}>✓</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {users.some((u) => u.username === 'admin' && u.password === 'admin') && (
            <div className="card" style={{ borderColor: 'var(--warn)' }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--warn)' }}>
                The default admin account still has the password “admin”.
              </p>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                Change it before anyone outside your team can reach this site.
              </p>
            </div>
          )}
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
            style={{ width: 'min(520px,100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow">{isNew ? 'Add person' : 'Edit person'}</p>
            <h3 style={{ fontSize: 22, margin: '6px 0 16px' }}>
              {editing.displayName || editing.username || 'New team member'}
            </h3>

            <div className="grid two">
              <Field label="Full name">
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    value={editing.displayName}
                    onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Username" hint="What they type to sign in.">
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    value={editing.username}
                    disabled={!isNew}
                    onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Password">
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    value={editing.password}
                    onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Role">
                {(id) => (
                  <select
                    id={id}
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>

            <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
              {ROLE_LABELS[editing.role]} can:{' '}
              {PERMISSIONS[editing.role].map((p) => PERMISSION_LABELS[p] ?? p).join(', ')}.
            </p>

            {error && (
              <p className="pill warn" style={{ padding: '8px 14px', marginTop: 12 }}>
                {error}
              </p>
            )}

            <div className="row" style={{ marginTop: 18, gap: 10 }}>
              <button className="btn primary" onClick={save}>
                Save
              </button>
              <button className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
