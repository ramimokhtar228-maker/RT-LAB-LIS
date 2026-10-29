import { DiagnosticGuidanceItem } from '../types/lab';

export const DEFAULT_DIAGNOSTIC_PHRASES: DiagnosticGuidanceItem[] = [
  // ================= CBC PROFILES =================
  {
    id: 'cbc-phrase-1',
    profileCode: 'CBC',
    title: 'صورة دم طبيعية تماماً (Normal Hemogram)',
    statement: 'Normocytic normochromic red cell indices within physiological reference ranges. White blood cell count and differential show no quantitative abnormalities. Adequate platelet count with preserved morphology.',
    suggestedTestCodes: [],
  },
  {
    id: 'cbc-phrase-2',
    profileCode: 'CBC',
    title: 'أنيميا نقص الحديد المحتملة (Microcytic Hypochromic)',
    statement: 'Microcytic hypochromic red blood cell picture with decreased MCV and MCH, elevated RDW suggestive of anisocytosis (consistent with iron deficiency anemia vs. beta thalassemia trait).',
    suggestedTestCodes: ['FERRITIN', 'IRON', 'TIBC', 'STOOL_OB', 'HB_ELECT'],
  },
  {
    id: 'cbc-phrase-3',
    profileCode: 'CBC',
    title: 'أنيميا كبيرة الخلايا (Macrocytosis)',
    statement: 'Macrocytic red cell picture with elevated MCV (> 100 fL). Suggestive of megaloblastic process (Vitamin B12 / Folate deficiency) or chronic alcohol/liver effect. Serum B12 and Folate assays are recommended.',
    suggestedTestCodes: ['VIT_B12', 'FOLATE', 'LDH', 'RETIC'],
  },
  {
    id: 'cbc-phrase-4',
    profileCode: 'CBC',
    title: 'ارتفاع كرات الدم البيضاء التفاعلي (Neutrophilic Leukocytosis)',
    statement: 'Moderate leukocytosis with absolute neutrophilia and left shift. Findings are consistent with acute bacterial infection, systemic inflammatory response, or severe tissue stress.',
    suggestedTestCodes: ['CRP_QUANT', 'ESR', 'PROC', 'BLOOD_CULT'],
  },
  {
    id: 'cbc-phrase-5',
    profileCode: 'CBC',
    title: 'نقص كرات الدم البيضاء الفيروسي (Leukopenia / Viral)',
    statement: 'Mild leukopenia with relative lymphocytosis. Pattern is suggestive of acute or convalescent viral etiology. Clinical and serological correlation advised.',
    suggestedTestCodes: ['CRP_QUANT', 'ESR', 'MONO_SPOT', 'IGM_VIRAL'],
  },
  {
    id: 'cbc-phrase-6',
    profileCode: 'CBC',
    title: 'نقص الصفائح الدموية (Thrombocytopenia)',
    statement: 'Moderate thrombocytopenia confirmed on peripheral blood film. No automated platelet clumping observed. Platelet immunology and coagulation workup recommended if symptomatic.',
    suggestedTestCodes: ['COAG', 'PT', 'PTT', 'MPV', 'ANA'],
  },

  // ================= LIVER FUNCTION (LFT) =================
  {
    id: 'lft-phrase-1',
    profileCode: 'LFT',
    title: 'وظائف كبد طبيعية (Normal Hepatic Profile)',
    statement: 'Normal hepatocellular transaminases (ALT & AST) with physiological total and direct bilirubin. Preserved hepatic synthetic function (Albumin and Total Protein).',
    suggestedTestCodes: [],
  },
  {
    id: 'lft-phrase-2',
    profileCode: 'LFT',
    title: 'التهاب كبدي نشط مع ارتفاع الإنزيمات (Transaminitis)',
    statement: 'Hepatocellular pattern with predominant elevation of ALT over AST. Suggestive of acute or subacute viral hepatitis, metabolic dysfunction-associated steatohepatitis (MASH/NASH), or drug-induced hepatotoxicity.',
    suggestedTestCodes: ['HBSAG', 'HCV_AB', 'US_ABD', 'LIPID', 'GGT'],
  },
  {
    id: 'lft-phrase-3',
    profileCode: 'LFT',
    title: 'نمط ركود صفراوي (Cholestatic Pattern)',
    statement: 'Prominent cholestatic biochemical profile with elevated Alkaline Phosphatase (ALP) and GGT, accompanied by conjugated direct hyperbilirubinemia. Biliary tract ultrasonography is indicated.',
    suggestedTestCodes: ['GGT', 'ALP_ISO', 'US_BILIARY', 'AMYLASE'],
  },
  {
    id: 'lft-phrase-4',
    profileCode: 'LFT',
    title: 'كبد دهني وأيضي (Metabolic Steatosis / Fatty Liver)',
    statement: 'Mild isolated transaminase elevation accompanied by dyslipidemia and impaired fasting glucose. Findings align with metabolic steatohepatitis. Lifestyle modification and liver elastography/ultrasound advised.',
    suggestedTestCodes: ['HOMA_IR', 'LIPID', 'US_ABD', 'FIB4'],
  },

  // ================= KIDNEY FUNCTION (KFT) =================
  {
    id: 'kft-phrase-1',
    profileCode: 'KFT',
    title: 'وظائف كلى ممتازة (Normal Renal Function)',
    statement: 'Normal serum creatinine, blood urea, and estimated glomerular filtration rate (eGFR > 90 mL/min/1.73m²). Preserved renal excretory capacity and physiological electrolyte balance.',
    suggestedTestCodes: [],
  },
  {
    id: 'kft-phrase-2',
    profileCode: 'KFT',
    title: 'ارتفاع اليوريا قبل الكلوي / جفاف (Prerenal Azotemia)',
    statement: 'Disproportionate elevation of blood urea relative to serum creatinine (BUN/Cr ratio > 20). Suggests prerenal azotemia, extracellular volume depletion (dehydration), high-protein intake, or upper GI bleeding.',
    suggestedTestCodes: ['NA', 'K', 'URINE_R_E', 'URINE_OSM'],
  },
  {
    id: 'kft-phrase-3',
    profileCode: 'KFT',
    title: 'قصور في وظائف الكلى (Renal Impairment)',
    statement: 'Reduced glomerular filtration rate with elevated serum creatinine and urea. Suggestive of intrinsic renal compromise. Nephrology evaluation, 24-hour urine protein, and renal duplex advised.',
    suggestedTestCodes: ['MICROALB', 'URINE_PCR', 'US_RENAL', 'K', 'NA'],
  },
  {
    id: 'kft-phrase-4',
    profileCode: 'KFT',
    title: 'ارتفاع حمض البوليك / نقرس (Hyperuricemia)',
    statement: 'Elevated serum uric acid level. Clinical correlation for gouty arthritis, nephrolithiasis, or metabolic syndrome is recommended.',
    suggestedTestCodes: ['URIC_URINE', 'CREAT', 'LIPID'],
  },

  // ================= LIPID PROFILE =================
  {
    id: 'lipid-phrase-1',
    profileCode: 'LIPID',
    title: 'ملف دهون مثالي وقائي (Optimal Lipid Panel)',
    statement: 'Desirable serum cholesterol, optimal LDL-C (< 100 mg/dL), normal triglycerides, and protective HDL-C levels. Low calculated atherogenic cardiovascular risk.',
    suggestedTestCodes: [],
  },
  {
    id: 'lipid-phrase-2',
    profileCode: 'LIPID',
    title: 'خلل شحمي مختلط (Mixed Atherogenic Dyslipidemia)',
    statement: 'Atherogenic dyslipidemia characterized by elevated Total Cholesterol, elevated LDL-C, and hypertriglyceridemia with increased Non-HDL and Total/HDL ratio. Dietary and lipid-lowering intervention advised.',
    suggestedTestCodes: ['HBA1C', 'ALT', 'TSH', 'APO_B', 'HS_CRP'],
  },

  // ================= DIABETES & METABOLISM =================
  {
    id: 'dia-phrase-1',
    profileCode: 'DIABETES',
    title: 'مرحلة مقدمات السكري (Prediabetes / Impaired Fasting)',
    statement: 'Fasting blood glucose and/or HbA1c lie within the prediabetes interval (HbA1c 5.7 - 6.4%). Suggestive of early peripheral insulin resistance. Intensive lifestyle and nutritional counseling indicated.',
    suggestedTestCodes: ['HOMA_IR', 'LIPID', 'MICROALB'],
  },
  {
    id: 'dia-phrase-2',
    profileCode: 'DIABETES',
    title: 'داء السكري غير المنضبط (Uncontrolled Diabetes Mellitus)',
    statement: 'Marked hyperglycemia and elevated HbA1c (>= 6.5%) indicating suboptimally controlled diabetes mellitus. Diabetic screening for microvascular and macrovascular complications is advised.',
    suggestedTestCodes: ['MICROALB', 'EGFR', 'LIPID', 'URINE_GLU'],
  },

  // ================= THYROID PROFILE =================
  {
    id: 'tft-phrase-1',
    profileCode: 'TFT',
    title: 'وظائف غدة درقية طبيعية (Euthyroid Status)',
    statement: 'Normal ultra-sensitive TSH with physiological Free T4 and Free T3 levels, confirming euthyroid endocrine status.',
    suggestedTestCodes: [],
  },
  {
    id: 'tft-phrase-2',
    profileCode: 'TFT',
    title: 'قصور الغدة الدرقية الأولي (Primary Hypothyroidism)',
    statement: 'Elevated serum TSH with subnormal/low Free T4, consistent with primary hypothyroidism. Thyroid autoimmunity evaluation (Anti-TPO antibodies) and clinical endocrinology consultation advised.',
    suggestedTestCodes: ['ANTI_TPO', 'ANTI_TG', 'LIPID', 'US_THYROID'],
  },
  {
    id: 'tft-phrase-3',
    profileCode: 'TFT',
    title: 'نشاط الغدة الدرقية الزائد (Hyperthyroidism / Thyrotoxicosis)',
    statement: 'Markedly suppressed TSH (< 0.05 µIU/mL) with elevated Free T4 and Free T3 levels. Pattern is diagnostic of thyrotoxicosis/hyperthyroidism.',
    suggestedTestCodes: ['TRAb', 'US_THYROID', 'CBC', 'LFT'],
  },

  // ================= URINALYSIS =================
  {
    id: 'uri-phrase-1',
    profileCode: 'URINALYSIS',
    title: 'فحص بول روتيني سليم (Normal Urinalysis)',
    statement: 'Clear straw-colored urine with normal specific gravity and pH. Absence of pathological proteinuria, glucosuria, or ketonuria. Microscopic examination demonstrates no significant pus cells, casts, or erythrocytes.',
    suggestedTestCodes: [],
  },
  {
    id: 'uri-phrase-2',
    profileCode: 'URINALYSIS',
    title: 'التهاب المسالك البولية والصديد (Active UTI / Pyuria)',
    statement: 'Urinary tract infection pattern with marked pyuria (> 20-30 WBCs/HPF), positive leukocyte esterase, and presence of bacteriuria. Clean-catch urine culture and antimicrobial sensitivity are advised.',
    suggestedTestCodes: ['URINE_C_S', 'KFT', 'US_KUB'],
  },
  {
    id: 'uri-phrase-3',
    profileCode: 'URINALYSIS',
    title: 'بيلة دموية مجهرية (Microscopic Hematuria)',
    statement: 'Microscopic hematuria with intact red blood cells. Further urological evaluation, ultrasound of urinary tract, and renal profile recommended to rule out lithiasis or glomerulopathy.',
    suggestedTestCodes: ['US_KUB', 'CREAT', 'URINE_CYTO'],
  },
];
