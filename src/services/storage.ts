import {
  Patient,
  LabOrder,
  TestDefinition,
  LabPackage,
  ReagentItem,
  Employee,
  ExpenseItem,
  PatientBooking,
  AnalyzerDevice,
  ResultFlag,
} from '../types/lab';
import {
  INITIAL_PATIENTS,
  INITIAL_ORDERS,
  INITIAL_TEST_CATALOG,
  INITIAL_PACKAGES,
  INITIAL_REAGENTS,
  INITIAL_EMPLOYEES,
  INITIAL_EXPENSES,
  INITIAL_BOOKINGS,
  INITIAL_DEVICES,
} from '../data/initialData';
import { ALL_TESTS_CATALOG } from '../data/allTestsCatalog';

const STORAGE_KEYS = {
  PATIENTS: 'rami_mokhtar_patients_v3',
  ORDERS: 'rami_mokhtar_orders_v3',
  TESTS: 'rami_mokhtar_tests_v3',
  PACKAGES: 'rami_mokhtar_packages_v3',
  REAGENTS: 'rami_mokhtar_reagents_v3',
  EMPLOYEES: 'rami_mokhtar_employees_v3',
  EXPENSES: 'rami_mokhtar_expenses_v3',
  BOOKINGS: 'rami_mokhtar_bookings_v3',
  DEVICES: 'rami_mokhtar_devices_v3',
  LAB_PROFILE: 'rami_mokhtar_profile_v3',
  CLOUD_SYNC_METADATA: 'rami_mokhtar_cloud_sync_meta_v3',
};

// Real-time broadcast channel across multiple tabs / windows
const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('rami_mokhtar_realtime_sync')
    : null;

export const notifyDataChanged = (sourceKey: string) => {
  try {
    const meta = {
      lastSyncedAt: new Date().toISOString(),
      sourceKey,
      deviceId: getDeviceId(),
    };
    localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC_METADATA, JSON.stringify(meta));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'DATA_SYNC', ...meta });
    }
  } catch {
    // Ignore storage errors in private browsing
  }
};

export const getDeviceId = (): string => {
  let id = localStorage.getItem('rami_mokhtar_device_id');
  if (!id) {
    id = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    localStorage.setItem('rami_mokhtar_device_id', id);
  }
  return id;
};

export const getCloudSyncMetadata = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC_METADATA);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    lastSyncedAt: new Date().toISOString(),
    sourceKey: 'init',
    deviceId: getDeviceId(),
  };
};

export interface LabProfile {
  nameAr: string;
  nameEn: string;
  directorName: string;
  licenseNumber: string;
  phone: string;
  phone2: string;
  whatsapp: string;
  email: string;
  address: string;
  accreditation: string;
  labSharePercent: number; // e.g. 70
  ceoSharePercent: number; // e.g. 30
  availableChemists: string[];
  availableVerifiers: string[];
  availablePathologists: string[];
  logoUrl?: string;
}

export const DEFAULT_LAB_PROFILE: LabProfile = {
  nameAr: 'معامل RT للتحاليل الطبية والتشخيصية',
  nameEn: 'RT Diagnostic Laboratories - Dr. Rami Mokhtar',
  directorName: 'د. رامي مختار - طبيب الباثولوجيا الإكلينيكية والكيميائيه طب قصر العيني',
  licenseNumber: 'ترخيص وزارة الصحة: 110084 / معتمد ISO 15189',
  phone: '01100874444',
  phone2: '01100046841',
  whatsapp: '01100874444',
  email: 'info@rt-labs.com',
  address: 'ميدان بهتيم برج صيدليه العزبى الدور الثالث امام الأسانسير شبرا الخيمه',
  accreditation: 'معتمد وفقاً لمعايير الجودة الدولية ISO 15189:2022',
  labSharePercent: 70,
  ceoSharePercent: 30,
  logoUrl: '',
  availableChemists: [
    'كيميائي أحمد الشناوي',
    'كيميائية سارة محمود',
    'كيميائي محمد إبراهيم',
    'كيميائية نورهان بدر',
  ],
  availableVerifiers: [
    'د. رامي مختار',
    'د. رحاب على عبد الحميد',
    'د. مصطفى الشافعي',
  ],
  availablePathologists: [
    'رحاب على عبد الحميد - اخصائى الباثولوجيا الإكلينيكية',
    'رامي مختار - طبيب الباثولوجيا الإكلينيكية والكيميائيه طب قصر العيني',
  ],
};

export const loadStoredData = () => {
  try {
    const patientsStr = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    const ordersStr = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const testsStr = localStorage.getItem(STORAGE_KEYS.TESTS);
    const packagesStr = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    const reagentsStr = localStorage.getItem(STORAGE_KEYS.REAGENTS);
    const employeesStr = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    const expensesStr = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const bookingsStr = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const devicesStr = localStorage.getItem(STORAGE_KEYS.DEVICES);
    const profileStr = localStorage.getItem(STORAGE_KEYS.LAB_PROFILE);

    let loadedTests: TestDefinition[] = ALL_TESTS_CATALOG;
    if (testsStr) {
      try {
        const parsed = JSON.parse(testsStr) as TestDefinition[];
        if (parsed && parsed.length >= 140) {
          loadedTests = parsed;
        } else {
          loadedTests = ALL_TESTS_CATALOG;
          localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(ALL_TESTS_CATALOG));
        }
      } catch {
        loadedTests = ALL_TESTS_CATALOG;
        localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(ALL_TESTS_CATALOG));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(ALL_TESTS_CATALOG));
    }

    let loadedProfile = profileStr ? (JSON.parse(profileStr) as LabProfile) : DEFAULT_LAB_PROFILE;
    if (loadedProfile.logoUrl && loadedProfile.logoUrl.includes('/src/assets/images')) {
      loadedProfile.logoUrl = ''; // reset broken dev path so resolveLabLogo uses bundled asset
    }

    return {
      patients: patientsStr ? (JSON.parse(patientsStr) as Patient[]) : INITIAL_PATIENTS,
      orders: ordersStr ? (JSON.parse(ordersStr) as LabOrder[]) : INITIAL_ORDERS,
      tests: loadedTests,
      packages: packagesStr ? (JSON.parse(packagesStr) as LabPackage[]) : INITIAL_PACKAGES,
      reagents: reagentsStr ? (JSON.parse(reagentsStr) as ReagentItem[]) : INITIAL_REAGENTS,
      employees: employeesStr ? (JSON.parse(employeesStr) as Employee[]) : INITIAL_EMPLOYEES,
      expenses: expensesStr ? (JSON.parse(expensesStr) as ExpenseItem[]) : INITIAL_EXPENSES,
      bookings: bookingsStr ? (JSON.parse(bookingsStr) as PatientBooking[]) : INITIAL_BOOKINGS,
      devices: devicesStr ? (JSON.parse(devicesStr) as AnalyzerDevice[]) : INITIAL_DEVICES,
      profile: loadedProfile,
    };
  } catch (err) {
    console.error('Failed reading from localStorage', err);
    return {
      patients: INITIAL_PATIENTS,
      orders: INITIAL_ORDERS,
      tests: ALL_TESTS_CATALOG,
      packages: INITIAL_PACKAGES,
      reagents: INITIAL_REAGENTS,
      employees: INITIAL_EMPLOYEES,
      expenses: INITIAL_EXPENSES,
      bookings: INITIAL_BOOKINGS,
      devices: INITIAL_DEVICES,
      profile: DEFAULT_LAB_PROFILE,
    };
  }
};

export const savePatients = (patients: Patient[]) => {
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  notifyDataChanged('patients');
};

export const saveOrders = (orders: LabOrder[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  notifyDataChanged('orders');
};

export const saveTests = (tests: TestDefinition[]) => {
  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  notifyDataChanged('tests');
};

export const savePackages = (packages: LabPackage[]) => {
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  notifyDataChanged('packages');
};

export const saveReagents = (reagents: ReagentItem[]) => {
  localStorage.setItem(STORAGE_KEYS.REAGENTS, JSON.stringify(reagents));
  notifyDataChanged('reagents');
};

export const saveEmployees = (employees: Employee[]) => {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  notifyDataChanged('employees');
};

export const saveExpenses = (expenses: ExpenseItem[]) => {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  notifyDataChanged('expenses');
};

export const saveBookings = (bookings: PatientBooking[]) => {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  notifyDataChanged('bookings');
};

export const saveDevices = (devices: AnalyzerDevice[]) => {
  localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  notifyDataChanged('devices');
};

export const saveProfile = (profile: LabProfile) => {
  localStorage.setItem(STORAGE_KEYS.LAB_PROFILE, JSON.stringify(profile));
  notifyDataChanged('profile');
};

export const resetToDemoData = () => {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  return {
    patients: INITIAL_PATIENTS,
    orders: INITIAL_ORDERS,
    tests: ALL_TESTS_CATALOG,
    packages: INITIAL_PACKAGES,
    reagents: INITIAL_REAGENTS,
    employees: INITIAL_EMPLOYEES,
    expenses: INITIAL_EXPENSES,
    bookings: INITIAL_BOOKINGS,
    devices: INITIAL_DEVICES,
    profile: DEFAULT_LAB_PROFILE,
  };
};

/**
 * Cloud Backup Export & Import
 */
export const exportCompleteBackup = () => {
  const allData = loadStoredData();
  const jsonStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rami_Mokhtar_Labs_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importCompleteBackup = (jsonString: string) => {
  const parsed = JSON.parse(jsonString);
  if (parsed.patients) savePatients(parsed.patients);
  if (parsed.orders) saveOrders(parsed.orders);
  if (parsed.tests) saveTests(parsed.tests);
  if (parsed.packages) savePackages(parsed.packages);
  if (parsed.reagents) saveReagents(parsed.reagents);
  if (parsed.employees) saveEmployees(parsed.employees);
  if (parsed.expenses) saveExpenses(parsed.expenses);
  if (parsed.bookings) saveBookings(parsed.bookings);
  if (parsed.devices) saveDevices(parsed.devices);
  if (parsed.profile) saveProfile(parsed.profile);
  return parsed;
};

/**
 * WhatsApp message generation helper
 */
export const generateBookingWhatsAppUrl = (booking: PatientBooking, profile: LabProfile) => {
  const phoneClean = booking.phone.replace(/[^0-9]/g, '');
  const targetPhone = phoneClean.startsWith('0') ? `2${phoneClean}` : phoneClean;

  const msg = `*مرحباً بك في ${profile.nameAr}* 🔬
(إدارة: ${profile.directorName})

تم استلام وتأكيد طلب حجزكم بنجاح:
🏷️ *كود الحجز:* ${booking.bookingCode}
👤 *اسم المريض:* ${booking.patientName}
📅 *الموعد:* ${booking.appointmentDate} (${booking.appointmentTimeSlot})
🏠 *نوع الزيارة:* ${booking.visitType === 'home_visit' ? 'سحب عينات منزلي (Home Visit)' : 'زيارة الفرع'}
${booking.address ? `📍 *العنوان:* ${booking.address}\n` : ''}🧪 *الفحوصات:* ${booking.selectedTests.join(' + ')}
💵 *التكلفة التقديرية:* ${booking.estimatedPrice} ج.م

📍 *فرعنا الرئيسي:* ${profile.address}
📞 *للتواصل والاستفسار:* ${profile.phone} - ${profile.phone2}
نتمنى لكم دوام الصحة والعافية!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
};

export const generateReportWhatsAppUrl = (order: LabOrder, profile: LabProfile) => {
  const phoneClean = order.patient.phone.replace(/[^0-9]/g, '');
  const targetPhone = phoneClean.startsWith('0') ? `2${phoneClean}` : phoneClean;

  const msg = `*مرحباً ${order.patient.name}* 🩺
يسرنا إبلاغكم بأن نتائج التحاليل الطبية الخاصة بكم في *${profile.nameAr}* أصبحت جاهزة ومعتمدة رسمياً من ${profile.directorName}.

📑 *رقم التقرير:* ${order.orderNumber}
🔬 *كود العينة:* ${order.sampleBarcode}
🧪 *التحاليل المعتمدة:* ${order.tests.map((t) => t.nameAr).join(' - ')}

يمكنكم استلام أصل التقرير المطبوع من الفرع أو مراجعة النتائج عبر البوابة الإلكترونية.
📍 *العنوان:* ${profile.address}
📞 *الهاتف:* ${profile.phone} - ${profile.phone2}
مع أطيب تمنياتنا لكم بالشفاء العاجل!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
};

/**
 * Intelligent reference range evaluation & panic flag detection
 */
export const evaluateParameterResult = (
  paramCode: string,
  rawVal: string,
  patientGender: 'male' | 'female',
  testDef?: TestDefinition
): { flag: ResultFlag; refText: string } => {
  const valNum = parseFloat(rawVal);
  if (!testDef) {
    return { flag: 'normal', refText: '-' };
  }

  const param = testDef.parameters.find((p) => p.code === paramCode || p.id === paramCode);
  if (!param) return { flag: 'normal', refText: '-' };

  const ref = param.referenceRange;

  let min: number | undefined;
  let max: number | undefined;
  let refText = '';

  if (patientGender === 'male' && ref.maleMin !== undefined && ref.maleMax !== undefined) {
    min = ref.maleMin;
    max = ref.maleMax;
    refText = `${min} - ${max} ${param.unit} (ذكور)`;
  } else if (patientGender === 'female' && ref.femaleMin !== undefined && ref.femaleMax !== undefined) {
    min = ref.femaleMin;
    max = ref.femaleMax;
    refText = `${min} - ${max} ${param.unit} (إناث)`;
  } else if (ref.generalMin !== undefined && ref.generalMax !== undefined) {
    min = ref.generalMin;
    max = ref.generalMax;
    refText = `${min} - ${max} ${param.unit}`;
  } else if (ref.generalText) {
    refText = ref.generalText;
  }

  if (isNaN(valNum)) {
    if (param.options && (rawVal.includes('+') || rawVal.includes('Trace') || rawVal.includes('معكر') || rawVal.includes('داكن'))) {
      return { flag: 'abnormal', refText };
    }
    return { flag: 'normal_text', refText };
  }

  if (ref.panicLow !== undefined && valNum <= ref.panicLow) {
    return { flag: 'panic_low', refText };
  }
  if (ref.panicHigh !== undefined && valNum >= ref.panicHigh) {
    return { flag: 'panic_high', refText };
  }

  if (min !== undefined && valNum < min) {
    return { flag: 'low', refText };
  }
  if (max !== undefined && valNum > max) {
    return { flag: 'high', refText };
  }

  return { flag: 'normal', refText };
};
