import React, { useState, useEffect, useMemo } from 'react';
import {
  PatientRecord,
  PatientEncounter,
  TestCatalogItem,
  ProfileCatalogItem,
  PackageCatalogItem,
  LabSettings,
  PatientTestResult,
} from './types/lab';
import {
  DEFAULT_LAB_SETTINGS,
  DEFAULT_TESTS,
  DEFAULT_PROFILES,
  DEFAULT_PACKAGES,
} from './data/defaultCatalog';
import { calculateLabResults, evaluateFlag, getReferenceRangeText } from './utils/calculations';
import { Header } from './components/Header';
import { ResultsEntryGrid } from './components/ResultsEntryGrid';
import { ReportViewer } from './components/ReportViewer';
import { InvoiceViewer } from './components/InvoiceViewer';
import { AIInterpretationPanel } from './components/AIInterpretationPanel';
import { TestRecommendationModal } from './components/TestRecommendationModal';
import { CatalogManager } from './components/CatalogManager';
import { PatientFormModal } from './components/PatientFormModal';
import { TestSelectionDrawer } from './components/TestSelectionDrawer';
import { SettingsModal } from './components/SettingsModal';
import { GitHubDeployModal } from './components/GitHubDeployModal';
import {
  User,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  FileText,
  Receipt,
  Trash2,
  Edit3,
  Layers,
  ChevronRight,
  Activity,
  AlertCircle
} from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'rt_lab_settings_v3';
const STORAGE_KEY_TESTS = 'rt_lab_tests_v3';
const STORAGE_KEY_PROFILES = 'rt_lab_profiles_v3';
const STORAGE_KEY_PACKAGES = 'rt_lab_packages_v3';
const STORAGE_KEY_ENCOUNTERS = 'rt_lab_encounters_v3';

export default function App() {
  // 1. Settings state
  const [settings, setSettings] = useState<LabSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_LAB_SETTINGS;
    } catch {
      return DEFAULT_LAB_SETTINGS;
    }
  });

  // 2. Catalogs state
  const [testsCatalog, setTestsCatalog] = useState<TestCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TESTS);
      return saved ? JSON.parse(saved) : DEFAULT_TESTS;
    } catch {
      return DEFAULT_TESTS;
    }
  });

  const [profilesCatalog, setProfilesCatalog] = useState<ProfileCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
    } catch {
      return DEFAULT_PROFILES;
    }
  });

  const [packagesCatalog, setPackagesCatalog] = useState<PackageCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PACKAGES);
      return saved ? JSON.parse(saved) : DEFAULT_PACKAGES;
    } catch {
      return DEFAULT_PACKAGES;
    }
  });

  // Catalog Map for O(1) lookups
  const catalogMap = useMemo(() => {
    const map = new Map<string, TestCatalogItem>();
    testsCatalog.forEach((t) => map.set(t.code, t));
    return map;
  }, [testsCatalog]);

  // 3. Encounters state with sample initial case
  const [encounters, setEncounters] = useState<PatientEncounter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENCOUNTERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }

    // Default sample encounter
    const samplePatient: PatientRecord = {
      id: 'pat-default-01',
      mrn: 'RT-2026-1048',
      barcode: 'RT-2026-1048',
      name: 'أحمد محمود سالم (Ahmed Mahmoud)',
      nationalId: '28911040101894',
      ageYears: 42,
      ageMonths: 0,
      gender: 'Male',
      phone: '0100 882 1940',
      email: 'ahmed.salem@example.com',
      referringDoctor: 'Dr. Tarek El-Kady (Consultant Internal Medicine)',
      sampleDate: new Date().toISOString().split('T')[0],
      sampleTime: '08:30',
      reportDate: new Date().toISOString().split('T')[0],
      reportTime: '14:00',
      sampleType: 'Venous Blood (EDTA & Serum SST)',
      fastingStatus: 'Fasting 12 Hours',
      clinicalNotes: 'Routine executive metabolic screen, mild fatigue, follow-up lipids.',
      createdAt: new Date().toISOString(),
    };

    const initialCodes = [
      'WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'PLT',
      'ALT', 'AST', 'ALP', 'TBIL', 'DBIL', 'IBIL', 'TP', 'ALB', 'GLOB', 'AG_RATIO',
      'CREAT', 'UREA', 'BUN', 'EGFR', 'URIC',
      'CHOL', 'TG', 'HDL', 'LDL', 'VLDL', 'NON_HDL', 'CHOL_HDL_RATIO',
      'FBG', 'HBA1C', 'EAG', 'TSH'
    ];

    const initialResults: Record<string, PatientTestResult> = {
      WBC: { code: 'WBC', name: 'Total Leukocyte Count (WBC)', value: '7.8', flag: 'NORMAL', unit: '10^3/µL', refRangeText: '4.0 - 11.0', method: 'Laser Flow Cytometry' },
      RBC: { code: 'RBC', name: 'Red Blood Cell Count (RBC)', value: '4.95', flag: 'NORMAL', unit: '10^6/µL', refRangeText: '4.5 - 5.9', method: 'Impedance' },
      HGB: { code: 'HGB', name: 'Hemoglobin (Hb)', value: '14.8', flag: 'NORMAL', unit: 'g/dL', refRangeText: '13.5 - 17.5', method: 'SLS Spectrophotometry' },
      HCT: { code: 'HCT', name: 'Hematocrit (PCV)', value: '44.5', flag: 'NORMAL', unit: '%', refRangeText: '40.0 - 50.0', method: 'Calculated' },
      MCV: { code: 'MCV', name: 'Mean Corpuscular Volume (MCV)', value: '89.9', flag: 'NORMAL', unit: 'fL', refRangeText: '80.0 - 96.0', method: 'Pulse Height', isCalculated: true },
      MCH: { code: 'MCH', name: 'Mean Corpuscular Hemoglobin (MCH)', value: '29.9', flag: 'NORMAL', unit: 'pg', refRangeText: '27.0 - 33.0', method: 'Calculated', isCalculated: true },
      MCHC: { code: 'MCHC', name: 'Mean Corpuscular Hb Concentration (MCHC)', value: '33.3', flag: 'NORMAL', unit: 'g/dL', refRangeText: '32.0 - 36.0', method: 'Calculated', isCalculated: true },
      PLT: { code: 'PLT', name: 'Platelet Count (PLT)', value: '265', flag: 'NORMAL', unit: '10^3/µL', refRangeText: '150 - 450', method: 'Focused Impedance' },
      ALT: { code: 'ALT', name: 'Alanine Aminotransferase (ALT/SGPT)', value: '54', flag: 'HIGH', unit: 'U/L', refRangeText: 'Up to 45', method: 'IFCC UV Rate' },
      AST: { code: 'AST', name: 'Aspartate Aminotransferase (AST/SGOT)', value: '38', flag: 'NORMAL', unit: 'U/L', refRangeText: 'Up to 40', method: 'IFCC UV Rate' },
      ALP: { code: 'ALP', name: 'Alkaline Phosphatase (ALP)', value: '85', flag: 'NORMAL', unit: 'U/L', refRangeText: '40 - 130', method: 'Kinetic p-NPP' },
      TBIL: { code: 'TBIL', name: 'Total Bilirubin', value: '0.85', flag: 'NORMAL', unit: 'mg/dL', refRangeText: '0.2 - 1.2', method: 'DPD Diazo' },
      DBIL: { code: 'DBIL', name: 'Direct (Conjugated) Bilirubin', value: '0.20', flag: 'NORMAL', unit: 'mg/dL', refRangeText: 'Up to 0.3', method: 'Direct Diazo' },
      IBIL: { code: 'IBIL', name: 'Indirect (Unconjugated) Bilirubin', value: '0.65', flag: 'NORMAL', unit: 'mg/dL', refRangeText: '0.2 - 0.9', method: 'Calculated', isCalculated: true },
      TP: { code: 'TP', name: 'Total Protein', value: '7.3', flag: 'NORMAL', unit: 'g/dL', refRangeText: '6.4 - 8.3', method: 'Biuret' },
      ALB: { code: 'ALB', name: 'Albumin', value: '4.4', flag: 'NORMAL', unit: 'g/dL', refRangeText: '3.5 - 5.2', method: 'BCG Dye' },
      GLOB: { code: 'GLOB', name: 'Globulin', value: '2.9', flag: 'NORMAL', unit: 'g/dL', refRangeText: '2.3 - 3.5', method: 'Calculated', isCalculated: true },
      AG_RATIO: { code: 'AG_RATIO', name: 'A/G Ratio', value: '1.52', flag: 'NORMAL', unit: 'Ratio', refRangeText: '1.2 - 2.2', method: 'Calculated', isCalculated: true },
      CREAT: { code: 'CREAT', name: 'Serum Creatinine', value: '0.95', flag: 'NORMAL', unit: 'mg/dL', refRangeText: '0.7 - 1.3', method: 'Jaffe Rate-Blanked' },
      UREA: { code: 'UREA', name: 'Blood Urea', value: '32', flag: 'NORMAL', unit: 'mg/dL', refRangeText: '15 - 45', method: 'Urease UV' },
      BUN: { code: 'BUN', name: 'Blood Urea Nitrogen (BUN)', value: '15.0', flag: 'NORMAL', unit: 'mg/dL', refRangeText: '7 - 21', method: 'Calculated', isCalculated: true },
      EGFR: { code: 'EGFR', name: 'Estimated GFR (eGFR)', value: '98', flag: 'NORMAL', unit: 'mL/min/1.73m²', refRangeText: '> 90 normal', method: 'CKD-EPI 2021', isCalculated: true },
      URIC: { code: 'URIC', name: 'Uric Acid', value: '5.8', flag: 'NORMAL', unit: 'mg/dL', refRangeText: '3.5 - 7.2', method: 'Uricase Colorimetric' },
      CHOL: { code: 'CHOL', name: 'Total Cholesterol', value: '228', flag: 'HIGH', unit: 'mg/dL', refRangeText: 'Desirable: < 200', method: 'CHOD-PAP' },
      TG: { code: 'TG', name: 'Triglycerides', value: '185', flag: 'HIGH', unit: 'mg/dL', refRangeText: 'Normal: < 150', method: 'GPO-PAP' },
      HDL: { code: 'HDL', name: 'HDL Cholesterol (Good)', value: '44', flag: 'NORMAL', unit: 'mg/dL', refRangeText: '> 40 (Optimal: > 50)', method: 'Direct Homogeneous' },
      LDL: { code: 'LDL', name: 'LDL Cholesterol (Bad)', value: '147.0', flag: 'HIGH', unit: 'mg/dL', refRangeText: 'Optimal: < 100 (Borderline: 100-129)', method: 'Friedewald Formula', isCalculated: true },
      VLDL: { code: 'VLDL', name: 'VLDL Cholesterol', value: '37.0', flag: 'HIGH', unit: 'mg/dL', refRangeText: '5 - 30', method: 'Calculated: TG/5', isCalculated: true },
      NON_HDL: { code: 'NON_HDL', name: 'Non-HDL Cholesterol', value: '184.0', flag: 'HIGH', unit: 'mg/dL', refRangeText: '< 130', method: 'Calculated: Chol - HDL', isCalculated: true },
      CHOL_HDL_RATIO: { code: 'CHOL_HDL_RATIO', name: 'Total Cholesterol / HDL Ratio', value: '5.18', flag: 'HIGH', unit: 'Ratio', refRangeText: 'Desirable: < 4.5', method: 'Calculated', isCalculated: true },
      FBG: { code: 'FBG', name: 'Fasting Blood Glucose (FBG)', value: '108', flag: 'HIGH', unit: 'mg/dL', refRangeText: 'Normal: 70 - 100 (Prediabetes: 100-125)', method: 'Hexokinase' },
      HBA1C: { code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)', value: '5.9', flag: 'HIGH', unit: '%', refRangeText: 'Normal: < 5.7% (Prediabetes: 5.7-6.4%, Diabetic: >= 6.5%)', method: 'HPLC Ion-Exchange' },
      EAG: { code: 'EAG', name: 'Estimated Average Glucose (eAG)', value: '123', flag: 'HIGH', unit: 'mg/dL', refRangeText: '70 - 115', method: 'Derived from HbA1c', isCalculated: true },
      TSH: { code: 'TSH', name: 'TSH (Thyroid Stimulating Hormone)', value: '2.15', flag: 'NORMAL', unit: 'µIU/mL', refRangeText: '0.40 - 4.20', method: 'ECLIA 3rd Gen' },
    };

    const initialInvoice = {
      invoiceNumber: 'INV-2026-0812',
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: 'Complete Blood Count (CBC)', code: 'CBC', type: 'Profile' as const, price: 150 },
        { name: 'Liver Function Tests (LFT)', code: 'LFT', type: 'Profile' as const, price: 290 },
        { name: 'Kidney Function Tests (KFT)', code: 'KFT', type: 'Profile' as const, price: 310 },
        { name: 'Lipid Profile Comprehensive', code: 'LIPID', type: 'Profile' as const, price: 220 },
        { name: 'Fasting Blood Glucose & HbA1c', code: 'DIABETES', type: 'Profile' as const, price: 195 },
        { name: 'TSH Ultra-sensitive', code: 'TSH', type: 'Test' as const, price: 130 },
      ],
      subtotal: 1295,
      discountPercent: 15,
      discountAmount: 194.25,
      tax: 0,
      total: 1100.75,
      paidAmount: 1100.75,
      paymentMethod: 'Credit Card' as const,
      paymentStatus: 'Paid' as const,
    };

    const initialInterpretation = {
      summary: 'أظهر الفحص المخبري وجود ارتفاع ملحوظ في دهون الدم (خلل شحمي: ارتفاع الكوليسترول الكلي، والدهون الثلاثية، وLDL)، مع ارتفاع معتدل في سكر الدم الصائم والسكر التراكمي في نطاق مقدمات السكري (Prediabetes)، بالإضافة لارتفاع طفيف في إنزيم الكبد ALT مما يتسق مع احتمال الكبد الدهني الأيضي (Metabolic Steatosis). بقية وظائف الكلى والغدة الدرقية وصورة الدم ضمن الحدود الطبيعية.',
      primaryFindings: [
        'ALT: 54 U/L (High) - إنزيم الكبد مرتفع',
        'Lipid Profile: Cholesterol 228 mg/dL, Triglycerides 185 mg/dL, LDL 147 mg/dL (Atherogenic dyslipidemia)',
        'Fasting Glucose: 108 mg/dL, HbA1c: 5.9% (Impaired fasting glucose / Prediabetes)',
      ],
      differentialConsiderations: [
        'متلازمة الأيض ومقاومة الإنسولين المبكرة (Metabolic Syndrome & Insulin Resistance)',
        'دهون الكبد غير الكحولية (Non-Alcoholic Fatty Liver Disease / NAFLD)',
        'عوامل اختطار قلبية وعائية تستوجب ضبط نمط الحياة والحمية الغذائية',
      ],
      suggestedFollowUp: [
        'متابعة حمية غذائية منخفضة النشويات والدهون المشبعة مع ممارسة الرياضة',
        'إجراء فحص مقاومة الإنسولين HOMA-IR وسونار على البطن (Abdominal Ultrasound) لتقييم الكبد',
        'إعادة فحص الدهون والسكر التراكمي بعد 3 أشهر',
      ],
      criticalAlert: null,
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
    };

    return [
      {
        id: 'enc-01',
        patient: samplePatient,
        selectedTestCodes: initialCodes,
        results: initialResults,
        invoice: initialInvoice,
        clinicalInterpretation: initialInterpretation,
        status: 'Results Entered',
      },
    ];
  });

  const [activeEncounterId, setActiveEncounterId] = useState<string>(() => {
    return encounters[0]?.id || '';
  });

  // Current active encounter
  const currentEncounter = useMemo(() => {
    return encounters.find((e) => e.id === activeEncounterId) || encounters[0];
  }, [encounters, activeEncounterId]);

  // UI state
  const [activeTab, setActiveTab] = useState<'encounters' | 'report' | 'invoice' | 'ai-interpret' | 'recommendations' | 'catalog'>('encounters');
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [editingPatientTarget, setEditingPatientTarget] = useState<PatientRecord | null>(null);
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(testsCatalog));
  }, [testsCatalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profilesCatalog));
  }, [profilesCatalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(packagesCatalog));
  }, [packagesCatalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENCOUNTERS, JSON.stringify(encounters));
  }, [encounters]);

  // Handlers for modifying encounters
  const updateCurrentEncounter = (updater: (prev: PatientEncounter) => PatientEncounter) => {
    setEncounters((prev) =>
      prev.map((enc) => (enc.id === currentEncounter.id ? updater(enc) : enc))
    );
  };

  // 1. Result change & recalculation
  const handleResultChange = (code: string, value: string) => {
    if (!currentEncounter) return;

    updateCurrentEncounter((enc) => {
      const testDef = catalogMap.get(code);
      if (!testDef) return enc;

      const flag = evaluateFlag(value, testDef, enc.patient);
      const updatedResults: Record<string, PatientTestResult> = {
        ...enc.results,
        [code]: {
          code,
          name: testDef.name,
          value,
          numericValue: parseFloat(value) || undefined,
          flag,
          unit: testDef.unit,
          refRangeText: getReferenceRangeText(testDef, enc.patient),
          method: testDef.method,
          isCalculated: testDef.isCalculated,
        },
      };

      // Run automatic formula calculator on all dependent values!
      const finalResults = calculateLabResults(updatedResults, catalogMap, enc.patient);

      return {
        ...enc,
        results: finalResults,
        status: 'Results Entered',
      };
    });
  };

  // 2. Add / Toggle / Remove tests
  const handleToggleTest = (code: string) => {
    if (!currentEncounter) return;
    const exists = currentEncounter.selectedTestCodes.includes(code);
    if (exists) {
      handleRemoveTest(code);
    } else {
      handleAddTests([code]);
    }
  };

  const handleAddTests = (codes: string[]) => {
    if (!currentEncounter) return;
    updateCurrentEncounter((enc) => {
      const newCodes = Array.from(new Set([...enc.selectedTestCodes, ...codes]));
      const newResults = { ...enc.results };

      codes.forEach((c) => {
        const testDef = catalogMap.get(c);
        if (testDef && !newResults[c]) {
          newResults[c] = {
            code: c,
            name: testDef.name,
            value: '',
            flag: 'NORMAL',
            unit: testDef.unit,
            refRangeText: getReferenceRangeText(testDef, enc.patient),
            method: testDef.method,
            isCalculated: testDef.isCalculated,
          };
        }
      });

      // Recalculate invoice
      const invoiceItems = newCodes.map((c) => {
        const def = catalogMap.get(c);
        return {
          name: def?.name || c,
          code: c,
          type: 'Test' as const,
          price: def?.price || 50,
        };
      });
      const subtotal = invoiceItems.reduce((acc, it) => acc + it.price, 0);
      const discountAmt = (subtotal * enc.invoice.discountPercent) / 100;
      const total = Math.max(0, subtotal - discountAmt);

      return {
        ...enc,
        selectedTestCodes: newCodes,
        results: newResults,
        invoice: {
          ...enc.invoice,
          items: invoiceItems,
          subtotal,
          discountAmount: discountAmt,
          total,
          paidAmount: total,
        },
      };
    });
  };

  const handleRemoveTest = (code: string) => {
    if (!currentEncounter) return;
    updateCurrentEncounter((enc) => {
      const newCodes = enc.selectedTestCodes.filter((c) => c !== code);
      const newResults = { ...enc.results };
      delete newResults[code];

      // Re-run calculations in case a calculated test depended on this
      const finalResults = calculateLabResults(newResults, catalogMap, enc.patient);

      const invoiceItems = newCodes.map((c) => {
        const def = catalogMap.get(c);
        return {
          name: def?.name || c,
          code: c,
          type: 'Test' as const,
          price: def?.price || 50,
        };
      });
      const subtotal = invoiceItems.reduce((acc, it) => acc + it.price, 0);
      const discountAmt = (subtotal * enc.invoice.discountPercent) / 100;
      const total = Math.max(0, subtotal - discountAmt);

      return {
        ...enc,
        selectedTestCodes: newCodes,
        results: finalResults,
        invoice: {
          ...enc.invoice,
          items: invoiceItems,
          subtotal,
          discountAmount: discountAmt,
          total,
          paidAmount: total,
        },
      };
    });
  };

  const handleRemoveMultipleTests = (codes: string[]) => {
    if (!currentEncounter) return;
    codes.forEach((c) => handleRemoveTest(c));
  };

  // 3. New Patient Registration
  const handleSavePatient = (patient: PatientRecord) => {
    const isEditing = encounters.some((e) => e.patient.id === patient.id);

    if (isEditing) {
      setEncounters((prev) =>
        prev.map((enc) => (enc.patient.id === patient.id ? { ...enc, patient } : enc))
      );
    } else {
      // Create new encounter
      const randInv = Math.floor(1000 + Math.random() * 9000);
      const newEnc: PatientEncounter = {
        id: `enc-${Date.now()}`,
        patient,
        selectedTestCodes: [],
        results: {},
        invoice: {
          invoiceNumber: `INV-2026-${randInv}`,
          date: patient.reportDate,
          items: [],
          subtotal: 0,
          discountPercent: 0,
          discountAmount: 0,
          tax: 0,
          total: 0,
          paidAmount: 0,
          paymentMethod: 'Cash',
          paymentStatus: 'Unpaid',
        },
        status: 'Registered',
      };
      setEncounters((prev) => [newEnc, ...prev]);
      setActiveEncounterId(newEnc.id);
      setActiveTab('encounters');
    }
  };

  // 4. Fill Demo Values for fast testing
  const handleFillDemoNormal = () => {
    if (!currentEncounter) return;
    const newResults: Record<string, PatientTestResult> = { ...currentEncounter.results };

    currentEncounter.selectedTestCodes.forEach((code) => {
      const def = catalogMap.get(code);
      if (!def || def.isCalculated) return;

      let val = '0';
      if (def.refMale.min !== undefined && def.refMale.max !== undefined) {
        const mid = (def.refMale.min + def.refMale.max) / 2;
        val = mid % 1 === 0 ? String(mid) : mid.toFixed(1);
      } else if (def.options) {
        val = def.options[0] || 'Negative';
      }

      newResults[code] = {
        code,
        name: def.name,
        value: val,
        numericValue: parseFloat(val) || undefined,
        flag: 'NORMAL',
        unit: def.unit,
        refRangeText: getReferenceRangeText(def, currentEncounter.patient),
        method: def.method,
      };
    });

    const finalResults = calculateLabResults(newResults, catalogMap, currentEncounter.patient);
    updateCurrentEncounter((enc) => ({
      ...enc,
      results: finalResults,
      status: 'Results Entered',
    }));
  };

  const handleFillDemoAbnormal = () => {
    if (!currentEncounter) return;
    const newResults: Record<string, PatientTestResult> = { ...currentEncounter.results };

    currentEncounter.selectedTestCodes.forEach((code) => {
      const def = catalogMap.get(code);
      if (!def || def.isCalculated) return;

      let val = '0';
      if (code === 'ALT') val = '78';
      else if (code === 'AST') val = '62';
      else if (code === 'CHOL') val = '245';
      else if (code === 'TG') val = '220';
      else if (code === 'HDL') val = '35';
      else if (code === 'HGB') val = '10.2';
      else if (code === 'FBG') val = '135';
      else if (code === 'HBA1C') val = '7.2';
      else if (code === 'CREAT') val = '1.65';
      else if (code === 'TSH') val = '6.4';
      else if (def.refMale.max) {
        val = (def.refMale.max * 1.25).toFixed(1);
      }

      const flag = evaluateFlag(val, def, currentEncounter.patient);
      newResults[code] = {
        code,
        name: def.name,
        value: val,
        numericValue: parseFloat(val) || undefined,
        flag,
        unit: def.unit,
        refRangeText: getReferenceRangeText(def, currentEncounter.patient),
        method: def.method,
      };
    });

    const finalResults = calculateLabResults(newResults, catalogMap, currentEncounter.patient);
    updateCurrentEncounter((enc) => ({
      ...enc,
      results: finalResults,
      status: 'Results Entered',
    }));
  };

  const handleDeleteEncounter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (encounters.length <= 1) {
      alert('يجب أن يبقى سجل مريض واحد على الأقل في النظام.');
      return;
    }
    if (confirm('هل أنت متأكد من حذف ملف هذا المريض بالكامل؟')) {
      const remaining = encounters.filter((enc) => enc.id !== id);
      setEncounters(remaining);
      if (activeEncounterId === id) {
        setActiveEncounterId(remaining[0].id);
      }
    }
  };

  // Filtered patients for sidebar
  const filteredEncounters = encounters.filter((enc) => {
    const q = searchTerm.toLowerCase();
    return (
      enc.patient.name.toLowerCase().includes(q) ||
      enc.patient.mrn.toLowerCase().includes(q) ||
      enc.patient.phone.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* 1. Header Navigation */}
      <Header
        settings={settings}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        onNewPatient={() => {
          setEditingPatientTarget(null);
          setPatientModalOpen(true);
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenGitHubSync={() => setGithubModalOpen(true)}
        encounterCount={encounters.length}
      />

      {/* 2. Main Content Router */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab A: Encounters & Results Entry */}
        {activeTab === 'encounters' && (
          <div className="space-y-6">
            {/* Patient Header Card */}
            {currentEncounter && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-900 to-rose-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">
                        {currentEncounter.patient.name}
                      </h2>
                      <span className="font-mono text-xs bg-slate-100 text-rose-900 px-2 py-0.5 rounded font-bold border border-slate-200">
                        {currentEncounter.patient.mrn}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-bold">{currentEncounter.patient.ageYears} سنة</span>
                      <span>•</span>
                      <span>{currentEncounter.patient.gender === 'Male' ? 'ذكر (Male)' : 'أنثى (Female)'}</span>
                      <span>•</span>
                      <span>الطبيب: {currentEncounter.patient.referringDoctor || 'Self'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{currentEncounter.patient.sampleDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      setEditingPatientTarget(currentEncounter.patient);
                      setPatientModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل البيانات</span>
                  </button>

                  <button
                    onClick={() => setTestDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-950 text-white text-xs font-bold hover:from-rose-700 hover:to-rose-900 shadow-md shadow-rose-950/20 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>اختيار التحاليل ({currentEncounter.selectedTestCodes.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Encounters selector strip if multiple patients exist */}
            {encounters.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="font-bold text-slate-500 whitespace-nowrap">المرضى المسجلون:</span>
                {encounters.map((enc) => (
                  <button
                    key={enc.id}
                    onClick={() => setActiveEncounterId(enc.id)}
                    className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 whitespace-nowrap ${
                      enc.id === activeEncounterId
                        ? 'bg-rose-900 text-white border-rose-900 font-bold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{enc.patient.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">{enc.patient.mrn}</span>
                    <span
                      onClick={(e) => handleDeleteEncounter(enc.id, e)}
                      className="p-0.5 rounded hover:bg-rose-800 text-rose-300"
                      title="حذف هذا المريض"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Results Entry Grid */}
            {currentEncounter && (
              <ResultsEntryGrid
                patient={currentEncounter.patient}
                selectedTestCodes={currentEncounter.selectedTestCodes}
                results={currentEncounter.results}
                catalogMap={catalogMap}
                onResultChange={handleResultChange}
                onRemoveTest={handleRemoveTest}
                onOpenTestSelector={() => setTestDrawerOpen(true)}
                onFillDemoNormal={handleFillDemoNormal}
                onFillDemoAbnormal={handleFillDemoAbnormal}
              />
            )}
          </div>
        )}

        {/* Tab B: Official Laboratory Report */}
        {activeTab === 'report' && currentEncounter && (
          <ReportViewer
            encounter={currentEncounter}
            settings={settings}
            catalogMap={catalogMap}
            onEditPatient={() => {
              setEditingPatientTarget(currentEncounter.patient);
              setPatientModalOpen(true);
            }}
            onEditSettings={() => setSettingsModalOpen(true)}
          />
        )}

        {/* Tab C: Official Invoice */}
        {activeTab === 'invoice' && currentEncounter && (
          <InvoiceViewer
            encounter={currentEncounter}
            settings={settings}
            onUpdateInvoice={(inv) => {
              updateCurrentEncounter((enc) => ({ ...enc, invoice: inv }));
            }}
          />
        )}

        {/* Tab D: AI Clinical Interpretation */}
        {activeTab === 'ai-interpret' && currentEncounter && (
          <AIInterpretationPanel
            encounter={currentEncounter}
            catalogMap={catalogMap}
            onSaveInterpretation={(interp) => {
              updateCurrentEncounter((enc) => ({
                ...enc,
                clinicalInterpretation: interp,
              }));
            }}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}

        {/* Tab E: Smart Test Recommender */}
        {activeTab === 'recommendations' && currentEncounter && (
          <TestRecommendationModal
            onAddTests={(codes) => {
              handleAddTests(codes);
              setActiveTab('encounters');
            }}
            selectedTestCodes={currentEncounter.selectedTestCodes}
            catalogMap={catalogMap}
            patientAge={currentEncounter.patient.ageYears}
            patientGender={currentEncounter.patient.gender}
          />
        )}

        {/* Tab F: Master Catalog */}
        {activeTab === 'catalog' && (
          <CatalogManager
            testsCatalog={testsCatalog}
            profilesCatalog={profilesCatalog}
            packagesCatalog={packagesCatalog}
            onUpdateTestsCatalog={setTestsCatalog}
            onUpdateProfilesCatalog={setProfilesCatalog}
            onUpdatePackagesCatalog={setPackagesCatalog}
            onResetToDefaults={() => {
              setTestsCatalog(DEFAULT_TESTS);
              setProfilesCatalog(DEFAULT_PROFILES);
              setPackagesCatalog(DEFAULT_PACKAGES);
              localStorage.removeItem(STORAGE_KEY_TESTS);
              localStorage.removeItem(STORAGE_KEY_PROFILES);
              localStorage.removeItem(STORAGE_KEY_PACKAGES);
            }}
          />
        )}
      </div>

      {/* 3. Global Modals */}
      {/* Patient Registration Modal */}
      <PatientFormModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={handleSavePatient}
        initialPatient={editingPatientTarget}
      />

      {/* Test Selection Drawer */}
      {currentEncounter && (
        <TestSelectionDrawer
          isOpen={testDrawerOpen}
          onClose={() => setTestDrawerOpen(false)}
          testsCatalog={testsCatalog}
          profilesCatalog={profilesCatalog}
          packagesCatalog={packagesCatalog}
          selectedTestCodes={currentEncounter.selectedTestCodes}
          onToggleTest={handleToggleTest}
          onAddMultipleTests={handleAddTests}
          onRemoveMultipleTests={handleRemoveMultipleTests}
        />
      )}

      {/* Lab Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      {/* GitHub Deployment Modal */}
      <GitHubDeployModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
      />
    </div>
  );
}
