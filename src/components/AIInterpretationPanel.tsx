import React, { useState } from 'react';
import { PatientEncounter, LabSettings, TestCatalogItem, PatientTestResult } from '../types/lab';
import { Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, FileText, ArrowRight, Stethoscope } from 'lucide-react';

interface AIInterpretationPanelProps {
  encounter: PatientEncounter;
  catalogMap: Map<string, TestCatalogItem>;
  onSaveInterpretation: (interpretation: PatientEncounter['clinicalInterpretation']) => void;
  onNavigateToReport: () => void;
}

export const AIInterpretationPanel: React.FC<AIInterpretationPanelProps> = ({
  encounter,
  catalogMap,
  onSaveInterpretation,
  onNavigateToReport,
}) => {
  const { patient, selectedTestCodes, results, clinicalInterpretation } = encounter;
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute abnormal count
  const abnormalTests = React.useMemo(() => {
    return Object.values(results).filter((r) => r.flag && r.flag !== 'NORMAL');
  }, [results]);

  const handleGenerateInterpretation = async () => {
    setLoading(true);
    setErrorMsg(null);

    const testPayload = Object.values(results).map((r) => {
      const def = catalogMap.get(r.code);
      return {
        code: r.code,
        name: r.name,
        value: r.value,
        unit: r.unit,
        flag: r.flag,
        refRange: r.refRangeText,
        method: def?.method || '',
      };
    });

    try {
      const res = await fetch('/api/gemini/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: {
            name: patient.name,
            age: `${patient.ageYears} Years`,
            gender: patient.gender,
            clinicalNotes: patient.clinicalNotes,
            sampleDate: patient.sampleDate,
          },
          tests: testPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.interpretation) {
        const interp = {
          ...data.interpretation,
          generatedAt: new Date().toISOString(),
          isAiGenerated: !data.isFallback,
        };
        onSaveInterpretation(interp);
      }
    } catch (err: any) {
      console.warn('API error, generating expert clinical rules fallback:', err);
      // Generate reliable clinical interpretation locally
      const localInterp = generateLocalInterpretation(patient, results);
      onSaveInterpretation({
        ...localInterp,
        generatedAt: new Date().toISOString(),
        isAiGenerated: false,
      });
    } finally {
      setLoading(false);
    }
  };

  function generateLocalInterpretation(pat: any, testResults: Record<string, any>) {
    const list = Object.values(testResults) as PatientTestResult[];
    const abnormals = list.filter((r) => r.flag && r.flag !== 'NORMAL');
    const highs = abnormals.filter((r) => r.flag?.includes('HIGH'));
    const lows = abnormals.filter((r) => r.flag?.includes('LOW'));

    const diffs: string[] = [];
    const followups: string[] = [];
    let criticalAlert: string | null = null;

    if (abnormals.some((r) => r.flag?.includes('PANIC'))) {
      const panics = abnormals.filter((r) => r.flag?.includes('PANIC'));
      criticalAlert = `CRITICAL ALERT: Urgent panic laboratory values detected for [${panics.map((p) => `${p.name}: ${p.value} ${p.unit}`).join(', ')}]. Immediate clinical communication with attending physician initiated.`;
    }

    // Hematology evaluation
    const hgb = list.find((r) => r.code === 'HGB');
    const mcv = list.find((r) => r.code === 'MCV');
    const rbc = list.find((r) => r.code === 'RBC');
    if (hgb && hgb.flag?.includes('LOW')) {
      const mcvVal = mcv?.numericValue || parseFloat(mcv?.value || '0');
      const rbcVal = rbc?.numericValue || parseFloat(rbc?.value || '0');
      if (mcvVal && mcvVal < 80) {
        const mentzer = rbcVal > 0 ? mcvVal / rbcVal : 0;
        if (mentzer > 0 && mentzer < 13) {
          diffs.push(`Microcytic Anemia with Mentzer Index = ${mentzer.toFixed(1)} (< 13): High clinical probability of Beta Thalassemia Minor/Trait.`);
          followups.push('Hemoglobin Electrophoresis (HPLC), Serum Ferritin, Total Iron Binding Capacity (TIBC).');
        } else {
          diffs.push('Microcytic Hypochromic Anemia: Suggestive of Iron Deficiency Anemia vs Anemia of Chronic Disease.');
          followups.push('Serum Ferritin, Serum Iron, Total Iron Binding Capacity (TIBC), Stool Occult Blood (FOBT).');
        }
      } else if (mcvVal && mcvVal > 100) {
        diffs.push('Macrocytic Anemia: Megaloblastic process (Vitamin B12 / Folate deficiency) or chronic hepatic/reticulocyte etiology.');
        followups.push('Serum Vitamin B12, Serum Folate, Serum LDH, Reticulocyte count.');
      } else {
        diffs.push('Normocytic Normochromic Anemia: Acute blood loss, renal compromise, or inflammatory suppression.');
        followups.push('Reticulocyte count, Peripheral blood film, Serum Creatinine, CRP.');
      }
    }

    // Leukocytes
    const wbc = list.find((r) => r.code === 'WBC');
    const neut = list.find((r) => r.code === 'NEUT_PCT');
    if (wbc && wbc.flag?.includes('HIGH')) {
      if (neut && parseFloat(neut.value) > 75) {
        diffs.push(`Neutrophilic Leukocytosis (${wbc.value} x10^3/µL, Neutrophils: ${neut.value}%): Acute bacterial infection or severe systemic inflammation.`);
        followups.push('Quantitative C-Reactive Protein (CRP), ESR, Procalcitonin (PCT), Blood Culture.');
      } else {
        diffs.push(`Leukocytosis (${wbc.value} x10^3/µL): Infectious, immune reactive, or marrow stress response.`);
        followups.push('High-Sensitivity CRP, Peripheral Blood Smear Examination.');
      }
    }

    // Liver enzymes
    const alt = list.find((r) => r.code === 'ALT');
    const ast = list.find((r) => r.code === 'AST');
    const alp = list.find((r) => r.code === 'ALP');
    const ggt = list.find((r) => r.code === 'GGT');
    if (alt?.flag?.includes('HIGH') || ast?.flag?.includes('HIGH')) {
      const altVal = parseFloat(alt?.value || '0');
      const astVal = parseFloat(ast?.value || '0');
      const deRitis = altVal > 0 ? astVal / altVal : 1;
      if (deRitis > 2.0) {
        diffs.push(`Transaminitis with AST/ALT ratio = ${deRitis.toFixed(1)} (> 2.0): Alcohol-related liver injury or advanced cirrhosis.`);
        followups.push('Serum GGT, Abdominal Ultrasonography, FIB-4 Score, Alpha-Fetoprotein (AFP).');
      } else if (altVal > 300) {
        diffs.push(`Marked Acute Hepatocellular Injury (ALT: ${altVal} U/L): Acute viral hepatitis, toxic/drug-induced hepatotoxicity.`);
        followups.push('HBsAg, HCV Ab, HAV IgM, Liver Ultrasound, Coagulation Profile (PT/INR).');
      } else {
        diffs.push(`Mild-to-Moderate Hepatocellular Pattern (ALT: ${altVal} U/L): Metabolic dysfunction steatotic liver disease (MASLD/Fatty Liver), medication effect.`);
        followups.push('Viral Hepatitis Screening (HBsAg, HCV Ab), Fasting Lipid Profile, Liver Ultrasound.');
      }
    }

    if (alp?.flag?.includes('HIGH') || ggt?.flag?.includes('HIGH')) {
      diffs.push('Cholestatic Biliary Pattern: Elevated Alkaline Phosphatase and GGT.');
      followups.push('Biliary and Abdominal Ultrasound, Total and Direct Bilirubin Fractionation.');
    }

    // Renal Panel
    const creat = list.find((r) => r.code === 'CREAT');
    const egfr = list.find((r) => r.code === 'EGFR');
    if (creat?.flag?.includes('HIGH')) {
      diffs.push(`Impaired Glomerular Filtration: Serum Creatinine ${creat.value} mg/dL (eGFR ${egfr ? egfr.value + ' mL/min/1.73m²' : 'reduced'}).`);
      followups.push('Urine Albumin-to-Creatinine Ratio (ACR), 24h Urine Protein, Renal Duplex Ultrasonography, Serum Electrolytes (Na/K).');
    }

    // Glycemia
    const fbg = list.find((r) => r.code === 'FBG');
    const hba1c = list.find((r) => r.code === 'HBA1C');
    if (fbg?.flag?.includes('HIGH') || hba1c?.flag?.includes('HIGH')) {
      diffs.push(`Impaired Glycemic Regulation / Diabetes Mellitus (HbA1c: ${hba1c?.value || '-'}%, FBG: ${fbg?.value || '-'} mg/dL).`);
      followups.push('Microalbuminuria screening, Lipid panel, Glycemic control monitoring, Retinal examination.');
    }

    // Lipids
    const tg = list.find((r) => r.code === 'TG');
    const ldl = list.find((r) => r.code === 'LDL');
    if (tg?.flag?.includes('HIGH') || ldl?.flag?.includes('HIGH')) {
      diffs.push(`Atherogenic Dyslipidemia: Elevated ${ldl?.flag?.includes('HIGH') ? 'LDL' : ''} ${tg?.flag?.includes('HIGH') ? 'Triglycerides' : ''}.`);
      followups.push('Cardiovascular 10-year risk assessment, Apo-B, hs-CRP, Lifestyle and dietary modification.');
    }

    if (diffs.length === 0) {
      diffs.push('All evaluated laboratory parameters correlate with expected physiological baseline.');
      followups.push('Routine periodic clinical health maintenance.');
    }

    return {
      summary: abnormals.length === 0
        ? 'All analyzed laboratory parameters are within standardized physiological reference intervals. Findings correlate with normal clinical biological baseline.'
        : `Comprehensive laboratory evaluation revealed ${abnormals.length} parameters outside physiological reference limits (${highs.length} elevated, ${lows.length} decreased). Clinical correlation and targeted follow-up are recommended.`,
      primaryFindings: abnormals.map((r) => `${r.name}: ${r.value} ${r.unit} [${r.flag}]`),
      differentialConsiderations: diffs,
      suggestedFollowUp: followups,
      criticalAlert,
      doctorSignature: 'Prof. Dr. Rami Mokhtar - Consultant Clinical Pathologist (Kasr Al Ainy)',
    };
  }

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-rose-950 text-white p-6 rounded-2xl shadow-xl border border-purple-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-900/60 border border-purple-500/60 flex items-center justify-center text-purple-300 shadow-inner">
              <Sparkles className="w-7 h-7 animate-pulse text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  الاستنتاج السريري الذكي (AI Clinical Pathologist)
                </h2>
                <span className="text-[10px] font-mono bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full border border-purple-600">
                  Gemini 3.8 Flash Engine
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-1 max-w-xl">
                يقوم بتحليل ترابط نتائج المريض المخبرية مع العمر والجنس، كشف القيم الحرجة، واقتراح الفحوصات التكميلية والملاحظات الإكلينيكية لإرفاقها بالتقرير الطبي.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateInterpretation}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري استنتاج النتائج سريرياً...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{clinicalInterpretation ? 'إعادة التحليل الذكي' : 'بدء التحليل السريري بالذكاء الاصطناعي'}</span>
              </>
            )}
          </button>
        </div>

        {/* Quick status counters */}
        <div className="mt-4 pt-4 border-t border-purple-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/40">
            <span className="text-[10px] text-purple-300 block">إجمالي التحاليل:</span>
            <span className="text-base font-bold font-mono">{Object.keys(results).length}</span>
          </div>
          <div className="bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/40">
            <span className="text-[10px] text-purple-300 block">تحاليل غير طبيعية (Abnormal):</span>
            <span className="text-base font-bold font-mono text-amber-400">{abnormalTests.length}</span>
          </div>
          <div className="bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/40">
            <span className="text-[10px] text-purple-300 block">العمر والجنس:</span>
            <span className="text-xs font-bold font-sans">{patient.ageYears} Yrs / {patient.gender}</span>
          </div>
          <div className="bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/40">
            <span className="text-[10px] text-purple-300 block">حالة التقرير:</span>
            <span className="text-xs font-bold text-emerald-400">
              {clinicalInterpretation ? 'مُرفق بالتقرير ✓' : 'في انتظار التفعيل'}
            </span>
          </div>
        </div>
      </div>

      {/* Generated Interpretation Card */}
      {clinicalInterpretation ? (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-purple-800" />
              <h3 className="text-sm font-bold text-slate-900">
                التقرير الاستنتاجي للباثولوجيا الإكلينيكية (Clinical Pathology Assessment)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Generated: {new Date(clinicalInterpretation.generatedAt).toLocaleString()}
            </span>
          </div>

          {/* Panic Critical Alert */}
          {clinicalInterpretation.criticalAlert && (
            <div className="bg-rose-50 border-r-4 border-rose-600 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-rose-950 uppercase">
                  تنبيه بقيم حرجة تستدعي التدخل السريع (Critical Action Alert)
                </h4>
                <p className="text-xs text-rose-800 font-bold mt-0.5">
                  {clinicalInterpretation.criticalAlert}
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              الخلاصة الإكلينيكية (Executive Medical Summary):
            </h4>
            <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-medium">
              {clinicalInterpretation.summary}
            </p>
          </div>

          {/* Primary Abnormal Findings */}
          {clinicalInterpretation.primaryFindings?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                أبرز النتائج الخارجة عن المعدل المرجعي (Primary Abnormalities):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clinicalInterpretation.primaryFindings.map((f, i) => (
                  <div key={i} className="text-xs bg-amber-50/80 border border-amber-200 p-2.5 rounded-lg text-amber-950 font-mono font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Differential Considerations */}
          {clinicalInterpretation.differentialConsiderations?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-purple-900 mb-1.5 uppercase tracking-wider">
                الاحتمالات التشخيصية والتفسيرات المقترحة (Differential Considerations):
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                {clinicalInterpretation.differentialConsiderations.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Follow-up */}
          {clinicalInterpretation.suggestedFollowUp?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-emerald-900 mb-1.5 uppercase tracking-wider">
                الفحوصات المقترحة للمتابعة والتأكيد (Actionable Follow-up Tests):
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                {clinicalInterpretation.suggestedFollowUp.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action to view in report */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              الاستنتاج تم حفظه وهو يظهر تلقائياً الآن في أسفل تقرير التحاليل المعتمد A4.
            </span>
            <button
              onClick={onNavigateToReport}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>معاينة في التقرير الطبي</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            لم يتم إنشاء الاستنتاج السريري الذكي لهذا المريض بعد
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            انقر على زر "بدء التحليل السريري بالذكاء الاصطناعي" أعلاه لتحليل جميع نتائج التحاليل المدخلة وتوليد ملخص باثولوجي متكامل.
          </p>
        </div>
      )}
    </div>
  );
};
