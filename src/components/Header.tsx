import React from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Download,
  Menu,
  X,
  Cloud,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { LabOrder } from '../types/lab';
import { LabProfile, getCloudSyncMetadata } from '../services/storage';
import { resolveLabLogo, DOCTOR_AVATAR_IMG, onImageErrorFallback, FALLBACK_DOCTOR_AVATAR_SVG } from '../assets/images';

interface HeaderProps {
  profile: LabProfile;
  onNewOrder: () => void;
  orders: LabOrder[];
  onSelectOrder: (order: LabOrder) => void;
  onResetData: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSwitchToPatientPortal: () => void;
  onOpenInstallApp: () => void;
  onOpenLogoManager?: () => void;
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
  doctorAvatarUrl?: string;
  labLogoUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onNewOrder,
  orders,
  onSelectOrder,
  onResetData,
  searchQuery,
  setSearchQuery,
  onSwitchToPatientPortal,
  onOpenInstallApp,
  onOpenLogoManager,
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
  doctorAvatarUrl = DOCTOR_AVATAR_IMG,
  labLogoUrl,
}) => {
  // Check for critical panic values
  const panicOrders = orders.filter((o) =>
    o.tests.some((t) => t.results.some((r) => r.flag === 'panic_high' || r.flag === 'panic_low'))
  );

  const effectiveLogo = labLogoUrl || resolveLabLogo(profile.logoUrl);
  const syncMeta = getCloudSyncMetadata();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-3 sm:px-4 lg:px-6 py-2">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Zone 1: Mobile Hamburger + Rami Mokhtar Labs Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-700 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
            title="القائمة الرئيسية والأقسام"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5 text-rose-900" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Clickable Logo with Identity Settings trigger */}
          <button
            onClick={onOpenLogoManager}
            className="relative group w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-rose-300 shadow-xs bg-slate-950 flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105"
            title="تخصيص وتغيير لوجو المعمل"
          >
            <img
              src={effectiveLogo}
              alt="لوجو معامل رامي مختار"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => onImageErrorFallback(e)}
            />
            <span className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-bold text-white">
              تعديل
            </span>
          </button>
          <div className="leading-tight">
            <div className="text-xs sm:text-base font-black text-slate-950 tracking-tight flex items-center gap-1.5 sm:gap-2">
              <span className="text-rose-950 truncate max-w-[150px] sm:max-w-none">{profile.nameAr}</span>
              <span className="hidden xs:inline-block text-[10px] font-bold text-blue-950 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                د. رامي مختار
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">
              الفرع الرئيسي: ميدان بهتيم برج العزبي شبرا الخيمة
            </div>
          </div>
        </div>

        {/* Zone 2: Search & Live Critical Alarms */}
        <div className="flex-1 max-w-md hidden md:flex items-center gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث سريع باسم المريض، رقم العينة، كود الباركود..."
              className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-800 transition-all"
            />
          </div>

          {panicOrders.length > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md shrink-0 animate-pulse cursor-pointer"
              title="توجد عينات تحتوي على قيم حرجة تستوجب إبلاغ الطبيب المعالج"
              onClick={() => onSelectOrder(panicOrders[0])}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{panicOrders.length} حرج</span>
            </div>
          )}
        </div>

        {/* Zone 3: Cloud Sync Indicator, Install App, Portal Switch, New Order */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cloud Sync Status Badge */}
          <button
            onClick={onOpenInstallApp}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-blue-950 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            title={`تزامن سحابي نشط - معرف الجهاز: ${syncMeta.deviceId}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cloud className="w-3.5 h-3.5 text-blue-800" />
            <span className="hidden xl:inline">التزامن السحابي: نشط</span>
          </button>

          {/* Download & Install App Button */}
          <button
            onClick={onOpenInstallApp}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-950 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
            title="تحميل وتثبيت البرنامج على الموبايل أو اللابتوب والمزامنة السحابية"
          >
            <Download className="w-3.5 h-3.5 text-rose-800" />
            <span className="hidden sm:inline">تحميل وتثبيت</span>
          </button>

          {/* Patient Portal Switch */}
          <button
            onClick={onSwitchToPatientPortal}
            title="الانتقال إلى بوابة حجز المرضى والخدمات"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-800" />
            <span className="hidden lg:inline">بوابة المرضى</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            title="استعادة البيانات التجريبية الأولية"
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* New Test Order Action */}
          <button
            onClick={onNewOrder}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-xs hover:shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">طلب فحص</span>
          </button>

          {/* Doctor Profile */}
          <div className="flex items-center gap-2 pr-1.5 sm:pr-2 border-r border-slate-200">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-rose-300 bg-slate-100 shrink-0">
              <img
                src={doctorAvatarUrl}
                alt="د. رامي مختار"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => onImageErrorFallback(e, FALLBACK_DOCTOR_AVATAR_SVG)}
              />
            </div>
            <div className="hidden xl:block text-right leading-tight">
              <div className="text-xs font-bold text-slate-900">أ.د. رامي مختار</div>
              <div className="text-[10px] text-rose-800 font-semibold">استشاري الباثولوجيا</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
