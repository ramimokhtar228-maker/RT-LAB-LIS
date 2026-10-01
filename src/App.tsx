/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ResultsWorklistView } from './components/ResultsWorklistView';
import { PatientsView } from './components/PatientsView';
import { TestCatalogView } from './components/TestCatalogView';
import { FinancialView } from './components/FinancialView';
import { InventoryView } from './components/InventoryView';
import { HRView } from './components/HRView';
import { DeviceInterfacingView } from './components/DeviceInterfacingView';
import { SmartReportsView } from './components/SmartReportsView';
import { PatientPortalView } from './components/PatientPortalView';
import { BookingsManagementView } from './components/BookingsManagementView';
import { NewOrderModal } from './components/NewOrderModal';
import { ReportPrintModal } from './components/ReportPrintModal';
import { BarcodeModal } from './components/BarcodeModal';
import { InstallAppModal } from './components/InstallAppModal';
import { MobileInstallBanner } from './components/MobileInstallBanner';
import { LogoManagerModal } from './components/LogoManagerModal';

import {
  loadStoredData,
  saveOrders,
  savePatients,
  saveReagents,
  saveTests,
  savePackages,
  saveEmployees,
  saveExpenses,
  saveBookings,
  saveProfile,
  resetToDemoData,
  exportCompleteBackup,
  importCompleteBackup,
  LabProfile,
} from './services/storage';
import {
  LabOrder,
  Patient,
  ReagentItem,
  TestDefinition,
  LabPackage,
  Employee,
  ExpenseItem,
  PatientBooking,
} from './types/lab';
import {
  TestTube2,
  FileCheck2,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  LayoutDashboard,
  CalendarCheck,
  Cloud,
  Trash2,
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState(() => loadStoredData());
  const [viewMode, setViewMode] = useState<'admin' | 'patient_portal'>('admin');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals & Active selections
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isLogoManagerOpen, setIsLogoManagerOpen] = useState(false);
  const [selectedOrderForWorklist, setSelectedOrderForWorklist] = useState<string | undefined>(undefined);
  const [reportOrderToPrint, setReportOrderToPrint] = useState<LabOrder | null>(null);
  const [barcodeOrderToPrint, setBarcodeOrderToPrint] = useState<LabOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cross-Tab & Multi-Device Real-time Synchronization Listener
  useEffect(() => {
    const handleStorageChange = () => {
      setData(loadStoredData());
    };

    const bc =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel('rami_mokhtar_realtime_sync')
        : null;

    const handleSyncMsg = (e: MessageEvent) => {
      if (e.data?.type === 'DATA_SYNC') {
        setData(loadStoredData());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    bc?.addEventListener('message', handleSyncMsg);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      bc?.close();
    };
  }, []);

  // Orders tab filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'ready'>('all');

  // Orders handlers
  const handleUpdateOrder = (updatedOrder: LabOrder) => {
    setData((prev) => {
      const nextOrders = prev.orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      saveOrders(nextOrders);
      return { ...prev, orders: nextOrders };
    });
  };

  const handleAddNewOrder = (newOrder: LabOrder, andPrintBarcode: boolean) => {
    setData((prev) => {
      const nextOrders = [newOrder, ...prev.orders];
      saveOrders(nextOrders);
      return { ...prev, orders: nextOrders };
    });
    setIsNewOrderOpen(false);

    if (andPrintBarcode) {
      setBarcodeOrderToPrint(newOrder);
    }
  };

  const handleMarkCollected = (orderId: string) => {
    setData((prev) => {
      const nextOrders = prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          specimenStatus: 'collected' as const,
          orderStatus: 'processing' as const,
          specimenCollectedAt: new Date().toISOString(),
          tests: o.tests.map((t) => ({ ...t, status: 'processing' as const })),
        };
      });
      saveOrders(nextOrders);
      return { ...prev, orders: nextOrders };
    });
  };

  // Patients handlers
  const handleAddPatient = (patient: Patient) => {
    setData((prev) => {
      const nextPatients = [patient, ...prev.patients];
      savePatients(nextPatients);
      return { ...prev, patients: nextPatients };
    });
  };

  const handleUpdatePatient = (patient: Patient) => {
    setData((prev) => {
      const nextPatients = prev.patients.map((p) => (p.id === patient.id ? patient : p));
      savePatients(nextPatients);
      return { ...prev, patients: nextPatients };
    });
  };

  const handleDeletePatient = (patientId: string) => {
    setData((prev) => {
      const nextPatients = prev.patients.filter((p) => p.id !== patientId);
      savePatients(nextPatients);
      return { ...prev, patients: nextPatients };
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setData((prev) => {
      const nextOrders = prev.orders.filter((o) => o.id !== orderId);
      saveOrders(nextOrders);
      return { ...prev, orders: nextOrders };
    });
  };

  // Financial handlers
  const handleUpdatePayment = (orderId: string, additionalAmount: number) => {
    setData((prev) => {
      const nextOrders = prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        const newPaid = o.paidAmount + additionalAmount;
        return {
          ...o,
          paidAmount: newPaid,
          financialStatus: newPaid >= o.netAmount ? ('paid' as const) : ('partial' as const),
        };
      });
      saveOrders(nextOrders);
      return { ...prev, orders: nextOrders };
    });
  };

  const handleAddExpense = (expense: ExpenseItem) => {
    setData((prev) => {
      const nextExpenses = [expense, ...prev.expenses];
      saveExpenses(nextExpenses);
      return { ...prev, expenses: nextExpenses };
    });
  };

  const handleUpdateProfile = (newProfile: LabProfile) => {
    setData((prev) => {
      saveProfile(newProfile);
      return { ...prev, profile: newProfile };
    });
  };

  const handleDeleteExpense = (expId: string) => {
    setData((prev) => {
      const nextExpenses = prev.expenses.filter((e) => e.id !== expId);
      saveExpenses(nextExpenses);
      return { ...prev, expenses: nextExpenses };
    });
  };

  // Tests & Packages CRUD
  const handleAddTest = (newTest: TestDefinition) => {
    setData((prev) => {
      const nextTests = [...prev.tests, newTest];
      saveTests(nextTests);
      return { ...prev, tests: nextTests };
    });
  };

  const handleUpdateTest = (updatedTest: TestDefinition) => {
    setData((prev) => {
      const nextTests = prev.tests.map((t) => (t.id === updatedTest.id ? updatedTest : t));
      saveTests(nextTests);
      return { ...prev, tests: nextTests };
    });
  };

  const handleDeleteTest = (testId: string) => {
    setData((prev) => {
      const nextTests = prev.tests.filter((t) => t.id !== testId);
      saveTests(nextTests);
      return { ...prev, tests: nextTests };
    });
  };

  const handleAddPackage = (newPkg: LabPackage) => {
    setData((prev) => {
      const nextPackages = [...prev.packages, newPkg];
      savePackages(nextPackages);
      return { ...prev, packages: nextPackages };
    });
  };

  const handleUpdatePackage = (updatedPkg: LabPackage) => {
    setData((prev) => {
      const nextPackages = prev.packages.map((p) => (p.id === updatedPkg.id ? updatedPkg : p));
      savePackages(nextPackages);
      return { ...prev, packages: nextPackages };
    });
  };

  const handleDeletePackage = (pkgId: string) => {
    setData((prev) => {
      const nextPackages = prev.packages.filter((p) => p.id !== pkgId);
      savePackages(nextPackages);
      return { ...prev, packages: nextPackages };
    });
  };

  // Inventory CRUD
  const handleUpdateStock = (reagentId: string, newStock: number) => {
    setData((prev) => {
      const nextReagents = prev.reagents.map((r) => {
        if (r.id !== reagentId) return r;
        return {
          ...r,
          currentStock: newStock,
          status: newStock <= r.minStockLevel ? ('low' as const) : ('ok' as const),
        };
      });
      saveReagents(nextReagents);
      return { ...prev, reagents: nextReagents };
    });
  };

  const handleAddReagent = (newReagent: ReagentItem) => {
    setData((prev) => {
      const nextReagents = [newReagent, ...prev.reagents];
      saveReagents(nextReagents);
      return { ...prev, reagents: nextReagents };
    });
  };

  const handleUpdateReagent = (updatedReagent: ReagentItem) => {
    setData((prev) => {
      const nextReagents = prev.reagents.map((r) => (r.id === updatedReagent.id ? updatedReagent : r));
      saveReagents(nextReagents);
      return { ...prev, reagents: nextReagents };
    });
  };

  const handleDeleteReagent = (reagentId: string) => {
    setData((prev) => {
      const nextReagents = prev.reagents.filter((r) => r.id !== reagentId);
      saveReagents(nextReagents);
      return { ...prev, reagents: nextReagents };
    });
  };

  // HR Staff CRUD
  const handleAddEmployee = (newEmp: Employee) => {
    setData((prev) => {
      const nextEmployees = [...prev.employees, newEmp];
      saveEmployees(nextEmployees);
      return { ...prev, employees: nextEmployees };
    });
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setData((prev) => {
      const nextEmployees = prev.employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
      saveEmployees(nextEmployees);
      return { ...prev, employees: nextEmployees };
    });
  };

  const handleDeleteEmployee = (empId: string) => {
    setData((prev) => {
      const nextEmployees = prev.employees.filter((e) => e.id !== empId);
      saveEmployees(nextEmployees);
      return { ...prev, employees: nextEmployees };
    });
  };

  // Bookings handlers
  const handleAddBooking = (newBooking: PatientBooking) => {
    setData((prev) => {
      const nextBookings = [newBooking, ...prev.bookings];
      saveBookings(nextBookings);
      return { ...prev, bookings: nextBookings };
    });
  };

  const handleConfirmBooking = (bookingId: string) => {
    setData((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'confirmed' as const } : b
      );
      saveBookings(nextBookings);
      return { ...prev, bookings: nextBookings };
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    setData((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      );
      saveBookings(nextBookings);
      return { ...prev, bookings: nextBookings };
    });
  };

  const handleConvertBookingToOrder = (booking: PatientBooking) => {
    let patient = data.patients.find((p) => p.phone === booking.phone || p.name === booking.patientName);
    if (!patient) {
      patient = {
        id: `pat-${Date.now()}`,
        nationalId: booking.nationalId || '10000000000000',
        name: booking.patientName,
        age: booking.age,
        ageUnit: booking.ageUnit,
        gender: booking.gender,
        phone: booking.phone,
        address: booking.address,
        registeredAt: new Date().toISOString(),
      };
      handleAddPatient(patient);
    }

    const orderNumber = `RM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const barcode = `RM8920${Math.floor(1000 + Math.random() * 9000)}`;

    const selectedDefs = data.tests.filter((t) => booking.selectedTests.includes(t.code));

    const newOrder: LabOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      sampleBarcode: barcode,
      patientId: patient.id,
      patient,
      orderStatus: 'sampling',
      specimenStatus: 'pending',
      urgency: 'routine',
      clinicalDiagnosis: booking.visitType === 'home_visit' ? 'سحب منزلي محول من الحجز' : 'حجز مسبق بالمعمل',
      totalAmount: booking.estimatedPrice,
      discount: 0,
      netAmount: booking.estimatedPrice,
      paidAmount: 0,
      financialStatus: 'unpaid',
      paymentMethod: 'نقداً (Cash)',
      createdAt: new Date().toISOString(),
      tests: selectedDefs.map((def) => ({
        testId: def.id,
        code: def.code,
        nameAr: def.nameAr,
        nameEn: def.nameEn,
        status: 'pending_collection',
        results: [],
      })),
    };

    handleAddNewOrder(newOrder, true);

    setData((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === booking.id ? { ...b, status: 'completed' as const } : b
      );
      saveBookings(nextBookings);
      return { ...prev, bookings: nextBookings };
    });

    setCurrentTab('orders');
  };

  // Device Auto Ingestion simulator
  const handleAutoIngestResults = (deviceId: string) => {
    const targetOrder = data.orders.find((o) => o.orderStatus === 'sampling' || o.orderStatus === 'processing');
    if (!targetOrder) return;

    const updatedTests = targetOrder.tests.map((t) => {
      const def = data.tests.find((cd) => cd.code === t.code);
      if (!def) return t;

      const autoParams = def.parameters.map((p) => {
        let simulatedVal = p.defaultValue !== undefined ? String(p.defaultValue) : '10';
        return {
          parameterId: p.id,
          code: p.code,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          value: simulatedVal,
          unit: p.unit,
          refText: p.referenceRange.generalText || 'طبيعي',
          flag: 'normal' as const,
        };
      });

      return {
        ...t,
        status: 'completed' as const,
        results: autoParams,
        completedAt: new Date().toISOString(),
        technicianNotes: 'تم سحب النتيجة مباشرة من الجهاز عبر بروتوكول HL7',
      };
    });

    const updatedOrder: LabOrder = {
      ...targetOrder,
      orderStatus: 'processing',
      specimenStatus: 'collected',
      tests: updatedTests,
    };

    handleUpdateOrder(updatedOrder);
  };

  const handleResetData = () => {
    if (window.confirm('هل تريد بالتأكيد إعادة ضبط البيانات على القيم الافتراضية الأولية لمعامل رامي مختار؟')) {
      const initial = resetToDemoData();
      setData(initial);
    }
  };

  const handleImportBackup = (jsonStr: string) => {
    importCompleteBackup(jsonStr);
    setData(loadStoredData());
  };

  // Badges
  const pendingWorklistCount = data.orders.filter(
    (o) => o.orderStatus === 'sampling' || o.orderStatus === 'processing'
  ).length;
  const readyReportsCount = data.orders.filter((o) => o.orderStatus === 'ready').length;
  const lowStockCount = data.reagents.filter(
    (r) => r.status === 'low' || r.currentStock <= r.minStockLevel
  ).length;
  const pendingBookingsCount = data.bookings.filter((b) => b.status === 'pending').length;

  // View Mode: Patient Portal vs Admin
  if (viewMode === 'patient_portal') {
    return (
      <>
        <PatientPortalView
          profile={data.profile}
          testsCatalog={data.tests}
          packages={data.packages}
          orders={data.orders}
          bookings={data.bookings}
          onAddBooking={handleAddBooking}
          onOpenReport={(ord) => setReportOrderToPrint(ord)}
          onSwitchToAdmin={() => setViewMode('admin')}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
        {isInstallModalOpen && (
          <InstallAppModal
            onClose={() => setIsInstallModalOpen(false)}
            onExportBackup={exportCompleteBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Mobile Sticky Install Banner */}
      <MobileInstallBanner onOpenGuide={() => setIsInstallModalOpen(true)} />

      {/* Universal Header with Rami Mokhtar Labs Branding */}
      <Header
        profile={data.profile}
        onNewOrder={() => setIsNewOrderOpen(true)}
        orders={data.orders}
        onSelectOrder={(ord) => {
          setSelectedOrderForWorklist(ord.id);
          setCurrentTab('worklist');
        }}
        onResetData={handleResetData}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSwitchToPatientPortal={() => setViewMode('patient_portal')}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        onOpenLogoManager={() => setIsLogoManagerOpen(true)}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          pendingWorklistCount={pendingWorklistCount}
          readyReportsCount={readyReportsCount}
          lowStockCount={lowStockCount}
          pendingBookingsCount={pendingBookingsCount}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenInstallApp={() => setIsInstallModalOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto">
          {/* TAB: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <DashboardView
              orders={data.orders}
              reagents={data.reagents}
              testsCatalog={data.tests}
              profile={data.profile}
              onOpenLogoManager={() => setIsLogoManagerOpen(true)}
              onNewOrder={() => setIsNewOrderOpen(true)}
              onOpenWorklist={(orderId) => {
                setSelectedOrderForWorklist(orderId);
                setCurrentTab('worklist');
              }}
              onOpenReport={(ord) => setReportOrderToPrint(ord)}
              onOpenBarcode={(ord) => setBarcodeOrderToPrint(ord)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {/* TAB: BOOKINGS MANAGEMENT */}
          {currentTab === 'bookings' && (
            <BookingsManagementView
              bookings={data.bookings}
              profile={data.profile}
              onConfirmBooking={handleConfirmBooking}
              onConvertToOrder={handleConvertBookingToOrder}
              onCancelBooking={handleCancelBooking}
            />
          )}

          {/* TAB: ORDERS & SAMPLING */}
          {currentTab === 'orders' && (
            <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-base font-bold text-slate-900">
                    استقبال وسحب العينات وإدارة الطلبات
                  </h1>
                  <p className="text-xs text-slate-500">
                    متابعة العينات المسحوبة، طباعة ملصقات الباركود وتحويلها للمختبر
                  </p>
                </div>

                <button
                  onClick={() => setIsNewOrderOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>طلب فحص جديد</span>
                </button>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setOrderStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        orderStatusFilter === 'all'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      كافة الطلبات ({data.orders.length})
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        orderStatusFilter === 'pending'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      بانتظار سحب العينة
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter('processing')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        orderStatusFilter === 'processing'
                          ? 'bg-blue-900 text-white font-bold'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      قيد الفحص المخبري
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter('ready')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        orderStatusFilter === 'ready'
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      معتمد وجاهز للتسليم
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                        <th className="py-2.5 px-3">رقم الطلب / الباركود</th>
                        <th className="py-2.5 px-3">المريض</th>
                        <th className="py-2.5 px-3">الفحوصات المطلوبة</th>
                        <th className="py-2.5 px-3 text-center">أولوية العينة</th>
                        <th className="py-2.5 px-3 text-center">حالة السحب</th>
                        <th className="py-2.5 px-3 text-center">حالة الفحص</th>
                        <th className="py-2.5 px-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.orders
                        .filter((o) => {
                          if (orderStatusFilter === 'pending') return o.specimenStatus === 'pending';
                          if (orderStatusFilter === 'processing') return o.orderStatus === 'processing';
                          if (orderStatusFilter === 'ready') return o.orderStatus === 'ready';
                          return true;
                        })
                        .map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-slate-900 block">
                                {ord.sampleBarcode}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {ord.orderNumber}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{ord.patient.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {ord.patient.gender === 'male' ? 'ذكر' : 'أنثى'} ({ord.patient.age} س) · {ord.patient.phone}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-semibold text-rose-950 line-clamp-1">
                                {ord.tests.map((t) => t.nameAr).join(' + ')}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                الطبيب: {ord.referringDoctor || 'غير محدد'}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center">
                              {ord.urgency === 'stat' ? (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-block animate-pulse">
                                  🚨 STAT عاجل
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                                  روتيني
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {ord.specimenStatus === 'collected' ? (
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                  تم السحب
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleMarkCollected(ord.id)}
                                  className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded transition-colors"
                                >
                                  سحب العينة الآن
                                </button>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {ord.orderStatus === 'ready' ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  معتمد نهائياً
                                </span>
                              ) : ord.orderStatus === 'processing' ? (
                                <span className="text-[10px] font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full">
                                  قيد الفحص
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  استقبال
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setBarcodeOrderToPrint(ord)}
                                  title="طباعة ملصق الباركود"
                                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                                >
                                  <TestTube2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedOrderForWorklist(ord.id);
                                    setCurrentTab('worklist');
                                  }}
                                  title="إدخال النتائج"
                                  className="p-1.5 text-rose-800 hover:text-rose-950 hover:bg-rose-50 rounded"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setReportOrderToPrint(ord)}
                                  title="طباعة التقرير"
                                  className="p-1.5 text-blue-900 hover:text-blue-950 hover:bg-blue-50 rounded"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف طلب الفحص رقم (${ord.orderNumber}) للمريض ${ord.patient.name} نهائياً؟`)) {
                                      handleDeleteOrder(ord.id);
                                    }
                                  }}
                                  title="حذف الطلب نهائياً"
                                  className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded"
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
            </div>
          )}

          {/* TAB: WORKLIST & RESULTS ENTRY */}
          {currentTab === 'worklist' && (
            <ResultsWorklistView
              orders={data.orders}
              testsCatalog={data.tests}
              onUpdateOrder={handleUpdateOrder}
              onOpenReport={(ord) => setReportOrderToPrint(ord)}
              selectedOrderId={selectedOrderForWorklist}
            />
          )}

          {/* TAB: SMART REPORTS & POWERPOINT */}
          {currentTab === 'smart_reports' && (
            <SmartReportsView
              orders={data.orders}
              profile={data.profile}
              onOpenPrintReport={(ord) => setReportOrderToPrint(ord)}
            />
          )}

          {/* TAB: REPORTS REPOSITORY */}
          {currentTab === 'reports' && (
            <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
              <div>
                <h1 className="text-base font-bold text-slate-900">
                  سجل التقارير الطبية المخبرية المعتمدة
                </h1>
                <p className="text-xs text-slate-500">
                  عرض وطباعة التقارير المعتمدة من أ.د. رامي مختار والمتوافقة مع معايير الجودة الدولية
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.orders.map((ord) => {
                  const isVerified = ord.tests.every((t) => t.status === 'verified');
                  const hasPanic = ord.tests.some((t) =>
                    t.results.some((r) => r.flag === 'panic_high' || r.flag === 'panic_low')
                  );

                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between hover:border-rose-400 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {ord.orderNumber}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">
                              {ord.patient.name}
                            </h3>
                          </div>
                          {hasPanic ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                              قيمة حرجة!
                            </span>
                          ) : isVerified ? (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                              معتمد نهائياً
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              قيد الفحص
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500">
                          {ord.patient.gender === 'male' ? 'ذكر' : 'أنثى'} · {ord.patient.age} {ord.patient.ageUnit} · هاتف: {ord.patient.phone}
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                          <span className="font-semibold text-rose-950 block">
                            الفحوصات: {ord.tests.map((t) => t.nameAr).join(' · ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            باركود: {ord.sampleBarcode} · التاريخ: {new Date(ord.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedOrderForWorklist(ord.id);
                            setCurrentTab('worklist');
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          تعديل النتائج
                        </button>
                        <button
                          onClick={() => setReportOrderToPrint(ord)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 rounded-lg shadow-2xs transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>معاينة وطباعة التقرير</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: DEVICE INTERFACING */}
          {currentTab === 'devices' && (
            <DeviceInterfacingView
              devices={data.devices}
              orders={data.orders}
              onAutoIngestResults={handleAutoIngestResults}
            />
          )}

          {/* TAB: PATIENTS DIRECTORY */}
          {currentTab === 'patients' && (
            <PatientsView
              patients={data.patients}
              orders={data.orders}
              onSelectPatientForOrder={() => setIsNewOrderOpen(true)}
              onOpenReport={(ord) => setReportOrderToPrint(ord)}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={handleDeletePatient}
            />
          )}

          {/* TAB: CATALOG & PACKAGES (FULL CRUD) */}
          {currentTab === 'catalog' && (
            <TestCatalogView
              testsCatalog={data.tests}
              packages={data.packages}
              onAddTest={handleAddTest}
              onUpdateTest={handleUpdateTest}
              onDeleteTest={handleDeleteTest}
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onDeletePackage={handleDeletePackage}
            />
          )}

          {/* TAB: FINANCIALS & EXPENSES */}
          {currentTab === 'financial' && (
            <FinancialView
              orders={data.orders}
              expenses={data.expenses}
              profile={data.profile}
              onUpdatePayment={handleUpdatePayment}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onUpdateProfile={handleUpdateProfile}
              onOpenLogoManager={() => setIsLogoManagerOpen(true)}
            />
          )}

          {/* TAB: HR STAFF MANAGEMENT */}
          {currentTab === 'hr' && (
            <HRView
              employees={data.employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {/* TAB: INVENTORY & REAGENTS (FULL CRUD) */}
          {currentTab === 'inventory' && (
            <InventoryView
              reagents={data.reagents}
              onUpdateStock={handleUpdateStock}
              onAddReagent={handleAddReagent}
              onUpdateReagent={handleUpdateReagent}
              onDeleteReagent={handleDeleteReagent}
            />
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Quick-Access Bar (phones & tablets) */}
      <nav className="lg:hidden sticky bottom-0 z-30 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around text-[10px] font-bold text-slate-600 select-none">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
            currentTab === 'dashboard' ? 'text-rose-950 font-black' : 'hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-rose-900' : 'text-slate-400'}`} />
          <span>الرئيسية</span>
        </button>

        <button
          onClick={() => setCurrentTab('bookings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors relative ${
            currentTab === 'bookings' ? 'text-rose-950 font-black' : 'hover:text-slate-900'
          }`}
        >
          <CalendarCheck className={`w-4 h-4 ${currentTab === 'bookings' ? 'text-rose-900' : 'text-slate-400'}`} />
          <span>الحجوزات</span>
          {pendingBookingsCount > 0 && (
            <span className="absolute -top-1 right-2 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {pendingBookingsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('orders')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
            currentTab === 'orders' ? 'text-rose-950 font-black' : 'hover:text-slate-900'
          }`}
        >
          <TestTube2 className={`w-4 h-4 ${currentTab === 'orders' ? 'text-rose-900' : 'text-slate-400'}`} />
          <span>العينات</span>
        </button>

        <button
          onClick={() => setCurrentTab('worklist')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors relative ${
            currentTab === 'worklist' ? 'text-rose-950 font-black' : 'hover:text-slate-900'
          }`}
        >
          <FileCheck2 className={`w-4 h-4 ${currentTab === 'worklist' ? 'text-rose-900' : 'text-slate-400'}`} />
          <span>النتائج</span>
          {pendingWorklistCount > 0 && (
            <span className="absolute -top-1 right-2 w-3.5 h-3.5 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {pendingWorklistCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsInstallModalOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors text-blue-950 font-bold"
        >
          <Cloud className="w-4 h-4 text-blue-800" />
          <span>المزامنة</span>
        </button>
      </nav>

      {/* MODALS */}
      {isNewOrderOpen && (
        <NewOrderModal
          patients={data.patients}
          testsCatalog={data.tests}
          packages={data.packages}
          onClose={() => setIsNewOrderOpen(false)}
          onSubmitOrder={handleAddNewOrder}
          onRegisterPatient={handleAddPatient}
        />
      )}

      {reportOrderToPrint && (
        <ReportPrintModal
          order={reportOrderToPrint}
          profile={data.profile}
          onClose={() => setReportOrderToPrint(null)}
        />
      )}

      {barcodeOrderToPrint && (
        <BarcodeModal
          order={barcodeOrderToPrint}
          testsCatalog={data.tests}
          onClose={() => setBarcodeOrderToPrint(null)}
          onMarkCollected={handleMarkCollected}
        />
      )}

      {isInstallModalOpen && (
        <InstallAppModal
          onClose={() => setIsInstallModalOpen(false)}
          onExportBackup={exportCompleteBackup}
          onImportBackup={handleImportBackup}
        />
      )}

      {/* Official RT Brand & Logo Customization Modal */}
      <LogoManagerModal
        isOpen={isLogoManagerOpen}
        onClose={() => setIsLogoManagerOpen(false)}
        profile={data.profile}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}
