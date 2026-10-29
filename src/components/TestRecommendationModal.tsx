import React, { useState } from 'react';
import { Lightbulb, Plus, Check, Sparkles, Search, Stethoscope, ArrowRight } from 'lucide-react';
import { TestCatalogItem } from '../types/lab';

interface TestRecommendationModalProps {
  onAddTests: (codes: string[]) => void;
  selectedTestCodes: string[];
  catalogMap: Map<string, TestCatalogItem>;
  patientAge: number;
  patientGender: string;
}

interface PresetRecommendation {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  recommendedCodes: string[];
  rationaleAr: string;
}

const PRESET_CLINICAL_CASES: PresetRecommendation[] = [
  {
    id: 'fatigue',
    titleAr: 'إرهاق مزمن وخمول وشحوب',
    titleEn: 'Chronic Fatigue & Pallor',
    icon: '😴',
    recommendedCodes: ['CBC', 'FERRITIN', 'IRON', 'TIBC', 'TSH', 'VIT_D', 'VIT_B12', 'ESR'],
    rationaleAr: 'استبعاد فقر الدم ونقص مخزون الحديد وخمول الغدة الدرقية ونقص فيتامين د وب12 كأسباب شائعة للإرهاق.',
  },
  {
    id: 'chest-pain',
    titleAr: 'ألم بالصدر وخفقان القلب والضغط',
    titleEn: 'Chest Pain, Palpitations & Hypertension',
    icon: '🫀',
    recommendedCodes: ['TROP_I', 'CK_MB', 'LIPID', 'KFT', 'NA', 'K', 'CRP_QUANT', 'CBC'],
    rationaleAr: 'استبعاد الإجهاد القلبي والجلطات بتقنية hs-Troponin I وفحص دهون الدم ووظائف الكلى والأملاح.',
  },
  {
    id: 'metabolic-diabetes',
    titleAr: 'العطش المستمر وكثرة التبول والوزن',
    titleEn: 'Polyuria, Polydipsia & Metabolic Screen',
    icon: '🩺',
    recommendedCodes: ['FBG', 'PP2H_GLU', 'HBA1C', 'INSULIN', 'HOMA_IR', 'LIPID', 'URINE_GLU', 'URINE_PROT', 'CREAT'],
    rationaleAr: 'تشخيص داء السكري ومقاومة الإنسولين HOMA-IR ومتابعة زلال البول ووظائف الكلى.',
  },
  {
    id: 'jaundice-liver',
    titleAr: 'صفراء، خمول، وتغير لون البول والبراز',
    titleEn: 'Jaundice & Hepatobiliary Screen',
    icon: '🟡',
    recommendedCodes: ['ALT', 'AST', 'ALP', 'TBIL', 'DBIL', 'GGT', 'TP', 'ALB', 'PT', 'INR', 'URINE_BIL'],
    rationaleAr: 'فحص وظائف الكبد ومسار المرارة والصفراء وسيولة الدم للكشف عن التهابات الكبد أو الانسداد المراري.',
  },
  {
    id: 'kidney-urinary',
    titleAr: 'حرقان البول وتورم القدمين والخاصرة',
    titleEn: 'Renal, Dysuria & Edema Screen',
    icon: '💧',
    recommendedCodes: ['CREAT', 'UREA', 'EGFR', 'URIC', 'NA', 'K', 'URINE_PUS', 'URINE_RBC', 'URINE_PROT'],
    rationaleAr: 'فحص كفاءة الكلى والأملاح والترشيح الكبيبي وصديد وأملاح البول لاكتشاف التهابات المسالك والقصور الكلوي.',
  },
  {
    id: 'pre-op',
    titleAr: 'فحص ما قبل العمليات الجراحية',
    titleEn: 'Pre-Operative Clearance Panel',
    icon: '🏥',
    recommendedCodes: ['CBC', 'PT', 'INR', 'PTT', 'FBG', 'CREAT', 'ALT'],
    rationaleAr: 'تقييم شامل لسيولة الدم وخلايا الدم وسكر الدم ووظائف الكلى والكبد قبل التخدير والجراحة.',
  },
  {
    id: 'hairloss',
    titleAr: 'تساقط الشعر وهشاشة الأظافر للبنات',
    titleEn: 'Hair Fall & Dermatologic Workup',
    icon: '💇‍♀️',
    recommendedCodes: ['CBC', 'FERRITIN', 'TSH', 'VIT_D', 'VIT_B12', 'IRON'],
    rationaleAr: 'تحديد السبب الأكثر شيوعاً لتساقط الشعر من خلال مخزون الحديد والغدة الدرقية والفيتامينات الأساسية.',
  },
  {
    id: 'fever',
    titleAr: 'سخونية وحمى غير مفسرة',
    titleEn: 'Pyrexia of Unknown Origin (PUO)',
    icon: '🌡️',
    recommendedCodes: ['CBC', 'CRP_QUANT', 'ESR', 'URINE_PUS'],
    rationaleAr: 'تقييم مؤشرات الالتهاب الحادة وخلايا الدم البيضاء وفحص البول لتحديد مصدر العدوى.',
  },
];

export const TestRecommendationModal: React.FC<TestRecommendationModalProps> = ({
  onAddTests,
  selectedTestCodes,
  catalogMap,
  patientAge,
  patientGender,
}) => {
  const [customSymptom, setCustomSymptom] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<{
    recommendedTests: Array<{ name: string; code: string; reason: string; priority: string }>;
    clinicalPrecaution?: string;
  } | null>(null);

  const handleAskAI = async () => {
    if (!customSymptom.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: customSymptom,
          patientAge,
          patientGender,
        }),
      });
      const data = await res.json();
      if (data.recommendations) {
        setAiResults(data.recommendations);
      }
    } catch (err) {
      console.warn('AI recommend fallback:', err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950 text-white p-6 rounded-2xl shadow-xl border border-amber-800/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-900/60 border border-amber-500/60 flex items-center justify-center text-amber-300 shadow-inner">
            <Lightbulb className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">
              ترشيح التحاليل الذكي (LAB TEST RECOMMENDATION LIST)
            </h2>
            <p className="text-xs text-amber-200 mt-1">
              اختر الشكوى الطبية للمريض أو اكتب الأعراض للحصول على قائمة فورية بأهم التحاليل التشخيصية الموصى بها عالمياً مع إضافتها بنقرة واحدة.
            </p>
          </div>
        </div>

        {/* Custom prompt input */}
        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            placeholder="اكتب شكوى المريض أو التشخيص المشتبه (مثال: دوخة متكررة مع تنميل في الأطراف أو هبوط سكر)..."
            className="flex-1 bg-slate-950/70 border border-amber-600/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
          />
          <button
            onClick={handleAskAI}
            disabled={aiLoading || !customSymptom.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{aiLoading ? 'جاري التحليل...' : 'ترشيح بالذكاء الاصطناعي'}</span>
          </button>
        </div>
      </div>

      {/* AI Results if present */}
      {aiResults && (
        <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>نتائج ترشيح الذكاء الاصطناعي لحالة: "{customSymptom}"</span>
            </h3>
            <button
              onClick={() => onAddTests(aiResults.recommendedTests.map((t) => t.code))}
              className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة جميع التحاليل المقترحة ({aiResults.recommendedTests.length})</span>
            </button>
          </div>

          {aiResults.clinicalPrecaution && (
            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 font-medium">
              💡 {aiResults.clinicalPrecaution}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiResults.recommendedTests.map((t) => {
              const isSelected = selectedTestCodes.includes(t.code);
              return (
                <div
                  key={t.code}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                        {t.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{t.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{t.reason}</p>
                  </div>
                  <button
                    onClick={() => onAddTests([t.code])}
                    disabled={isSelected}
                    className={`shrink-0 p-1.5 rounded-lg text-xs font-bold ${
                      isSelected
                        ? 'bg-rose-800 text-white cursor-default'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Clinical Cases */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">
          القوالب الإكلينيكية الأكثر شيوعاً بالمعامل (Clinical Presentation Shortcuts):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_CLINICAL_CASES.map((preset) => {
            const allSelected = preset.recommendedCodes.every((c) => selectedTestCodes.includes(c));

            return (
              <div
                key={preset.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{preset.titleAr}</h4>
                        <span className="text-[10px] text-slate-500 font-sans" dir="ltr">
                          {preset.titleEn}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onAddTests(preset.recommendedCodes)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        allSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-900 hover:bg-rose-800 text-white shadow-sm'
                      }`}
                    >
                      {allSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تمت الإضافة ✓</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة التحاليل</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {preset.rationaleAr}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {preset.recommendedCodes.map((code) => {
                    const isAdded = selectedTestCodes.includes(code);
                    return (
                      <span
                        key={code}
                        className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
                          isAdded
                            ? 'bg-rose-800 text-white border-rose-900'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {code}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
