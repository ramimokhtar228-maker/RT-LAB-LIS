/**
 * Automated Clinical Laboratory Calculation Engine
 * Formulated according to international clinical pathology and biochemistry guidelines:
 * - CBC: Hematocrit, MCV, MCH, MCHC, Differential Absolute counts
 * - Lipid Profile: Friedewald equation (LDL = Chol - HDL - TG/5, VLDL = TG/5, Chol/HDL Ratio, Non-HDL)
 * - Glycemic Control (HbA1c): ADAG formula for Estimated Average Glucose (eAG)
 * - Insulin Resistance (HOMA-IR): (Fasting Glucose mg/dL * Fasting Insulin µIU/mL) / 405
 * - Nephrology (ACR): Urine Microalbumin (mg/L) / Urine Creatinine (mg/dL or g/L)
 * - Liver Function: Indirect Bilirubin = Total Bilirubin - Direct Bilirubin, Globulin = Total Protein - Albumin, A/G Ratio
 * - Renal Function: BUN / Creatinine Ratio, eGFR (CKD-EPI)
 */

export interface CalculationResult {
  updatedMap: { [paramIdOrCode: string]: string };
  changedFields: { [paramCode: string]: string };
  messages: string[];
}

export const runClinicalCalculations = (
  resultsMap: { [paramIdOrCode: string]: string },
  patientInfo?: { gender?: 'male' | 'female'; age?: number },
  testCode?: string
): CalculationResult => {
  const updated: { [key: string]: string } = { ...resultsMap };
  const changed: { [paramCode: string]: string } = {};
  const messages: string[] = [];

  // Helper to read float by parameter code or ID
  const getVal = (keys: string[]): number | null => {
    for (const k of keys) {
      const v = updated[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        const num = parseFloat(String(v));
        if (!isNaN(num)) return num;
      }
    }
    return null;
  };

  // Helper to set value by key/code
  const setVal = (keys: string[], val: number, decimals: number = 1, desc?: string) => {
    const formatted = val.toFixed(decimals);
    for (const k of keys) {
      if (updated[k] !== formatted) {
        updated[k] = formatted;
        changed[k] = formatted;
        if (desc && !messages.includes(desc)) {
          messages.push(desc);
        }
      }
    }
  };

  // -------------------------------------------------------------
  // 1. COMPLETE BLOOD COUNT (CBC) CALCULATIONS
  // -------------------------------------------------------------
  const hb = getVal(['HB', 'Hb', 'p-hb', 'HEMOGLOBIN']);
  const rbc = getVal(['RBC', 'p-rbc', 'RBCs']);
  const hct = getVal(['HCT', 'p-hct', 'PCV', 'p-pcv']);
  const mcv = getVal(['MCV', 'p-mcv']);

  // Calculate HCT if Hb is entered and HCT is missing (Rule of 3) or from RBC & MCV
  if (rbc && mcv && (!hct || hct === 0)) {
    // Hct (%) = (RBC * MCV) / 10
    const calcHct = (rbc * mcv) / 10;
    setVal(['HCT', 'p-hct'], calcHct, 1, `حساب مكداس الدم (HCT = RBC × MCV / 10): ${calcHct.toFixed(1)}%`);
  } else if (hb && (!hct || hct === 0)) {
    const calcHct = hb * 3;
    setVal(['HCT', 'p-hct'], calcHct, 1, `حساب تقديري لمكداس الدم (HCT ≈ Hb × 3): ${calcHct.toFixed(1)}%`);
  }

  // MCV = (Hct * 10) / RBC
  const effectiveHct = getVal(['HCT', 'p-hct', 'PCV', 'p-pcv']);
  if (effectiveHct && rbc && rbc > 0) {
    const calcMcv = (effectiveHct * 10) / rbc;
    // Only auto-calc if not manually set or empty
    const currentMcv = getVal(['MCV', 'p-mcv']);
    if (!currentMcv) {
      setVal(['MCV', 'p-mcv'], calcMcv, 1, `حساب MCV = (Hct × 10) / RBC = ${calcMcv.toFixed(1)} fL`);
    }
  }

  // MCH = (Hb * 10) / RBC
  if (hb && rbc && rbc > 0) {
    const calcMch = (hb * 10) / rbc;
    const currentMch = getVal(['MCH', 'p-mch']);
    if (!currentMch) {
      setVal(['MCH', 'p-mch'], calcMch, 1, `حساب MCH = (Hb × 10) / RBC = ${calcMch.toFixed(1)} pg`);
    }
  }

  // MCHC = (Hb * 100) / Hct
  if (hb && effectiveHct && effectiveHct > 0) {
    const calcMchc = (hb * 100) / effectiveHct;
    const currentMchc = getVal(['MCHC', 'p-mchc']);
    if (!currentMchc) {
      setVal(['MCHC', 'p-mchc'], calcMchc, 1, `حساب MCHC = (Hb × 100) / Hct = ${calcMchc.toFixed(1)} g/dL`);
    }
  }

  // -------------------------------------------------------------
  // 2. LIPID PROFILE (FRIEDEWALD EQUATION & RATIOS)
  // -------------------------------------------------------------
  const chol = getVal(['CHOL', 'p-chol', 'Total Cholesterol']);
  const tg = getVal(['TG', 'p-tg', 'Triglycerides']);
  const hdl = getVal(['HDL', 'p-hdl', 'HDL Cholesterol']);

  if (tg !== null && tg > 0) {
    // VLDL = TG / 5
    const vldl = tg / 5;
    setVal(['VLDL', 'p-vldl', 'VLDL Cholesterol'], vldl, 1, `حساب VLDL = TG / 5 = ${vldl.toFixed(1)} mg/dL`);

    // LDL = Chol - HDL - (TG / 5) (Valid when TG < 400 mg/dL)
    if (chol !== null && hdl !== null) {
      if (tg < 400) {
        const ldl = Math.max(0, chol - hdl - vldl);
        setVal(['LDL', 'p-ldl', 'LDL Cholesterol'], ldl, 1, `حساب معادلة Friedewald: LDL = Chol - HDL - VLDL = ${ldl.toFixed(1)} mg/dL`);
      }
    }
  }

  // Risk Ratios: Chol / HDL
  if (chol !== null && hdl !== null && hdl > 0) {
    const ratio = chol / hdl;
    setVal(['CHOL/HDL', 'p-chol-ratio', 'Chol/HDL Ratio'], ratio, 2, `مؤشر خطورة القلب (Total Chol / HDL) = ${ratio.toFixed(2)}`);
  }

  // LDL / HDL Ratio
  const currentLdl = getVal(['LDL', 'p-ldl', 'LDL Cholesterol']);
  if (currentLdl !== null && hdl !== null && hdl > 0) {
    const ldlHdlRatio = currentLdl / hdl;
    setVal(['LDL/HDL', 'p-ldl-hdl', 'LDL/HDL Ratio'], ldlHdlRatio, 2);
  }

  // Non-HDL = Chol - HDL
  if (chol !== null && hdl !== null) {
    const nonHdl = chol - hdl;
    setVal(['NON-HDL', 'p-non-hdl'], nonHdl, 1);
  }

  // -------------------------------------------------------------
  // 3. GLYCATED HEMOGLOBIN (HbA1c -> eAG)
  // ADAG Formula: eAG (mg/dL) = 28.7 * HbA1c - 46.7
  // -------------------------------------------------------------
  const a1c = getVal(['HbA1c', 'p-a1c', 'HBA1C', 'A1C']);
  if (a1c !== null && a1c > 2.0 && a1c < 25.0) {
    const eag = Math.round(28.7 * a1c - 46.7);
    if (eag > 40) {
      setVal(['eAG', 'p-eag', 'EAG'], eag, 0, `حساب متوسط السكر التقديري (ADAG eAG = 28.7 × ${a1c} - 46.7) = ${eag} mg/dL`);
    }
  }

  // -------------------------------------------------------------
  // 4. HOMA-IR (INSULIN RESISTANCE INDEX)
  // HOMA-IR = (Fasting Glucose mg/dL * Fasting Insulin µIU/mL) / 405
  // -------------------------------------------------------------
  const insFast = getVal(['INS-FAST', 'p-ins-fast', 'INSULIN', 'Insulin']);
  const gluFast = getVal(['GLU-F', 'p-glu-f', 'FBS', 'FASTING-GLUCOSE', 'p-fbs']);

  if (insFast !== null && gluFast !== null && gluFast > 0 && insFast > 0) {
    const homaIr = (gluFast * insFast) / 405;
    setVal(['HOMA-IR', 'p-homa-ir'], homaIr, 2, `حساب مؤشر HOMA-IR = (${gluFast} × ${insFast}) / 405 = ${homaIr.toFixed(2)}`);
  }

  // -------------------------------------------------------------
  // 5. ACR (URINE ALBUMIN / CREATININE RATIO)
  // Microalbumin mg/L and Urine Creatinine mg/dL -> ACR mg/g = (Microalb / Creat) * 100
  // -------------------------------------------------------------
  const malb = getVal(['MALB', 'p-microalb', 'MICROALBUMIN']);
  const uCreat = getVal(['U-CREAT', 'p-u-creat', 'URINE-CREATININE', 'U-CREATININE']);

  if (malb !== null && uCreat !== null && uCreat > 0) {
    // If uCreat is typically 20-300 mg/dL:
    let acr = 0;
    if (uCreat < 10) {
      // It might be in g/L: ACR = MALB / uCreat
      acr = malb / uCreat;
    } else {
      // It is in mg/dL: ACR = (MALB / uCreat) * 100
      acr = (malb / uCreat) * 100;
    }
    setVal(['ACR', 'p-acr', 'U-ACR'], acr, 1, `حساب نسبة الزلال للكرياتينين (ACR = ${acr.toFixed(1)} mg/g)`);
  }

  // -------------------------------------------------------------
  // 6. LIVER FUNCTION TESTS (LFT)
  // Total Bilirubin, Direct Bilirubin -> Indirect Bilirubin
  // Total Protein, Albumin -> Globulin, A/G Ratio
  // -------------------------------------------------------------
  const tbil = getVal(['T-BIL', 'p-tbil', 'Total Bilirubin']);
  const dbil = getVal(['D-BIL', 'p-dbil', 'Direct Bilirubin']);

  if (tbil !== null && dbil !== null) {
    const ibil = Math.max(0, tbil - dbil);
    setVal(['I-BIL', 'p-ibil', 'INDIRECT-BILIRUBIN'], ibil, 2, `حساب الصفراء غير المباشرة (Indirect Bilirubin = Total - Direct = ${ibil.toFixed(2)} mg/dL)`);
  }

  const tp = getVal(['TP', 'p-tp', 'Total Protein']);
  const alb = getVal(['ALB', 'p-alb', 'Serum Albumin']);

  if (tp !== null && alb !== null) {
    const glob = Math.max(0, tp - alb);
    setVal(['GLOB', 'p-glob', 'Globulin'], glob, 2, `حساب الجلوبيولين (Globulin = TP - Albumin = ${glob.toFixed(2)} g/dL)`);

    if (glob > 0) {
      const agRatio = alb / glob;
      setVal(['A/G', 'p-ag-ratio', 'A/G Ratio'], agRatio, 2, `حساب نسبة الألبومين للجلوبيولين (A/G Ratio = ${agRatio.toFixed(2)})`);
    }
  }

  // -------------------------------------------------------------
  // 7. KIDNEY FUNCTION & eGFR
  // BUN / Creatinine Ratio, eGFR (CKD-EPI)
  // -------------------------------------------------------------
  const creat = getVal(['CREAT', 'p-creat', 'Serum Creatinine']);
  const bun = getVal(['BUN', 'p-bun', 'Blood Urea Nitrogen']);
  const age = patientInfo?.age || 40;
  const isFemale = patientInfo?.gender === 'female';

  if (bun !== null && creat !== null && creat > 0) {
    const bunCreatRatio = bun / creat;
    setVal(['BUN/CREAT', 'p-bun-creat'], bunCreatRatio, 1);
  }

  if (creat !== null && creat > 0) {
    // CKD-EPI 2021 formula (race-neutral)
    // eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^-1.200 * 0.9938^Age * (1.012 if female)
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const femaleMultiplier = isFemale ? 1.012 : 1.0;
    const minRatio = Math.min(creat / kappa, 1);
    const maxRatio = Math.max(creat / kappa, 1);

    const egfr = Math.round(
      142 *
        Math.pow(minRatio, alpha) *
        Math.pow(maxRatio, -1.2) *
        Math.pow(0.9938, age) *
        femaleMultiplier
    );

    setVal(['eGFR', 'p-egfr'], egfr, 0, `حساب معدل الترشيح الكبيبي (CKD-EPI eGFR = ${egfr} mL/min/1.73m²)`);
  }

  return {
    updatedMap: updated,
    changedFields: changed,
    messages,
  };
};

/**
 * Checks if a test code is eligible for automated clinical calculations
 */
export const getCalculationCapabilitiesForTest = (testCode: string): string[] => {
  const code = (testCode || '').toUpperCase();
  const caps: string[] = [];

  if (code.includes('CBC')) {
    caps.push('HCT (Hematocrit)', 'MCV (Mean Corpuscular Vol)', 'MCH', 'MCHC');
  }
  if (code.includes('LIPID')) {
    caps.push('VLDL (TG/5)', 'LDL (Friedewald: Chol - HDL - VLDL)', 'Chol/HDL Ratio');
  }
  if (code.includes('HBA1C') || code.includes('A1C')) {
    caps.push('eAG (Estimated Average Glucose = 28.7 × A1c - 46.7)');
  }
  if (code.includes('HOMA') || code.includes('INSULIN')) {
    caps.push('HOMA-IR (Insulin Resistance = Glucose × Insulin / 405)');
  }
  if (code.includes('ACR') || code.includes('MICROALB')) {
    caps.push('ACR (Albumin / Creatinine Ratio)');
  }
  if (code.includes('LFT') || code.includes('LIVER')) {
    caps.push('Indirect Bilirubin', 'Globulin (TP - Albumin)', 'A/G Ratio');
  }
  if (code.includes('KFT') || code.includes('KIDNEY') || code.includes('RENAL')) {
    caps.push('eGFR (CKD-EPI)', 'BUN / Creatinine Ratio');
  }

  return caps;
};
