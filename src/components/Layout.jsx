import { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const NAV = [
  ['/', 'Dashboard'], ['/mavshis', 'Mess requests'], ['/orders', 'Orders'],
  ['/users', 'Users'], ['/delivery-boys', 'Delivery boys'], ['/notifications', 'Notifications'], ['/plans', 'Mess plans'], ['/settings', 'Delivery settings'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const [open, setOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="brand">Mess Admin</div>
        <nav onClick={() => setOpen(false)}>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}{to === '/notifications' && unread > 0 && <span className="count">{unread}</span>}</NavLink>))}
        </nav>
        <button className="logout" onClick={logout}>Sign out</button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <NavLink to="/notifications" className="bell" aria-label={`Notifications, ${unread} unread`}>🔔{unread > 0 && <span className="count">{unread}</span>}</NavLink>
          <span className="who">{user.fullName || 'Admin'}</span>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
