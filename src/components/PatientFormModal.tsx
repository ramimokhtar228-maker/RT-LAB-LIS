import React, { useState } from 'react';
import { PatientRecord } from '../types/lab';
import { User, Phone, Calendar, Clock, FileBadge, Stethoscope, AlertCircle, X, Save } from 'lucide-react';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: PatientRecord) => void;
  initialPatient?: PatientRecord | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPatient,
}) => {
  const now = new Date();
  const currentDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().substring(0, 5);

  const [formData, setFormData] = useState<Partial<PatientRecord>>(() => {
    if (initialPatient) return { ...initialPatient };
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const mrn = `RT-${now.getFullYear()}-${randNum}`;
    return {
      id: `pat-${Date.now()}`,
      mrn,
      barcode: mrn,
      name: '',
      nationalId: '',
      ageYears: 32,
      ageMonths: 0,
      gender: 'Male',
      phone: '',
      email: '',
      referringDoctor: 'Self / Direct Walk-in',
      sampleDate: currentDateStr,
      sampleTime: currentTimeStr,
      reportDate: currentDateStr,
      reportTime: currentTimeStr,
      sampleType: 'Venous Whole Blood / Serum',
      fastingStatus: 'Fasting 10-12 Hours',
      clinicalNotes: '',
      createdAt: new Date().toISOString(),
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'اسم المريض مطلوب (Patient name is required)';
    }
    if (!formData.ageYears && formData.ageYears !== 0) {
      newErrors.age = 'العمر مطلوب (Age is required)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData as PatientRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-700/50 rounded-lg">
              <User className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialPatient ? 'تعديل بيانات المريض' : 'تسجيل مريض جديد (New Patient Registration)'}
              </h2>
              <p className="text-xs text-rose-200 font-sans">
                معامل RT للتحاليل التشخيصية • د. رامي مختار
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-rose-700" />
              <span className="text-xs font-bold text-rose-950">
                Medical Record No (MRN / Barcode):
              </span>
              <span className="font-mono font-bold text-rose-700 text-sm bg-white px-2 py-0.5 rounded border border-rose-200">
                {formData.mrn}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-sans">
              Auto-generated unique sample ID
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Name (Arabic or English) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                اسم المريض (Patient Full Name) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: أحمد محمود علي / Ahmed Mahmoud Ali"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-rose-600 focus:outline-none transition-all ${
                  errors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-white'
                }`}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العمر بالسنوات (Age - Yrs) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={formData.ageYears ?? 0}
                  onChange={(e) => setFormData({ ...formData, ageYears: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الشهور (Months)
                </label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={formData.ageMonths ?? 0}
                  onChange={(e) => setFormData({ ...formData, ageMonths: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                النوع (Gender) <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'Male' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    formData.gender === 'Male'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ذكر (Male)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'Female' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    formData.gender === 'Female'
                      ? 'bg-rose-800 text-white border-rose-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  أنثى (Female)
                </button>
              </div>
            </div>

            {/* National ID / Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرقم القومي / جواز السفر (National ID / Passport)
              </label>
              <input
                type="text"
                value={formData.nationalId || ''}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="29801010101234"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-rose-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف / واتساب (Phone / WhatsApp)
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01001234567"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-rose-600 focus:outline-none"
              />
            </div>

            {/* Doctor */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الطبيب المعالج / الجهة المحولة (Referring Doctor / Clinic)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.referringDoctor || ''}
                  onChange={(e) => setFormData({ ...formData, referringDoctor: e.target.value })}
                  placeholder="Dr. Ahmed Hassan / Internal Medicine / Self"
                  className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
                <Stethoscope className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Sample & Report Timings */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ سحب العينة (Sample Date)
                </label>
                <input
                  type="date"
                  value={formData.sampleDate || currentDateStr}
                  onChange={(e) => setFormData({ ...formData, sampleDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وقت السحب (Sample Time)
                </label>
                <input
                  type="time"
                  value={formData.sampleTime || currentTimeStr}
                  onChange={(e) => setFormData({ ...formData, sampleTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ صدور التقرير (Report Date)
                </label>
                <input
                  type="date"
                  value={formData.reportDate || currentDateStr}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وقت الصدور (Report Time)
                </label>
                <input
                  type="time"
                  value={formData.reportTime || currentTimeStr}
                  onChange={(e) => setFormData({ ...formData, reportTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            {/* Sample Type & Fasting */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع العينة (Specimen Type)
              </label>
              <select
                value={formData.sampleType}
                onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-600 focus:outline-none bg-white"
              >
                <option value="Venous Whole Blood / Serum">Venous Whole Blood & Serum</option>
                <option value="Serum (Yellow SST Gel)">Serum (Yellow SST Gel)</option>
                <option value="Whole Blood (EDTA Purple)">Whole Blood (EDTA Purple)</option>
                <option value="Citrated Plasma (Blue Tube)">Citrated Plasma (Blue Tube)</option>
                <option value="Fluoride Plasma (Grey Tube)">Fluoride Plasma (Grey Tube)</option>
                <option value="Random Clean Catch Urine">Random Clean Catch Urine</option>
                <option value="24-Hour Urine Specimen">24-Hour Urine Specimen</option>
                <option value="Stool Specimen">Stool Specimen</option>
                <option value="Semen Specimen">Semen Specimen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حالة الصيام والتحضير (Fasting Status)
              </label>
              <select
                value={formData.fastingStatus}
                onChange={(e) => setFormData({ ...formData, fastingStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-600 focus:outline-none bg-white"
              >
                <option value="Fasting 10-12 Hours">Fasting 10-12 Hours (Strict)</option>
                <option value="Fasting 8 Hours">Fasting 8 Hours</option>
                <option value="2 Hours Postprandial">2 Hours Postprandial (2h PP)</option>
                <option value="Random / Non-Fasting">Random / Non-Fasting</option>
                <option value="Morning Early Sample">Morning Early Sample</option>
              </select>
            </div>

            {/* Clinical Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات سريرية وتشخيص مبدئي (Clinical Indication / Diagnosis)
              </label>
              <input
                type="text"
                value={formData.clinicalNotes || ''}
                onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                placeholder="e.g. Routine checkup / Suspected diabetes / Fatigue & weight loss / Jaundice"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              إلغاء (Cancel)
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-950 text-white text-xs font-bold hover:from-rose-700 hover:to-rose-900 shadow-lg shadow-rose-900/30 transition-all transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ بيانات المريض (Save Patient)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
