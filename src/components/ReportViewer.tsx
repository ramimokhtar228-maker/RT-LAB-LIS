import React, { useState, useMemo } from 'react';
import { PatientEncounter, LabSettings, TestCatalogItem, ProfileCatalogItem } from '../types/lab';
import { BarcodeBadge, OfficialLabStamp } from './BarcodeBadge';
import { RTLogo } from './RTLogo';
import { getFlagDisplayInfo } from '../utils/calculations';
import { DEFAULT_DIAGNOSTIC_PHRASES } from '../data/diagnosticPhrases';
import {
  Printer,
  FileDown,
  Presentation,
  Loader2,
  Edit3,
  Sparkles,
  Eye,
  EyeOff,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  HelpCircle,
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';
import { exportReportToPdf, exportReportToPptx } from '../utils/exportUtils';

interface ReportViewerProps {
  encounter: PatientEncounter;
  settings: LabSettings;
  catalogMap: Map<string, TestCatalogItem>;
  profilesCatalog: ProfileCatalogItem[];
  onUpdateEncounter: (encounter: PatientEncounter) => void;
  onEditPatient: () => void;
  onEditSettings: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  encounter,
  settings,
  catalogMap,
  profilesCatalog,
  onUpdateEncounter,
  onEditPatient,
  onEditSettings,
}) => {
  const { patient, selectedTestCodes, results, clinicalInterpretation } = encounter;
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);

  // Local toggle for Smart Report separate page (defaults to encounter preference or lab setting)
  const showSmartPage =
    encounter.showSmartReportOnPrint !== undefined
      ? encounter.showSmartReportOnPrint
      : settings.showSmartReportPage;

  const handleToggleSmartPage = () => {
    onUpdateEncounter({
      ...encounter,
      showSmartReportOnPrint: !showSmartPage,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportReportToPdf('report-printable-sheet', encounter);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPptx = async () => {
    try {
      setIsExportingPptx(true);
      await exportReportToPptx(encounter, settings, catalogMap);
    } catch (err) {
      console.error('PowerPoint generation error:', err);
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Group tests into dedicated profiles so each profile gets its own separate page!
  const profilesPages = useMemo(() => {
    const pages: Array<{
      id: string;
      code: string;
      title: string;
      specimen: string;
      tests: TestCatalogItem[];
      category: string;
    }> = [];

    // Map each profile defined in catalog
    const assignedTestCodes = new Set<string>();

    profilesCatalog.forEach((prof) => {
      const matchTests = prof.tests
        .filter((code) => selectedTestCodes.includes(code))
        .map((code) => catalogMap.get(code))
        .filter((t): t is TestCatalogItem => !!t);

      if (matchTests.length > 0) {
        matchTests.forEach((t) => assignedTestCodes.add(t.code));
        pages.push({
          id: prof.id,
          code: prof.code,
          title: prof.name,
          specimen:
            prof.specimenType ||
            (matchTests[0]?.tubeType.includes('EDTA')
              ? 'EDTA Whole Blood'
              : matchTests[0]?.tubeType.includes('Citrate')
              ? 'Citrated Plasma'
              : matchTests[0]?.tubeType.includes('Sterile')
              ? 'Clean Midstream Urine'
              : 'Serum (Yellow SST)'),
          tests: matchTests,
          category: prof.category,
        });
      }
    });

    // Check remaining tests not covered by profiles
    const unassignedTests = selectedTestCodes
      .filter((code) => !assignedTestCodes.has(code))
      .map((code) => catalogMap.get(code))
      .filter((t): t is TestCatalogItem => !!t);

    if (unassignedTests.length > 0) {
      // Group unassigned by category
      const catMap = new Map<string, TestCatalogItem[]>();
      unassignedTests.forEach((t) => {
        const cat = t.category || 'General Clinical Chemistry';
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat)!.push(t);
      });

      catMap.forEach((tests, cat) => {
        pages.push({
          id: `cat-${cat}`,
          code: cat.toUpperCase().slice(0, 8),
          title: `${cat} Profile`,
          specimen: tests[0]?.tubeType.includes('EDTA')
            ? 'EDTA Whole Blood'
            : tests[0]?.tubeType.includes('Citrate')
            ? 'Citrated Plasma'
            : tests[0]?.tubeType.includes('Sterile')
            ? 'Sterile Container'
            : 'Serum (SST Gel)',
          tests,
          category: cat,
        });
      });
    }

    return pages;
  }, [selectedTestCodes, profilesCatalog, catalogMap]);

  // Total pages count (Profiles pages + optional separate Smart Report page)
  const totalPages = profilesPages.length + (showSmartPage ? 1 : 0);

  // Profile Comments handler
  const handleUpdateProfileComment = (profileCode: string, comment: string) => {
    const updated = {
      ...encounter,
      profileComments: {
        ...(encounter.profileComments || {}),
        [profileCode]: comment,
      },
    };
    onUpdateEncounter(updated);
  };

  // Guidance phrase insertion
  const handleInsertGuidancePhrase = (profileCode: string, phraseText: string, suggestedCodes?: string[]) => {
    const currentComment = encounter.profileComments?.[profileCode] || '';
    const newComment = currentComment ? `${currentComment}\n• ${phraseText}` : phraseText;

    const currentRecommended = encounter.profileRecommendedTests?.[profileCode] || [];
    const newRecommended = Array.from(new Set([...currentRecommended, ...(suggestedCodes || [])]));

    onUpdateEncounter({
      ...encounter,
      profileComments: {
        ...(encounter.profileComments || {}),
        [profileCode]: newComment,
      },
      profileRecommendedTests: {
        ...(encounter.profileRecommendedTests || {}),
        [profileCode]: newRecommended,
      },
    });
  };

  // Toggle suggested follow up test abbreviation
  const handleToggleRecommendedTest = (profileCode: string, testAbbr: string) => {
    const currentList = encounter.profileRecommendedTests?.[profileCode] || [];
    const exists = currentList.includes(testAbbr);
    const updatedList = exists ? currentList.filter((c) => c !== testAbbr) : [...currentList, testAbbr];

    onUpdateEncounter({
      ...encounter,
      profileRecommendedTests: {
        ...(encounter.profileRecommendedTests || {}),
        [profileCode]: updatedList,
      },
    });
  };

  // Add custom test abbreviation to recommended list
  const handleAddCustomRecommendedTest = (profileCode: string, testAbbr: string) => {
    const clean = testAbbr.trim().toUpperCase();
    if (!clean) return;
    const currentList = encounter.profileRecommendedTests?.[profileCode] || [];
    if (!currentList.includes(clean)) {
      onUpdateEncounter({
        ...encounter,
        profileRecommendedTests: {
          ...(encounter.profileRecommendedTests || {}),
          [profileCode]: [...currentList, clean],
        },
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-2 sm:px-4">
      {/* ================= Top Controls Bar (Hidden during print) ================= */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7A1C30] to-slate-900 border border-rose-700/60 flex items-center justify-center text-rose-300">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span>تقرير التحاليل الطبية المعتمد - معامل RT</span>
              <span className="text-[10px] bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full font-mono">
                {profilesPages.length} بروفايل في صفحات منفصلة
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              استشاريو كلية طب قصر العيني • طباعة A4 مطابقة للنموذج الرسمي
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
          {/* Smart Report Separate Page Toggle Button */}
          <button
            onClick={handleToggleSmartPage}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showSmartPage
                ? 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border-purple-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="إظهار أو إخفاء صفحة التقرير الذكي والاستشاري المدمجة في نهاية التقرير"
          >
            {showSmartPage ? (
              <>
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>إخفاء التقرير الذكي</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>إظهار التقرير الذكي</span>
              </>
            )}
          </button>

          {/* Direct PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7A1C30] hover:bg-[#621424] text-rose-100 text-xs font-bold border border-rose-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="تحميل مباشر لملف PDF عالي الجودة"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                <span>جاري إعداد PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-rose-300" />
                <span>حفظ PDF</span>
              </>
            )}
          </button>

          {/* Native Print button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white text-xs font-bold hover:from-rose-600 hover:to-rose-800 shadow-lg shadow-rose-950/40 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة A4</span>
          </button>

          <button
            onClick={onEditPatient}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>بيانات المريض</span>
          </button>
        </div>
      </div>

      {/* ================= PRINTABLE CONTAINER ================= */}
      <div id="report-printable-sheet" className="space-y-8 print:space-y-0">
        {/* ================= EACH PROFILE IN A SEPARATE PAGE ================= */}
        {profilesPages.map((prof, pageIdx) => {
          const currentPageNum = pageIdx + 1;
          const profileComment = encounter.profileComments?.[prof.code] || '';
          const recommendedTests = encounter.profileRecommendedTests?.[prof.code] || [];
          const profilePhrases = DEFAULT_DIAGNOSTIC_PHRASES.filter(
            (ph) => ph.profileCode === prof.code || ph.profileCode === 'GENERAL'
          );

          return (
            <div
              key={prof.id}
              className="profile-page bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none relative overflow-hidden font-sans min-h-[960px] flex flex-col justify-between"
            >
              {/* Top Colored Dual-Stripe Ribbon (Blue & Burgundy) matching sample image */}
              <div className="absolute top-0 left-0 right-0 h-1.5 flex z-20">
                <div className="w-1/2 bg-[#1e3a8a]" />
                <div className="w-1/2 bg-[#8B1E3F]" />
              </div>

              <div>
                {/* 1. Official Header (Kasr Al Ainy layout) */}
                <header className="border-b-2 border-[#8B1E3F] pb-4 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: RT Logo + Kasr Al Ainy Brand */}
                    <div className="flex items-center gap-3.5">
                      <RTLogo size={66} imageUrl={settings.logoUrl} />
                      <div className="text-left" dir="ltr">
                        <h1 className="text-xl sm:text-2xl font-black text-[#8B1E3F] tracking-tight leading-none font-sans">
                          {settings.labNameEn || 'RT Diagnostic Laboratories'}
                        </h1>
                        <h2 className="text-[11px] sm:text-xs font-black text-slate-900 tracking-wider font-sans uppercase mt-1">
                          KASR AL AINY FACULTY OF MEDICINE CONSULTANTS
                        </h2>
                        <p className="text-[10px] font-semibold text-slate-600 font-sans tracking-tight">
                          Clinical Pathology &amp; Diagnostic Laboratory Services
                        </p>
                      </div>
                    </div>

                    {/* Right: Address & Emergency Contacts in Arabic & English */}
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10.5px] font-bold text-slate-800 leading-tight">
                        {settings.addressAr}
                      </p>
                      <p className="text-[10px] font-bold text-slate-700 font-mono mt-0.5" dir="ltr">
                        Emergency Tel: {settings.phone1} {settings.phone2 ? `| ${settings.phone2}` : ''}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[9.5px] font-bold text-slate-500 font-sans tracking-wide">
                          {settings.accreditationText || 'Accreditation: ISO 15189 Aligned'}
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* 2. Patient Demographics Card with Left Burgundy Accent Border */}
                <section
                  className="bg-slate-50/80 rounded-lg border border-slate-200 border-l-4 border-l-[#8B1E3F] p-3.5 shadow-sm mt-3"
                  dir="ltr"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 text-xs">
                    {/* Patient Name */}
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        PATIENT NAME / اسم المريض
                      </span>
                      <span className="text-sm font-black text-slate-900 font-sans">
                        {patient.name}
                      </span>
                    </div>

                    {/* Lab / Reg No. */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        LAB / REG NO.
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {patient.mrn}
                      </span>
                    </div>

                    {/* Age / Gender */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        AGE / GENDER
                      </span>
                      <span className="font-bold text-slate-900">
                        {patient.ageYears} Yrs {patient.ageMonths ? `${patient.ageMonths} Mos` : ''} / {patient.gender}
                      </span>
                    </div>

                    {/* Collected */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        COLLECTED
                      </span>
                      <span className="font-mono text-slate-800 text-[11px]">
                        {patient.sampleDate} {patient.sampleTime}
                      </span>
                    </div>

                    {/* Reported */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        REPORTED
                      </span>
                      <span className="font-mono text-slate-800 text-[11px] font-bold">
                        {patient.reportDate} {patient.reportTime}
                      </span>
                    </div>

                    {/* Referred By */}
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        REFERRED BY
                      </span>
                      <span className="font-semibold text-slate-800">
                        {patient.referringDoctor || 'Prof. Dr. Herself / Self'}
                      </span>
                    </div>

                    {/* Clinical Diagnosis / Indication */}
                    <div className="col-span-4 border-t border-slate-200/80 pt-1.5 mt-0.5">
                      <span className="text-[9.5px] font-bold uppercase text-[#8B1E3F] tracking-wider inline mr-2">
                        CLINICAL DIAGNOSIS / INDICATION:
                      </span>
                      <span className="text-slate-800 font-bold italic text-xs">
                        {patient.clinicalNotes || 'Weakness, Abd. Pain, routine medical investigation'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* 3. Test Profile Header Banner with Specimen Pill */}
                <div className="mt-4 flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#1e3a8a] rounded-sm" />
                    <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight font-sans">
                      {prof.title}
                    </h3>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-sans">
                    Specimen: <span className="font-bold text-[#8B1E3F]">{prof.specimen}</span>
                  </div>
                </div>

                {/* 4. Table Layout matching Kasr Al Ainy Sample Photo */}
                <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden shadow-sm" dir="ltr">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#14213d] text-white text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="py-2.5 px-3.5 w-5/12">INVESTIGATION</th>
                        <th className="py-2.5 px-3 w-2/12 text-center">RESULT</th>
                        <th className="py-2.5 px-2.5 w-1.5/12 text-center">UNIT</th>
                        <th className="py-2.5 px-2.5 w-1.5/12 text-center">FLAGS</th>
                        <th className="py-2.5 px-3.5 w-2/12">REFERENCES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prof.tests.map((test, idx) => {
                        const res = results[test.code];
                        const val = res?.value || 'Pending';
                        const flag = res?.flag || 'NORMAL';
                        const refText = res?.refRangeText || test.refMale?.text || 'Normal';

                        // Flags styling
                        let flagBadge = 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold';
                        let resultStyle = 'text-slate-900 font-bold';

                        if (flag === 'HIGH') {
                          flagBadge = 'text-red-700 bg-red-50 border-red-300 font-black';
                          resultStyle = 'text-red-700 font-black';
                        } else if (flag === 'LOW') {
                          flagBadge = 'text-amber-700 bg-amber-50 border-amber-300 font-bold';
                          resultStyle = 'text-amber-800 font-black';
                        } else if (flag === 'PANIC_HIGH' || flag === 'PANIC_LOW') {
                          flagBadge = 'text-white bg-rose-700 border-rose-800 font-black animate-pulse';
                          resultStyle = 'text-rose-700 font-black underline text-sm';
                        }

                        return (
                          <tr
                            key={test.code}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                          >
                            {/* Investigation Name + Method Subtitle */}
                            <td className="py-2 px-3.5 align-top">
                              <div className="font-black text-slate-900 text-xs font-sans">
                                {test.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-sans">
                                {test.method ? `Method: ${test.method}` : test.scientificName}
                              </div>
                              {res?.comment && (
                                <div className="text-[9.5px] text-amber-800 italic mt-0.5">
                                  Note: {res.comment}
                                </div>
                              )}
                            </td>

                            {/* Result */}
                            <td className={`py-2 px-3 align-top text-center font-mono text-xs ${resultStyle}`}>
                              {val}
                            </td>

                            {/* Unit */}
                            <td className="py-2 px-2.5 align-top text-center font-mono text-slate-600 text-[11px]">
                              {test.unit || '-'}
                            </td>

                            {/* Flags Badge */}
                            <td className="py-2 px-2.5 align-top text-center">
                              {res?.value ? (
                                <span
                                  className={`inline-block text-[9.5px] px-2 py-0.5 rounded border uppercase tracking-wider ${flagBadge}`}
                                >
                                  {flag}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </td>

                            {/* References Range */}
                            <td className="py-2 px-3.5 align-top font-mono text-slate-700 text-[11px] whitespace-pre-line">
                              {refText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 5. Comment and Interpretation Section ("داخل التقرير Comment and interpretation") */}
                <div className="mt-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50 avoid-break" dir="ltr">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <span className="text-xs font-extrabold text-[#8B1E3F] tracking-wide uppercase flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>COMMENT AND CLINICAL INTERPRETATION</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold print:hidden">
                      ملاحظات استشارية معتمدة
                    </span>
                  </div>

                  {/* Guidance Phrases Selector (Visible on Screen, Injects with 1 Click) */}
                  {profilePhrases.length > 0 && (
                    <div className="mb-2.5 p-2 bg-rose-50/70 border border-rose-200/80 rounded-lg print:hidden">
                      <span className="text-[10.5px] font-bold text-rose-950 block mb-1">
                        💡 عبارات تشخيصية استرشادية خاصة بهذا البروفايل (انقر للإضافة الفورية):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profilePhrases.map((phrase) => (
                          <button
                            key={phrase.id}
                            onClick={() =>
                              handleInsertGuidancePhrase(prof.code, phrase.statement, phrase.suggestedTestCodes)
                            }
                            className="text-[10.5px] bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 px-2 py-1 rounded-md transition-all text-right shadow-2xs"
                            title={phrase.statement}
                          >
                            + {phrase.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comment Textarea (On screen editable) / Formatted text (On print) */}
                  <div className="print:hidden">
                    <textarea
                      value={profileComment}
                      onChange={(e) => handleUpdateProfileComment(prof.code, e.target.value)}
                      placeholder="أدخل التعليق الطبي والتفسير الإكلينيكي للبروفايل هنا (أو اختر من العبارات الاسترشادية أعلاه)..."
                      rows={2}
                      className="w-full text-xs p-2 rounded border border-slate-300 font-sans focus:outline-none focus:ring-1 focus:ring-rose-800 bg-white"
                    />
                  </div>

                  {profileComment ? (
                    <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line hidden print:block">
                      {profileComment}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic hidden print:block">
                      Findings correlated with clinical presentation. No acute cellular abnormalities noted.
                    </div>
                  )}
                </div>

                {/* 6. Recommended Further Investigations List (Abbreviations only, NO prices) */}
                {settings.showRecommendedTests && (
                  <div className="mt-3 border border-slate-200 rounded-lg p-2.5 bg-white avoid-break" dir="ltr">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        <span className="text-[10.5px] font-black text-slate-900 uppercase tracking-wide">
                          RECOMMENDED FURTHER INVESTIGATIONS (FOLLOW-UP)
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-500 font-medium">
                        اختصارات التحاليل المقترحة للمتابعة
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-600 mb-1.5 leading-snug">
                      Based on current biochemical findings and differential considerations, the following laboratory parameters are clinically advised for patient monitoring:
                    </p>

                    {/* Checkbox Chips of suggested test abbreviations */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Standard common suggestions bank for this profile */}
                      {[
                        ...new Set([
                          ...recommendedTests,
                          ...(prof.code === 'CBC'
                            ? ['FERR', 'FE/TIBC', 'STOOL-OB', 'CRP', 'HB-ELECT']
                            : prof.code === 'LFT'
                            ? ['HBsAg', 'HCV-Ab', 'US-ABD', 'GGT', 'LIPID']
                            : prof.code === 'KFT'
                            ? ['MICROALB', 'URINE-R/E', 'NA/K', 'US-RENAL']
                            : prof.code === 'LIPID'
                            ? ['HBA1C', 'ALT', 'TSH', 'Apo-B']
                            : prof.code === 'DIABETES'
                            ? ['HOMA-IR', 'LIPID', 'MICROALB', 'EGFR']
                            : prof.code === 'TFT'
                            ? ['ANTI-TPO', 'ANTI-TG', 'US-THYROID']
                            : ['CBC', 'CRP', 'ESR']),
                        ]),
                      ].map((abbr) => {
                        const isSelected = recommendedTests.includes(abbr);
                        return (
                          <button
                            key={abbr}
                            onClick={() => handleToggleRecommendedTest(prof.code, abbr)}
                            className={`px-2.5 py-0.5 rounded text-[10.5px] font-mono font-bold border transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 print:hidden'
                            }`}
                          >
                            {isSelected ? `✓ ${abbr}` : `+ ${abbr}`}
                          </button>
                        );
                      })}

                      {/* Input for doctor to add custom test abbreviation */}
                      <div className="inline-flex items-center gap-1 print:hidden">
                        <input
                          type="text"
                          placeholder="+ رمز تحليل"
                          id={`input-add-${prof.code}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.currentTarget.value || '').trim();
                              if (val) {
                                handleAddCustomRecommendedTest(prof.code, val);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="px-2 py-0.5 rounded border border-slate-300 text-[10px] font-mono w-24 focus:outline-none focus:ring-1 focus:ring-rose-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Signatures & Official Stamp (Well proportioned & manageable) */}
              <footer className="pt-4 border-t-2 border-slate-300 mt-4 avoid-break">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-center">
                  {/* Chemist / Lab Specialist */}
                  {settings.signatures
                    .filter((s) => s.role === 'Chemist' && s.show)
                    .map((s) => (
                      <div key={s.id} className="space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                          Medical Biochemist / الكيميائي
                        </div>
                        <div
                          style={{ height: `${s.signatureHeight || 38}px` }}
                          className="font-serif italic text-sm text-slate-700 flex items-center justify-center border-b border-slate-300 mx-4"
                        >
                          {s.signatureText || 'Mahmoud El-Shenawy'}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800">{s.name}</div>
                        <div className="text-[9.5px] text-slate-500">{s.title}</div>
                      </div>
                    ))}

                  {/* Official Stamp */}
                  <div className="flex flex-col items-center justify-center">
                    {settings.showStamp ? (
                      <OfficialLabStamp text={settings.stampText} date={patient.reportDate} />
                    ) : (
                      <div className="text-xs text-slate-400 italic">Seal Omitted</div>
                    )}
                  </div>

                  {/* Consultant Clinical Pathologist (Kasr Al Ainy) */}
                  {settings.signatures
                    .filter((s) => s.role === 'Pathologist' && s.show)
                    .map((s) => (
                      <div key={s.id} className="space-y-1">
                        <div className="text-[10px] font-bold uppercase text-[#8B1E3F] tracking-wider">
                          Consultant Pathologist / استشاري الباثولوجيا
                        </div>
                        <div
                          style={{ height: `${s.signatureHeight || 42}px` }}
                          className="font-serif italic font-bold text-base text-[#8B1E3F] flex items-center justify-center border-b border-rose-400 mx-4"
                        >
                          {s.signatureText || 'Dr. Rami Mokhtar'}
                        </div>
                        <div className="text-[11px] font-black text-rose-950">{s.name}</div>
                        <div className="text-[9.5px] text-slate-600 font-semibold">{s.title}</div>
                      </div>
                    ))}
                </div>

                {/* End of Page Bar with Page Numbering (Page X of Y) */}
                <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9.5px] text-slate-400 font-mono flex items-center justify-between">
                  <span>RT LAB LIS • Sample ID: {patient.mrn}</span>
                  <span>*** END OF {prof.code} PROFILE • نهاية تقرير البروفايل ***</span>
                  <span className="font-bold text-slate-700">
                    Page {currentPageNum} / {totalPages}
                  </span>
                </div>
              </footer>
            </div>
          );
        })}

        {/* ================= 8. SMART REPORT MERGED AS SEPARATE FINAL PAGE ================= */}
        {showSmartPage && clinicalInterpretation && (
          <div className="smart-report-page bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none relative overflow-hidden font-sans min-h-[960px] flex flex-col justify-between">
            {/* Top Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex z-20">
              <div className="w-1/2 bg-[#1e3a8a]" />
              <div className="w-1/2 bg-[#8B1E3F]" />
            </div>

            <div>
              {/* Header */}
              <header className="border-b-2 border-[#8B1E3F] pb-4 pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <RTLogo size={66} imageUrl={settings.logoUrl} />
                    <div className="text-left" dir="ltr">
                      <h1 className="text-xl sm:text-2xl font-black text-[#8B1E3F] tracking-tight leading-none font-sans">
                        {settings.labNameEn || 'RT Diagnostic Laboratories'}
                      </h1>
                      <h2 className="text-[11px] sm:text-xs font-black text-slate-900 tracking-wider font-sans uppercase mt-1">
                        KASR AL AINY FACULTY OF MEDICINE CONSULTANTS
                      </h2>
                      <p className="text-[10px] font-semibold text-slate-600 font-sans tracking-tight">
                        Clinical Pathology &amp; Diagnostic Laboratory Services
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-black text-[#8B1E3F] bg-rose-50 border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
                      ★ SMART CLINICAL CONSULTATION
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1">
                      ISO 15189 Aligned Decision Support
                    </span>
                  </div>
                </div>
              </header>

              {/* Patient Demographics Summary Bar */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 mt-3 flex flex-wrap items-center justify-between text-xs font-sans" dir="ltr">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">PATIENT NAME</span>
                  <span className="font-black text-slate-900">{patient.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">MRN / FILE</span>
                  <span className="font-mono font-bold text-slate-900">{patient.mrn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">AGE / GENDER</span>
                  <span className="font-bold text-slate-900">{patient.ageYears} Yrs / {patient.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">REPORT DATE</span>
                  <span className="font-mono font-bold text-slate-900">{patient.reportDate}</span>
                </div>
              </div>

              {/* Smart Report Body */}
              <div className="mt-5 space-y-4" dir="rtl">
                {/* Critical Alert if present */}
                {clinicalInterpretation.criticalAlert && (
                  <div className="bg-red-50 border-r-4 border-red-600 p-3.5 rounded-lg flex items-start gap-3 text-red-950 font-bold text-xs">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black">تنبيه قيم حرجة (Critical Panic Value Alert):</div>
                      <p className="mt-0.5">{clinicalInterpretation.criticalAlert}</p>
                    </div>
                  </div>
                )}

                {/* Executive Summary */}
                <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-4 space-y-2">
                  <div className="flex items-center gap-2 border-b border-rose-200 pb-2">
                    <Sparkles className="w-4 h-4 text-[#8B1E3F]" />
                    <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                      الخلاصة الإكلينيكية الشاملة (Executive Clinical Summary)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {clinicalInterpretation.summary}
                  </p>
                </div>

                {/* Primary Abnormal Findings */}
                {clinicalInterpretation.primaryFindings?.length > 0 && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-700" />
                      <span>النتائج المخبرية غير الطبيعية المرصودة:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {clinicalInterpretation.primaryFindings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-semibold flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-700 shrink-0" />
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Differential Considerations & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Differential */}
                  {clinicalInterpretation.differentialConsiderations?.length > 0 && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-[#1e3a8a]" />
                        <span>التشخيص التفريقي المحتمل:</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pr-4">
                        {clinicalInterpretation.differentialConsiderations.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up Plan */}
                  {clinicalInterpretation.suggestedFollowUp?.length > 0 && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>توصيات المتابعة والفحوصات التكميلية:</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pr-4">
                        {clinicalInterpretation.suggestedFollowUp.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer on Smart Page */}
            <footer className="pt-4 border-t-2 border-slate-300 mt-6 avoid-break">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-center">
                {/* Official Stamp */}
                <div className="flex flex-col items-center justify-center">
                  {settings.showStamp ? (
                    <OfficialLabStamp text={settings.stampText} date={patient.reportDate} />
                  ) : null}
                </div>

                {/* Consultant Signature */}
                {settings.signatures
                  .filter((s) => s.role === 'Pathologist' && s.show)
                  .map((s) => (
                    <div key={s.id} className="space-y-1 text-center">
                      <div className="text-[10px] font-bold uppercase text-[#8B1E3F] tracking-wider">
                        Consultant Pathologist / استشاري الباثولوجيا الإكلينيكية
                      </div>
                      <div
                        style={{ height: `${s.signatureHeight || 42}px` }}
                        className="font-serif italic font-bold text-base text-[#8B1E3F] flex items-center justify-center border-b border-rose-400 mx-8"
                      >
                        {s.signatureText || 'Dr. Rami Mokhtar'}
                      </div>
                      <div className="text-[11px] font-black text-rose-950">{s.name}</div>
                      <div className="text-[9.5px] text-slate-600 font-semibold">{s.title}</div>
                    </div>
                  ))}
              </div>

              {/* End of Report notice */}
              <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9.5px] text-slate-400 font-mono flex items-center justify-between">
                <span>RT LAB LIS • Sample ID: {patient.mrn}</span>
                <span>*** FINAL CLINICAL CONSULTATION PAGE • التقرير الذكي المعتمد ***</span>
                <span className="font-bold text-slate-700">
                  Page {totalPages} / {totalPages}
                </span>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
