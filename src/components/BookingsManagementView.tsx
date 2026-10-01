import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Phone,
  Send,
  CheckCircle2,
  Clock,
  Home,
  TestTube2,
  ArrowRight,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { PatientBooking } from '../types/lab';
import { LabProfile, generateBookingWhatsAppUrl } from '../services/storage';
import { RECEPTION_PHOTO_IMG, onImageErrorFallback } from '../assets/images';

interface BookingsManagementViewProps {
  bookings: PatientBooking[];
  profile: LabProfile;
  onConfirmBooking: (bookingId: string) => void;
  onConvertToOrder: (booking: PatientBooking) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const BookingsManagementView: React.FC<BookingsManagementViewProps> = ({
  bookings,
  profile,
  onConfirmBooking,
  onConvertToOrder,
  onCancelBooking,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.patientName.includes(search) ||
      b.phone.includes(search) ||
      b.bookingCode.includes(search);

    if (!matchesSearch) return false;

    if (filterType === 'home_visit') return b.visitType === 'home_visit';
    if (filterType === 'lab_visit') return b.visitType === 'lab_visit';
    if (filterType === 'pending') return b.status === 'pending';
    return true;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            إدارة حجوزات المرضى والزيارات المنزلية
          </h1>
          <p className="text-xs text-slate-500">
            متابعة الحجوزات الواردة من البوابة الإلكترونية، تأكيد المواعيد، وتفعيل إرسال رسائل الواتساب
          </p>
        </div>

        <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
          إجمالي الحجوزات: <span className="font-mono font-bold">{bookings.length}</span>
        </div>
      </div>

      {/* Reception Desk Showcase Card */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-rose-900/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-5 overflow-hidden">
        <div className="space-y-1.5 max-w-xl text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Home className="w-3.5 h-3.5" />
            <span>خدمة العملاء والاستقبال · فرع بهتيم شبرا الخيمة</span>
          </div>
          <h2 className="text-base font-black text-white">
            استقبال معامل رامي مختار (RT LAB) للتحاليل والزيارات المنزلية
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            تنظيم مواعيد سحب العينات داخل المعمل أو إرسال فنيين متخصصين لسحب العينات المنزلية لكبار السن والأطفال وذوي الاحتياجات الخاصة بأحدث أنابيب الفحص المعقمة.
          </p>
        </div>

        <div className="w-full md:w-64 h-36 rounded-xl overflow-hidden border-2 border-rose-400/40 shadow-xl shrink-0 relative group">
          <img
            src={RECEPTION_PHOTO_IMG}
            alt="استقبال معامل رامي مختار RT LAB"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => onImageErrorFallback(e)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
            <span className="text-[10px] font-bold text-white">
              كونتر استقبال معامل رامي مختار
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'all' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              الكل ({bookings.length})
            </button>
            <button
              onClick={() => setFilterType('home_visit')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'home_visit' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              الزيارات المنزلية (Home Visits)
            </button>
            <button
              onClick={() => setFilterType('lab_visit')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'lab_visit' ? 'bg-teal-600 text-white font-bold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              زيارات فرع بهتيم
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'pending' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              بانتظار التأكيد
            </button>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، كود الحجز..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-2 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                <th className="py-2.5 px-3">كود الحجز / التاريخ</th>
                <th className="py-2.5 px-3">المريض وبيانات الاتصال</th>
                <th className="py-2.5 px-3">نوع الزيارة والموقع</th>
                <th className="py-2.5 px-3">الفحوصات المطلوبة</th>
                <th className="py-2.5 px-3 text-center">المبلغ التقديري</th>
                <th className="py-2.5 px-3 text-center">الحالة</th>
                <th className="py-2.5 px-3 text-center">إجراءات المتابعة وواتساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-900 block">
                      {b.bookingCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {b.appointmentDate} · {b.appointmentTimeSlot}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{b.patientName}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-teal-600" />
                      <span>{b.phone}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {b.visitType === 'home_visit' ? (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                        <Home className="w-3 h-3" /> زيارة منزلية
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                        <TestTube2 className="w-3 h-3 text-teal-600" /> زيارة فرع بهتيم
                      </span>
                    )}
                    {b.address && (
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {b.address}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-teal-800 text-[11px]">
                      {b.selectedPackageName || b.selectedTests.join(' + ')}
                    </div>
                    {b.notes && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        ملاحظات: {b.notes}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                    {b.estimatedPrice} ج.م
                  </td>

                  <td className="py-3 px-3 text-center">
                    {b.status === 'confirmed' ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                        مؤكد
                      </span>
                    ) : b.status === 'completed' ? (
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full inline-block">
                        تم التحويل لطلب
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                        بانتظار التأكيد
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* WhatsApp trigger */}
                      <a
                        href={generateBookingWhatsAppUrl(b, profile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded"
                        title="إرسال تأكيد الحجز للمريض عبر واتساب"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </a>

                      {/* Convert to Lab Order */}
                      <button
                        onClick={() => onConvertToOrder(b)}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-2xs flex items-center gap-1"
                        title="تحويل الحجز إلى طلب سحب عينات واستقبال"
                      >
                        <span>تحويل لطلب</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {/* Cancel */}
                      <button
                        onClick={() => {
                          if (window.confirm('هل تريد إلغاء هذا الحجز؟')) {
                            onCancelBooking(b.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="إلغاء الحجز"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
