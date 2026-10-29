import { FlagType, PatientRecord, PatientTestResult, TestCatalogItem } from '../types/lab';

export function calculateLabResults(
  currentResults: Record<string, PatientTestResult>,
  catalogMap: Map<string, TestCatalogItem>,
  patient: PatientRecord
): Record<string, PatientTestResult> {
  const updated: Record<string, PatientTestResult> = { ...currentResults };

  const getNum = (code: string): number | null => {
    const r = updated[code];
    if (!r || r.value === '' || r.value === undefined || r.value === null) return null;
    const n = parseFloat(String(r.value).trim());
    return isNaN(n) ? null : n;
  };

  const setCalc = (code: string, numVal: number | null, decimals = 2, customComment?: string) => {
    const testDef = catalogMap.get(code);
    if (!testDef) return;

    if (numVal === null || isNaN(numVal) || !isFinite(numVal)) {
      if (updated[code]?.isCalculated) {
        delete updated[code];
      }
      return;
    }

    const rounded = Number(numVal.toFixed(decimals));
    const flag = evaluateFlag(rounded, testDef, patient);

    updated[code] = {
      code,
      name: testDef.name,
      value: String(rounded),
      numericValue: rounded,
      flag,
      unit: testDef.unit,
      refRangeText: getReferenceRangeText(testDef, patient),
      method: testDef.method,
      isCalculated: true,
      comment: customComment,
    };
  };

  // 1. LIPID PROFILE CALCULATIONS
  const chol = getNum('CHOL');
  const tg = getNum('TG');
  const hdl = getNum('HDL');

  if (tg !== null) {
    const vldl = tg / 5;
    setCalc('VLDL', vldl, 1);
  }

  if (chol !== null && hdl !== null && tg !== null) {
    if (tg <= 400) {
      const ldl = chol - hdl - (tg / 5);
      setCalc('LDL', ldl, 1);
    } else {
      setCalc('LDL', null, 1, 'Triglycerides > 400 mg/dL: Friedewald formula unreliable. Direct LDL recommended.');
    }
  }

  if (chol !== null && hdl !== null) {
    const nonHdl = chol - hdl;
    setCalc('NON_HDL', nonHdl, 1);

    if (hdl > 0) {
      const cholHdlRatio = chol / hdl;
      setCalc('CHOL_HDL_RATIO', cholHdlRatio, 2);
    }
  }

  // 2. LIVER FUNCTION CALCULATIONS
  const tbil = getNum('TBIL');
  const dbil = getNum('DBIL');
  if (tbil !== null && dbil !== null) {
    const ibil = Math.max(0, tbil - dbil);
    setCalc('IBIL', ibil, 2);
  }

  const tp = getNum('TP');
  const alb = getNum('ALB');
  if (tp !== null && alb !== null) {
    const glob = Math.max(0, tp - alb);
    setCalc('GLOB', glob, 2);

    if (glob > 0) {
      const agRatio = alb / glob;
      setCalc('AG_RATIO', agRatio, 2);
    }
  }

  // 3. KIDNEY FUNCTION CALCULATIONS
  const urea = getNum('UREA');
  const creat = getNum('CREAT');

  if (urea !== null) {
    const bun = urea / 2.14;
    setCalc('BUN', bun, 1);

    if (creat !== null && creat > 0) {
      const bunCrRatio = bun / creat;
      setCalc('BUN_CR_RATIO', bunCrRatio, 1);
    }
  }

  if (creat !== null && creat > 0) {
    // CKD-EPI 2021 Equation
    const age = patient.ageYears || 35;
    const isFemale = patient.gender === 'Female';
    const k = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const femaleMult = isFemale ? 1.012 : 1.0;

    const minRatio = Math.min(creat / k, 1);
    const maxRatio = Math.max(creat / k, 1);
    const egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * femaleMult;
    setCalc('EGFR', egfr, 0);
  }

  // 4. DIABETES CALCULATIONS
  const hba1c = getNum('HBA1C');
  if (hba1c !== null && hba1c > 0) {
    const eag = 28.7 * hba1c - 46.7;
    setCalc('EAG', eag, 0);
  }

  const fbg = getNum('FBG');
  const insulin = getNum('INSULIN');
  if (fbg !== null && insulin !== null && fbg > 0 && insulin > 0) {
    const homaIr = (insulin * fbg) / 405;
    setCalc('HOMA_IR', homaIr, 2);
  }

  // 5. HEMATOLOGY CALCULATIONS
  const wbc = getNum('WBC');
  const neutPct = getNum('NEUT_PCT');
  if (wbc !== null && neutPct !== null) {
    const anc = (wbc * neutPct) / 100;
    setCalc('ANC', anc, 2);
  }

  const rbc = getNum('RBC');
  const hgb = getNum('HGB');
  const hct = getNum('HCT');

  if (hct !== null && rbc !== null && rbc > 0) {
    if (!currentResults['MCV'] || currentResults['MCV'].isCalculated) {
      const mcv = (hct * 10) / rbc;
      setCalc('MCV', mcv, 1);
    }
  }

  if (hgb !== null && rbc !== null && rbc > 0) {
    if (!currentResults['MCH'] || currentResults['MCH'].isCalculated) {
      const mch = (hgb * 10) / rbc;
      setCalc('MCH', mch, 1);
    }
  }

  if (hgb !== null && hct !== null && hct > 0) {
    if (!currentResults['MCHC'] || currentResults['MCHC'].isCalculated) {
      const mchc = (hgb / hct) * 100;
      setCalc('MCHC', mchc, 1);
    }
  }

  // 6. IRON PROFILE CALCULATIONS
  const iron = getNum('IRON');
  const tibc = getNum('TIBC');
  if (iron !== null && tibc !== null && tibc > 0) {
    const tsat = (iron / tibc) * 100;
    setCalc('TSAT', tsat, 1);
  }

  return updated;
}

export function evaluateFlag(
  value: number | string,
  testDef: TestCatalogItem,
  patient: PatientRecord
): FlagType {
  const num = typeof value === 'number' ? value : parseFloat(String(value).trim());
  if (isNaN(num)) {
    // Check qualitative strings like "Positive", "Trace"
    const s = String(value).toLowerCase();
    if (s.includes('positive') || s.includes('+') || s.includes('turbid') || s.includes('hazy')) {
      return 'HIGH';
    }
    return 'NORMAL';
  }

  // Check panic ranges first
  if (testDef.panicLow !== undefined && num <= testDef.panicLow) {
    return 'PANIC_LOW';
  }
  if (testDef.panicHigh !== undefined && num >= testDef.panicHigh) {
    return 'PANIC_HIGH';
  }

  // Get gender-specific or child reference
  const ref = getActiveRefRange(testDef, patient);

  if (ref.min !== undefined && num < ref.min) {
    return 'LOW';
  }
  if (ref.max !== undefined && num > ref.max) {
    return 'HIGH';
  }

  return 'NORMAL';
}

export function getActiveRefRange(testDef: TestCatalogItem, patient: PatientRecord) {
  if (patient.ageYears < 12 && testDef.refChild?.min !== undefined) {
    return testDef.refChild;
  }
  if (patient.gender === 'Female') {
    return testDef.refFemale;
  }
  return testDef.refMale;
}

export function getReferenceRangeText(testDef: TestCatalogItem, patient: PatientRecord): string {
  const ref = getActiveRefRange(testDef, patient);
  if (ref.text) return ref.text;
  if (ref.min !== undefined && ref.max !== undefined) {
    return `${ref.min} - ${ref.max}`;
  }
  if (ref.max !== undefined) {
    return `< ${ref.max}`;
  }
  if (ref.min !== undefined) {
    return `> ${ref.min}`;
  }
  return 'Normal';
}

export function getFlagDisplayInfo(flag: FlagType) {
  switch (flag) {
    case 'NORMAL':
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        chartColor: '#10b981',
        icon: '✓',
      };
    case 'LOW':
      return {
        label: 'Low (L)',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
        chartColor: '#3b82f6',
        icon: '↓',
      };
    case 'HIGH':
      return {
        label: 'High (H)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
        chartColor: '#f59e0b',
        icon: '↑',
      };
    case 'PANIC_LOW':
      return {
        label: 'CRITICAL LOW (LL)',
        badgeClass: 'bg-rose-600 text-white border-rose-700 font-black animate-pulse shadow-sm',
        chartColor: '#e11d48',
        icon: '↓↓!',
      };
    case 'PANIC_HIGH':
      return {
        label: 'CRITICAL HIGH (HH)',
        badgeClass: 'bg-rose-700 text-white border-rose-900 font-black animate-pulse shadow-sm',
        chartColor: '#be123c',
        icon: '↑↑!',
      };
  }
}
