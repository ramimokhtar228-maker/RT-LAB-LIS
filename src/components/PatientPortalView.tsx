import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  MapPin,
  Send,
  Search,
  CheckCircle2,
  FileText,
  Home,
  TestTube2,
  Sparkles,
  ShieldCheck,
  User,
  Download,
} from 'lucide-react';
import { PatientBooking, LabOrder, TestDefinition, LabPackage } from '../types/lab';
import { LabProfile, generateBookingWhatsAppUrl } from '../services/storage';
import { MobileInstallBanner } from './MobileInstallBanner';
import {
  resolveLabLogo,
  RECEPTION_PHOTO_IMG,
  MEDICAL_TEAM_IMG,
  onImageErrorFallback,
} from '../assets/images';

interface PatientPortalViewProps {
  profile: LabProfile;
  testsCatalog: TestDefinition[];
  packages: LabPackage[];
  orders: LabOrder[];
  bookings: PatientBooking[];
  onAddBooking: (booking: PatientBooking) => void;
  onOpenReport: (order: LabOrder) => void;
  onSwitchToAdmin: () => void;
  onOpenInstallModal?: () => void;
  logoUrl?: string;
  receptionUrl?: string;
  teamUrl?: string;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  profile,
  testsCatalog,
  packages,
  orders,
  bookings,
  onAddBooking,
  onOpenReport,
  onSwitchToAdmin,
  onOpenInstallModal,
  logoUrl,
  receptionUrl = RECEPTION_PHOTO_IMG,
  teamUrl = MEDICAL_TEAM_IMG,
}) => {
  const effectiveLogo = logoUrl || resolveLabLogo(profile.logoUrl);
  const [activeTab, setActiveTab] = useState<'book' | 'results' | 'packages'>('book');

  // Booking form state
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [age, setAge] = useState(30);
  const [ageUnit, setAgeUnit] = useState<'سنوات' | 'شهور' | 'أيام'>('سنوات');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [visitType, setVisitType] = useState<'lab_visit' | 'home_visit'>('lab_visit');
  const [address, setAddress] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState('صباحاً (9:00 ص - 1:00 م)');
  const [selectedTests, setSelectedTests] = useState<string[]>(['CBC']);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<PatientBooking | null>(null);

  // Results lookup state
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [foundOrders, setFoundOrders] = useState<LabOrder[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Price calculation
  const selectedTestDefs = testsCatalog.filter((t) => selectedTests.includes(t.code));
  const selectedPkg = packages.find((p) => p.id === selectedPackageId);
  const homeVisitFee = visitType === 'home_visit' ? 60 : 0;
  const testsTotal = selectedPkg
    ? selectedPkg.packagePrice
    : selectedTestDefs.reduce((acc, curr) => acc + curr.price, 0);
  const estimatedPrice = testsTotal + homeVisitFee;

  const handleToggleTest = (code: string) => {
    setSelectedPackageId('');
    setSelectedTests((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectPackage = (pkg: LabPackage) => {
    if (selectedPackageId === pkg.id) {
      setSelectedPackageId('');
      setSelectedTests(['CBC']);
    } else {
      setSelectedPackageId(pkg.id);
      setSelectedTests(pkg.testCodes);
    }
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim()) {
      alert('يرجى إدخال اسم المريض ورقم الهاتف');
      return;
    }

    const bookingCode = `RM-BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: PatientBooking = {
      id: `bk-${Date.now()}`,
      bookingCode,
      patientName,
      phone,
      nationalId,
      age,
      ageUnit,
      gender,
      visitType,
      address: visitType === 'home_visit' ? address : 'فرع بهتيم برج صيدلية العزبي',
      appointmentDate,
      appointmentTimeSlot: timeSlot,
      selectedTests,
      selectedPackageName: selectedPkg?.nameAr,
      estimatedPrice,
      status: 'confirmed',
      notes,
      createdAt: new Date().toISOString(),
    };

    onAddBooking(newBooking);
    setBookingSuccess(newBooking);
  };

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const results = orders.filter((o) => {
      const matchBarcode = searchBarcode
        ? o.sampleBarcode.toLowerCase().includes(searchBarcode.toLowerCase()) ||
          o.orderNumber.toLowerCase().includes(searchBarcode.toLowerCase())
        : false;
      const matchPhone = searchPhone ? o.patient.phone.includes(searchPhone) : false;
      return matchBarcode || matchPhone;
    });
    setFoundOrders(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-800 flex flex-col font-['Cairo',sans-serif]">
      {/* Mobile Sticky Install Banner */}
      {onOpenInstallModal && <MobileInstallBanner onOpenGuide={onOpenInstallModal} />}

      {/* Top Patient Bar */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-rose-300 shadow-2xs shrink-0 bg-slate-950 flex items-center justify-center p-0.5">
              <img
                src={effectiveLogo}
                alt="لوجو معامل رامي مختار"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => onImageErrorFallback(e)}
              />
            </div>
            <div>
              <div className="text-base font-black text-rose-950 flex items-center gap-2">
                <span>{profile.nameAr}</span>
                <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  د. رامي مختار
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                بوابة المرضى والمراجعين الإلكترونية · حجز كشف وسحب منزلي واستعلام نتائج
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-700 pl-3 border-l border-slate-200">
              <a href="tel:01100874444" className="flex items-center gap-1 hover:text-rose-900 font-bold">
                <Phone className="w-3.5 h-3.5 text-rose-700" />
                <span>01100874444</span>
              </a>
              <a href="tel:01100046841" className="flex items-center gap-1 hover:text-rose-900 font-bold">
                <Phone className="w-3.5 h-3.5 text-rose-700" />
                <span>01100046841</span>
              </a>
            </div>

            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-950 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                title="تحميل التطبيق على الموبايل واللابتوب"
              >
                <Download className="w-3.5 h-3.5 text-rose-800" />
                <span className="hidden sm:inline">تحميل التطبيق</span>
              </button>
            )}

            <button
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-rose-300" />
              <span>لوحة إدارة المعمل</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Notice with Dark Crimson Red & Navy Blue */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs border border-rose-400/30">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>معامل معتمدة دولياً ISO 15189:2022</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                أهلاً بكم في {profile.nameAr}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                تحت إشراف <span className="font-bold text-rose-300">أ.د. رامي مختار</span> استشاري الباثولوجيا الإكلينيكية والكيميائية ونخبة من الأطباء والفنيين. نوفر لكم أدق نتائج التحاليل الطبية وخدمة <span className="font-bold underline text-rose-300">سحب العينات من المنزل</span> بشبرا الخيمة، مع إرسال النتائج فورياً عبر واتساب.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{profile.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>مفتوح يومياً 8 ص - 12 منتصف الليل</span>
                </div>
              </div>
            </div>

            {/* Visual Showcase (Reception & Team) */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-32 sm:w-40 h-24 sm:h-28 rounded-xl overflow-hidden border-2 border-rose-400/30 shadow-lg relative group">
                <img
                  src={receptionUrl}
                  alt="استقبال معامل رامي مختار"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => onImageErrorFallback(e)}
                />
                <span className="absolute bottom-1 right-1 left-1 bg-slate-900/80 backdrop-blur-xs text-[9px] font-bold text-white text-center py-0.5 rounded">
                  استقبال المعمل
                </span>
              </div>
              <div className="w-32 sm:w-40 h-24 sm:h-28 rounded-xl overflow-hidden border-2 border-rose-400/30 shadow-lg relative group">
                <img
                  src={teamUrl}
                  alt="فريق أ.د. رامي مختار"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => onImageErrorFallback(e)}
                />
                <span className="absolute bottom-1 right-1 left-1 bg-slate-900/80 backdrop-blur-xs text-[9px] font-bold text-white text-center py-0.5 rounded">
                  الفريق الطبي
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Patients */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold gap-1 shadow-sm">
            <button
              onClick={() => {
                setActiveTab('book');
                setBookingSuccess(null);
              }}
              className={`px-5 py-2 rounded-lg transition-all ${
                activeTab === 'book'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              حجز موعد أو زيارة منزلية
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-5 py-2 rounded-lg transition-all ${
                activeTab === 'results'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الاستعلام عن النتائج والتقارير
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-5 py-2 rounded-lg transition-all ${
                activeTab === 'packages'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              باقات الفحص الشامل الموفرة
            </button>
          </div>
        </div>

        {/* TAB 1: BOOKING FORM */}
        {activeTab === 'book' && (
          <div>
            {bookingSuccess ? (
              <div className="bg-white rounded-2xl border border-rose-200 shadow-lg p-6 sm:p-8 space-y-6 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">
                    تم تأكيد حجزكم في معامل رامي مختار!
                  </h3>
                  <p className="text-xs text-slate-500">
                    كود الحجز المرجعي: <span className="font-mono font-bold text-rose-900 text-sm">{bookingSuccess.bookingCode}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-right space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">اسم المريض:</span>
                    <span className="font-bold text-slate-900">{bookingSuccess.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الموعد المطلوب:</span>
                    <span className="font-mono font-bold text-slate-900">{bookingSuccess.appointmentDate} ({bookingSuccess.appointmentTimeSlot})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">نوع الزيارة:</span>
                    <span className="font-bold text-rose-900">
                      {bookingSuccess.visitType === 'home_visit' ? 'سحب منزلي (Home Visit)' : 'زيارة فرع بهتيم صيدلية العزبي'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">التكلفة التقديرية:</span>
                    <span className="font-mono font-bold text-rose-800 text-sm">{bookingSuccess.estimatedPrice} ج.م</span>
                  </div>
                </div>

                {/* WhatsApp Direct Action Button */}
                <div className="space-y-3">
                  <a
                    href={generateBookingWhatsAppUrl(bookingSuccess, profile)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال تفاصيل الحجز عبر واتساب المعمل لتأكيد الموعد</span>
                  </a>

                  <button
                    onClick={() => {
                      setBookingSuccess(null);
                      setPatientName('');
                      setPhone('');
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    تسجيل حجز جديد
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitBooking}
                className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    طلب حجز كشف معملي أو سحب عينات منزلي
                  </h2>
                  <p className="text-xs text-slate-500">
                    أدخل بيانات المريض وسيقوم فريق الاستقبال بالتواصل معكم لتأكيد وتنسيق الحضور
                  </p>
                </div>

                {/* Visit Type Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisitType('lab_visit')}
                    className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 ${
                      visitType === 'lab_visit'
                        ? 'border-rose-900 bg-rose-50/70 text-rose-950 ring-2 ring-rose-900/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <TestTube2 className="w-5 h-5 text-rose-800 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">حجز زيارة المعمل (فرع بهتيم)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        برج صيدلية العزبي الدور 3، بدون رسوم إضافية
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType('home_visit')}
                    className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 ${
                      visitType === 'home_visit'
                        ? 'border-blue-900 bg-blue-50/70 text-blue-950 ring-2 ring-blue-900/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">طلب سحب عينات منزلي (Home Visit)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        فريق تمريض متخصص يصلكم بالمنزل في شبرا الخيمة
                      </div>
                    </div>
                  </button>
                </div>

                {/* Patient Information */}
                <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">اسم المريض ثلاثي *</label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="مثال: يوسف حسام السيد"
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">رقم الهاتف / الواتساب *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="011XXXXXXXX أو 010XXXXXXXX"
                        className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">العمر</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">الوحدة</label>
                      <select
                        value={ageUnit}
                        onChange={(e) => setAgeUnit(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg"
                      >
                        <option value="سنوات">سنوات</option>
                        <option value="شهور">شهور</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">النوع</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg"
                      >
                        <option value="male">ذكر (Male)</option>
                        <option value="female">أنثى (Female)</option>
                      </select>
                    </div>
                  </div>

                  {visitType === 'home_visit' && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        العنوان بالتفصيل لسحب العينات *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="المنطقة، الشارع، رقم العمارة، الشقة، وأقرب علامة مميزة بشبرا الخيمة..."
                        className="w-full p-2.5 border border-slate-200 rounded-lg"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">تاريخ الموعد المفضل</label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">الفترة الزمنية</label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg"
                      >
                        <option value="صباحاً (9:00 ص - 1:00 م)">صباحاً (9:00 ص - 1:00 م)</option>
                        <option value="ظهراً (1:00 م - 5:00 م)">ظهراً (1:00 م - 5:00 م)</option>
                        <option value="مساءً (5:00 م - 9:00 م)">مساءً (5:00 م - 9:00 م)</option>
                        <option value="ليلاً (9:00 م - 12:00 ص)">ليلاً (9:00 م - 12:00 ص)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Test & Package selection */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800">
                    اختر الباقة أو الفحوصات المطلوبة:
                  </div>

                  {/* Packages grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                            isSelected
                              ? 'border-rose-800 bg-rose-50 text-rose-950 ring-1 ring-rose-800'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span>{pkg.nameAr}</span>
                            <span className="font-mono text-rose-900">{pkg.packagePrice} ج.م</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                            {pkg.testCodes.join(' + ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Individual tests pills */}
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-500 block mb-1.5">
                      أو اختر فحوصات فردية إضافية:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {testsCatalog.map((t) => {
                        const isChecked = selectedTests.includes(t.code);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleToggleTest(t.code)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              isChecked
                                ? 'bg-rose-900 text-white border-rose-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {t.nameAr} ({t.price} ج.م)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Price summary & Submit */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">إجمالي التكلفة التقديرية:</span>
                    <span className="text-xl font-black font-mono text-rose-900">
                      {estimatedPrice} ج.م
                    </span>
                    {visitType === 'home_visit' && (
                      <span className="text-[11px] text-slate-400 block font-sans">
                        شامل خدمة الانتقال وسحب العينات المنزلي
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="py-3 px-6 text-xs sm:text-sm font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>تأكيد الحجز وتفعيل إرسال الواتساب</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: RESULTS LOOKUP */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                الاستعلام الفوري عن نتائج وتقارير التحاليل
              </h2>
              <p className="text-xs text-slate-500">
                أدخل كود العينة (الباركود) أو رقم الهاتف المسجل بالمعمل للاطلاع على النتائج فور اعتمادها
              </p>
            </div>

            <form onSubmit={handleSearchOrder} className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="رقم العينة أو الباركود (مثال: RT89201042)..."
                  value={searchBarcode}
                  onChange={(e) => setSearchBarcode(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="أو برقم الهاتف المسجل بالمعمل..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>بحث واستعلام</span>
              </button>
            </form>

            {hasSearched && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-700">
                  نتائج البحث ({foundOrders.length} تقرير):
                </div>

                {foundOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                    لم يتم العثور على تحاليل مطابقة للبيانات المدخلة. يرجى التأكد من رقم الباركود أو التواصل مع المعمل على: 01100874444.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {foundOrders.map((ord) => {
                      const isReady = ord.orderStatus === 'ready';
                      return (
                        <div
                          key={ord.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {ord.patient.name}
                              </span>
                              <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                                {ord.sampleBarcode}
                              </span>
                            </div>

                            <div className="text-xs text-rose-900 font-semibold">
                              التحاليل: {ord.tests.map((t) => t.nameAr).join(' · ')}
                            </div>

                            <div className="text-[11px] text-slate-400">
                              تاريخ السحب: {new Date(ord.createdAt).toLocaleDateString('ar-EG')} · الطبيب: {ord.referringDoctor || 'عام'}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isReady ? (
                              <button
                                onClick={() => onOpenReport(ord)}
                                className="px-4 py-2 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                <span>عرض وطباعة التقرير الطبي المعتمد</span>
                              </button>
                            ) : (
                              <div className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                العينة قيد المعالجة المخبرية بالأجهزة
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PACKAGES */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-bold text-slate-900">{pkg.nameAr}</h3>
                    </div>
                    <div className="text-left">
                      <span className="text-lg font-mono font-bold text-rose-900">
                        {pkg.packagePrice} ج.م
                      </span>
                      <span className="block text-[11px] font-mono text-slate-400 line-through">
                        بدلاً من {pkg.originalPrice} ج.م
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {pkg.description}
                  </p>

                  <div className="pt-2">
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                      التحاليل المشمولة ({pkg.testCodes.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.testCodes.map((code) => {
                        const def = testsCatalog.find((t) => t.code === code);
                        return (
                          <span
                            key={code}
                            className="text-xs font-semibold bg-rose-50 text-rose-950 border border-rose-200/60 px-2 py-0.5 rounded"
                          >
                            {def ? def.nameAr : code}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">
                    توفير: {pkg.originalPrice - pkg.packagePrice} ج.م
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      setSelectedTests(pkg.testCodes);
                      setActiveTab('book');
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    حجز هذه الباقة الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-1.5">
          <div className="font-bold text-rose-950">
            {profile.nameAr} - د. رامي مختار
          </div>
          <div>{profile.address}</div>
          <div className="font-mono text-slate-600">
            هواتف الحجز والتواصل: 01100874444 - 01100046841
          </div>
        </div>
      </footer>
    </div>
  );
};
