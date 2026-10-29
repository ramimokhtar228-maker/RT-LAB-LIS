import React, { useState } from 'react';
import { LabSettings, LabSignature } from '../types/lab';
import { RTLogo } from './RTLogo';
import {
  X,
  Save,
  Settings,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Image,
  UserCheck,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Check,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  Upload
} from 'lucide-react';
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
  const [form, setForm] = useState<LabSettings>({
    ...settings,
    signatures: settings.signatures && settings.signatures.length > 0
      ? settings.signatures
      : DEFAULT_LAB_SETTINGS.signatures,
  });

  const [activeTab, setActiveTab] = useState<'general' | 'signatures' | 'branding'>('signatures');

  // Editing signature state
  const [editingSig, setEditingSig] = useState<LabSignature | null>(null);
  const [isNewSig, setIsNewSig] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    onClose();
  };

  const handleReset = () => {
    if (confirm('هل تريد استعادة إعدادات الترويسة والتوقيعات الافتراضية لمعامل RT؟')) {
      setForm({ ...DEFAULT_LAB_SETTINGS });
    }
  };

  // Signatures CRUD
  const handleSaveSignature = (sig: LabSignature) => {
    const existingIndex = form.signatures.findIndex((s) => s.id === sig.id);
    let updated: LabSignature[];
    if (existingIndex >= 0) {
      updated = [...form.signatures];
      updated[existingIndex] = sig;
    } else {
      updated = [...form.signatures, sig];
    }
    setForm({ ...form, signatures: updated });
    setEditingSig(null);
    setIsNewSig(false);
  };

  const handleDeleteSignature = (sigId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التوقيع نهائياً من التقارير؟')) {
      setForm({
        ...form,
        signatures: form.signatures.filter((s) => s.id !== sigId),
      });
    }
  };

  const handleToggleSignatureVisibility = (sigId: string) => {
    setForm({
      ...form,
      signatures: form.signatures.map((s) =>
        s.id === sigId ? { ...s, show: !s.show } : s
      ),
    });
  };

  // Image Upload handler for custom logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setForm({ ...form, logoUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A1C30] via-rose-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-800/60 rounded-xl">
              <Settings className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                إعدادات هوية المعمل والتوقيعات الرسمية (Lab Administration)
              </h3>
              <p className="text-xs text-rose-200">
                إدارة التوقيعات (إضافة وتعديل وحجم مناسب وحذف نهائي)، بيانات قصر العيني، واللوجو المعتمد
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-3 bg-slate-50">
          <button
            onClick={() => setActiveTab('signatures')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'signatures'
                ? 'bg-white text-rose-950 border-t-2 border-rose-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-rose-800" />
            <span>إدارة التوقيعات والأطباء ({form.signatures?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-rose-950 border-t-2 border-rose-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-rose-800" />
            <span>العناوين والهواتف وقصر العيني</span>
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'branding'
                ? 'bg-white text-rose-950 border-t-2 border-rose-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Image className="w-4 h-4 text-rose-800" />
            <span>اللوجو والتقرير الذكي والخيارات</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ================= TAB 1: SIGNATURES MANAGEMENT ================= */}
          {activeTab === 'signatures' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    قائمة التوقيعات والأختام الرسمية المعتمدة
                  </h4>
                  <p className="text-xs text-slate-500">
                    توقيعات بحجم مناسب متناسق مع التقرير، قابلة للتعديل والتحكم بالحجم، وإضافة أطباء جدد
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSig({
                      id: `sig-${Date.now()}`,
                      name: '',
                      title: 'استشاري التحاليل الطبية والباثولوجيا الإكلينيكية',
                      role: 'Pathologist',
                      signatureType: 'font',
                      signatureText: '',
                      signatureHeight: 40,
                      show: true,
                    });
                    setIsNewSig(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة توقيع جديد</span>
                </button>
              </div>

              {/* Signatures Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {form.signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-mono">
                          {sig.role}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleSignatureVisibility(sig.id)}
                            className={`p-1 rounded ${sig.show ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'}`}
                            title={sig.show ? 'إخفاء التوقيع' : 'إظهار التوقيع'}
                          >
                            {sig.show ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSig({ ...sig });
                              setIsNewSig(false);
                            }}
                            className="p-1 rounded text-blue-700 hover:bg-blue-100"
                            title="تعديل التوقيع"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSignature(sig.id)}
                            className="p-1 rounded text-rose-700 hover:bg-rose-100"
                            title="حذف نهائي للتوقيع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Signature Preview */}
                      <div
                        style={{ height: `${sig.signatureHeight || 40}px` }}
                        className="my-2 border border-dashed border-slate-300 rounded-lg flex items-center justify-center font-serif italic text-base text-slate-800 bg-white"
                      >
                        {sig.signatureText || sig.name || 'Signature'}
                      </div>

                      <div className="font-bold text-xs text-slate-900">{sig.name}</div>
                      <div className="text-[10.5px] text-slate-500 leading-snug mt-0.5">{sig.title}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                      <span>الارتفاع: {sig.signatureHeight || 40}px</span>
                      <span className={sig.show ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                        {sig.show ? '✓ يظهر في التقرير' : 'مخفي'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: GENERAL LAB & ADDRESS ================= */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المعمل بالعربية
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
                    اسم المعمل بالإنجليزية
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
                    الوصف الفرعي (العنوان الاستشاري)
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
                    الوصف الفرعي بالإنجليزية (Kasr Al Ainy)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.labSubtitleEn}
                    onChange={(e) => setForm({ ...form, labSubtitleEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-sans focus:ring-2 focus:ring-rose-700 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان المعمل المعتمد (Address)
                  </label>
                  <input
                    type="text"
                    value={form.addressAr}
                    onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    هاتف الطوارئ 1 (Emergency Tel 1)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.phone1}
                    onChange={(e) => setForm({ ...form, phone1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    هاتف الطوارئ 2 (Emergency Tel 2)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.phone2}
                    onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاعتماد والجودة (Accreditation)
                  </label>
                  <input
                    type="text"
                    value={form.accreditationText}
                    onChange={(e) => setForm({ ...form, accreditationText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نص الختم المعتمد
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
          )}

          {/* ================= TAB 3: BRANDING & LOGO ================= */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              {/* Logo Preview & Custom Upload */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Image className="w-4 h-4 text-rose-800" />
                      <span>شعار وهوية معامل RT الرسمية:</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      لوجو فيكتور SVG عالي الدقة يظهر دائماً بدون انقطاع، مع إمكانية رفع صورة مخصصة
                    </p>
                  </div>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-rose-800" />
                    <span>رفع لوجو من جهازك</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Live Logo Preview Box */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <RTLogo size={70} imageUrl={form.logoUrl} />
                    <div>
                      <div className="font-black text-sm text-rose-950 font-sans">
                        RT Diagnostic Laboratories
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        KASR AL AINY FACULTY OF MEDICINE CONSULTANTS
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>اللوجو نشط ومضمن تلقائياً في جميع التقارير A4 والترويسة</span>
                      </div>
                    </div>
                  </div>

                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: '' })}
                      className="text-xs text-rose-700 hover:underline font-bold"
                    >
                      استعادة درع RT الافتراضي
                    </button>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.showSmartReportPage}
                    onChange={(e) => setForm({ ...form, showSmartReportPage: e.target.checked })}
                    className="rounded text-rose-800 focus:ring-rose-700"
                  />
                  <div className="leading-tight">
                    <span className="font-bold text-slate-800 block">صفحة التقرير الذكي منفصلة</span>
                    <span className="text-[10px] text-slate-500">دمج صفحة إكلينيكية منفصلة في نهاية التقرير</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.showRecommendedTests}
                    onChange={(e) => setForm({ ...form, showRecommendedTests: e.target.checked })}
                    className="rounded text-rose-800 focus:ring-rose-700"
                  />
                  <div className="leading-tight">
                    <span className="font-bold text-slate-800 block">تحاليل مقترحة للمتابعة</span>
                    <span className="text-[10px] text-slate-500">اختصارات تحاليل بدون أسعار في التقرير</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.showStamp}
                    onChange={(e) => setForm({ ...form, showStamp: e.target.checked })}
                    className="rounded text-rose-800 focus:ring-rose-700"
                  />
                  <span className="font-bold text-slate-800">إظهار الختم الرسمي للتقرير</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.showBarcode}
                    onChange={(e) => setForm({ ...form, showBarcode: e.target.checked })}
                    className="rounded text-rose-800 focus:ring-rose-700"
                  />
                  <span className="font-bold text-slate-800">إظهار باركود العينة</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.showMethodology}
                    onChange={(e) => setForm({ ...form, showMethodology: e.target.checked })}
                    className="rounded text-rose-800 focus:ring-rose-700"
                  />
                  <span className="font-bold text-slate-800">إظهار طرق القياس والأجهزة</span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Controls */}
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
                <span>حفظ جميع التعديلات</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal: Edit or Add Signature */}
        {editingSig && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-right space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {isNewSig ? 'إضافة توقيع استشاري جديد' : `تعديل توقيع: ${editingSig.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingSig(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم الطبيب / الكيميائي *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSig.name}
                    onChange={(e) => setEditingSig({ ...editingSig, name: e.target.value })}
                    placeholder="مثال: أ.د / رامي مختار"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اللقب العلمي والمسمى الوظيفي *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSig.title}
                    onChange={(e) => setEditingSig({ ...editingSig, title: e.target.value })}
                    placeholder="مثال: استشاري التحاليل الطبية والباثولوجيا الإكلينيكية - طب قصر العيني"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الصفة الطبية</label>
                    <select
                      value={editingSig.role}
                      onChange={(e) => setEditingSig({ ...editingSig, role: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Pathologist">Consultant Pathologist (استشاري باثولوجيا)</option>
                      <option value="Chemist">Medical Biochemist (كيميائي)</option>
                      <option value="QualityManager">Quality Manager (مدير الجودة)</option>
                      <option value="Consultant">Clinical Consultant (استشاري إكلينيكي)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ارتفاع التوقيع ({editingSig.signatureHeight || 40}px)
                    </label>
                    <input
                      type="range"
                      min="28"
                      max="65"
                      value={editingSig.signatureHeight || 40}
                      onChange={(e) =>
                        setEditingSig({ ...editingSig, signatureHeight: parseInt(e.target.value) })
                      }
                      className="w-full accent-rose-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    شكل الإمضاء بالخط اللاتيني الأنيق (Signature Font Text)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingSig.signatureText || ''}
                    onChange={(e) => setEditingSig({ ...editingSig, signatureText: e.target.value })}
                    placeholder="e.g. Dr. Rami Mokhtar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-serif italic text-sm"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    معاينة حية للتوقيع بالحجم المحدد:
                  </span>
                  <div
                    style={{ height: `${editingSig.signatureHeight || 40}px` }}
                    className="border border-dashed border-slate-300 rounded-lg flex items-center justify-center font-serif italic text-base text-rose-950 bg-white"
                  >
                    {editingSig.signatureText || editingSig.name || 'Signature Preview'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSig(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => editingSig.name && handleSaveSignature(editingSig)}
                  className="px-5 py-2 rounded-xl bg-rose-800 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
                >
                  حفظ التوقيع
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
