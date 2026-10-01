import React, { useState } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Wallet,
  CreditCard,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Building,
  UserCheck,
  Percent,
  Sliders,
  Sparkles,
  PieChart,
  X,
} from 'lucide-react';
import { LabOrder, ExpenseItem, ExpenseCategory } from '../types/lab';
import { LabProfile } from '../services/storage';
import { resolveLabLogo, onImageErrorFallback } from '../assets/images';

interface FinancialViewProps {
  orders: LabOrder[];
  expenses: ExpenseItem[];
  profile: LabProfile;
  onUpdatePayment: (orderId: string, additionalAmount: number) => void;
  onAddExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateProfile?: (updated: LabProfile) => void;
  onOpenLogoManager?: () => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  orders,
  expenses,
  profile,
  onUpdatePayment,
  onAddExpense,
  onDeleteExpense,
  onUpdateProfile,
  onOpenLogoManager,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'profit_shares'>('invoices');
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<LabOrder | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);

  // Shares Management
  const [labShare, setLabShare] = useState<number>(profile.labSharePercent || 70);
  const [ceoShare, setCeoShare] = useState<number>(profile.ceoSharePercent || 30);
  const [sharesSavedMessage, setSharesSavedMessage] = useState(false);

  // New Expense form modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('إيجار');
  const [expAmount, setExpAmount] = useState(500);
  const [expNotes, setExpNotes] = useState('');

  // Financial aggregates
  const totalBilled = orders.reduce((sum, o) => sum + o.netAmount, 0);
  const totalCollected = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalReceivables = Math.max(0, totalBilled - totalCollected);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalCollected - totalExpenses;

  // Lab & CEO Profit Distribution Calculations
  const calculatedLabAmount = Math.round((Math.max(0, netProfit) * labShare) / 100);
  const calculatedCeoAmount = Math.round((Math.max(0, netProfit) * ceoShare) / 100);

  // Payment methods breakdown
  const cashTotal = orders.filter((o) => o.paymentMethod?.includes('نقداً') || o.paymentMethod?.includes('Cash')).reduce((s, o) => s + o.paidAmount, 0);
  const instapayTotal = orders.filter((o) => o.paymentMethod?.includes('إنستا') || o.paymentMethod?.includes('InstaPay')).reduce((s, o) => s + o.paidAmount, 0);
  const walletTotal = orders.filter((o) => o.paymentMethod?.includes('محفظة') || o.paymentMethod?.includes('Vodafone')).reduce((s, o) => s + o.paidAmount, 0);
  const cardTotal = orders.filter((o) => o.paymentMethod?.includes('بطاقة') || o.paymentMethod?.includes('Card')).reduce((s, o) => s + o.paidAmount, 0);
  const bankTotal = orders.filter((o) => o.paymentMethod?.includes('بنكي') || o.paymentMethod?.includes('Bank')).reduce((s, o) => s + o.paidAmount, 0);

  // Expenses category breakdown
  const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    'إيجار',
    'كهرباء',
    'مياه',
    'مرتبات وأجور',
    'مستلزمات وكيماويات',
    'صيانة ومعايرة أجهزة',
    'بوفيه وضيافة ونظافة',
    'دعاية وتسويق',
    'نثريات وطوارئ',
  ];

  const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return { category: cat, total };
  }).filter((c) => c.total > 0);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.patient.name.includes(search) ||
      o.orderNumber.includes(search) ||
      o.sampleBarcode.includes(search);

    if (!matchesSearch) return false;

    if (filterPayment === 'unpaid') return o.financialStatus === 'unpaid' || o.financialStatus === 'partial';
    if (filterPayment === 'paid') return o.financialStatus === 'paid';
    return true;
  });

  const handleSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPay || payAmountInput <= 0) return;
    onUpdatePayment(selectedOrderForPay.id, payAmountInput);
    setSelectedOrderForPay(null);
    setPayAmountInput(0);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) return;

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: expTitle,
      category: expCategory,
      amount: expAmount,
      date: new Date().toISOString().split('T')[0],
      notes: expNotes,
      recordedBy: 'إدارة المعمل',
    };

    onAddExpense(newExp);
    setShowExpenseModal(false);
    setExpTitle('');
    setExpAmount(500);
    setExpNotes('');
  };

  const handleSaveShares = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        labSharePercent: labShare,
        ceoSharePercent: ceoShare,
      });
      setSharesSavedMessage(true);
      setTimeout(() => setSharesSavedMessage(false), 3000);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-black text-rose-950 flex items-center gap-2">
            <span>الحسابات والماليات الشاملة لمعامل RT</span>
            <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              د. رامي مختار
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            متابعة الإيرادات، المصروفات (إيجار/كهرباء/مرتبات)، وتوزيع نسب الأرباح بين المعمل والـ CEO
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'expenses' && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل مصروف معملي جديد</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'invoices' ? 'bg-white text-rose-950 font-black shadow-2xs' : 'text-slate-600'
              }`}
            >
              الفواتير والإيرادات
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'expenses' ? 'bg-white text-rose-950 font-black shadow-2xs' : 'text-slate-600'
              }`}
            >
              المصروفات المعملية ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('profit_shares')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'profit_shares' ? 'bg-rose-950 text-white font-black shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>نسب المعمل والـ CEO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">إجمالي الإيرادات المحصلة</div>
          <div className="text-2xl font-black font-mono text-emerald-700 tabular-nums">
            {totalCollected.toLocaleString('en-US')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500">
            المتبقي غير المحصل: <span className="font-bold text-rose-700">{totalReceivables} ج.م</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">إجمالي المصروفات (إيجار/كهرباء/رواتب)</div>
          <div className="text-2xl font-black font-mono text-rose-700 tabular-nums">
            {totalExpenses.toLocaleString('en-US')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {expenses.length} بند مصروفات مسجل
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">صافي الأرباح التشغيلية</div>
          <div className={`text-2xl font-black font-mono tabular-nums ${netProfit >= 0 ? 'text-blue-950' : 'text-rose-700'}`}>
            {netProfit.toLocaleString('en-US')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500">
            الإيرادات الفعلية ناقص المصروفات
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">توزيع الأرباح المعتمد</div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-700 font-bold">المعمل ({labShare}%):</span>
            <span className="font-mono font-black text-rose-950">{calculatedLabAmount.toLocaleString('en-US')} ج.م</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-bold">الـ CEO ({ceoShare}%):</span>
            <span className="font-mono font-black text-blue-900">{calculatedCeoAmount.toLocaleString('en-US')} ج.م</span>
          </div>
        </div>
      </div>

      {/* Payment Channels Cards */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>كاش نقدي:</span>
          <span className="font-mono font-bold text-slate-900">{cashTotal.toLocaleString('en-US')} ج.م</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>إنستا باي (InstaPay):</span>
          <span className="font-mono font-bold text-slate-900">{instapayTotal.toLocaleString('en-US')} ج.م</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>محفظة كاش (فودافون/أورنج):</span>
          <span className="font-mono font-bold text-slate-900">{walletTotal.toLocaleString('en-US')} ج.م</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>تحويل بنكي:</span>
          <span className="font-mono font-bold text-slate-900">{bankTotal.toLocaleString('en-US')} ج.م</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>فيزا وبطاقات بنكية:</span>
          <span className="font-mono font-bold text-slate-900">{cardTotal.toLocaleString('en-US')} ج.م</span>
        </div>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث باسم المريض أو رقم الطلب أو الباركود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-2 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-800"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">حالة السداد:</span>
              <button
                onClick={() => setFilterPayment('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  filterPayment === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterPayment('unpaid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  filterPayment === 'unpaid' ? 'bg-rose-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                متبقي أو غير مسدد
              </button>
              <button
                onClick={() => setFilterPayment('paid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  filterPayment === 'paid' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                مسدد بالكامل
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">رقم الفاتورة والباركود</th>
                  <th className="py-3 px-4">اسم المريض</th>
                  <th className="py-3 px-4">الإجمالي</th>
                  <th className="py-3 px-4">الخصم</th>
                  <th className="py-3 px-4">الصافي</th>
                  <th className="py-3 px-4">المسدد</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">حالة السداد</th>
                  <th className="py-3 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      لا توجد فواتير مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const remaining = Math.max(0, ord.netAmount - ord.paidAmount);
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div>{ord.orderNumber}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{ord.sampleBarcode}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {ord.patient.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{ord.totalAmount} ج.م</td>
                        <td className="py-3 px-4 font-mono text-rose-700">
                          {ord.discount > 0 ? `-${ord.discount} ج.م` : '0'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.netAmount} ج.م</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">{ord.paidAmount} ج.م</td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-700">
                          {remaining > 0 ? `${remaining} ج.م` : '0'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {ord.financialStatus === 'paid' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100">
                              مسدد
                            </span>
                          ) : ord.financialStatus === 'partial' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-800 bg-amber-100">
                              جزئي
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-800 bg-rose-100">
                              غير مسدد
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {remaining > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedOrderForPay(ord);
                                setPayAmountInput(remaining);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-md transition-colors"
                            >
                              تحصيل دفعة
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">تم التسوية</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Expenses Category Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {EXPENSE_CATEGORIES.map((cat) => {
              const catSum = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
              return (
                <div key={cat} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[11px] text-slate-500 font-bold truncate">{cat}</div>
                  <div className="text-base font-black font-mono text-rose-950">
                    {catSum.toLocaleString('en-US')}{' '}
                    <span className="text-[10px] text-slate-400 font-sans font-normal">ج.م</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                سجل المصروفات والنثريات اليومية والشهرية ({expenses.length} بند مسجل)
              </span>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مصروف</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">البند والوصف</th>
                    <th className="py-3 px-4">التصنيف</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">المسؤول</th>
                    <th className="py-3 px-4">ملاحظات</th>
                    <th className="py-3 px-4 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد مصروفات مسجلة
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{exp.title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-900 border border-rose-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-700">{exp.amount} ج.م</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{exp.date}</td>
                        <td className="py-3 px-4 text-slate-700">{exp.recordedBy}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{exp.notes || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف مصروف: ${exp.title}؟`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFIT SHARES (LAB & CEO) */}
      {activeTab === 'profit_shares' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-900" />
                <h3 className="text-sm font-black text-rose-950">
                  تعديل نسب توزيع الأرباح (إدارة المعمل والـ CEO)
                </h3>
              </div>
              <span className="text-xs bg-rose-50 text-rose-900 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                متغيرة وقابلة للتعديل
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
                  <span className="text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-rose-800" />
                    <span>نسبة المعمل والتطوير والتوسعات:</span>
                  </span>
                  <span className="font-mono text-rose-950 font-black text-sm">{labShare}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={labShare}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLabShare(val);
                    setCeoShare(100 - val);
                  }}
                  className="w-full accent-rose-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
                  <span className="text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-900" />
                    <span>نسبة المدير التنفيذي والـ CEO (د. رامي مختار):</span>
                  </span>
                  <span className="font-mono text-blue-950 font-black text-sm">{ceoShare}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={ceoShare}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCeoShare(val);
                    setLabShare(100 - val);
                  }}
                  className="w-full accent-blue-950 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
              * إجمالي النسب يجب أن يساوي دائماً 100%. يتم احتساب حصة المعمل لدعم استبدال الكواشف، صيانة الأجهزة المعملية، والإيجار، بينما تمثل حصة CEO الإشراف الإكلينيكي والاستشاري وإدارة المنظومة.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveShares}
                className="flex-1 py-2.5 px-4 bg-rose-950 hover:bg-rose-900 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ النسب المعتمدة للنظام</span>
              </button>
            </div>

            {sharesSavedMessage && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center font-bold">
                ✓ تم حفظ وتحديث نسب توزيع الأرباح بنجاح في قاعدة البيانات السحابية!
              </div>
            )}

            {/* Official Lab Logo & Visual Identity */}
            {onOpenLogoManager && (
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-rose-300 bg-slate-950 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
                    <img
                      src={resolveLabLogo(profile.logoUrl)}
                      alt="لوجو المعمل"
                      className="w-full h-full object-contain"
                      onError={(e) => onImageErrorFallback(e)}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800">
                      لوجو المعمل والهوية الرسمية
                    </div>
                    <div className="text-[10px] text-slate-500">
                      يظهر في شريط الرأس، التقارير المطبوعة A4، وبوابة المرضى
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogoManager}
                  className="px-3.5 py-2 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-rose-300" />
                  <span>تغيير / رفع اللوجو</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 text-white p-6 rounded-xl shadow-md space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-900/60">
                <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                  بيان صافي التوزيع المالي الفعلي
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-bold">
                  صافي الربح: {netProfit.toLocaleString('en-US')} ج.م
                </span>
              </div>

              {/* Lab Share */}
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 space-y-1">
                <div className="flex items-center justify-between text-xs text-rose-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Building className="w-4 h-4 text-rose-300" />
                    <span>حصة المعمل والتطوير والتوسعات ({labShare}%):</span>
                  </span>
                  <span className="font-mono text-lg font-black text-white">
                    {calculatedLabAmount.toLocaleString('en-US')} ج.م
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  تُخصص لتجديد الأجهزة الآلية، كواشف التحاليل، ونثريات الفروع
                </p>
              </div>

              {/* CEO Share */}
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 space-y-1">
                <div className="flex items-center justify-between text-xs text-blue-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-4 h-4 text-blue-300" />
                    <span>حصة CEO والمدير الطبي ({ceoShare}%):</span>
                  </span>
                  <span className="font-mono text-lg font-black text-amber-300">
                    {calculatedCeoAmount.toLocaleString('en-US')} ج.م
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  تُصرف للدكتور رامي مختار للإشراف الطبي والباثولوجي والإدارة
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono text-center pt-3 border-t border-white/10">
              معامل RT · ترخيص 110084 · شبرا الخيمة ميدان بهتيم برج صيدلية العزبي
            </div>
          </div>
        </div>
      )}

      {/* Settle Payment Modal */}
      {selectedOrderForPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">تحصيل دفعة مالية</h3>
              <button onClick={() => setSelectedOrderForPay(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="p-5 space-y-4">
              <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span>المريض:</span>
                  <span className="font-bold text-slate-900">{selectedOrderForPay.patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>الطلب:</span>
                  <span className="font-mono">{selectedOrderForPay.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ الصافي:</span>
                  <span className="font-mono">{selectedOrderForPay.netAmount} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>المسدد سابقاً:</span>
                  <span className="font-mono text-emerald-700">{selectedOrderForPay.paidAmount} ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700 pt-1 border-t border-slate-200">
                  <span>المتبقي:</span>
                  <span className="font-mono">
                    {Math.max(0, selectedOrderForPay.netAmount - selectedOrderForPay.paidAmount)} ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المحصل الآن (ج.م) *</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(0, selectedOrderForPay.netAmount - selectedOrderForPay.paidAmount)}
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full text-sm font-mono font-bold p-2 border border-slate-300 rounded-lg text-emerald-800 focus:ring-1 focus:ring-rose-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  تأكيد التحصيل والتسوية
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPay(null)}
                  className="py-2 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">تسجيل مصروف معملي جديد</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">وصف المصروف *</label>
                <input
                  type="text"
                  placeholder="مثال: فاتورة كهرباء شهر سبتمبر، إيجار المقر، شراء كواشف..."
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-800 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">التصنيف *</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    min="1"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-rose-800 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات إضافية أو رقم الإيصال</label>
                <textarea
                  rows={2}
                  placeholder="رقم الفاتورة، اسم المورد أو الشركة..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg transition-colors"
                >
                  حفظ المصروف
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="py-2 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
