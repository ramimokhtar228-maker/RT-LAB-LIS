export type AgeUnit = 'سنوات' | 'شهور' | 'أيام';
export type Gender = 'male' | 'female';

export type ReferringDoctorSelection = 'Prof dr' | 'Herself' | 'Himself' | string;

export interface Patient {
  id: string;
  nationalId: string;
  name: string;
  age: number;
  ageUnit: AgeUnit;
  gender: Gender;
  phone: string;
  address?: string;
  referringDoctor?: string;
  referringDoctorType?: 'Prof dr' | 'Herself' | 'Himself' | 'other';
  medicalHistory?: string;
  registeredAt: string;
}

export type SpecimenType = 
  | 'دم كامل (Whole Blood)' 
  | 'مصل (Serum)' 
  | 'بلازما (Plasma)' 
  | 'بلازما سترات (Citrate Plasma)'
  | 'عينة بول (Urine)' 
  | 'عينة براز (Stool)' 
  | 'مسحة حلق/أنف (Swab)'
  | 'سائل منوي (Semen)'
  | 'سائل نخاعي (CSF)';

export interface ReferenceRangeLine {
  label: string; // e.g., "الذكور (Males)", "الإناث (Females)", "Follicular Phase", "Postmenopausal", "Negative", "Equivocal", "Positive"
  range: string; // e.g., "13.0 - 17.5", "< 0.8", "1.5 - 12.0"
  min?: number;
  max?: number;
  isPanic?: boolean;
}

export interface ReferenceRange {
  maleMin?: number;
  maleMax?: number;
  femaleMin?: number;
  femaleMax?: number;
  generalMin?: number;
  generalMax?: number;
  generalText?: string;
  panicLow?: number;
  panicHigh?: number;
  lines?: ReferenceRangeLine[]; // Multi-line ranges for hormones, multi-stage, or qualitative
  qualitativeType?: 'none' | 'positive_negative' | 'multi_stage';
}

export interface TestParameter {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  unit: string;
  referenceRange: ReferenceRange;
  defaultValue?: string | number;
  options?: string[]; // e.g. ['Negative', 'Equivocal', 'Positive']
}

export interface TestDefinition {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: 
    | 'hematology' 
    | 'biochemistry' 
    | 'serology' 
    | 'hormones' 
    | 'coagulation' 
    | 'clinical_pathology' 
    | 'microbiology'
    | 'tumor_markers'
    | 'immunology'
    | 'cardiac'
    | 'vitamins';
  specimenType: SpecimenType;
  tubeType: string;
  tubeColor: string; // Hex for visual cap
  price: number;
  turnaroundHours: number;
  parameters: TestParameter[];
}

export const STANDARD_TUBE_TYPES = [
  { id: 'edta', nameAr: 'أنبوبة EDTA (بنفسجي / Purple)', color: '#8b5cf6', category: 'دم كامل / صورة دم' },
  { id: 'sst', nameAr: 'أنبوبة سيروم جل وفلتر SST (أصفر / Gold/Yellow)', color: '#eab308', category: 'كيمياء وهرمونات' },
  { id: 'plain', nameAr: 'أنبوبة سيروم سادة بدون إضافات (أحمر / Plain Red)', color: '#ef4444', category: 'سيرولوجي ومناعة' },
  { id: 'citrate', nameAr: 'أنبوبة سيترات الصوديوم لتجلط الدم (أزرق سماوي / Light Blue)', color: '#38bdf8', category: 'تجلط الدم PT/PTT' },
  { id: 'heparin', nameAr: 'أنبوبة هيبارين الصوديوم/الليثيوم (أخضر / Green Heparin)', color: '#22c55e', category: 'غازات دم وأملاح' },
  { id: 'fluoride', nameAr: 'أنبوبة فلوريد الصوديوم للسكر (رمادي / Gray Fluoride)', color: '#94a3b8', category: 'سكر عشوائي وصائم' },
  { id: 'urine', nameAr: 'وعاء عينة بول معقم (Urine Container)', color: '#f59e0b', category: 'تحليل ومزارع البول' },
  { id: 'stool', nameAr: 'وعاء عينة براز معقم (Stool Container)', color: '#b45309', category: 'تحليل ومزارع البراز' },
  { id: 'swab', nameAr: 'مسحة معقمة لنقل المزارع (Sterile Swab)', color: '#06b6d4', category: 'مزارع المسحات' },
] as const;

export const STANDARD_UNITS = [
  'mg/dL',
  'g/dL',
  'U/L',
  'IU/L',
  'mIU/mL',
  'µIU/mL',
  'ng/mL',
  'pg/mL',
  'µg/dL',
  'µg/L',
  'mmol/L',
  'µmol/L',
  'mEq/L',
  'x10^3/µL',
  'x10^6/µL',
  'fl',
  'pg',
  '%',
  'sec',
  'Ratio',
  'index',
  'copies/mL',
  'S/CO',
  'U/mL',
  'cells/HPF',
  'mg/24h',
  'ng/dL',
  'nmol/L',
  'g/L',
  'Qualitative',
] as const;

export interface LabPackage {
  id: string;
  nameAr: string;
  nameEn: string;
  testCodes: string[];
  originalPrice: number;
  packagePrice: number;
  description: string;
}

export type ResultFlag = 'normal' | 'high' | 'low' | 'panic_high' | 'panic_low' | 'abnormal' | 'normal_text';

export interface ParameterResult {
  parameterId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  value: string;
  unit: string;
  refText: string;
  flag: ResultFlag;
  chartPercent?: number; // 0 - 100 for coloured bar visualization
}

export interface OrderTestResult {
  testId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  status: 'pending_collection' | 'collected' | 'processing' | 'completed' | 'verified';
  results: ParameterResult[];
  interpretation?: string;
  technicianNotes?: string;
  completedAt?: string;
}

export type PaymentMethod = 
  | 'نقداً (Cash)' 
  | 'إنستا باي (InstaPay)' 
  | 'محفظة إلكترونية (Vodafone/Orange/Etisalat Cash)' 
  | 'تحويل بنكي (Bank Transfer)' 
  | 'بطاقة بنكية (Card)';

export type DiscountType = 'none' | 'percent' | 'fixed_amount' | 'fixed' | 'daily_offer' | 'loyalty_card' | 'loyalty';

export interface LabOrder {
  id: string;
  orderNumber: string; // e.g. RT-2026-1042
  sampleBarcode: string;
  patientId: string;
  patient: Patient;
  tests: OrderTestResult[];
  specimenStatus: 'pending' | 'collected' | 'rejected';
  specimenCollectedAt?: string;
  orderStatus: 'reception' | 'sampling' | 'processing' | 'ready' | 'delivered';
  urgency: 'routine' | 'stat';
  referringDoctor?: string;
  referringDoctorType?: 'Prof dr' | 'Herself' | 'Himself' | 'other';
  clinicalDiagnosis?: string;
  
  // Financials
  totalAmount: number;
  discount: number;
  discountType?: DiscountType;
  discountPercent?: number;
  loyaltyCardNumber?: string;
  dailyOfferName?: string;
  netAmount: number;
  paidAmount: number;
  financialStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: PaymentMethod;
  
  // Timestamps & Signatures
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  labChemist?: string;
  pathologist?: string;
}

export interface ReagentItem {
  id: string;
  nameAr: string;
  nameEn: string;
  catalogCode: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  expiryDate: string;
  lotNumber: string;
  status: 'ok' | 'low' | 'expired';
  usedInTests?: string[];
  unitCost?: number;
}

// HR Staff Member
export interface Employee {
  id: string;
  name: string;
  nationalId: string;
  role: string;
  phone: string;
  email: string;
  shift: string;
  baseSalary: number;
  incentives: number; // حوافز ومكافآت
  deductions: number; // خصومات
  attendanceDays: number;
  absentDays: number;
  overtimeHours?: number;
  netSalary?: number;
  hireDate: string;
  status: 'active' | 'on_leave';
  notes?: string;
}

export type ExpenseCategory = 
  | 'إيجار' 
  | 'إيجار ومرافق'
  | 'كهرباء' 
  | 'مياه' 
  | 'مرتبات وأجور' 
  | 'مستلزمات وكيماويات' 
  | 'مستلزمات وتعقيم'
  | 'صيانة ومعايرة أجهزة' 
  | 'صيانة'
  | 'صيانة أجهزة'
  | 'بوفيه وضيافة ونظافة' 
  | 'دعاية وتسويق' 
  | 'نثريات وطوارئ';

// Financial Expenses
export interface ExpenseItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  recordedBy: string;
}

// Patient Online Booking & Home Visit
export interface PatientBooking {
  id: string;
  bookingCode: string;
  patientName: string;
  phone: string;
  nationalId?: string;
  age: number;
  ageUnit: AgeUnit;
  gender: Gender;
  visitType: 'lab_visit' | 'home_visit';
  address?: string;
  appointmentDate: string;
  appointmentTimeSlot: string;
  selectedTests: string[];
  selectedPackageName?: string;
  estimatedPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

// Analyzer Device
export interface AnalyzerDevice {
  id: string;
  name: string;
  model: string;
  department: string;
  protocol: string;
  ipAddress: string;
  status: 'connected' | 'syncing' | 'offline';
  lastSyncAt: string;
  testsSupported: string[];
}
