import { useState, useEffect } from 'react';
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
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/components/Images/Logo.png';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar_url]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-border/60 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl hover:bg-muted/60 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Logo on mobile/small screens */}
            <div className="flex items-center space-x-2 md:hidden">
              <img src={logoImage} alt="FreeLync" className="w-8 h-8 object-contain" />
              <span className="font-bold text-gray-900 dark:text-white">FreeLync</span>
            </div>

            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  className="pl-10 pr-4 py-2 w-64 border border-input dark:border-gray-700 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search button for mobile */}
            <button className="p-2 rounded-xl hover:bg-muted/60 transition-colors md:hidden">
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

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
                      {notifications.length > 5 && (
                        <div className="p-4 border-t border-border/60">
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View all notifications
                          </button>
                        </div>
                      )}
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 to-cyan-400">
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
                    {user?.full_name}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-soft dark:shadow-2xl border border-border/60 dark:border-gray-800 z-50"
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/dashboard');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <Home className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/sell');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Sell/Rent</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/profile?tab=settings');
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-muted/60 dark:hover:bg-gray-800"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <hr className="my-2 dark:border-gray-700" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-medium rounded-xl btn-gradient"
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
