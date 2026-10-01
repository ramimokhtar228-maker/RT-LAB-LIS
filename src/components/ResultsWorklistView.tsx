import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Search,
  CheckCircle2,
  Printer,
  Sparkles,
  Save,
  Check,
  Stethoscope,
  Clock,
  ChevronRight,
  TestTube,
  Calculator,
} from 'lucide-react';
import { LabOrder, TestDefinition, ParameterResult, OrderTestResult, ResultFlag } from '../types/lab';
import { evaluateParameterResult } from '../services/storage';
import { runClinicalCalculations, getCalculationCapabilitiesForTest } from '../services/clinicalCalculations';

interface ResultsWorklistViewProps {
  orders: LabOrder[];
  testsCatalog: TestDefinition[];
  onUpdateOrder: (updatedOrder: LabOrder) => void;
  onOpenReport: (order: LabOrder) => void;
  selectedOrderId?: string;
}

export const ResultsWorklistView: React.FC<ResultsWorklistViewProps> = ({
  orders,
  testsCatalog,
  onUpdateOrder,
  onOpenReport,
  selectedOrderId,
}) => {
  const [activeOrderId, setActiveOrderId] = useState<string>(
    selectedOrderId || orders[0]?.id || ''
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Currently loaded order for result entry
  const selectedOrder = orders.find((o) => o.id === activeOrderId) || orders[0];

  // In-progress edit state for current order
  const [activeTestIndex, setActiveTestIndex] = useState<number>(0);
  const [currentResults, setCurrentResults] = useState<{ [paramId: string]: string }>({});
  const [interpretation, setInterpretation] = useState<string>('');
  const [technicianNotes, setTechnicianNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [calculationNotice, setCalculationNotice] = useState<string | null>(null);

  // Sync edit state whenever selectedOrder or activeTestIndex changes
  useEffect(() => {
    if (!selectedOrder) return;
    const test = selectedOrder.tests[activeTestIndex] || selectedOrder.tests[0];
    if (!test) return;

    const initialMap: { [paramId: string]: string } = {};
    test.results.forEach((r) => {
      initialMap[r.parameterId] = r.value;
    });

    // If empty results, initialize with catalog defaults if available
    const testDef = testsCatalog.find((t) => t.code === test.code || t.id === test.testId);
    if (testDef && test.results.length === 0) {
      testDef.parameters.forEach((p) => {
        initialMap[p.id] = '';
      });
    }

    setCurrentResults(initialMap);
    setInterpretation(test.interpretation || '');
    setTechnicianNotes(test.technicianNotes || '');
  }, [activeOrderId, activeTestIndex, selectedOrder, testsCatalog]);

  if (!selectedOrder) {
    return (
      <div className="p-8 text-center text-slate-500">
        لا توجد طلبات تحليل مسجلة حالياً
      </div>
    );
  }

  const currentTest = selectedOrder.tests[activeTestIndex] || selectedOrder.tests[0];
  const testDef = testsCatalog.find(
    (t) => t.code === currentTest?.code || t.id === currentTest?.testId
  );

  // Filter orders list
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.patient.name.includes(searchQuery) ||
      o.orderNumber.includes(searchQuery) ||
      o.sampleBarcode.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterStatus === 'pending') {
      return o.orderStatus === 'sampling' || o.orderStatus === 'processing';
    }
    if (filterStatus === 'ready') {
      return o.orderStatus === 'ready';
    }
    if (filterStatus === 'stat') {
      return o.urgency === 'stat';
    }
    return true;
  });

  // Auto-fill baseline normal values
  const handleAutoFillNormals = () => {
    if (!testDef) return;
    const newMap: { [paramId: string]: string } = {};
    testDef.parameters.forEach((p) => {
      newMap[p.id] = p.defaultValue !== undefined ? String(p.defaultValue) : '';
    });

    // Run clinical calculations
    const calcResult = runClinicalCalculations(
      newMap,
      {
        gender: selectedOrder.patient.gender,
        age: selectedOrder.patient.age,
      },
      testDef.code
    );

    setCurrentResults(calcResult.updatedMap);
    if (calcResult.messages.length > 0) {
      setCalculationNotice(calcResult.messages.join(' · '));
    }
  };

  // Live change handler with automated clinical calculations
  const handleParamValueChange = (paramId: string, paramCode: string, newVal: string) => {
    // Collect all parameters from current test + other tests in the order (cross-test calculations)
    const combinedMap: { [key: string]: string } = { ...currentResults, [paramId]: newVal, [paramCode]: newVal };

    selectedOrder.tests.forEach((t) => {
      t.results.forEach((r) => {
        if (!combinedMap[r.code]) combinedMap[r.code] = r.value;
        if (!combinedMap[r.parameterId]) combinedMap[r.parameterId] = r.value;
      });
    });

    // Run automated medical equations (CBC indices, Friedewald LDL, ADAG eAG, HOMA-IR, ACR, LFT, eGFR)
    const calc = runClinicalCalculations(
      combinedMap,
      {
        gender: selectedOrder.patient.gender,
        age: selectedOrder.patient.age,
      },
      testDef?.code
    );

    // Keep current test parameter mappings up to date
    const updatedTestResults: { [paramId: string]: string } = { ...currentResults, [paramId]: newVal };
    if (testDef) {
      testDef.parameters.forEach((p) => {
        if (calc.updatedMap[p.id]) updatedTestResults[p.id] = calc.updatedMap[p.id];
        if (calc.updatedMap[p.code]) updatedTestResults[p.id] = calc.updatedMap[p.code];
      });
    }

    setCurrentResults(updatedTestResults);
    if (calc.messages.length > 0) {
      setCalculationNotice(calc.messages.join(' · '));
    }
  };

  // Manual trigger for clinical calculations
  const handleTriggerCalculations = () => {
    if (!testDef) return;
    const combinedMap: { [key: string]: string } = { ...currentResults };

    selectedOrder.tests.forEach((t) => {
      t.results.forEach((r) => {
        if (!combinedMap[r.code]) combinedMap[r.code] = r.value;
        if (!combinedMap[r.parameterId]) combinedMap[r.parameterId] = r.value;
      });
    });

    const calc = runClinicalCalculations(
      combinedMap,
      {
        gender: selectedOrder.patient.gender,
        age: selectedOrder.patient.age,
      },
      testDef.code
    );

    const updatedTestResults: { [paramId: string]: string } = { ...currentResults };
    testDef.parameters.forEach((p) => {
      if (calc.updatedMap[p.id]) updatedTestResults[p.id] = calc.updatedMap[p.id];
      if (calc.updatedMap[p.code]) updatedTestResults[p.id] = calc.updatedMap[p.code];
    });

    setCurrentResults(updatedTestResults);
    if (calc.messages.length > 0) {
      setCalculationNotice(calc.messages.join(' · '));
    } else {
      setCalculationNotice('تمت مراجعة وتأكيد كافة المعادلات والحسابات الإكلينيكية لهذا الفحص.');
    }
  };

  // Save current test results
  const handleSaveResults = (markVerified: boolean = false) => {
    if (!testDef || !currentTest) return;

    // Build parameter results
    const evaluatedParams: ParameterResult[] = testDef.parameters.map((param) => {
      const rawVal = currentResults[param.id] || '';
      const evalRes = evaluateParameterResult(
        param.code,
        rawVal,
        selectedOrder.patient.gender,
        testDef
      );

      return {
        parameterId: param.id,
        code: param.code,
        nameAr: param.nameAr,
        nameEn: param.nameEn,
        value: rawVal,
        unit: param.unit,
        refText: evalRes.refText,
        flag: evalRes.flag,
      };
    });

    const updatedTests: OrderTestResult[] = selectedOrder.tests.map((t, idx) => {
      if (idx !== activeTestIndex) return t;
      return {
        ...t,
        status: markVerified ? 'verified' : 'completed',
        results: evaluatedParams,
        interpretation,
        technicianNotes,
        completedAt: new Date().toISOString(),
      };
    });

    const allVerified = updatedTests.every((t) => t.status === 'verified');
    const anyInProcess = updatedTests.some((t) => t.status === 'processing' || t.status === 'completed');

    const updatedOrder: LabOrder = {
      ...selectedOrder,
      tests: updatedTests,
      orderStatus: allVerified ? 'ready' : anyInProcess ? 'processing' : selectedOrder.orderStatus,
      verifiedAt: allVerified ? new Date().toISOString() : selectedOrder.verifiedAt,
      verifiedBy: allVerified ? 'أ.د. يوسف رضوان (استشاري التحاليل الطبية)' : selectedOrder.verifiedBy,
    };

    onUpdateOrder(updatedOrder);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      {/* 1. Left List of Orders (Worklist Queue) */}
      <div className="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
        {/* Filters */}
        <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800">
              قائمة العمل المخبري (Worklist)
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredOrders.length} عينة
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث بالمريض، رقم العينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-2 pr-8 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-1 rounded font-medium whitespace-nowrap transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2 py-1 rounded font-medium whitespace-nowrap transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              قيد الفحص
            </button>
            <button
              onClick={() => setFilterStatus('ready')}
              className={`px-2 py-1 rounded font-medium whitespace-nowrap transition-colors ${
                filterStatus === 'ready'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              معتمد
            </button>
            <button
              onClick={() => setFilterStatus('stat')}
              className={`px-2 py-1 rounded font-medium whitespace-nowrap transition-colors ${
                filterStatus === 'stat'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🚨 STAT
            </button>
          </div>
        </div>

        {/* Orders Queue */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredOrders.map((ord) => {
            const isSelected = ord.id === activeOrderId;
            const hasPanic = ord.tests.some((t) =>
              t.results.some((r) => r.flag === 'panic_high' || r.flag === 'panic_low')
            );
            const isVerified = ord.tests.every((t) => t.status === 'verified');

            return (
              <div
                key={ord.id}
                onClick={() => {
                  setActiveOrderId(ord.id);
                  setActiveTestIndex(0);
                }}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-50/80 border-r-4 border-r-teal-600'
                    : 'hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {ord.patient.name}
                  </div>
                  {ord.urgency === 'stat' && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1 py-0.2 rounded-xs animate-pulse">
                      STAT
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span>{ord.sampleBarcode}</span>
                  <span>·</span>
                  <span>{ord.patient.gender === 'male' ? 'ذكر' : 'أنثى'} ({ord.patient.age} س)</span>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-teal-800 font-semibold truncate max-w-[170px]">
                    {ord.tests.map((t) => t.code).join(' + ')}
                  </span>

                  {hasPanic ? (
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded">
                      قيمة حرجة!
                    </span>
                  ) : isVerified ? (
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> معتمد
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-amber-700 bg-amber-50 px-1 rounded">
                      قيد العمل
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Result Entry Worksheet */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Patient & Sample Banner */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {selectedOrder.patient.name}
              </h2>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {selectedOrder.sampleBarcode}
              </span>
              {selectedOrder.urgency === 'stat' && (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded animate-pulse">
                  حالة طوارئ عاجلة (STAT)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>النوع: {selectedOrder.patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
              <span>·</span>
              <span>العمر: {selectedOrder.patient.age} {selectedOrder.patient.ageUnit}</span>
              <span>·</span>
              <span>الطبيب: {selectedOrder.referringDoctor || 'غير محدد'}</span>
              <span>·</span>
              <span>الطلب: {selectedOrder.orderNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReport(selectedOrder)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة التقرير الرسمي المعتمد</span>
            </button>
          </div>
        </div>

        {/* Test Tabs Selector for this Order */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {selectedOrder.tests.map((t, idx) => {
            const isActive = idx === activeTestIndex;
            const isTestVerified = t.status === 'verified';
            return (
              <button
                key={t.testId}
                onClick={() => setActiveTestIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span>{t.nameAr}</span>
                <span className="font-mono text-[10px] opacity-80">({t.code})</span>
                {isTestVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
              </button>
            );
          })}
        </div>

        {/* Current Test Worksheet */}
        {testDef ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col space-y-4 p-5">
            {/* Action Bar inside test */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  فحص {testDef.nameAr} ({testDef.nameEn})
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  نوع العينة: {testDef.specimenType} · الأنبوبة: {testDef.tubeType}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerCalculations}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                  title="إعادة تطبيق المعادلات الطبية وحساب القيم المشتقة"
                >
                  <Calculator className="w-3.5 h-3.5 text-teal-700" />
                  <span>تطبيق الحسابات الآلية</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoFillNormals}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>تعبئة المعدلات الطبيعية</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveResults(false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ مسودة</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveResults(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وتوقيع النتيجة إلكترونياً</span>
                </button>
              </div>
            </div>

            {/* Clinical Calculation Info Alert */}
            {testDef && getCalculationCapabilitiesForTest(testDef.code).length > 0 && (
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-teal-950 font-bold">
                  <Calculator className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>المعادلات الإكلينيكية التلقائية مفعلة لهذا الفحص:</span>
                  <span className="text-[11px] font-semibold text-teal-800">
                    {getCalculationCapabilitiesForTest(testDef.code).join(' · ')}
                  </span>
                </div>
                <span className="text-[10px] bg-teal-200/60 text-teal-950 px-2 py-0.5 rounded font-mono font-bold">
                  Auto-Calc Active ⚡
                </span>
              </div>
            )}

            {calculationNotice && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{calculationNotice}</span>
                </div>
                <button
                  onClick={() => setCalculationNotice(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تم حفظ واعتماد نتائج الفحص بنجاح وتحديث ملف المريض!</span>
              </div>
            )}

            {/* Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 text-right">الفحص / الدلالة</th>
                    <th className="py-2.5 px-3 text-center w-36">النتيجة المقروءة</th>
                    <th className="py-2.5 px-3 text-center">الوحدة</th>
                    <th className="py-2.5 px-3 text-right">المعدل الطبيعي حسب العمر والنوع</th>
                    <th className="py-2.5 px-3 text-center">حالة النتيجة (Flag)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testDef.parameters.map((param) => {
                    const currentVal = currentResults[param.id] || '';
                    const evalResult = evaluateParameterResult(
                      param.code,
                      currentVal,
                      selectedOrder.patient.gender,
                      testDef
                    );

                    const isPanic = evalResult.flag === 'panic_high' || evalResult.flag === 'panic_low';
                    const isAbnormal = evalResult.flag === 'high' || evalResult.flag === 'low' || evalResult.flag === 'abnormal';

                    return (
                      <tr
                        key={param.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isPanic
                            ? 'bg-rose-50/70 font-semibold'
                            : isAbnormal
                            ? 'bg-amber-50/40'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{param.nameAr}</span>
                            {['HCT', 'MCV', 'MCH', 'MCHC', 'LDL', 'VLDL', 'CHOL/HDL', 'EAG', 'HOMA-IR', 'ACR', 'I-BIL', 'GLOB', 'A/G', 'EGFR', 'BUN/CREAT'].includes(param.code.toUpperCase()) && (
                              <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                <Calculator className="w-2.5 h-2.5" />
                                <span>معادلة</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">{param.nameEn} ({param.code})</div>
                        </td>

                        <td className="py-2 px-3 text-center">
                          {param.options ? (
                            <select
                              value={currentVal}
                              onChange={(e) =>
                                handleParamValueChange(param.id, param.code, e.target.value)
                              }
                              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-medium"
                            >
                              <option value="">-- اختر --</option>
                              {param.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) =>
                                handleParamValueChange(param.id, param.code, e.target.value)
                              }
                              placeholder="0.0"
                              className={`w-full text-xs p-1.5 border rounded text-center font-mono font-bold focus:outline-none focus:ring-2 ${
                                isPanic
                                  ? 'border-rose-400 bg-rose-50 text-rose-800 ring-rose-500/20'
                                  : isAbnormal
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 ring-amber-500/20'
                                  : 'border-slate-300 bg-white text-slate-900 ring-teal-500/20'
                              }`}
                            />
                          )}
                        </td>

                        <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                          {param.unit || '-'}
                        </td>

                        <td className="py-2 px-3 text-right font-mono text-slate-600 text-[11px]">
                          {evalResult.refText}
                        </td>

                        <td className="py-2 px-3 text-center">
                          {evalResult.flag === 'panic_high' && (
                            <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-sm">
                              PANIC HIGH ▲
                            </span>
                          )}
                          {evalResult.flag === 'panic_low' && (
                            <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-sm">
                              PANIC LOW ▼
                            </span>
                          )}
                          {evalResult.flag === 'high' && (
                            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm">
                              HIGH ▲
                            </span>
                          )}
                          {evalResult.flag === 'low' && (
                            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm">
                              LOW ▼
                            </span>
                          )}
                          {evalResult.flag === 'abnormal' && (
                            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm">
                              ABNORMAL
                            </span>
                          )}
                          {(evalResult.flag === 'normal' || evalResult.flag === 'normal_text') && currentVal && (
                            <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                              طبيعي
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pathologist Clinical Interpretation Box */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>التعليق والتشخيص المخبري للطبيب الاستشاري (Clinical Interpretation):</span>
              </label>
              <textarea
                rows={2}
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                placeholder="اكتب التفسير الطبي للقيم غير الطبيعية أو التوصيات الموجهة للطبيب المعالج..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            فحص غير معروف
          </div>
        )}
      </div>
    </div>
  );
};
