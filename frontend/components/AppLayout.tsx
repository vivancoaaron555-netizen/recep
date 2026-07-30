'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, LayoutDashboard, Phone, Calendar, Settings,
  LogOut, Menu, X, Shield, Bell, ChevronDown,
  Building2, User, Check, ExternalLink, Clock, CalendarDays
} from 'lucide-react';
import { api, setApiToken } from '@/lib/api';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calls', label: 'Llamadas', icon: Phone },
  { href: '/appointments', label: 'Citas', icon: Calendar },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.backendToken) {
      router.push('/login');
      return;
    }
    setApiToken(session.backendToken);
    if (session.user) setUser(session.user);
    if (session.company) setCompany(session.company);

    api.auth.me().then(({ user: u, company: c, subscription: s }) => {
      setUser(u);
      setCompany(c);
      setSubscription(s);
      if (c && !c.onboarding_completed) {
        router.push('/trial');
      }
    }).catch(() => {
      router.push('/login');
    });
  }, [session, status, router]);

  useEffect(() => {
    const fetchNotifs = () => {
      api.notifications.unreadCount().then(d => setUnreadCount(d.count)).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      api.notifications.list().then(d => setNotifications(d.notifications)).catch(() => {});
    }
  };

  const handleMarkRead = async (id?: string) => {
    const ids = id ? [id] : undefined;
    await api.notifications.markRead(ids);
    if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    setUnreadCount(0);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
    toast.success('Sesión cerrada');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg">Recept<span className="text-primary">.ai</span></span>
      </div>

      {/* Company info */}
      {company && (
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{company.name}</p>
              <p className="text-xs text-muted-foreground truncate">{company.sector}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={handleOpenNotifications}
            className="sidebar-link w-full justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              <span>Notificaciones</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-medium">Notificaciones</span>
                {unreadCount > 0 && (
                  <button onClick={() => handleMarkRead()} className="text-xs text-primary hover:underline">
                    Marcar todas leídas
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Sin notificaciones</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id}
                    className={`px-3 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.type === 'appointment' ? 'bg-green-500/15' : 'bg-primary/15'
                      }`}>
                        {n.type === 'appointment' ? (
                          <CalendarDays className="w-3 h-3 text-green-500" />
                        ) : (
                          <Bell className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(n.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>

        {user?.role === 'admin' && (
          <Link href="/admin"
            onClick={() => setSidebarOpen(false)}
            className={pathname === '/admin' ? 'sidebar-link-active' : 'sidebar-link'}>
            <Shield className="w-4 h-4 flex-shrink-0" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Subscription badge */}
      {subscription && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Plan actual</span>
            <span className={`badge ${subscription.status === 'active' ? 'badge-primary' : subscription.status === 'trialing' ? 'badge-warning' : 'badge-error'}`}>
              {subscription.plan?.toUpperCase()} · {subscription.status === 'trialing' ? 'Trial' : subscription.status}
            </span>
          </div>
        </div>
      )}

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost p-1.5 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="relative w-64 bg-card border-r border-border z-10"
          >
            <button
              className="absolute top-4 right-4 btn-ghost p-1.5"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Recept<span className="text-primary">.ai</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenNotifications} className="btn-ghost p-2 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
