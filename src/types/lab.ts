export type FlagType = 'NORMAL' | 'LOW' | 'HIGH' | 'PANIC_LOW' | 'PANIC_HIGH';

export interface ReferenceRange {
  min?: number;
  max?: number;
  text?: string;
}

export interface TestCatalogItem {
  code: string;
  name: string;
  scientificName: string;
  category: string;
  subcategory?: string;
  unit: string;
  refMale: ReferenceRange;
  refFemale: ReferenceRange;
  refChild?: ReferenceRange;
  price: number;
  tubeType: 'Purple EDTA' | 'Yellow SST Gel' | 'Red Plain' | 'Blue Sodium Citrate' | 'Grey Fluoride' | 'Green Heparin' | 'Sterile Container' | 'Other';
  sampleCondition: string;
  method: string;
  isCalculated?: boolean;
  calculatedFormula?: string;
  panicLow?: number;
  panicHigh?: number;
  options?: string[]; // For qualitative/semi-quantitative like Negative/Positive, Clear/Turbid
  deviceId?: string; // Associated analyzer / station
}

export interface ProfileCatalogItem {
  id: string;
  code: string;
  name: string;
  scientificName: string;
  tests: string[]; // List of TestCatalogItem codes
  price: number;
  discountPrice?: number;
  category: string;
  description: string;
  specimenType?: string; // e.g. "EDTA Whole Blood", "Serum", "Fresh Clean-Catch Urine"
}

export interface PackageCatalogItem {
  id: string;
  name: string;
  nameAr: string;
  tests: string[];
  profiles: string[];
  price: number;
  description: string;
  popular?: boolean;
  badge?: string;
}

export interface PatientRecord {
  id: string;
  mrn: string; // RT-YYYY-XXXX
  barcode: string;
  name: string;
  nationalId?: string;
  ageYears: number;
  ageMonths?: number;
  gender: 'Male' | 'Female';
  phone: string;
  email?: string;
  referringDoctor: string;
  sampleDate: string; // YYYY-MM-DD
  sampleTime: string; // HH:mm
  reportDate: string; // YYYY-MM-DD
  reportTime: string; // HH:mm
  sampleType: string;
  fastingStatus: string;
  clinicalNotes?: string;
  createdAt: string;
}

export interface PatientTestResult {
  code: string;
  name: string;
  value: string;
  numericValue?: number;
  flag: FlagType;
  unit: string;
  refRangeText: string;
  method: string;
  isCalculated?: boolean;
  comment?: string;
}

export interface LabSignature {
  id: string;
  name: string;
  title: string;
  role: 'Pathologist' | 'Chemist' | 'QualityManager' | 'Consultant';
  signatureType: 'font' | 'image';
  signatureText?: string;
  signatureImageUrl?: string;
  signatureHeight: number; // e.g. 36 to 64px (well-proportioned)
  show: boolean;
}

export interface DiagnosticGuidanceItem {
  id: string;
  profileCode: string; // 'CBC', 'LFT', 'KFT', 'LIPID', 'TFT', 'DIABETES', 'URINALYSIS', 'COAG', etc.
  title: string;
  statement: string;
  suggestedTestCodes?: string[]; // Test abbreviations only (e.g. ['FERR', 'TIBC', 'CRP'])
}

export interface LabDevice {
  id: string;
  code: string;
  name: string;
  model: string;
  category: string;
  manufacturer: string;
  status: 'Operational' | 'Standby' | 'Maintenance';
  testCodes: string[];
  minimized?: boolean; // Support minimizing/collapsing the analyzer in the UI!
}

export interface PatientEncounter {
  id: string;
  patient: PatientRecord;
  selectedTestCodes: string[];
  results: Record<string, PatientTestResult>;
  profileComments?: Record<string, string>; // Comment and interpretation per profile
  profileRecommendedTests?: Record<string, string[]>; // Suggested follow-up test codes (abbreviations only)
  showSmartReportOnPrint?: boolean; // User toggle to Show or Hide the final smart report page!
  clinicalInterpretation?: {
    summary: string;
    primaryFindings: string[];
    differentialConsiderations: string[];
    suggestedFollowUp: string[];
    criticalAlert?: string | null;
    generatedAt: string;
    isAiGenerated: boolean;
  };
  invoice: {
    invoiceNumber: string;
    date: string;
    items: Array<{
      name: string;
      code: string;
      type: 'Test' | 'Profile' | 'Package';
      price: number;
    }>;
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    tax: number;
    total: number;
    paidAmount: number;
    paymentMethod: 'Cash' | 'Credit Card' | 'Insurance' | 'Vodafone Cash' | 'InstaPay';
    paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  };
  status: 'Registered' | 'Sample Collected' | 'In Progress' | 'Results Entered' | 'Verified' | 'Printed';
}

export interface LabSettings {
  labNameAr: string;
  labNameEn: string;
  labSubtitleAr: string;
  labSubtitleEn: string;
  addressAr: string;
  addressEn: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  email: string;
  website: string;
  logoUrl: string;
  signatures: LabSignature[]; // Customizable list of signatures
  chemistName?: string;
  chemistTitle?: string;
  pathologistName?: string;
  pathologistTitle?: string;
  currency: string;
  stampText: string;
  showStamp: boolean;
  showWatermark: boolean;
  showBarcode: boolean;
  showMethodology: boolean;
  showSmartReportPage: boolean; // Global default toggle for final smart report page
  showRecommendedTests: boolean; // Global toggle for suggested follow-up tests
  accreditationText: string;
}
