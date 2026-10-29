import React from 'react';
import { LabSettings } from '../types/lab';
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
  Printer
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
    <header className="bg-slate-900 text-white border-b-4 border-rose-800 shadow-xl print:hidden sticky top-0 z-40">
      {/* Top emergency / accreditation strip */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 px-4 py-1.5 text-xs text-rose-100 flex flex-wrap items-center justify-between border-b border-rose-800/60">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-extrabold">نظام إدارة المختبرات الطبية LIS v3.5</span>
          </span>
          <span className="hidden md:inline text-rose-300">|</span>
          <span className="hidden md:inline text-rose-200">
            {settings.accreditationText}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="inline-flex items-center gap-1 text-rose-200">
            <Phone className="w-3.5 h-3.5 text-rose-400" />
            <span dir="ltr">{settings.phone1}</span>
          </span>
          <button
            onClick={onOpenGitHubSync}
            className="hover:text-white transition-colors flex items-center gap-1 bg-rose-950/80 hover:bg-rose-900 px-2.5 py-0.5 rounded border border-rose-700/50 text-[11px]"
            title="GitHub Pages Live Deploy"
          >
            <Github className="w-3 h-3 text-rose-300" />
            <span>GitHub Sync</span>
          </button>
        </div>
      </div>

      {/* Main Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Lab Titles */}
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="relative group shrink-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-rose-600 shadow-lg shadow-rose-950/50 bg-black flex items-center justify-center">
                <img
                  src={settings.logoUrl || '/assets/aistudio/photo_2026-10-02_00-22-10_28ae1371.jpg'}
                  alt="RT Lab Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  <span className="text-rose-500 font-extrabold">RT LAB</span>
                  <span>{settings.labNameAr}</span>
                </h1>
                <span className="hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/60">
                  معامل د. رامي مختار
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {settings.labSubtitleAr} • <span dir="ltr" className="text-slate-400 font-sans">{settings.labNameEn}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={onNewPatient}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-rose-900/40 border border-rose-500/40 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل مريض جديد</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="إعدادات المعمل والترويسة والأسعار"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pt-3 border-t border-slate-800/80 mt-2 text-xs font-medium no-scrollbar">
          <button
            onClick={() => setActiveTab('encounters')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'encounters'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-rose-400" />
            <span>تسجيل ونتائج المرضى</span>
            <span className="mr-1 bg-slate-800 text-rose-300 px-1.5 py-0.2 rounded-full text-[10px] border border-slate-700">
              {encounterCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>تقرير التحاليل المعتمد</span>
          </button>

          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'invoice'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>الفاتورة الرسمية</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-interpret')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'ai-interpret'
                ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white font-bold shadow border border-purple-600'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>الاستنتاج السريري بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'bg-amber-950 text-amber-200 font-bold shadow border border-amber-600'
                : 'text-amber-300 hover:text-white hover:bg-amber-950/40'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>ترشيح التحاليل الذكي</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-rose-900 text-white font-bold shadow border border-rose-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>كتالوج التحاليل والباقات</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
