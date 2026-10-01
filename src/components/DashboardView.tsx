import React from 'react';
import {
  Activity,
  TestTube2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Boxes,
  ArrowUpRight,
  Printer,
  ChevronLeft,
  FileCheck2,
} from 'lucide-react';
import { LabOrder, ReagentItem, TestDefinition } from '../types/lab';
import { LabProfile } from '../services/storage';
import {
  resolveLabLogo,
  RECEPTION_PHOTO_IMG,
  MEDICAL_TEAM_IMG,
  onImageErrorFallback,
} from '../assets/images';

interface DashboardViewProps {
  orders: LabOrder[];
  reagents: ReagentItem[];
  testsCatalog: TestDefinition[];
  onNewOrder: () => void;
  onOpenWorklist: (orderId?: string) => void;
  onOpenReport: (order: LabOrder) => void;
  onOpenBarcode: (order: LabOrder) => void;
  onNavigateTab: (tab: any) => void;
  profile?: LabProfile;
  onOpenLogoManager?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  reagents,
  testsCatalog,
  onNewOrder,
  onOpenWorklist,
  onOpenReport,
  onOpenBarcode,
  onNavigateTab,
  profile,
  onOpenLogoManager,
}) => {
  // Metrics calculation
  const totalSamples = orders.length;
  const inSampling = orders.filter((o) => o.specimenStatus === 'pending').length;
  const inProcessing = orders.filter((o) => o.orderStatus === 'processing' || o.orderStatus === 'sampling').length;
  const readyOrders = orders.filter((o) => o.orderStatus === 'ready').length;
  
  // Panic orders
  const panicOrders = orders.filter((o) =>
    o.tests.some((t) => t.results.some((r) => r.flag === 'panic_high' || r.flag === 'panic_low'))
  );

  // Financial summary
  const totalRevenue = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalReceivables = orders.reduce((sum, o) => sum + (o.netAmount - o.paidAmount), 0);

  // Low reagents
  const lowReagents = reagents.filter((r) => r.status === 'low' || r.currentStock <= r.minStockLevel);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Official RT Brand & Facility Showcase Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 rounded-2xl p-4 sm:p-6 text-white border border-rose-900/40 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4 text-right">
            <button
              type="button"
              onClick={onOpenLogoManager}
              className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-rose-500/50 shadow-xl shrink-0 bg-slate-950 flex items-center justify-center p-1 cursor-pointer transition-transform hover:scale-105"
              title="تخصيص اللوجو الرسمي لمعامل RT"
            >
              <img
                src={resolveLabLogo(profile?.logoUrl)}
                alt="لوجو معامل رامي مختار RT LABS"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => onImageErrorFallback(e)}
              />
              <span className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-bold text-white">
                تغيير اللوجو
              </span>
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">الهوية الرسمية</span>
                <span className="text-xs text-rose-300 font-semibold">ISO 15189:2022</span>
                {onOpenLogoManager && (
                  <button
                    onClick={onOpenLogoManager}
                    className="text-[10px] font-bold text-rose-300 hover:text-white underline mr-1"
                  >
                    (تعديل الشعار)
                  </button>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                {profile?.nameAr || 'معامل د. رامي مختار للتحاليل الطبية (RT LABS)'}
              </h1>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                المنظومة المخبرية الذكية لإدارة العينات والنتائج المعتمدة · {profile?.address || 'ميدان بهتيم برج صيدلية العزبي شبرا الخيمة'} · هاتف: {profile?.phone || '01100874444'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end">
            <div className="w-28 sm:w-36 h-20 sm:h-24 rounded-xl overflow-hidden border border-rose-500/30 shadow-md relative group">
              <img
                src={RECEPTION_PHOTO_IMG}
                alt="استقبال معامل رامي مختار"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                onError={(e) => onImageErrorFallback(e)}
              />
              <span className="absolute bottom-1 right-1 left-1 bg-slate-950/80 text-[8px] sm:text-[9px] font-bold text-center py-0.5 rounded text-white">
                صالة الاستقبال
              </span>
            </div>
            <div className="w-28 sm:w-36 h-20 sm:h-24 rounded-xl overflow-hidden border border-rose-500/30 shadow-md relative group">
              <img
                src={MEDICAL_TEAM_IMG}
                alt="فريق معامل رامي مختار"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                onError={(e) => onImageErrorFallback(e)}
              />
              <span className="absolute bottom-1 right-1 left-1 bg-slate-950/80 text-[8px] sm:text-[9px] font-bold text-center py-0.5 rounded text-white">
                الفريق الطبي
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Critical Alarm Notification Banner if Panic Values Exist */}
      {panicOrders.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-900">
                تنبيه سريري حرج (Panic Values Alert): يوجد {panicOrders.length} عينة تحتوي على نتائج حرجة!
              </div>
              <div className="text-xs text-rose-700">
                تتطلب معايير الجودة الطبية إبلاغ الطبيب المعالج أو المريض فوراً وتسجيل وقت الاتصال.
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenWorklist(panicOrders[0].id)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            عرض العينة ومراجعة النتيجة
          </button>
        </div>
      )}

      {/* 2. Key Operational Metrics (Tabular Numbers & Clean Aesthetics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>إجمالي عينات اليوم</span>
            <TestTube2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalSamples} <span className="text-xs text-slate-400 font-sans font-normal">عينة</span>
          </div>
          <div className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <span>{inSampling} بانتظار السحب</span>
            <span>·</span>
            <span>{totalSamples - inSampling} تم استلامها</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>قيد المعالجة المخبرية</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {inProcessing} <span className="text-xs text-slate-400 font-sans font-normal">قيد العمل</span>
          </div>
          <div className="text-[11px] text-slate-500">
            أجهزة التحاليل الآلية تعمل بكفاءة
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>تقارير معتمدة جاهزة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {readyOrders} <span className="text-xs text-slate-400 font-sans font-normal">تقرير</span>
          </div>
          <div className="text-[11px] text-slate-500">
            جاهزة للتسليم أو الإرسال واتساب
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>إيرادات الخزينة اليوم</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalRevenue.toLocaleString('en-US')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500">
            المتبقي تحصيله: {totalReceivables} ج.م
          </div>
        </div>
      </div>

      {/* 3. Clinical Workflow Pipeline Stepper */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-800">
          مسار العينة المخبرية (Laboratory Sample Workflow Pipeline)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 text-right space-y-1">
            <span className="text-[10px] font-mono text-teal-800 font-semibold block">المرحلة 1</span>
            <div className="text-xs font-bold text-slate-900">الاستقبال والتسجيل</div>
            <div className="text-[11px] text-slate-500">تسجيل بيانات المريض والفحوصات</div>
          </div>

          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 text-right space-y-1">
            <span className="text-[10px] font-mono text-teal-800 font-semibold block">المرحلة 2</span>
            <div className="text-xs font-bold text-slate-900">سحب العينة والباركود</div>
            <div className="text-[11px] text-slate-500">تجهيز الأنابيب وطباعة الملصق</div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 text-right space-y-1">
            <span className="text-[10px] font-mono text-amber-800 font-semibold block">المرحلة 3</span>
            <div className="text-xs font-bold text-slate-900">التحليل بالأجهزة</div>
            <div className="text-[11px] text-slate-500">الفحص الكيميائي والدموي</div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 text-right space-y-1">
            <span className="text-[10px] font-mono text-emerald-800 font-semibold block">المرحلة 4</span>
            <div className="text-xs font-bold text-slate-900">اعتماد الاستشاري</div>
            <div className="text-[11px] text-slate-500">مراجعة النتائج والتوقيع</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-right space-y-1">
            <span className="text-[10px] font-mono text-slate-500 font-semibold block">المرحلة 5</span>
            <div className="text-xs font-bold text-slate-900">الطباعة والتسليم</div>
            <div className="text-[11px] text-slate-500">تقرير رسمي معتمد بكود QR</div>
          </div>
        </div>
      </div>

      {/* 4. Two columns: Recent Orders Worklist & Low Reagents Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Orders Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                سجل العينات والطلبات الحديثة
              </h3>
              <p className="text-[11px] text-slate-400">
                متابعة حركة العينات ومراحل الإنجاز المخبري
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>عرض كل العينات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <th className="py-2.5 px-3">رقم العينة / الباركود</th>
                  <th className="py-2.5 px-3">المريض</th>
                  <th className="py-2.5 px-3">التحاليل المطلوبة</th>
                  <th className="py-2.5 px-3 text-center">حالة العينة</th>
                  <th className="py-2.5 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const hasPanic = ord.tests.some((t) =>
                    t.results.some((r) => r.flag === 'panic_high' || r.flag === 'panic_low')
                  );
                  const isVerified = ord.tests.every((t) => t.status === 'verified');

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        <div>{ord.sampleBarcode}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {ord.orderNumber}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{ord.patient.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {ord.patient.gender === 'male' ? 'ذكر' : 'أنثى'} · {ord.patient.age} {ord.patient.ageUnit}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-teal-900 font-semibold text-[11px] line-clamp-1">
                          {ord.tests.map((t) => t.nameAr).join(' · ')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ord.tests.map((t) => t.code).join(' , ')}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {hasPanic ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block animate-pulse">
                            ⚠️ قيمة حرجة
                          </span>
                        ) : isVerified ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                            معتمد وجاهز
                          </span>
                        ) : ord.specimenStatus === 'pending' ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                            بانتظار السحب
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full inline-block">
                            قيد الفحص
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenBarcode(ord)}
                            title="طباعة ملصق الباركود"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <TestTube2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenWorklist(ord.id)}
                            title="إدخال النتائج"
                            className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded transition-colors"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenReport(ord)}
                            title="طباعة التقرير الطبي"
                            className="p-1.5 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Reagents & Consumables Monitor (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  كواشف ومحاليل الأجهزة
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-[11px] font-semibold text-teal-700 hover:underline"
              >
                إدارة المخزون
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              تنبيهات نقص الكواشف وتواريخ صلاحية كتات الأجهزة الآلية:
            </p>

            <div className="space-y-2">
              {reagents.slice(0, 4).map((rg) => {
                const isLow = rg.status === 'low' || rg.currentStock <= rg.minStockLevel;
                return (
                  <div
                    key={rg.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      isLow
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">
                        {rg.nameAr}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rg.category} · Lot: {rg.lotNumber}
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div
                        className={`font-mono font-bold ${
                          isLow ? 'text-rose-700' : 'text-slate-800'
                        }`}
                      >
                        {rg.currentStock} {rg.unit.split(' ')[0]}
                      </div>
                      {isLow && (
                        <span className="text-[9px] font-semibold text-rose-600">
                          نقص رصيد!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-gradient-to-br from-teal-800 to-slate-900 rounded-xl p-4 text-white shadow-2xs space-y-3">
            <div className="text-xs font-bold">إجراءات سريعة للمعمل</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={onNewOrder}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-lg text-right font-semibold transition-colors"
              >
                + تسجيل مريض جديد
              </button>
              <button
                onClick={() => onNavigateTab('worklist')}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-lg text-right font-semibold transition-colors"
              >
                قائمة عمل النتائج
              </button>
              <button
                onClick={() => onNavigateTab('catalog')}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-lg text-right font-semibold transition-colors"
              >
                دليل التحاليل والأسعار
              </button>
              <button
                onClick={() => onNavigateTab('financial')}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-lg text-right font-semibold transition-colors"
              >
                تقرير خزينة اليوم
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
