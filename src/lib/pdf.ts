import { jsPDF } from 'jspdf';
import { DocumentLigne, Client, Devis, Invoice } from './types';
import { VAGUE_BASE64 } from './vague-base64';

// ===== COMPANY INFO =====
const COMPANY = {
  name: 'OpexIA Agency',
  contact: 'Marius AUGEREAU',
  address: '34 Rue Mauconseil',
  city: '94120 Fontenay-sous-Bois',
  country: 'France',
  email: 'contact@opexia.fr',
  site: 'www.opexia.fr',
};

// ===== FACTURE.NET STYLE COLORS =====
type RGB = [number, number, number];
const C = {
  primary: [110, 87, 224] as RGB,        // #6e57e0
  primaryLight: [140, 120, 235] as RGB,
  primaryPale: [200, 190, 245] as RGB,
  // Text
  text: [50, 50, 60] as RGB,
  textLight: [100, 100, 115] as RGB,
  label: [120, 120, 135] as RGB,
  muted: [150, 150, 165] as RGB,
  // Structural
  border: [220, 220, 230] as RGB,
  white: [255, 255, 255] as RGB,
  // Row backgrounds for alternating
  rowEven: [248, 247, 253] as RGB,       // very light violet tint
  rowOdd: [255, 255, 255] as RGB,        // white
};

// ===== PRESET DETAILS MAP =====
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
    pricingNote: 'Mise en place : 400\u20ac HT (paiement unique)\nMaintenance mensuelle : 20\u20ac HT/mois',
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

// ===== DRAW DECORATIVE WAVE IMAGE (top-right corner) =====
// Uses the actual vague.png from the logo folder
function drawWaveImage(pdf: jsPDF) {
  try {
    // Image is 900x382 px — place it top-right, spanning ~120mm wide
    // The image has transparent/white background with wave lines flowing from right
    const imgW = 130; // mm width on page
    const imgH = imgW * (382 / 900); // keep aspect ratio ~55mm
    const xPos = 210 - imgW + 10; // slight overshoot to the right edge
    const yPos = -5; // start slightly above page top
    pdf.addImage(VAGUE_BASE64, 'PNG', xPos, yPos, imgW, imgH);
  } catch {
    // silently skip if image fails
  }
}

// ===== DRAW FOOTER =====
function drawFooter(pdf: jsPDF, numero: string, type: string, page: number, totalPages: number) {
  const W = 210;
  const H = 297;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...C.muted);
  pdf.text(`${type === 'devis' ? 'Devis' : 'Facture'} ${numero}`, 25, H - 10);
  pdf.text(`Page ${page} sur ${totalPages}`, W - 25, H - 10, { align: 'right' });
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
  const mL = 25;
  const mR = 25;
  const cW = W - mL - mR; // 160mm
  const numero = 'numero' in doc ? doc.numero : '';
  let y = 0;
  let pageCount = 0;

  function newPage() {
    if (pageCount > 0) pdf.addPage();
    pageCount++;
    drawWaveImage(pdf);
    y = 25;
  }

  function needPage(needed: number) {
    if (y + needed > H - 22) {
      newPage();
    }
  }

  // =============== PAGE 1 ===============
  newPage();

  // TITLE: "Devis DEV-2026-002" in blue-violet
  const titleText = type === 'devis' ? 'Devis' : 'Facture';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(...C.primary);
  pdf.text(`${titleText} ${numero}`, mL, y);

  // Date
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(...C.textLight);
  const dateStr = type === 'devis'
    ? fmtDate((doc as Devis).dateCreation)
    : fmtDate((doc as Invoice).dateEmission);
  pdf.text(dateStr, mL, y);

  // =============== ÉMETTEUR / DESTINATAIRE ===============
  y += 18;
  const halfW = (cW - 15) / 2;
  const rightColX = mL + halfW + 15;

  // Titles
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...C.primary);
  pdf.text('\u00c9metteur', mL, y);
  pdf.text('Destinataire', rightColX, y);

  y += 4;
  pdf.setDrawColor(...C.primaryPale);
  pdf.setLineWidth(0.5);
  pdf.line(mL, y, mL + halfW, y);
  pdf.line(rightColX, y, rightColX + halfW, y);

  y += 8;
  const fieldY = y;
  const fieldGap = 5.5;
  const labelOffset = 30; // offset for values after labels

  // --- Émetteur fields ---
  let eY = fieldY;
  pdf.setFontSize(9);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Soci\u00e9t\u00e9 :', mL, eY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.name, mL + labelOffset, eY);

  eY += fieldGap;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Votre contact :', mL, eY);
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.contact, mL + labelOffset, eY);

  eY += fieldGap;
  pdf.setTextColor(...C.label);
  pdf.text('Adresse :', mL, eY);
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.address, mL + labelOffset, eY);
  eY += 4;
  pdf.text(COMPANY.city, mL + labelOffset, eY);

  eY += fieldGap;
  pdf.setTextColor(...C.label);
  pdf.text('Pays :', mL, eY);
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.country, mL + labelOffset, eY);

  // --- Destinataire fields ---
  let dY = fieldY;

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Soci\u00e9t\u00e9 :', rightColX, dY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.text);
  pdf.text(client.entreprise || `${client.prenom} ${client.nom}`.trim(), rightColX + labelOffset, dY);

  dY += fieldGap;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Adresse :', rightColX, dY);
  pdf.setTextColor(...C.text);
  if (client.adresse) {
    const addrLines = pdf.splitTextToSize(client.adresse, halfW - labelOffset - 2);
    addrLines.forEach((line: string) => {
      pdf.text(line, rightColX + labelOffset, dY);
      dY += 4;
    });
    dY -= 4;
  }

  dY += fieldGap;
  pdf.setTextColor(...C.label);
  pdf.text('Pays :', rightColX, dY);
  pdf.setTextColor(...C.text);
  pdf.text('France', rightColX + labelOffset, dY);

  y = Math.max(eY, dY) + 14;

  // =============== INTRO TEXT (devis only) ===============
  if (type === 'devis') {
    needPage(22);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...C.text);
    pdf.text('Madame, Monsieur,', mL, y);
    y += 7;

    const introText = `Nous avons le plaisir de vous soumettre notre proposition commerciale pour la mise en place de solutions digitales et IA pour votre \u00e9tablissement ${client.entreprise || client.nom}.`;
    const introLines = pdf.splitTextToSize(introText, cW);
    pdf.text(introLines, mL, y);
    y += introLines.length * 4.5 + 3;

    if (lignes.length > 1) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(`Ce devis comprend ${lignes.length} modules compl\u00e9mentaires, activables ind\u00e9pendamment selon vos besoins.`, mL, y);
      pdf.setFont('helvetica', 'normal');
      y += 8;
    } else {
      y += 4;
    }
  } else {
    y += 4;
  }

  // =============== "Détail" SECTION TITLE ===============
  needPage(16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(20);
  pdf.setTextColor(...C.text);
  pdf.text('D\u00e9tail', mL, y);
  y += 8;

  // =============== TABLE ===============
  // Column positions — proper spacing to avoid overlap
  // Total width = 160mm
  // Type: 30mm | Description: flexible | Prix: 28mm | Qté: 18mm | Total: 24mm
  const colPrixW = 28;
  const colQteW = 18;
  const colTotalW = 24;
  const colTypeW = 30;
  const colDescW = cW - colTypeW - colPrixW - colQteW - colTotalW;

  const tType = { x: mL, w: colTypeW };
  const tDesc = { x: mL + colTypeW, w: colDescW };
  const tPrix = { x: mL + colTypeW + colDescW, w: colPrixW };
  const tQte  = { x: mL + colTypeW + colDescW + colPrixW, w: colQteW };
  const tTotal = { x: mL + colTypeW + colDescW + colPrixW + colQteW, w: colTotalW };

  function drawTableHeader() {
    // Blue-violet header row
    pdf.setFillColor(...C.primary);
    pdf.rect(mL, y - 4.5, cW, 9, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...C.white);
    pdf.text('Type', tType.x + 4, y + 0.5);
    pdf.text('Description', tDesc.x + 4, y + 0.5);
    pdf.text('Prix unitaire HT', tPrix.x + tPrix.w / 2, y + 0.5, { align: 'center' });
    pdf.text('Quantit\u00e9', tQte.x + tQte.w / 2, y + 0.5, { align: 'center' });
    pdf.text('Total HT', tTotal.x + tTotal.w - 2, y + 0.5, { align: 'right' });

    y += 8;
  }

  drawTableHeader();

  // =============== TABLE ROWS ===============
  lignes.forEach((ligne, idx) => {
    const descParts = ligne.description.split('\n');
    const displayName = descParts[0];
    const preset = PRESET_MAP[displayName];

    // Pre-calculate the full height of this row to draw the background first
    const rowStartY = y - 2;
    let tempY = y;

    // MODULE name height
    const moduleLabel = type === 'devis'
      ? `MODULE ${idx + 1} \u2014 ${displayName}`
      : displayName;
    const maxDescW = tDesc.w - 8;
    const nameLines = pdf.splitTextToSize(moduleLabel, maxDescW);
    tempY += Math.max(nameLines.length * 4, 4) + 6;

    if (preset) {
      const descLines = pdf.splitTextToSize(preset.description, maxDescW);
      tempY += descLines.length * 4 + 2;
      tempY += preset.details.length * 4.2;
      tempY += 3;
      if (preset.pricingNote) {
        tempY += preset.pricingNote.split('\n').length * 4.5;
      }
      tempY += 5;
    } else if (descParts.length > 1) {
      const subLines = pdf.splitTextToSize(descParts.slice(1).join('\n'), maxDescW);
      tempY += subLines.length * 4 + 5;
    } else {
      tempY += 3;
    }

    const rowHeight = tempY - rowStartY;

    // Check if we need a new page for this row
    if (y + rowHeight > H - 25) {
      newPage();
      drawTableHeader();
    }

    // *** ALTERNATING ROW BACKGROUND ***
    const bgColor = idx % 2 === 0 ? C.rowEven : C.rowOdd;
    pdf.setFillColor(...bgColor);
    pdf.rect(mL, y - 3, cW, rowHeight + 1, 'F');

    // Row separator line
    if (idx > 0) {
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(0.3);
      pdf.line(mL, y - 3, mL + cW, y - 3);
    }

    // === Type: "Service" ===
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text('Service', tType.x + 4, y + 1);

    // === Description: MODULE name ===
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    nameLines.forEach((line: string, li: number) => {
      pdf.text(line, tDesc.x + 4, y + 1 + li * 4);
    });

    // === Price columns ===
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text(fmt(ligne.prixUnitaire), tPrix.x + tPrix.w / 2, y + 1, { align: 'center' });
    pdf.text(String(ligne.quantite), tQte.x + tQte.w / 2, y + 1, { align: 'center' });
    pdf.text(fmt(calcTotal(ligne)), tTotal.x + tTotal.w - 2, y + 1, { align: 'right' });

    y += Math.max(nameLines.length * 4, 4) + 6;

    // === Detailed description ===
    if (preset) {
      // Description intro
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(...C.textLight);
      const descLines = pdf.splitTextToSize(preset.description, maxDescW);
      pdf.text(descLines, tDesc.x + 8, y);
      y += descLines.length * 4 + 2;

      // Bullet points "- "
      preset.details.forEach(detail => {
        if (y > H - 25) {
          newPage();
          drawTableHeader();
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...C.textLight);
        pdf.text(`- ${detail}`, tDesc.x + 8, y);
        y += 4.2;
      });

      y += 3;

      // Pricing note
      if (preset.pricingNote) {
        const noteLines = preset.pricingNote.split('\n');
        noteLines.forEach(noteLine => {
          if (y > H - 25) {
            newPage();
            drawTableHeader();
          }
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(...C.text);
          pdf.text(noteLine, tDesc.x + 8, y);
          y += 4.5;
        });
      }
      y += 5;
    } else {
      if (descParts.length > 1) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...C.textLight);
        const subLines = pdf.splitTextToSize(descParts.slice(1).join('\n'), maxDescW);
        pdf.text(subLines, tDesc.x + 8, y);
        y += subLines.length * 4 + 5;
      } else {
        y += 3;
      }
    }
  });

  // Bottom table line
  pdf.setDrawColor(...C.border);
  pdf.setLineWidth(0.3);
  pdf.line(mL, y, mL + cW, y);

  // =============== TOTALS ===============
  y += 8;
  needPage(25);

  const totalHT = calcTotalHT(lignes);
  const totalTVA = calcTotalTVA(lignes);
  const totalTTC = totalHT + totalTVA;
  const hasTVA = totalTVA > 0;

  if (!hasTVA) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.textLight);
    pdf.text('TVA non applicable, art. 293 B du CGI', W - mR, y, { align: 'right' });
    y += 6;
  }

  if (hasTVA) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...C.textLight);
    pdf.text('Sous-total HT', W - mR - 40, y, { align: 'right' });
    pdf.setTextColor(...C.text);
    pdf.text(fmt(totalHT), W - mR, y, { align: 'right' });
    y += 5;

    pdf.setTextColor(...C.textLight);
    pdf.text('TVA', W - mR - 40, y, { align: 'right' });
    pdf.setTextColor(...C.text);
    pdf.text(fmt(totalTVA), W - mR, y, { align: 'right' });
    y += 7;
  }

  // Total line — bold blue-violet
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...C.primary);
  pdf.text('Total', W - mR - 40, y, { align: 'right' });
  pdf.setTextColor(...C.text);
  pdf.text(fmt(totalTTC), W - mR, y, { align: 'right' });

  // =============== CONDITIONS + BON POUR ACCORD ===============
  y += 20;

  if (type === 'devis') {
    needPage(90);

    const condX = mL;
    const bonX = W / 2 + 5;

    // Titles
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(...C.text);
    pdf.text('Conditions', condX, y);
    pdf.text('Bon pour accord', bonX, y);

    y += 8;
    const condStartY = y;

    // Conditions details
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Conditions de r\u00e8glement :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('\u00c0 r\u00e9ception', condX + 46, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mode de r\u00e8glement :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Virement bancaire', condX + 38, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Validit\u00e9 du devis :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('30 jours', condX + 34, y);

    // Notes
    y += 6;
    const notes = (doc as Devis).notes;
    if (notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Notes :', condX, y);
      y += 4;

      pdf.setFont('helvetica', 'normal');
      const nLines = pdf.splitTextToSize(notes, W / 2 - mL - 10);
      pdf.text(nLines, condX, y);
      y += nLines.length * 4 + 4;
    }

    // Closing
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text('Ce devis est valable 30 jours \u00e0 compter de sa date d\'\u00e9mission.', condX, y);
    y += 4;
    pdf.text('Nous restons \u00e0 votre disposition pour toute question.', condX, y);
    y += 7;
    pdf.text('Cordialement,', condX, y);
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('L\'\u00e9quipe OpexIA Agency', condX, y);

    // === Bon pour accord ===
    let bonY = condStartY;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text('\u00c0', bonX, bonY);
    pdf.setDrawColor(...C.border);
    pdf.setLineWidth(0.3);
    pdf.line(bonX + 5, bonY + 1, bonX + 32, bonY + 1);
    pdf.text(', le', bonX + 33, bonY);
    pdf.line(bonX + 41, bonY + 1, bonX + 50, bonY + 1);
    pdf.text('/', bonX + 51, bonY);
    pdf.line(bonX + 54, bonY + 1, bonX + 62, bonY + 1);
    pdf.text('/', bonX + 63, bonY);
    pdf.line(bonX + 66, bonY + 1, bonX + 80, bonY + 1);

    bonY += 9;
    pdf.text('Signature et cachet', bonX, bonY);

    bonY += 3;
    pdf.setDrawColor(...C.border);
    pdf.setLineWidth(0.3);
    pdf.rect(bonX, bonY, W - mR - bonX, 28, 'S');

    bonY += 33;
    pdf.text('Qualit\u00e9 de signataire', bonX, bonY);
    bonY += 3;
    pdf.line(bonX, bonY, W - mR, bonY);

  } else {
    // ===== FACTURE CONDITIONS =====
    needPage(45);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(...C.text);
    pdf.text('Conditions de paiement', mL, y);

    y += 8;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Conditions de r\u00e8glement :', mL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('\u00c0 r\u00e9ception', mL + 46, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mode de r\u00e8glement :', mL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Virement bancaire', mL + 38, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('\u00c9ch\u00e9ance :', mL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(fmtDate((doc as Invoice).dateEcheance), mL + 22, y);

    y += 8;
    const invNotes = (doc as Invoice).description;
    if (invNotes) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes :', mL, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const nLines = pdf.splitTextToSize(invNotes, cW);
      pdf.text(nLines, mL, y);
      y += nLines.length * 4 + 4;
    }

    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('En cas de retard de paiement, des p\u00e9nalit\u00e9s seront appliqu\u00e9es conform\u00e9ment \u00e0 la loi.', mL, y);
    y += 6;
    pdf.text('Cordialement,', mL, y);
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('L\'\u00e9quipe OpexIA Agency', mL, y);
  }

  // =============== FOOTERS ON ALL PAGES ===============
  const numPages = pdf.getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    pdf.setPage(p);
    drawFooter(pdf, numero, type, p, numPages);
  }

  // =============== DOWNLOAD ===============
  const filename = `${type === 'devis' ? 'Devis' : 'Facture'}_${numero}.pdf`;
  pdf.save(filename);
}
