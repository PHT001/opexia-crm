import { jsPDF } from 'jspdf';
import { DocumentLigne, Client, Devis, Invoice } from './types';
import { LOGO_BASE64 } from './logo-base64';

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

// ===== PREMIUM COLOR PALETTE =====
type RGB = [number, number, number];
const C = {
  // Dark luxury palette
  navy: [30, 21, 51] as RGB,           // #1e1533 sidebar
  dark: [35, 30, 55] as RGB,           // #231e37
  charcoal: [45, 42, 58] as RGB,       // #2d2a3a
  text: [55, 50, 70] as RGB,           // #373246
  textLight: [110, 105, 128] as RGB,   // #6e6980
  muted: [148, 144, 166] as RGB,       // #9490a6
  label: [130, 125, 150] as RGB,       // #827d96
  // Accent blue (matching logo gradient)
  blue: [65, 105, 185] as RGB,         // #4169b9
  blueLight: [90, 135, 210] as RGB,    // #5a87d2
  bluePale: [210, 225, 245] as RGB,    // #d2e1f5
  // Structural
  border: [215, 212, 225] as RGB,      // #d7d4e1
  borderLight: [232, 229, 240] as RGB, // #e8e5f0
  bg: [248, 247, 252] as RGB,          // #f8f7fc
  bgWarm: [245, 244, 250] as RGB,      // #f5f4fa
  white: [255, 255, 255] as RGB,
  // Gold accent for premium feel
  gold: [180, 155, 90] as RGB,         // #b49b5a
  goldLight: [210, 190, 135] as RGB,   // #d2be87
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
    pricingNote: '1er mois : p\u00e9riode de test \u2014 facturation \u00e0 l\'usage\n\u00c0 partir du 2\u00e8me mois : 140\u20ac HT/mois (forfait illimit\u00e9)',
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

// ===== DRAW PREMIUM HEADER BAND =====
function drawHeaderBand(pdf: jsPDF) {
  const W = 210;
  // Dark navy top band
  pdf.setFillColor(...C.navy);
  pdf.rect(0, 0, W, 44, 'F');

  // Subtle gold accent line at bottom of band
  pdf.setFillColor(...C.gold);
  pdf.rect(0, 44, W, 0.8, 'F');

  // Subtle diagonal geometric lines (premium pattern)
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.15);
  for (let i = 0; i < 8; i++) {
    const x = W - 80 + i * 12;
    const alpha = 0.03 + i * 0.01;
    pdf.setDrawColor(
      Math.round(255 * alpha + C.navy[0] * (1 - alpha)),
      Math.round(255 * alpha + C.navy[1] * (1 - alpha)),
      Math.round(255 * alpha + C.navy[2] * (1 - alpha))
    );
    pdf.line(x, 0, x + 30, 44);
  }
}

// ===== DRAW FOOTER BAND =====
function drawFooterBand(pdf: jsPDF, numero: string, type: string, page: number, totalPages: number) {
  const W = 210;
  const H = 297;

  // Gold thin line
  pdf.setFillColor(...C.gold);
  pdf.rect(0, H - 16, W, 0.5, 'F');

  // Dark footer
  pdf.setFillColor(...C.navy);
  pdf.rect(0, H - 15, W, 15, 'F');

  // Footer text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(180, 175, 195);
  pdf.text(`${COMPANY.name} | ${COMPANY.email} | ${COMPANY.site}`, 20, H - 7);

  pdf.text(`${type === 'devis' ? 'Devis' : 'Facture'} ${numero}`, 105, H - 7, { align: 'center' });

  pdf.text(`Page ${page} sur ${totalPages}`, 190, H - 7, { align: 'right' });
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
  const mL = 20; // margin left
  const mR = 20; // margin right
  const cW = W - mL - mR; // content width
  const numero = 'numero' in doc ? doc.numero : '';
  let y = 0;
  let pageCount = 1;
  let totalPagesEst = 1;

  function startPage() {
    if (pageCount > 1) pdf.addPage();
    drawHeaderBand(pdf);
    pageCount++;
    y = 12;
  }

  function needPage(needed: number) {
    if (y + needed > H - 25) {
      startPage();
    }
  }

  // ===== PAGE 1 =====
  startPage();

  // ===== LOGO in header band =====
  try {
    pdf.addImage(LOGO_BASE64, 'PNG', mL, 8, 28, 28);
  } catch {
    // fallback: text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(...C.white);
    pdf.text('OpexIA', mL, 26);
  }

  // ===== Document title in header band =====
  const titleText = type === 'devis' ? 'DEVIS' : 'FACTURE';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(...C.white);
  pdf.text(titleText, W - mR, 22, { align: 'right' });

  // Numero under title
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...C.goldLight);
  pdf.text(`N\u00b0 ${numero}`, W - mR, 30, { align: 'right' });

  // Date under numero
  pdf.setFontSize(8.5);
  pdf.setTextColor(180, 175, 195);
  const dateStr = type === 'devis'
    ? fmtDate((doc as Devis).dateCreation)
    : fmtDate((doc as Invoice).dateEmission);
  pdf.text(dateStr, W - mR, 37, { align: 'right' });

  // ===== AFTER HEADER BAND =====
  y = 55;

  // ===== EMETTEUR / DESTINATAIRE =====
  const halfW = cW / 2 - 8;
  const rightX = mL + halfW + 16;

  // Émetteur box
  pdf.setFillColor(...C.bgWarm);
  pdf.roundedRect(mL, y, halfW, 46, 3, 3, 'F');
  pdf.setDrawColor(...C.border);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(mL, y, halfW, 46, 3, 3, 'S');

  // Destinataire box
  pdf.setFillColor(...C.white);
  pdf.roundedRect(rightX, y, halfW, 46, 3, 3, 'F');
  pdf.setDrawColor(...C.blue);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(rightX, y, halfW, 46, 3, 3, 'S');

  // Émetteur header
  const boxPad = 6;
  let eY = y + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...C.muted);
  pdf.text('\u00c9METTEUR', mL + boxPad, eY);

  eY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...C.navy);
  pdf.text(COMPANY.name, mL + boxPad, eY);

  eY += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...C.textLight);
  pdf.text(COMPANY.contact, mL + boxPad, eY);
  eY += 4;
  pdf.text(COMPANY.address, mL + boxPad, eY);
  eY += 4;
  pdf.text(COMPANY.city, mL + boxPad, eY);
  eY += 4;
  pdf.text(COMPANY.country, mL + boxPad, eY);

  // Destinataire header
  let dY = y + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...C.blue);
  pdf.text('DESTINATAIRE', rightX + boxPad, dY);

  dY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...C.navy);
  pdf.text(client.entreprise, rightX + boxPad, dY);

  dY += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...C.textLight);
  if (client.prenom || client.nom) {
    pdf.text(`${client.prenom} ${client.nom}`.trim(), rightX + boxPad, dY);
    dY += 4;
  }
  if (client.adresse) {
    const addrLines = pdf.splitTextToSize(client.adresse, halfW - boxPad * 2);
    addrLines.forEach((line: string) => {
      pdf.text(line, rightX + boxPad, dY);
      dY += 4;
    });
  }
  if (client.email) {
    pdf.text(client.email, rightX + boxPad, dY);
    dY += 4;
  }
  if (client.telephone) {
    pdf.text(client.telephone, rightX + boxPad, dY);
  }

  y += 54;

  // ===== INTRO TEXT (devis only) =====
  if (type === 'devis') {
    y += 4;
    needPage(22);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.text);
    pdf.text('Madame, Monsieur,', mL, y);
    y += 6;

    const introText = `Nous avons le plaisir de vous soumettre notre proposition commerciale pour la mise en place de solutions digitales et IA pour votre \u00e9tablissement ${client.entreprise}.`;
    pdf.setFont('helvetica', 'normal');
    const introLines = pdf.splitTextToSize(introText, cW);
    pdf.text(introLines, mL, y);
    y += introLines.length * 4 + 2;

    if (lignes.length > 1) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.text);
      pdf.text(`Ce devis comprend ${lignes.length} modules compl\u00e9mentaires, activables ind\u00e9pendamment selon vos besoins.`, mL, y);
      pdf.setFont('helvetica', 'normal');
      y += 7;
    } else {
      y += 3;
    }
  } else {
    y += 6;
  }

  // ===== DETAIL TITLE with accent line =====
  needPage(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...C.navy);
  pdf.text('D\u00e9tail des prestations', mL, y);

  // Gold underline accent
  y += 2;
  pdf.setFillColor(...C.gold);
  pdf.rect(mL, y, 40, 0.8, 'F');
  pdf.setFillColor(...C.borderLight);
  pdf.rect(mL + 40, y, cW - 40, 0.3, 'F');
  y += 6;

  // ===== TABLE HEADER =====
  const tColType = { x: mL, w: 20 };
  const tColDesc = { x: mL + 20, w: cW * 0.42 };
  const tColPrix = { x: mL + 20 + cW * 0.42, w: cW * 0.17 };
  const tColQte = { x: mL + 20 + cW * 0.42 + cW * 0.17, w: cW * 0.10 };
  const tColTotal = { x: mL + 20 + cW * 0.42 + cW * 0.17 + cW * 0.10, w: cW * 0.31 - 20 };

  function drawTableHeader() {
    // Dark header row
    pdf.setFillColor(...C.navy);
    pdf.rect(mL, y - 5, cW, 10, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(...C.white);
    pdf.text('Type', tColType.x + 3, y + 0.5);
    pdf.text('Description', tColDesc.x + 3, y + 0.5);
    pdf.text('Prix unitaire HT', tColPrix.x + tColPrix.w, y + 0.5, { align: 'right' });
    pdf.text('Quantit\u00e9', tColQte.x + tColQte.w, y + 0.5, { align: 'right' });
    pdf.text('Total HT', tColTotal.x + tColTotal.w, y + 0.5, { align: 'right' });

    y += 9;
  }

  drawTableHeader();

  // ===== TABLE ROWS =====
  lignes.forEach((ligne, idx) => {
    const descParts = ligne.description.split('\n');
    const displayName = descParts[0];
    const preset = PRESET_MAP[displayName];

    // Estimate height needed
    let neededH = 14;
    if (preset) {
      neededH += 5 + preset.details.length * 4;
      if (preset.pricingNote) neededH += preset.pricingNote.split('\n').length * 4 + 3;
      neededH += 6;
    }

    if (y + neededH > H - 30) {
      startPage();
      y = 52;
      drawTableHeader();
    }

    // Row separator
    if (idx > 0) {
      pdf.setDrawColor(...C.borderLight);
      pdf.setLineWidth(0.3);
      pdf.line(mL, y - 3, mL + cW, y - 3);
    }

    // Alternating subtle background
    if (idx % 2 === 0) {
      pdf.setFillColor(...C.bgWarm);
    } else {
      pdf.setFillColor(...C.white);
    }

    // Type
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.muted);
    pdf.text('Service', tColType.x + 3, y + 1);

    // Module name
    const moduleLabel = type === 'devis'
      ? `MODULE ${idx + 1} \u2014 ${displayName}`
      : displayName;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.navy);

    const maxDW = tColDesc.w - 5;
    const nameLines = pdf.splitTextToSize(moduleLabel, maxDW);
    nameLines.forEach((line: string, li: number) => {
      pdf.text(line, tColDesc.x + 3, y + 1 + li * 4);
    });

    // Price columns
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.text);
    pdf.text(fmt(ligne.prixUnitaire), tColPrix.x + tColPrix.w, y + 1, { align: 'right' });
    pdf.text(String(ligne.quantite), tColQte.x + tColQte.w, y + 1, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.navy);
    pdf.text(fmt(calcTotal(ligne)), tColTotal.x + tColTotal.w, y + 1, { align: 'right' });

    y += Math.max(nameLines.length * 4, 4) + 5;

    // Detailed description if preset
    if (preset) {
      // Description intro
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(...C.textLight);
      const descLines = pdf.splitTextToSize(preset.description, maxDW);
      pdf.text(descLines, tColDesc.x + 5, y);
      y += descLines.length * 3.5 + 2;

      // Bullet points
      preset.details.forEach(detail => {
        if (y > H - 28) {
          startPage();
          y = 52;
          drawTableHeader();
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.textLight);

        // Custom bullet: small blue dash
        pdf.setFillColor(...C.blue);
        pdf.rect(tColDesc.x + 6, y - 1, 2.5, 0.5, 'F');
        pdf.text(detail, tColDesc.x + 11, y);
        y += 3.8;
      });

      y += 2;

      // Pricing note
      if (preset.pricingNote) {
        const noteLines = preset.pricingNote.split('\n');
        noteLines.forEach(noteLine => {
          if (y > H - 28) {
            startPage();
            y = 52;
            drawTableHeader();
          }
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(...C.text);
          pdf.text(noteLine, tColDesc.x + 5, y);
          y += 4;
        });
      }
      y += 4;
    } else {
      // Non-preset: sub-description
      if (descParts.length > 1) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...C.textLight);
        const subLines = pdf.splitTextToSize(descParts.slice(1).join('\n'), maxDW);
        pdf.text(subLines, tColDesc.x + 5, y);
        y += subLines.length * 3.5 + 5;
      } else {
        y += 2;
      }
    }
  });

  // Bottom table line
  pdf.setDrawColor(...C.navy);
  pdf.setLineWidth(0.5);
  pdf.line(mL, y, mL + cW, y);

  // ===== TOTALS =====
  y += 6;
  needPage(30);

  const totalHT = calcTotalHT(lignes);
  const totalTVA = calcTotalTVA(lignes);
  const totalTTC = totalHT + totalTVA;
  const hasTVA = totalTVA > 0;

  const totLabelX = tColPrix.x + tColPrix.w;
  const totValX = W - mR;

  // TVA mention
  if (!hasTVA) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.muted);
    pdf.text('TVA non applicable, art. 293 B du CGI', totValX, y, { align: 'right' });
    y += 6;
  }

  if (hasTVA) {
    // Sous-total HT
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.textLight);
    pdf.text('Sous-total HT', totLabelX, y, { align: 'right' });
    pdf.setTextColor(...C.text);
    pdf.text(fmt(totalHT), totValX, y, { align: 'right' });
    y += 5;

    // TVA
    pdf.setTextColor(...C.textLight);
    pdf.text('TVA', totLabelX, y, { align: 'right' });
    pdf.setTextColor(...C.text);
    pdf.text(fmt(totalTVA), totValX, y, { align: 'right' });
    y += 7;
  }

  // TOTAL box (premium dark with gold accent)
  const totalBoxX = totLabelX - 5;
  const totalBoxW = totValX - totalBoxX + 5;
  pdf.setFillColor(...C.navy);
  pdf.roundedRect(totalBoxX, y - 5, totalBoxW, 14, 2, 2, 'F');

  // Gold accent on left side of total box
  pdf.setFillColor(...C.gold);
  pdf.rect(totalBoxX, y - 5, 1.5, 14, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...C.goldLight);
  pdf.text('TOTAL', totalBoxX + 8, y + 3.5);

  pdf.setTextColor(...C.white);
  pdf.setFontSize(12);
  pdf.text(fmt(totalTTC), totValX - 3, y + 4, { align: 'right' });

  // ===== CONDITIONS + BON POUR ACCORD =====
  y += 22;

  if (type === 'devis') {
    needPage(85);

    const condX = mL;
    const bonX = W / 2 + 5;

    // === Conditions ===
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...C.navy);
    pdf.text('Conditions', condX, y);

    // Gold underline
    pdf.setFillColor(...C.gold);
    pdf.rect(condX, y + 2, 25, 0.6, 'F');

    // === Bon pour accord ===
    pdf.text('Bon pour accord', bonX, y);
    pdf.setFillColor(...C.gold);
    pdf.rect(bonX, y + 2, 32, 0.6, 'F');

    y += 10;
    const condStartY = y;

    // Conditions details
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Conditions de r\u00e8glement :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.textLight);
    pdf.text('\u00c0 r\u00e9ception', condX + 42, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Mode de r\u00e8glement :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.textLight);
    pdf.text('Virement bancaire', condX + 35, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Validit\u00e9 du devis :', condX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.textLight);
    pdf.text('30 jours', condX + 32, y);

    // Notes
    y += 7;
    const notes = (doc as Devis).notes;
    if (notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...C.text);
      pdf.text('Notes :', condX, y);
      y += 4;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.textLight);
      const nLines = pdf.splitTextToSize(notes, W / 2 - mL - 10);
      pdf.text(nLines, condX, y);
      y += nLines.length * 3.5 + 4;
    }

    // Closing text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.textLight);
    pdf.text('Ce devis est valable 30 jours \u00e0 compter de sa date d\'\u00e9mission.', condX, y);
    y += 4;
    pdf.text('Nous restons \u00e0 votre disposition pour toute question.', condX, y);
    y += 6;
    pdf.setFont('helvetica', 'italic');
    pdf.text('Cordialement,', condX, y);
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...C.navy);
    pdf.text('L\'\u00e9quipe OpexIA Agency', condX, y);

    // === Bon pour accord section ===
    let bonY = condStartY;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...C.text);
    pdf.text('\u00c0', bonX, bonY);
    // Underlines
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
    pdf.setFontSize(8);
    pdf.setTextColor(...C.muted);
    pdf.text('Signature et cachet', bonX, bonY);

    bonY += 3;
    // Signature box with subtle styling
    pdf.setDrawColor(...C.border);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(...C.bg);
    pdf.roundedRect(bonX, bonY, W - mR - bonX, 25, 2, 2, 'FD');

    bonY += 30;
    pdf.setTextColor(...C.muted);
    pdf.text('Qualit\u00e9 de signataire', bonX, bonY);
    bonY += 3;
    pdf.setDrawColor(...C.border);
    pdf.line(bonX, bonY, W - mR, bonY);

  } else {
    // ===== FACTURE CONDITIONS =====
    needPage(40);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...C.navy);
    pdf.text('Conditions de paiement', mL, y);
    pdf.setFillColor(...C.gold);
    pdf.rect(mL, y + 2, 40, 0.6, 'F');

    y += 10;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Conditions de r\u00e8glement :', mL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.textLight);
    pdf.text('\u00c0 r\u00e9ception', mL + 42, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('Mode de r\u00e8glement :', mL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.textLight);
    pdf.text('Virement bancaire', mL + 35, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.text);
    pdf.text('\u00c9ch\u00e9ance :', mL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.textLight);
    pdf.text(fmtDate((doc as Invoice).dateEcheance), mL + 20, y);

    y += 8;
    const invNotes = (doc as Invoice).description;
    if (invNotes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.text);
      pdf.text('Notes :', mL, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.textLight);
      const nLines = pdf.splitTextToSize(invNotes, cW);
      pdf.text(nLines, mL, y);
      y += nLines.length * 3.5 + 4;
    }

    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.textLight);
    pdf.text('En cas de retard de paiement, des p\u00e9nalit\u00e9s seront appliqu\u00e9es conform\u00e9ment \u00e0 la loi.', mL, y);
    y += 6;
    pdf.setFont('helvetica', 'italic');
    pdf.text('Cordialement,', mL, y);
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...C.navy);
    pdf.text('L\'\u00e9quipe OpexIA Agency', mL, y);
  }

  // ===== DRAW FOOTERS ON ALL PAGES =====
  totalPagesEst = pageCount;
  const numPages = pdf.getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    pdf.setPage(p);
    drawFooterBand(pdf, numero, type, p, totalPagesEst);
  }

  // ===== DOWNLOAD =====
  const filename = `${type === 'devis' ? 'Devis' : 'Facture'}_${numero}.pdf`;
  pdf.save(filename);
}
