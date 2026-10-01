import React, { useState } from 'react';
import { X, Plus, Search, Check, TestTube, AlertCircle, Sparkles, CreditCard, Tag, Award, UserCheck } from 'lucide-react';
import { Patient, TestDefinition, LabPackage, LabOrder, PaymentMethod } from '../types/lab';

interface NewOrderModalProps {
  patients: Patient[];
  testsCatalog: TestDefinition[];
  packages: LabPackage[];
  onClose: () => void;
  onSubmitOrder: (newOrder: LabOrder, andPrintBarcode: boolean) => void;
  onRegisterPatient: (patient: Patient) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  patients,
  testsCatalog,
  packages,
  onClose,
  onSubmitOrder,
  onRegisterPatient,
}) => {
  // Step 1: Patient Selection / Quick Add
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // New patient state
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientNationalId, setNewPatientNationalId] = useState('');
  const [newPatientAge, setNewPatientAge] = useState(30);
  const [newPatientAgeUnit, setNewPatientAgeUnit] = useState<'سنوات' | 'شهور' | 'أيام'>('سنوات');
  const [newPatientGender, setNewPatientGender] = useState<'male' | 'female'>('male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientAddress, setNewPatientAddress] = useState('');
  const [newPatientDoctor, setNewPatientDoctor] = useState('');
  const [newPatientHistory, setNewPatientHistory] = useState('');

  // Step 2: Tests & Packages Selection
  const [selectedTestCodes, setSelectedTestCodes] = useState<string[]>(['CBC']);
  const [testSearch, setTestSearch] = useState('');
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('all');
  const [urgency, setUrgency] = useState<'routine' | 'stat'>('routine');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  
  // Referring Doctor selection
  const [doctorMode, setDoctorMode] = useState<'prof_dr' | 'herself' | 'himself' | 'custom'>('prof_dr');
  const [customDoctorName, setCustomDoctorName] = useState('أ.د. استشاري باطنة');

  // Step 3: Financials & Discounts
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed' | 'daily_offer' | 'loyalty'>('none');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState<number>(0);
  const [dailyOfferName, setDailyOfferName] = useState('عرض الفحص الدوري الأسبوعي (-20%)');
  const [loyaltyCardNumber, setLoyaltyCardNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقداً (Cash)');

  // Filter patients
  const filteredPatients = patients.filter(
    (p) =>
      p.name.includes(patientSearch) ||
      p.phone.includes(patientSearch) ||
      p.nationalId.includes(patientSearch)
  );

  const currentPatient = isAddingNewPatient
    ? {
        id: `pat-${Date.now()}`,
        nationalId: newPatientNationalId || '10000000000000',
        name: newPatientName || 'مريض جديد',
        age: newPatientAge,
        ageUnit: newPatientAgeUnit,
        gender: newPatientGender,
        phone: newPatientPhone,
        address: newPatientAddress,
        referringDoctor: newPatientDoctor,
        medicalHistory: newPatientHistory,
        registeredAt: new Date().toISOString(),
      }
    : patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Toggle single test
  const handleToggleTest = (code: string) => {
    setSelectedTestCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Select package
  const handleApplyPackage = (pkg: LabPackage) => {
    const combined = Array.from(new Set([...selectedTestCodes, ...pkg.testCodes]));
    setSelectedTestCodes(combined);
  };

  // Calculate pricing & discount
  const selectedTestsDefs = testsCatalog.filter((t) => selectedTestCodes.includes(t.code));
  const subtotal = selectedTestsDefs.reduce((acc, curr) => acc + curr.price, 0);

  let calculatedDiscount = 0;
  if (discountType === 'percent') {
    calculatedDiscount = Math.round((subtotal * discountPercent) / 100);
  } else if (discountType === 'fixed') {
    calculatedDiscount = fixedDiscountAmount;
  } else if (discountType === 'daily_offer') {
    calculatedDiscount = Math.round((subtotal * 20) / 100); // 20% off
  } else if (discountType === 'loyalty') {
    calculatedDiscount = Math.round((subtotal * 15) / 100); // 15% loyalty
  }
  calculatedDiscount = Math.min(calculatedDiscount, subtotal);
  const netTotal = Math.max(0, subtotal - calculatedDiscount);

  // Auto update paid amount default
  React.useEffect(() => {
    setPaidAmount(netTotal);
  }, [netTotal]);

  // Determine required tubes summary
  const tubeTypesMap: { [key: string]: { count: number; color: string; label: string } } = {};
  selectedTestsDefs.forEach((t) => {
    if (!tubeTypesMap[t.tubeType]) {
      tubeTypesMap[t.tubeType] = { count: 1, color: t.tubeColor, label: t.tubeType };
    }
  });
  const requiredTubes = Object.values(tubeTypesMap);

  const handleSubmit = (andPrintBarcode: boolean) => {
    let resolvedDoctor = 'Prof dr';
    if (doctorMode === 'prof_dr') resolvedDoctor = 'Prof dr';
    else if (doctorMode === 'herself') resolvedDoctor = 'Herself';
    else if (doctorMode === 'himself') resolvedDoctor = 'Himself';
    else resolvedDoctor = customDoctorName.trim() || 'Prof dr';

    let patientObj = currentPatient;
    if (isAddingNewPatient) {
      if (!newPatientName.trim()) {
        alert('يرجى إدخال اسم المريض');
        return;
      }
      patientObj = {
        ...patientObj,
        referringDoctor: resolvedDoctor,
        referringDoctorType: doctorMode as any,
      };
      onRegisterPatient(patientObj);
    }

    if (selectedTestsDefs.length === 0) {
      alert('يرجى اختيار تحليل واحد على الأقل');
      return;
    }

    const orderNumber = `RT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const barcode = `RT8920${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: LabOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      sampleBarcode: barcode,
      patientId: patientObj.id,
      patient: patientObj,
      orderStatus: 'sampling',
      specimenStatus: 'pending',
      urgency,
      referringDoctor: resolvedDoctor,
      referringDoctorType: doctorMode as any,
      clinicalDiagnosis,
      totalAmount: subtotal,
      discount: calculatedDiscount,
      discountType,
      discountPercent: discountType === 'percent' ? discountPercent : undefined,
      loyaltyCardNumber: discountType === 'loyalty' ? loyaltyCardNumber : undefined,
      dailyOfferName: discountType === 'daily_offer' ? dailyOfferName : undefined,
      netAmount: netTotal,
      paidAmount: Math.min(paidAmount, netTotal),
      financialStatus: paidAmount >= netTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      paymentMethod,
      createdAt: new Date().toISOString(),
      tests: selectedTestsDefs.map((def) => ({
        testId: def.id,
        code: def.code,
        nameAr: def.nameAr,
        nameEn: def.nameEn,
        status: 'pending_collection',
        results: [],
      })),
    };

    onSubmitOrder(newOrder, andPrintBarcode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              تسجيل طلب تحليل وسحب عينات جديد
            </h2>
            <p className="text-xs text-slate-500">
              اختر المريض، الفحوصات المطلوبة، وحدد أنظمة السحب والمحاسبة
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body with 2 columns */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Right column: Patient & Order info (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Patient Selection Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">بيانات المريض</span>
                <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-md text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewPatient(false)}
                    className={`px-3 py-1 rounded transition-colors ${
                      !isAddingNewPatient
                        ? 'bg-white text-teal-800 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    مريض مسجل
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewPatient(true)}
                    className={`px-3 py-1 rounded transition-colors ${
                      isAddingNewPatient
                        ? 'bg-white text-teal-800 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + تسجيل مريض جديد
                  </button>
                </div>
              </div>

              {!isAddingNewPatient ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم أو الهاتف أو الرقم القومي..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full text-xs pl-2 pr-8 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  >
                    {filteredPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gender === 'male' ? 'ذكر' : 'أنثى'}، {p.age} {p.ageUnit}) - هاتف: {p.phone}
                      </option>
                    ))}
                  </select>

                  {currentPatient && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 flex items-center justify-between">
                      <span>الرقم القومي: {currentPatient.nationalId}</span>
                      <span>الطبيب: {currentPatient.referringDoctor || 'لا يوجد'}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">اسم المريض ثلاثي *</label>
                      <input
                        type="text"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                        placeholder="مثال: يوسف حسام الدين"
                        className="w-full p-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">رقم الهاتف / واتساب *</label>
                      <input
                        type="text"
                        value={newPatientPhone}
                        onChange={(e) => setNewPatientPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full p-1.5 border border-slate-200 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">العمر</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={newPatientAge}
                        onChange={(e) => setNewPatientAge(Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">الوحدة</label>
                      <select
                        value={newPatientAgeUnit}
                        onChange={(e) => setNewPatientAgeUnit(e.target.value as any)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      >
                        <option value="سنوات">سنوات</option>
                        <option value="شهور">شهور</option>
                        <option value="أيام">أيام</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">النوع</label>
                      <select
                        value={newPatientGender}
                        onChange={(e) => setNewPatientGender(e.target.value as any)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      >
                        <option value="male">ذكر (Male)</option>
                        <option value="female">أنثى (Female)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">الرقم القومي / الهوية</label>
                      <input
                        type="text"
                        value={newPatientNationalId}
                        onChange={(e) => setNewPatientNationalId(e.target.value)}
                        placeholder="14 رقم"
                        className="w-full p-1.5 border border-slate-200 rounded bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">الطبيب المعالج</label>
                      <input
                        type="text"
                        value={newPatientDoctor}
                        onChange={(e) => setNewPatientDoctor(e.target.value)}
                        placeholder="د. اسم الطبيب"
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Packages Quick Add */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>باقات الفحص الطبي الموفرة:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleApplyPackage(pkg)}
                    className="p-2.5 text-right border border-slate-200 hover:border-teal-500 rounded-lg bg-slate-50/60 hover:bg-teal-50/40 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                        {pkg.nameAr}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-teal-700">
                        {pkg.packagePrice} ج.م
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {pkg.testCodes.join(' + ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Individual Test Catalog Selection */}
            <div>
              <div className="flex flex-col gap-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    كتالوج التحاليل الفردية ({selectedTestCodes.length} محددة من إجمالي {testsCatalog.length} تحليل)
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث باسم التحليل أو الكود..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="text-[11px] px-2.5 py-1 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-rose-800 w-48 shadow-2xs"
                  />
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar text-[10px]">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'hematology', label: 'أمراض دم' },
                    { id: 'coagulation', label: 'تجلط وسيولة' },
                    { id: 'biochemistry', label: 'كيمياء ووظائف' },
                    { id: 'hormones', label: 'هرمونات وخصوبة' },
                    { id: 'tumor_markers', label: 'دلالات أورام' },
                    { id: 'immunology', label: 'مناعة وروماتيزم' },
                    { id: 'serology', label: 'فيروسات وسيرولوجي' },
                    { id: 'cardiac', label: 'قلب وجلطات' },
                    { id: 'vitamins', label: 'فيتامينات' },
                    { id: 'clinical_pathology', label: 'بول وبراز ومني' },
                    { id: 'microbiology', label: 'مزارع وحساسية' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTestCategoryFilter(cat.id)}
                      className={`px-2 py-0.5 rounded-full shrink-0 font-bold transition-colors ${
                        testCategoryFilter === cat.id
                          ? 'bg-rose-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white shadow-2xs">
                {testsCatalog
                  .filter((t) => {
                    const matchCat =
                      testCategoryFilter === 'all' || t.category === testCategoryFilter;
                    const matchSearch =
                      !testSearch ||
                      t.nameAr.includes(testSearch) ||
                      t.nameEn.toLowerCase().includes(testSearch.toLowerCase()) ||
                      t.code.toLowerCase().includes(testSearch.toLowerCase());
                    return matchCat && matchSearch;
                  })
                  .map((test) => {
                    const isSelected = selectedTestCodes.includes(test.code);
                    return (
                      <div
                        key={test.id}
                        onClick={() => handleToggleTest(test.code)}
                        className={`p-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-rose-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                              isSelected
                                ? 'bg-rose-900 border-rose-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{test.nameAr}</span>
                              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                {test.code}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block shrink-0"
                                style={{ backgroundColor: test.tubeColor }}
                              />
                              <span>{test.tubeType}</span>
                              <span>·</span>
                              <span>{test.specimenType}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-rose-950">
                            {test.price} ج.م
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Left column: Summary, Tubes & Financials (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3.5 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            <div className="space-y-3">
              {/* Doctor Selection: Prof dr / Herself / Himself / Custom */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-rose-900" />
                  <span>الطبيب المعالج (Referring Doctor):</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setDoctorMode('prof_dr')}
                    className={`py-1 text-[11px] font-bold rounded border transition-colors ${
                      doctorMode === 'prof_dr'
                        ? 'bg-rose-950 text-white border-rose-950 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Prof dr
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoctorMode('herself')}
                    className={`py-1 text-[11px] font-bold rounded border transition-colors ${
                      doctorMode === 'herself'
                        ? 'bg-rose-950 text-white border-rose-950 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Herself (نفسها)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoctorMode('himself')}
                    className={`py-1 text-[11px] font-bold rounded border transition-colors ${
                      doctorMode === 'himself'
                        ? 'bg-rose-950 text-white border-rose-950 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Himself (نفسه)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoctorMode('custom')}
                    className={`py-1 text-[11px] font-bold rounded border transition-colors ${
                      doctorMode === 'custom'
                        ? 'bg-rose-950 text-white border-rose-950 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    طبيب مخصص
                  </button>
                </div>
                {doctorMode === 'custom' && (
                  <input
                    type="text"
                    value={customDoctorName}
                    onChange={(e) => setCustomDoctorName(e.target.value)}
                    placeholder="اكتب اسم ولقب الطبيب المعالج..."
                    className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-rose-800"
                  />
                )}
              </div>

              {/* Urgency & Clinical info */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">درجة أولوية العينة:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setUrgency('routine')}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                        urgency === 'routine'
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      عادي (Routine)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('stat')}
                      className={`px-3 py-1 text-xs rounded-md font-bold transition-colors ${
                        urgency === 'stat'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-white text-rose-600 border border-rose-200'
                      }`}
                    >
                      🚨 STAT عاجل
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    التشخيص الإكلينيكي أو سبب الفحص
                  </label>
                  <input
                    type="text"
                    value={clinicalDiagnosis}
                    onChange={(e) => setClinicalDiagnosis(e.target.value)}
                    placeholder="مثال: فحص دوري، متابعة سكري، إجهاد عام..."
                    className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>
              </div>

              {/* Tubes Required Visual Indicator */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TestTube className="w-4 h-4 text-rose-800" />
                  <span>الأنابيب المطلوبة للسحب ({requiredTubes.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {requiredTubes.length === 0 ? (
                    <span className="text-xs text-slate-400">لم يتم اختيار تحاليل</span>
                  ) : (
                    requiredTubes.map((tube, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tube.color }}
                        />
                        <span className="text-slate-700 font-medium">{tube.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Box */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>المحاسبة والخزينة</span>
                  <span className="text-[10px] text-slate-500 font-normal">معامل RT</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>إجمالي التحاليل:</span>
                  <span className="font-mono font-bold text-slate-900">{subtotal} ج.م</span>
                </div>

                {/* Discounts Section */}
                <div className="space-y-1.5 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-rose-700" />
                      <span>نوع الخصم:</span>
                    </span>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="text-xs p-1 bg-slate-50 border border-slate-200 rounded font-medium"
                    >
                      <option value="none">بدون خصم (0%)</option>
                      <option value="percent">نسبة مئوية (%)</option>
                      <option value="daily_offer">عروض يومية خاصة (20%)</option>
                      <option value="loyalty">كارت الولاء (Loyalty Card 15%)</option>
                      <option value="fixed">مبلغ ثابت (ج.م)</option>
                    </select>
                  </div>

                  {discountType === 'percent' && (
                    <div className="flex items-center justify-between text-xs bg-rose-50/60 p-1.5 rounded border border-rose-200">
                      <span className="text-rose-950 font-bold">نسبة الخصم:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="w-16 p-1 text-xs border border-rose-300 rounded font-mono text-center font-bold bg-white"
                        />
                        <span className="font-bold text-rose-900">%</span>
                      </div>
                    </div>
                  )}

                  {discountType === 'daily_offer' && (
                    <div className="text-xs bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-950 flex items-center justify-between">
                      <span className="font-bold">{dailyOfferName}</span>
                      <span className="font-mono font-bold text-amber-800">خصم 20%</span>
                    </div>
                  )}

                  {discountType === 'loyalty' && (
                    <div className="space-y-1 text-xs bg-blue-50 p-2 rounded border border-blue-200">
                      <div className="flex items-center justify-between text-blue-950 font-bold">
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-blue-700" />
                          <span>كارت ولاء المعمل:</span>
                        </span>
                        <span className="font-mono text-blue-800 font-black">خصم 15%</span>
                      </div>
                      <input
                        type="text"
                        placeholder="أدخل رقم كارت الولاء (مثال: RT-VIP-880)..."
                        value={loyaltyCardNumber}
                        onChange={(e) => setLoyaltyCardNumber(e.target.value)}
                        className="w-full text-xs p-1 bg-white border border-blue-200 rounded font-mono"
                      />
                    </div>
                  )}

                  {discountType === 'fixed' && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">قيمة الخصم الثابت:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          value={fixedDiscountAmount}
                          onChange={(e) => setFixedDiscountAmount(Number(e.target.value))}
                          className="w-20 p-1 text-xs text-left border border-slate-200 rounded font-mono"
                        />
                        <span className="text-slate-500 font-mono text-[11px]">ج.م</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>الصافي المطلوب:</span>
                  <span className="font-mono text-sm text-rose-950 font-black">{netTotal} ج.م</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">المبلغ المسدد الآن:</span>
                  <input
                    type="number"
                    min="0"
                    max={netTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-20 p-1 text-xs text-left border border-slate-200 rounded font-mono font-bold text-emerald-800"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-bold flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>طريقة الدفع:</span>
                  </span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="p-1 text-xs border border-slate-200 rounded bg-white font-medium"
                  >
                    <option value="نقداً (Cash)">نقداً (Cash)</option>
                    <option value="إنستا باي (InstaPay)">إنستا باي (InstaPay)</option>
                    <option value="محفظة إلكترونية (Vodafone/Orange/Etisalat Cash)">محفظة إلكترونية (فودافون/أورنج كاش)</option>
                    <option value="تحويل بنكي (Bank Transfer)">تحويل بنكي (Bank Transfer)</option>
                    <option value="بطاقة بنكية (Card)">بطاقة بنكية (Visa/Mastercard)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="w-full py-2.5 px-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>حفظ وتوليد ملصق الباركود للسحب</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                حفظ فقط بدون طباعة ملصق الآن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
