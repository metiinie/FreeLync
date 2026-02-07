import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  User,
  Home,
  Plus,
  LogOut,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Activity,
  ShoppingBag,
  Tag,
  Key,
  X,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, NavLink, Link, useLocation } from 'react-router-dom';
import logoImage from '@/components/Images/Logo.png';

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showActivityMenu, setShowActivityMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar_url]);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      setIsSearchExpanded(false);

      if (location.pathname.includes('/rent')) {
        navigate(`/rent?search=${encodeURIComponent(trimmedQuery)}`);
      } else {
        // Default to buy/browse
        navigate(`/buy?search=${encodeURIComponent(trimmedQuery)}`);
      }
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
      ? 'text-primary bg-primary/10'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-muted/60'
    }`;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-border/60 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img src={logoImage} alt="FreeLync" className="w-8 h-8 object-contain" />
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white hidden sm:block">FreeLync</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <NavLink to="/" className={navLinkClass}>Home</NavLink>
              <NavLink to="/buy" className={navLinkClass}>Browse</NavLink>

              <div className="relative ml-1">
                <button
                  onClick={() => setShowActivityMenu(!showActivityMenu)}
                  onBlur={() => setTimeout(() => setShowActivityMenu(false), 200)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${showActivityMenu
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-muted/60'
                    }`}
                >
                  <Activity className="w-4 h-4 mr-1" />
                  <span>Activity</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showActivityMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showActivityMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-border/60 dark:border-gray-800 py-1 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => navigate('/buy')}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Buy</span>
                      </button>
                      <button
                        onClick={() => navigate('/rent')}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <Key className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Rent</span>
                      </button>
                      <button
                        onClick={() => navigate('/sell')}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <Tag className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">Sell</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
            </nav>
          </div>

          {/* Right side: Search, Theme, Notifications, User */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Expandable Search */}
            <div className="relative flex items-center">
              <motion.div
                initial={false}
                animate={{
                  width: isSearchExpanded ? (window.innerWidth < 640 ? '160px' : '300px') : '40px',
                  backgroundColor: isSearchExpanded ? (theme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.8)') : 'transparent',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`flex items-center rounded-full overflow-hidden ${isSearchExpanded ? 'border border-primary/30' : ''}`}
              >
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className={`p-2 rounded-full transition-colors flex-shrink-0 ${isSearchExpanded ? 'text-primary' : 'hover:bg-muted/60 text-gray-600 dark:text-gray-400'}`}
                >
                  {isSearchExpanded ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
                <AnimatePresence>
                  {isSearchExpanded && (
                    <motion.input
                      ref={searchInputRef}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchSubmit}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-900 dark:text-white pr-4 py-2"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-muted/60 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
              )}
            </button>

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl hover:bg-muted/60 dark:hover:bg-gray-800 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-soft dark:shadow-2xl border border-border/60 dark:border-gray-800 z-50"
                    >
                      <div className="p-4 border-b border-border/60 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-muted/60 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                                }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    {new Date(notification.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-muted/60 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 to-cyan-400 shadow-sm">
                    {user?.avatar_url && !avatarError ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'User'}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-52 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-soft dark:shadow-2xl border border-border/60 dark:border-gray-800 z-50 overflow-hidden"
                    >
                      <div className="py-1">
                        <div className="px-4 py-3 border-b border-border/60 dark:border-gray-800">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/dashboard');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <Home className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/sell');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Sell/Rent</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/profile?tab=settings');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <hr className="my-1 dark:border-gray-700" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-medium rounded-xl btn-gradient text-white shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
