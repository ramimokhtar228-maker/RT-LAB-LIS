import React, { useState } from 'react';
import { Github, ExternalLink, CheckCircle2, Copy, Check, Terminal, Globe, Shield, RefreshCw } from 'lucide-react';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const repoUrl = 'https://github.com/ramimokhtar228-maker/RT-LAB-LIS';
  const liveUrl = 'https://ramimokhtar228-maker.github.io/RT-LAB-LIS/';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>نشر وتشغيل البرنامج على GitHub Pages</span>
                <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  Live Ready
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                رابط الاستضافة المباشر وإعدادات المستودع لمعامل RT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Live Link Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>رابط التشغيل المباشر للبرنامج (Live URL)</span>
              </span>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-mono font-bold text-rose-950 hover:underline flex items-center gap-1 mt-1 break-all"
                dir="ltr"
              >
                <span>{liveUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 text-rose-700 shrink-0 inline" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(liveUrl)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                فتح الرابط الآن
              </a>
            </div>
          </div>

          {/* Repo Info */}
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>المستودع مهيأ ومربوط بالكامل:</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-mono" dir="ltr">
                Repository: ramimokhtar228-maker/RT-LAB-LIS
              </p>
              <p className="text-slate-500 mt-1">
                تم تهيئة Vite بمسار نسبي <code className="bg-slate-200 px-1 rounded">base: './'</code> لضمان تحميل جميع ملفات التنسيق والشعارات والأيقونات بسلاسة على GitHub Pages.
              </p>
            </div>

            {/* Offline & Static capability notice */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 leading-relaxed">
              <div className="font-bold mb-0.5">🌟 تشغيل متكامل بدون انقطاع:</div>
              يعمل البرنامج بجميع وظائفه (إدخال بيانات المرضى، الكتالوج الدولي، الحسابات التلقائية، التقارير الطبية A4، الفواتير الرسمية، وحفظ السجلات) حتى بدون إنترنت من خلال التخزين المحلي الآمن (Local Storage).
            </div>
          </div>

          {/* Close */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
