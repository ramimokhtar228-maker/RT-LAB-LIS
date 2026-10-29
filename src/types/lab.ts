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
}

export interface PackageCatalogItem {
  id: string;
  name: string;
  nameAr: string;
  tests: string[]; // List of test codes included
  profiles: string[]; // List of profile codes included
  price: number;
  description: string;
  popular?: boolean;
  badge?: string;
}

export interface PatientRecord {
  id: string;
  mrn: string; // RT-YYYY-XXXX
  barcode: string;
  name: string; // Patient name (Arabic or English)
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

export interface PatientEncounter {
  id: string;
  patient: PatientRecord;
  selectedTestCodes: string[];
  results: Record<string, PatientTestResult>;
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
  chemistName: string;
  chemistTitle: string;
  pathologistName: string;
  pathologistTitle: string;
  currency: string;
  stampText: string;
  showStamp: boolean;
  showWatermark: boolean;
  showBarcode: boolean;
  showMethodology: boolean;
  accreditationText: string;
}
