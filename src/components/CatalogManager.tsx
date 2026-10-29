import React, { useState } from 'react';
import { TestCatalogItem, ProfileCatalogItem, PackageCatalogItem, LabDevice } from '../types/lab';
import { DEFAULT_LAB_DEVICES } from '../data/analyzers';
import {
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Search,
  Save,
  X,
  Database,
  Check,
  Layers,
  Package,
  Cpu,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface CatalogManagerProps {
  testsCatalog: TestCatalogItem[];
  profilesCatalog: ProfileCatalogItem[];
  packagesCatalog: PackageCatalogItem[];
  devicesCatalog?: LabDevice[];
  onUpdateTestsCatalog: (tests: TestCatalogItem[]) => void;
  onUpdateProfilesCatalog: (profiles: ProfileCatalogItem[]) => void;
  onUpdatePackagesCatalog: (packages: PackageCatalogItem[]) => void;
  onUpdateDevicesCatalog?: (devices: LabDevice[]) => void;
  onResetToDefaults: () => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  testsCatalog,
  profilesCatalog,
  packagesCatalog,
  devicesCatalog: externalDevices,
  onUpdateTestsCatalog,
  onUpdateProfilesCatalog,
  onUpdatePackagesCatalog,
  onUpdateDevicesCatalog,
  onResetToDefaults,
}) => {
  const [tab, setTab] = useState<'devices' | 'tests' | 'profiles' | 'packages'>('devices');
  const [search, setSearch] = useState('');

  // Devices state
  const [devices, setDevices] = useState<LabDevice[]>(() => {
    return externalDevices && externalDevices.length > 0 ? externalDevices : DEFAULT_LAB_DEVICES;
  });

  const updateDevices = (newDevs: LabDevice[]) => {
    setDevices(newDevs);
    if (onUpdateDevicesCatalog) {
      onUpdateDevicesCatalog(newDevs);
    }
  };

  // Editing modals
  const [editingTest, setEditingTest] = useState<TestCatalogItem | null>(null);
  const [isCreatingNewTest, setIsCreatingNewTest] = useState(false);

  const [editingDevice, setEditingDevice] = useState<LabDevice | null>(null);
  const [isCreatingNewDevice, setIsCreatingNewDevice] = useState(false);

  // Permanent Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'test' | 'device' | 'profile' | 'package';
    id: string;
    title: string;
  } | null>(null);

  // Toggle minimize for a single device ("تصغير الجهاز")
  const handleToggleMinimizeDevice = (deviceId: string) => {
    const updated = devices.map((d) =>
      d.id === deviceId ? { ...d, minimized: !d.minimized } : d
    );
    updateDevices(updated);
  };

  // Toggle minimize for ALL devices
  const handleToggleMinimizeAll = (minimize: boolean) => {
    const updated = devices.map((d) => ({ ...d, minimized: minimize }));
    updateDevices(updated);
  };

  // Save device
  const handleSaveDevice = (device: LabDevice) => {
    const existingIndex = devices.findIndex((d) => d.id === device.id);
    if (existingIndex >= 0) {
      const updated = [...devices];
      updated[existingIndex] = device;
      updateDevices(updated);
    } else {
      updateDevices([...devices, device]);
    }
    setEditingDevice(null);
    setIsCreatingNewDevice(false);
  };

  // Execute confirmed permanent deletion
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    if (type === 'test') {
      onUpdateTestsCatalog(testsCatalog.filter((t) => t.code !== id));
    } else if (type === 'device') {
      updateDevices(devices.filter((d) => d.id !== id));
    } else if (type === 'profile') {
      onUpdateProfilesCatalog(profilesCatalog.filter((p) => p.id !== id));
    } else if (type === 'package') {
      onUpdatePackagesCatalog(packagesCatalog.filter((p) => p.id !== id));
    }

    setDeleteConfirm(null);
  };

  // Save test
  const handleSaveTest = (test: TestCatalogItem) => {
    const existingIndex = testsCatalog.findIndex((t) => t.code === test.code);
    if (existingIndex >= 0) {
      const updated = [...testsCatalog];
      updated[existingIndex] = test;
      onUpdateTestsCatalog(updated);
    } else {
      onUpdateTestsCatalog([...testsCatalog, test]);
    }
    setEditingTest(null);
    setIsCreatingNewTest(false);
  };

  // Filtered tests
  const filteredTests = testsCatalog.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.scientificName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border-b-4 border-[#7A1C30] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-900/60 border border-rose-700/60 flex items-center justify-center text-rose-300">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>إدارة الأجهزة المعملية والكتالوج الطبي المعتمد</span>
              <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono">
                {devices.length} أجهزة معملية
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              إضافة وتعديل الأجهزة والتحاليل، تصغير وتوسيع الأجهزة، وزر الحذف النهائي الآمن
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (confirm('هل تريد استعادة الكتالوج والأجهزة الافتراضية لمعامل RT؟')) {
                onResetToDefaults();
                updateDevices(DEFAULT_LAB_DEVICES);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          {tab === 'devices' ? (
            <button
              onClick={() => {
                setEditingDevice({
                  id: `dev-${Date.now()}`,
                  code: `DEV-0${devices.length + 1}`,
                  name: '',
                  model: '',
                  category: 'Clinical Chemistry',
                  manufacturer: '',
                  status: 'Operational',
                  minimized: false,
                  testCodes: [],
                });
                setIsCreatingNewDevice(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة جهاز معملي جديد</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingTest({
                  code: '',
                  name: '',
                  scientificName: '',
                  category: 'Hematology',
                  unit: 'mg/dL',
                  refMale: { min: 0, max: 100, text: '0 - 100' },
                  refFemale: { min: 0, max: 100, text: '0 - 100' },
                  price: 50,
                  tubeType: 'Yellow SST Gel',
                  sampleCondition: 'Serum specimen.',
                  method: 'Automated Photometric',
                });
                setIsCreatingNewTest(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تحليل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'devices'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>الأجهزة والمحللات المعملية ({devices.length})</span>
          </button>
          <button
            onClick={() => setTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'tests'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>التحاليل الفردية ({testsCatalog.length})</span>
          </button>
          <button
            onClick={() => setTab('profiles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'profiles'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>البروفايلات الكبرى ({profilesCatalog.length})</span>
          </button>
          <button
            onClick={() => setTab('packages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'packages'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>الباقات الشاملة ({packagesCatalog.length})</span>
          </button>
        </div>

        {tab === 'devices' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleMinimizeAll(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
              title="تصغير جميع بطاقات الأجهزة"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>تصغير الكل</span>
            </button>
            <button
              onClick={() => handleToggleMinimizeAll(false)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
              title="توسيع جميع بطاقات الأجهزة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>توسيع الكل</span>
            </button>
          </div>
        )}

        {tab === 'tests' && (
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الكتالوج..."
              className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-700"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
          </div>
        )}
      </div>

      {/* ================= DEVICES & ANALYZERS TAB ================= */}
      {tab === 'devices' && (
        <div className="space-y-4">
          {devices.map((device) => {
            const isMinimized = !!device.minimized;
            const deviceTests = testsCatalog.filter(
              (t) => device.testCodes?.includes(t.code) || t.method?.toLowerCase().includes(device.code.toLowerCase())
            );

            return (
              <div
                key={device.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Device Header Bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {device.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 font-sans">
                          {device.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            device.status === 'Operational'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : device.status === 'Standby'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {device.status === 'Operational' ? '● جاهز ويعمل' : device.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                        {device.model} • {device.manufacturer}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Minimize/Expand Device, Edit, Permanent Delete */}
                  <div className="flex items-center gap-2">
                    {/* Minimize / Expand Device Button ("تصغير الجهاز") */}
                    <button
                      onClick={() => handleToggleMinimizeDevice(device.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs transition-all"
                      title={isMinimized ? 'توسيع عرض تفاصيل الجهاز' : 'تصغير الجهاز'}
                    >
                      {isMinimized ? (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-blue-700" />
                          <span>توسيع الجهاز</span>
                        </>
                      ) : (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>تصغير الجهاز</span>
                        </>
                      )}
                    </button>

                    {/* Edit Device Button */}
                    <button
                      onClick={() => {
                        setEditingDevice({ ...device });
                        setIsCreatingNewDevice(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-2xs transition-all"
                      title="تعديل بيانات الجهاز والموديل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {/* Permanent Delete Device Button */}
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'device',
                          id: device.id,
                          title: `الجهاز المعملي: ${device.name} (${device.code})`,
                        })
                      }
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 shadow-2xs transition-all"
                      title="حذف الجهاز نهائياً من النظام"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف نهائي</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Device Details */}
                {!isMinimized && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 border-b pb-2">
                      <span className="font-bold">
                        التحاليل المبرمجة على الجهاز ({device.testCodes?.length || 0}):
                      </span>
                      <span className="text-slate-400 font-mono">Category: {device.category}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {device.testCodes?.map((code) => {
                        const t = testsCatalog.find((x) => x.code === code);
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800"
                          >
                            <span>{code}</span>
                            {t && <span className="text-[10px] text-slate-500 font-sans">({t.name})</span>}
                          </span>
                        );
                      })}
                      {(!device.testCodes || device.testCodes.length === 0) && (
                        <p className="text-xs text-slate-400 italic">لا توجد تحاليل مسندة بعد لهذا الجهاز.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TESTS LIST TAB ================= */}
      {tab === 'tests' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" dir="ltr">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Name &amp; Scientific Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Sample Tube</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Male Normal</th>
                  <th className="py-3 px-4">Female Normal</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTests.map((test, idx) => (
                  <tr key={test.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-4 font-mono font-bold text-rose-950">{test.code}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{test.name}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{test.scientificName}</div>
                      {test.method && (
                        <div className="text-[9.5px] text-slate-400 font-mono">Method: {test.method}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">{test.category}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {test.tubeType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{test.unit || '-'}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 text-[11px]">
                      {test.refMale.text || `${test.refMale.min} - ${test.refMale.max}`}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 text-[11px]">
                      {test.refFemale.text || `${test.refFemale.min} - ${test.refFemale.max}`}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-900">
                      {test.price} EGP
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTest({ ...test });
                            setIsCreatingNewTest(false);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                          title="تعديل التحليل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'test',
                              id: test.code,
                              title: `التحليل: ${test.name} (${test.code})`,
                            })
                          }
                          className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                          title="حذف نهائي للتحليل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PROFILES TAB ================= */}
      {tab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profilesCatalog.map((prof) => (
            <div
              key={prof.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono font-bold text-xs bg-rose-100 text-rose-900 px-2 py-0.5 rounded border border-rose-200">
                    {prof.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-900 text-sm">
                      {prof.discountPrice ? `${prof.discountPrice} EGP (${prof.price} orig)` : `${prof.price} EGP`}
                    </span>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'profile',
                          id: prof.id,
                          title: `البروفايل: ${prof.name} (${prof.code})`,
                        })
                      }
                      className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                      title="حذف نهائي للبروفايل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-2">{prof.name}</h3>
                <p className="text-xs text-slate-600 mt-1">{prof.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {prof.tests.map((c) => (
                    <span key={c} className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= PACKAGES TAB ================= */}
      {tab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packagesCatalog.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold bg-rose-900 text-white px-2.5 py-0.5 rounded-full">
                    {pkg.badge || 'باقة طبية'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-rose-900 text-base">
                      {pkg.price} EGP
                    </span>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'package',
                          id: pkg.id,
                          title: `الباقة: ${pkg.nameAr}`,
                        })
                      }
                      className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                      title="حذف نهائي للباقة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-2">{pkg.nameAr}</h3>
                <p className="text-xs text-slate-500 font-sans" dir="ltr">
                  {pkg.name}
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{pkg.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL: EDIT / CREATE DEVICE ================= */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-rose-950 to-slate-900 p-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-300" />
                <span>
                  {isCreatingNewDevice ? 'إضافة جهاز معملي جديد' : `تعديل جهاز: ${editingDevice.name}`}
                </span>
              </h3>
              <button
                onClick={() => setEditingDevice(null)}
                className="p-1 rounded text-rose-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveDevice(editingDevice);
              }}
              className="p-6 space-y-4 text-right"
            >
              <div className="grid grid-cols-2 gap-3" dir="ltr">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Device Code (رمز الجهاز) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDevice.code}
                    onChange={(e) =>
                      setEditingDevice({ ...editingDevice, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status (الحالة)</label>
                  <select
                    value={editingDevice.status}
                    onChange={(e) =>
                      setEditingDevice({ ...editingDevice, status: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Operational">Operational (يعمل بكفاءة)</option>
                    <option value="Standby">Standby (استعداد)</option>
                    <option value="Maintenance">Maintenance (صيانة)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Device Full Name (اسم الجهاز الكامل) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDevice.name}
                    onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model (الموديل)</label>
                  <input
                    type="text"
                    value={editingDevice.model}
                    onChange={(e) => setEditingDevice({ ...editingDevice, model: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manufacturer / Country (الشركة المصنعة)
                  </label>
                  <input
                    type="text"
                    value={editingDevice.manufacturer}
                    onChange={(e) =>
                      setEditingDevice({ ...editingDevice, manufacturer: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Test Codes (رموز التحاليل المبرمجة مفصولة بفواصل)
                  </label>
                  <input
                    type="text"
                    value={editingDevice.testCodes?.join(', ') || ''}
                    onChange={(e) =>
                      setEditingDevice({
                        ...editingDevice,
                        testCodes: e.target.value
                          .split(',')
                          .map((x) => x.trim().toUpperCase())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g. WBC, RBC, HGB, HCT, PLT"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-800 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ بيانات الجهاز</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT / CREATE TEST ================= */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-rose-950 to-slate-900 p-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {isCreatingNewTest
                  ? 'إضافة تحليل جديد للكتالوج الطبي'
                  : `تعديل التحليل: ${editingTest.name} (${editingTest.code})`}
              </h3>
              <button
                onClick={() => setEditingTest(null)}
                className="p-1 rounded text-rose-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveTest(editingTest);
              }}
              className="p-6 space-y-4 text-right"
            >
              <div className="grid grid-cols-2 gap-3" dir="ltr">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Test Code (e.g. CBC, ALT, TSH) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTest.code}
                    disabled={!isCreatingNewTest}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category (الفئة)</label>
                  <input
                    type="text"
                    value={editingTest.category}
                    onChange={(e) => setEditingTest({ ...editingTest, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTest.name}
                    onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scientific Name / Full Latin Title
                  </label>
                  <input
                    type="text"
                    value={editingTest.scientificName}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, scientificName: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Measurement Unit (الوحدة)
                  </label>
                  <input
                    type="text"
                    value={editingTest.unit}
                    onChange={(e) => setEditingTest({ ...editingTest, unit: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price in EGP (السعر بالجنيه)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingTest.price}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sample Tube Type &amp; Color
                  </label>
                  <select
                    value={editingTest.tubeType}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, tubeType: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Purple EDTA">Purple EDTA</option>
                    <option value="Yellow SST Gel">Yellow SST Gel</option>
                    <option value="Red Plain">Red Plain</option>
                    <option value="Blue Sodium Citrate">Blue Sodium Citrate</option>
                    <option value="Grey Fluoride">Grey Fluoride</option>
                    <option value="Green Heparin">Green Heparin</option>
                    <option value="Sterile Container">Sterile Container</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Methodology / Analyzer
                  </label>
                  <input
                    type="text"
                    value={editingTest.method}
                    onChange={(e) => setEditingTest({ ...editingTest, method: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Male Reference Text (المعدل الطبيعي للذكور)
                  </label>
                  <input
                    type="text"
                    value={editingTest.refMale.text || ''}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        refMale: { ...editingTest.refMale, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Female Reference Text (المعدل الطبيعي للإناث)
                  </label>
                  <input
                    type="text"
                    value={editingTest.refFemale.text || ''}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        refFemale: { ...editingTest.refFemale, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sample Conditions / Preparation
                  </label>
                  <input
                    type="text"
                    value={editingTest.sampleCondition}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, sampleCondition: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-800 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ في الكتالوج الطبي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PERMANENT DELETE CONFIRMATION ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-right space-y-4">
            <div className="flex items-center gap-3 text-rose-800">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-700" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  تأكيد الحذف النهائي (Permanent Deletion)
                </h3>
                <p className="text-xs text-slate-500">هذا الإجراء نهائي ولا يمكن التراجع عنه</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              هل أنت متأكد تماماً من رغبتك في الحذف النهائي لـ:
              <br />
              <strong className="text-rose-950 font-bold mt-1 block">{deleteConfirm.title}</strong>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteDelete}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف نهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
