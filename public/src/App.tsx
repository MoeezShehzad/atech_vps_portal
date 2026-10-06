import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Services from './pages/Services';
import ContactUs from './pages/ContactUs';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AddtoCart from './pages/AddtoCart';
import Checkout from './pages/Checkout';
import atcLogo from './assets/ATC_Logo.png';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import AuthCallback from './pages/AuthCallback';

// Scroll Reset Component for Route Navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  // Hide Navbar/Footer on Auth pages and Callback route
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/auth/callback'].includes(location.pathname);

  // Check if user is actively logged in
  const isLoggedIn = Boolean(isAuthenticated && user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans">
      {/* Resets scroll position on every page navigation */}
      <ScrollToTop />

      {/* NAVBAR (Hidden on Auth Pages & Callback) */}
      {!isAuthPage && (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-bold text-blue-950 font-poppins">
            <img src={atcLogo} alt="ATC Logo" className="h-8 w-auto object-contain" />
            <span className="text-lg">Analytical Technical Consulting</span>
          </Link>

          <div className="hidden md:flex gap-8 items-center text-sm font-semibold text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link>
            <Link to="/services" className="hover:text-blue-600 transition-colors">Services</Link>
            <Link to="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>

            {/* Render Dashboard ONLY when signed in */}
            {isLoggedIn && (
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex gap-3 items-center">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-full border border-rose-200 font-semibold text-sm text-rose-600 hover:bg-rose-50 transition-all"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full border border-slate-200 font-semibold text-sm text-blue-950 hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* DYNAMIC PAGE VIEWS */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/services" element={<Services />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/configure" element={<AddtoCart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* PROTECTED ROUTE */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* FOOTER */}
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}