import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Laptop, Check, X, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);

  // If already running inside standalone app, show small verified badge or null
  if (isInstalled) {
    if (variant === 'banner') return null;
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold">
        <Check className="w-3 h-3 text-emerald-400" />
        <span>تطبيق مثبت (PWA)</span>
      </span>
    );
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowGenericModal(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white p-3 sm:p-4 rounded-2xl shadow-md border border-rose-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-800/80 border border-rose-600 flex items-center justify-center text-rose-200 shrink-0">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>تثبيت برنامج RT LAB LIS كتطبيق مستقل</span>
                <span className="text-[10px] bg-rose-700 text-white px-2 py-0.5 rounded-full font-mono">
                  Offline Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                تثبيت مباشر وسريع على الموبايل (Android / iOS) أو اللابتوب والكمبيوتر للعمل بسرعة وبدون متصفح
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all active:scale-95 w-full sm:w-auto justify-center"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <Laptop className="w-3.5 h-3.5" />
              <span>تثبيت البرنامج الآن</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          title="تثبيت التطبيق على الموبايل أو اللابتوب للعمل السريع بدون إنترنت"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-100 hover:text-white text-xs font-bold border border-rose-700/80 shadow-sm transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-rose-300" />
          <span className="hidden sm:inline">تثبيت التطبيق</span>
          <span className="sm:hidden">تثبيت</span>
        </button>
      )}

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-right space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-rose-800" />
                <span>تثبيت البرنامج على آيفون / آيباد</span>
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <Share2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span>1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري السفلي.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <PlusSquare className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <span>2. مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>3. سيظهر أيقونة التطبيق في شاشة جهازك كبرنامج كامل وسريع يعمل دون متصفح!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-rose-800 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}

      {/* Generic Modal (Desktop / Android manual) */}
      {showGenericModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-right space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-rose-800" />
                <span>تثبيت البرنامج على الكمبيوتر واللابتوب</span>
              </h3>
              <button
                onClick={() => setShowGenericModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                يمكنك تثبيت البرنامج على نظام <strong>Windows أو Mac أو Android</strong> بسهولة من خلال متصفح Chrome أو Edge:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p>
                  • انقر على أيقونة التثبيت <Download className="w-3.5 h-3.5 inline text-rose-800" /> الموجودة في شريط عنوان المتصفح بالأعلى (جانب النجمة).
                </p>
                <p>
                  • أو افتح قائمة المتصفح (⋮) واختر <strong>"تثبيت RT LAB LIS"</strong> أو <strong>"Install app"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGenericModal(false)}
              className="w-full py-2 bg-rose-800 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
