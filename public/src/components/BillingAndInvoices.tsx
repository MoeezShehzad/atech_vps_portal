// ==============================================================================
// Component: BillingAndInvoices.tsx
// Purpose: Manage subscriptions, recurring payments, and print enterprise invoices
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  Calendar, 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Server, 
  FileText,
  Download
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';

interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  issueDate: string;
  paidDate: string | null;
  paymentMethod: string;
}

interface Subscription {
  subscriptionId: number;
  planName: string;
  monthlyPrice: number;
  currency: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  daysRemaining: number;
  vmCount: number;
  vms: { vmId: number; vmName: string; specs: string }[];
}

export default function BillingAndInvoices() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/billing/overview');
      setSummary(res.summary);
      setSubscriptions(res.subscriptions || []);
      setInvoices(res.invoices || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleOpenInvoiceModal = async (invoiceId: string) => {
    try {
      const res = await apiCall(`/billing/invoices/${invoiceId}`);
      setSelectedInvoice(res.invoice);
    } catch (err: any) {
      toast.error('Failed to load invoice receipt');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadInvoice = async (invoiceNumber: string) => {
    try {
      toast.info('Generating official invoice document...');
      let inv = selectedInvoice;
      if (!inv || inv.invoiceNumber !== invoiceNumber) {
        const res = await apiCall(`/billing/invoices/${invoiceNumber}`);
        inv = res.invoice;
      }
      if (!inv) throw new Error('Invoice data could not be retrieved.');

      const invoiceHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${inv.invoiceNumber} - ATECH Cloud</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
    .invoice-box { max-width: 800px; margin: auto; padding: 36px; border: 1px solid #e2e8f0; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: 0.5px; text-transform: uppercase; }
    .badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; font-weight: 700; font-size: 12px; border-radius: 999px; }
    .info-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
    .card { background: #f8fafc; padding: 18px 20px; border-radius: 8px; flex: 1; border: 1px solid #f1f5f9; }
    .card h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase; }
    td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .total-row { display: flex; justify-content: flex-end; margin-top: 10px; }
    .total-box { width: 300px; }
    .total-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .total-grand { font-size: 18px; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 6px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 24px; }
    .print-bar { margin-bottom: 24px; display: flex; justify-content: flex-end; gap: 10px; }
    .print-btn { background: #2563eb; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; text-decoration: none; }
    @media print { .print-bar { display: none; } .invoice-box { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="print-bar">
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <div class="header">
      <div>
        <div class="logo">ATECH CLOUD</div>
        <p style="font-size: 13px; color: #64748b; margin: 6px 0 0 0; line-height: 1.5;">
          ATECH VPS Portal & Infrastructure Services<br>
          customer-support@atechconsult.com
        </p>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0; font-size: 20px;">INVOICE</h2>
        <div style="font-family: monospace; font-size: 15px; font-weight: 700; color: #2563eb; margin-top: 4px;">${inv.invoiceNumber}</div>
        <div style="margin-top: 8px;"><span class="badge">PAID IN FULL</span></div>
      </div>
    </div>

    <div class="info-grid">
      <div class="card">
        <h4>Billed To</h4>
        <div style="font-weight: 700;">${inv.customer?.name || 'Customer'}</div>
        <div style="color: #64748b; font-size: 13px;">${inv.customer?.email || ''}</div>
        <div style="color: #64748b; font-size: 13px;">${inv.customer?.city || ''}, ${inv.customer?.country || ''}</div>
      </div>
      <div class="card">
        <h4>Invoice Details</h4>
        <div style="font-size: 13px;"><strong>Issue Date:</strong> ${new Date(inv.issueDate).toLocaleDateString()}</div>
        <div style="font-size: 13px;"><strong>Paid Date:</strong> ${inv.paidDate ? new Date(inv.paidDate).toLocaleDateString() : new Date(inv.issueDate).toLocaleDateString()}</div>
        <div style="font-size: 13px;"><strong>Payment Method:</strong> ${inv.transactionId ? 'Stripe Card (' + inv.transactionId + ')' : 'Direct Card'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Specs</th>
          <th>Period</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(inv.items || []).map((item: any) => `
        <tr>
          <td><strong>${item.description}</strong></td>
          <td style="color: #64748b; font-size: 13px;">${item.specs || 'Dedicated Cloud Compute'}</td>
          <td style="color: #64748b; font-size: 13px;">${item.period || 'Monthly Subscription'}</td>
          <td style="text-align: right; font-weight: 700;">$${Number(item.amount).toFixed(2)} USD</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="total-row">
      <div class="total-box">
        <div class="total-line"><span>Subtotal:</span><span>$${Number(inv.subtotal).toFixed(2)} USD</span></div>
        <div class="total-line"><span>Tax (0%):</span><span>$${Number(inv.tax || 0).toFixed(2)} USD</span></div>
        <div class="total-line total-grand"><span>Total Paid:</span><span style="color: #2563eb;">$${Number(inv.total).toFixed(2)} USD</span></div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing ATECH Cloud Services • billing@atechconsult.com</p>
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${inv.invoiceNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Invoice ${inv.invoiceNumber} downloaded successfully!`);
    } catch (e: any) {
      toast.error('Failed to download invoice: ' + e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">
              Billing & Invoices
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Account in Good Standing
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review active cloud subscriptions, monthly spend burn rate, and download official payment receipts.
          </p>
        </div>

        <button
          onClick={fetchBilling}
          disabled={loading}
          className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          title="Refresh billing data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Spend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Monthly Recurring Spend</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            ${summary?.monthlySpend?.toFixed(2) || '0.00'} <span className="text-xs font-sans text-slate-400">/ mo</span>
          </div>
          <p className="text-[11px] text-slate-400">Auto-renews monthly</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Next Billing Date</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-poppins">
            {summary?.nextBillingDate ? new Date(summary.nextBillingDate).toLocaleDateString() : 'N/A'}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Scheduled recurring invoice</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Subscriptions</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {subscriptions.length} <span className="text-xs font-sans text-slate-400">Slots</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">All systems operational</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Payment Method</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <span>{summary?.paymentMethod?.brand || 'Visa'}</span>
            <span>•••• {summary?.paymentMethod?.last4 || '4242'}</span>
          </div>
          <p className="text-[11px] text-slate-400">Expires {summary?.paymentMethod?.expMonth || '12'}/{summary?.paymentMethod?.expYear || '2028'}</p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white font-poppins">Active Subscription Slots</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Committed compute capacity linked to your virtual instances</p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-xs">
            No active subscriptions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3.5 px-6">Plan Specification</th>
                  <th className="py-3.5 px-6">Associated VM</th>
                  <th className="py-3.5 px-6">Rate</th>
                  <th className="py-3.5 px-6">Renewal Countdown</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {subscriptions.map((sub) => (
                  <tr key={sub.subscriptionId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                      {sub.planName}
                    </td>
                    <td className="py-4 px-6">
                      {sub.vms.length > 0 ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {sub.vms[0].vmName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{sub.vms[0].specs}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Available Slot</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      ${sub.monthlyPrice.toFixed(2)} / mo
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Renews in {sub.daysRemaining} days
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white font-poppins">Invoice & Receipt Ledger</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Download past VAT and payment receipts for bookkeeping</p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-xs">
            No invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Billing Period / Item</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {inv.description}
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      ${inv.amount.toFixed(2)} USD
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                          title="Download Invoice Directly"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-blue-200/60 dark:border-blue-800"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Download
                        </button>
                        <button
                          onClick={() => handleOpenInvoiceModal(inv.invoiceNumber)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ENTERPRISE INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Official Payment Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice.invoiceNumber)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> Download
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="pt-6 space-y-6 font-sans">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-xl font-poppins">
                    <Server className="w-6 h-6" /> ATECH CLOUD
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ATECH VPS Portal & Infrastructure Services<br />
                    100 Enterprise Blvd, Suite 400<br />
                    support@atech.cloud
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Invoice</div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </div>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400">
                    PAID IN FULL
                  </span>
                </div>
              </div>

              {/* Billed To */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Billed To</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedInvoice.customer.name}</div>
                <div className="text-slate-600 dark:text-slate-300">{selectedInvoice.customer.email}</div>
                <div className="text-slate-500 dark:text-slate-400">{selectedInvoice.customer.city}, {selectedInvoice.customer.country}</div>
              </div>

              {/* Line Items */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedInvoice.items.map((item: any, idx: number) => (
                    <tr key={idx} className="py-3">
                      <td className="py-3">
                        <strong className="text-slate-800 dark:text-slate-200">{item.description}</strong>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.specs}</div>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${item.amount.toFixed(2)} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">${selectedInvoice.subtotal.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Sales Tax / VAT (0%):</span>
                  <span className="font-mono text-slate-900 dark:text-white">$0.00 USD</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>Total Paid:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">${selectedInvoice.total.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Payment Proof Footer */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/80 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Payment Confirmed via Stripe
                </div>
                <div>Transaction ID: <span className="font-mono font-semibold">{selectedInvoice.transactionId}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
