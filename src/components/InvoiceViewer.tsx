import React, { useState } from 'react';
import { PatientEncounter, LabSettings } from '../types/lab';
import { Printer, Receipt, Building2, CheckCircle2, DollarSign, CreditCard, Shield, Edit3 } from 'lucide-react';
import { BarcodeBadge, OfficialLabStamp } from './BarcodeBadge';

interface InvoiceViewerProps {
  encounter: PatientEncounter;
  settings: LabSettings;
  onUpdateInvoice: (invoice: PatientEncounter['invoice']) => void;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  encounter,
  settings,
  onUpdateInvoice,
}) => {
  const { patient, invoice } = encounter;
  const [isEditing, setIsEditing] = useState(false);
  const [discountPct, setDiscountPct] = useState(invoice.discountPercent || 0);
  const [paidAmt, setPaidAmt] = useState(invoice.paidAmount || invoice.total);
  const [paymentMethod, setPaymentMethod] = useState(invoice.paymentMethod || 'Cash');

  const handlePrint = () => {
    window.print();
  };

  const handleApplyChanges = () => {
    const sub = invoice.subtotal;
    const discAmount = (sub * discountPct) / 100;
    const netTotal = Math.max(0, sub - discAmount + invoice.tax);
    const updated = {
      ...invoice,
      discountPercent: discountPct,
      discountAmount: discAmount,
      total: netTotal,
      paidAmount: paidAmt,
      paymentMethod,
      paymentStatus: (paidAmt >= netTotal ? 'Paid' : paidAmt > 0 ? 'Partially Paid' : 'Unpaid') as any,
    };
    onUpdateInvoice(updated);
    setIsEditing(false);
  };

  const balanceDue = Math.max(0, invoice.total - invoice.paidAmount);

  return (
    <div className="max-w-4xl mx-auto my-6 px-2 sm:px-4">
      {/* Top Action bar (Hidden on print) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">الفاتورة الضريبية والمطالبة المالية الرسمية (Medical Tax Invoice)</h2>
            <p className="text-xs text-slate-400">
              فاتورة إلكترونية معتمدة للاستخدام القانوني وشركات التأمين الصحي واسترداد النفقات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'إلغاء التعديل' : 'تعديل الخصم والدفع'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-950/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الفاتورة الرسمية (Print Invoice)</span>
          </button>
        </div>
      </div>

      {/* Editing drawer if open */}
      {isEditing && (
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-md mb-6 print:hidden">
          <h4 className="text-xs font-bold text-slate-800 mb-3">تعديل الخصومات وبيانات السداد:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                نسبة الخصم % (Discount Percentage)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPct}
                onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                المبلغ المسدد (Paid Amount)
              </label>
              <input
                type="number"
                min="0"
                value={paidAmt}
                onChange={(e) => setPaidAmt(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                طريقة الدفع (Payment Method)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="Cash">نقداً (Cash)</option>
                <option value="Credit Card">بطاقة بنكية / فيزا (Visa / Mastercard)</option>
                <option value="Insurance">تأمين صحي / تعاقدات (Health Insurance)</option>
                <option value="InstaPay">إنستاباي (InstaPay)</option>
                <option value="Vodafone Cash">فودافون كاش (Vodafone Cash)</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleApplyChanges}
              className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
            >
              حفظ التعديلات على الفاتورة
            </button>
          </div>
        </div>
      )}

      {/* ================= Printable Invoice Sheet ================= */}
      <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none relative font-sans">
        
        {/* Header */}
        <div className="border-b-2 border-rose-900 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-rose-800 shadow-md bg-black shrink-0">
                <img
                  src={settings.logoUrl || '/assets/aistudio/photo_2026-10-02_00-22-10_28ae1371.jpg'}
                  alt="RT Lab Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-black text-rose-950">
                  {settings.labNameAr}
                </h1>
                <h2 className="text-xs font-bold text-slate-600 uppercase font-sans">
                  {settings.labNameEn}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  قسم الحسابات والمطالبات الطبية • Medical Billing & Financial Dept
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-rose-900 text-white text-xs font-extrabold px-3 py-1 rounded-md tracking-wider uppercase mb-1">
                OFFICIAL INVOICE
              </span>
              <div className="font-mono text-xs font-bold text-slate-800">
                No: {invoice.invoiceNumber}
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                Date: {invoice.date || patient.reportDate}
              </div>
            </div>
          </div>
        </div>

        {/* Patient & Billing Info */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs" dir="ltr">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billed To (Patient)</span>
              <span className="font-bold text-sm text-rose-950">{patient.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient MRN</span>
              <span className="font-mono font-bold text-slate-800">{patient.mrn}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">National ID</span>
              <span className="font-mono text-slate-700">{patient.nationalId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
              <span className="font-mono text-slate-700">{patient.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto my-6" dir="ltr">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Diagnostic Investigation / Package</th>
                <th className="py-2.5 px-3 w-28 text-center">Type</th>
                <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                <th className="py-2.5 px-3 w-28 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                    No items on invoice
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{item.code}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                      {item.price.toFixed(2)} {settings.currency}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {item.price.toFixed(2)} {settings.currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 pt-4 border-t border-slate-200" dir="ltr">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Payment Method:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs">
                {invoice.paymentMethod}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Payment Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                  invoice.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-2 leading-relaxed">
              * هذه الفاتورة رسمية صادرة من المنظومة الإلكترونية لمعامل RT للتحاليل التشخيصية ومعتمدة للأغراض القانونية والتأمينية وخصومات النقابات.
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (المجموع الفرعي):</span>
              <span className="font-bold">{invoice.subtotal.toFixed(2)} {settings.currency}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Discount ({invoice.discountPercent}% الخصم):</span>
                <span className="font-bold">-{invoice.discountAmount.toFixed(2)} {settings.currency}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Sales Tax / VAT (0% المعفى):</span>
              <span className="font-bold">0.00 {settings.currency}</span>
            </div>

            <div className="h-px bg-slate-300 my-1" />

            <div className="flex justify-between text-sm font-black text-rose-950">
              <span>Total Net (المطلوب سداده):</span>
              <span>{invoice.total.toFixed(2)} {settings.currency}</span>
            </div>

            <div className="flex justify-between text-emerald-800 font-bold">
              <span>Amount Paid (المدفوع):</span>
              <span>{invoice.paidAmount.toFixed(2)} {settings.currency}</span>
            </div>

            <div className="flex justify-between text-slate-800 font-bold">
              <span>Balance Due (المتبقي):</span>
              <span>{balanceDue.toFixed(2)} {settings.currency}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer & Stamp */}
        <div className="pt-8 border-t-2 border-slate-300 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 print:break-inside-avoid">
          <div className="text-center sm:text-left text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900">معامل RT للتحاليل التشخيصية • د. رامي مختار</div>
            <div>رقم السجل التجاري: 184920 • البطاقة الضريبية: 490-239-112</div>
            <div className="text-[10px] text-slate-500">
              Generated by RT-LIS Secure Electronic Healthcare Platform
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">
                Cashier / توقيع مسؤول الخزينة
              </div>
              <div className="font-serif italic font-bold text-sm text-slate-800 border-b border-slate-400 pb-1 px-4">
                A. Nabil (RT Accounts)
              </div>
            </div>

            {settings.showStamp && (
              <OfficialLabStamp text="معامل RT - ختــم مالي معتمد" date={invoice.date} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
