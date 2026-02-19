import { jsPDF } from 'jspdf';
import { DocumentLigne, Client, Devis, Invoice } from './types';

// ===== COMPANY INFO =====
const COMPANY = {
  name: 'OpexIA Agency',
  contact: 'Marius AUGEREAU',
  address: '34 Rue Mauconseil',
  city: '94120 Fontenay-sous-Bois',
  country: 'France',
  email: 'contact@opexia.fr',
  site: 'https://opexia.fr',
};

// ===== COLORS =====
type RGB = [number, number, number];
const COLORS = {
  primary: [110, 87, 224] as RGB,       // #6e57e0 — violet like Facture.net
  primaryLight: [140, 120, 240] as RGB,  // lighter for decorations
  dark: [51, 51, 51] as RGB,             // #333
  text: [68, 68, 68] as RGB,             // #444
  muted: [136, 136, 136] as RGB,         // #888
  label: [119, 119, 119] as RGB,         // #777
  border: [220, 220, 220] as RGB,        // #dcdcdc
  borderLight: [235, 235, 235] as RGB,   // #ebebeb
  bg: [248, 248, 252] as RGB,            // #f8f8fc
  white: [255, 255, 255] as RGB,
  tableHeader: [110, 87, 224] as RGB,    // same as primary
  tableHeaderText: [255, 255, 255] as RGB,
};

// ===== PRESET DETAILS MAP (for rich descriptions in PDF) =====
interface PresetInfo {
  description: string;
  details: string[];
  pricingNote?: string;
}

const PRESET_MAP: Record<string, PresetInfo> = {
  'Site Web Vitrine + Chatbot IA': {
    description: "Cr\u00e9ation d'un site web vitrine professionnel avec chatbot IA int\u00e9gr\u00e9 :",
    details: [
      'Design responsive adapt\u00e9 \u00e0 votre image',
      'Chatbot intelligent int\u00e9gr\u00e9 pour prise de commande en ligne',
      'Suivi de commande en temps r\u00e9el',
      'Suggestions personnalis\u00e9es selon la carte',
      'R\u00e9ponses aux questions fr\u00e9quentes (horaires, adresse, allerg\u00e8nes)',
      'Mises \u00e0 jour et am\u00e9liorations continues',
    ],
    pricingNote: 'Mise en place (paiement unique)\nMaintenance mensuelle : 20\u20ac HT/mois',
  },
  'Maintenance Site Web': {
    description: 'Maintenance et h\u00e9bergement du site web vitrine :',
    details: [
      'H\u00e9bergement et nom de domaine inclus',
      'Mises \u00e0 jour de s\u00e9curit\u00e9',
      'Support technique',
      'Sauvegardes r\u00e9guli\u00e8res',
    ],
    pricingNote: 'Tarif : 20\u20ac HT/mois',
  },
  'Chatbot IA': {
    description: 'Chatbot intelligent int\u00e9grable sur site web ou en standalone :',
    details: [
      'Prise de commande automatis\u00e9e par conversation',
      'Suivi de commande en temps r\u00e9el',
      'Suggestions personnalis\u00e9es selon la carte',
      'R\u00e9ponses aux questions fr\u00e9quentes (horaires, adresse, allerg\u00e8nes)',
      'Mises \u00e0 jour et am\u00e9liorations continues',
    ],
    pricingNote: 'Tarif : 90\u20ac HT/mois',
  },
  'R\u00e9ceptionniste IA Vocale': {
    description: 'Standard t\u00e9l\u00e9phonique intelligent propuls\u00e9 par IA :',
    details: [
      'Accueil t\u00e9l\u00e9phonique automatis\u00e9 24h/24',
      'Prise de commande vocale compl\u00e8te',
      'V\u00e9rification des stocks en temps r\u00e9el',
      'Envoi automatique de SMS de confirmation au client',
      'Gestion des horaires et informations restaurant',
    ],
    pricingNote: '1er mois : p\u00e9riode de test \u2014 facturation \u00e0 l\'usage (selon le nombre d\'appels trait\u00e9s)\n\u00c0 partir du 2\u00e8me mois : 140\u20ac HT/mois (forfait illimit\u00e9)',
  },
  'Programme de Fid\u00e9lit\u00e9': {
    description: 'Syst\u00e8me de fid\u00e9lisation client int\u00e9gr\u00e9 au CRM :',
    details: [
      'Attribution automatique de points \u00e0 chaque commande',
      'Catalogue de r\u00e9compenses personnalisable',
      'Suivi des points et historique client',
      'Tableau de bord statistiques fid\u00e9lit\u00e9',
      'Notifications automatiques (seuils de r\u00e9compense atteints)',
    ],
    pricingNote: 'Tarif : 80\u20ac HT/mois',
  },
  'Automatisation sur mesure': {
    description: 'Solution d\'automatisation personnalis\u00e9e selon vos besoins :',
    details: [
      'Analyse de vos processus existants',
      'D\u00e9veloppement de workflows automatis\u00e9s',
      'Int\u00e9gration avec vos outils existants',
      'Formation et documentation',
    ],
  },
};

// ===== HELPERS =====
function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
}

function fmtDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcTotal(l: DocumentLigne): number {
  return l.quantite * l.prixUnitaire;
}

function calcTotalHT(lignes: DocumentLigne[]): number {
  return lignes.reduce((s, l) => s + calcTotal(l), 0);
}

function calcTotalTVA(lignes: DocumentLigne[]): number {
  return lignes.reduce((s, l) => s + calcTotal(l) * (l.tva / 100), 0);
}

// ===== DECORATIVE WAVE (top-right corner like Facture.net) =====
function drawWaves(pdf: jsPDF) {
  const W = 210;
  // Draw several bezier-like curves in the top-right corner
  pdf.setDrawColor(...COLORS.primaryLight);
  pdf.setLineWidth(0.4);

  // Wave 1
  for (let i = 0; i < 5; i++) {
    const offsetY = i * 6;
    const opacity = 0.15 + i * 0.05;
    pdf.setDrawColor(
      Math.round(COLORS.primaryLight[0] + (255 - COLORS.primaryLight[0]) * (1 - opacity)),
      Math.round(COLORS.primaryLight[1] + (255 - COLORS.primaryLight[1]) * (1 - opacity)),
      Math.round(COLORS.primaryLight[2] + (255 - COLORS.primaryLight[2]) * (1 - opacity))
    );
    pdf.setLineWidth(0.6);
    // Simple sine-like wave using line segments
    const startX = W * 0.55;
    const endX = W + 5;
    const baseY = -5 + offsetY;
    const segments = 30;
    for (let s = 0; s < segments; s++) {
      const x1 = startX + (endX - startX) * (s / segments);
      const x2 = startX + (endX - startX) * ((s + 1) / segments);
      const y1 = baseY + Math.sin((s / segments) * Math.PI * 2.5) * 8;
      const y2 = baseY + Math.sin(((s + 1) / segments) * Math.PI * 2.5) * 8;
      pdf.line(x1, y1, x2, y2);
    }
  }
}

// ===== MAIN GENERATE PDF =====
export function generatePDF(
  type: 'devis' | 'facture',
  doc: Devis | Invoice,
  client: Client,
  lignes: DocumentLigne[]
): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const H = 297;
  const marginL = 18;
  const marginR = 18;
  const contentW = W - marginL - marginR;
  const numero = 'numero' in doc ? doc.numero : '';
  let y = 0;
  let pageNum = 1;
  let totalPages = 1; // We'll estimate

  // ===== HELPER: Draw footer on current page =====
  function drawFooter(currentPage: number) {
    // Document number bottom-left
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(`${type === 'devis' ? 'Devis' : 'Facture'} ${numero}`, marginL, H - 10);
    // Page number bottom-right
    pdf.text(`Page ${currentPage} sur ${totalPages}`, W - marginR, H - 10, { align: 'right' });
  }

  // ===== HELPER: New page with waves + footer =====
  function newPage() {
    if (pageNum > 1) {
      pdf.addPage();
    }
    drawWaves(pdf);
    y = 25;
    pageNum++;
  }

  // ===== HELPER: Check if need new page =====
  function checkPage(needed: number) {
    if (y + needed > H - 25) {
      drawFooter(pageNum);
      newPage();
    }
  }

  // ===== PAGE 1 =====
  newPage();

  // ===== HEADER: Title + Date =====
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(...COLORS.primary);
  const titleLabel = type === 'devis' ? 'Devis' : 'Facture';
  pdf.text(`${titleLabel} ${numero}`, marginL, y);

  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.text);
  if (type === 'devis') {
    pdf.text(fmtDate((doc as Devis).dateCreation), marginL, y);
  } else {
    pdf.text(fmtDate((doc as Invoice).dateEmission), marginL, y);
  }

  // ===== EMETTEUR / DESTINATAIRE =====
  y += 15;
  const halfW = contentW / 2 - 5;
  const rightColX = marginL + halfW + 10;

  // Émetteur header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(...COLORS.primary);
  pdf.text('\u00c9metteur', marginL, y);

  // Destinataire header
  pdf.text('Destinataire', rightColX, y);

  y += 8;

  // Émetteur details
  const emetteurFields = [
    { label: 'Soci\u00e9t\u00e9 :', value: COMPANY.name },
    { label: 'Votre contact :', value: COMPANY.contact },
    { label: 'Adresse :', value: `${COMPANY.address}\n${COMPANY.city}` },
    { label: 'Pays :', value: COMPANY.country },
  ];

  // Destinataire details
  const clientAddress = client.adresse || '';
  const destFields = [
    { label: 'Soci\u00e9t\u00e9 :', value: client.entreprise },
    ...(clientAddress ? [{ label: 'Adresse :', value: clientAddress }] : []),
    { label: 'Pays :', value: 'France' },
  ];

  const labelW = 28;
  let leftY = y;
  let rightY = y;

  // Draw Émetteur fields
  emetteurFields.forEach(field => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.label);
    pdf.text(field.label, marginL, leftY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.dark);
    const lines = field.value.split('\n');
    lines.forEach((line, i) => {
      pdf.text(line, marginL + labelW, leftY + i * 4);
    });
    leftY += 4 * Math.max(lines.length, 1) + 2;
  });

  // Draw Destinataire fields
  destFields.forEach(field => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.label);
    pdf.text(field.label, rightColX, rightY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.dark);
    const lines = field.value.split('\n');
    lines.forEach((line, i) => {
      pdf.text(line, rightColX + labelW, rightY + i * 4);
    });
    rightY += 4 * Math.max(lines.length, 1) + 2;
  });

  y = Math.max(leftY, rightY) + 5;

  // ===== INTRO TEXT =====
  if (type === 'devis') {
    checkPage(20);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.text);
    pdf.text('Madame, Monsieur,', marginL, y);
    y += 6;

    const introText = `Nous avons le plaisir de vous soumettre notre proposition commerciale pour la mise en place de solutions digitales et IA pour votre \u00e9tablissement ${client.entreprise}.`;
    const introLines = pdf.splitTextToSize(introText, contentW);
    pdf.text(introLines, marginL, y);
    y += introLines.length * 4 + 3;

    const moduleCount = lignes.length;
    if (moduleCount > 1) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Ce devis comprend ${moduleCount} modules compl\u00e9mentaires, activables ind\u00e9pendamment selon vos besoins.`, marginL, y);
      pdf.setFont('helvetica', 'normal');
      y += 8;
    } else {
      y += 4;
    }
  }

  // ===== DETAIL SECTION TITLE =====
  checkPage(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...COLORS.dark);
  pdf.text('D\u00e9tail', marginL, y);
  y += 8;

  // ===== TABLE HEADER =====
  const colType = { x: marginL, w: 22 };
  const colDesc = { x: marginL + 22, w: contentW * 0.43 };
  const colPrix = { x: marginL + 22 + contentW * 0.43, w: contentW * 0.18 };
  const colQte = { x: marginL + 22 + contentW * 0.43 + contentW * 0.18, w: contentW * 0.1 };
  const colTotal = { x: marginL + 22 + contentW * 0.43 + contentW * 0.18 + contentW * 0.1, w: contentW * 0.29 - 22 };

  function drawTableHeader() {
    pdf.setFillColor(...COLORS.tableHeader);
    pdf.rect(marginL, y - 4.5, contentW, 9, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.tableHeaderText);
    pdf.text('Type', colType.x + 3, y + 1);
    pdf.text('Description', colDesc.x + 3, y + 1);
    pdf.text('Prix unitaire HT', colPrix.x + colPrix.w, y + 1, { align: 'right' });
    pdf.text('Quantit\u00e9', colQte.x + colQte.w, y + 1, { align: 'right' });
    pdf.text('Total HT', colTotal.x + colTotal.w, y + 1, { align: 'right' });

    y += 8;
  }

  drawTableHeader();

  // ===== TABLE ROWS =====
  lignes.forEach((ligne, idx) => {
    // Get the display name (first line of description if preset)
    const descParts = ligne.description.split('\n');
    const displayName = descParts[0];

    // Try to find matching preset for detailed info
    const preset = PRESET_MAP[displayName];

    // Estimate needed height
    let neededHeight = 14; // minimum for name + price row
    if (preset) {
      neededHeight += 5; // description line
      neededHeight += preset.details.length * 4; // bullet points
      if (preset.pricingNote) {
        neededHeight += preset.pricingNote.split('\n').length * 4 + 2;
      }
      neededHeight += 4; // spacing
    }

    // Check if we need a new page
    if (y + neededHeight > H - 30) {
      drawFooter(pageNum);
      newPage();
      drawTableHeader();
    }

    // Row separator line
    if (idx > 0) {
      pdf.setDrawColor(...COLORS.borderLight);
      pdf.setLineWidth(0.3);
      pdf.line(marginL, y - 3, marginL + contentW, y - 3);
    }

    // Service type
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('Service', colType.x + 3, y + 1);

    // Module name (bold)
    const moduleLabel = type === 'devis'
      ? `MODULE ${idx + 1} \u2014 ${displayName}`
      : displayName;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.dark);

    // Wrap module name if too long
    const maxDescW = colDesc.w - 5;
    const nameLines = pdf.splitTextToSize(moduleLabel, maxDescW);
    nameLines.forEach((line: string, li: number) => {
      pdf.text(line, colDesc.x + 3, y + 1 + li * 4);
    });

    // Price columns on first line
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLORS.dark);
    pdf.text(fmt(ligne.prixUnitaire), colPrix.x + colPrix.w, y + 1, { align: 'right' });
    pdf.text(String(ligne.quantite), colQte.x + colQte.w, y + 1, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.text(fmt(calcTotal(ligne)), colTotal.x + colTotal.w, y + 1, { align: 'right' });

    y += Math.max(nameLines.length * 4, 4) + 4;

    // Detailed description if preset
    if (preset) {
      // Description intro
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.muted);
      const descLines = pdf.splitTextToSize(preset.description, maxDescW);
      pdf.text(descLines, colDesc.x + 3, y);
      y += descLines.length * 3.5 + 2;

      // Bullet points
      preset.details.forEach(detail => {
        if (y > H - 25) {
          drawFooter(pageNum);
          newPage();
          drawTableHeader();
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...COLORS.muted);
        pdf.text(`- ${detail}`, colDesc.x + 5, y);
        y += 3.8;
      });

      y += 2;

      // Pricing note
      if (preset.pricingNote) {
        const noteLines = preset.pricingNote.split('\n');
        noteLines.forEach(noteLine => {
          if (y > H - 25) {
            drawFooter(pageNum);
            newPage();
            drawTableHeader();
          }
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(...COLORS.text);
          pdf.text(noteLine, colDesc.x + 5, y);
          y += 4;
        });
      }

      y += 3;
    } else {
      // Non-preset: just show the sub-description if exists
      if (descParts.length > 1) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.muted);
        const subLines = pdf.splitTextToSize(descParts.slice(1).join('\n'), maxDescW);
        pdf.text(subLines, colDesc.x + 3, y);
        y += subLines.length * 3.5 + 4;
      } else {
        y += 2;
      }
    }
  });

  // ===== TOTALS =====
  y += 4;
  checkPage(25);

  const totalHT = calcTotalHT(lignes);
  const totalTVA = calcTotalTVA(lignes);
  const totalTTC = totalHT + totalTVA;
  const hasTVA = totalTVA > 0;

  // TVA mention right-aligned
  if (!hasTVA) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('TVA non applicable, art. 293 B du CGI', W - marginR, y, { align: 'right' });
    y += 6;
  }

  // Total row
  const totalsLabelX = colPrix.x;
  const totalsValX = W - marginR;

  if (hasTVA) {
    // Sous-total HT
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('Sous-total HT', totalsLabelX, y, { align: 'right' });
    pdf.setTextColor(...COLORS.dark);
    pdf.text(fmt(totalHT), totalsValX, y, { align: 'right' });
    y += 5;

    // TVA
    pdf.setTextColor(...COLORS.muted);
    pdf.text('TVA', totalsLabelX, y, { align: 'right' });
    pdf.setTextColor(...COLORS.dark);
    pdf.text(fmt(totalTVA), totalsValX, y, { align: 'right' });
    y += 7;
  }

  // Total final
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.primary);
  pdf.text('Total', totalsLabelX, y, { align: 'right' });
  pdf.setTextColor(...COLORS.dark);
  pdf.text(fmt(totalTTC), totalsValX, y, { align: 'right' });

  // ===== CONDITIONS + BON POUR ACCORD (for devis) =====
  if (type === 'devis') {
    y += 18;
    checkPage(80);

    const condX = marginL;
    const bonX = W / 2 + 5;

    // === Conditions ===
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...COLORS.primary);
    pdf.text('Conditions', condX, y);

    // === Bon pour accord ===
    pdf.text('Bon pour accord', bonX, y);

    y += 8;
    const condStartY = y;

    // Conditions details
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.dark);
    pdf.text('Conditions de r\u00e8glement :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('\u00c0 r\u00e9ception', condX + 42, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mode de r\u00e8glement :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Virement bancaire', condX + 35, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Validit\u00e9 du devis :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('30 jours', condX + 32, y);

    // Notes section
    y += 7;
    const notes = (doc as Devis).notes;
    if (notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.dark);
      pdf.text('Notes :', condX, y);
      y += 4;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...COLORS.text);
      const noteLines = pdf.splitTextToSize(notes, halfW - 5);
      pdf.text(noteLines, condX, y);
      y += noteLines.length * 3.5 + 4;
    }

    // Closing text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.text);
    pdf.text('Ce devis est valable 30 jours \u00e0 compter de sa date d\'\u00e9mission.', condX, y);
    y += 4;
    pdf.text('Nous restons \u00e0 votre disposition pour toute question.', condX, y);
    y += 6;
    pdf.text('Cordialement,', condX, y);
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('L\'\u00e9quipe OpexIA Agency', condX, y);

    // === Bon pour accord details ===
    let bonY = condStartY;

    // "À ___, le ___ / ___ / ___"
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.dark);
    pdf.text('\u00c0', bonX, bonY);
    // Underline for city
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(bonX + 5, bonY + 1, bonX + 30, bonY + 1);
    pdf.text(', le', bonX + 31, bonY);
    pdf.line(bonX + 39, bonY + 1, bonX + 48, bonY + 1);
    pdf.text('/', bonX + 49, bonY);
    pdf.line(bonX + 52, bonY + 1, bonX + 60, bonY + 1);
    pdf.text('/', bonX + 61, bonY);
    pdf.line(bonX + 64, bonY + 1, bonX + 78, bonY + 1);

    bonY += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.dark);
    pdf.text('Signature et cachet', bonX, bonY);

    bonY += 3;
    // Signature box
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.rect(bonX, bonY, W - marginR - bonX, 22);

    bonY += 27;
    pdf.text('Qualit\u00e9 de signataire', bonX, bonY);
    bonY += 3;
    pdf.line(bonX, bonY, W - marginR, bonY);

  } else {
    // ===== FACTURE: Conditions de paiement =====
    y += 18;
    checkPage(30);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...COLORS.primary);
    pdf.text('Conditions', marginL, y);

    y += 8;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.dark);
    pdf.text('Conditions de r\u00e8glement :', marginL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('\u00c0 r\u00e9ception', marginL + 42, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mode de r\u00e8glement :', marginL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Virement bancaire', marginL + 35, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('\u00c9ch\u00e9ance :', marginL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(fmtDate((doc as Invoice).dateEcheance), marginL + 20, y);

    y += 8;
    const invNotes = (doc as Invoice).description;
    if (invNotes) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes :', marginL, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...COLORS.text);
      const noteLines = pdf.splitTextToSize(invNotes, contentW);
      pdf.text(noteLines, marginL, y);
      y += noteLines.length * 3.5 + 4;
    }

    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.text);
    pdf.text('En cas de retard de paiement, des p\u00e9nalit\u00e9s de retard seront appliqu\u00e9es conform\u00e9ment \u00e0 la loi.', marginL, y);
    y += 4;
    pdf.text('Nous restons \u00e0 votre disposition pour toute question.', marginL, y);
    y += 6;
    pdf.text('Cordialement,', marginL, y);
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('L\'\u00e9quipe OpexIA Agency', marginL, y);
  }

  // ===== DRAW FOOTERS ON ALL PAGES =====
  totalPages = pageNum;
  const numPages = pdf.getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    pdf.setPage(p);
    drawFooter(p);
  }

  // ===== DOWNLOAD =====
  const filename = `${type === 'devis' ? 'Devis' : 'Facture'}_${numero}.pdf`;
  pdf.save(filename);
}
