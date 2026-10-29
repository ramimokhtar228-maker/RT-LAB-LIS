import React from 'react';
import { PatientRecord, PatientTestResult, TestCatalogItem, FlagType } from '../types/lab';
import { getFlagDisplayInfo, getReferenceRangeText } from '../utils/calculations';
import { Plus, Trash2, Calculator, AlertTriangle, Sparkles, CheckCircle2, Search, Sliders } from 'lucide-react';

interface ResultsEntryGridProps {
  patient: PatientRecord;
  selectedTestCodes: string[];
  results: Record<string, PatientTestResult>;
  catalogMap: Map<string, TestCatalogItem>;
  onResultChange: (code: string, value: string) => void;
  onRemoveTest: (code: string) => void;
  onOpenTestSelector: () => void;
  onFillDemoNormal: () => void;
  onFillDemoAbnormal: () => void;
}

export const ResultsEntryGrid: React.FC<ResultsEntryGridProps> = ({
  patient,
  selectedTestCodes,
  results,
  catalogMap,
  onResultChange,
  onRemoveTest,
  onOpenTestSelector,
  onFillDemoNormal,
  onFillDemoAbnormal,
}) => {
  // Sort tests by category
  const sortedTests = React.useMemo(() => {
    return [...selectedTestCodes]
      .map((code) => catalogMap.get(code))
      .filter((t): t is TestCatalogItem => t !== undefined)
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [selectedTestCodes, catalogMap]);

  if (selectedTestCodes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center my-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          لم يتم اختيار أي تحاليل لهذا المريض بعد
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          قم باختيار باقة فحص شامل (كالفحص البلاتيني) أو بروفايلات كبرى (CBC / LFT / KFT / LIPID / TFT) أو تحاليل فردية من الكتالوج الدولي للبدء في إدخال النتائج.
        </p>
        <button
          onClick={onOpenTestSelector}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-800 to-rose-950 text-white font-bold text-xs shadow-lg shadow-rose-950/20 hover:from-rose-700 hover:to-rose-900 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>اختيار التحاليل من الكتالوج الطبي</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden my-4">
      {/* Table Action Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>سجل إدخال النتائج المخبرية</span>
            <span className="bg-rose-900 text-white text-xs px-2 py-0.5 rounded-full font-mono">
              {sortedTests.length} Tests
            </span>
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            (الجدول منظم بمعايير الجودة الدولية Left-to-Right)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onFillDemoNormal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
            title="تعبئة قيم طبيعية تجريبية لجميع التحاليل المحددة"
          >
            ✓ تعبئة قيم طبيعية
          </button>
          <button
            onClick={onFillDemoAbnormal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
            title="تعبئة قيم تشمل حالات غير طبيعية لاختبار محرك الذكاء الاصطناعي والحسابات"
          >
            ⚡ تجربة قيم غير طبيعية
          </button>
          <button
            onClick={onOpenTestSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-900 text-white hover:bg-rose-800 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة / تعديل التحاليل</span>
          </button>
        </div>
      </div>

      {/* LTR Medical Table */}
      <div className="overflow-x-auto" dir="ltr">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white border-b-2 border-rose-800">
              <th className="py-3 px-4 font-bold tracking-wider uppercase text-[11px] w-64">
                TESTS / INVESTIGATIONS
              </th>
              <th className="py-3 px-4 font-bold tracking-wider uppercase text-[11px] w-48 text-center">
                RESULTS
              </th>
              <th className="py-3 px-4 font-bold tracking-wider uppercase text-[11px] w-36 text-center">
                FLAGS / STATUS
              </th>
              <th className="py-3 px-4 font-bold tracking-wider uppercase text-[11px] w-28">
                UNITS
              </th>
              <th className="py-3 px-4 font-bold tracking-wider uppercase text-[11px] w-52">
                REFERENCE INTERVALS
              </th>
              <th className="py-3 px-4 font-bold tracking-wider uppercase text-[11px]">
                METHOD / ANALYZER
              </th>
              <th className="py-3 px-3 w-12 text-center">
                DEL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedTests.map((test, index) => {
              const res = results[test.code];
              const value = res ? res.value : '';
              const flag = res ? res.flag : 'NORMAL';
              const flagInfo = getFlagDisplayInfo(flag);
              const isCalc = test.isCalculated;
              const refText = getReferenceRangeText(test, patient);

              return (
                <tr
                  key={test.code}
                  className={`hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  {/* Test Name & Code */}
                  <td className="py-2.5 px-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {test.code}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">
                          {test.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          {test.scientificName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Result Input */}
                  <td className="py-2.5 px-4 align-middle text-center">
                    {test.options ? (
                      <select
                        value={value}
                        onChange={(e) => onResultChange(test.code, e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-rose-700 focus:outline-none"
                      >
                        <option value="">-- Select --</option>
                        {test.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type={test.isCalculated ? 'text' : 'text'}
                          value={value}
                          readOnly={test.isCalculated}
                          onChange={(e) => onResultChange(test.code, e.target.value)}
                          placeholder={isCalc ? 'Auto-calculating...' : 'Enter result...'}
                          className={`w-full text-center font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                            isCalc
                              ? 'bg-amber-50/70 border-amber-300 text-amber-900 cursor-not-allowed'
                              : 'bg-white border-slate-300 focus:ring-2 focus:ring-rose-700 focus:outline-none text-slate-900'
                          }`}
                        />
                        {isCalc && (
                          <span
                            className="absolute right-2 top-2 pointer-events-none text-amber-700"
                            title="Auto-calculated parameter"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Flag Indicator */}
                  <td className="py-2.5 px-4 align-middle text-center">
                    {value ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${flagInfo.badgeClass}`}
                      >
                        <span>{flagInfo.icon}</span>
                        <span>{flagInfo.label}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Pending</span>
                    )}
                  </td>

                  {/* Unit */}
                  <td className="py-2.5 px-4 align-middle font-mono text-slate-600 font-medium text-[11px]">
                    {test.unit || '-'}
                  </td>

                  {/* Reference Range */}
                  <td className="py-2.5 px-4 align-middle font-mono text-slate-700 text-[11px]">
                    {refText}
                  </td>

                  {/* Method */}
                  <td className="py-2.5 px-4 align-middle text-slate-500 text-[10px] truncate max-w-xs" title={test.method}>
                    {test.method}
                  </td>

                  {/* Delete Action */}
                  <td className="py-2.5 px-3 align-middle text-center">
                    <button
                      onClick={() => onRemoveTest(test.code)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title={`Remove ${test.code}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Normal Range
          </span>
          <span className="flex items-center gap-1.5 text-blue-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Low (L)
          </span>
          <span className="flex items-center gap-1.5 text-amber-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            High (H)
          </span>
          <span className="flex items-center gap-1.5 text-rose-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            Panic Value (Critical)
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          الحسابات الرياضية والمعادلات الطبية تعمل بصورة تلقائية وتحدث فور كتابة القيم المدخلة.
        </div>
      </div>
    </div>
  );
};
