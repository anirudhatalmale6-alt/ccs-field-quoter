const USERS = 'ccs.users.v1';
const SESSION = 'ccs.session.v1';

export type Role = 'admin' | 'manager' | 'technician';

export interface User {
  username: string;
  password: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  technician: 'Sales Technician',
};

/** What each role may do. Checked in the UI and on every guarded route. */
export const PERMISSIONS: Record<Role, string[]> = {
  admin: ['quotes.create', 'quotes.view_all', 'schedule.view', 'catalog.edit', 'users.manage'],
  manager: ['quotes.create', 'quotes.view_all', 'schedule.view', 'catalog.edit'],
  technician: ['quotes.create', 'schedule.view'],
};

export const can = (user: User | null, permission: string) =>
  !!user && PERMISSIONS[user.role].includes(permission);

function read(): User[] {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS) ?? '[]') as User[];
    if (raw.length) return raw;
  } catch {
    /* fall through to seed */
  }
  const seeded: User[] = [
    {
      username: 'admin',
      password: 'admin',
      displayName: 'Administrator',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(USERS, JSON.stringify(seeded));
  return seeded;
}

export const listUsers = () => read();

export function upsertUser(user: User) {
  const users = read();
  const i = users.findIndex((u) => u.username.toLowerCase() === user.username.toLowerCase());
  if (i >= 0) users[i] = user;
  else users.push(user);
  localStorage.setItem(USERS, JSON.stringify(users));
}

export function removeUser(username: string) {
  const users = read().filter((u) => u.username !== username);
  localStorage.setItem(USERS, JSON.stringify(users));
}

export function login(username: string, password: string): User | null {
  const user = read().find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
  if (!user) return null;
  sessionStorage.setItem(SESSION, user.username);
  localStorage.setItem(SESSION, user.username);
  return user;
}

export function currentUser(): User | null {
  const name = sessionStorage.getItem(SESSION) ?? localStorage.getItem(SESSION);
  if (!name) return null;
  return read().find((u) => u.username === name) ?? null;
}

export function logout() {
  sessionStorage.removeItem(SESSION);
  localStorage.removeItem(SESSION);
}
