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
  site: 'www.opexia.fr',
};

// ===== FACTURE.NET STYLE COLORS =====
type RGB = [number, number, number];
const C = {
  // Primary blue-violet (Facture.net brand)
  primary: [110, 87, 224] as RGB,        // #6e57e0
  primaryLight: [140, 120, 235] as RGB,   // #8c78eb
  primaryPale: [200, 190, 245] as RGB,    // #c8bef5
  primaryFaint: [230, 225, 250] as RGB,   // #e6e1fa
  // Text
  title: [110, 87, 224] as RGB,           // #6e57e0
  text: [50, 50, 60] as RGB,             // #32323c
  textLight: [100, 100, 115] as RGB,     // #646473
  label: [120, 120, 135] as RGB,         // #787887
  muted: [150, 150, 165] as RGB,         // #9696a5
  // Structural
  border: [220, 220, 230] as RGB,        // #dcdce6
  borderLight: [235, 235, 242] as RGB,   // #ebebf2
  white: [255, 255, 255] as RGB,
  black: [0, 0, 0] as RGB,
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

// ===== DRAW DECORATIVE WAVES (top-right corner) =====
// Replicates the Facture.net flowing wave curves in blue/purple tones
function drawWaves(pdf: jsPDF) {
  const W = 210;

  // We draw multiple bezier-like wave paths using small line segments
  // These waves flow from top-right corner diagonally, creating the Facture.net signature look

  // Wave 1 — outermost, very faint
  pdf.setDrawColor(200, 190, 245); // light purple
  pdf.setLineWidth(0.8);
  drawWavePath(pdf, W + 20, -30, -60, 80, 0.6);

  // Wave 2
  pdf.setDrawColor(180, 170, 240);
  pdf.setLineWidth(0.6);
  drawWavePath(pdf, W + 10, -20, -50, 70, 0.5);

  // Wave 3
  pdf.setDrawColor(165, 155, 235);
  pdf.setLineWidth(0.7);
  drawWavePath(pdf, W + 5, -10, -40, 60, 0.45);

  // Wave 4 — more visible
  pdf.setDrawColor(150, 140, 230);
  pdf.setLineWidth(0.5);
  drawWavePath(pdf, W - 5, -5, -30, 55, 0.4);

  // Wave 5
  pdf.setDrawColor(140, 125, 228);
  pdf.setLineWidth(0.6);
  drawWavePath(pdf, W - 15, 0, -20, 45, 0.35);

  // Wave 6
  pdf.setDrawColor(130, 115, 225);
  pdf.setLineWidth(0.4);
  drawWavePath(pdf, W - 25, 5, -10, 40, 0.3);

  // Wave 7 — inner
  pdf.setDrawColor(120, 100, 220);
  pdf.setLineWidth(0.5);
  drawWavePath(pdf, W - 35, 8, 0, 35, 0.25);

  // Wave 8 — innermost, most visible
  pdf.setDrawColor(110, 87, 224);
  pdf.setLineWidth(0.3);
  drawWavePath(pdf, W - 50, 12, 10, 25, 0.2);
}

function drawWavePath(pdf: jsPDF, startX: number, startY: number, offsetX: number, offsetY: number, amplitude: number) {
  // Draw a flowing curve from top-right going down-left
  const steps = 80;
  const points: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Main path: curve from top-right to lower area
    const x = startX + offsetX * t + Math.sin(t * Math.PI * 2.5) * amplitude * 15;
    const y = startY + offsetY * t + Math.cos(t * Math.PI * 1.8) * amplitude * 8;
    points.push([x, y]);
  }

  // Draw as connected line segments
  for (let i = 0; i < points.length - 1; i++) {
    pdf.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
}

// ===== DRAW FOOTER =====
function drawFooter(pdf: jsPDF, numero: string, type: string, page: number, totalPages: number) {
  const W = 210;
  const H = 297;

  // "Devis XXXXX" bottom-left
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...C.muted);
  pdf.text(`${type === 'devis' ? 'Devis' : 'Facture'} ${numero}`, 20, H - 10);

  // "Page X sur Y" bottom-right
  pdf.text(`Page ${page} sur ${totalPages}`, W - 20, H - 10, { align: 'right' });
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
  const mL = 25; // margin left (matching Facture.net)
  const mR = 25; // margin right
  const cW = W - mL - mR; // content width = 160mm
  const numero = 'numero' in doc ? doc.numero : '';
  let y = 0;
  let pageCount = 0;

  function newPage() {
    if (pageCount > 0) pdf.addPage();
    pageCount++;
    // Draw decorative waves on every page
    drawWaves(pdf);
    y = 25;
  }

  function needPage(needed: number) {
    if (y + needed > H - 22) {
      newPage();
    }
  }

  // ===== PAGE 1 =====
  newPage();

  // ===== TITLE: "Devis D2600001" in blue-violet =====
  const titleText = type === 'devis' ? 'Devis' : 'Facture';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(...C.primary);
  pdf.text(`${titleText} ${numero}`, mL, y);

  // Date underneath in gray
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(...C.textLight);
  const dateStr = type === 'devis'
    ? fmtDate((doc as Devis).dateCreation)
    : fmtDate((doc as Invoice).dateEmission);
  pdf.text(dateStr, mL, y);

  // ===== ÉMETTEUR / DESTINATAIRE =====
  y += 18;

  const halfW = (cW - 10) / 2; // gap of 10mm between columns
  const rightColX = mL + halfW + 10;

  // --- Émetteur title ---
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...C.primary);
  pdf.text('\u00c9metteur', mL, y);

  // --- Destinataire title ---
  pdf.text('Destinataire', rightColX, y);

  y += 4;
  // Thin line under Émetteur
  pdf.setDrawColor(...C.primaryPale);
  pdf.setLineWidth(0.5);
  pdf.line(mL, y, mL + halfW, y);
  // Thin line under Destinataire
  pdf.line(rightColX, y, rightColX + halfW, y);

  y += 8;

  // --- Émetteur fields ---
  const labelFontSize = 9;
  const valueFontSize = 9;
  const fieldGap = 5.5;

  // Société
  const emY = y;
  let eY = emY;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(labelFontSize);
  pdf.setTextColor(...C.label);
  pdf.text('Soci\u00e9t\u00e9 :', mL, eY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(valueFontSize);
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.name, mL + 28, eY);

  eY += fieldGap;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Votre contact :', mL, eY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(valueFontSize);
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.contact, mL + 28, eY);

  eY += fieldGap;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Adresse :', mL, eY);
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.address, mL + 28, eY);
  eY += 4;
  pdf.text(COMPANY.city, mL + 28, eY);

  eY += fieldGap;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Pays :', mL, eY);
  pdf.setTextColor(...C.text);
  pdf.text(COMPANY.country, mL + 28, eY);

  // --- Destinataire fields ---
  let dY = emY;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(labelFontSize);
  pdf.setTextColor(...C.label);
  pdf.text('Soci\u00e9t\u00e9 :', rightColX, dY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(valueFontSize);
  pdf.setTextColor(...C.text);
  pdf.text(client.entreprise || `${client.prenom} ${client.nom}`.trim(), rightColX + 28, dY);

  dY += fieldGap;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Adresse :', rightColX, dY);
  pdf.setTextColor(...C.text);
  if (client.adresse) {
    const addrLines = pdf.splitTextToSize(client.adresse, halfW - 30);
    addrLines.forEach((line: string) => {
      pdf.text(line, rightColX + 28, dY);
      dY += 4;
    });
    dY -= 4; // undo last increment, will be re-added by fieldGap
  }

  dY += fieldGap;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.label);
  pdf.text('Pays :', rightColX, dY);
  pdf.setTextColor(...C.text);
  pdf.text('France', rightColX + 28, dY);

  y = Math.max(eY, dY) + 14;

  // ===== INTRO TEXT (devis only) =====
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

  // ===== "Détail" SECTION TITLE =====
  needPage(16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(20);
  pdf.setTextColor(...C.text);
  pdf.text('D\u00e9tail', mL, y);
  y += 8;

  // ===== TABLE =====
  // Column layout matching Facture.net exactly
  const tColType = { x: mL, w: 42 };                   // "Type" column
  const tColDesc = { x: mL + 42, w: cW * 0.38 };       // "Description" column
  const tColPrix = { x: mL + 42 + cW * 0.38, w: 28 };  // "Prix unitaire HT"
  const tColQte = { x: mL + 42 + cW * 0.38 + 28, w: 20 };  // "Quantité"
  const tColTotal = { x: mL + 42 + cW * 0.38 + 48, w: cW - 42 - cW * 0.38 - 48 }; // "Total HT"

  function drawTableHeader() {
    // Blue-violet header row
    pdf.setFillColor(...C.primary);
    pdf.rect(mL, y - 4.5, cW, 9, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...C.white);
    pdf.text('Type', tColType.x + 4, y + 0.5);
    pdf.text('Description', tColDesc.x + 4, y + 0.5);
    pdf.text('Prix unitaire HT', tColPrix.x + tColPrix.w / 2, y + 0.5, { align: 'center' });
    pdf.text('Quantit\u00e9', tColQte.x + tColQte.w / 2, y + 0.5, { align: 'center' });
    pdf.text('Total HT', tColTotal.x + tColTotal.w - 3, y + 0.5, { align: 'right' });

    y += 8;
  }

  drawTableHeader();

  // ===== TABLE ROWS =====
  lignes.forEach((ligne, idx) => {
    const descParts = ligne.description.split('\n');
    const displayName = descParts[0];
    const preset = PRESET_MAP[displayName];

    // Estimate height needed
    let neededH = 16;
    if (preset) {
      neededH += 5 + preset.details.length * 4.2;
      if (preset.pricingNote) neededH += preset.pricingNote.split('\n').length * 4.5 + 4;
      neededH += 8;
    }

    if (y + neededH > H - 25) {
      newPage();
      drawTableHeader();
    }

    // Row separator line between services
    if (idx > 0) {
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(0.3);
      pdf.line(mL, y - 2, mL + cW, y - 2);
    }

    // === Type column: "Service" ===
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text('Service', tColType.x + 4, y + 1);

    // === Description column: MODULE name ===
    const moduleLabel = type === 'devis'
      ? `MODULE ${idx + 1} \u2014 ${displayName}`
      : displayName;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);

    const maxDescW = tColDesc.w - 6;
    const nameLines = pdf.splitTextToSize(moduleLabel, maxDescW);
    nameLines.forEach((line: string, li: number) => {
      pdf.text(line, tColDesc.x + 4, y + 1 + li * 4);
    });

    // === Price columns ===
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text(fmt(ligne.prixUnitaire), tColPrix.x + tColPrix.w / 2, y + 1, { align: 'center' });
    pdf.text(String(ligne.quantite), tColQte.x + tColQte.w / 2, y + 1, { align: 'center' });
    pdf.text(fmt(calcTotal(ligne)), tColTotal.x + tColTotal.w - 3, y + 1, { align: 'right' });

    y += Math.max(nameLines.length * 4, 4) + 6;

    // === Detailed description if preset ===
    if (preset) {
      // Description intro (italic)
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(...C.textLight);
      const descLines = pdf.splitTextToSize(preset.description, maxDescW);
      pdf.text(descLines, tColDesc.x + 8, y);
      y += descLines.length * 4 + 2;

      // Bullet points with "- " prefix
      preset.details.forEach(detail => {
        if (y > H - 25) {
          newPage();
          drawTableHeader();
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...C.textLight);
        pdf.text(`- ${detail}`, tColDesc.x + 8, y);
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
          pdf.text(noteLine, tColDesc.x + 8, y);
          y += 4.5;
        });
      }
      y += 5;
    } else {
      // Non-preset: sub-description lines
      if (descParts.length > 1) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...C.textLight);
        const subLines = pdf.splitTextToSize(descParts.slice(1).join('\n'), maxDescW);
        pdf.text(subLines, tColDesc.x + 8, y);
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

  // ===== TOTALS =====
  y += 8;
  needPage(25);

  const totalHT = calcTotalHT(lignes);
  const totalTVA = calcTotalTVA(lignes);
  const totalTTC = totalHT + totalTVA;
  const hasTVA = totalTVA > 0;

  // TVA mention — right-aligned
  if (!hasTVA) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.textLight);
    pdf.text('TVA non applicable, art. 293 B du CGI', W - mR, y, { align: 'right' });
    y += 6;
  }

  if (hasTVA) {
    // Sous-total HT
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...C.textLight);
    pdf.text('Sous-total HT', W - mR - 40, y, { align: 'right' });
    pdf.setTextColor(...C.text);
    pdf.text(fmt(totalHT), W - mR, y, { align: 'right' });
    y += 5;

    // TVA
    pdf.setTextColor(...C.textLight);
    pdf.text('TVA', W - mR - 40, y, { align: 'right' });
    pdf.setTextColor(...C.text);
    pdf.text(fmt(totalTVA), W - mR, y, { align: 'right' });
    y += 7;
  }

  // TOTAL line — bold blue-violet, matching Facture.net
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...C.primary);
  pdf.text('Total', W - mR - 40, y, { align: 'right' });
  pdf.setTextColor(...C.text);
  pdf.text(fmt(totalTTC), W - mR, y, { align: 'right' });

  // ===== CONDITIONS + BON POUR ACCORD =====
  y += 20;

  if (type === 'devis') {
    needPage(90);

    const condX = mL;
    const bonX = W / 2 + 5;

    // === Conditions title ===
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(...C.text);
    pdf.text('Conditions', condX, y);

    // === Bon pour accord title ===
    pdf.text('Bon pour accord', bonX, y);

    y += 8;
    const condStartY = y;

    // Conditions details
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Conditions de r\u00e8glement :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.text);
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
      pdf.setFontSize(9);
      pdf.setTextColor(...C.text);
      const nLines = pdf.splitTextToSize(notes, W / 2 - mL - 10);
      pdf.text(nLines, condX, y);
      y += nLines.length * 4 + 4;
    }

    // Closing text
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

    // === Bon pour accord section ===
    let bonY = condStartY;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text('\u00c0', bonX, bonY);
    // Underlines for location
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
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text('Signature et cachet', bonX, bonY);

    bonY += 3;
    // Signature box — simple rectangle with light border
    pdf.setDrawColor(...C.border);
    pdf.setLineWidth(0.3);
    pdf.rect(bonX, bonY, W - mR - bonX, 28, 'S');

    bonY += 33;
    pdf.text('Qualit\u00e9 de signataire', bonX, bonY);
    bonY += 3;
    pdf.setDrawColor(...C.border);
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

  // ===== DRAW FOOTERS ON ALL PAGES =====
  const numPages = pdf.getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    pdf.setPage(p);
    drawFooter(pdf, numero, type, p, numPages);
  }

  // ===== DOWNLOAD =====
  const filename = `${type === 'devis' ? 'Devis' : 'Facture'}_${numero}.pdf`;
  pdf.save(filename);
}
