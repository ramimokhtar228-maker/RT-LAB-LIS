import React, { useRef } from 'react';
import { PatientEncounter, LabSettings, TestCatalogItem } from '../types/lab';
import { BarcodeBadge, OfficialLabStamp } from './BarcodeBadge';
import { getFlagDisplayInfo } from '../utils/calculations';
import { Printer, Download, Sparkles, Building2, Phone, Mail, Globe, MapPin, CheckCircle2, ShieldCheck, Edit3 } from 'lucide-react';

interface ReportViewerProps {
  encounter: PatientEncounter;
  settings: LabSettings;
  catalogMap: Map<string, TestCatalogItem>;
  onEditPatient: () => void;
  onEditSettings: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  encounter,
  settings,
  catalogMap,
  onEditPatient,
  onEditSettings,
}) => {
  const { patient, selectedTestCodes, results, clinicalInterpretation } = encounter;

  const handlePrint = () => {
    window.print();
  };

  // Group tests by category for clinical elegance
  const groupedByCategory = React.useMemo(() => {
    const map = new Map<string, TestCatalogItem[]>();
    selectedTestCodes.forEach((code) => {
      const item = catalogMap.get(code);
      if (item) {
        const cat = item.category || 'General Clinical Chemistry';
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(item);
      }
    });
    return Array.from(map.entries());
  }, [selectedTestCodes, catalogMap]);

  return (
    <div className="max-w-5xl mx-auto my-6 px-2 sm:px-4">
      {/* Top Controls (Hidden during print) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-700/60 flex items-center justify-center text-rose-300">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">معاينة وطباعة تقرير التحاليل المعتمد (A4 Medical Report)</h2>
            <p className="text-xs text-slate-400">
              التقرير مصمم وفق المعايير الطبية الدولية وجاهز للطباعة أو الحفظ كملف PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEditPatient}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل بيانات المريض</span>
          </button>
          <button
            onClick={onEditSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>تعديل الترويسة والامضاءات</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white text-xs font-bold hover:from-rose-600 hover:to-rose-800 shadow-lg shadow-rose-950/40 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير (Print Report / PDF)</span>
          </button>
        </div>
      </div>

      {/* ================= Printable A4 Sheet ================= */}
      <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none relative overflow-hidden font-sans">
        
        {/* Background Watermark (Optional from settings) */}
        {settings.showWatermark && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] select-none z-0">
            <img
              src={settings.logoUrl || '/assets/aistudio/photo_2026-10-02_00-22-10_28ae1371.jpg'}
              alt="Watermark"
              className="w-96 h-96 object-contain"
            />
          </div>
        )}

        <div className="relative z-10 space-y-6">
          {/* ================= 1. Official Header ================= */}
          <header className="border-b-2 border-rose-900 pb-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left Brand block (Arabic & English) */}
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-rose-800 shadow-md bg-black shrink-0">
                  <img
                    src={settings.logoUrl || '/assets/aistudio/photo_2026-10-02_00-22-10_28ae1371.jpg'}
                    alt="RT Lab Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-rose-950 tracking-tight leading-tight">
                    {settings.labNameAr}
                  </h1>
                  <h2 className="text-xs sm:text-sm font-extrabold text-blue-950 tracking-wider font-sans uppercase">
                    {settings.labNameEn}
                  </h2>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                    {settings.labSubtitleAr}
                  </p>
                  <p className="text-[10px] text-slate-500 font-sans tracking-wide">
                    {settings.labSubtitleEn}
                  </p>
                </div>
              </div>

              {/* Right Sample Barcode & Accreditation */}
              <div className="text-right flex flex-col items-end">
                {settings.showBarcode && (
                  <BarcodeBadge value={patient.barcode || patient.mrn} height={34} />
                )}
                <div className="mt-1 text-[10px] text-slate-500 text-right leading-tight max-w-[200px]">
                  <span className="font-bold text-rose-900">ISO 15189 Standard</span>
                  <br />
                  Cleveland-Referenced Protocol
                </div>
              </div>
            </div>

            {/* Address & Hotline Bar */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-800 shrink-0" />
                <span>{settings.addressAr}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-slate-800">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-800" />
                  <span dir="ltr">{settings.phone1}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-800" />
                  <span dir="ltr">{settings.website}</span>
                </span>
              </div>
            </div>
          </header>

          {/* ================= 2. Patient Demographics Banner ================= */}
          <section className="bg-slate-50 rounded-xl border border-slate-200/90 p-4 shadow-sm" dir="ltr">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs">
              {/* Patient Name (Arabic/English) */}
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Patient Name / اسم المريض
                </span>
                <span className="text-sm font-black text-rose-950 font-sans">
                  {patient.name}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  MRN / File No.
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {patient.mrn}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  National ID / Passport
                </span>
                <span className="font-mono text-slate-800">
                  {patient.nationalId || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Age / Gender
                </span>
                <span className="font-bold text-slate-900">
                  {patient.ageYears} Yrs {patient.ageMonths ? `${patient.ageMonths} Mos` : ''} / {patient.gender}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Referring Physician
                </span>
                <span className="font-semibold text-slate-800">
                  {patient.referringDoctor || 'Self'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Sample Drawn
                </span>
                <span className="font-mono text-slate-800">
                  {patient.sampleDate} {patient.sampleTime}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Report Date
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {patient.reportDate} {patient.reportTime}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Specimen / Preparation
                </span>
                <span className="text-slate-800 font-medium">
                  {patient.sampleType} • {patient.fastingStatus}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Clinical Diagnosis / History
                </span>
                <span className="text-slate-700 italic">
                  {patient.clinicalNotes || 'Routine Diagnostic Investigation'}
                </span>
              </div>
            </div>
          </section>

          {/* ================= 3. Results Section (Left-to-Right Tables) ================= */}
          <main className="space-y-6" dir="ltr">
            {groupedByCategory.map(([category, tests]) => (
              <div key={category} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-rose-950 to-slate-900 text-white px-4 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider font-sans">
                    {category}
                  </h3>
                  <span className="text-[10px] text-rose-200 font-mono">
                    RT Clinical Pathology Division
                  </span>
                </div>

                {/* Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-2 px-3 w-5/12">Investigation / Scientific Test</th>
                      <th className="py-2 px-3 w-2/12 text-center">Result</th>
                      <th className="py-2 px-3 w-2/12 text-center">Flag</th>
                      <th className="py-2 px-3 w-1/12">Unit</th>
                      <th className="py-2 px-3 w-2/12">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tests.map((test, idx) => {
                      const res = results[test.code];
                      const val = res?.value || 'Pending';
                      const flag = res?.flag || 'NORMAL';
                      const flagInfo = getFlagDisplayInfo(flag);
                      const refText = res?.refRangeText || 'Normal';

                      return (
                        <tr
                          key={test.code}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                        >
                          {/* Test name & method */}
                          <td className="py-2 px-3 align-top">
                            <div className="font-bold text-slate-900 text-xs">
                              {test.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans">
                              {test.scientificName}
                              {settings.showMethodology && test.method && (
                                <span className="text-slate-400 italic"> • [{test.method}]</span>
                              )}
                            </div>
                            {res?.comment && (
                              <div className="text-[10px] text-amber-700 italic mt-0.5">
                                Note: {res.comment}
                              </div>
                            )}
                          </td>

                          {/* Result */}
                          <td className="py-2 px-3 align-top text-center font-mono font-black text-xs text-slate-900">
                            <span
                              className={
                                flag === 'PANIC_HIGH' || flag === 'PANIC_LOW'
                                  ? 'text-rose-700 underline text-sm'
                                  : flag === 'HIGH'
                                  ? 'text-amber-800 text-sm'
                                  : flag === 'LOW'
                                  ? 'text-blue-700 text-sm'
                                  : 'text-slate-900'
                              }
                            >
                              {val}
                            </span>
                          </td>

                          {/* Flag Chart Indicator */}
                          <td className="py-2 px-3 align-top text-center">
                            {res?.value ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${flagInfo.badgeClass}`}
                              >
                                <span>{flagInfo.icon}</span>
                                <span>{flagInfo.label}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>

                          {/* Unit */}
                          <td className="py-2 px-3 align-top font-mono text-slate-600 text-[11px]">
                            {test.unit || '-'}
                          </td>

                          {/* Reference range */}
                          <td className="py-2 px-3 align-top font-mono text-slate-700 text-[11px] whitespace-pre-line">
                            {refText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </main>

          {/* ================= 4. AI Clinical Interpretation (If generated) ================= */}
          {clinicalInterpretation && (
            <section className="bg-purple-50/50 rounded-xl border border-purple-200 p-4 space-y-2.5 print:break-inside-avoid">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide">
                    Clinical Pathology Correlation & AI Interpretation
                  </h4>
                </div>
                <span className="text-[10px] text-purple-700 font-mono">
                  RT-AI Diagnostic Engine
                </span>
              </div>

              {clinicalInterpretation.criticalAlert && (
                <div className="bg-rose-100 border-l-4 border-rose-600 p-2.5 text-xs text-rose-900 font-bold rounded">
                  ⚠️ {clinicalInterpretation.criticalAlert}
                </div>
              )}

              <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
                {clinicalInterpretation.summary}
              </p>

              {clinicalInterpretation.differentialConsiderations?.length > 0 && (
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-purple-900">Differential Considerations: </span>
                  {clinicalInterpretation.differentialConsiderations.join(' • ')}
                </div>
              )}

              {clinicalInterpretation.suggestedFollowUp?.length > 0 && (
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-purple-900">Recommended Follow-up: </span>
                  {clinicalInterpretation.suggestedFollowUp.join(' • ')}
                </div>
              )}
            </section>
          )}

          {/* ================= 5. Signatures & Official Stamp ================= */}
          <footer className="pt-6 border-t-2 border-slate-300 mt-8 print:break-inside-avoid">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center">
              {/* Medical Chemist Signature */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Medical Biochemist / الكيميائي
                </div>
                <div className="font-serif italic text-base text-slate-700 h-10 flex items-center justify-center border-b border-slate-300 mx-4">
                  Mahmoud El-Shenawy
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {settings.chemistName}
                </div>
                <div className="text-[10px] text-slate-500">
                  {settings.chemistTitle}
                </div>
              </div>

              {/* Official Stamp */}
              <div className="flex flex-col items-center justify-center">
                {settings.showStamp ? (
                  <OfficialLabStamp text={settings.stampText} date={patient.reportDate} />
                ) : (
                  <div className="text-xs text-slate-400 italic">Seal Omitted</div>
                )}
              </div>

              {/* Consultant Pathologist Signature */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-rose-900 tracking-wider">
                  Lab Consultant / طبيب الباثولوجيا الإكلينيكية
                </div>
                <div className="font-serif italic font-bold text-lg text-rose-900 h-10 flex items-center justify-center border-b border-rose-400 mx-4">
                  Dr. Rami Mokhtar
                </div>
                <div className="text-xs font-black text-rose-950">
                  {settings.pathologistName}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold">
                  {settings.pathologistTitle}
                </div>
              </div>
            </div>

            {/* End of Report notice */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>RT LAB LIS • Sample ID: {patient.mrn}</span>
              <span>*** END OF LABORATORY REPORT • نهاية التقرير المعتمد ***</span>
              <span>Page 1 of 1</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
