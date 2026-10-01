import React, { useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, Clock, DollarSign, CheckCircle2, Award, MinusCircle, FileText, Printer, Calendar } from 'lucide-react';
import { Employee } from '../types/lab';
import { MEDICAL_TEAM_IMG, onImageErrorFallback } from '../assets/images';

interface HRViewProps {
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
}

export const HRView: React.FC<HRViewProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [viewingPayslip, setViewingPayslip] = useState<Employee | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [role, setRole] = useState<Employee['role']>('أخصائي كيمياء طبية');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState<Employee['shift']>('صباحي (8 ص - 4 م)');
  const [baseSalary, setBaseSalary] = useState(8000);
  const [incentives, setIncentives] = useState(500);
  const [deductions, setDeductions] = useState(0);
  const [attendanceDays, setAttendanceDays] = useState(26);
  const [absentDays, setAbsentDays] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(10);
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'on_leave'>('active');
  const [notes, setNotes] = useState('');

  const filtered = employees.filter(
    (e) =>
      e.name.includes(search) ||
      e.role.includes(search) ||
      e.phone.includes(search)
  );

  const totalPayroll = employees.reduce((sum, e) => sum + (e.netSalary || e.baseSalary || 0), 0);
  const totalIncentives = employees.reduce((sum, e) => sum + (e.incentives || 0), 0);
  const totalDeductions = employees.reduce((sum, e) => sum + (e.deductions || 0), 0);

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setName('');
    setNationalId('');
    setRole('أخصائي كيمياء طبية');
    setPhone('');
    setEmail('');
    setShift('صباحي (8 ص - 4 م)');
    setBaseSalary(8000);
    setIncentives(500);
    setDeductions(0);
    setAttendanceDays(26);
    setAbsentDays(0);
    setOvertimeHours(10);
    setHireDate(new Date().toISOString().split('T')[0]);
    setStatus('active');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setNationalId(emp.nationalId);
    setRole(emp.role);
    setPhone(emp.phone);
    setEmail(emp.email);
    setShift(emp.shift);
    setBaseSalary(emp.baseSalary || 8000);
    setIncentives(emp.incentives || 0);
    setDeductions(emp.deductions || 0);
    setAttendanceDays(emp.attendanceDays || 26);
    setAbsentDays(emp.absentDays || 0);
    setOvertimeHours(emp.overtimeHours || 0);
    setHireDate(emp.hireDate);
    setStatus(emp.status);
    setNotes(emp.notes || '');
    setShowModal(true);
  };

  const calculatedNetSalary = Math.max(0, Number(baseSalary) + Number(incentives) - Number(deductions));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة اسم الموظف');
      return;
    }

    const empData: Employee = {
      id: editingEmp ? editingEmp.id : `emp-${Date.now()}`,
      name,
      nationalId: nationalId || '29000000000000',
      role,
      phone,
      email,
      shift,
      baseSalary: Number(baseSalary),
      incentives: Number(incentives),
      deductions: Number(deductions),
      attendanceDays: Number(attendanceDays),
      absentDays: Number(absentDays),
      overtimeHours: Number(overtimeHours),
      netSalary: calculatedNetSalary,
      hireDate,
      status,
      notes,
    };

    if (editingEmp) {
      onUpdateEmployee(empData);
    } else {
      onAddEmployee(empData);
    }
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-black text-rose-950 flex items-center gap-2">
            <span>شؤون العاملين والموارد البشرية (HR Management)</span>
            <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              معامل RT
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            متابعة الكادر الطبي والفني، المرتبات الأساسية، الحوافز، الخصومات، وسجلات الحضور والغياب
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {/* Medical Staff Showcase Card */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-blue-950 text-white p-5 rounded-2xl border border-rose-900/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-5 overflow-hidden">
        <div className="space-y-2 max-w-xl text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>الكادر الطبي المعتمد · معامل RT للتحاليل الطبية</span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
            فريق أ.د. رامي مختار للاستشارات الباثولوجية والتحاليل الدقيقة
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            نخبة متميزة من كبار أطباء الباثولوجيا الإكلينيكية، الكيميائيين المعتمدين، وفنيي سحب العينات ذوي الخبرة العالية وفق أعلى معايير الجودة ومكافحة العدوى والسلامة المهنية.
          </p>
        </div>

        <div className="w-full md:w-80 h-44 rounded-xl overflow-hidden border-2 border-rose-400/40 shadow-xl shrink-0 relative group">
          <img
            src={MEDICAL_TEAM_IMG}
            alt="الكادر الطبي لمعامل رامي مختار"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => onImageErrorFallback(e)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-bold text-white">
              أ.د. رامي مختار وفريق العمل الطبي المعتمد
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate HR Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">إجمالي قوة العمل</div>
          <div className="text-2xl font-black font-mono text-slate-900">{employees.length} موظف</div>
          <div className="text-[11px] text-slate-400">
            {employees.filter((e) => e.status === 'active').length} على رأس العمل · {employees.filter((e) => e.status === 'on_leave').length} في إجازة
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">إجمالي مسير الرواتب الصافي</div>
          <div className="text-2xl font-black font-mono text-rose-950">
            {totalPayroll.toLocaleString('en-US')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">ج.م/شهر</span>
          </div>
          <div className="text-[11px] text-slate-400">
            الرواتب الأساسية شاملة الحوافز والخصومات
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">إجمالي المكافآت والحوافز</div>
          <div className="text-2xl font-black font-mono text-emerald-700">
            +{totalIncentives.toLocaleString('en-US')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400">
            حوافز إنتاجية وساعات عمل إضافي
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">إجمالي الخصومات والجزاءات</div>
          <div className="text-2xl font-black font-mono text-rose-600">
            -{totalDeductions.toLocaleString('en-US')}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400">
            خصومات تأخير أو أيام غياب
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم الموظف أو الوظيفة أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-2 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-800"
            />
          </div>
          <span className="text-xs text-slate-500">
            عرض {filtered.length} من أصل {employees.length} موظف
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3">الموظف والوظيفة</th>
                <th className="py-3 px-3">بيانات الاتصال</th>
                <th className="py-3 px-3">فترة العمل</th>
                <th className="py-3 px-3 text-center">الأساسي</th>
                <th className="py-3 px-3 text-center">حوافز</th>
                <th className="py-3 px-3 text-center">خصومات</th>
                <th className="py-3 px-3 text-center">الصافي</th>
                <th className="py-3 px-3 text-center">الحضور/الغياب</th>
                <th className="py-3 px-3 text-center">الحالة</th>
                <th className="py-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => {
                const net = emp.netSalary || Math.max(0, (emp.baseSalary || 0) + (emp.incentives || 0) - (emp.deductions || 0));
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{emp.role}</div>
                      <div className="text-[10px] text-slate-400 font-mono">رقم قومي: {emp.nationalId}</div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-800 font-bold">{emp.phone}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{emp.email || '-'}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-700">{emp.shift}</td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {(emp.baseSalary || 0).toLocaleString('en-US')} ج.م
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                      +{(emp.incentives || 0).toLocaleString('en-US')}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-rose-700">
                      -{(emp.deductions || 0).toLocaleString('en-US')}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-black text-rose-950 text-sm">
                      {net.toLocaleString('en-US')} ج.م
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      <span className="text-emerald-700 font-bold">{emp.attendanceDays || 26} يوم</span>
                      {emp.absentDays ? <span className="text-rose-600 block text-[10px] font-bold">({emp.absentDays} غياب)</span> : null}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {emp.status === 'active' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          على رأس العمل
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          في إجازة
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingPayslip(emp)}
                          title="طباعة مفردات المرتب"
                          className="p-1.5 text-blue-900 hover:text-blue-950 hover:bg-blue-50 rounded"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="تعديل بيانات الموظف"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف الموظف: ${emp.name} نهائياً؟`)) {
                              onDeleteEmployee(emp.id);
                            }
                          }}
                          title="حذف من السجل"
                          className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded"
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
                {editingEmp ? 'تعديل بيانات موظف ومفردات الراتب' : 'إضافة موظف جديد لطاقم المعمل'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. محمد أحمد عبد الرحمن"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المسمى الوظيفي *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="طبيب استشاري باثولوجيا">طبيب استشاري باثولوجيا</option>
                    <option value="أخصائي كيمياء طبية">أخصائي كيمياء طبية</option>
                    <option value="فني سحب وتحاليل">فني سحب وتحاليل</option>
                    <option value="مسؤول استقبال وتمريض">مسؤول استقبال وتمريض</option>
                    <option value="محاسب مالي">محاسب مالي</option>
                    <option value="مدير جودة ومختبر">مدير جودة ومختبر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرقم القومي</label>
                  <input
                    type="text"
                    placeholder="14 رقم"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">فترة العمل</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="صباحي (8 ص - 4 م)">صباحي (8 ص - 4 م)</option>
                    <option value="مسائي (4 م - 12 ص)">مسائي (4 م - 12 ص)</option>
                    <option value="فترة كاملة">فترة كاملة</option>
                  </select>
                </div>
              </div>

              {/* Salary, Incentives, Deductions */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                  مفردات الراتب والحوافز والخصومات
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">المرتب الأساسي</label>
                    <input
                      type="number"
                      min="1000"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-700 font-bold mb-0.5">+ مكافآت وحوافز</label>
                    <input
                      type="number"
                      min="0"
                      value={incentives}
                      onChange={(e) => setIncentives(Number(e.target.value))}
                      className="w-full p-1.5 border border-emerald-300 rounded text-xs font-mono font-bold text-emerald-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-rose-700 font-bold mb-0.5">- خصومات وجزاءات</label>
                    <input
                      type="number"
                      min="0"
                      value={deductions}
                      onChange={(e) => setDeductions(Number(e.target.value))}
                      className="w-full p-1.5 border border-rose-300 rounded text-xs font-mono font-bold text-rose-800 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-xs">
                  <span>صافي الراتب المستحق:</span>
                  <span className="font-mono text-sm text-rose-950 font-black">{calculatedNetSalary} ج.م</span>
                </div>
              </div>

              {/* Attendance & Absence */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">أيام الحضور الفعلية</label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={attendanceDays}
                    onChange={(e) => setAttendanceDays(Number(e.target.value))}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">أيام الغياب</label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={absentDays}
                    onChange={(e) => setAbsentDays(Number(e.target.value))}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">ساعات الإضافي</label>
                  <input
                    type="number"
                    min="0"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(Number(e.target.value))}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg transition-colors"
                >
                  {editingEmp ? 'حفظ التعديلات' : 'تسجيل الموظف'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-sm font-bold">بيان مفردات المرتب الشهري (Payslip)</h3>
                <p className="text-[10px] text-slate-300">معامل RT - د. رامي مختار</p>
              </div>
              <button onClick={() => setViewingPayslip(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 space-y-1">
                <div className="text-sm font-black text-slate-900">{viewingPayslip.name}</div>
                <div className="text-slate-600 font-medium">{viewingPayslip.role}</div>
                <div className="text-[11px] text-slate-500 font-mono">الرقم القومي: {viewingPayslip.nationalId}</div>
                <div className="text-[11px] text-slate-500">فترة العمل: {viewingPayslip.shift}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">المرتب الأساسي:</span>
                  <span className="font-mono font-bold text-slate-900">{(viewingPayslip.baseSalary || 0).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                  <span>+ الحوافز والمكافآت:</span>
                  <span className="font-mono font-bold">+{(viewingPayslip.incentives || 0).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                  <span>- الاستقطاعات والخصومات:</span>
                  <span className="font-mono font-bold">-{(viewingPayslip.deductions || 0).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>أيام الحضور والعمل:</span>
                  <span className="font-mono font-bold">{viewingPayslip.attendanceDays || 26} يوم</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-rose-950 border-t-2 border-rose-950">
                  <span>صافي الراتب المستحق للصرف:</span>
                  <span className="font-mono">
                    {(viewingPayslip.netSalary || (viewingPayslip.baseSalary || 0) + (viewingPayslip.incentives || 0) - (viewingPayslip.deductions || 0)).toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-950 hover:bg-rose-900 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة بيان المرتب</span>
                </button>
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="py-2 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
