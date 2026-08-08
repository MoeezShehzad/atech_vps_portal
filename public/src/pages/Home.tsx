import React from 'react';
import { ArrowRight, Server, Shield, Cpu, Award, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> Enterprise IT Consulting
          </div>
          <h1 className="text-5xl font-extrabold text-blue-950 leading-tight mb-6 font-poppins">
            Transforming your business with <span className="text-blue-600">IT Solutions</span> that drive success.
          </h1>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            Analytical Technical Consulting provides data center design, infrastructure management, and specialized cloud systems engineered for high availability and reliability.
          </p>
          <div className="flex gap-4">
            <Link to="/contact" className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2">
              Get Consultation <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/services" className="px-6 py-3 rounded-full border border-slate-200 font-semibold text-sm text-blue-950 hover:border-blue-600 transition-all">
              Our Services
            </Link>
          </div>
        </div>

        {/* PREVIEW CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-blue-950/5 border-t-4 border-t-blue-600 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-950">4.9 / 5.0</h3>
              <p className="text-sm text-slate-500 font-medium">Client Satisfaction Score</p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-extrabold text-blue-950 font-poppins">30+</p>
              <p className="text-xs text-slate-500 font-medium mt-1">IT Projects Completed</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-600 font-poppins">99.9%</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Infrastructure Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="max-w-6xl mx-auto px-8 py-16 border-t border-slate-100">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-blue-950 mb-3 font-poppins">Core Capabilities</h2>
          <p className="text-slate-600">Reliable infrastructure built for enterprise performance.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:border-blue-600 transition-all">
            <Server className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-blue-950 mb-2">Data Center Management</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Design, deploy, and maintain hypervisors with high availability and automated disaster recovery.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:border-blue-600 transition-all">
            <Shield className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-blue-950 mb-2">Infrastructure Security</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Systematic auditing, boundary defense, access controls, and multi-tier backup validation.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:border-blue-600 transition-all">
            <Cpu className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-blue-950 mb-2">Hardware Optimization</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Precision hardware sizing and workload balancing to eliminate system bottlenecks.</p>
          </div>
        </div>
      </section>
    </div>
  );
}