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
    <header className="sticky top-0 z-50 bg-[#030611]/90 backdrop-blur-2xl border-b border-white/10 transition-colors duration-300 font-sans relative">
      {/* Luminous High-Tech Fiber Optic Hairline Guide */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#55DFFF]/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO & LIVE DATACENTER TELEMETRY */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group relative">
            <div className="absolute -inset-2 bg-[#55DFFF]/15 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <img 
              src={atcLogo} 
              alt="Analytical Technical Consulting" 
              width="150" 
              height="36" 
              fetchPriority="high" 
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102 brightness-110" 
            />
          </Link>

          {/* Live Data Center Infrastructure Status Beacon */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#070D1D]/90 border border-white/10 text-[11px] shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[#A4AEC3] font-mono tracking-wider">US-EAST • 100% HEALTH</span>
          </div>
        </div>

        {/* NEXA-STYLE FLOATING LIQUID GLASS CAPSULE NAVIGATION */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 px-6 py-2 rounded-full bg-[#070D1D]/80 border border-white/10 shadow-xl shadow-black/40 backdrop-blur-xl">
          {navLinks.map((link) => (
            <Link
              key={link.name + link.path}
              to={link.path}
              className={`text-xs font-medium tracking-wider flex items-center gap-2 transition-all duration-200 ${
                isActive(link.path)
                  ? 'text-[#55DFFF] font-semibold drop-shadow-[0_0_8px_rgba(85,223,255,0.4)]'
                  : 'text-[#A4AEC3] hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive(link.path) ? 'bg-[#55DFFF] shadow-[0_0_6px_#55DFFF]' : 'bg-slate-600'}`} />
              <span>{link.name}</span>
            </Link>
          ))}
          
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`text-xs font-medium tracking-wider flex items-center gap-2 transition-all ${
                isActive('/dashboard')
                  ? 'text-[#55DFFF] font-semibold'
                  : 'text-[#A4AEC3] hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        {/* RIGHT: THEME TOGGLE & NEXA GLOWING PILL BUTTON ("Let's talk") */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-[#0C1428] text-slate-200 border border-white/10 rounded-full text-xs font-semibold hover:bg-[#111A30] hover:border-cyan-400/50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" /> Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-950/40 text-rose-400 border border-rose-900/60 rounded-full text-xs font-semibold hover:bg-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-[#A4AEC3] hover:text-[#55DFFF] transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/contact"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-full transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 duration-200"
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
            className="p-2 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070D1D]/98 backdrop-blur-2xl border-b border-white/10 px-6 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name + link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-2 flex items-center gap-2 ${
                isActive(link.path) 
                  ? 'text-[#55DFFF] font-semibold' 
                  : 'text-[#A4AEC3] hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive(link.path) ? 'bg-[#55DFFF]' : 'bg-slate-600'}`} />
              <span>{link.name}</span>
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-2 text-[#A4AEC3] hover:text-white"
            >
              Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 bg-rose-950/40 text-rose-400 border border-rose-900/60 rounded-xl text-xs font-semibold text-center"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-[#0C1428] text-[#F5F7FF] border border-white/10 rounded-xl text-xs font-semibold text-center hover:bg-[#111A30]"
                >
                  Log in
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-xl text-xs font-bold text-center shadow-lg shadow-cyan-500/25"
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
