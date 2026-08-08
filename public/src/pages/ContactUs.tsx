import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans py-16 px-8">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
        <div>
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Get In Touch</span>
          <h1 className="text-4xl font-extrabold text-blue-950 mt-2 font-poppins">Contact ATC</h1>
          <p className="text-slate-600 mt-4 text-sm leading-relaxed mb-8">
            Reach out to our engineering team for consultations, infrastructure design, or technical assistance.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Email</p>
                <p className="text-sm font-bold text-blue-950">info@atechconsult.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Phone</p>
                <p className="text-sm font-bold text-blue-950">+1 630-696-7721</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Address</p>
                <p className="text-sm font-bold text-blue-950">1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xl shadow-blue-950/5">
          {submitted ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-bold text-emerald-600 mb-2">Message Sent!</h3>
              <p className="text-slate-600 text-sm">Thank you for reaching out. We will respond shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="John Doe" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="john@example.com" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea required rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="Tell us about your technical needs..."></textarea>
              </div>

              <button type="submit" className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}