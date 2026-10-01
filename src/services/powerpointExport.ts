import pptxgen from 'pptxgenjs';
import { LabOrder } from '../types/lab';
import { LabProfile } from './storage';

export const exportOrderToPowerPoint = (order: LabOrder, profile: LabProfile) => {
  const ppt = new pptxgen();

  // Define exact standard ISO A4 Portrait layout (8.27 x 11.69 inches / 210 x 297 mm)
  ppt.defineLayout({ name: 'A4_PORTRAIT', width: 8.27, height: 11.69 });
  ppt.layout = 'A4_PORTRAIT';

  // ----------------------------------------------------
  // Slide 1: Cover / Official Medical Header Page (A4)
  // ----------------------------------------------------
  const slide1 = ppt.addSlide();
  slide1.background = { color: '0F172A' }; // Deep Royal Navy

  // Lab Logo / Header Top
  slide1.addText(profile.nameAr, {
    x: 0.6,
    y: 1.2,
    w: 7.07,
    h: 0.8,
    fontSize: 26,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });

  slide1.addText(profile.nameEn, {
    x: 0.6,
    y: 2.0,
    w: 7.07,
    h: 0.5,
    fontSize: 14,
    color: '38BDF8',
    align: 'center',
  });

  slide1.addText('ISO 15189:2022 ACCREDITED MEDICAL LABORATORY', {
    x: 0.6,
    y: 2.5,
    w: 7.07,
    h: 0.4,
    fontSize: 10,
    bold: true,
    color: '94A3B8',
    align: 'center',
  });

  // Patient Banner Card
  slide1.addShape(ppt.ShapeType.rect, {
    x: 0.6,
    y: 3.4,
    w: 7.07,
    h: 3.2,
    fill: { color: '1E293B' },
    line: { color: '881337', width: 2 },
  });

  slide1.addText(`تقرير نتائج الفحوصات الطبية الإكلينيكية`, {
    x: 0.8,
    y: 3.7,
    w: 6.67,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: 'F1F5F9',
    align: 'center',
  });

  slide1.addText(`المريض: ${order.patient.name}`, {
    x: 0.8,
    y: 4.4,
    w: 6.67,
    h: 0.6,
    fontSize: 20,
    bold: true,
    color: '34D399',
    align: 'center',
  });

  slide1.addText(
    `السن: ${order.patient.age} ${order.patient.ageUnit}  |  النوع: ${order.patient.gender === 'male' ? 'ذكر' : 'أنثى'}  |  الرقم القومي: ${order.patient.nationalId}\nرقم الباركود: ${order.sampleBarcode}  |  رقم الطلب: ${order.orderNumber}`,
    {
      x: 0.8,
      y: 5.1,
      w: 6.67,
      h: 0.8,
      fontSize: 12,
      color: 'E2E8F0',
      align: 'center',
    }
  );

  slide1.addText(
    `الطبيب المعالج: ${order.referringDoctor || 'Prof dr'}\nتاريخ سحب العينة: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`,
    {
      x: 0.8,
      y: 5.9,
      w: 6.67,
      h: 0.6,
      fontSize: 11,
      color: '94A3B8',
      align: 'center',
    }
  );

  // Footer on cover
  slide1.addText(
    `إشراف: ${profile.directorName}\n${profile.address}\nهواتف: ${profile.phone} - ${profile.phone2}`,
    {
      x: 0.6,
      y: 9.8,
      w: 7.07,
      h: 1.0,
      fontSize: 11,
      color: '64748B',
      align: 'center',
    }
  );

  // ----------------------------------------------------
  // Slide 2: Results Table in standard A4 portrait
  // ----------------------------------------------------
  const slide2 = ppt.addSlide();
  slide2.background = { color: 'F8FAFC' };

  // Header Bar
  slide2.addText(`${profile.nameAr} - جدول النتائج المخبرية (A4 Format)`, {
    x: 0.5,
    y: 0.4,
    w: 7.27,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: '881337',
    align: 'right',
  });

  const tableHeader = [
    { text: 'الفحص (Investigation)', options: { bold: true, fill: { color: '881337' }, color: 'FFFFFF' } },
    { text: 'النتيجة', options: { bold: true, fill: { color: '881337' }, color: 'FFFFFF', align: 'center' } },
    { text: 'الحالة', options: { bold: true, fill: { color: '881337' }, color: 'FFFFFF', align: 'center' } },
    { text: 'الوحدة', options: { bold: true, fill: { color: '881337' }, color: 'FFFFFF', align: 'center' } },
    { text: 'المعدل الطبيعي (Ref)', options: { bold: true, fill: { color: '881337' }, color: 'FFFFFF' } },
  ];

  const resultRows: any[] = [tableHeader];

  order.tests.forEach((t) => {
    t.results.forEach((r) => {
      let flagText = 'طبيعي';
      let flagColor = '10B981';
      if (r.flag === 'panic_high' || r.flag === 'panic_low') {
        flagText = 'حرج (PANIC)';
        flagColor = 'EF4444';
      } else if (r.flag === 'high') {
        flagText = 'مرتفع ▲';
        flagColor = 'B91C1C';
      } else if (r.flag === 'low') {
        flagText = 'منخفض ▼';
        flagColor = '0369A1';
      }

      resultRows.push([
        { text: `${r.nameAr}\n${r.nameEn}` },
        { text: r.value, options: { bold: true, align: 'center' } },
        { text: flagText, options: { bold: true, color: flagColor, align: 'center' } },
        { text: r.unit, options: { align: 'center' } },
        { text: r.refText },
      ]);
    });
  });

  slide2.addTable(resultRows.slice(0, 16), {
    x: 0.5,
    y: 1.0,
    w: 7.27,
    colW: [2.5, 1.1, 1.1, 0.9, 1.67],
    fontSize: 9,
    color: '0F172A',
    border: { pt: 0.5, color: 'CBD5E1' },
    align: 'right',
  });

  // Signatures on Slide 2 bottom
  slide2.addText(
    `LAB CHEMIST: ${order.labChemist || profile.availableChemists[0]}   |   VERIFIED BY: ${order.verifiedBy || profile.availableVerifiers[0]}   |   PATHOLOGIST: ${order.pathologist || profile.availablePathologists[0]}`,
    {
      x: 0.5,
      y: 10.7,
      w: 7.27,
      h: 0.5,
      fontSize: 8.5,
      bold: true,
      color: '475569',
      align: 'center',
    }
  );

  // ----------------------------------------------------
  // Slide 3: Diagnostic Insights & Recommendations
  // ----------------------------------------------------
  const slide3 = ppt.addSlide();
  slide3.background = { color: '0F172A' };

  slide3.addText('التفسير التشخيصي الإكلينيكي الذكي', {
    x: 0.5,
    y: 0.8,
    w: 7.27,
    h: 0.6,
    fontSize: 20,
    bold: true,
    color: '38BDF8',
    align: 'right',
  });

  const allComments = order.tests
    .map((t) => (t.interpretation ? `• [${t.nameAr} - ${t.nameEn}]:\n  ${t.interpretation}` : ''))
    .filter(Boolean)
    .join('\n\n');

  slide3.addText(
    allComments ||
      '• كافة المؤشرات الحيوية المفحوصة تقع ضمن النطاق الفسيولوجي المعتمد.\n• يرجى مراجعة الطبيب المعالج للمتابعة السريرية الدورية وفق المعايير الطبية.',
    {
      x: 0.5,
      y: 1.6,
      w: 7.27,
      h: 7.5,
      fontSize: 13,
      color: 'F1F5F9',
      fill: { color: '1E293B' },
      margin: 14,
      align: 'right',
      lineSpacing: 22,
    }
  );

  slide3.addText(
    `معتمد رسمياً من معامل RT - شبرا الخيمة\nالعنوان: ${profile.address}\nهاتف: ${profile.phone} - ${profile.phone2}`,
    {
      x: 0.5,
      y: 9.8,
      w: 7.27,
      h: 1.0,
      fontSize: 11,
      color: '94A3B8',
      align: 'center',
    }
  );

  // Trigger download
  const fileName = `RT_Lab_Report_A4_${order.orderNumber}_${order.patient.name.replace(/\s+/g, '_')}.pptx`;
  ppt.writeFile({ fileName });
};
