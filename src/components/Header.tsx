import React from 'react';
import { LabSettings } from '../types/lab';
import { RTLogo } from './RTLogo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  FlaskConical,
  FileText,
  Receipt,
  Sparkles,
  Lightbulb,
  Settings,
  Github,
  PlusCircle,
  Database,
  Building2,
  Phone,
  Printer,
  Cpu
} from 'lucide-react';

interface HeaderProps {
  settings: LabSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewPatient: () => void;
  onOpenSettings: () => void;
  onOpenGitHubSync: () => void;
  encounterCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  onNewPatient,
  onOpenSettings,
  onOpenGitHubSync,
  encounterCount,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b-4 border-[#7A1C30] shadow-xl print:hidden sticky top-0 z-40">
      {/* Top emergency / accreditation strip */}
      <div className="bg-gradient-to-r from-[#7A1C30] via-rose-950 to-slate-950 px-4 py-1.5 text-xs text-rose-100 flex flex-wrap items-center justify-between border-b border-rose-800/60">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-extrabold">معامل RT للتحاليل التشخيصية • LIS v4.0</span>
          </span>
          <span className="hidden md:inline text-rose-300">|</span>
          <span className="hidden md:inline text-rose-200">
            استشاريو كلية طب قصر العيني • {settings.accreditationText}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="inline-flex items-center gap-1 text-rose-200">
            <Phone className="w-3.5 h-3.5 text-rose-400" />
            <span dir="ltr">{settings.phone1}</span>
          </span>

          {/* In-app PWA install button */}
          <PWAInstallButton variant="header" />

          <button
            onClick={onOpenGitHubSync}
            className="hover:text-white transition-colors flex items-center gap-1 bg-rose-950/80 hover:bg-rose-900 px-2.5 py-0.5 rounded border border-rose-700/50 text-[11px]"
            title="GitHub Pages Live Repository & Deployment"
          >
            <Github className="w-3 h-3 text-rose-300" />
            <span>GitHub Sync</span>
          </button>
        </div>
      </div>

      {/* Main Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Lab Titles (Using vector RTLogo) */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <RTLogo size={54} imageUrl={settings.logoUrl} />

            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
                  <span className="text-rose-400 font-extrabold">RT LAB</span>
                  <span>{settings.labNameAr}</span>
                </h1>
                <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/60 font-sans">
                  قصر العيني
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {settings.labSubtitleAr} •{' '}
                <span dir="ltr" className="text-slate-400 font-sans font-semibold">
                  {settings.labNameEn}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={onNewPatient}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-md shadow-rose-900/40 border border-rose-500/40 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل مريض جديد</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="إعدادات المعمل والتوقيعات والترويسة واللوجو"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pt-2.5 border-t border-slate-800/80 mt-2 text-xs font-medium no-scrollbar">
          <button
            onClick={() => setActiveTab('encounters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'encounters'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-rose-400" />
            <span>تسجيل ونتائج المرضى</span>
            <span className="mr-1 bg-slate-800 text-rose-300 px-1.5 py-0.2 rounded-full text-[10px] border border-slate-700">
              {encounterCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>تقرير التحاليل A4 (كل بروفايل في صفحة)</span>
          </button>

          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'invoice'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>الفاتورة الرسمية</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-interpret')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'ai-interpret'
                ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white font-bold shadow border border-purple-600'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>التقرير الذكي والاستشاري</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>كتالوج الـ 412 تحليل والأجهزة</span>
            <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px] font-mono border border-emerald-700/60">
              412 Tests
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
