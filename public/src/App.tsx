import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import atcLogo from './assets/ATC_Logo.png';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import { Menu, X } from 'lucide-react';

// Route Code-Splitting with Lazy Loading
const Home = lazy(() => import('./pages/Home'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Services = lazy(() => import('./pages/Services'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddtoCart = lazy(() => import('./pages/AddtoCart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));

// Lightweight, seamless route suspense fallback
function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hide Navbar/Footer on Auth pages and Callback route
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/auth/callback'].includes(location.pathname);

  // Check if user is actively logged in
  const isLoggedIn = Boolean(isAuthenticated && user);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-poppins font-sans">
      {/* Resets scroll position on every page navigation */}
      <ScrollToTop />

      {/* NAVBAR (Hidden on Auth Pages & Callback) */}
      {!isAuthPage && (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <nav className="px-4 sm:px-10 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 font-bold text-blue-950 font-poppins">
              <img src={atcLogo} alt="ATC Logo" width="160" height="40" fetchPriority="high" className="h-9 sm:h-10 w-auto object-contain" />
              <span className="text-sm sm:text-lg">Analytical Technical Consulting (ATC)</span>
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

              {/* Render Admin Console if user is Admin */}
              {isLoggedIn && (user?.role?.toLowerCase() === 'admin' || user?.roles?.some(r => r.toLowerCase() === 'admin')) && (
                <Link to="/admin" className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-all border border-rose-200 dark:border-rose-900">
                  Admin Console
                </Link>
              )}
            </div>

            <div className="hidden md:flex gap-3 items-center">
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

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>

          {/* Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3 shadow-lg">
              <div className="flex flex-col space-y-2.5 text-sm font-semibold text-slate-700">
                <Link to="/" className="py-1.5 hover:text-blue-600">Home</Link>
                <Link to="/about" className="py-1.5 hover:text-blue-600">About Us</Link>
                <Link to="/services" className="py-1.5 hover:text-blue-600">Services</Link>
                <Link to="/pricing" className="py-1.5 hover:text-blue-600">Pricing</Link>
                <Link to="/contact" className="py-1.5 hover:text-blue-600">Contact</Link>
                {isLoggedIn && (
                  <Link to="/dashboard" className="py-1.5 text-blue-600 font-bold">Dashboard</Link>
                )}
                {isLoggedIn && (user?.role?.toLowerCase() === 'admin' || user?.roles?.some(r => r.toLowerCase() === 'admin')) && (
                  <Link to="/admin" className="py-1.5 text-rose-600 font-bold">Admin Console</Link>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-xl border border-rose-200 font-semibold text-sm text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    Log out
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full py-2.5 text-center rounded-xl border border-slate-200 font-semibold text-sm text-blue-950 hover:border-blue-600"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="w-full py-2.5 text-center rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-500/20"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* DYNAMIC PAGE VIEWS */}
      <main className="flex-1">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/configure" element={<AddtoCart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

            {/* PROTECTED ROUTE */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* SECURE ADMIN ROUTE (Protected by Role Guard) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* FOOTER */}
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}