import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { applyBrandTheme } from './brand';
import { currentUser, type User } from './lib/auth';
import Shell from './components/Shell';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import QuotesPipeline from './screens/QuotesPipeline';
import Schedule from './screens/Schedule';
import CatalogAdmin from './screens/CatalogAdmin';
import FinanceCalculator from './screens/FinanceCalculator';
import ManageUsers from './screens/ManageUsers';
import Wizard from './screens/wizard/Wizard';
import PublicQuote from './screens/PublicQuote';

export interface Session {
  user: User;
  signOut: () => void;
}

function Private({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);
  if (!user) return null;
  return <Shell user={user} onSignOut={onSignOut} />;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => currentUser());

  useEffect(() => {
    applyBrandTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onSignedIn={setUser} user={user} />} />
        <Route path="/q/:token" element={<PublicQuote />} />
        <Route element={<Private user={user} onSignOut={() => setUser(null)} />}>
          <Route path="/" element={<Dashboard user={user!} />} />
          <Route path="/quotes" element={<QuotesPipeline user={user!} />} />
          <Route path="/quotes/:id/*" element={<Wizard user={user!} />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/financing" element={<FinanceCalculator />} />
          <Route path="/catalog" element={<CatalogAdmin user={user!} />} />
          <Route path="/team" element={<ManageUsers user={user!} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
