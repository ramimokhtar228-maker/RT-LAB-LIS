import React from 'react';
import { X, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { LabOrder, TestDefinition } from '../types/lab';

interface BarcodeModalProps {
  order: LabOrder | null;
  testsCatalog: TestDefinition[];
  onClose: () => void;
  onMarkCollected: (orderId: string) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  order,
  testsCatalog,
  onClose,
  onMarkCollected,
}) => {
  if (!order) return null;

  // Determine required tubes based on tests
  const tubeRequirements: { [key: string]: { count: number; color: string; type: string; tests: string[] } } = {};

  order.tests.forEach((ot) => {
    const def = testsCatalog.find((t) => t.code === ot.code || t.id === ot.testId);
    const tubeKey = def ? def.tubeType : 'أنبوبة معملية قياسية';
    const tubeColor = def ? def.tubeColor : '#64748b';

    if (!tubeRequirements[tubeKey]) {
      tubeRequirements[tubeKey] = {
        count: 1,
        color: tubeColor,
        type: tubeKey,
        tests: [ot.code],
      };
    } else {
      tubeRequirements[tubeKey].tests.push(ot.code);
    }
  });

  const tubesList = Object.values(tubeRequirements);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              ملصقات الباركود وسحب عينات الفحص
            </h3>
            <div className="text-xs text-slate-500">
              طلب رقم: <span className="font-mono font-semibold">{order.orderNumber}</span> · المريض: {order.patient.name}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">تنبيه فني سحب العينات:</span> يلزم مطابقة هوية المريض والباركود المطبوع على الأنبوبة قبل وأثناء عملية سحب الدم أو تسلم العينة من المريض.
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-600">
            الأنابيب والأوعية المطلوبة لهذا الطلب ({tubesList.length} أوعية):
          </div>

          {/* Barcode Stickers Grid */}
          <div className="space-y-3">
            {tubesList.map((tube, idx) => (
              <div
                key={idx}
                className="border-2 border-dashed border-slate-300 rounded-lg p-3 bg-white hover:border-teal-400 transition-colors relative"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Tube color pill & metadata */}
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-12 rounded-xs shrink-0 shadow-2xs"
                      style={{ backgroundColor: tube.color }}
                      title={`نوع الغطاء: ${tube.type}`}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {order.patient.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {order.patient.gender === 'male' ? 'ذكر' : 'أنثى'} · {order.patient.age} {order.patient.ageUnit} · ID: {order.patient.nationalId.slice(-6)}
                      </div>
                      <div className="text-[11px] font-semibold text-teal-800 mt-1">
                        الفحوصات: {tube.tests.join(' + ')}
                      </div>
                    </div>
                  </div>

                  {/* Right: Barcode simulation */}
                  <div className="text-left shrink-0">
                    <div className="bg-slate-900 text-white font-mono text-[9px] px-1 py-0.5 rounded-xs tracking-wider inline-block">
                      {order.urgency === 'stat' ? '🚨 STAT طوارئ' : 'ROUTINE روتيني'}
                    </div>

                    {/* Simulated SVG Barcode */}
                    <div className="mt-1 bg-white p-1 rounded-sm border border-slate-200">
                      <svg
                        className="w-32 h-8"
                        viewBox="0 0 120 30"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect x="2" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="6" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="9" y="2" width="3" height="24" fill="#0f172a" />
                        <rect x="14" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="17" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="21" y="2" width="4" height="24" fill="#0f172a" />
                        <rect x="27" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="30" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="34" y="2" width="3" height="24" fill="#0f172a" />
                        <rect x="39" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="42" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="46" y="2" width="4" height="24" fill="#0f172a" />
                        <rect x="52" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="56" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="59" y="2" width="3" height="24" fill="#0f172a" />
                        <rect x="64" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="68" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="71" y="2" width="4" height="24" fill="#0f172a" />
                        <rect x="77" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="81" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="84" y="2" width="3" height="24" fill="#0f172a" />
                        <rect x="89" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="93" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="96" y="2" width="3" height="24" fill="#0f172a" />
                        <rect x="101" y="2" width="1" height="24" fill="#0f172a" />
                        <rect x="104" y="2" width="2" height="24" fill="#0f172a" />
                        <rect x="108" y="2" width="4" height="24" fill="#0f172a" />
                        <rect x="114" y="2" width="2" height="24" fill="#0f172a" />
                      </svg>
                      <div className="text-[10px] font-mono text-center font-bold tracking-widest text-slate-800">
                        {order.sampleBarcode}-{idx + 1}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{tube.type}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('ar-EG')} - {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {order.specimenStatus === 'pending' ? (
              <button
                onClick={() => {
                  onMarkCollected(order.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تأكيد سحب العينات والانتقال للمختبر</span>
              </button>
            ) : (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                تم سحب واستلام العينات في المختبر
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ملصقات الباركود</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
