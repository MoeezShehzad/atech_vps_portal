import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import atcLogo from '../assets/ATC_Logo.png';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* DESKTOP AUTH ACTION BUTTONS */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold hover:bg-slate-200 transition-all flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-xs font-semibold hover:bg-rose-100 transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-2 ${
                isActive(link.path) ? 'text-blue-600 font-semibold' : 'text-slate-600'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-2 ${
                isActive('/dashboard') ? 'text-blue-600 font-semibold' : 'text-slate-600'
              }`}
            >
              Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold text-center"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}