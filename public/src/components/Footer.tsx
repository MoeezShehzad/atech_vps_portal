import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MapPin } from 'lucide-react';
import atcLogo from '../assets/ATC_Logo.png';

export default function Footer() {
  const socialLinks = [
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      href: '#',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.69c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.21.19 2.21.19v2.43h-1.25c-1.22 0-1.6.76-1.6 1.54V12h2.74l-.44 3H13.1v6.8c4.56-.93 8-4.96 8-9.8z"/>
        </svg>
      )
    },
    {
      name: 'X / Twitter',
      href: '#',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'YouTube',
      href: '#',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      name: 'Pinterest',
      href: '#',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z"/>
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-slate-950 text-slate-300 font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 items-start">
          
          {/* COLUMN 1: CONTACT */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins">Contact</h3>
            
            <div className="space-y-1 text-sm">
              <a 
                href="mailto:info@atechconsult.com" 
                className="block text-slate-200 font-semibold hover:text-blue-400 transition-colors"
              >
                info@atechconsult.com
              </a>
              <a 
                href="tel:+16306967721" 
                className="block text-slate-200 font-semibold hover:text-blue-400 transition-colors"
              >
                +1 630-696-7721
              </a>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Address
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                1360 Brentwood Trl,<br />
                Bolingbrook, IL 60490, United States
              </p>
            </div>

            <div className="pt-2">
              <img 
                src={atcLogo} 
                alt="Analytical Technical Consulting" 
                className="h-8 w-auto object-contain brightness-200 opacity-80" 
              />
            </div>
          </div>

          {/* COLUMN 2: COMPANY LINKS */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-300 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors">
                  About me
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-300 hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: LOCATION MAP CARD */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins">Location</h3>
            
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group shadow-lg">
              <div className="h-48 w-full bg-slate-800 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                <a
                  href="https://maps.google.com/?q=1360+Brentwood+Trl,+Bolingbrook,+IL+60490"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 left-3 z-10 bg-white/90 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white transition-all flex items-center gap-1.5 shadow-md"
                >
                  Open in Maps <ExternalLink className="w-3 h-3 text-blue-600" />
                </a>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-2.5 bg-rose-600 text-white rounded-full shadow-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Bolingbrook, IL Center</span>
                <span className="text-emerald-400 font-medium">Data Center Hub</span>
              </div>
            </div>
          </div>

          {/* COLUMN 4: SOCIAL ACCOUNTS */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins">Social Accounts</h3>
            
            <div className="flex flex-col gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-full border border-slate-800 bg-slate-900 hover:bg-blue-600 hover:border-blue-500 hover:text-white text-slate-400 transition-all flex items-center justify-center shadow-sm"
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Analytical Technical Consulting. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}