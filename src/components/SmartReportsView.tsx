import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Presentation,
  Printer,
  Share2,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Send,
  HelpCircle,
} from 'lucide-react';
import { LabOrder } from '../types/lab';
import { LabProfile, generateReportWhatsAppUrl } from '../services/storage';
import { exportOrderToPowerPoint } from '../services/powerpointExport';

interface SmartReportsViewProps {
  orders: LabOrder[];
  profile: LabProfile;
  onOpenPrintReport: (order: LabOrder) => void;
}

export const SmartReportsView: React.FC<SmartReportsViewProps> = ({
  orders,
  profile,
  onOpenPrintReport,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [pptGenerating, setPptGenerating] = useState(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  if (!selectedOrder) {
    return (
      <div className="p-8 text-center text-slate-400">
        لا توجد طلبات تحليل مسجلة حالياً
      </div>
    );
  }

  // 1. Calculate Mentzer Index if CBC is present
  const cbcTest = selectedOrder.tests.find((t) => t.code === 'CBC');
  const hbParam = cbcTest?.results.find((r) => r.code === 'HB');
  const mcvParam = cbcTest?.results.find((r) => r.code === 'MCV');
  const rbcParam = cbcTest?.results.find((r) => r.code === 'RBC');

  let mentzerIndex: number | null = null;
  let mentzerInterpretation = '';
  if (mcvParam && rbcParam && parseFloat(mcvParam.value) && parseFloat(rbcParam.value)) {
    const mcv = parseFloat(mcvParam.value);
    const rbc = parseFloat(rbcParam.value);
    mentzerIndex = +(mcv / rbc).toFixed(2);
    if (mentzerIndex > 13) {
      mentzerInterpretation = 'معامل مينتزر > 13: يرجح وجود أنيميا نقص الحديد (Iron Deficiency Anemia). يوصى بفحص مخزون الحديد (Serum Ferritin).';
    } else {
      mentzerInterpretation = 'معامل مينتزر < 13: يرجح احتمالية سمة أنيميا البحر المتوسط (Thalassemia Trait). يوصى بفحص الفصل الكهربائي للهيموجلوبين (Hb Electrophoresis).';
    }
  }

  // 2. Calculate De Ritis Ratio if LFT is present (AST / ALT)
  const lftTest = selectedOrder.tests.find((t) => t.code === 'LFT');
  const altParam = lftTest?.results.find((r) => r.code === 'ALT');
  const astParam = lftTest?.results.find((r) => r.code === 'AST');
  let deRitisRatio: number | null = null;
  let deRitisInterpretation = '';
  if (altParam && astParam && parseFloat(altParam.value) && parseFloat(astParam.value)) {
    const alt = parseFloat(altParam.value);
    const ast = parseFloat(astParam.value);
    deRitisRatio = +(ast / alt).toFixed(2);
    if (deRitisRatio > 2.0) {
      deRitisInterpretation = 'نسبة AST/ALT > 2: تشير إلى احتمالية اعتلال كبدي دوائي أو متقدم. يوصى بمتابعة الإنزيمات بانتظام.';
    } else if (deRitisRatio < 1.0) {
      deRitisInterpretation = 'نسبة AST/ALT < 1: النمط الشائع في التهاب الكبد الفيروسي الحاد أو الكبد الدهني (NAFLD).';
    } else {
      deRitisInterpretation = 'نسبة الإنزيمات متوازنة ضمن النمط الطبيعي المقبول.';
    }
  }

  // 3. Glycemic control
  const fbsTest = selectedOrder.tests.find((t) => t.code === 'FBS');
  const hba1cTest = selectedOrder.tests.find((t) => t.code === 'HBA1C');
  const fbsVal = parseFloat(fbsTest?.results[0]?.value || '0');
  const a1cVal = parseFloat(hba1cTest?.results[0]?.value || '0');
  let glycemicAssessment = '';
  if (a1cVal > 0) {
    if (a1cVal < 5.7) {
      glycemicAssessment = 'المعدل التراكمي ممتاز وضمن النطاق الطبيعي غير السكري.';
    } else if (a1cVal >= 5.7 && a1cVal < 6.5) {
      glycemicAssessment = 'مرحلة ما قبل السكري (Prediabetes). يوصى بتعديل النمط الغذائي وممارسة الرياضة.';
    } else if (a1cVal >= 6.5 && a1cVal <= 7.0) {
      glycemicAssessment = 'مستوى تحكم جيد في مريض السكري وفق المعايير الإرشادية (ADA).';
    } else {
      glycemicAssessment = 'تحكم غير كافٍ في سكر الدم التراكمي (> 7.0%). يحتاج المريض لمراجعة خطة العلاج وجرعات الأنسولين أو الأدوية الفموية.';
    }
  }

  const handleExportPPT = () => {
    setPptGenerating(true);
    setTimeout(() => {
      exportOrderToPowerPoint(selectedOrder, profile);
      setPptGenerating(false);
    }, 600);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h1 className="text-base font-bold text-slate-900">
              قسم التقارير الذكية والاستشارات السريرية
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            تحليل ذكي للعلاقات التبادلية بين نتائج التحاليل، مؤشرات الجودة السريرية، وتصدير العروض التقديمية
          </p>
        </div>

        {/* Action Buttons: PDF & PowerPoint */}
        <div className="flex items-center gap-2">
          <a
            href={generateReportWhatsAppUrl(selectedOrder, profile)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال واتساب للعميل</span>
          </a>

          <button
            onClick={() => onOpenPrintReport(selectedOrder)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>حفظ وطباعة PDF</span>
          </button>

          <button
            onClick={handleExportPPT}
            disabled={pptGenerating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Presentation className="w-3.5 h-3.5 text-amber-400" />
            <span>{pptGenerating ? 'جارٍ إنشاء الشريحة...' : 'حفظ PowerPoint (.pptx)'}</span>
          </button>
        </div>
      </div>

      {/* Order Selector */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700">اختر حالة المريض للتحليل السريري:</span>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none"
        >
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.patient.name} ({o.sampleBarcode}) - {o.tests.map((t) => t.code).join(', ')}
            </option>
          ))}
        </select>
      </div>

      {/* Patient Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-slate-900">{selectedOrder.patient.name}</span>
            <span className="text-xs font-mono text-slate-500 mr-2">
              ({selectedOrder.patient.gender === 'male' ? 'ذكر' : 'أنثى'} · {selectedOrder.patient.age} {selectedOrder.patient.ageUnit})
            </span>
          </div>
          <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded">
            رقم العينة: {selectedOrder.sampleBarcode}
          </span>
        </div>
        <div className="text-xs text-slate-600">
          التشخيص السريري الأولي: {selectedOrder.clinicalDiagnosis || 'فحص عام للاطمئنان'}
        </div>
      </div>

      {/* Smart Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Hematology Anemia Differential */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-900">
                التحليل الذكي لفقر الدم وصورة الدم (Mentzer Index)
              </h3>
            </div>
            {mentzerIndex !== null && (
              <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">
                Index: {mentzerIndex}
              </span>
            )}
          </div>

          {mentzerIndex !== null ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {mentzerInterpretation}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                قيم المدخلات: الهيموجلوبين = {hbParam?.value || '-'} | MCV = {mcvParam?.value || '-'} fL | RBCs = {rbcParam?.value || '-'} M/µL
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              يتطلب حساب معامل فقر الدم إدراج فحص صورة الدم الكاملة (CBC) مع قراءات MCV و RBCs.
            </p>
          )}
        </div>

        {/* Card 2: Hepatic Transaminases De Ritis Ratio */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900">
                مؤشر كفاءة خلايا الكبد (De Ritis Ratio AST/ALT)
              </h3>
            </div>
            {deRitisRatio !== null && (
              <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">
                Ratio: {deRitisRatio}
              </span>
            )}
          </div>

          {deRitisRatio !== null ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {deRitisInterpretation}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                قيم الإنزيمات: ALT = {altParam?.value || '-'} U/L | AST = {astParam?.value || '-'} U/L
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              يتطلب حساب مؤشر دي ريتيس إجراء فحص وظائف الكبد متضمناً إنزيمات ALT و AST معاً.
            </p>
          )}
        </div>

        {/* Card 3: Glycemic Metabolism Profile */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-slate-900">
                تقييم الأيض وضبط السكري التراكمي
              </h3>
            </div>
            {a1cVal > 0 && (
              <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">
                HbA1c: {a1cVal}%
              </span>
            )}
          </div>

          {a1cVal > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {glycemicAssessment}
              </div>
              {fbsVal > 0 && (
                <div className="text-[11px] text-slate-500 font-mono">
                  سكر الدم الصائم المقارن: {fbsVal} mg/dL
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              يتطلب هذا التقييم فحص الهيموجلوبين السكري (HbA1c).
            </p>
          )}
        </div>

        {/* Card 4: Pathologist Sign-Off Box */}
        <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد التقرير السريري الطبي</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              تمت مراجعة النمط التشخيصي واعتماد النتائج وفق النطاقات البيولوجية المعتمدة بمعامل RT للتحاليل التشخيصية.
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">{profile.directorName}</div>
              <div className="text-[10px] text-teal-300">{profile.licenseNumber}</div>
            </div>
            <button
              onClick={handleExportPPT}
              className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 rounded-lg text-xs font-bold transition-colors"
            >
              عرض Presentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
