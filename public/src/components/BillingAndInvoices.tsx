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
  Download,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';
import { jsPDF } from 'jspdf';
import { formatDate } from '../utils/dateFormatter';

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
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [revealedCard, setRevealedCard] = useState<any>(null);
  const [cancellingTrialId, setCancellingTrialId] = useState<number | null>(null);

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

  const handleToggleCardDetails = async () => {
    if (!showCardDetails && !revealedCard) {
      try {
        const res = await apiCall('/billing/payment-method/reveal');
        if (res && res.card) {
          setRevealedCard(res.card);
        }
      } catch (err: any) {
        console.warn('Could not reveal card:', err.message);
      }
    }
    setShowCardDetails(!showCardDetails);
  };

  const handleCancelTrial = async (subscriptionId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your 30-Day Free Trial?\n\n' +
      '• No charges will ever be made to your payment card.\n' +
      '• Your trial VPS instance will be decommissioned.'
    );

    if (!confirmed) return;

    try {
      setCancellingTrialId(subscriptionId);
      const res = await apiCall('/billing/cancel-trial', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId }),
      });
      toast.success(res.message || 'Free trial cancelled successfully. Zero charges applied.');
      await fetchBilling();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel free trial');
    } finally {
      setCancellingTrialId(null);
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
      toast.info('Generating official PDF invoice...');
      let inv = selectedInvoice;
      if (!inv || inv.invoiceNumber !== invoiceNumber) {
        const res = await apiCall(`/billing/invoices/${invoiceNumber}`);
        inv = res.invoice;
      }
      if (!inv) throw new Error('Invoice data could not be retrieved.');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Palette
      const primaryBlue = [37, 99, 235]; // #2563eb
      const darkSlate = [15, 23, 42]; // #0f172a
      const mutedSlate = [100, 116, 139]; // #64748b
      const lightBg = [248, 250, 252]; // #f8fafc

      // Company Header - Full Name: Analytical Technical Consulting
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('Analytical Technical Consulting', 20, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Cloud Infrastructure & Enterprise Systems', 20, 30);
      doc.text('Support & Inquiries: customer-support@atechconsult.com', 20, 35);

      // Invoice Header on Right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text('INVOICE', 190, 24, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text(inv.invoiceNumber, 190, 30, { align: 'right' });

      // Paid Badge
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(155, 34, 35, 6, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52);
      doc.text('PAID IN FULL', 172.5, 38.5, { align: 'center' });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 44, 190, 44);

      // Customer & Metrics Cards
      // Left Card: Billed To
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(20, 50, 80, 26, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('BILLED TO', 24, 56);
      doc.setFontSize(9.5);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(inv.customer?.name || 'Customer', 24, 62);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(inv.customer?.email || '', 24, 67);
      doc.text(`${inv.customer?.city || 'Dallas'}, ${inv.customer?.country || 'United States'}`, 24, 72);

      // Right Card: Invoice Details
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(110, 50, 80, 26, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('PAYMENT DETAILS', 114, 56);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(`Issue Date: ${formatDate(inv.issueDate)}`, 114, 62);
      doc.text(`Payment: ${inv.transactionId ? 'Stripe (' + inv.transactionId + ')' : 'Direct Card (•••• 4242)'}`, 114, 67);
      doc.text('Status: Verified & Settled', 114, 72);

      // Table Header
      let y = 86;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('SERVICE / ITEM DESCRIPTION', 24, y + 5);
      doc.text('PERIOD', 125, y + 5);
      doc.text('AMOUNT (USD)', 185, y + 5, { align: 'right' });

      // Table Items
      y += 12;
      const items = inv.items && inv.items.length > 0 ? inv.items : [{
        description: 'Cloud VPS Compute Plan',
        specs: 'Dedicated Virtual Machine Instance',
        period: 'Monthly Subscription',
        amount: Number(inv.subtotal || inv.total)
      }];

      for (const item of items) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(item.description, 24, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
        doc.text(item.specs || 'Dedicated Cloud Compute Allocation', 24, y + 4.5);

        doc.setFontSize(8.5);
        doc.text(item.period || 'Monthly', 125, y + 2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(`$${Number(item.amount).toFixed(2)}`, 185, y + 2, { align: 'right' });

        y += 14;
        doc.setDrawColor(241, 245, 249);
        doc.line(20, y - 4, 190, y - 4);
      }

      // Totals
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Subtotal:', 140, y);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(`$${Number(inv.subtotal).toFixed(2)}`, 185, y, { align: 'right' });

      y += 6;
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Tax (0%):', 140, y);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(`$${Number(inv.tax || 0).toFixed(2)}`, 185, y, { align: 'right' });

      y += 8;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(140, y - 2, 190, y - 2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('Total Paid:', 140, y + 3.5);
      doc.text(`$${Number(inv.total).toFixed(2)} USD`, 185, y + 3.5, { align: 'right' });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Analytical Technical Consulting • Thank you for your business!', 105, 275, { align: 'center' });
      doc.text('For questions or support, contact customer-support@atechconsult.com', 105, 280, { align: 'center' });

      doc.save(`Invoice-${inv.invoiceNumber}.pdf`);
      toast.success(`Invoice ${inv.invoiceNumber}.pdf downloaded!`);
    } catch (e: any) {
      toast.error('Failed to download invoice PDF: ' + e.message);
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
            {summary?.nextBillingDate ? formatDate(summary.nextBillingDate) : 'N/A'}
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
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleCardDetails}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={showCardDetails ? 'Hide card & expiry details' : 'Show full card & expiry details'}
              >
                {showCardDetails ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
              </button>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <span>{revealedCard?.brand || summary?.paymentMethod?.brand || 'Visa'}</span>
            <span>
              {showCardDetails
                ? (revealedCard?.fullNumber && revealedCard.fullNumber !== '***-REDACTED-***'
                    ? revealedCard.fullNumber
                    : `•••• •••• •••• ${summary?.paymentMethod?.last4 || revealedCard?.last4 || '4242'}`)
                : `•••• ${summary?.paymentMethod?.last4 || revealedCard?.last4 || '4242'}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Expires {String(revealedCard?.expMonth || summary?.paymentMethod?.expMonth || '12').padStart(2, '0')}/{String(revealedCard?.expYear || summary?.paymentMethod?.expYear || '28').slice(-2)}
          </p>
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
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {subscriptions.map((sub) => {
                  const isTrial = sub.status === 'TRIAL' || sub.status === 'trial';
                  return (
                    <tr key={sub.subscriptionId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{sub.planName}</span>
                          {isTrial && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Free Trial
                            </span>
                          )}
                        </div>
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
                      <td className="py-4 px-6 font-mono">
                        {isTrial ? (
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">$0.00</span>
                            <span className="text-[10px] text-slate-400 block">${sub.monthlyPrice.toFixed(2)}/mo after trial</span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900 dark:text-white">
                            ${sub.monthlyPrice.toFixed(2)} / mo
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {isTrial ? `Trial ends in ${sub.daysRemaining} days` : `Renews in ${sub.daysRemaining} days`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isTrial ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            30-Day Trial
                          </span>
                        ) : sub.status === 'CANCELLED' || sub.status === 'REFUNDED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {sub.status === 'REFUNDED' ? 'Refunded' : 'Cancelled'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isTrial ? (
                          <button
                            type="button"
                            onClick={() => handleCancelTrial(sub.subscriptionId)}
                            disabled={cancellingTrialId === sub.subscriptionId}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {cancellingTrialId === sub.subscriptionId ? 'Cancelling...' : 'Cancel Free Trial'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(inv.issueDate)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      ${inv.amount.toFixed(2)} USD
                    </td>
                    <td className="py-4 px-6">
                      {inv.status === 'REFUNDED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
                          REFUNDED
                        </span>
                      ) : inv.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
                          PENDING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          PAID
                        </span>
                      )}
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
                    <Server className="w-6 h-6" /> Analytical Technical Consulting
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cloud Infrastructure & Enterprise Hosting Services<br />
                    customer-support@atechconsult.com
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Invoice</div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Date: {formatDate(selectedInvoice.issueDate)}
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
