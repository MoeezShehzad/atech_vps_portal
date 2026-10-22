import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import atcLogo from '../assets/ATC_Logo.png';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Strict check: Only consider logged in if both isAuthenticated is true AND user exists
  const isLoggedIn = Boolean(isAuthenticated && user);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF8]/90 dark:bg-[#050816]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-850/80 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={atcLogo} 
            alt="Analytical Technical Consulting" 
            width="160" 
            height="40" 
            fetchPriority="high" 
            className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-102" 
          />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm tracking-wide transition-colors duration-200 ${
                isActive(link.path)
                  ? 'text-blue-600 dark:text-[#52D9FF] font-semibold'
                  : 'text-slate-600 dark:text-[#A6B0C3] hover:text-slate-950 dark:hover:text-[#F5F7FF] font-medium'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Render Dashboard ONLY when genuinely logged in */}
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`text-sm font-medium tracking-wide transition-colors ${
                isActive('/dashboard')
                  ? 'text-blue-600 dark:text-[#52D9FF] font-semibold'
                  : 'text-slate-600 dark:text-[#A6B0C3] hover:text-slate-950 dark:hover:text-[#F5F7FF]'
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* DESKTOP AUTH ACTION BUTTONS & THEME TOGGLE */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-slate-100 dark:bg-[#111A30] text-slate-800 dark:text-slate-200 border border-transparent dark:border-slate-700/80 rounded-full text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 rounded-full text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-[#A6B0C3] hover:text-blue-600 dark:hover:text-[#52D9FF] transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/contact"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all flex items-center gap-2"
              >
                <span>Book Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE & MOBILE THEME TOGGLE */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#0A1024] border-b border-slate-200 dark:border-slate-800 px-6 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-2 ${
                isActive(link.path) 
                  ? 'text-blue-600 dark:text-[#52D9FF] font-semibold' 
                  : 'text-slate-700 dark:text-[#A6B0C3]'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-2 ${
                isActive('/dashboard') 
                  ? 'text-blue-600 dark:text-[#52D9FF] font-semibold' 
                  : 'text-slate-700 dark:text-[#A6B0C3]'
              }`}
            >
              Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold text-center"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-[#111A30] text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <span>Book Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
