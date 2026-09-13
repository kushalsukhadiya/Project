import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../services/api';
import { Notification } from '../types';
import { 
  Menu, X, Bell, LogOut, User as UserIcon, 
  Leaf, Award, BarChart3, MapPin, Recycle, CheckCheck 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Determine navbar links based on role
  const getNavLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'citizen':
        return [
          { name: 'Dashboard', path: '/citizen', icon: Leaf },
          { name: 'Report Plastic', path: '/report-waste', icon: MapPin }
        ];
      case 'collector':
        return [
          { name: 'Collector Dashboard', path: '/collector', icon: Leaf }
        ];
      case 'recycler':
        return [
          { name: 'Recycler Dashboard', path: '/recycler', icon: Recycle }
        ];
      case 'admin':
        return [
          { name: 'Admin Control', path: '/admin', icon: BarChart3 }
        ];
      case 'municipal':
        return [
          { name: 'Municipal Control', path: '/municipal', icon: Leaf }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-500 font-extrabold text-2xl tracking-tight">
            <Leaf className="w-8 h-8 text-emerald-500 animate-pulse" />
            <span className="font-sans">EcoCycle</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive(link.path)
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user && (
              <>
                {/* Notifications Icon & Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      fetchNotifications();
                    }}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Alert Center</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Read all</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications to display.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                              className={`p-3.5 text-xs text-left cursor-pointer transition ${
                                notif.read 
                                  ? 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                                  : 'bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 font-medium'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`font-semibold ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 mt-2 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-2 ring-emerald-500/20"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center space-x-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            )}

            {!user && (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-600 dark:text-slate-350 px-3 py-2 text-sm font-semibold hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-semibold ${
                  isActive(link.path)
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          
          {user ? (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-350 font-semibold"
              >
                <UserIcon className="w-5 h-5" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-red-600 dark:text-red-400 font-bold"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-slate-600 dark:text-slate-350 py-2.5 font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl shadow-md"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
