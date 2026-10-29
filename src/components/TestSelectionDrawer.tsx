import React, { useState, useMemo } from 'react';
import { TestCatalogItem, ProfileCatalogItem, PackageCatalogItem } from '../types/lab';
import { Search, CheckCircle, Plus, X, Layers, Package, Sparkles, Filter, Check } from 'lucide-react';

interface TestSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  testsCatalog: TestCatalogItem[];
  profilesCatalog: ProfileCatalogItem[];
  packagesCatalog: PackageCatalogItem[];
  selectedTestCodes: string[];
  onToggleTest: (code: string) => void;
  onAddMultipleTests: (codes: string[]) => void;
  onRemoveMultipleTests: (codes: string[]) => void;
}

export const TestSelectionDrawer: React.FC<TestSelectionDrawerProps> = ({
  isOpen,
  onClose,
  testsCatalog,
  profilesCatalog,
  packagesCatalog,
  selectedTestCodes,
  onToggleTest,
  onAddMultipleTests,
  onRemoveMultipleTests,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'packages' | 'all'>('profiles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    testsCatalog.forEach((t) => set.add(t.category));
    return ['All', ...Array.from(set)];
  }, [testsCatalog]);

  const filteredTests = useMemo(() => {
    return testsCatalog.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.scientificName.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'All' || t.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [testsCatalog, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const getTubeBadge = (tubeType: string) => {
    switch (tubeType) {
      case 'Purple EDTA':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Yellow SST Gel':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Blue Sodium Citrate':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Grey Fluoride':
        return 'bg-slate-200 text-slate-800 border-slate-400';
      case 'Sterile Container':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  const handleApplyPackage = (pkg: PackageCatalogItem) => {
    const codesToAdd: string[] = [...pkg.tests];
    pkg.profiles.forEach((pCode) => {
      const prof = profilesCatalog.find((p) => p.code === pCode);
      if (prof) {
        codesToAdd.push(...prof.tests);
      }
    });
    onAddMultipleTests(codesToAdd);
  };

  const handleApplyProfile = (prof: ProfileCatalogItem) => {
    const isAllSelected = prof.tests.every((c) => selectedTestCodes.includes(c));
    if (isAllSelected) {
      onRemoveMultipleTests(prof.tests);
    } else {
      onAddMultipleTests(prof.tests);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-800/60 rounded-xl">
              <Layers className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>اختيار التحاليل والباقات للمريض</span>
                <span className="text-xs bg-rose-800 text-rose-200 px-2 py-0.5 rounded-full font-mono font-normal">
                  {selectedTestCodes.length} تحليل محدد
                </span>
              </h2>
              <p className="text-xs text-rose-300">
                كتالوج التحاليل المعتمد دولياً (Cleveland Clinic Reference Lab Catalog)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'profiles'
                  ? 'bg-white text-rose-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-rose-700" />
              <span>البروفايلات الكبرى (Profiles)</span>
              <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {profilesCatalog.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('packages')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'packages'
                  ? 'bg-white text-rose-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-rose-700" />
              <span>باقات الفحص الشامل (Packages)</span>
              <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {packagesCatalog.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-rose-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>كل التحاليل الفردية ({testsCatalog.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الكود (e.g. CBC, ALT, HbA1c)..."
              className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-700 focus:outline-none bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
          </div>
        </div>

        {/* Tab 1: Profiles */}
        {activeTab === 'profiles' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {profilesCatalog.map((prof) => {
                const totalTestsInProf = prof.tests.length;
                const selectedInProf = prof.tests.filter((c) => selectedTestCodes.includes(c)).length;
                const isFullySelected = selectedInProf === totalTestsInProf && totalTestsInProf > 0;
                const isPartiallySelected = selectedInProf > 0 && selectedInProf < totalTestsInProf;

                return (
                  <div
                    key={prof.id}
                    className={`p-4 rounded-xl border transition-all text-right flex flex-col justify-between ${
                      isFullySelected
                        ? 'bg-rose-50/80 border-rose-400 shadow-sm'
                        : isPartiallySelected
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <button
                          onClick={() => handleApplyProfile(prof)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isFullySelected
                              ? 'bg-rose-800 text-white shadow-sm'
                              : isPartiallySelected
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isFullySelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>محدد بالكامل ({selectedInProf}/{totalTestsInProf})</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة البروفايل ({selectedInProf}/{totalTestsInProf})</span>
                            </>
                          )}
                        </button>

                        <div className="text-left">
                          <span className="font-mono text-xs font-extrabold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                            {prof.code}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{prof.name}</h3>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5" dir="ltr">
                        {prof.scientificName}
                      </p>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {prof.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                      <div className="flex flex-wrap gap-1 max-w-[65%]">
                        {prof.tests.slice(0, 6).map((c) => (
                          <span
                            key={c}
                            className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                              selectedTestCodes.includes(c)
                                ? 'bg-rose-800 text-white border-rose-900'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                        {prof.tests.length > 6 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{prof.tests.length - 6} more
                          </span>
                        )}
                      </div>

                      <div className="text-left font-mono font-bold text-rose-800 text-sm">
                        {prof.discountPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="line-through text-slate-400 text-xs font-normal">
                              {prof.price} EGP
                            </span>
                            <span>{prof.discountPrice} EGP</span>
                          </div>
                        ) : (
                          <span>{prof.price} EGP</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Packages */}
        {activeTab === 'packages' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packagesCatalog.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-gradient-to-br from-white to-rose-50/30 rounded-xl border-2 border-rose-200 hover:border-rose-400 p-4 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="bg-gradient-to-r from-rose-900 to-rose-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {pkg.badge || 'باقة فحص طبي'}
                      </span>
                      <div className="text-left">
                        <span className="text-base font-extrabold font-mono text-rose-900">
                          {pkg.price} EGP
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{pkg.nameAr}</h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5" dir="ltr">
                      {pkg.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {pkg.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pkg.profiles.map((pCode) => (
                        <span
                          key={pCode}
                          className="bg-rose-100 text-rose-900 font-mono text-xs px-2 py-0.5 rounded font-bold border border-rose-200"
                        >
                          {pCode}
                        </span>
                      ))}
                      {pkg.tests.map((tCode) => (
                        <span
                          key={tCode}
                          className="bg-blue-50 text-blue-800 font-mono text-xs px-2 py-0.5 rounded border border-blue-200"
                        >
                          +{tCode}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-end">
                    <button
                      onClick={() => handleApplyPackage(pkg)}
                      className="flex items-center gap-1.5 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>تطبيق كامل الباقة للمريض</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: All Individual Tests */}
        {activeTab === 'all' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category filter */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
              <Filter className="w-3.5 h-3.5 text-slate-500 ml-1 shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-rose-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat === 'All' ? 'جميع الفئات' : cat}
                </button>
              ))}
            </div>

            {/* Tests Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTests.map((test) => {
                  const isSelected = selectedTestCodes.includes(test.code);

                  return (
                    <div
                      key={test.code}
                      onClick={() => onToggleTest(test.code)}
                      className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-rose-50/90 border-rose-500 shadow-sm ring-1 ring-rose-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${
                              isSelected
                                ? 'bg-rose-800 text-white border-rose-900'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            {test.code}
                          </span>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getTubeBadge(test.tubeType)}`}>
                            {test.tubeType}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {test.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5" dir="ltr">
                          {test.scientificName}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">{test.unit || '-'}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-900">{test.price} EGP</span>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-rose-800 border-rose-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs flex items-center gap-3">
            <span className="text-slate-300">
              التحاليل المحددة حالياً:
            </span>
            <span className="font-mono text-rose-300 font-black text-sm bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              {selectedTestCodes.length} تحليل
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-950/50 transition-all transform active:scale-95"
          >
            تأكيد والعودة لإدخال النتائج (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
