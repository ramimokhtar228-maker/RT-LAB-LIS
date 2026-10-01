import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Sparkles,
  Clock,
  TestTube2,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
} from 'lucide-react';
import { TestDefinition, LabPackage, SpecimenType } from '../types/lab';

interface TestCatalogViewProps {
  testsCatalog: TestDefinition[];
  packages: LabPackage[];
  onAddTest: (test: TestDefinition) => void;
  onUpdateTest: (test: TestDefinition) => void;
  onDeleteTest: (testId: string) => void;
  onAddPackage: (pkg: LabPackage) => void;
  onUpdatePackage: (pkg: LabPackage) => void;
  onDeletePackage: (pkgId: string) => void;
}

export const TestCatalogView: React.FC<TestCatalogViewProps> = ({
  testsCatalog,
  packages,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'packages'>('tests');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(testsCatalog[0]?.id || null);

  // Test Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<TestDefinition | null>(null);
  const [testCode, setTestCode] = useState('');
  const [testNameAr, setTestNameAr] = useState('');
  const [testNameEn, setTestNameEn] = useState('');
  const [testCategory, setTestCategory] = useState<TestDefinition['category']>('biochemistry');
  const [testSpecimen, setTestSpecimen] = useState<SpecimenType>('مصل (Serum)');
  const [testTube, setTestTube] = useState('أنبوبة جل فاصل (أصفر)');
  const [testTubeColor, setTestTubeColor] = useState('#eab308');
  const [testPrice, setTestPrice] = useState(150);
  const [testTurnaround, setTestTurnaround] = useState(2);
  const [paramNameAr, setParamNameAr] = useState('');
  const [paramNameEn, setParamNameEn] = useState('');
  const [paramUnit, setParamUnit] = useState('mg/dL');
  const [paramRef, setParamRef] = useState('70 - 110 mg/dL');

  // Package Modal
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<LabPackage | null>(null);
  const [pkgNameAr, setPkgNameAr] = useState('');
  const [pkgNameEn, setPkgNameEn] = useState('');
  const [pkgCodes, setPkgCodes] = useState<string[]>(['CBC']);
  const [pkgOriginalPrice, setPkgOriginalPrice] = useState(500);
  const [pkgPrice, setPkgPrice] = useState(380);
  const [pkgDesc, setPkgDesc] = useState('');

  const categories = [
    { id: 'all', label: 'كافة الأقسام' },
    { id: 'hematology', label: 'أمراض الدم (Hematology)' },
    { id: 'biochemistry', label: 'الكيمياء الحيوية (Biochemistry)' },
    { id: 'hormones', label: 'الهرمونات (Endocrinology)' },
    { id: 'coagulation', label: 'التجلط والسيولة (Coagulation)' },
    { id: 'clinical_pathology', label: 'باثولوجيا إكلينيكية (Urine/Stool)' },
  ];

  const filteredTests = testsCatalog.filter((t) => {
    const matchesSearch =
      t.nameAr.includes(search) ||
      t.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddTest = () => {
    setEditingTest(null);
    setTestCode('');
    setTestNameAr('');
    setTestNameEn('');
    setTestCategory('biochemistry');
    setTestSpecimen('مصل (Serum)');
    setTestTube('أنبوبة جل فاصل (أصفر)');
    setTestTubeColor('#eab308');
    setTestPrice(150);
    setTestTurnaround(2);
    setParamNameAr('');
    setParamNameEn('');
    setParamUnit('mg/dL');
    setParamRef('70 - 110 mg/dL');
    setShowTestModal(true);
  };

  const handleOpenEditTest = (test: TestDefinition) => {
    setEditingTest(test);
    setTestCode(test.code);
    setTestNameAr(test.nameAr);
    setTestNameEn(test.nameEn);
    setTestCategory(test.category);
    setTestSpecimen(test.specimenType);
    setTestTube(test.tubeType);
    setTestTubeColor(test.tubeColor);
    setTestPrice(test.price);
    setTestTurnaround(test.turnaroundHours);
    setShowTestModal(true);
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim() || !testNameAr.trim()) return;

    if (editingTest) {
      onUpdateTest({
        ...editingTest,
        code: testCode.toUpperCase(),
        nameAr: testNameAr,
        nameEn: testNameEn,
        category: testCategory,
        specimenType: testSpecimen,
        tubeType: testTube,
        tubeColor: testTubeColor,
        price: testPrice,
        turnaroundHours: testTurnaround,
      });
    } else {
      const newTest: TestDefinition = {
        id: `t-${Date.now()}`,
        code: testCode.toUpperCase(),
        nameAr: testNameAr,
        nameEn: testNameEn,
        category: testCategory,
        specimenType: testSpecimen,
        tubeType: testTube,
        tubeColor: testTubeColor,
        price: testPrice,
        turnaroundHours: testTurnaround,
        parameters: [
          {
            id: `p-${Date.now()}`,
            code: testCode.toUpperCase(),
            nameAr: paramNameAr || testNameAr,
            nameEn: paramNameEn || testNameEn,
            unit: paramUnit,
            referenceRange: { generalText: paramRef },
          },
        ],
      };
      onAddTest(newTest);
    }
    setShowTestModal(false);
  };

  const handleOpenAddPkg = () => {
    setEditingPkg(null);
    setPkgNameAr('');
    setPkgNameEn('');
    setPkgCodes(['CBC']);
    setPkgOriginalPrice(500);
    setPkgPrice(380);
    setPkgDesc('');
    setShowPkgModal(true);
  };

  const handleOpenEditPkg = (pkg: LabPackage) => {
    setEditingPkg(pkg);
    setPkgNameAr(pkg.nameAr);
    setPkgNameEn(pkg.nameEn);
    setPkgCodes(pkg.testCodes);
    setPkgOriginalPrice(pkg.originalPrice);
    setPkgPrice(pkg.packagePrice);
    setPkgDesc(pkg.description);
    setShowPkgModal(true);
  };

  const handleSavePkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgNameAr.trim()) return;

    if (editingPkg) {
      onUpdatePackage({
        ...editingPkg,
        nameAr: pkgNameAr,
        nameEn: pkgNameEn,
        testCodes: pkgCodes,
        originalPrice: pkgOriginalPrice,
        packagePrice: pkgPrice,
        description: pkgDesc,
      });
    } else {
      const newPkg: LabPackage = {
        id: `pkg-${Date.now()}`,
        nameAr: pkgNameAr,
        nameEn: pkgNameEn,
        testCodes: pkgCodes,
        originalPrice: pkgOriginalPrice,
        packagePrice: pkgPrice,
        description: pkgDesc,
      };
      onAddPackage(newPkg);
    }
    setShowPkgModal(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            كتالوج التحاليل الطبية والباقات المعتمدة
          </h1>
          <p className="text-xs text-slate-500">
            إدارة وتعديل الفحوصات، أسماء النورمال، الوحدات، أسعار الفحوصات وباقات الفحص الشامل
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'tests' ? (
            <button
              onClick={handleOpenAddTest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فحص جديد للكتالوج</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddPkg}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة باقة فحص جديدة</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'tests'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              التحاليل ({testsCatalog.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'packages'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الباقات ({packages.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'tests' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-slate-800 text-white font-bold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو الكود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-2 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Test Cards / Accordions */}
          <div className="space-y-3">
            {filteredTests.map((test) => {
              const isExpanded = expandedTestId === test.id;
              return (
                <div
                  key={test.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                >
                  <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div
                      onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <span
                        className="w-3 h-9 rounded-sm shrink-0"
                        style={{ backgroundColor: test.tubeColor }}
                        title={test.tubeType}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {test.nameAr}
                          </span>
                          <span className="text-xs text-slate-400 font-sans">
                            ({test.nameEn})
                          </span>
                          <span className="text-xs font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200/50">
                            {test.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>العينة: {test.specimenType}</span>
                          <span>·</span>
                          <span>الأنبوبة: {test.tubeType}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {test.turnaroundHours} ساعات
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-mono font-bold text-base text-slate-900">
                        {test.price} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                      </div>

                      <button
                        onClick={() => handleOpenEditTest(test)}
                        title="تعديل الفحص"
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف فحص ${test.nameAr} من الكتالوج؟`)) {
                            onDeleteTest(test.id);
                          }
                        }}
                        title="حذف الفحص"
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                        className="p-1 text-slate-400"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Parameters Details */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 p-4 border-t border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-700">
                        المعايير المندرجة تحت هذا الفحص والمعدلات الطبيعية ({test.parameters.length} بارامتر):
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                              <th className="p-2.5">المعامل</th>
                              <th className="p-2.5">الكود</th>
                              <th className="p-2.5 text-center">الوحدة</th>
                              <th className="p-2.5">المعدل الطبيعي (Reference Range)</th>
                              <th className="p-2.5 text-center">قيمة الطوارئ الحرجة (Panic)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {test.parameters.map((p) => {
                              let refDisplay = p.referenceRange.generalText || '';
                              if (p.referenceRange.maleMin !== undefined) {
                                refDisplay = `ذكور: ${p.referenceRange.maleMin}-${p.referenceRange.maleMax} | إناث: ${p.referenceRange.femaleMin}-${p.referenceRange.femaleMax}`;
                              } else if (p.referenceRange.generalMin !== undefined) {
                                refDisplay = `${p.referenceRange.generalMin} - ${p.referenceRange.generalMax}`;
                              }

                              return (
                                <tr key={p.id} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-semibold text-slate-800">
                                    {p.nameAr}
                                    <span className="block text-[10px] text-slate-400 font-sans">
                                      {p.nameEn}
                                    </span>
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-600">{p.code}</td>
                                  <td className="p-2.5 text-center font-mono text-slate-500">
                                    {p.unit || '-'}
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-700">
                                    {refDisplay}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    {p.referenceRange.panicLow || p.referenceRange.panicHigh ? (
                                      <span className="text-[10px] font-mono text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                                        {p.referenceRange.panicLow ? `< ${p.referenceRange.panicLow}` : ''}{' '}
                                        {p.referenceRange.panicHigh ? `> ${p.referenceRange.panicHigh}` : ''}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Packages View with CRUD */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-slate-900">{pkg.nameAr}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditPkg(pkg)}
                      title="تعديل الباقة"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف باقة ${pkg.nameAr}؟`)) {
                          onDeletePackage(pkg.id);
                        }
                      }}
                      title="حذف الباقة"
                      className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-left">
                  <span className="text-xs text-slate-500 font-sans">{pkg.nameEn}</span>
                  <div>
                    <span className="text-lg font-mono font-bold text-teal-800">
                      {pkg.packagePrice} ج.م
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 line-through mr-2">
                      بدلاً من {pkg.originalPrice} ج.م
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {pkg.description}
                </p>

                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-semibold text-slate-700">
                    التحاليل المشمولة في الباقة ({pkg.testCodes.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.testCodes.map((code) => {
                      const def = testsCatalog.find((t) => t.code === code);
                      return (
                        <span
                          key={code}
                          className="text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-200/70 px-2 py-1 rounded"
                        >
                          {def ? def.nameAr : code} ({code})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-emerald-700 font-semibold flex items-center justify-between">
                <span>توفير نقدي: {pkg.originalPrice - pkg.packagePrice} ج.م</span>
                <span>باقة معتمدة من معامل RT</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Add/Edit Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingTest ? 'تعديل بيانات الفحص المخبري' : 'إضافة فحص مخبري جديد للكتالوج'}
              </h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اسم الفحص بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={testNameAr}
                    onChange={(e) => setTestNameAr(e.target.value)}
                    placeholder="مثال: فيتامين د الكلي"
                    className="w-full p-2 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={testNameEn}
                    onChange={(e) => setTestNameEn(e.target.value)}
                    placeholder="e.g. Total Vitamin D (25-OH)"
                    className="w-full p-2 border border-slate-200 rounded font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">كود التحليل (Acronym) *</label>
                  <input
                    type="text"
                    required
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value)}
                    placeholder="e.g. VIT-D"
                    className="w-full p-2 border border-slate-200 rounded font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">القسم المعملي</label>
                  <select
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded"
                  >
                    <option value="hematology">أمراض الدم (Hematology)</option>
                    <option value="biochemistry">الكيمياء الحيوية (Biochemistry)</option>
                    <option value="hormones">الهرمونات (Endocrinology)</option>
                    <option value="coagulation">التجلط والسيولة (Coagulation)</option>
                    <option value="clinical_pathology">باثولوجيا إكلينيكية (Urine/Stool)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">نوع العينة</label>
                  <select
                    value={testSpecimen}
                    onChange={(e) => setTestSpecimen(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded"
                  >
                    <option value="مصل (Serum)">مصل (Serum)</option>
                    <option value="دم كامل (Whole Blood)">دم كامل (Whole Blood)</option>
                    <option value="بلازما (Plasma)">بلازما (Plasma)</option>
                    <option value="بلازما سترات (Citrate Plasma)">بلازما سترات (Citrate Plasma)</option>
                    <option value="عينة بول (Urine)">عينة بول (Urine)</option>
                    <option value="عينة براز (Stool)">عينة براز (Stool)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">نوع الأنبوبة</label>
                  <input
                    type="text"
                    value={testTube}
                    onChange={(e) => setTestTube(e.target.value)}
                    placeholder="مثال: أنبوبة جل فاصل (أصفر)"
                    className="w-full p-2 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سعر الفحص (ج.م) *</label>
                  <input
                    type="number"
                    min="10"
                    value={testPrice}
                    onChange={(e) => setTestPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">وقت الإنجاز (ساعات)</label>
                  <input
                    type="number"
                    min="1"
                    value={testTurnaround}
                    onChange={(e) => setTestTurnaround(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              {!editingTest && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="font-bold text-slate-800 block">المعدل الطبيعي الأولي للفحص:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-0.5">وحدة القياس</label>
                      <input
                        type="text"
                        value={paramUnit}
                        onChange={(e) => setParamUnit(e.target.value)}
                        placeholder="ng/mL أو mg/dL"
                        className="w-full p-1.5 border border-slate-200 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-0.5">النورمال (المعدل الطبيعي)</label>
                      <input
                        type="text"
                        value={paramRef}
                        onChange={(e) => setParamRef(e.target.value)}
                        placeholder="مثال: 30.0 - 100.0 ng/mL"
                        className="w-full p-1.5 border border-slate-200 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  {editingTest ? 'تحديث الفحص' : 'إضافة الفحص للكتالوج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Add/Edit Modal */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingPkg ? 'تعديل باقة التحاليل' : 'إضافة باقة فحص شامل جديدة'}
              </h3>
              <button onClick={() => setShowPkgModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePkg} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم الباقة بالعربية *</label>
                <input
                  type="text"
                  required
                  value={pkgNameAr}
                  onChange={(e) => setPkgNameAr(e.target.value)}
                  placeholder="مثال: باقة وظائف الغدة والتمثيل الغذائي"
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={pkgNameEn}
                  onChange={(e) => setPkgNameEn(e.target.value)}
                  placeholder="e.g. Thyroid & Metabolic Panel"
                  className="w-full p-2 border border-slate-200 rounded font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">السعر الأصلي الفردي (ج.م)</label>
                  <input
                    type="number"
                    min="10"
                    value={pkgOriginalPrice}
                    onChange={(e) => setPkgOriginalPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سعر الباقة بعد التخفيض *</label>
                  <input
                    type="number"
                    min="10"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded font-mono font-bold text-teal-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  اختر أكواد الفحوصات المشمولة في الباقة:
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded max-h-32 overflow-y-auto">
                  {testsCatalog.map((t) => {
                    const isChecked = pkgCodes.includes(t.code);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setPkgCodes((prev) =>
                            prev.includes(t.code) ? prev.filter((c) => c !== t.code) : [...prev, t.code]
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                          isChecked
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {t.nameAr} ({t.code})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">وصف الباقة الطبي</label>
                <textarea
                  rows={2}
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  placeholder="وصف الفوائد السريرية والحالات التي يوصى بها لهذه الباقة..."
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  {editingPkg ? 'حفظ التعديلات' : 'إنشاء الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
