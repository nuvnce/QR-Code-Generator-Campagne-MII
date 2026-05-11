// src/components/layout/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import {
  LayoutDashboard, QrCode, Shield, BookOpen,
  Settings, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Tableau de bord', roles: ['admin','superviseur','agent'] },
  { to: '/coupons',   icon: QrCode,          label: 'Coupons Ménage',  roles: ['admin','superviseur','agent'] },
  { to: '/mii',       icon: Shield,          label: 'Codes MII',       roles: ['admin','superviseur','agent'] },
  { to: '/registre',  icon: BookOpen,        label: 'Registre',        roles: ['admin','superviseur'] },
  { to: '/parametres',icon: Settings,        label: 'Paramètres',      roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = NAV.filter(n => n.roles.includes(user.role));

  const Sidebar = ({ mobile }) => (
    <aside className={`
      ${mobile ? 'flex' : 'hidden lg:flex'} flex-col
      w-64 min-h-screen bg-[#0d1f35] border-r border-[#1a3a5c]
    `}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1a3a5c]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00c28e] flex items-center justify-center">
            <QrCode size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">QR Generator</p>
            <p className="text-[#00c28e] text-xs font-medium">Campagne MII</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? 'bg-[#00c28e] text-white shadow-lg shadow-[#00c28e]/20'
                : 'text-[#8ba3be] hover:bg-[#1a3a5c] hover:text-white'
              }
            `}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-[#1a3a5c]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#1a3a5c] flex items-center justify-center">
            <span className="text-[#00c28e] text-xs font-bold">
              {user.nom?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.nom}</p>
            <p className="text-[#8ba3be] text-xs capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#8ba3be] hover:bg-red-500/10 hover:text-red-400 text-xs transition-all"
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#07131f]">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0d1f35] border-b border-[#1a3a5c]">
          <button onClick={() => setOpen(true)} className="text-white">
            <Menu size={22} />
          </button>
          <span className="text-white font-semibold text-sm">QR Generator MII</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
