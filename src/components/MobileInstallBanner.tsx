import React, { useState } from 'react';
import { Download, X, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { resolveLabLogo, onImageErrorFallback } from '../assets/images';

interface MobileInstallBannerProps {
  onOpenGuide: () => void;
  logoUrl?: string;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  onOpenGuide,
  logoUrl,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const effectiveLogo = resolveLabLogo(logoUrl);

  // If already installed or dismissed, don't show
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) onOpenGuide();
    } else {
      onOpenGuide();
    }
  };

  return (
    <aside aria-label="تثبيت التطبيق على الموبايل" className="sticky top-0 z-50 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white px-3 py-2.5 shadow-md border-b border-rose-800 flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-rose-300/40 bg-white shrink-0 flex items-center justify-center p-0.5">
          <img
            src={effectiveLogo}
            alt="RT"
            className="w-full h-full object-contain"
            onError={(e) => onImageErrorFallback(e)}
          />
        </div>
        <div className="leading-tight truncate">
          <div className="text-xs font-black text-white flex items-center gap-1.5">
            <span>تطبيق معامل رامي مختار</span>
            <span className="text-[9px] bg-rose-500/30 text-rose-200 border border-rose-400/40 px-1.5 py-0.2 rounded font-bold">
              مجاني
            </span>
          </div>
          <div className="text-[10px] text-rose-200 truncate">
            تثبيت التطبيق على شاشة الموبايل للوصول السريع
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-white text-rose-950 hover:bg-rose-50 font-black text-[11px] rounded-lg shadow-xs transition-transform active:scale-95 flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5 text-rose-900" />
          <span>{isInstallable ? 'تثبيت الآن' : 'طريقة التثبيت'}</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-rose-300 hover:text-white rounded-md transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
