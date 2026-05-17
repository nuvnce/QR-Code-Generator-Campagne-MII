// src/lib/pdfGenerator.js
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

// ─── Génération PDF Coupons Ménage ──────────────────────────────────────────
export async function generateCouponsPDF({ codes, district, vague, annee, logoBase64 }) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const W    = 210, H = 297;
  const COLS = 2, ROWS = 3;
  const mX   = 10, mY = 10;
  const cW   = (W - mX * 2) / COLS;
  const cH   = (H - mY * 2) / ROWS;
  const QR   = 45;

  let page = 0;

  for (let i = 0; i < codes.length; i++) {
    const col    = i % COLS;
    const rowPos = Math.floor(i / COLS) % ROWS;

    if (i > 0 && col === 0 && rowPos === 0) {
      doc.addPage();
      page++;
    }

    const x = mX + col * cW;
    const y = mY + rowPos * cH;

    // Cadre pointillés
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(x + 1, y + 1, cW - 2, cH - 2);
    doc.setLineDashPattern([], 0);

    // Logo PNLP
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', x + 3, y + 3, 18, 9, '', 'FAST'); } catch {}
    }

    // Label "CP"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(26, 58, 92);
    doc.text('CP', x + cW / 2, y + 10, { align: 'center' });

    // QR code
    const qrDataUrl = await QRCode.toDataURL(codes[i], { width: 200, margin: 1 });
    const qrX = x + (cW - QR) / 2;
    const qrY = y + 13;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, QR, QR);

    // Code texte
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(0);
    doc.text(codes[i], x + cW / 2, qrY + QR + 3, { align: 'center' });

    // Champs manuscrits
    const lineY1 = qrY + QR + 9;
    const lineY2 = lineY1 + 7;
    doc.setFontSize(7);
    doc.text('Nom du ménage :', x + 3, lineY1);
    doc.setDrawColor(180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(x + 30, lineY1 - 0.5, x + cW - 3, lineY1 - 0.5);
    doc.text('Numéro :', x + 3, lineY2);
    doc.line(x + 18, lineY2 - 0.5, x + cW - 3, lineY2 - 0.5);
    doc.setLineDashPattern([], 0);
  }

  const fileName = `coupons_${district}_V${vague}_${annee}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ─── Génération PDF MII ──────────────────────────────────────────────────────
export async function generateMIIPDF({ codes, region, district, segment, vague, annee, logoBase64 }) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const W    = 210, H = 297;
  const COLS = 3, ROWS = 4;
  const mX   = 8, mY = 8;
  const cW   = (W - mX * 2) / COLS;
  const cH   = (H - mY * 2) / ROWS;
  const QR   = 38;

  for (let i = 0; i < codes.length; i++) {
    const col    = i % COLS;
    const rowPos = Math.floor(i / COLS) % ROWS;

    if (i > 0 && col === 0 && rowPos === 0) doc.addPage();

    const x = mX + col * cW;
    const y = mY + rowPos * cH;

    // Cadre pointillés
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(x + 1, y + 1, cW - 2, cH - 2);
    doc.setLineDashPattern([], 0);

    // Logo
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', x + 2, y + 2, 14, 7, '', 'FAST'); } catch {}
    }

    // Label "MII"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text('MII', x + cW / 2, y + 9, { align: 'center' });

    // QR code
    const qrDataUrl = await QRCode.toDataURL(codes[i], { width: 180, margin: 1 });
    const qrX = x + (cW - QR) / 2;
    const qrY = y + 12;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, QR, QR);

    // Code texte
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(0);
    doc.text(codes[i], x + cW / 2, qrY + QR + 3, { align: 'center' });
  }

  const fileName = `mii_${segment}_V${vague}_${annee}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ─── Export Excel ────────────────────────────────────────────────────────────
export async function exportExcel(codes, meta) {
  // Import dynamique pour alléger le bundle initial
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Codes');

  ws.columns = [
    { header: 'Code',     key: 'code',    width: 45 },
    { header: 'Type',     key: 'type',    width: 10 },
    { header: 'Région',   key: 'region',  width: 20 },
    { header: 'District', key: 'district',width: 20 },
    { header: 'Année',    key: 'annee',   width: 8  },
    { header: 'Vague',    key: 'vague',   width: 8  },
    { header: 'Date',     key: 'date',    width: 15 },
  ];

  codes.forEach(code => ws.addRow({
    code,
    ...meta,
    date: new Date().toLocaleDateString('fr-FR'),
  }));

  // Style en-tête
  ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a5c' } };
  });

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${meta.type}_${meta.district || meta.region}_V${meta.vague}_${meta.annee}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
