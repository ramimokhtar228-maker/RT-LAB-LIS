import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  FileText,
  Clock,
  ChevronLeft,
  TestTube2,
  Stethoscope,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Patient, LabOrder } from '../types/lab';

interface PatientsViewProps {
  patients: Patient[];
  orders: LabOrder[];
  onSelectPatientForOrder: (patient: Patient) => void;
  onOpenReport: (order: LabOrder) => void;
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  orders,
  onSelectPatientForOrder,
  onOpenReport,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
}) => {
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // New patient state
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [age, setAge] = useState(30);
  const [ageUnit, setAgeUnit] = useState<'سنوات' | 'شهور' | 'أيام'>('سنوات');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [doctor, setDoctor] = useState('');
  const [history, setHistory] = useState('');

  const filteredPatients = patients.filter(
    (p) =>
      p.name.includes(search) ||
      p.phone.includes(search) ||
      p.nationalId.includes(search)
  );

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const patientOrders = orders.filter((o) => o.patientId === activePatient?.id);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPat: Patient = {
      id: `pat-${Date.now()}`,
      nationalId: nationalId || '10000000000000',
      name,
      age,
      ageUnit,
      gender,
      phone,
      address,
      referringDoctor: doctor,
      medicalHistory: history,
      registeredAt: new Date().toISOString(),
    };

    onAddPatient(newPat);
    setSelectedPatientId(newPat.id);
    setShowAddModal(false);
    // Reset form
    setName('');
    setNationalId('');
    setPhone('');
    setAddress('');
    setDoctor('');
    setHistory('');
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      {/* 1. Left List of Patients */}
      <div className="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800">
              سجل المرضى ({patients.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مريض جديد</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، الرقم القومي..."
              value={search}
              onChange={(e) => setSearchQuerySafe(e.target.value)}
              className="w-full text-xs pl-2 pr-8 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredPatients.map((pat) => {
            const isSelected = pat.id === selectedPatientId;
            return (
              <div
                key={pat.id}
                onClick={() => setSelectedPatientId(pat.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-50 border-r-4 border-r-teal-600'
                    : 'hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-xs font-bold text-slate-900">{pat.name}</div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pat.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span>{pat.phone}</span>
                  <span>·</span>
                  <span>{pat.age} {pat.ageUnit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Patient Profile & Order History */}
      {activePatient ? (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
          {/* Patient Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">
                    {activePatient.name}
                  </h1>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    ID: {activePatient.nationalId}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                  <span>النوع: {activePatient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                  <span>·</span>
                  <span>العمر: {activePatient.age} {activePatient.ageUnit}</span>
                  <span>·</span>
                  <span>الهاتف: {activePatient.phone}</span>
                  <span>·</span>
                  <span>العنوان: {activePatient.address || 'غير مسجل'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingPatient(activePatient)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                  title="تعديل بيانات المريض"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-800" />
                  <span>تعديل البيانات</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من حذف ملف المريض (${activePatient.name}) نهائياً من قاعدة البيانات؟`)) {
                      onDeletePatient?.(activePatient.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  title="حذف المريض نهائياً"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف نهائي</span>
                </button>

                <button
                  onClick={() => onSelectPatientForOrder(activePatient)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>طلب فحص جديد</span>
                </button>
              </div>
            </div>

            {/* Clinical Background */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 ml-1">التاريخ المرضي والملاحظات السريرية:</span>
              <span className="text-slate-600">
                {activePatient.medicalHistory || 'لا توجد ملاحظات سريرية خاصة مسجلة'}
              </span>
            </div>
          </div>

          {/* Historical Test Orders for this Patient */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  سجل زيارات وفحوصات المريض ({patientOrders.length} زيارة)
                </h3>
                <p className="text-[11px] text-slate-400">
                  كافة التحاليل التي أجريت للمريض بالمعمل ونتائجها المعتمدة
                </p>
              </div>
            </div>

            {patientOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد طلبات سابقة مسجلة لهذا المريض حتى الآن.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {patientOrders.map((ord) => (
                  <div key={ord.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          باركود: {ord.sampleBarcode}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-teal-800">
                        {ord.tests.map((t) => t.nameAr).join(' · ')}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        الطبيب المعالج: {ord.referringDoctor || 'غير محدد'} · التكلفة: {ord.netAmount} ج.م ({ord.financialStatus === 'paid' ? 'مدفوع' : 'متبقي حساب'})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenReport(ord)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>معاينة وطباعة التقرير</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">تسجيل مريض جديد بالمعمل</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم ثلاثي *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سارة محمد الشربيني"
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الرقم القومي / الهوية</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="14 رقم"
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">العمر</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الوحدة</label>
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded"
                  >
                    <option value="سنوات">سنوات</option>
                    <option value="شهور">شهور</option>
                    <option value="أيام">أيام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">النوع</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الطبيب المعالج المعتاد</label>
                <input
                  type="text"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="د. اسم الطبيب"
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">التاريخ المرضي أو الحساسيات</label>
                <textarea
                  rows={2}
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  placeholder="ملاحظات صحية (أمراض مزمنة، أدوية منتظمة)..."
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  حفظ وتسجيل المريض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">تعديل بيانات المريض</h3>
              <button
                onClick={() => setEditingPatient(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingPatient.name.trim()) return;
                onUpdatePatient?.(editingPatient);
                setEditingPatient(null);
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم ثلاثي *</label>
                <input
                  type="text"
                  required
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الرقم القومي / الهوية</label>
                  <input
                    type="text"
                    value={editingPatient.nationalId}
                    onChange={(e) => setEditingPatient({ ...editingPatient, nationalId: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">العمر</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editingPatient.age}
                    onChange={(e) => setEditingPatient({ ...editingPatient, age: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الوحدة</label>
                  <select
                    value={editingPatient.ageUnit}
                    onChange={(e) => setEditingPatient({ ...editingPatient, ageUnit: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded"
                  >
                    <option value="سنوات">سنوات</option>
                    <option value="شهور">شهور</option>
                    <option value="أيام">أيام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">النوع</label>
                  <select
                    value={editingPatient.gender}
                    onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">العنوان</label>
                <input
                  type="text"
                  value={editingPatient.address || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الطبيب المعالج المعتاد</label>
                <input
                  type="text"
                  value={editingPatient.referringDoctor || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, referringDoctor: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">التاريخ المرضي أو الحساسيات</label>
                <textarea
                  rows={2}
                  value={editingPatient.medicalHistory || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, medicalHistory: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-blue-900 hover:bg-blue-800 rounded shadow-xs"
                >
                  تحديث البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function setSearchQuerySafe(val: string) {
    setSearch(val);
  }
};
