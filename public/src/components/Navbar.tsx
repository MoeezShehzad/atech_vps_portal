import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import atcLogo from '../assets/ATC_Logo.png';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoggedIn = Boolean(isAuthenticated && user);
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Services', path: '/services' },
    { name: 'About us', path: '/about' },
    { name: 'Infrastructure', path: '/services' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact us', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF8]/85 dark:bg-[#030611]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/5 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={atcLogo} 
            alt="Analytical Technical Consulting" 
            width="150" 
            height="36" 
            fetchPriority="high" 
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102" 
          />
        </Link>

        {/* NEXA-STYLE MINIMAL CENTER NAVIGATION WITH BULLETS */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name + link.path}
              to={link.path}
              className={`text-xs font-medium tracking-wider flex items-center gap-2 transition-all duration-200 ${
                isActive(link.path)
                  ? 'text-blue-600 dark:text-[#55DFFF] font-semibold'
                  : 'text-slate-600 dark:text-[#A4AEC3] hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${isActive(link.path) ? 'bg-blue-600 dark:bg-[#55DFFF]' : 'bg-slate-400 dark:bg-slate-600'}`} />
              <span>{link.name}</span>
            </Link>
          ))}
          
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`text-xs font-medium tracking-wider flex items-center gap-2 transition-all ${
                isActive('/dashboard')
                  ? 'text-blue-600 dark:text-[#55DFFF] font-semibold'
                  : 'text-slate-600 dark:text-[#A4AEC3] hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        {/* RIGHT: THEME TOGGLE & NEXA MINIMAL PILL BUTTON ("Let's talk") */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-slate-100 dark:bg-[#0C1428] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-full text-xs font-semibold hover:bg-slate-200 dark:hover:bg-[#111A30] transition-all flex items-center gap-1.5"
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
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-[#A4AEC3] hover:text-blue-600 dark:hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/contact"
                className="px-6 py-2.5 bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-xs font-bold rounded-full hover:bg-blue-600 dark:hover:bg-blue-50 hover:text-white dark:hover:text-blue-600 transition-all shadow-md hover:shadow-lg hover:scale-102 duration-200"
              >
                Let's talk
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
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
        <div className="md:hidden bg-white dark:bg-[#070D1D] border-b border-slate-200 dark:border-white/10 px-6 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name + link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-2 flex items-center gap-2 ${
                isActive(link.path) 
                  ? 'text-blue-600 dark:text-[#55DFFF] font-semibold' 
                  : 'text-slate-700 dark:text-[#A4AEC3]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{link.name}</span>
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-2 text-slate-700 dark:text-[#A4AEC3]"
            >
              Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2.5">
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
                  className="w-full py-2.5 bg-slate-100 dark:bg-[#0C1428] text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-bold text-center shadow-md"
                >
                  Let's talk
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
