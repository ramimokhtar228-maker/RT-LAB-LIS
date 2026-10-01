import React, { useState } from 'react';
import { Boxes, Plus, Search, AlertTriangle, CheckCircle2, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { ReagentItem } from '../types/lab';

interface InventoryViewProps {
  reagents: ReagentItem[];
  onUpdateStock: (reagentId: string, newStock: number) => void;
  onAddReagent: (newReagent: ReagentItem) => void;
  onUpdateReagent: (reagent: ReagentItem) => void;
  onDeleteReagent: (reagentId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  reagents,
  onUpdateStock,
  onAddReagent,
  onUpdateReagent,
  onDeleteReagent,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReagent, setEditingReagent] = useState<ReagentItem | null>(null);

  // Form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [catalogCode, setCatalogCode] = useState('');
  const [category, setCategory] = useState('كيمياء حيوية (Biochemistry)');
  const [stock, setStock] = useState(10);
  const [minStock, setMinStock] = useState(4);
  const [unit, setUnit] = useState('علبة (Kit)');
  const [expiry, setExpiry] = useState('2027-12-31');
  const [lot, setLot] = useState('LT-90021');

  const filteredReagents = reagents.filter(
    (r) =>
      r.nameAr.includes(search) ||
      r.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      r.catalogCode.toLowerCase().includes(search.toLowerCase()) ||
      r.lotNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingReagent(null);
    setNameAr('');
    setNameEn('');
    setCatalogCode('');
    setCategory('كيمياء حيوية (Biochemistry)');
    setStock(10);
    setMinStock(4);
    setUnit('علبة (Kit)');
    setExpiry('2027-12-31');
    setLot(`LT-${Math.floor(10000 + Math.random() * 90000)}`);
    setShowModal(true);
  };

  const handleOpenEdit = (rg: ReagentItem) => {
    setEditingReagent(rg);
    setNameAr(rg.nameAr);
    setNameEn(rg.nameEn);
    setCatalogCode(rg.catalogCode);
    setCategory(rg.category);
    setStock(rg.currentStock);
    setMinStock(rg.minStockLevel);
    setUnit(rg.unit);
    setExpiry(rg.expiryDate);
    setLot(rg.lotNumber);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    if (editingReagent) {
      onUpdateReagent({
        ...editingReagent,
        nameAr,
        nameEn,
        catalogCode,
        category,
        currentStock: stock,
        minStockLevel: minStock,
        unit,
        expiryDate: expiry,
        lotNumber: lot,
        status: stock <= minStock ? 'low' : 'ok',
      });
    } else {
      const newItem: ReagentItem = {
        id: `rg-${Date.now()}`,
        nameAr,
        nameEn,
        catalogCode: catalogCode || 'CAT-GEN-01',
        category,
        currentStock: stock,
        minStockLevel: minStock,
        unit,
        expiryDate: expiry,
        lotNumber: lot,
        status: stock <= minStock ? 'low' : 'ok',
      };
      onAddReagent(newItem);
    }
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            مخزون الكواشف ومحاليل الأجهزة المعملية (قسم المستلزمات والكيماويات)
          </h1>
          <p className="text-xs text-slate-500">
            متابعة أرصدة المحاليل والأنابيب، أرقام التشغيلات (Lot Numbers) وتواريخ الصلاحية
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة كاشف أو مستهلك جديد</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم المحلول، كود الكتالوج، Lot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-2 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            إجمالي العناصر: <span className="font-mono font-bold text-slate-800">{reagents.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                <th className="py-2.5 px-3">اسم الكاشف / المحلول</th>
                <th className="py-2.5 px-3">القسم المعملي</th>
                <th className="py-2.5 px-3">رقم التشغيلة (Lot)</th>
                <th className="py-2.5 px-3">تاريخ الصلاحية</th>
                <th className="py-2.5 px-3 text-center">الرصيد الحالي</th>
                <th className="py-2.5 px-3 text-center">حد الأمان</th>
                <th className="py-2.5 px-3 text-center">حالة المخزون</th>
                <th className="py-2.5 px-3 text-center">تحديث وتعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReagents.map((rg) => {
                const isLow = rg.currentStock <= rg.minStockLevel;

                return (
                  <tr key={rg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{rg.nameAr}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{rg.nameEn}</div>
                      <div className="text-[10px] font-mono text-teal-800">{rg.catalogCode}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">{rg.category}</td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {rg.lotNumber}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {rg.expiryDate}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-sm text-slate-900">
                      {rg.currentStock} <span className="text-[10px] font-sans font-normal text-slate-400">{rg.unit}</span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {rg.minStockLevel}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isLow ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block animate-pulse">
                          نقص رصيد (Low)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          كافٍ (Nominal)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onUpdateStock(rg.id, Math.max(0, rg.currentStock - 1))}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                          title="استهلاك وحدة"
                        >
                          -
                        </button>
                        <button
                          onClick={() => onUpdateStock(rg.id, rg.currentStock + 5)}
                          className="px-2 h-6 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-bold"
                          title="إضافة 5 وحدات توريد"
                        >
                          +5
                        </button>

                        <button
                          onClick={() => handleOpenEdit(rg)}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded"
                          title="تعديل بيانات الكاشف"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف كاشف ${rg.nameAr}؟`)) {
                              onDeleteReagent(rg.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:text-rose-800 rounded"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingReagent ? 'تعديل بيانات الكاشف والمستهلك' : 'إضافة كاشف / محلول فحص جديد للمخزن'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المحلول بالعربية *</label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: كاشف إنزيم الكبد AST"
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. AST / SGOT Reagent Kit"
                  className="w-full p-2 border border-slate-200 rounded font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">كود الكتالوج</label>
                  <input
                    type="text"
                    value={catalogCode}
                    onChange={(e) => setCatalogCode(e.target.value)}
                    placeholder="e.g. ROCH-AST-100"
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم التشغيلة (Lot)</label>
                  <input
                    type="text"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الرصيد الحالي</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">حد الأمان (تنبيه النقص)</label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تاريخ انتهاء الصلاحية</label>
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  {editingReagent ? 'تحديث الكاشف' : 'حفظ الكاشف بالمخزن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
