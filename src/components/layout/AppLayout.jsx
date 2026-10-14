import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from '../common/ThemeToggle';
import { HiOutlineBars3 } from 'react-icons/hi2';

export default function AppLayout() {
  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop collapsed state
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app-layout ${collapsed ? 'app-layout--collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="app-layout__content">
        <header className="mobile-topbar">
          <button
            className="mobile-topbar__hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <HiOutlineBars3 />
          </button>
          <div className="mobile-topbar__brand">
            <img src="/logo-arluc.jpg" alt="ARLUC Logo" className="mobile-topbar__logo" />
            <span className="mobile-topbar__title">ARLUC System</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <ThemeToggle />
          </div>
        </header>

        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
