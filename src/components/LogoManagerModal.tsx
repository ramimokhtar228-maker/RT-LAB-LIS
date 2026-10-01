import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Check,
  RefreshCw,
  Sparkles,
  Shield,
  FileImage,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { LabProfile } from '../services/storage';
import {
  RT_BRAND_LOGO,
  RAMI_CLASSIC_LOGO,
  FALLBACK_LOGO_SVG,
  resolveLabLogo,
  onImageErrorFallback,
} from '../assets/images';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LabProfile;
  onUpdateProfile: (updated: LabProfile) => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const currentLogo = resolveLabLogo(profile.logoUrl);
  const [selectedLogo, setSelectedLogo] = useState<string>(currentLogo);
  const [previewError, setPreviewError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedLogo(dataUrl);
        setPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated: LabProfile = {
      ...profile,
      logoUrl: selectedLogo,
    };
    onUpdateProfile(updated);
    setSuccessMessage('تم حفظ وتحديث اللوجو في كافة واجهات النظام والتقارير بنجاح!');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    setSelectedLogo(RT_BRAND_LOGO);
    setPreviewError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-rose-200 overflow-hidden my-auto text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white p-5 flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-300">
              <Sliders className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                تخصيص اللوجو والهوية الرسمية للمعمل
              </h2>
              <p className="text-xs text-rose-200/80">
                معامل د. رامي مختار للتحاليل الطبية والتشخيصية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Notice */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-black block text-rose-950">
                تم حل مشكلة ظهور اللوجو نهائياً:
              </span>
              يمكنك الآن إما رفع ملف اللوجو الأصلي الخاص بمعملك مباشرة من جهازك (PNG/JPG)، أو اختيار أي من اللوجوهات الطبية الجاهزة المعتمدة. سيظهر اللوجو المختار فوراً في شريط العنوان، وتقارير النتائج المطبوعة A4، وبوابة المرضى.
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-800" />
                معاينة اللوجو في مواضع النظام المختلفة:
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                مباشر وفوري
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Preview 1: Header Bar */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">
                  شريط رأس الصفحة (Header)
                </span>
                <div className="w-12 h-12 mx-auto rounded-xl overflow-hidden border border-rose-300 shadow-2xs bg-slate-950 flex items-center justify-center p-0.5">
                  <img
                    src={selectedLogo}
                    alt="معاينة"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      setPreviewError(true);
                      onImageErrorFallback(e);
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-600 block truncate font-medium">
                  {profile.nameAr}
                </span>
              </div>

              {/* Preview 2: A4 Print Report Header */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">
                  ترويسة تقرير الطباعة (A4)
                </span>
                <div className="w-14 h-14 mx-auto rounded-xl overflow-hidden border-2 border-rose-800 shadow-2xs bg-slate-950 flex items-center justify-center p-1">
                  <img
                    src={selectedLogo}
                    alt="معاينة التقرير"
                    className="w-full h-full object-contain"
                    onError={(e) => onImageErrorFallback(e)}
                  />
                </div>
                <span className="text-[10px] text-rose-900 block font-bold">
                  ISO 15189:2022
                </span>
              </div>

              {/* Preview 3: Mobile PWA App Icon */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">
                  أيقونة الموبايل وتطبيق PWA
                </span>
                <div className="w-12 h-12 mx-auto rounded-2xl overflow-hidden border-2 border-slate-900 shadow-md bg-slate-950 flex items-center justify-center p-1">
                  <img
                    src={selectedLogo}
                    alt="أيقونة الموبايل"
                    className="w-full h-full object-cover"
                    onError={(e) => onImageErrorFallback(e)}
                  />
                </div>
                <span className="text-[10px] text-slate-600 block font-medium">
                  تطبيق سطح المكتب
                </span>
              </div>
            </div>
          </div>

          {/* Action: Upload Custom Logo from Device */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-800 block">
              1. رفع لوجو مخصص من جهازك (كمبيوتر أو موبايل):
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="w-full py-3 px-4 border-2 border-dashed border-rose-300 hover:border-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center gap-2.5 text-rose-950 font-bold text-xs sm:text-sm group cursor-pointer"
            >
              <Upload className="w-5 h-5 text-rose-700 group-hover:scale-110 transition-transform" />
              <span>اختر ملف اللوجو من جهازك (PNG, JPG, SVG)</span>
            </button>
            <p className="text-[11px] text-slate-500">
              * يدعم الملفات الشفافة والمربعة أو الدائرية. يتم تخزين اللوجو مباشرة داخل متصفحك.
            </p>
          </div>

          {/* Selection of Pre-made Official RT Logos */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-slate-800 block">
              2. أو اختر من النماذج الرسمية المدمجة لمعامل RT:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: 3D RT LABS Blood Drop */}
              <button
                type="button"
                onClick={() => setSelectedLogo(RT_BRAND_LOGO)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center gap-2 relative ${
                  selectedLogo === RT_BRAND_LOGO
                    ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-600/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {selectedLogo === RT_BRAND_LOGO && (
                  <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-rose-300 bg-slate-950 flex items-center justify-center p-0.5">
                  <img
                    src={RT_BRAND_LOGO}
                    alt="RT LABS 3D"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-black text-slate-900 block">
                    لوجو RT ثلاثي الأبعاد
                  </span>
                  <span className="text-[10px] text-slate-500">
                    قطرة دم ياقوتية + حروف معدنية
                  </span>
                </div>
              </button>

              {/* Option 2: Classic Dr. Rami Mokhtar Shield */}
              <button
                type="button"
                onClick={() => setSelectedLogo(RAMI_CLASSIC_LOGO)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center gap-2 relative ${
                  selectedLogo === RAMI_CLASSIC_LOGO
                    ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-600/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {selectedLogo === RAMI_CLASSIC_LOGO && (
                  <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-rose-300 bg-slate-950 flex items-center justify-center p-0.5">
                  <img
                    src={RAMI_CLASSIC_LOGO}
                    alt="Classic Shield"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-black text-slate-900 block">
                    درع د. رامي مختار الطبي
                  </span>
                  <span className="text-[10px] text-slate-500">
                    رمز الباثولوجيا الكلاسيكي
                  </span>
                </div>
              </button>

              {/* Option 3: Clean Vector SVG Emblem */}
              <button
                type="button"
                onClick={() => setSelectedLogo(FALLBACK_LOGO_SVG)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center gap-2 relative ${
                  selectedLogo === FALLBACK_LOGO_SVG
                    ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-600/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {selectedLogo === FALLBACK_LOGO_SVG && (
                  <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-rose-300 bg-slate-950 flex items-center justify-center p-0.5">
                  <img
                    src={FALLBACK_LOGO_SVG}
                    alt="Vector Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-black text-slate-900 block">
                    لوجو فيكتور فائق النقاء
                  </span>
                  <span className="text-[10px] text-slate-500">
                    أيقونة SVG خفيفة بدون تشويش
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-bold text-slate-600 hover:text-rose-900 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>استعادة اللوجو الافتراضي</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-black text-white bg-rose-900 hover:bg-rose-800 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتطبيق اللوجو الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
