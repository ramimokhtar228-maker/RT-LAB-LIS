import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import pptxgen from 'pptxgenjs';
import { PatientEncounter, LabSettings, TestCatalogItem } from '../types/lab';
import { getFlagDisplayInfo } from './calculations';

/**
 * Direct PDF Export from report element
 */
export async function exportReportToPdf(elementId: string, encounter: PatientEncounter): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Report element not found');
  }

  // Create canvas from DOM element
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Add subsequent pages if report exceeds A4 height
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  const safeName = (encounter.patient.name || 'Patient').replace(/[\s/\\?%*:|"<>]/g, '_');
  pdf.save(`RT-Lab-Report-${encounter.patient.mrn}-${safeName}.pdf`);
}

/**
 * Direct PowerPoint (.pptx) Presentation Export for Clinical Case Presentations & Meetings
 */
export async function exportReportToPptx(
  encounter: PatientEncounter,
  settings: LabSettings,
  catalogMap: Map<string, TestCatalogItem>
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'RT Diagnostic Laboratories - Dr. Rami Mokhtar';
  pptx.title = `Clinical Laboratory Case Presentation - ${encounter.patient.name}`;

  const primaryRed = '881337'; // RT Lab Dark Crimson
  const darkNavy = '0F172A';
  const lightBg = 'F8FAFC';
  const accentRed = '991B1B';

  // ================= SLIDE 1: Title & Patient Encounter =================
  const slide1 = pptx.addSlide();
  slide1.background = { color: darkNavy };

  // Decorative top bar
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.25,
    fill: { color: primaryRed },
  });

  slide1.addText('RT DIAGNOSTIC LABORATORIES', {
    x: 0.8,
    y: 0.8,
    w: 8.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: 'FDA4AF',
    fontFace: 'Arial',
  });

  slide1.addText('Clinical Laboratory Investigation & Pathological Case Report', {
    x: 0.8,
    y: 1.3,
    w: 11,
    h: 0.8,
    fontSize: 26,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  slide1.addText(`معامل RT للتحاليل التشخيصية • ${settings.labSubtitleAr}`, {
    x: 0.8,
    y: 2.2,
    w: 11,
    h: 0.5,
    fontSize: 14,
    color: 'CBD5E1',
    fontFace: 'Arial',
  });

  // Patient Info Card on Slide 1
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 3.0,
    w: 11.5,
    h: 3.5,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.2,
  });

  const patientDetails = [
    [
      { text: 'Patient Name:', options: { bold: true, color: '94A3B8' } },
      { text: encounter.patient.name, options: { bold: true, color: 'FFFFFF' } },
      { text: 'MRN / Sample ID:', options: { bold: true, color: '94A3B8' } },
      { text: encounter.patient.mrn, options: { bold: true, color: 'F43F5E' } },
    ],
    [
      { text: 'Age & Gender:', options: { bold: true, color: '94A3B8' } },
      { text: `${encounter.patient.ageYears} Yrs / ${encounter.patient.gender}`, options: { color: 'FFFFFF' } },
      { text: 'National ID:', options: { bold: true, color: '94A3B8' } },
      { text: encounter.patient.nationalId || 'N/A', options: { color: 'FFFFFF' } },
    ],
    [
      { text: 'Referring Doctor:', options: { bold: true, color: '94A3B8' } },
      { text: encounter.patient.referringDoctor || 'Self / Walk-in', options: { color: 'FFFFFF' } },
      { text: 'Specimen Type:', options: { bold: true, color: '94A3B8' } },
      { text: encounter.patient.sampleType, options: { color: 'FFFFFF' } },
    ],
    [
      { text: 'Sample Drawn:', options: { bold: true, color: '94A3B8' } },
      { text: `${encounter.patient.sampleDate} ${encounter.patient.sampleTime}`, options: { color: 'FFFFFF' } },
      { text: 'Report Date:', options: { bold: true, color: '94A3B8' } },
      { text: `${encounter.patient.reportDate} ${encounter.patient.reportTime}`, options: { color: 'FFFFFF' } },
    ],
    [
      { text: 'Clinical Notes:', options: { bold: true, color: '94A3B8' } },
      { text: encounter.patient.clinicalNotes || 'Routine Diagnostic Investigation', options: { color: 'E2E8F0' } },
      { text: 'Consultant:', options: { bold: true, color: '94A3B8' } },
      { text: settings.pathologistName, options: { bold: true, color: 'FDA4AF' } },
    ],
  ];

  slide1.addTable(patientDetails, {
    x: 1.1,
    y: 3.2,
    w: 10.9,
    h: 3.1,
    fontSize: 12,
    fontFace: 'Arial',
    colW: [2.0, 3.5, 2.0, 3.4],
  });

  // ================= SLIDE 2: Abnormal Findings & Executive Summary =================
  const slide2 = pptx.addSlide();
  slide2.background = { color: lightBg };

  slide2.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.9,
    fill: { color: primaryRed },
  });

  slide2.addText('EXECUTIVE SUMMARY & ABNORMAL CLINICAL FINDINGS', {
    x: 0.8,
    y: 0.2,
    w: 11,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  const abnormalList = Object.values(encounter.results).filter(
    (r) => r.flag && r.flag !== 'NORMAL'
  );

  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.2,
    w: 5.6,
    h: 5.5,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.15,
  });

  slide2.addText(`Abnormal Flagged Tests (${abnormalList.length} Found)`, {
    x: 1.1,
    y: 1.4,
    w: 5.0,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: primaryRed,
  });

  if (abnormalList.length === 0) {
    slide2.addText('✓ All investigated laboratory parameters are strictly within normal reference intervals.', {
      x: 1.1,
      y: 2.2,
      w: 5.0,
      h: 1.5,
      fontSize: 12,
      color: '059669',
      bold: true,
    });
  } else {
    const abnormalRows = [
      [
        { text: 'Test Name', options: { bold: true, fill: { color: 'F1F5F9' }, color: '334155' } },
        { text: 'Result', options: { bold: true, fill: { color: 'F1F5F9' }, color: '334155' } },
        { text: 'Flag', options: { bold: true, fill: { color: 'F1F5F9' }, color: '334155' } },
      ],
      ...abnormalList.slice(0, 10).map((r) => [
        { text: `${r.name} (${r.code})`, options: { color: '1E293B', fontSize: 10 } },
        { text: `${r.value} ${r.unit}`, options: { bold: true, color: '881337', fontSize: 10 } },
        {
          text: r.flag,
          options: {
            bold: true,
            color: r.flag.includes('PANIC') ? 'BE123C' : r.flag === 'HIGH' ? 'B45309' : '1D4ED8',
            fontSize: 10,
          },
        },
      ]),
    ];

    slide2.addTable(abnormalRows, {
      x: 1.0,
      y: 1.9,
      w: 5.2,
      fontSize: 10,
      colW: [2.8, 1.4, 1.0],
    });
  }

  // Right card: Pathological Summary
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 6.7,
    y: 1.2,
    w: 5.8,
    h: 5.5,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.15,
  });

  slide2.addText('Consultant Pathologist Correlation', {
    x: 7.0,
    y: 1.4,
    w: 5.2,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: darkNavy,
  });

  const summaryText =
    encounter.clinicalInterpretation?.summary ||
    'Routine comprehensive laboratory diagnostic testing completed under strict quality-controlled protocols.';

  slide2.addText(summaryText, {
    x: 7.0,
    y: 2.0,
    w: 5.2,
    h: 2.0,
    fontSize: 12,
    color: '334155',
    lineSpacing: 18,
  });

  if (encounter.clinicalInterpretation?.differentialConsiderations?.length) {
    slide2.addText('Differential Considerations:', {
      x: 7.0,
      y: 4.2,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: primaryRed,
    });
    slide2.addText(encounter.clinicalInterpretation.differentialConsiderations.join('\n• '), {
      x: 7.0,
      y: 4.6,
      w: 5.2,
      h: 1.8,
      fontSize: 11,
      color: '475569',
    });
  }

  // ================= SLIDES 3+: Itemized Test Tables =================
  // Group tests by category
  const categoriesMap = new Map<string, string[]>();
  encounter.selectedTestCodes.forEach((c) => {
    const item = catalogMap.get(c);
    const cat = item?.category || 'General Investigations';
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
    categoriesMap.get(cat)!.push(c);
  });

  for (const [catName, codes] of categoriesMap.entries()) {
    // Break into pages of max 8 rows per slide
    const chunkSize = 8;
    for (let i = 0; i < codes.length; i += chunkSize) {
      const chunk = codes.slice(i, i + chunkSize);
      const testSlide = pptx.addSlide();
      testSlide.background = { color: lightBg };

      testSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.8,
        fill: { color: primaryRed },
      });

      testSlide.addText(`${catName.toUpperCase()} - TEST RESULTS (Page ${Math.floor(i / chunkSize) + 1})`, {
        x: 0.8,
        y: 0.15,
        w: 11,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: 'FFFFFF',
      });

      const tableRows: any[][] = [
        [
          { text: 'TEST NAME', options: { bold: true, fill: { color: darkNavy }, color: 'FFFFFF' } },
          { text: 'RESULT', options: { bold: true, fill: { color: darkNavy }, color: 'FFFFFF', align: 'center' } },
          { text: 'FLAG', options: { bold: true, fill: { color: darkNavy }, color: 'FFFFFF', align: 'center' } },
          { text: 'UNIT', options: { bold: true, fill: { color: darkNavy }, color: 'FFFFFF' } },
          { text: 'REFERENCE RANGE', options: { bold: true, fill: { color: darkNavy }, color: 'FFFFFF' } },
          { text: 'METHOD', options: { bold: true, fill: { color: darkNavy }, color: 'FFFFFF' } },
        ],
      ];

      chunk.forEach((code) => {
        const def = catalogMap.get(code);
        const res = encounter.results[code];
        const val = res?.value || 'Pending';
        const flag = res?.flag || 'NORMAL';
        const flagColor = flag.includes('PANIC') ? 'BE123C' : flag === 'HIGH' ? 'B45309' : flag === 'LOW' ? '1D4ED8' : '059669';

        tableRows.push([
          { text: `${def?.name || code}`, options: { bold: true, color: '1E293B', fontSize: 10 } },
          { text: val, options: { bold: true, color: flagColor, align: 'center', fontSize: 11 } },
          { text: flag, options: { bold: true, color: flagColor, align: 'center', fontSize: 10 } },
          { text: def?.unit || '-', options: { color: '64748B', fontSize: 10 } },
          { text: res?.refRangeText || 'Normal', options: { color: '475569', fontSize: 10 } },
          { text: def?.method || 'Automated', options: { color: '94A3B8', fontSize: 9 } },
        ]);
      });

      testSlide.addTable(tableRows, {
        x: 0.8,
        y: 1.1,
        w: 11.6,
        fontSize: 10,
        colW: [3.4, 1.4, 1.2, 1.2, 2.4, 2.0],
      });
    }
  }

  // ================= FINAL SLIDE: Signatures & Contact =================
  const finalSlide = pptx.addSlide();
  finalSlide.background = { color: darkNavy };

  finalSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.25,
    fill: { color: primaryRed },
  });

  finalSlide.addText('RT DIAGNOSTIC LABORATORIES • VERIFICATION', {
    x: 0.8,
    y: 0.8,
    w: 11,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: 'FFFFFF',
  });

  finalSlide.addText('All clinical laboratory analyses verified under international ISO 15189 reference guidelines.', {
    x: 0.8,
    y: 1.4,
    w: 11,
    h: 0.4,
    fontSize: 13,
    color: '94A3B8',
  });

  // Chemist & Pathologist Cards
  finalSlide.addShape(pptx.ShapeType.roundRect, {
    x: 1.5,
    y: 2.4,
    w: 4.8,
    h: 3.2,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.2,
  });

  finalSlide.addText('Medical Biochemist / الكيميائي', {
    x: 1.8,
    y: 2.7,
    w: 4.2,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: '94A3B8',
  });
  finalSlide.addText(settings.chemistName, {
    x: 1.8,
    y: 3.3,
    w: 4.2,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: 'FFFFFF',
  });
  finalSlide.addText(settings.chemistTitle, {
    x: 1.8,
    y: 3.8,
    w: 4.2,
    h: 0.6,
    fontSize: 11,
    color: 'CBD5E1',
  });

  finalSlide.addShape(pptx.ShapeType.roundRect, {
    x: 6.9,
    y: 2.4,
    w: 4.8,
    h: 3.2,
    fill: { color: '1E293B' },
    line: { color: 'F43F5E', width: 1.5 },
    rectRadius: 0.2,
  });

  finalSlide.addText('Consultant Pathologist / طبيب الباثولوجيا', {
    x: 7.2,
    y: 2.7,
    w: 4.2,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: 'FDA4AF',
  });
  finalSlide.addText(settings.pathologistName, {
    x: 7.2,
    y: 3.3,
    w: 4.2,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
  });
  finalSlide.addText(settings.pathologistTitle, {
    x: 7.2,
    y: 3.8,
    w: 4.2,
    h: 0.6,
    fontSize: 11,
    color: 'CBD5E1',
  });

  finalSlide.addText(`${settings.addressAr} • Hotline: ${settings.phone1} • ${settings.website}`, {
    x: 0.8,
    y: 6.2,
    w: 11.5,
    h: 0.4,
    fontSize: 11,
    color: '64748B',
    align: 'center',
  });

  const safeName = (encounter.patient.name || 'Patient').replace(/[\s/\\?%*:|"<>]/g, '_');
  await pptx.writeFile({ fileName: `RT-Lab-Presentation-${encounter.patient.mrn}-${safeName}.pptx` });
}
