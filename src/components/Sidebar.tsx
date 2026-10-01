import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  TestTube2,
  FileCheck2,
  Printer,
  Sparkles,
  BookOpen,
  Receipt,
  Boxes,
  Users2,
  Cpu,
  ShieldCheck,
  Cloud,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'bookings'
  | 'orders'
  | 'worklist'
  | 'smart_reports'
  | 'reports'
  | 'devices'
  | 'patients'
  | 'catalog'
  | 'financial'
  | 'hr'
  | 'inventory';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  pendingWorklistCount: number;
  readyReportsCount: number;
  lowStockCount: number;
  pendingBookingsCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenInstallApp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  pendingWorklistCount,
  readyReportsCount,
  lowStockCount,
  pendingBookingsCount,
  isMobileOpen = false,
  onCloseMobile,
  onOpenInstallApp,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'لوحة المتابعة العامة',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'bookings' as NavTab,
      label: 'حجوزات المرضى والمنزل',
      icon: CalendarCheck,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : null,
      badgeColor: 'bg-rose-100 text-rose-900',
    },
    {
      id: 'orders' as NavTab,
      label: 'استقبال وسحب العينات',
      icon: TestTube2,
      badge: null,
    },
    {
      id: 'worklist' as NavTab,
      label: 'إدخال النتائج والاعتماد',
      icon: FileCheck2,
      badge: pendingWorklistCount > 0 ? pendingWorklistCount : null,
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'smart_reports' as NavTab,
      label: 'التقارير الذكية و PPTX',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'reports' as NavTab,
      label: 'طباعة التقارير الرسمية PDF',
      icon: Printer,
      badge: readyReportsCount > 0 ? readyReportsCount : null,
      badgeColor: 'bg-blue-100 text-blue-900',
    },
    {
      id: 'devices' as NavTab,
      label: 'ربط الأجهزة الآلية (LIMS)',
      icon: Cpu,
      badge: null,
    },
    {
      id: 'patients' as NavTab,
      label: 'سجل وملفات المرضى',
      icon: Users2,
      badge: null,
    },
    {
      id: 'catalog' as NavTab,
      label: 'كتالوج التحاليل والباقات',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'financial' as NavTab,
      label: 'قسم الحسابات والماليات',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'hr' as NavTab,
      label: 'قسم الموارد البشرية HR',
      icon: Users2,
      badge: null,
    },
    {
      id: 'inventory' as NavTab,
      label: 'المستلزمات والكيماويات',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
  ];

  const handleNavClick = (id: NavTab) => {
    setCurrentTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 right-0 z-50 lg:z-auto
          h-full lg:h-[calc(100vh-57px)] w-72 lg:w-64
          bg-white border-l border-slate-200 shrink-0
          flex flex-col justify-between select-none
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}
          sticky lg:top-[57px]
        `}
      >
        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          {/* Mobile Drawer Header */}
          <div className="flex lg:hidden items-center justify-between pb-3 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-900" />
              <span className="font-bold text-slate-900 text-xs">أقسام معامل رامي مختار</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:block">
            أقسام معامل رامي مختار
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-rose-50 text-rose-950 border border-rose-300 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-rose-800' : 'text-slate-400'
                    }`}
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Cloud & App Install Button in menu */}
          {onOpenInstallApp && (
            <button
              onClick={() => {
                onOpenInstallApp();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-blue-950 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-blue-800" />
                <span>المزامنة وتثبيت التطبيق</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                PWA
              </span>
            </button>
          )}
        </div>

        {/* Lab Certification & Location footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-950 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-rose-800 shrink-0" />
              <span>معامل رامي مختار</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              ميدان بهتيم برج العزبي الدور الثالث، شبرا الخيمة
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-100">
              <span className="text-rose-900 font-bold">01100874444</span>
              <span className="text-blue-900 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                متزامن
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
