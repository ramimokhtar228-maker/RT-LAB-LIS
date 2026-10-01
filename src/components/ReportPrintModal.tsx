import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileText,
  Send,
  Presentation,
  UserCheck,
  SplitSquareVertical,
  Layers,
  FileCheck,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { LabOrder, OrderTestResult } from '../types/lab';
import { LabProfile, generateReportWhatsAppUrl } from '../services/storage';
import { exportOrderToPowerPoint } from '../services/powerpointExport';
import { resolveLabLogo, DOCTOR_AVATAR_IMG, onImageErrorFallback } from '../assets/images';

interface ReportPrintModalProps {
  order: LabOrder | null;
  profile: LabProfile;
  onClose: () => void;
  doctorAvatarUrl?: string;
  labLogoUrl?: string;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  order,
  profile,
  onClose,
  doctorAvatarUrl = DOCTOR_AVATAR_IMG,
  labLogoUrl,
}) => {
  if (!order) return null;

  const effectiveLogo = labLogoUrl || resolveLabLogo(profile.logoUrl);

  // Print Mode State: 'profile_break' (One page per test/profile) vs 'continuous' (Compact combined)
  const [pageBreakMode, setPageBreakMode] = useState<'profile_break' | 'continuous'>('profile_break');

  // Filter which tests to print (default all)
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(
    order.tests.map((t) => t.testId)
  );

  // Signatures State (Editable on report)
  const [selectedChemist, setSelectedChemist] = useState<string>(
    order.labChemist || profile.availableChemists[0] || 'كيميائي أحمد الشناوي'
  );
  const [selectedVerifier, setSelectedVerifier] = useState<string>(
    order.verifiedBy || profile.availableVerifiers[0] || 'د. رامي مختار'
  );
  const [selectedPathologist, setSelectedPathologist] = useState<string>(
    order.pathologist ||
      profile.availablePathologists[1] ||
      'رامي مختار - طبيب الباثولوجيا الإكلينيكية والكيميائيه طب قصر العيني'
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportPPT = () => {
    exportOrderToPowerPoint(order, profile);
  };

  const isVerified = order.tests.every((t) => t.status === 'verified');

  // Format Dates in English as requested
  const formatDateEnglish = (isoString?: string) => {
    if (!isoString)
      return (
        new Date().toLocaleDateString('en-GB') +
        ' ' +
        new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      );
    const d = new Date(isoString);
    return (
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const collectionDateEng = formatDateEnglish(order.specimenCollectedAt || order.createdAt);
  const reportingDateEng = formatDateEnglish(order.verifiedAt || new Date().toISOString());

  // Filtered tests list
  const activeTests = order.tests.filter((t) => selectedTestIds.includes(t.testId));
  const totalPages = pageBreakMode === 'profile_break' ? activeTests.length : 1;

  // Helper for Coloured Chart Range Indicator
  const renderColouredChart = (valStr: string, refText: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return null;

    const nums = refText.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (!nums || nums.length < 2) return null;

    const min = parseFloat(nums[0]);
    const max = parseFloat(nums[1]);
    if (isNaN(min) || isNaN(max) || min >= max) return null;

    let percent = 50;
    if (val < min) {
      const diff = min - val;
      percent = Math.max(5, 30 - (diff / (max - min)) * 25);
    } else if (val > max) {
      const diff = val - max;
      percent = Math.min(95, 70 + (diff / (max - min)) * 25);
    } else {
      const ratio = (val - min) / (max - min);
      percent = 30 + ratio * 40;
    }

    const isLow = val < min;
    const isHigh = val > max;

    return (
      <div className="w-20 sm:w-24 mx-auto flex flex-col items-center">
        <div className="relative w-full h-2 rounded-full overflow-hidden flex bg-slate-200">
          <div className="w-[30%] bg-sky-400" title="Low" />
          <div className="w-[40%] bg-emerald-500" title="Normal" />
          <div className="w-[30%] bg-rose-500" title="High" />
          <div
            className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full border border-white shadow-xs transition-all ${
              isLow ? 'bg-sky-700' : isHigh ? 'bg-rose-700' : 'bg-emerald-800'
            }`}
            style={{ left: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between w-full text-[7.5px] text-slate-400 font-mono mt-0.5 px-0.5 select-none">
          <span>L</span>
          <span className="text-emerald-700 font-bold">NORM</span>
          <span>H</span>
        </div>
      </div>
    );
  };

  // Reusable Page Header Component
  const renderOfficialHeader = () => (
    <div className="border-b-2 border-rose-950 pb-3 mb-3">
      <div className="flex items-center justify-between gap-4">
        {/* Right: Arabic Header & License */}
        <div className="text-right">
          <h1 className="text-lg sm:text-xl font-black text-rose-950 tracking-tight leading-none">
            {profile.nameAr}
          </h1>
          <div className="text-xs font-bold text-blue-950 mt-1">
            {profile.directorName}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
            {profile.licenseNumber}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            هواتف المعمل: {profile.phone} · {profile.phone2}
          </div>
        </div>

        {/* Center: Official High-Res RT Logo */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-rose-800 shadow-sm shrink-0 flex items-center justify-center bg-slate-950 p-1">
          <img
            src={effectiveLogo}
            alt="RT Labs"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => onImageErrorFallback(e)}
          />
        </div>

        {/* Left: English Header & Accreditation */}
        <div className="text-left font-sans">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
            {profile.nameEn}
          </h2>
          <div className="text-[10px] sm:text-[11px] font-bold text-rose-900 mt-1">
            ISO 15189:2022 ACCREDITED MEDICAL LAB
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
            Bahteam Sq., El-Ezaby Tower, 3rd Floor
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Shubra El-Kheima, Cairo, Egypt
          </div>
        </div>
      </div>
    </div>
  );

  // Reusable Patient Demographic Header Component
  const renderPatientDemographics = () => (
    <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 mb-4 shadow-sm border border-slate-800 text-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Patient Name</span>
          <span className="font-black text-white text-xs sm:text-sm leading-snug">
            {order.patient.name}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Age / Gender</span>
          <span className="font-bold text-rose-200">
            {order.patient.age} {order.patient.ageUnit} · {order.patient.gender === 'male' ? 'MALE' : 'FEMALE'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Sample ID / Barcode</span>
          <span className="font-mono font-black text-amber-300 tracking-wider">
            {order.sampleBarcode}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Order No</span>
          <span className="font-mono font-bold text-slate-200">{order.orderNumber}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Referring Doctor</span>
          <span className="font-semibold text-white truncate block">
            {order.referringDoctor || 'Prof dr'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Sampling Date (Eng)</span>
          <span className="font-mono text-slate-300 font-semibold">{collectionDateEng}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Report Date (Eng)</span>
          <span className="font-mono text-emerald-300 font-semibold">{reportingDateEng}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Phone / File</span>
          <span className="font-mono text-slate-300">{order.patient.phone}</span>
        </div>
      </div>
    </div>
  );

  // Reusable Single Test Table Component
  const renderTestTable = (testResult: OrderTestResult) => (
    <div key={testResult.testId} className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs mb-4">
      {/* Section Bar */}
      <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide text-rose-200 font-sans">
            {testResult.nameEn}
          </span>
          <span className="text-slate-300 text-xs font-sans">
            · {testResult.nameAr}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-300">
          CODE: {testResult.code}
        </span>
      </div>

      {/* Parameters Table */}
      <table className="w-full text-left text-xs font-sans border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px] tracking-wider">
            <th className="py-2 px-3 text-left w-[28%]">INVESTIGATION</th>
            <th className="py-2 px-2 text-center w-[15%]">RESULT</th>
            <th className="py-2 px-2 text-center w-[16%]">CHART</th>
            <th className="py-2 px-2 text-center w-[12%]">FLAGS</th>
            <th className="py-2 px-2 text-center w-[10%]">UNIT</th>
            <th className="py-2 px-3 text-left w-[19%]">REFERENCE INTERVAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {testResult.results.map((param) => {
            const isPanic = param.flag === 'panic_high' || param.flag === 'panic_low';
            const isHigh = param.flag === 'high';
            const isLow = param.flag === 'low';
            const isAbnormal = isPanic || isHigh || isLow || param.flag === 'abnormal';

            return (
              <tr
                key={param.parameterId}
                className={`hover:bg-slate-50 transition-colors ${
                  isPanic
                    ? 'bg-rose-50 font-bold text-rose-950'
                    : isAbnormal
                    ? 'bg-amber-50/60 font-semibold text-amber-950'
                    : 'text-slate-800'
                }`}
              >
                {/* 1. Investigation Name */}
                <td className="py-2 px-3">
                  <div className="font-bold text-slate-900 leading-tight">
                    {param.nameEn}
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                    {param.nameAr}
                  </div>
                </td>

                {/* 2. Measured Result */}
                <td className="py-2 px-2 text-center">
                  <span
                    className={`font-mono text-sm tracking-tight ${
                      isPanic
                        ? 'font-black text-rose-700 underline text-base'
                        : isHigh
                        ? 'font-black text-amber-800'
                        : isLow
                        ? 'font-black text-blue-800'
                        : 'font-semibold text-slate-900'
                    }`}
                  >
                    {param.value || '-'}
                  </span>
                </td>

                {/* 3. Coloured Range Indicator Bar */}
                <td className="py-2 px-2 text-center">
                  {renderColouredChart(param.value, param.refText)}
                </td>

                {/* 4. Flags */}
                <td className="py-2 px-2 text-center">
                  {isPanic ? (
                    <span className="font-mono text-[9px] font-black text-white bg-rose-700 px-2 py-0.5 rounded shadow-2xs animate-pulse">
                      ▲ PANIC
                    </span>
                  ) : isHigh ? (
                    <span className="font-mono text-[9px] font-black text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded">
                      ▲ HIGH
                    </span>
                  ) : isLow ? (
                    <span className="font-mono text-[9px] font-black text-blue-900 bg-blue-200/90 px-1.5 py-0.5 rounded">
                      ▼ LOW
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      NORMAL
                    </span>
                  )}
                </td>

                {/* 5. Unit */}
                <td className="py-2 px-2 text-center font-mono text-slate-600 text-[11px]">
                  {param.unit || '-'}
                </td>

                {/* 6. Reference Range */}
                <td className="py-2 px-3 text-left font-mono text-slate-600 text-[11px] leading-relaxed">
                  {param.refText || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Clinical Interpretation / Doctor Comments */}
      {testResult.interpretation && (
        <div className="bg-amber-50/70 border-t border-amber-200 p-2.5 text-xs text-amber-950 font-sans text-right" dir="rtl">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>التقرير والتعليق الإكلينيكي المعتمد (Clinical Interpretation):</span>
          </div>
          <p className="text-[11px] leading-relaxed font-medium pr-5">
            {testResult.interpretation}
          </p>
        </div>
      )}
    </div>
  );

  // Reusable Page Footer Component
  const renderOfficialFooter = (currentPage: number, total: number) => (
    <div className="mt-auto pt-3 border-t-2 border-slate-300">
      <div className="grid grid-cols-4 gap-4 items-center">
        {/* Sample Barcode & Page Number */}
        <div className="text-left font-sans">
          <div className="flex items-center gap-1.5 text-slate-800">
            <QrCode className="w-6 h-6 text-slate-900" />
            <div className="text-[9px] font-mono leading-tight">
              <div>AUTH REPORT</div>
              <div className="font-bold text-slate-900">{order.sampleBarcode}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-rose-950 mt-1 font-mono">
            Page {currentPage} of {total}
          </div>
        </div>

        {/* Lab Chemist */}
        <div className="text-center font-sans">
          <div className="text-[9px] uppercase font-bold text-slate-500">LAB CHEMIST</div>
          <div className="h-8 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs">{selectedChemist}</span>
          </div>
          <div className="text-[8px] text-slate-400 font-medium">Automated Clinical Chemistry</div>
        </div>

        {/* Verified By */}
        <div className="text-center font-sans">
          <div className="text-[9px] uppercase font-bold text-slate-500">VERIFIED BY</div>
          <div className="h-8 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs">{selectedVerifier}</span>
          </div>
          <div className="text-[8px] text-emerald-700 font-semibold flex items-center justify-center gap-0.5">
            <ShieldCheck className="w-3 h-3" />
            <span>QC PASSED</span>
          </div>
        </div>

        {/* Pathologist */}
        <div className="text-center font-sans">
          <div className="text-[9px] uppercase font-bold text-rose-950">PATHOLOGIST</div>
          <div className="h-8 flex flex-col items-center justify-center">
            <div className="text-xs font-black text-rose-950 leading-tight">
              {selectedPathologist}
            </div>
          </div>
          <div className="text-[8px] text-slate-500 font-mono">
            اعتماد إلكتروني رسمي
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-500 leading-none font-sans">
        {profile.nameAr} - {profile.address} · هواتف الحجز: {profile.phone} - {profile.phone2} · هذا التقرير صالح طبياً وقانونياً ومعتمد من وزارة الصحة
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container - on print this becomes full-width multi-page A4 flow */}
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Actions (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 print:hidden shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-800" />
            <h3 className="text-sm font-bold text-slate-900">
              تقرير معامل RT الذكي المعتمد (Smart Clinical Report)
            </h3>
            {isVerified ? (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                معتمد نهائياً
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                مسودة - قيد الفحص
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher: Page Break per profile vs Continuous */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPageBreakMode('profile_break')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-bold ${
                  pageBreakMode === 'profile_break'
                    ? 'bg-rose-900 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                title="فصل كل بروفايل في صفحة مستقلة عند الطباعة والحفظ كـ PDF"
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>صفحة لكل بروفايل</span>
              </button>

              <button
                type="button"
                onClick={() => setPageBreakMode('continuous')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-bold ${
                  pageBreakMode === 'continuous'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                title="طباعة متصلة ومدمجة"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>تقرير مدمج</span>
              </button>
            </div>

            {/* WhatsApp send button */}
            <a
              href={generateReportWhatsAppUrl(order, profile)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
              title="إرسال إشعار النتيجة للمريض عبر واتساب"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إرسال واتساب</span>
            </a>

            {/* PowerPoint PPTX export */}
            <button
              onClick={handleExportPPT}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-2xs"
              title="تصدير عرض تقديمي PPTX بقياس A4"
            >
              <Presentation className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">PowerPoint</span>
            </button>

            {/* Print / Save Multi-page PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-sm hover:shadow transition-all"
              title="طباعة على ورق A4 أو الحفظ كـ PDF بصفحات متعددة"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة A4 / حفظ PDF ({totalPages} {totalPages === 1 ? 'صفحة' : 'صفحات'})</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Guidance and Test Selection Bar (Hidden on Print) */}
        <div className="px-6 py-2 bg-gradient-to-r from-rose-50 to-amber-50/50 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-rose-950 font-bold">
            <Info className="w-4 h-4 text-rose-700 shrink-0" />
            <span>
              💡 لحفظ كامل صفحات التقرير كملف PDF: اضغط على زر <strong>طباعة A4 / حفظ PDF</strong>، ثم اختر من نافذة المتصفح الوجهة <strong>«حفظ بتنسيق PDF (Save as PDF)»</strong>.
            </span>
          </div>

          {/* Test selection filter */}
          {order.tests.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">الفحوصات المضمنة:</span>
              <div className="flex items-center gap-1.5">
                {order.tests.map((t) => (
                  <label
                    key={t.testId}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded cursor-pointer border ${
                      selectedTestIds.includes(t.testId)
                        ? 'bg-rose-900 text-white font-bold border-rose-950'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedTestIds.includes(t.testId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTestIds([...selectedTestIds, t.testId]);
                        } else {
                          if (selectedTestIds.length > 1) {
                            setSelectedTestIds(selectedTestIds.filter((id) => id !== t.testId));
                          }
                        }
                      }}
                    />
                    <span>{t.code}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Signature Selectors Bar (Hidden on Print, controls printable report) */}
        <div className="px-6 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <UserCheck className="w-4 h-4 text-rose-800" />
            <span>تخصيص توقيعات هذا التقرير:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Lab Chemist */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 text-[11px]">LAB CHEMIST:</span>
              <select
                value={selectedChemist}
                onChange={(e) => setSelectedChemist(e.target.value)}
                className="text-xs p-1 bg-white border border-slate-300 rounded font-semibold text-slate-800"
              >
                {profile.availableChemists.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Verified By */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 text-[11px]">VERIFIED BY:</span>
              <select
                value={selectedVerifier}
                onChange={(e) => setSelectedVerifier(e.target.value)}
                className="text-xs p-1 bg-white border border-slate-300 rounded font-semibold text-slate-800"
              >
                {profile.availableVerifiers.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Pathologist */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 text-[11px] font-bold text-rose-900">PATHOLOGIST:</span>
              <select
                value={selectedPathologist}
                onChange={(e) => setSelectedPathologist(e.target.value)}
                className="text-xs p-1 bg-white border border-rose-300 rounded font-bold text-rose-950"
              >
                {profile.availablePathologists.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Printable Paper Area (Standard A4 Medical Report Layout with Page Breaks) */}
        <div
          className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0 print:m-0"
          id="printable-report-wrapper"
        >
          {pageBreakMode === 'profile_break' ? (
            /* Mode 1: One Profile / Test Per Page (Page Break per test as requested) */
            activeTests.map((testResult, idx) => (
              <div
                key={testResult.testId}
                className="print-profile-page bg-white p-6 sm:p-8 mb-6 border border-slate-200 rounded-xl shadow-xs print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col justify-between"
                style={{
                  pageBreakAfter: idx < activeTests.length - 1 ? 'always' : 'auto',
                  breakAfter: idx < activeTests.length - 1 ? 'page' : 'auto',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  minHeight: '265mm',
                }}
              >
                <div>
                  {/* Official Header */}
                  {renderOfficialHeader()}

                  {/* Patient Demographics */}
                  {renderPatientDemographics()}

                  {/* The Test Table */}
                  <div className="text-left" dir="ltr">
                    {renderTestTable(testResult)}
                  </div>
                </div>

                {/* Official Signatures & Page Number */}
                {renderOfficialFooter(idx + 1, activeTests.length)}
              </div>
            ))
          ) : (
            /* Mode 2: Continuous Compact Combined Report */
            <div className="print-profile-page bg-white p-6 sm:p-8 border border-slate-200 rounded-xl shadow-xs print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col justify-between min-h-[265mm]">
              <div>
                {/* Official Header */}
                {renderOfficialHeader()}

                {/* Patient Demographics */}
                {renderPatientDemographics()}

                {/* All Tests Tables */}
                <div className="text-left space-y-4 mb-6" dir="ltr">
                  {activeTests.map((t) => renderTestTable(t))}
                </div>
              </div>

              {/* Official Signatures */}
              {renderOfficialFooter(1, 1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
