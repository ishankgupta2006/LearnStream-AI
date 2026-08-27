import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, GraduationCap, User, LogOut, ChevronDown, Sparkles, BookOpen, Zap } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { useAuth } from '@/app/context/AuthContext';

export const Header = ({ onNavigate }) => {
  const { darkMode, toggleDarkMode, resetToInput, currentStep } = useApp();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate('profile');
      setShowDropdown(false);
    }
  };

  const handleDashboardClick = () => {
    if (onNavigate) {
     onNavigate('folders');
      setShowDropdown(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
              <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <button 
              onClick={currentStep === 'input' ? handleDashboardClick : resetToInput}
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              LearnStream AI
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </button>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              AI-Powered Learning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Step Indicator */}
          {currentStep !== 'input' && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/50 dark:border-indigo-800/50">
              <div className={`w-2.5 h-2.5 rounded-full ${currentStep === 'processing' ? 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50' : 'bg-emerald-500 shadow-lg shadow-emerald-500/50'}`}></div>
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                {currentStep === 'processing' ? 'Processing...' : 'Ready'}
              </span>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 transition-all duration-300 border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm hover:shadow-md group overflow-hidden"
            aria-label="Toggle dark mode"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-orange-500/0 group-hover:from-amber-400/20 group-hover:to-orange-500/20 dark:group-hover:from-indigo-500/20 dark:group-hover:to-purple-500/20 transition-all duration-300"></div>
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 rounded-xl px-3 py-2 transition-all duration-300 border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm hover:shadow-md group"
            >
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <span className="hidden md:block text-sm font-semibold text-neutral-800 dark:text-white">
                {user?.name}
              </span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/50 dark:border-neutral-700/50 py-2 animate-fade-in overflow-hidden">
                {/* User Info Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border-b border-neutral-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[150px]">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/20 text-neutral-700 dark:text-neutral-300 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium">My Profile</span>
                  </button>

                  <button
                    onClick={handleDashboardClick}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 dark:hover:from-purple-500/20 dark:hover:to-pink-500/20 text-neutral-700 dark:text-neutral-300 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium">Dashboard</span>
                  </button>
                </div>

                <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 pt-2 mx-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all duration-200 rounded-xl group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};