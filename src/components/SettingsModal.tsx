import React, { useState } from 'react';
import { LabSettings } from '../types/lab';
import { X, Save, Settings, Building2, Phone, Mail, Globe, MapPin, ShieldCheck, Image, UserCheck, RotateCcw } from 'lucide-react';
import { DEFAULT_LAB_SETTINGS } from '../data/defaultCatalog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LabSettings;
  onSaveSettings: (settings: LabSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<LabSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    onClose();
  };

  const handleReset = () => {
    if (confirm('هل تريد استعادة إعدادات الترويسة والامضاءات الافتراضية؟')) {
      setForm({ ...DEFAULT_LAB_SETTINGS });
    }
  };

  const availableLogos = [
    { label: 'شعار RT LABS الأساسي (قطرة الدم والتكنولوجيا)', path: '/assets/aistudio/photo_2026-10-02_00-22-10_28ae1371.jpg' },
    { label: 'شعار RT LAB مع الميكروسكوب في دائرة', path: '/assets/aistudio/photo_2026-10-29_09-56-32_9b5d947e.jpg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-800/60 rounded-xl">
              <Settings className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                إعدادات هوية المعمل والترويسة والامضاءات الرسمية
              </h3>
              <p className="text-xs text-rose-300">
                تعديل اسم المعمل، اللوجو، العناوين، الهواتف، وتوقيعات الكيميائي والباثولوجي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Image className="w-4 h-4 text-rose-800" />
              <span>لوجو وهوية المعمل المعتمد:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableLogos.map((lg) => (
                <div
                  key={lg.path}
                  onClick={() => setForm({ ...form, logoUrl: lg.path })}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                    form.logoUrl === lg.path
                      ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={lg.path} alt="Logo option" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                  <span className="text-xs font-bold text-slate-800 leading-snug">{lg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Names & Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المعمل بالعربية (Lab Arabic Name)
              </label>
              <input
                type="text"
                value={form.labNameAr}
                onChange={(e) => setForm({ ...form, labNameAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-rose-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المعمل بالإنجليزية (Lab English Name)
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.labNameEn}
                onChange={(e) => setForm({ ...form, labNameEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-sans focus:ring-2 focus:ring-rose-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوصف الفرعي بالعربية (Subtitle Ar)
              </label>
              <input
                type="text"
                value={form.labSubtitleAr}
                onChange={(e) => setForm({ ...form, labSubtitleAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوصف الفرعي بالإنجليزية (Subtitle En)
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.labSubtitleEn}
                onChange={(e) => setForm({ ...form, labSubtitleEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-sans focus:ring-2 focus:ring-rose-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان المعمل (Lab Address)
              </label>
              <input
                type="text"
                value={form.addressAr}
                onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف الرئيسي / الخط الساخن (Phone 1)
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.phone1}
                onChange={(e) => setForm({ ...form, phone1: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف الثاني / واتساب (Phone 2)
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.phone2}
                onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني (Email)
              </label>
              <input
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الموقع الإلكتروني (Website)
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          {/* Signatures & Titles */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-rose-800" />
              <span>توقيعات ونهاية التقرير الطبي:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الكيميائي (Medical Biochemist Name)
                </label>
                <input
                  type="text"
                  value={form.chemistName}
                  onChange={(e) => setForm({ ...form, chemistName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المسمى الوظيفي للكيميائي (Chemist Title)
                </label>
                <input
                  type="text"
                  value={form.chemistTitle}
                  onChange={(e) => setForm({ ...form, chemistTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-900 mb-1">
                  اسم طبيب الباثولوجيا الإكلينيكية (Consultant Pathologist)
                </label>
                <input
                  type="text"
                  value={form.pathologistName}
                  onChange={(e) => setForm({ ...form, pathologistName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs font-black text-rose-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مسمى استشاري الباثولوجيا (Pathologist Title)
                </label>
                <input
                  type="text"
                  value={form.pathologistTitle}
                  onChange={(e) => setForm({ ...form, pathologistTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص الختم الرسمي (Official Verified Stamp Text)
                </label>
                <input
                  type="text"
                  value={form.stampText}
                  onChange={(e) => setForm({ ...form, stampText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.showStamp}
                onChange={(e) => setForm({ ...form, showStamp: e.target.checked })}
                className="rounded text-rose-800 focus:ring-rose-700"
              />
              <span className="font-bold text-slate-800">إظهار الختم الرسمي</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.showWatermark}
                onChange={(e) => setForm({ ...form, showWatermark: e.target.checked })}
                className="rounded text-rose-800 focus:ring-rose-700"
              />
              <span className="font-bold text-slate-800">علامة مائية بالخلفية</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.showBarcode}
                onChange={(e) => setForm({ ...form, showBarcode: e.target.checked })}
                className="rounded text-rose-800 focus:ring-rose-700"
              />
              <span className="font-bold text-slate-800">باركود العينة</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.showMethodology}
                onChange={(e) => setForm({ ...form, showMethodology: e.target.checked })}
                className="rounded text-rose-800 focus:ring-rose-700"
              />
              <span className="font-bold text-slate-800">طريقة عمل الأجهزة</span>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الإعدادات الأصلية</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
