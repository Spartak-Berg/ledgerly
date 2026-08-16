import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ChevronsUpDown,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { Button } from './components';
import { useAuth } from './useAuth';

const nav = [
  ['Dashboard', '/', LayoutDashboard],
  ['Customers', '/customers', Users],
  ['Invoices', '/invoices', FileText],
  ['Expenses', '/expenses', Receipt],
  ['Reports', '/reports', ChartNoAxesCombined],
  ['Settings', '/settings', Settings],
] as const;

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span>Ł</span>
      {!compact && <b>Ledgerly</b>}
    </div>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, profile } = useAuth();
  if (!profile) return null;
  const companyInitials = profile.company.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const userInitials = profile.user.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const role = `${profile.company.role[0]}${profile.company.role.slice(1).toLowerCase()}`;
  const title =
    nav.find(([, path]) =>
      path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path),
    )?.[0] ?? 'Ledgerly';
  return (
    <div className={`app ${collapsed ? 'is-collapsed' : ''}`}>
      {mobile && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
        <div className="side-head">
          <Logo compact={collapsed} />
          <Button
            variant="ghost"
            className="mobile-close"
            onClick={() => setMobile(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </Button>
        </div>
        <div className="company">
          <span className="company-mark">{companyInitials}</span>
          {!collapsed && (
            <>
              <span>
                <b>{profile.company.name}</b>
                <small>{profile.company.defaultCurrency} workspace</small>
              </span>
              <ChevronsUpDown size={14} />
            </>
          )}
        </div>
        <nav aria-label="Main navigation">
          {nav.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setMobile(false)}
              title={collapsed ? label : undefined}
            >
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom">
          {!collapsed && (
            <div className="upgrade">
              <span>14 days left</span>
              <small>Upgrade to keep all features.</small>
              <button>View plans</button>
            </div>
          )}
          <button
            className="collapse"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <>
                <PanelLeftClose size={18} /> Collapse sidebar
              </>
            )}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Button
            variant="ghost"
            className="menu-trigger"
            onClick={() => setMobile(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>
          <h2>{title}</h2>
          <label className="global-search">
            <Search size={16} />
            <span className="sr-only">Global search</span>
            <input placeholder="Search anything…" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <Button
              variant="ghost"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i className="notify" />
            </Button>
            <div className="avatar">{userInitials}</div>
            <span className="user-name">
              <b>{profile.user.fullName}</b>
              <small>{role}</small>
            </span>
            <Button variant="ghost" aria-label="Sign out" title="Sign out" onClick={() => void logout()}>
              <LogOut size={17} />
            </Button>
          </div>
        </header>
        <main>{children}</main>
      </div>
      <NavLink
        to="/invoices/new"
        className="mobile-fab"
        aria-label="Create invoice"
      >
        <Plus />
      </NavLink>
    </div>
  );
}
