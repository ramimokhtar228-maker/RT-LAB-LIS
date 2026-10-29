import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: AI Clinical Interpretation for Lab Results
app.post('/api/gemini/interpret', async (req, res) => {
  try {
    const { patient, tests, abnormalOnly = false } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response if key is temporarily unavailable in environment
      return res.status(200).json({
        success: true,
        isFallback: true,
        source: 'clinical-rules-engine',
        interpretation: generateFallbackInterpretation(patient, tests),
      });
    }

    const testSummaries = tests
      .filter((t: any) => !abnormalOnly || t.flag !== 'NORMAL')
      .map((t: any) => `- ${t.name} (${t.code}): ${t.value} ${t.unit || ''} [Ref: ${t.refRange || 'N/A'}] Flag: ${t.flag || 'NORMAL'}`)
      .join('\n');

    const prompt = `You are a Senior Consultant Clinical Pathologist at "RT Lab Diagnostic Laboratories (معامل رامي مختار)".
Evaluate the following laboratory test findings for this patient and generate a professional, structured clinical laboratory interpretation in Arabic and English medical terminology.

Patient Details:
- Name: ${patient?.name || 'Anonymous'}
- Age: ${patient?.age || 'Unknown'} (${patient?.gender || 'Unknown'})
- Clinical Notes/Indication: ${patient?.clinicalNotes || 'Routine Investigation'}
- Sample Date: ${patient?.sampleDate || 'Current'}

Laboratory Test Results:
${testSummaries || 'No tests entered'}

Provide your response in JSON format with the following keys:
1. "summary": A concise clinical pathological executive summary of findings (in Arabic with medical terms in English).
2. "primaryFindings": Array of strings highlighting the main pathological abnormalities found.
3. "differentialConsiderations": Array of potential clinical etiologies or differential diagnoses based on these lab findings.
4. "suggestedFollowUp": Array of recommended follow-up or confirmatory tests / clinical correlation steps.
5. "criticalAlert": String with critical warning if any value is panic/critical, or null if within acceptable risk.
6. "doctorSignature": "Consultant Clinical Pathologist - RT Diagnostic Labs"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { summary: text, primaryFindings: [], differentialConsiderations: [], suggestedFollowUp: [] };
    }

    return res.status(200).json({
      success: true,
      interpretation: parsed,
    });
  } catch (error: any) {
    console.error('Gemini interpretation error:', error);
    // Graceful fallback to guarantee zero disruption for the pathologist
    const fallback = generateFallbackInterpretation(req.body.patient, req.body.tests);
    return res.status(200).json({
      success: true,
      isFallback: true,
      interpretation: fallback,
      errorNotice: error?.message,
    });
  }
});

// API: Smart Lab Test Recommendations
app.post('/api/gemini/recommend', async (req, res) => {
  try {
    const { symptoms, history, patientAge, patientGender } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: true,
        isFallback: true,
        recommendations: generateFallbackRecommendations(symptoms),
      });
    }

    const prompt = `You are an expert Clinical Laboratory Director at RT Labs.
A clinician or patient presents with the following symptoms and history:
Symptoms/Complaint: "${symptoms}"
Patient Age/Gender: ${patientAge || 'Adult'}, ${patientGender || 'Unspecified'}
Clinical History: "${history || 'None provided'}"

Recommend the most appropriate diagnostic laboratory tests, profiles, and packages from the standard international lab catalog (e.g. CBC, Lipid Profile, LFT, KFT, Thyroid TFT, HbA1c, Ferritin, Electrolytes, Vitamin D, etc.).
Return valid JSON with:
{
  "recommendedTests": [
    {"name": "Complete Blood Count", "code": "CBC", "reason": "Evaluates anemia, infection, platelets", "priority": "High"},
    ...
  ],
  "recommendedPackages": [
    {"name": "Fatigue & Anemia Panel", "rationale": "Comprehensive metabolic & hematologic screening"}
  ],
  "clinicalPrecaution": "Guidance on fasting or preparation"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.status(200).json({
      success: true,
      recommendations: parsed,
    });
  } catch (error: any) {
    console.error('Gemini recommend error:', error);
    return res.status(200).json({
      success: true,
      isFallback: true,
      recommendations: generateFallbackRecommendations(req.body.symptoms),
    });
  }
});

function generateFallbackInterpretation(patient: any, tests: any[]) {
  const abnormals = (tests || []).filter((t: any) => t.flag && t.flag !== 'NORMAL');
  const highs = abnormals.filter((t: any) => t.flag === 'HIGH' || t.flag === 'PANIC_HIGH');
  const lows = abnormals.filter((t: any) => t.flag === 'LOW' || t.flag === 'PANIC_LOW');

  const findings: string[] = [];
  const differentials: string[] = [];
  const followups: string[] = [];
  let criticalAlert: string | null = null;

  for (const t of abnormals) {
    findings.push(`${t.name} (${t.code}): ${t.value} ${t.unit || ''} (${t.flag})`);
    if (t.flag?.includes('PANIC')) {
      criticalAlert = `تنبيه فوري لقيم حرجة (Panic Value) في تحليل ${t.name}: ${t.value} ${t.unit}. يُرجى إبلاغ الطبيب المعالج على الفور.`;
    }
  }

  // Common clinical patterns
  const hasElevatedALT = abnormals.some((t: any) => t.code === 'ALT' && t.flag?.includes('HIGH'));
  const hasElevatedAST = abnormals.some((t: any) => t.code === 'AST' && t.flag?.includes('HIGH'));
  const hasLowHGB = abnormals.some((t: any) => (t.code === 'HGB' || t.code === 'HB') && t.flag?.includes('LOW'));
  const hasHighGlu = abnormals.some((t: any) => (t.code === 'FBG' || t.code === 'GLU' || t.code === 'HBA1C') && t.flag?.includes('HIGH'));
  const hasHighLipid = abnormals.some((t: any) => (t.code === 'CHOL' || t.code === 'TG' || t.code === 'LDL') && t.flag?.includes('HIGH'));
  const hasHighCreat = abnormals.some((t: any) => t.code === 'CREAT' && t.flag?.includes('HIGH'));

  if (hasElevatedALT || hasElevatedAST) {
    differentials.push('إصابة كبدية حادة أو مزمنة (Hepatocellular injury / Fatty liver disease / Viral hepatitis)');
    followups.push('متابعة إنزيمات الكبد، وفحص الفيروسات الكبدية HBsAg و HCV Ab، وأشعة تليفزيونية على البطن (Abdominal Ultrasound).');
  }

  if (hasLowHGB) {
    differentials.push('أنيميا (فقر دم) بحاجة لتحديد النوع (Iron deficiency anemia vs Thalassemia minor vs Anemia of chronic disease)');
    followups.push('إجراء فحص مخزون الحديد (Serum Ferritin), Serum Iron, TIBC, وفحص لطاخة الدم (Blood Film).');
  }

  if (hasHighGlu) {
    differentials.push('اضطراب استقلاب الجلوكوز / داء السكري غير المنضبط أو مقدمات السكري (Impaired Fasting Glucose / Diabetes Mellitus)');
    followups.push('متابعة تحليل السكر التراكمي HbA1c، سكر صائم وفاطر، واستشارة طبيب الغدد الصماء والسكر.');
  }

  if (hasHighLipid) {
    differentials.push('خلل دهون الدم (Dyslipidemia / Hypercholesterolemia / Hypertriglyceridemia) مع زيادة احتمالية مخاطر القلب والأوعية.');
    followups.push('حمية غذائية لتقليل الدهون المشبعة، ومراجعة الطبيب لتقييم الحاجة للعلاج بخافضات الدهون (Statins).');
  }

  if (hasHighCreat) {
    differentials.push('قصور كلوي محتمل (Impaired Renal Function / Acute or Chronic Kidney Disease)');
    followups.push('حساب معدل الترشيح الكبيبي eGFR، فحص زلال البول Microalbuminuria، ومراجعة أخصائي أمراض الكلى.');
  }

  if (differentials.length === 0 && abnormals.length > 0) {
    differentials.push('تغيرات مخبرية معزولة تستلزم الربط السريري بالأعراض والتاريخ الطبي للمريض.');
    followups.push('إعادة الفحص التأكيدي ومراجعة الطبيب المعالج.');
  }

  const summary = abnormals.length === 0
    ? 'جميع النتائج المخبرية المسجلة تقع ضمن الحدود الطبيعية المرجعية المعتمدة بمعامل RT للتحاليل التشخيصية.'
    : `أظهرت النتائج وجود ${abnormals.length} مؤشر خارج المعدل الطبيعي (${highs.length} مرتفع، ${lows.length} منخفض). يُرجى التدقيق السريري واستشارة الطبيب المعالج.`;

  return {
    summary,
    primaryFindings: findings,
    differentialConsiderations: differentials,
    suggestedFollowUp: followups,
    criticalAlert,
    doctorSignature: 'Consultant Clinical Pathologist - RT Diagnostic Labs',
  };
}

function generateFallbackRecommendations(symptoms: string = '') {
  const s = (symptoms || '').toLowerCase();
  const list = [];
  if (s.includes('fatigue') || s.includes('تعب') || s.includes('ارهاق') || s.includes('خمول')) {
    list.push({ name: 'Complete Blood Count', code: 'CBC', reason: 'نفي وجود فقر الدم ونقص كرات الدم', priority: 'High' });
    list.push({ name: 'Serum Ferritin', code: 'FERRITIN', reason: 'تقييم مخزون الحديد في الجسم', priority: 'High' });
    list.push({ name: 'Thyroid Stimulating Hormone', code: 'TSH', reason: 'استبعاد خمول الغدة الدرقية', priority: 'High' });
    list.push({ name: 'Vitamin D (25-OH)', code: 'VITD', reason: 'تقييم نقص فيتامين د الشائع المسبب للإرهاق', priority: 'Medium' });
  } else if (s.includes('chest') || s.includes('قلب') || s.includes('صدر') || s.includes('ضغط')) {
    list.push({ name: 'Lipid Profile', code: 'LIPID', reason: 'فحص الكوليسترول والدهون الثلاثية ومخاطر الشرايين', priority: 'High' });
    list.push({ name: 'hs-Troponin I', code: 'TROP-I', reason: 'استبعاد الإجهاد القلبي والجلطات الحادة', priority: 'Critical' });
    list.push({ name: 'Kidney Function Tests', code: 'KFT', reason: 'تقييم وظائف الكلى وضغط الدم', priority: 'High' });
  } else {
    list.push({ name: 'Complete Blood Count', code: 'CBC', reason: 'فحص شامل لخلايا الدم والصفائح والمناعة', priority: 'High' });
    list.push({ name: 'Liver Function Tests', code: 'LFT', reason: 'تقييم كفاءة وإنزيمات الكبد', priority: 'High' });
    list.push({ name: 'Kidney Function Tests', code: 'KFT', reason: 'متابعة وظائف الإخراج والكلى', priority: 'High' });
    list.push({ name: 'Fasting Blood Glucose', code: 'FBG', reason: 'فحص سكر الدم الصائم', priority: 'High' });
    list.push({ name: 'Lipid Profile', code: 'LIPID', reason: 'تقييم الدهون الثلاثية والكوليسترول', priority: 'Medium' });
  }

  return {
    recommendedTests: list,
    recommendedPackages: [
      { name: 'باقة الفحص البلاتيني الشامل RT Platinum', rationale: 'تقييم شامل لجميع أعضاء الجسم الحيوية' },
    ],
    clinicalPrecaution: 'يُفضل الصيام لمدة 10-12 ساعة مع شرب الماء العادي فقط قبل سحب عينات الدهون والسكر.',
  };
}

// Development with Vite vs Production static serving
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RT LAB LIS server running on http://0.0.0.0:${PORT}`);
});
