import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Laptop,
  Cloud,
  CheckCircle2,
  Share2,
  UploadCloud,
  DownloadCloud,
  ShieldCheck,
  Apple,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getCloudSyncMetadata, getDeviceId } from '../services/storage';
import { resolveLabLogo, onImageErrorFallback } from '../assets/images';

interface InstallAppModalProps {
  onClose: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonData: string) => void;
  labLogoUrl?: string;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  onClose,
  onExportBackup,
  onImportBackup,
  labLogoUrl = resolveLabLogo(),
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install_guide' | 'multi_device' | 'cloud_backup' | 'qr_code' | 'github_upload'>('install_guide');
  const [deviceFilter, setDeviceFilter] = useState<'android' | 'ios' | 'laptop'>(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'ios';
      if (/android/.test(ua)) return 'android';
    }
    return 'android';
  });
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    setDownloadSuccess(false);
    try {
      const res = await fetch('/rt-lab-lis-source.zip?t=' + Date.now());
      if (!res.ok) throw new Error('فشل جلب الملف من الخادم');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'rt-lab-lis-source.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error(err);
      // Fallback
      window.location.href = '/rt-lab-lis-source.zip';
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const deviceId = getDeviceId();
  const syncMeta = getCloudSyncMetadata();
  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ramimokhtar-lab.app';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportBackup(content);
        setImportStatus('تمت استعادة ومزامنة بيانات المعمل بنجاح على هذا الجهاز!');
        setTimeout(() => setImportStatus(null), 3500);
      } catch {
        alert('الملف غير صالح أو تالف.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Dark Red (Crimson) & Navy Gradient */}
        <div className="p-4 sm:p-5 border-b border-rose-900 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-rose-300 shadow-md bg-slate-950 shrink-0 flex items-center justify-center p-0.5">
              <img
                src={labLogoUrl}
                alt="لوجو معامل رامي مختار"
                className="w-full h-full object-contain"
                onError={(e) => onImageErrorFallback(e)}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">
                  مركز التثبيت والمزامنة السحابية للأجهزة
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  سحابة متصلة 🟢
                </span>
              </div>
              <p className="text-[11px] text-rose-200 mt-0.5">
                معامل رامي مختار للتحاليل التشخيصية · دعم العمل على الموبايل واللابتوب معاً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('install_guide')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'install_guide'
                ? 'border-rose-900 text-rose-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-rose-800" />
            <span>كيفية تحميل وتثبيت البرنامج</span>
          </button>

          <button
            onClick={() => setActiveTab('multi_device')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'multi_device'
                ? 'border-blue-900 text-blue-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-800" />
            <span>العمل على أكثر من جهاز ولابتوب</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud_backup')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cloud_backup'
                ? 'border-rose-900 text-rose-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-rose-800" />
            <span>التزامن السحابي والنسخ الاحتياطي</span>
          </button>

          <button
            onClick={() => setActiveTab('qr_code')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'qr_code'
                ? 'border-blue-900 text-blue-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-blue-800" />
            <span>رمز QR للموبايل</span>
          </button>

          <button
            onClick={() => setActiveTab('github_upload')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'github_upload'
                ? 'border-emerald-700 text-emerald-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-emerald-700" />
            <span>رفع المشروع إلى GitHub</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* TAB 1: HOW TO INSTALL APP (ازاي احمل البرنامج للعمل به) */}
          {activeTab === 'install_guide' && (
            <div className="space-y-4">
              {/* Direct PWA Install Button Banner */}
              <div className="bg-gradient-to-r from-rose-50 to-rose-100/60 border border-rose-300 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-black text-rose-950 text-sm block">
                      ⚡ تثبيت فوري لتطبيق معامل رامي مختار (PWA):
                    </span>
                    <p className="text-rose-900 mt-1 leading-relaxed">
                      البرنامج مبرمج بتقنية الـ <strong>Progressive Web App (PWA)</strong> الدولية ليعمل كتطبيق سطح مكتب وموبايل مستقل وسريع جداً بدون الحاجة للتحميل من متاجر التطبيقات المعقدة، وبدون استهلاك مساحة التخزين.
                    </p>
                  </div>
                </div>

                {isInstallable && (
                  <button
                    onClick={install}
                    className="w-full py-3 px-4 bg-rose-900 hover:bg-rose-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-rose-950"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>تثبيت البرنامج الآن على هذا الجهاز بنقرة واحدة (Install App)</span>
                  </button>
                )}

                {isInstalled && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-950 font-bold rounded-lg flex items-center gap-2 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>البرنامج مثبت بالفعل على هذا الجهاز ويعمل كتطبيق مستقل! يمكنك فتحه مباشرة من سطح المكتب أو الشاشة الرئيسية.</span>
                  </div>
                )}
              </div>

              {/* Device Selector Sub-Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setDeviceFilter('android')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    deviceFilter === 'android'
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>موبايل أندرويد (سامسونج، شاومي، أوبو)</span>
                </button>

                <button
                  onClick={() => setDeviceFilter('ios')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    deviceFilter === 'ios'
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>آيفون وآيباد (Apple iOS)</span>
                </button>

                <button
                  onClick={() => setDeviceFilter('laptop')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    deviceFilter === 'laptop'
                      ? 'bg-blue-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>كمبيوتر ولابتوب</span>
                </button>
              </div>

              {/* SECTION: ANDROID DETAILED STEPS */}
              {deviceFilter === 'android' && (
                <div className="space-y-3 bg-rose-50/40 border border-rose-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200/80">
                    <span className="font-black text-rose-950 text-sm flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-rose-800" />
                      <span>خطوات تثبيت تطبيق معامل رامي مختار على موبايل أندرويد:</span>
                    </span>
                    <span className="text-[10px] bg-rose-200/60 text-rose-900 px-2 py-0.5 rounded-full font-bold">
                      أسهل وأسرع طريقة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-800">
                    {/* Step 1 */}
                    <div className="bg-white p-3 rounded-xl border border-rose-200/70 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-950 text-xs">
                        <span className="w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center text-xs font-black">1</span>
                        <span>افتح الرابط في Chrome</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        تأكد أنك فاتح الرابط داخل تطبيق <strong>Google Chrome</strong> على هاتفك، وليس داخل فيسبوك أو ماسنجر.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-3 rounded-xl border border-rose-200/70 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-950 text-xs">
                        <span className="w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center text-xs font-black">2</span>
                        <span>اضغط على ( الثلاث نقاط ⋮ )</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        في أعلى زاوية شاشة المتصفح اضغط على علامة <strong>النقاط الثلاث (⋮)</strong> لفتح قائمة المتصفح.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-3 rounded-xl border border-rose-200/70 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-950 text-xs">
                        <span className="w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center text-xs font-black">3</span>
                        <span>اختر "تثبيت التطبيق"</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        اضغط على <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة للشاشة الرئيسية"</strong> ثم تأكيد. مبروك!
                      </p>
                    </div>
                  </div>

                  {isInstallable && (
                    <button
                      onClick={install}
                      className="w-full mt-2 py-2.5 px-4 bg-rose-900 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>أو اضغط هنا للتثبيت الفوري التلقائي (Install)</span>
                    </button>
                  )}
                </div>
              )}

              {/* SECTION: IPHONE / IPAD DETAILED STEPS */}
              {deviceFilter === 'ios' && (
                <div className="space-y-3 bg-slate-50 border border-slate-300 p-4 rounded-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-black text-slate-950 text-sm flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-slate-900" />
                      <span>خطوات تثبيت التطبيق على آيفون وآيباد (iPhone / iPad):</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                      متصفح Safari الرسمي
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-800">
                    {/* Step 1 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">1</span>
                        <span>افتح في متصفح Safari</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        يجب فتح الرابط حصراً في متصفح <strong>Safari</strong> (الأيقونة الزرقاء كالبوصلة) في الآيفون.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">2</span>
                        <span>زر المشاركة (Share ⬆️)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        اضغط على أيقونة المربع الذي يخرج منه سهم لأعلى <strong>[ ⬆️ ]</strong> بأسفل شاشة الآيفون.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">3</span>
                        <span>Add to Home Screen</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        مرر القائمة لأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية"</strong> ثم اضغط <strong>إضافة (Add)</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: LAPTOP DETAILED STEPS */}
              {deviceFilter === 'laptop' && (
                <div className="space-y-3 bg-blue-50/50 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                    <span className="font-black text-blue-950 text-sm flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-blue-900" />
                      <span>خطوات تثبيت التطبيق على اللابتوب والكمبيوتر (Windows & Mac):</span>
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-950 px-2 py-0.5 rounded-full font-bold">
                      أيقونة سطح المكتب
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-800">
                    {/* Step 1 */}
                    <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
                        <span className="w-6 h-6 rounded-full bg-blue-950 text-white flex items-center justify-center text-xs font-black">1</span>
                        <span>متصفح Chrome أو Edge</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        افتح الرابط في متصفح Google Chrome أو Microsoft Edge على اللابتوب.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
                        <span className="w-6 h-6 rounded-full bg-blue-950 text-white flex items-center justify-center text-xs font-black">2</span>
                        <span>أيقونة التثبيت [ ⤓ ]</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        ستجد علامة تثبيت صغيرة [ ⤓ Install ] داخل شريط العنوان بالأعلى بجوار زر المفضلة.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
                        <span className="w-6 h-6 rounded-full bg-blue-950 text-white flex items-center justify-center text-xs font-black">3</span>
                        <span>فتح كنافذة مستقلة</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        اضغط تثبيت وستفتح نافذة برنامج المعمل بكامل الشاشة مع أيقونة على سطح المكتب.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MULTI-DEVICE SUPPORT (هل متاح استخدامه في أكثر من موبايل ولابتوب؟) */}
          {activeTab === 'multi_device' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>نعم! متاح بالكامل ومصمم للعمل على عدة أجهزة في نفس اللحظة:</span>
                </div>
                <p className="text-blue-900 leading-relaxed">
                  تم تصميم منظومة معامل رامي مختار للربط الشبكي المتعدد (Multi-Terminal Architecture). يمكنك تشغيل المنظومة على الأجهزة التالية في وقت واحد:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 border border-slate-200 bg-white rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center text-xs font-mono font-bold">1</span>
                    <span>لابتوب الاستقبال (Reception Desk)</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    لتسجيل المرضى الجدد، استقبال طلبات الفحص، تحصيل الفواتير، وطباعة ملصقات الباركود على أنابيب العينات.
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 bg-white rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-mono font-bold">2</span>
                    <span>كمبيوتر المختبر والأجهزة الآلية (Lab Workstation)</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    متصل بأجهزة التحاليل (Sysmex, Mindray, Roche) لإدخال النتائج وقراءة الباركود ومراجعة منحنيات الكيمياء والدم.
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 bg-white rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-mono font-bold">3</span>
                    <span>لابتوب أو تابلت د. رامي مختار (Director Station)</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    لاعتماد النتائج الطبية نهائياً، كتابة التفسيرات الإكلينيكية، ومتابعة إيرادات المعمل وتقارير الـ HR ومخزن الكيماويات.
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 bg-white rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center text-xs font-mono font-bold">4</span>
                    <span>موبايل فني السحب والزيارات المنزلية (Home Visits)</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    لمتابعة حجوزات المرضى الواردة عبر واتساب وعناوين الزيارات وتأكيد سحب العينات مباشرة من الهاتف.
                  </p>
                </div>
              </div>

              {/* Direct Link Share */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-900 block">رابط المعمل المباشر للفتح على الأجهزة الأخرى:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-1.5 bg-rose-900 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD SYNC & BACKUP (وهل تم التزامن السحابي للمستخدم؟) */}
          {activeTab === 'cloud_backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                    <Cloud className="w-5 h-5 text-emerald-700" />
                    <span>نعم! التزامن السحابي مفعل ونشط تلقائياً:</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                    نشط ومتصل 🟢
                  </span>
                </div>
                <p className="text-emerald-900 leading-relaxed">
                  المنظومة مزودة بمحرك تزامن آني (Real-Time Synchronizer عبر BroadcastChannel و Local Storage Engine). بمجرد إدخال أي مريض أو تعديل نتيجة فحص أو تسجيل إيراد مالي على أي شاشة، يتم بث التحديث تلقائياً لجميع النوافذ المتصلة.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/70 text-[11px] font-mono text-emerald-800">
                  <span>معرف هذا الجهاز: <strong>{deviceId}</strong></span>
                  <span>آخر مزامنة: <strong>{new Date(syncMeta.lastSyncedAt).toLocaleTimeString('ar-EG')}</strong></span>
                </div>
              </div>

              {/* Backup & Restore Action Buttons */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 block">
                  النسخ الاحتياطي السحابي ونقل البيانات بين الأجهزة:
                </span>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  يمكنك في أي لحظة حفظ نسخة كاملة من سجلات المعمل (المرضى، النتائج، الحسابات، الكيماويات، باقات التحاليل) في ملف آمن ومشفر ونقله بضغطة زر لأي جهاز آخر:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Export */}
                  <button
                    onClick={onExportBackup}
                    className="p-3.5 bg-rose-950 hover:bg-rose-900 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-colors shadow-2xs border border-rose-900"
                  >
                    <DownloadCloud className="w-4 h-4 text-rose-300" />
                    <span>تصدير نسخة احتياطية سحابية (Backup JSON)</span>
                  </button>

                  {/* Import */}
                  <label className="p-3.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 cursor-pointer transition-colors shadow-2xs border border-blue-900">
                    <UploadCloud className="w-4 h-4 text-emerald-300" />
                    <span>استيراد وتحديث قاعدة البيانات من جهاز آخر</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QR CODE (رمز الاستجابة السريعة للموبايل) */}
          {activeTab === 'qr_code' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-sm mx-auto">
                <span className="font-bold text-slate-900 text-sm block">
                  امسح الرمز بكاميرا الموبايل لفتح وتحميل البرنامج فوراً:
                </span>

                {/* QR Code Frame */}
                <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-rose-900 shadow-md flex items-center justify-center relative">
                  {/* Stylized QR representation with lab brand badge in center */}
                  <div className="w-full h-full bg-slate-900 rounded-xl p-2 flex flex-col justify-between items-center relative overflow-hidden">
                    {/* SVG Pattern for authentic QR look */}
                    <div className="w-full h-full flex flex-col justify-between text-white font-mono text-[9px] opacity-90 select-none">
                      <div className="flex justify-between w-full">
                        <div className="w-10 h-10 border-4 border-white bg-slate-900 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white"></div>
                        </div>
                        <div className="flex-1 px-1 flex flex-wrap gap-1 items-center justify-center text-[7px] text-slate-400">
                          ■ □ ■ ■ □
                        </div>
                        <div className="w-10 h-10 border-4 border-white bg-slate-900 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white"></div>
                        </div>
                      </div>

                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-950 border-2 border-rose-300 flex items-center justify-center shadow-md p-1">
                        <img
                          src={labLogoUrl}
                          alt="RT"
                          className="w-full h-full rounded-full object-contain"
                          onError={(e) => onImageErrorFallback(e)}
                        />
                      </div>

                      <div className="flex justify-between w-full items-end">
                        <div className="w-10 h-10 border-4 border-white bg-slate-900 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white"></div>
                        </div>
                        <div className="flex-1 px-1 flex flex-wrap gap-1 items-center justify-center text-[7px] text-slate-400">
                          □ ■ □ ■ ■
                        </div>
                        <div className="w-6 h-6 border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-[11px] leading-tight">
                  وجّه كاميرا أي هاتف (iPhone أو Android) نحو الرمز أعلاه لفتح منظومة معامل رامي مختار فوراً دون كتابة الرابط.
                </p>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'تم نسخ الرابط!' : 'أو انسخ الرابط المباشر'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: GITHUB UPLOAD & DEPLOYMENT GUIDE */}
          {activeTab === 'github_upload' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm">
                    🚀 رفع المنظومة وتشغيلها على مستودع GitHub الخاص بك
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">
                    RT-LAB-LIS
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  تم تجهيز المشروع بروابط نسبية (<code className="font-mono text-emerald-800 font-bold">base: './'</code>) وملف <code className="font-mono text-emerald-800 font-bold">.github/workflows/deploy.yml</code> ليقوم GitHub تلقائياً بنشر وتشغيل المنظومة على رابط GitHub Pages فور رفع الملفات دون أي أخطاء 404.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="https://github.com/ramimokhtar228-maker/RT-LAB-LIS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>فتح مستودع GitHub</span>
                  </a>
                  <a
                    href="https://ramimokhtar228-maker.github.io/RT-LAB-LIS/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>رابط التشغيل المباشر GitHub Pages</span>
                  </a>
                </div>
              </div>

              {/* Download Source Code Package */}
              <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-2xs space-y-3 bg-gradient-to-r from-emerald-50/50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded">صيغة ZIP قياسية 100%</span>
                      <h4 className="font-bold text-slate-900 text-xs">
                        1. تنزيل حزمة الكود المصدري الكاملة (.zip)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      ملف مضغوط قياسي بحجم خفيف (~3.3MB) ومفحوص لفك الضغط فوراً على Windows وMac وAndroid بدون أي أخطاء.
                    </p>
                    <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                      💡 فك الضغط: اضغط بزر الماوس الأيمن على الملف ثم اختر "استخراج الكل" (Extract All).
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloadingZip}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {isDownloadingZip ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-emerald-200 animate-spin" />
                        <span>جاري التجهيز...</span>
                      </>
                    ) : downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>تم التنزيل بنجاح!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-emerald-200" />
                        <span>تحميل الكود (.zip)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Method 1: Push via Terminal */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-[11px]">
                <div className="flex items-center justify-between font-sans">
                  <h4 className="font-bold text-amber-300 text-xs">
                    2. أوامر الرفع الفوري من سطر الأوامر (Git Terminal)
                  </h4>
                  <span className="text-[10px] text-slate-400">بنقرة زر واحدة</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-slate-300 text-left select-all" dir="ltr">
                  <div className="text-emerald-400 font-bold"># أمر التشغيل المباشر للرفع باستخدام سكريبت المنظومة:</div>
                  <div className="text-white">./deploy-to-github.sh YOUR_GITHUB_TOKEN</div>
                  <div className="text-slate-500 pt-2 font-bold"># أو الأوامر اليدوية المعتادة:</div>
                  <div>git branch -M main</div>
                  <div>git remote add origin https://github.com/ramimokhtar228-maker/RT-LAB-LIS.git</div>
                  <div>git push -u origin main</div>
                </div>
              </div>

              {/* Method 2: Web Drag-and-Drop */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">
                  3. الرفع اليدوي من المتصفح (Web Upload بدون أوامر):
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed pr-1">
                  <li>افتح الرابط: <a href="https://github.com/ramimokhtar228-maker/RT-LAB-LIS" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-mono">github.com/ramimokhtar228-maker/RT-LAB-LIS</a>.</li>
                  <li>اضغط على زر <strong className="text-slate-800">Add file</strong> ثم اختر <strong className="text-slate-800">Upload files</strong>.</li>
                  <li>اسحب ملفات المشروع من جهازك وضعها في المربع واضغط <strong className="text-emerald-800">Commit changes</strong>.</li>
                  <li>من تبويب <strong className="text-slate-800">Settings &gt; Pages</strong> في المستودع، تأكد من اختيار <strong className="text-emerald-700 font-bold">GitHub Actions</strong> كمصدر للنشر.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            معامل د. رامي مختار · بهتيم شبرا الخيمة · 01100874444
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
