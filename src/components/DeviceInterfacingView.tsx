import React, { useState } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Radio,
  DownloadCloud,
  Layers,
  ArrowRightLeft,
  Activity,
} from 'lucide-react';
import { AnalyzerDevice, LabOrder } from '../types/lab';

interface DeviceInterfacingViewProps {
  devices: AnalyzerDevice[];
  orders: LabOrder[];
  onAutoIngestResults: (deviceId: string) => void;
}

export const DeviceInterfacingView: React.FC<DeviceInterfacingViewProps> = ({
  devices,
  orders,
  onAutoIngestResults,
}) => {
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSync = (device: AnalyzerDevice) => {
    setSyncingDeviceId(device.id);
    setTimeout(() => {
      onAutoIngestResults(device.id);
      setSyncingDeviceId(null);
      setSuccessMsg(`تمت المزامنة بنجاح مع جهاز ${device.name} وسحب القراءات الآلية.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }, 1200);
  };

  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === 'sampling' || o.orderStatus === 'processing'
  ).length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            ربط الأجهزة المعملية الآلية (LIMS Automated Device Interfacing)
          </h1>
          <p className="text-xs text-slate-500">
            الربط اللحظي المباشر بين أجهزة أمراض الدم، الكيمياء، السيولة، والهرمونات لسحب النتائج تلقائياً برقم الباركود
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بوابة الربط الشبكي HL7 / ASTM نشطة</span>
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-bold">بروتوكول الربط اللحظي التلقائي (Bidirectional Barcode LIS)</h2>
          </div>
          <span className="text-xs font-mono text-teal-300">
            {pendingOrdersCount} عينات في طابور الأجهزة
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          بمجرد تمرير أنبوبة العينة أمام قارئ الباركود في أي جهاز من أجهزة المعمل، يتعرف الجهاز على الفحوصات المطلوبة، ويبدأ التحليل آلياً ثم يرسل النتائج والأعلام (Flags) مباشرة إلى منظومة RT LIMS دون تدخل يدوي لمنع الخطأ البشري.
        </p>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {devices.map((device) => {
          const isSyncing = syncingDeviceId === device.id;
          return (
            <div
              key={device.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between hover:border-teal-500 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                      {device.department}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {device.name}
                    </h3>
                    <div className="text-xs text-slate-400 font-sans">{device.model}</div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>متصل Live</span>
                  </div>
                </div>

                {/* Connection Specs */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>بروتوكول الاتصال:</span>
                    <span className="font-bold text-slate-800">{device.protocol}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>عنوان الشبكة (IP):</span>
                    <span className="text-slate-800">{device.ipAddress}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>آخر مزامنة لقراءة العينات:</span>
                    <span className="text-teal-700 font-sans">{device.lastSyncAt}</span>
                  </div>
                </div>

                {/* Supported Tests */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    الفحوصات المقروءة آلياً بواسطة هذا الجهاز:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {device.testsSupported.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  تحديث فوري لكل بند
                </span>
                <button
                  type="button"
                  onClick={() => handleSync(device)}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'جارٍ قراءة البيانات من الجهاز...' : 'سحب القراءات الآن من الجهاز'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
