// src/App.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Coupons     from './pages/Coupons';
import MII         from './pages/MII';
import Registre    from './pages/Registre';
import Parametres  from './pages/Parametres';
import Layout      from './components/layout/Layout';

// ─── Auth Context ────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('mii_user')); } catch { return null; }
  });

  const login = (token, userData) => {
    localStorage.setItem('mii_token', token);
    localStorage.setItem('mii_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('mii_token');
    localStorage.removeItem('mii_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Guard route privée ──────────────────────────────────────────────────────
function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="coupons"    element={<Coupons />} />
            <Route path="mii"        element={<MII />} />
            <Route path="registre"   element={<Registre />} />
            <Route path="parametres" element={
              <PrivateRoute roles={['admin']}><Parametres /></PrivateRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
