/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ResultsEntryGrid Component
 * Segregates patient tests by clinical profiles (CBC, LFT, KFT, Lipid, Thyroid, etc.)
 * Each profile has its own:
 * 1. Dedicated LTR results table with real-time auto-flagging and reference ranges
 * 2. Clinical Comments & Interpretation section with Smart Auto-CDS generator
 * 3. Recommended Follow-up Tests for individual abnormal tests (with 1-click Add to Encounter or Report)
 */

import React, { useState, useMemo } from 'react';
import {
  PatientRecord,
  PatientTestResult,
  TestCatalogItem,
  ProfileCatalogItem,
  FlagType,
} from '../types/lab';
import { getFlagDisplayInfo, getReferenceRangeText } from '../utils/calculations';
import { analyzeProfileClinicalCds } from '../utils/clinicalCdsEngine';
import { DEFAULT_DIAGNOSTIC_PHRASES } from '../data/diagnosticPhrases';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  Activity,
  Layers,
  ChevronRight,
  ChevronLeft,
  Columns,
  ListFilter,
  Check,
  FlaskConical,
  RotateCcw,
} from 'lucide-react';

interface ResultsEntryGridProps {
  patient: PatientRecord;
  selectedTestCodes: string[];
  results: Record<string, PatientTestResult>;
  catalogMap: Map<string, TestCatalogItem>;
  profilesCatalog: ProfileCatalogItem[];
  profileComments?: Record<string, string>;
  profileRecommendedTests?: Record<string, string[]>;
  onResultChange: (code: string, value: string) => void;
  onRemoveTest: (code: string) => void;
  onOpenTestSelector: () => void;
  onFillDemoNormal: () => void;
  onFillDemoAbnormal: () => void;
  onUpdateProfileComment?: (profileCode: string, comment: string) => void;
  onUpdateProfileRecommendedTests?: (profileCode: string, testCodes: string[]) => void;
  onAddTestToEncounter?: (testCode: string) => void;
}

export const ResultsEntryGrid: React.FC<ResultsEntryGridProps> = ({
  patient,
  selectedTestCodes,
  results,
  catalogMap,
  profilesCatalog,
  profileComments = {},
  profileRecommendedTests = {},
  onResultChange,
  onRemoveTest,
  onOpenTestSelector,
  onFillDemoNormal,
  onFillDemoAbnormal,
  onUpdateProfileComment,
  onUpdateProfileRecommendedTests,
  onAddTestToEncounter,
}) => {
  // Mode: 'tabbed' (focus on one profile) or 'stacked' (show all profiles)
  const [viewMode, setViewMode] = useState<'tabbed' | 'stacked'>('tabbed');
  const [activeProfileTab, setActiveProfileTab] = useState<string>('');
  const [customTestInput, setCustomTestInput] = useState<Record<string, string>>({});

  // 1. Group tests into profiles
  const profilesData = useMemo(() => {
    const list: Array<{
      id: string;
      code: string;
      title: string;
      category: string;
      specimen: string;
      tubeType: string;
      tests: TestCatalogItem[];
    }> = [];

    const assignedCodes = new Set<string>();

    profilesCatalog.forEach((prof) => {
      const matchTests = prof.tests
        .filter((code) => selectedTestCodes.includes(code))
        .map((code) => catalogMap.get(code))
        .filter((t): t is TestCatalogItem => t !== undefined);

      if (matchTests.length > 0) {
        matchTests.forEach((t) => assignedCodes.add(t.code));
        list.push({
          id: prof.id,
          code: prof.code,
          title: prof.name,
          category: prof.category,
          specimen: prof.specimenType || 'Venous Blood',
          tubeType: matchTests[0]?.tubeType || 'Yellow SST Gel',
          tests: matchTests,
        });
      }
    });

    // Unassigned tests grouped by category
    const unassigned = selectedTestCodes
      .filter((code) => !assignedCodes.has(code))
      .map((code) => catalogMap.get(code))
      .filter((t): t is TestCatalogItem => t !== undefined);

    if (unassigned.length > 0) {
      const byCat = new Map<string, TestCatalogItem[]>();
      unassigned.forEach((t) => {
        const cat = t.category || 'General Investigations';
        if (!byCat.has(cat)) byCat.set(cat, []);
        byCat.get(cat)!.push(t);
      });

      byCat.forEach((tests, cat) => {
        list.push({
          id: `custom-${cat}`,
          code: cat.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
          title: `${cat} Panel`,
          category: cat,
          specimen: tests[0]?.sampleCondition || 'Serum / Plasma',
          tubeType: tests[0]?.tubeType || 'Yellow SST Gel',
          tests,
        });
      });
    }

    return list;
  }, [selectedTestCodes, catalogMap, profilesCatalog]);

  // Set default active tab
  React.useEffect(() => {
    if (profilesData.length > 0 && (!activeProfileTab || !profilesData.some((p) => p.code === activeProfileTab))) {
      setActiveProfileTab(profilesData[0].code);
    }
  }, [profilesData, activeProfileTab]);

  // Tube color helper
  const getTubeBadge = (tubeType: string) => {
    const t = tubeType.toLowerCase();
    if (t.includes('purple') || t.includes('edta')) {
      return { bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-600', label: 'Purple EDTA Tube' };
    }
    if (t.includes('yellow') || t.includes('sst')) {
      return { bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500', label: 'Yellow SST Gel Tube' };
    }
    if (t.includes('blue') || t.includes('citrate')) {
      return { bg: 'bg-sky-100 text-sky-900 border-sky-300', dot: 'bg-sky-500', label: 'Light Blue Citrate Tube' };
    }
    if (t.includes('grey') || t.includes('fluoride')) {
      return { bg: 'bg-slate-200 text-slate-800 border-slate-400', dot: 'bg-slate-500', label: 'Grey Fluoride Tube' };
    }
    if (t.includes('green') || t.includes('heparin')) {
      return { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-600', label: 'Green Heparin Tube' };
    }
    if (t.includes('sterile') || t.includes('container') || t.includes('urine')) {
      return { bg: 'bg-teal-100 text-teal-900 border-teal-300', dot: 'bg-teal-600', label: 'Sterile Cup / Urine' };
    }
    return { bg: 'bg-rose-100 text-rose-900 border-rose-300', dot: 'bg-rose-600', label: 'Plain Red Tube' };
  };

  if (selectedTestCodes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center my-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <FlaskConical className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900">
          لم يتم اختيار أي تحاليل طبية لهذا المريض حتى الآن
        </h3>
        <p className="text-xs text-slate-500 max-w-lg mx-auto mt-2 mb-6 leading-relaxed">
          اختر من كتالوج التحاليل الشامل (412+ تحليل) أو الباقات الجاهزة (CBC, LFT, KFT, Lipid Profile, Thyroid) للبدء في إدخال النتائج ومتابعة التشخيص الذكي.
        </p>
        <button
          onClick={onOpenTestSelector}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 text-white font-black text-xs shadow-lg shadow-rose-950/20 hover:from-rose-800 hover:to-rose-900 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>فتح كتالوج الـ 412 تحليل الطبي واختيار الفحوصات</span>
        </button>
      </div>
    );
  }

  // Summary statistics
  let totalAbnormal = 0;
  let totalCritical = 0;
  let totalEntered = 0;

  selectedTestCodes.forEach((code) => {
    const res = results[code];
    if (res && res.value && res.value.trim() !== '') {
      totalEntered++;
      if (res.flag === 'HIGH' || res.flag === 'LOW') totalAbnormal++;
      if (res.flag === 'PANIC_HIGH' || res.flag === 'PANIC_LOW') totalCritical++;
    }
  });

  // Handler to auto-generate CDS interpretation for a profile
  const handleGenerateProfileCds = (profCode: string, profTests: TestCatalogItem[]) => {
    const insight = analyzeProfileClinicalCds(profCode, profTests, results, patient);
    if (onUpdateProfileComment) {
      onUpdateProfileComment(profCode, insight.suggestedInterpretation);
    }
    if (onUpdateProfileRecommendedTests && insight.recommendedFollowUpTests.length > 0) {
      const existing = profileRecommendedTests[profCode] || [];
      const merged = Array.from(new Set([...existing, ...insight.recommendedFollowUpTests]));
      onUpdateProfileRecommendedTests(profCode, merged);
    }
  };

  // Toggle recommended test in report
  const handleToggleRecommended = (profCode: string, testCode: string) => {
    if (!onUpdateProfileRecommendedTests) return;
    const existing = profileRecommendedTests[profCode] || [];
    const updated = existing.includes(testCode)
      ? existing.filter((c) => c !== testCode)
      : [...existing, testCode];
    onUpdateProfileRecommendedTests(profCode, updated);
  };

  // Add custom test abbreviation to profile recommendations
  const handleAddCustomTest = (profCode: string) => {
    const val = (customTestInput[profCode] || '').trim().toUpperCase();
    if (!val || !onUpdateProfileRecommendedTests) return;
    const existing = profileRecommendedTests[profCode] || [];
    if (!existing.includes(val)) {
      onUpdateProfileRecommendedTests(profCode, [...existing, val]);
    }
    setCustomTestInput({ ...customTestInput, [profCode]: '' });
  };

  // Fill normal values for a single profile
  const handleFillProfileNormal = (tests: TestCatalogItem[]) => {
    tests.forEach((t) => {
      let normalVal = '';
      if (t.refMale) {
        if (t.refMale.min !== undefined && t.refMale.max !== undefined) {
          const mid = (t.refMale.min + t.refMale.max) / 2;
          normalVal = mid >= 10 ? mid.toFixed(1) : mid.toFixed(2);
        } else if (t.refMale.max !== undefined) {
          normalVal = (t.refMale.max * 0.6).toFixed(1);
        } else if (t.options && t.options.length > 0) {
          normalVal = t.options[0];
        } else {
          normalVal = 'Negative';
        }
      }
      onResultChange(t.code, normalVal);
    });
  };

  // Clear values for a single profile
  const handleClearProfile = (tests: TestCatalogItem[]) => {
    tests.forEach((t) => onResultChange(t.code, ''));
  };

  return (
    <div className="space-y-4 my-4">
      {/* Top Bar: Stats, View Mode Toggle, and Global Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-800 animate-pulse" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              سجل إدخال النتائج المخبرية حسب البروفايل
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-700">
              {totalEntered} / {selectedTestCodes.length} Tests
            </span>
            {totalAbnormal > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-bold">
                ⚠️ {totalAbnormal} غير طبيعي
              </span>
            )}
            {totalCritical > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black animate-pulse">
                🚨 {totalCritical} قيم حرجة (Panic)
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('tabbed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'tabbed'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="التركيز على بروفايل واحد كل مرة"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>تبويبات البروفايلات</span>
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'stacked'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض جميع البروفايلات معاً"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>عرض كل البروفايلات</span>
            </button>
          </div>

          {/* Quick Demo Buttons */}
          <button
            onClick={onFillDemoNormal}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="تعبئة قيم طبيعية تجريبية لجميع البروفايلات"
          >
            ✓ تعبئة الكل طبيعي
          </button>
          <button
            onClick={onFillDemoAbnormal}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            title="تعبئة قيم تشمل حالات غير طبيعية لاختبار محرك CDS الذكي"
          >
            ⚡ تجربة قيم مرضية
          </button>
          <button
            onClick={onOpenTestSelector}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-900 text-white hover:bg-rose-800 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة تحاليل</span>
          </button>
        </div>
      </div>

      {/* Tabbed View Navigation Pill Bar */}
      {viewMode === 'tabbed' && profilesData.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {profilesData.map((prof, idx) => {
            const isActive = prof.code === activeProfileTab;
            const profEntered = prof.tests.filter(
              (t) => results[t.code]?.value && results[t.code].value.trim() !== ''
            ).length;
            const isComplete = profEntered === prof.tests.length;
            const hasAbnormal = prof.tests.some(
              (t) => results[t.code]?.flag === 'HIGH' || results[t.code]?.flag === 'LOW'
            );
            const hasPanic = prof.tests.some(
              (t) => results[t.code]?.flag === 'PANIC_HIGH' || results[t.code]?.flag === 'PANIC_LOW'
            );

            return (
              <button
                key={prof.code}
                onClick={() => setActiveProfileTab(prof.code)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-rose-900 text-white border-rose-950 shadow-md scale-102'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{prof.title}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-rose-950 text-rose-200'
                      : isComplete
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {profEntered}/{prof.tests.length}
                </span>
                {hasPanic && <span className="text-rose-400 animate-pulse">🚨</span>}
                {!hasPanic && hasAbnormal && <span className="text-amber-400">⚠️</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Render Profile Cards */}
      {profilesData
        .filter((prof) => viewMode === 'stacked' || prof.code === activeProfileTab)
        .map((prof) => {
          const tubeInfo = getTubeBadge(prof.tubeType);
          const profileComment = profileComments[prof.code] || '';
          const recommendedTests = profileRecommendedTests[prof.code] || [];
          const profilePhrases = DEFAULT_DIAGNOSTIC_PHRASES.filter(
            (ph) => ph.profileCode === prof.code || ph.profileCode === 'GENERAL'
          );

          // Calculate profile stats
          const profEntered = prof.tests.filter(
            (t) => results[t.code]?.value && results[t.code].value.trim() !== ''
          ).length;
          const isComplete = profEntered === prof.tests.length;

          // CDS Insight for this profile
          const cdsInsight = analyzeProfileClinicalCds(prof.code, prof.tests, results, patient);

          return (
            <div
              key={prof.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all"
            >
              {/* Profile Card Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-8 bg-rose-700 rounded-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-wide text-white font-sans">
                        {prof.title}
                      </h3>
                      <span className="text-xs font-mono font-bold bg-rose-950 text-rose-200 px-2 py-0.5 rounded border border-rose-800">
                        {prof.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                      <span>Category: {prof.category}</span>
                      <span>•</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${tubeInfo.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${tubeInfo.dot}`} />
                        <span>{tubeInfo.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
                    {profEntered}/{prof.tests.length} Entered
                  </span>
                  <button
                    onClick={() => handleFillProfileNormal(prof.tests)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-colors cursor-pointer"
                    title="تعبئة قيم طبيعية لهذا البروفايل فقط"
                  >
                    ✓ طبيعي
                  </button>
                  <button
                    onClick={() => handleClearProfile(prof.tests)}
                    className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700 transition-colors cursor-pointer"
                    title="مسح قيم هذا البروفايل"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* LTR Medical Results Table */}
              <div className="overflow-x-auto" dir="ltr">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4 w-5/12">INVESTIGATION / METHOD</th>
                      <th className="py-3 px-3 w-2/12 text-center">RESULT</th>
                      <th className="py-3 px-2.5 w-1.5/12 text-center">FLAG</th>
                      <th className="py-3 px-2 w-1.5/12 text-center">UNIT</th>
                      <th className="py-3 px-3.5 w-2/12">REFERENCE INTERVAL</th>
                      <th className="py-3 px-2 text-center w-12">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prof.tests.map((test, idx) => {
                      const res = results[test.code];
                      const val = res?.value ?? '';
                      const flag = res?.flag ?? 'NORMAL';
                      const flagInfo = getFlagDisplayInfo(flag);
                      const refText = res?.refRangeText || getReferenceRangeText(test, patient);

                      // Style result input based on abnormal flag
                      let inputBorder = 'border-slate-300 focus:border-rose-800 focus:ring-rose-800';
                      if (flag === 'HIGH') inputBorder = 'border-red-400 bg-red-50/50 text-red-900 font-black';
                      if (flag === 'LOW') inputBorder = 'border-amber-400 bg-amber-50/50 text-amber-900 font-bold';
                      if (flag === 'PANIC_HIGH' || flag === 'PANIC_LOW') {
                        inputBorder = 'border-rose-600 bg-rose-100 text-rose-950 font-black animate-pulse';
                      }

                      return (
                        <tr
                          key={test.code}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                          }`}
                        >
                          {/* Investigation Name & Method */}
                          <td className="py-2.5 px-4 align-middle">
                            <div className="font-black text-slate-900 text-xs font-sans">
                              {test.name}
                            </div>
                            <div className="text-[10.5px] text-slate-500 font-sans flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-rose-900">{test.code}</span>
                              <span>•</span>
                              <span>{test.method || test.scientificName}</span>
                            </div>
                            {/* Clue if abnormal */}
                            {val && (flag === 'HIGH' || flag === 'LOW' || flag === 'PANIC_HIGH' || flag === 'PANIC_LOW') && (
                              <div className="text-[10px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
                                <span>💡 Flagged abnormal ({flag})</span>
                              </div>
                            )}
                          </td>

                          {/* Result Input Field */}
                          <td className="py-2.5 px-3 align-middle text-center">
                            {test.options && test.options.length > 0 ? (
                              <select
                                value={val}
                                onChange={(e) => onResultChange(test.code, e.target.value)}
                                className={`w-full text-xs font-bold p-2 rounded-lg border focus:outline-none focus:ring-1 ${inputBorder}`}
                              >
                                <option value="">Select Result...</option>
                                {test.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => onResultChange(test.code, e.target.value)}
                                placeholder="Enter..."
                                className={`w-full text-center text-xs font-mono font-bold p-2 rounded-lg border focus:outline-none focus:ring-1 transition-all ${inputBorder}`}
                              />
                            )}
                          </td>

                          {/* Flag Badge */}
                          <td className="py-2.5 px-2.5 align-middle text-center">
                            {val ? (
                              <span
                                className={`inline-block text-[10px] px-2.5 py-1 rounded-md border uppercase font-bold tracking-wider ${flagInfo.badgeClass}`}
                              >
                                {flagInfo.icon} {flag}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">-</span>
                            )}
                          </td>

                          {/* Unit */}
                          <td className="py-2.5 px-2 align-middle text-center font-mono text-slate-700 text-xs">
                            {test.unit || '-'}
                          </td>

                          {/* Reference Interval */}
                          <td className="py-2.5 px-3.5 align-middle font-mono text-slate-700 text-xs whitespace-pre-line">
                            {refText}
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-2 align-middle text-center">
                            <button
                              onClick={() => onRemoveTest(test.code)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف هذا التحليل من الفحص"
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

              {/* Profile Bottom Section: Comments & Interpretation + Recommended Follow-up */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-200 space-y-4" dir="ltr">
                {/* 1. Comments and Interpretation Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-rose-800" />
                      <span className="text-xs font-black text-rose-950 uppercase tracking-wide">
                        PROFILE COMMENTS &amp; CLINICAL INTERPRETATION
                      </span>
                    </div>
                    <button
                      onClick={() => handleGenerateProfileCds(prof.code, prof.tests)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                      title="تحليل ذكي لنتائج هذا البروفايل وتوليد التفسير الإكلينيكي فوراً"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                      <span>✨ Auto-Generate CDS Interpretation</span>
                    </button>
                  </div>

                  {/* Diagnostic Phrases Pills (Quick 1-click Injection) */}
                  {profilePhrases.length > 0 && (
                    <div className="mb-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10.5px] font-bold text-slate-700 block mb-1.5" dir="rtl">
                        💡 عبارات استرشادية معتمدة لهذا البروفايل (انقر للإدراج الفوري):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profilePhrases.map((phrase) => (
                          <button
                            key={phrase.id}
                            onClick={() => {
                              if (onUpdateProfileComment) {
                                onUpdateProfileComment(prof.code, phrase.statement);
                              }
                              if (phrase.suggestedTestCodes && phrase.suggestedTestCodes.length > 0 && onUpdateProfileRecommendedTests) {
                                const current = profileRecommendedTests[prof.code] || [];
                                const merged = Array.from(new Set([...current, ...phrase.suggestedTestCodes]));
                                onUpdateProfileRecommendedTests(prof.code, merged);
                              }
                            }}
                            className="text-[11px] bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-900 border border-slate-300 hover:border-rose-400 px-2.5 py-1 rounded-md transition-all text-left shadow-2xs cursor-pointer font-sans"
                            title={phrase.statement}
                          >
                            + {phrase.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comment Text Area */}
                  <textarea
                    value={profileComment}
                    onChange={(e) =>
                      onUpdateProfileComment && onUpdateProfileComment(prof.code, e.target.value)
                    }
                    placeholder="Enter clinical pathology comments, differential diagnosis interpretation, and diagnostic correlation for this profile..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-sans focus:outline-none focus:ring-1 focus:ring-rose-800 bg-white"
                  />
                </div>

                {/* 2. Recommended Follow-up Tests Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-800" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        RECOMMENDED FOLLOW-UP TESTS (CLINICAL DECISION SUPPORT)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-sans" dir="rtl">
                      الفحوصات المقترحة للمتابعة في التقرير
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                    Select recommended follow-up tests to print on the official report or click to immediately add them to patient active investigations:
                  </p>

                  {/* Recommended Test Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bank of standard suggestions for this profile */}
                    {Array.from(
                      new Set([
                        ...recommendedTests,
                        ...cdsInsight.recommendedFollowUpTests,
                        ...(prof.code === 'CBC'
                          ? ['FERRITIN', 'IRON', 'TIBC', 'STOOL_OB', 'HB_ELECT', 'CRP_QUANT']
                          : prof.code === 'LFT'
                          ? ['HBSAG', 'HCV_AB', 'GGT', 'US_ABD', 'FIB4', 'LIPID']
                          : prof.code === 'KFT'
                          ? ['MICROALB', 'URINE_PCR', 'US_RENAL', 'K', 'NA']
                          : prof.code === 'LIPID'
                          ? ['HBA1C', 'ALT', 'TSH', 'APO_B', 'HS_CRP']
                          : prof.code === 'TFT'
                          ? ['ANTI_TPO', 'ANTI_TG', 'US_THYROID', 'FREE_T3']
                          : ['CRP_QUANT', 'ESR', 'CBC']),
                      ])
                    ).map((abbr) => {
                      const isSelected = recommendedTests.includes(abbr);
                      const isAlreadyInEncounter = selectedTestCodes.includes(abbr);

                      return (
                        <div
                          key={abbr}
                          className={`inline-flex items-center rounded-lg border text-xs font-mono font-bold transition-all shadow-2xs ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {/* Toggle inclusion on report */}
                          <button
                            onClick={() => handleToggleRecommended(prof.code, abbr)}
                            className="px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                            title={isSelected ? 'Remove from report' : 'Include on report'}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{abbr}</span>
                          </button>

                          {/* Add to encounter button if catalog has this test and not added yet */}
                          {onAddTestToEncounter && !isAlreadyInEncounter && catalogMap.has(abbr) && (
                            <button
                              onClick={() => onAddTestToEncounter(abbr)}
                              className="px-2 py-1 border-l border-slate-300 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer text-[10px]"
                              title={`Add ${abbr} directly to this patient encounter`}
                            >
                              + Add to Patient
                            </button>
                          )}
                          {isAlreadyInEncounter && (
                            <span className="px-1.5 py-1 border-l border-slate-300 text-[9.5px] text-emerald-400 font-sans">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom abbreviation input */}
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="+ Custom test code"
                        value={customTestInput[prof.code] || ''}
                        onChange={(e) =>
                          setCustomTestInput({ ...customTestInput, [prof.code]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCustomTest(prof.code);
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900 w-36"
                      />
                      <button
                        onClick={() => handleAddCustomTest(prof.code)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      {/* Bottom Navigation for Tabbed mode */}
      {viewMode === 'tabbed' && profilesData.length > 1 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              const curIdx = profilesData.findIndex((p) => p.code === activeProfileTab);
              if (curIdx > 0) setActiveProfileTab(profilesData[curIdx - 1].code);
            }}
            disabled={profilesData.findIndex((p) => p.code === activeProfileTab) === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>البروفايل السابق</span>
          </button>

          <span className="text-xs text-slate-500 font-bold">
            {profilesData.findIndex((p) => p.code === activeProfileTab) + 1} من {profilesData.length} بروفايلات
          </span>

          <button
            onClick={() => {
              const curIdx = profilesData.findIndex((p) => p.code === activeProfileTab);
              if (curIdx < profilesData.length - 1) setActiveProfileTab(profilesData[curIdx + 1].code);
            }}
            disabled={
              profilesData.findIndex((p) => p.code === activeProfileTab) === profilesData.length - 1
            }
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <span>البروفايل التالي</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
