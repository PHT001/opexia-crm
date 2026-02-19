import { jsPDF } from 'jspdf';
import { DocumentLigne, Client, Devis, Invoice } from './types';

const COMPANY = {
  name: 'OpexIA',
  tagline: 'Agence d\'automatisation IA',
  email: 'contact@opexia.fr',
  site: 'https://opexia.fr',
};

const COLORS = {
  primary: [124, 58, 237] as [number, number, number],      // #7c3aed
  dark: [26, 22, 37] as [number, number, number],           // #1a1625
  muted: [148, 144, 166] as [number, number, number],       // #9490a6
  border: [232, 229, 240] as [number, number, number],      // #e8e5f0
  bg: [248, 247, 252] as [number, number, number],          // #f8f7fc
  white: [255, 255, 255] as [number, number, number],
};

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC';
}

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function calcLigneTotal(l: DocumentLigne): number {
  return l.quantite * l.prixUnitaire;
}

function calcTotalHT(lignes: DocumentLigne[]): number {
  return lignes.reduce((s, l) => s + calcLigneTotal(l), 0);
}

function calcTotalTVA(lignes: DocumentLigne[]): number {
  return lignes.reduce((s, l) => s + calcLigneTotal(l) * (l.tva / 100), 0);
}

export function generatePDF(
  type: 'devis' | 'facture',
  doc: Devis | Invoice,
  client: Client,
  lignes: DocumentLigne[]
): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const marginL = 20;
  const marginR = 20;
  const contentW = W - marginL - marginR;
  let y = 20;

  // ===== HEADER =====
  // Company name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...COLORS.primary);
  pdf.text(COMPANY.name, marginL, y);

  // Document type badge
  const label = type === 'devis' ? 'DEVIS' : 'FACTURE';
  pdf.setFontSize(12);
  pdf.setTextColor(...COLORS.white);
  const badgeW = pdf.getTextWidth(label) + 12;
  pdf.setFillColor(...COLORS.primary);
  pdf.roundedRect(W - marginR - badgeW, y - 8, badgeW, 12, 2, 2, 'F');
  pdf.text(label, W - marginR - badgeW + 6, y);

  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(COMPANY.tagline, marginL, y);

  y += 5;
  pdf.text(`${COMPANY.email} | ${COMPANY.site}`, marginL, y);

  // Separator
  y += 8;
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, y, W - marginR, y);

  // ===== DOCUMENT INFO + CLIENT =====
  y += 10;

  // Left: Document info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.dark);
  const numero = 'numero' in doc ? doc.numero : '';
  pdf.text(`N\u00B0 ${numero}`, marginL, y);

  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);

  if (type === 'devis') {
    const devis = doc as Devis;
    pdf.text(`Date : ${formatDate(devis.dateCreation)}`, marginL, y);
    y += 5;
    pdf.text(`Valide jusqu'au : ${formatDate(devis.dateValidite)}`, marginL, y);
  } else {
    const inv = doc as Invoice;
    pdf.text(`Date d'\u00E9mission : ${formatDate(inv.dateEmission)}`, marginL, y);
    y += 5;
    pdf.text(`Date d'\u00E9ch\u00E9ance : ${formatDate(inv.dateEcheance)}`, marginL, y);
  }

  // Right: Client info
  const clientX = W / 2 + 10;
  let clientY = y - 11;
  pdf.setFillColor(...COLORS.bg);
  pdf.roundedRect(clientX - 5, clientY - 5, contentW / 2 + 5, 35, 3, 3, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.primary);
  pdf.text('CLIENT', clientX, clientY);
  clientY += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.dark);
  pdf.text(client.entreprise, clientX, clientY);
  clientY += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  if (client.prenom || client.nom) {
    pdf.text(`${client.prenom} ${client.nom}`.trim(), clientX, clientY);
    clientY += 4;
  }
  if (client.email) {
    pdf.text(client.email, clientX, clientY);
    clientY += 4;
  }
  if (client.telephone) {
    pdf.text(client.telephone, clientX, clientY);
  }

  // ===== TABLE =====
  y += 15;

  // Table header
  const cols = [
    { label: 'Description', x: marginL, w: contentW * 0.45 },
    { label: 'Qt\u00E9', x: marginL + contentW * 0.45, w: contentW * 0.1 },
    { label: 'Prix unit. HT', x: marginL + contentW * 0.55, w: contentW * 0.2 },
    { label: 'Montant HT', x: marginL + contentW * 0.75, w: contentW * 0.25 },
  ];

  pdf.setFillColor(...COLORS.primary);
  pdf.roundedRect(marginL, y - 4, contentW, 10, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.white);

  cols.forEach(col => {
    const align = col.label === 'Description' ? 'left' : 'right';
    if (align === 'right') {
      pdf.text(col.label, col.x + col.w - 2, y + 2, { align: 'right' });
    } else {
      pdf.text(col.label, col.x + 3, y + 2);
    }
  });

  y += 10;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  lignes.forEach((ligne, i) => {
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    // Alternate row bg
    if (i % 2 === 0) {
      pdf.setFillColor(...COLORS.bg);
      pdf.rect(marginL, y - 4, contentW, 9, 'F');
    }

    const total = calcLigneTotal(ligne);

    pdf.setTextColor(...COLORS.dark);
    // Description - split long text
    const descLines = pdf.splitTextToSize(ligne.description, cols[0].w - 6);
    pdf.text(descLines[0], cols[0].x + 3, y + 2);

    pdf.setTextColor(...COLORS.muted);
    pdf.text(String(ligne.quantite), cols[1].x + cols[1].w - 2, y + 2, { align: 'right' });
    pdf.text(formatCurrency(ligne.prixUnitaire), cols[2].x + cols[2].w - 2, y + 2, { align: 'right' });

    pdf.setTextColor(...COLORS.dark);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(total), cols[3].x + cols[3].w - 2, y + 2, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    y += 9;

    // Extra lines for long descriptions
    if (descLines.length > 1) {
      for (let j = 1; j < descLines.length; j++) {
        pdf.setTextColor(...COLORS.muted);
        pdf.setFontSize(8);
        pdf.text(descLines[j], cols[0].x + 3, y);
        y += 5;
      }
      pdf.setFontSize(9);
    }
  });

  // ===== TOTALS =====
  y += 5;
  pdf.setDrawColor(...COLORS.border);
  pdf.line(W / 2, y, W - marginR, y);
  y += 8;

  const totalHT = calcTotalHT(lignes);
  const totalTVA = calcTotalTVA(lignes);
  const totalTTC = totalHT + totalTVA;
  const totalsX = W / 2 + 10;
  const totalsValX = W - marginR;

  // Sous-total HT
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.text('Sous-total HT', totalsX, y);
  pdf.setTextColor(...COLORS.dark);
  pdf.text(formatCurrency(totalHT), totalsValX, y, { align: 'right' });

  y += 6;
  // TVA
  pdf.setTextColor(...COLORS.muted);
  pdf.text('TVA (20%)', totalsX, y);
  pdf.setTextColor(...COLORS.dark);
  pdf.text(formatCurrency(totalTVA), totalsValX, y, { align: 'right' });

  y += 8;
  // Total TTC
  pdf.setFillColor(...COLORS.primary);
  pdf.roundedRect(totalsX - 5, y - 5, W - marginR - totalsX + 10, 14, 3, 3, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.white);
  pdf.text('TOTAL TTC', totalsX, y + 4);
  pdf.text(formatCurrency(totalTTC), totalsValX, y + 4, { align: 'right' });

  // ===== NOTES =====
  y += 20;
  const notes = type === 'devis' ? (doc as Devis).notes : (doc as Invoice).description;
  if (notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.dark);
    pdf.text('Notes', marginL, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    const noteLines = pdf.splitTextToSize(notes, contentW);
    pdf.text(noteLines, marginL, y);
    y += noteLines.length * 4 + 5;
  }

  // ===== CONDITIONS =====
  if (type === 'devis') {
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('Ce devis est valable pour une dur\u00E9e de 30 jours \u00E0 compter de la date d\'\u00E9mission.', marginL, y);
    y += 4;
    pdf.text('Signature pr\u00E9c\u00E9d\u00E9e de la mention "Bon pour accord" :', marginL, y);
  } else {
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('Conditions de paiement : paiement \u00E0 r\u00E9ception de la facture.', marginL, y);
    y += 4;
    pdf.text('En cas de retard de paiement, des p\u00E9nalit\u00E9s de retard seront appliqu\u00E9es.', marginL, y);
  }

  // ===== FOOTER =====
  const footerY = 285;
  pdf.setDrawColor(...COLORS.border);
  pdf.line(marginL, footerY - 5, W - marginR, footerY - 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`${COMPANY.name} - ${COMPANY.tagline} | ${COMPANY.email}`, W / 2, footerY, { align: 'center' });

  // Download
  const filename = `${type === 'devis' ? 'Devis' : 'Facture'}_${numero}.pdf`;
  pdf.save(filename);
}
