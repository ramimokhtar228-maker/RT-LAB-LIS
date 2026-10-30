/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Clinical Decision Support (CDS) Engine
 * Implements evidence-based clinical pathology decision rules, multi-parameter pattern recognition,
 * differential diagnostic considerations, and prioritized follow-up recommendations.
 */

import { PatientRecord, PatientTestResult, TestCatalogItem } from '../types/lab';

export interface ProfileClinicalInsight {
  profileCode: string;
  profileName: string;
  hasAbnormalities: boolean;
  hasCritical: boolean;
  abnormalTests: Array<{
    code: string;
    name: string;
    value: string;
    flag: string;
    unit: string;
    refRange: string;
  }>;
  suggestedInterpretation: string;
  recommendedFollowUpTests: string[];
  diagnosticClues: string[];
}

export function analyzeProfileClinicalCds(
  profileCode: string,
  profileTests: TestCatalogItem[],
  results: Record<string, PatientTestResult>,
  patient: PatientRecord
): ProfileClinicalInsight {
  const abnormalTests: ProfileClinicalInsight['abnormalTests'] = [];
  let hasCritical = false;

  profileTests.forEach((t) => {
    const res = results[t.code];
    if (res && res.value && res.value.trim() !== '') {
      if (res.flag === 'HIGH' || res.flag === 'LOW' || res.flag === 'PANIC_HIGH' || res.flag === 'PANIC_LOW') {
        abnormalTests.push({
          code: t.code,
          name: t.name,
          value: res.value,
          flag: res.flag,
          unit: res.unit,
          refRange: res.refRangeText,
        });
      }
      if (res.flag === 'PANIC_HIGH' || res.flag === 'PANIC_LOW') {
        hasCritical = true;
      }
    }
  });

  const getNum = (code: string): number | null => {
    const val = results[code]?.value;
    if (!val) return null;
    const n = parseFloat(String(val).trim());
    return isNaN(n) ? null : n;
  };

  const recommendedTestsSet = new Set<string>();
  const diagnosticClues: string[] = [];
  let suggestedInterpretation = '';

  const norm = (str: string) => str.toUpperCase().trim();
  const code = norm(profileCode);

  // 1. COMPLETE BLOOD COUNT (CBC)
  if (code === 'CBC' || code.includes('HEM')) {
    const hgb = getNum('HGB');
    const mcv = getNum('MCV');
    const mch = getNum('MCH');
    const rdw = getNum('RDW');
    const rbc = getNum('RBC');
    const wbc = getNum('WBC');
    const plt = getNum('PLT');
    const neutPct = getNum('NEUT_PCT');
    const lymphPct = getNum('LYMPH_PCT');
    const eosPct = getNum('EOS_PCT');

    const isAnemic = hgb !== null && (patient.gender === 'Female' ? hgb < 12.0 : hgb < 13.5);

    if (isAnemic) {
      if (mcv !== null && mcv < 80) {
        // Microcytic
        const mentzer = rbc && rbc > 0 ? mcv / rbc : null;
        if (mentzer !== null && mentzer < 13) {
          diagnosticClues.push(`Mentzer Index is ${mentzer.toFixed(1)} (< 13): Suggestive of Beta-Thalassemia Trait.`);
          suggestedInterpretation = `Microcytic hypochromic red cell picture (Hgb: ${hgb} g/dL, MCV: ${mcv} fL). Mentzer Index (${mentzer.toFixed(1)}) favors Thalassemia minor/trait over iron deficiency. Hemoglobin electrophoresis and iron panel are recommended for definitive differentiation.`;
          recommendedTestsSet.add('HB_ELECT');
          recommendedTestsSet.add('FERRITIN');
          recommendedTestsSet.add('IRON');
          recommendedTestsSet.add('TIBC');
        } else {
          diagnosticClues.push(`Microcytic Hypochromic Anemia with elevated RDW (${rdw || 'elevated'}%): Typical for Iron Deficiency.`);
          suggestedInterpretation = `Microcytic hypochromic anemia (Hgb: ${hgb} g/dL, MCV: ${mcv} fL, MCH: ${mch || '-'} pg). Findings are highly consistent with Iron Deficiency Anemia. Evaluation of iron stores and occult GI blood loss is advised.`;
          recommendedTestsSet.add('FERRITIN');
          recommendedTestsSet.add('IRON');
          recommendedTestsSet.add('TIBC');
          recommendedTestsSet.add('STOOL_OB');
          recommendedTestsSet.add('RETIC');
        }
      } else if (mcv !== null && mcv > 100) {
        diagnosticClues.push(`Macrocytic Anemia (MCV: ${mcv} fL): Vitamin B12 or Folate deficiency consideration.`);
        suggestedInterpretation = `Macrocytic anemia with elevated MCV (${mcv} fL). Differential diagnosis includes Megaloblastic anemia (Vitamin B12 / Folate deficiency), chronic liver disease, or reticulocytosis.`;
        recommendedTestsSet.add('VIT_B12');
        recommendedTestsSet.add('FOLATE');
        recommendedTestsSet.add('LDH');
        recommendedTestsSet.add('RETIC');
      } else {
        suggestedInterpretation = `Normocytic normochromic anemia (Hgb: ${hgb} g/dL). Suggests anemia of chronic disease, acute blood loss, early nutritional deficiency, or mild renal impairment.`;
        recommendedTestsSet.add('FERRITIN');
        recommendedTestsSet.add('RETIC');
        recommendedTestsSet.add('CRP_QUANT');
        recommendedTestsSet.add('CREAT');
      }
    }

    if (wbc !== null) {
      if (wbc > 11.0) {
        if (neutPct && neutPct > 75) {
          diagnosticClues.push(`Leukocytosis with absolute neutrophilia (${neutPct}%): Acute bacterial infection or systemic inflammatory response.`);
          if (!suggestedInterpretation) {
            suggestedInterpretation = `Marked leukocytosis (${wbc} x10^3/µL) with predominant neutrophilia (${neutPct}%). Suggestive of acute bacterial infection or acute tissue inflammation.`;
          } else {
            suggestedInterpretation += ` Concomitant neutrophilic leukocytosis (${wbc} x10^3/µL) indicates active systemic inflammatory or infectious process.`;
          }
          recommendedTestsSet.add('CRP_QUANT');
          recommendedTestsSet.add('ESR');
          recommendedTestsSet.add('PROCAL');
        } else if (lymphPct && lymphPct > 45) {
          diagnosticClues.push(`Leukocytosis with relative lymphocytosis (${lymphPct}%): Viral infection or convalescent phase.`);
          suggestedInterpretation += ` Leukocytosis with lymphocytosis (${lymphPct}%) favors acute viral infection or immune reactivity.`;
          recommendedTestsSet.add('CRP_QUANT');
          recommendedTestsSet.add('PERIPH_SMEAR');
        }
      } else if (wbc < 4.0) {
        diagnosticClues.push(`Leukopenia (${wbc} x10^3/µL): Viral etiology, bone marrow suppression, or autoimmune effect.`);
        suggestedInterpretation += ` Leukopenia (${wbc} x10^3/µL) noted; viral etiology or bone marrow suppression should be clinically correlated.`;
        recommendedTestsSet.add('PERIPH_SMEAR');
        recommendedTestsSet.add('CRP_QUANT');
      }
    }

    if (plt !== null) {
      if (plt < 150) {
        diagnosticClues.push(`Thrombocytopenia (PLT: ${plt} x10^3/µL): Check peripheral smear to rule out EDTA pseudothrombocytopenia.`);
        suggestedInterpretation += ` Mild-to-moderate thrombocytopenia (${plt} x10^3/µL). Peripheral blood smear review recommended to confirm true thrombocytopenia.`;
        recommendedTestsSet.add('PERIPH_SMEAR');
        recommendedTestsSet.add('COAG');
        recommendedTestsSet.add('PT');
      } else if (plt > 450) {
        diagnosticClues.push(`Thrombocytosis (PLT: ${plt} x10^3/µL): Reactive inflammatory response vs myeloproliferative process.`);
        recommendedTestsSet.add('CRP_QUANT');
        recommendedTestsSet.add('FERRITIN');
      }
    }

    if (!suggestedInterpretation && abnormalTests.length === 0) {
      suggestedInterpretation = 'Normocytic normochromic red cell indices within physiological reference intervals. White blood cell count and differential show no quantitative abnormalities. Preserved platelet count with normal morphology.';
    }
  }

  // 2. LIVER FUNCTION TESTS (LFT)
  else if (code === 'LFT' || code.includes('LIVER') || code.includes('HEPAT')) {
    const alt = getNum('ALT');
    const ast = getNum('AST');
    const alp = getNum('ALP');
    const ggt = getNum('GGT');
    const tbil = getNum('TBIL');
    const dbil = getNum('DBIL');
    const alb = getNum('ALB');

    const isAltHigh = alt !== null && alt > 50;
    const isAstHigh = ast !== null && ast > 45;
    const isAlpHigh = alp !== null && alp > 130;
    const isBiliHigh = tbil !== null && tbil > 1.2;

    if (isAltHigh || isAstHigh) {
      const deRitis = alt && alt > 0 && ast ? ast / alt : 1;
      if (deRitis > 2.0) {
        diagnosticClues.push(`De Ritis ratio (AST/ALT) = ${deRitis.toFixed(1)} (> 2.0): Suggestive of alcoholic hepatitis or advanced fibrotic liver disease.`);
        suggestedInterpretation = `Transaminitis with prominent AST elevation over ALT (De Ritis ratio: ${deRitis.toFixed(1)}). Pattern is suspicious for alcohol-induced hepatic injury or advanced parenchymal fibrosis.`;
        recommendedTestsSet.add('GGT');
        recommendedTestsSet.add('FIB4');
        recommendedTestsSet.add('US_ABD');
        recommendedTestsSet.add('AFP');
      } else if (alt > 300) {
        diagnosticClues.push(`Marked acute hepatocellular necrosis (ALT > 300 U/L): Viral hepatitis or toxic/ischemic injury.`);
        suggestedInterpretation = `Marked acute hepatocellular transaminase elevation (ALT: ${alt} U/L). Strongly indicates acute viral hepatitis, toxic/drug-induced hepatotoxicity, or ischemic liver injury. Urgent viral serology indicated.`;
        recommendedTestsSet.add('HBSAG');
        recommendedTestsSet.add('HCV_AB');
        recommendedTestsSet.add('HAV_IGM');
        recommendedTestsSet.add('US_ABD');
      } else {
        diagnosticClues.push(`Mild hepatocellular injury (ALT > AST): Consistent with metabolic dysfunction steatotic liver disease (MASLD/NASH) or early viral hepatitis.`);
        suggestedInterpretation = `Mild-to-moderate hepatocellular enzyme elevation (ALT: ${alt} U/L, AST: ${ast} U/L) with ALT predominance. Findings frequently correlate with metabolic steatotic liver disease (fatty liver), medication effect, or early viral hepatitis.`;
        recommendedTestsSet.add('HBSAG');
        recommendedTestsSet.add('HCV_AB');
        recommendedTestsSet.add('LIPID');
        recommendedTestsSet.add('US_ABD');
      }
    }

    if (isAlpHigh || (ggt !== null && ggt > 55)) {
      diagnosticClues.push(`Cholestatic biliary pattern: Elevated ALP (${alp} U/L) and GGT (${ggt || '-'} U/L).`);
      if (!suggestedInterpretation) {
        suggestedInterpretation = `Biochemical profile demonstrates a cholestatic pattern with elevated Alkaline Phosphatase and GGT. Biliary tree ultrasonography is advised to rule out intra- or extra-hepatic duct obstruction.`;
      } else {
        suggestedInterpretation += ` Concomitant cholestatic enzyme elevation (ALP: ${alp} U/L) suggests biliary involvement.`;
      }
      recommendedTestsSet.add('GGT');
      recommendedTestsSet.add('US_ABD');
      recommendedTestsSet.add('AMYLASE');
    }

    if (isBiliHigh) {
      if (dbil !== null && dbil > 0.4) {
        diagnosticClues.push(`Conjugated hyperbilirubinemia: Direct bilirubin is elevated (${dbil} mg/dL).`);
        recommendedTestsSet.add('US_ABD');
        recommendedTestsSet.add('GGT');
      }
    }

    if (alb !== null && alb < 3.5) {
      diagnosticClues.push(`Hypoalbuminemia (${alb} g/dL): Reduced hepatic synthetic capacity, nephrotic loss, or malnutrition.`);
      recommendedTestsSet.add('MICROALB');
      recommendedTestsSet.add('URINE_PCR');
    }

    if (!suggestedInterpretation && abnormalTests.length === 0) {
      suggestedInterpretation = 'Normal hepatocellular enzymes (ALT & AST) with physiological total and direct bilirubin fractions. Preserved hepatic synthetic capacity (Albumin and Total Protein).';
    }
  }

  // 3. KIDNEY FUNCTION TESTS (KFT)
  else if (code === 'KFT' || code.includes('RENAL') || code.includes('KIDNEY')) {
    const creat = getNum('CREAT');
    const urea = getNum('UREA');
    const bun = getNum('BUN') || (urea ? urea / 2.14 : null);
    const egfr = getNum('EGFR');
    const ua = getNum('URIC');

    if (creat !== null && creat > 1.2) {
      const stageText = egfr !== null ? (
        egfr >= 90 ? 'Stage 1 (Normal or High)' :
        egfr >= 60 ? 'Stage 2 (Mildly Decreased)' :
        egfr >= 45 ? 'Stage 3a (Mild-to-Moderate)' :
        egfr >= 30 ? 'Stage 3b (Moderate-to-Severe)' :
        egfr >= 15 ? 'Stage 4 (Severely Decreased)' :
        'Stage 5 (Kidney Failure)'
      ) : '';

      diagnosticClues.push(`Elevated Serum Creatinine (${creat} mg/dL) with eGFR ${egfr ? egfr + ' mL/min/1.73m²' : 'reduced'}: CKD ${stageText}`);
      suggestedInterpretation = `Impaired renal filtration capacity evidenced by elevated Serum Creatinine (${creat} mg/dL) and estimated GFR of ${egfr || 'reduced'} mL/min/1.73m² (${stageText}). Nephrological assessment, urine albumin-to-creatinine ratio, and renal duplex imaging are recommended.`;
      recommendedTestsSet.add('MICROALB');
      recommendedTestsSet.add('URINE_PCR');
      recommendedTestsSet.add('US_RENAL');
      recommendedTestsSet.add('K');
      recommendedTestsSet.add('NA');
    } else if (bun !== null && creat !== null && creat > 0) {
      const bunCrRatio = bun / creat;
      if (bunCrRatio > 20) {
        diagnosticClues.push(`BUN/Creatinine Ratio = ${bunCrRatio.toFixed(1)} (> 20:1): Prerenal azotemia / Dehydration.`);
        suggestedInterpretation = `Disproportionate blood urea elevation relative to serum creatinine (BUN/Cr ratio: ${bunCrRatio.toFixed(1)}). Suggestive of prerenal volume depletion, dehydration, high-protein intake, or upper gastrointestinal bleeding.`;
        recommendedTestsSet.add('NA');
        recommendedTestsSet.add('K');
        recommendedTestsSet.add('URINE_R_E');
      }
    }

    if (ua !== null && ua > 7.0) {
      diagnosticClues.push(`Hyperuricemia (Serum Uric Acid: ${ua} mg/dL): Risk of gouty arthritis or renal urate nephropathy.`);
      recommendedTestsSet.add('URINE_R_E');
    }

    if (!suggestedInterpretation && abnormalTests.length === 0) {
      suggestedInterpretation = 'Normal serum creatinine and blood urea with preserved estimated glomerular filtration rate (eGFR > 90 mL/min/1.73m²). Physiological renal excretory and filtration integrity.';
    }
  }

  // 4. LIPID PROFILE
  else if (code === 'LIPID' || code.includes('CHOLEST')) {
    const chol = getNum('CHOL');
    const tg = getNum('TG');
    const ldl = getNum('LDL');
    const hdl = getNum('HDL');

    if (tg !== null && tg > 500) {
      diagnosticClues.push(`Severe Hypertriglyceridemia (TG: ${tg} mg/dL): Elevated risk of acute pancreatitis!`);
      suggestedInterpretation = `CRITICAL ALERT: Severe hypertriglyceridemia (${tg} mg/dL) significantly increases acute pancreatitis risk. Immediate lifestyle intervention, medical therapy, and pancreatic enzyme surveillance are indicated.`;
      recommendedTestsSet.add('AMYLASE');
      recommendedTestsSet.add('LIPASE');
      recommendedTestsSet.add('HBA1C');
      recommendedTestsSet.add('TSH');
    } else if ((chol !== null && chol > 200) || (ldl !== null && ldl > 130) || (tg !== null && tg > 150)) {
      diagnosticClues.push(`Atherogenic dyslipidemia: Elevated LDL (${ldl || '-'} mg/dL) or Triglycerides (${tg || '-'} mg/dL).`);
      suggestedInterpretation = `Atherogenic lipid profile characterized by elevated ${ldl && ldl > 130 ? 'LDL Cholesterol (' + ldl + ' mg/dL)' : ''} ${tg && tg > 150 ? 'and Triglycerides (' + tg + ' mg/dL)' : ''}. Lifestyle optimization and cardiovascular 10-year risk stratification recommended.`;
      recommendedTestsSet.add('HBA1C');
      recommendedTestsSet.add('ALT');
      recommendedTestsSet.add('TSH');
      recommendedTestsSet.add('HS_CRP');
      recommendedTestsSet.add('APO_B');
    }

    if (!suggestedInterpretation && abnormalTests.length === 0) {
      suggestedInterpretation = 'Optimal lipid profile with Total Cholesterol, LDL, and Triglycerides within cardiovascular target ranges. Preserved cardioprotective HDL level.';
    }
  }

  // 5. THYROID PROFILE (TFT)
  else if (code === 'TFT' || code.includes('THYROID')) {
    const tsh = getNum('TSH');
    const ft4 = getNum('FT4');

    if (tsh !== null) {
      if (tsh > 4.5) {
        if (ft4 !== null && ft4 < 0.8) {
          diagnosticClues.push(`Primary Overt Hypothyroidism: Elevated TSH (${tsh} µIU/mL) with decreased Free T4 (${ft4} ng/dL).`);
          suggestedInterpretation = `Primary overt hypothyroidism confirmed with elevated TSH (${tsh} µIU/mL) and low Free T4 (${ft4} ng/dL). Anti-TPO antibody testing advised to evaluate for Hashimoto's thyroiditis.`;
          recommendedTestsSet.add('ANTI_TPO');
          recommendedTestsSet.add('ANTI_TG');
          recommendedTestsSet.add('LIPID');
          recommendedTestsSet.add('CBC');
        } else {
          diagnosticClues.push(`Subclinical Hypothyroidism: Elevated TSH (${tsh} µIU/mL) with normal Free T4.`);
          suggestedInterpretation = `Subclinical hypothyroidism pattern with elevated TSH (${tsh} µIU/mL) and preserved Free T4. Repeat thyroid panel in 6-12 weeks and check Anti-TPO antibodies.`;
          recommendedTestsSet.add('ANTI_TPO');
          recommendedTestsSet.add('LIPID');
        }
      } else if (tsh < 0.3) {
        diagnosticClues.push(`Hyperthyroidism / Thyrotoxicosis: Suppressed TSH (${tsh} µIU/mL).`);
        suggestedInterpretation = `Suppressed serum TSH (${tsh} µIU/mL) suggestive of thyrotoxicosis or exogenous thyroid hormone suppression. Thyroid ultrasound and TSH receptor antibodies (TRAB) recommended.`;
        recommendedTestsSet.add('FREE_T3');
        recommendedTestsSet.add('TRAB');
        recommendedTestsSet.add('US_THYROID');
      }
    }

    if (!suggestedInterpretation && abnormalTests.length === 0) {
      suggestedInterpretation = 'Euthyroid state confirmed with physiological pituitary TSH and peripheral Free T4 within laboratory diagnostic reference intervals.';
    }
  }

  // 6. DIABETES & METABOLISM
  else if (code === 'DIABETES' || code.includes('GLYC') || code.includes('SUGAR')) {
    const fbg = getNum('FBG');
    const hba1c = getNum('HBA1C');
    const ppbg = getNum('PPBG');

    if ((fbg !== null && fbg >= 126) || (hba1c !== null && hba1c >= 6.5)) {
      diagnosticClues.push(`Diabetic range glycemia (FBG: ${fbg || '-'} mg/dL, HbA1c: ${hba1c || '-'}%): ADA 2024/2026 criteria.`);
      suggestedInterpretation = `Glycemic parameters meet diagnostic thresholds for Diabetes Mellitus (FBG: ${fbg || '-'} mg/dL, HbA1c: ${hba1c || '-'}%). Microvascular complication screening (microalbuminuria and retinal examination) and glycemic control plan recommended.`;
      recommendedTestsSet.add('MICROALB');
      recommendedTestsSet.add('LIPID');
      recommendedTestsSet.add('EGFR');
      recommendedTestsSet.add('C_PEPTIDE');
    } else if ((fbg !== null && fbg >= 100) || (hba1c !== null && hba1c >= 5.7)) {
      diagnosticClues.push(`Pre-diabetes / Impaired Fasting Glucose (FBG: ${fbg || '-'} mg/dL, HbA1c: ${hba1c || '-'}%).`);
      suggestedInterpretation = `Impaired fasting glycemia / pre-diabetic state. Lifestyle intervention, dietary counseling, and metabolic monitoring are strongly indicated.`;
      recommendedTestsSet.add('HOMA_IR');
      recommendedTestsSet.add('LIPID');
    }

    if (!suggestedInterpretation && abnormalTests.length === 0) {
      suggestedInterpretation = 'Normal fasting glycemic regulation with physiological glycated hemoglobin (HbA1c < 5.7%). Preserved insulin sensitivity.';
    }
  }

  // 7. COAGULATION PROFILE
  else if (code === 'COAG' || code.includes('COAG')) {
    const inr = getNum('INR');
    const pt = getNum('PT');
    const aptt = getNum('APTT');

    if (inr !== null && inr > 1.3) {
      diagnosticClues.push(`Prolonged INR (${inr}): Bleeding tendency, oral anticoagulant effect, or liver dysfunction.`);
      suggestedInterpretation = `Prolonged Prothrombin Time with elevated INR (${inr}). If patient is not on oral anticoagulant therapy, investigate hepatic synthetic impairment, Vitamin K deficiency, or factor VII deficiency.`;
      recommendedTestsSet.add('LFT');
      recommendedTestsSet.add('FIBRINOGEN');
      recommendedTestsSet.add('CBC');
    }

    if (aptt !== null && aptt > 38) {
      diagnosticClues.push(`Prolonged APTT (${aptt} sec): Intrinsic coagulation pathway anomaly.`);
      suggestedInterpretation += ` Prolonged Activated Partial Thromboplastin Time (${aptt} s). Mixing study and lupus anticoagulant workup recommended.`;
      recommendedTestsSet.add('MIXING_STUDY');
      recommendedTestsSet.add('LUPUS_AC');
    }

    if (!suggestedInterpretation && abnormalTests.length === 0) {
      suggestedInterpretation = 'Normal extrinsic and intrinsic coagulation pathways. Prothrombin Time (PT), INR, and APTT are within safe physiological hemostatic limits.';
    }
  }

  // DEFAULT / GENERAL FOR OTHER PROFILES
  if (!suggestedInterpretation) {
    if (abnormalTests.length > 0) {
      const names = abnormalTests.map((a) => `${a.name} (${a.value} ${a.unit} [${a.flag}])`).join(', ');
      suggestedInterpretation = `Notable laboratory variations identified: ${names}. Clinical correlation with patient symptomatology, medical history, and recommended follow-up tests is advised.`;
    } else {
      suggestedInterpretation = `All evaluated parameters in this clinical investigation panel fall within standardized physiological reference intervals. Findings correlate with normal biological baseline.`;
    }
  }

  return {
    profileCode,
    profileName: profileCode,
    hasAbnormalities: abnormalTests.length > 0,
    hasCritical,
    abnormalTests,
    suggestedInterpretation,
    recommendedFollowUpTests: Array.from(recommendedTestsSet),
    diagnosticClues,
  };
}
