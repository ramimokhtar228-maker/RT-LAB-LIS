import React, { useState, useEffect, useMemo } from 'react';
import {
  PatientRecord,
  PatientEncounter,
  TestCatalogItem,
  ProfileCatalogItem,
  PackageCatalogItem,
  LabSettings,
  PatientTestResult,
  LabDevice,
} from './types/lab';
import {
  DEFAULT_LAB_SETTINGS,
  DEFAULT_TESTS,
  DEFAULT_PROFILES,
  DEFAULT_PACKAGES,
} from './data/defaultCatalog';
import { DEFAULT_LAB_DEVICES } from './data/analyzers';
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
import { PWAInstallButton } from './components/PWAInstallButton';
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

const STORAGE_KEY_SETTINGS = 'rt_lab_settings_v4';
const STORAGE_KEY_TESTS = 'rt_lab_tests_v4';
const STORAGE_KEY_PROFILES = 'rt_lab_profiles_v4';
const STORAGE_KEY_PACKAGES = 'rt_lab_packages_v4';
const STORAGE_KEY_ENCOUNTERS = 'rt_lab_encounters_v4';
const STORAGE_KEY_DEVICES = 'rt_lab_devices_v4';

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

  // 2. Catalogs state (Guarantees complete 412 tests catalog)
  const [testsCatalog, setTestsCatalog] = useState<TestCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 400) {
          return parsed;
        }
      }
      return DEFAULT_TESTS;
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

  // Devices catalog state with persistence
  const [devicesCatalog, setDevicesCatalog] = useState<LabDevice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEVICES);
      return saved ? JSON.parse(saved) : DEFAULT_LAB_DEVICES;
    } catch {
      return DEFAULT_LAB_DEVICES;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devicesCatalog));
  }, [devicesCatalog]);

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

    // Case 1: Yara Mohamed Ramadan from user's attached report
    const yaraPatient: PatientRecord = {
      id: 'pat-yara-01',
      mrn: 'RT-2026-062',
      barcode: 'RT-2026-062',
      name: 'يارا محمد رمضان (Yara Mohamed Ramadan)',
      nationalId: '31610230104822',
      ageYears: 10,
      ageMonths: 0,
      gender: 'Female',
      phone: '01013242777',
      referringDoctor: 'Prof. Dr. Herself',
      sampleDate: '2026-10-23',
      sampleTime: '17:32',
      reportDate: '2026-10-23',
      reportTime: '17:32',
      sampleType: 'EDTA Whole Blood',
      fastingStatus: 'Random',
      clinicalNotes: 'Weakness, Abd. Pain, loss of apatite',
      createdAt: new Date().toISOString(),
    };

    const yaraCodes = [
      'HGB', 'RBC', 'HCT', 'MCV', 'MCH', 'MCHC', 'RDW', 'PLT',
      'WBC', 'NEUT_PCT', 'LYMPH_PCT', 'MONO_PCT', 'EOS_PCT', 'BASO_PCT', 'ANC'
    ];

    const yaraResults: Record<string, PatientTestResult> = {
      HGB: { code: 'HGB', name: 'Hemoglobin (Hb)', value: '12.60', flag: 'NORMAL', unit: 'g/dL', refRangeText: '12.5 - 15.5 g/dL', method: 'Automated SLS-Hb' },
      RBC: { code: 'RBC', name: 'R.B.Cs Count', value: '4.200', flag: 'NORMAL', unit: 'x10^6/µL', refRangeText: '4 - 5.8 x10^6/µL', method: 'Electrical Impedance' },
      HCT: { code: 'HCT', name: 'Hematocrit (PCV)', value: '37.00', flag: 'NORMAL', unit: '%', refRangeText: '36 - 48 %', method: 'Calculated' },
      MCV: { code: 'MCV', name: 'M.C.V', value: '88.1', flag: 'NORMAL', unit: 'fL', refRangeText: '80 - 98 fL', method: 'Direct measurement' },
      MCH: { code: 'MCH', name: 'M.C.H', value: '30', flag: 'NORMAL', unit: 'pg', refRangeText: '27 - 33 pg', method: 'Calculated' },
      MCHC: { code: 'MCHC', name: 'M.C.H.C', value: '34.1', flag: 'NORMAL', unit: 'g/dL', refRangeText: '32 - 36 g/dL', method: 'Calculated' },
      RDW: { code: 'RDW', name: 'R.D.W-CV', value: '13.55', flag: 'NORMAL', unit: '%', refRangeText: '11.5 - 14.5 %', method: 'RBC curve' },
      PLT: { code: 'PLT', name: 'Platelets Count', value: '310', flag: 'NORMAL', unit: 'x10^3/µL', refRangeText: '150 - 450 x10^3/µL', method: 'Focused Impedance' },
      WBC: { code: 'WBC', name: 'Total Leucocytic Count (TLC)', value: '7.00', flag: 'NORMAL', unit: 'x10^3/µL', refRangeText: '4 - 11 x10^3/µL', method: 'Laser Flow Cytometry' },
      NEUT_PCT: { code: 'NEUT_PCT', name: 'Segmented Neutrophils %', value: '60', flag: 'NORMAL', unit: '%', refRangeText: '40 - 65 %', method: 'Flow Cytometry' },
      LYMPH_PCT: { code: 'LYMPH_PCT', name: 'Lymphocytes %', value: '30', flag: 'NORMAL', unit: '%', refRangeText: '20 - 45 %', method: 'Flow Cytometry' },
      MONO_PCT: { code: 'MONO_PCT', name: 'Monocytes %', value: '03', flag: 'NORMAL', unit: '%', refRangeText: '2 - 8 %', method: 'Flow Cytometry' },
      EOS_PCT: { code: 'EOS_PCT', name: 'Eosinophils %', value: '03', flag: 'NORMAL', unit: '%', refRangeText: '1 - 6 %', method: 'Flow Cytometry' },
      BASO_PCT: { code: 'BASO_PCT', name: 'Basophils %', value: '00', flag: 'NORMAL', unit: '%', refRangeText: '0 - 1 %', method: 'Flow Cytometry' },
      ANC: { code: 'ANC', name: 'Absolute Neutrophils (ANC)', value: '4.2', flag: 'NORMAL', unit: 'x10^3/µL', refRangeText: '1.5 - 7.5 x10^3/µL', method: 'Calculated' },
    };

    const yaraInvoice = {
      invoiceNumber: 'INV-2026-0062',
      date: '2026-10-23',
      items: [{ name: 'Complete Blood Count (CBC with Automated Diff)', code: 'CBC', type: 'Profile' as const, price: 150 }],
      subtotal: 150,
      discountPercent: 0,
      discountAmount: 0,
      tax: 0,
      total: 150,
      paidAmount: 150,
      paymentMethod: 'Cash' as const,
      paymentStatus: 'Paid' as const,
    };

    const yaraInterpretation = {
      summary: 'صورة دم كاملة سليمة ضمن الحدود الطبيعية المتوافقة مع الفئة العمرية (10 سنوات). لا توجد دلالات لفقر دم أو عدوى حادة. نظراً لوجود ألم بالبطن وفقدان الشهية (Weakness, Abd. Pain, loss of appetite)، يُوصى بإجراء تحليل براز كامل ومخزون الحديد Serum Ferritin وفحص بول روتيني.',
      primaryFindings: [
        'Hemoglobin (Hb): 12.60 g/dL (Normal)',
        'Red Blood Cells & Indices (MCV 88.1 fL, MCH 30 pg, MCHC 34.1 g/dL) - Normocytic Normochromic',
        'Total & Differential Leukocyte count within normal limits (TLC 7.0 x10^3/µL)',
        'Platelet count adequate (310 x10^3/µL)',
      ],
      differentialConsiderations: [
        'أسباب معوية طفيلية أو وظيفية مسببة لآلام البطن وفقدان الشهية (Parasitic vs. Functional Dyspepsia)',
        'استبعاد نقص مخزون الحديد الكامن في بدايته (Latent Iron Store Depletion)',
      ],
      suggestedFollowUp: [
        'إجراء فحص براز كامل للكشف عن الطفيليات والدم الخفي (Stool Routine & Occult Blood)',
        'فحص مخزون الحديد الفيريتين (Serum Ferritin)',
        'سونار على البطن والحوض في حال استمرار الألم (Abdominal Ultrasonography)',
      ],
      criticalAlert: null,
      generatedAt: '2026-10-23T17:32:00Z',
      isAiGenerated: true,
    };

    return [
      {
        id: 'enc-yara-01',
        patient: yaraPatient,
        selectedTestCodes: yaraCodes,
        results: yaraResults,
        invoice: yaraInvoice,
        clinicalInterpretation: yaraInterpretation,
        profileComments: {
          CBC: 'Normocytic normochromic red cell indices within normal limits.\nWhite blood cell count and automated 5-part differential show no numerical or morphological abnormalities.\nAdequate platelet count.',
        },
        profileRecommendedTests: {
          CBC: ['FERRITIN', 'IRON', 'TIBC', 'STOOL_OB'],
        },
        showSmartReportOnPrint: true,
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

  // 1b. Profile Comments & Clinical Recommendations
  const handleUpdateProfileComment = (profileCode: string, comment: string) => {
    if (!currentEncounter) return;
    updateCurrentEncounter((enc) => ({
      ...enc,
      profileComments: {
        ...(enc.profileComments || {}),
        [profileCode]: comment,
      },
    }));
  };

  const handleUpdateProfileRecommendedTests = (profileCode: string, testCodes: string[]) => {
    if (!currentEncounter) return;
    updateCurrentEncounter((enc) => ({
      ...enc,
      profileRecommendedTests: {
        ...(enc.profileRecommendedTests || {}),
        [profileCode]: testCodes,
      },
    }));
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
            {/* PWA Mobile & Laptop Install Banner */}
            <PWAInstallButton variant="banner" />

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
                      title="حذف هذا المريض نهائياً"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Results Entry Grid (Profile-by-Profile with Comments & Follow-up Recommendations) */}
            {currentEncounter && (
              <ResultsEntryGrid
                patient={currentEncounter.patient}
                selectedTestCodes={currentEncounter.selectedTestCodes}
                results={currentEncounter.results}
                catalogMap={catalogMap}
                profilesCatalog={profilesCatalog}
                profileComments={currentEncounter.profileComments}
                profileRecommendedTests={currentEncounter.profileRecommendedTests}
                onResultChange={handleResultChange}
                onRemoveTest={handleRemoveTest}
                onOpenTestSelector={() => setTestDrawerOpen(true)}
                onFillDemoNormal={handleFillDemoNormal}
                onFillDemoAbnormal={handleFillDemoAbnormal}
                onUpdateProfileComment={handleUpdateProfileComment}
                onUpdateProfileRecommendedTests={handleUpdateProfileRecommendedTests}
                onAddTestToEncounter={(code) => handleAddTests([code])}
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
            profilesCatalog={profilesCatalog}
            onUpdateEncounter={(updatedEnc) => updateCurrentEncounter(() => updatedEnc)}
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
            devicesCatalog={devicesCatalog}
            onUpdateTestsCatalog={setTestsCatalog}
            onUpdateProfilesCatalog={setProfilesCatalog}
            onUpdatePackagesCatalog={setPackagesCatalog}
            onUpdateDevicesCatalog={setDevicesCatalog}
            onResetToDefaults={() => {
              setTestsCatalog(DEFAULT_TESTS);
              setProfilesCatalog(DEFAULT_PROFILES);
              setPackagesCatalog(DEFAULT_PACKAGES);
              setDevicesCatalog(DEFAULT_LAB_DEVICES);
              localStorage.removeItem(STORAGE_KEY_TESTS);
              localStorage.removeItem(STORAGE_KEY_PROFILES);
              localStorage.removeItem(STORAGE_KEY_PACKAGES);
              localStorage.removeItem(STORAGE_KEY_DEVICES);
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
