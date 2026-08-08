import React from 'react';
import { Target, Eye, Check } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans py-16 px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Who We Are</span>
          <h1 className="text-4xl font-extrabold text-blue-950 mt-2 font-poppins">About Analytical Technical Consulting</h1>
          <p className="text-slate-600 text-lg mt-4 leading-relaxed">
            Analytical Technical Consulting (ATC) delivers IT solutions designed for maximum operational efficiency, reliability, and security across data center infrastructures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <Target className="w-8 h-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-blue-950 mb-2">Our Mission</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              To deliver technical consulting and infrastructure engineering that maximizes efficiency and guarantees operational continuity for modern enterprises.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <Eye className="w-8 h-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-blue-950 mb-2">Our Vision</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              To lead as a trusted global authority in server infrastructure design, data integrity, and high-performance server architectures.
            </p>
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-blue-950 mb-6 font-poppins">Our Commitments</h2>
          <div className="space-y-4">
            {[
              'Precision hardware sizing and resource allocation',
              'Enterprise-grade disaster recovery and business continuity',
              'Multi-layered system security and permission auditing',
              'Tailored end-to-end consulting for virtualized environments'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-slate-700 text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}