/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Generates high-fidelity sample documents for testing the processing pipeline:
 * 1. Sample e-Aadhaar Document (Standard letter format with bottom cut-out card)
 * 2. Sample e-PAN Document (Standard NSDL format)
 * 3. Sample Angled Mobile Photo (Simulating camera capture with background desk to test deskewing)
 */

import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  CR80_WIDTH_PX,
  CR80_HEIGHT_PX,
  warpQuadrilateralToCard,
  Quadrilateral
} from './canvasUtils';

/**
 * Creates an ultra-realistic sample e-Aadhaar A4 sheet with the official bottom card format.
 */
export function generateSampleAadhaarCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = A4_WIDTH_PX;
  canvas.height = A4_HEIGHT_PX;
  const ctx = canvas.getContext('2d')!;

  // Fill White Paper Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

  // --- Top Letterhead (Government of India / UIDAI) ---
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(140, 100, A4_WIDTH_PX - 280, 20);

  // Ashoka Emblem placeholder / Header text
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GOVERNMENT OF INDIA / UIDAI', A4_WIDTH_PX / 2, 220);
  ctx.font = '500 28px system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Unique Identification Authority of India · Aadhaar Authentication Letter', A4_WIDTH_PX / 2, 270);

  // Letter body text lines (Simulated official letter)
  ctx.fillStyle = '#1e293b';
  ctx.font = '400 24px monospace';
  ctx.textAlign = 'left';
  const letterY = 380;
  ctx.fillText('Enrollment No: 1042/89201/04912          Generation Date: 14/08/2024', 180, letterY);
  ctx.fillText('To:                                      Download Date:   30/09/2026', 180, letterY + 45);
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('RAJESH KUMAR SHARMA', 180, letterY + 95);
  ctx.font = '400 22px system-ui, sans-serif';
  ctx.fillText('S/O RAMESHWAR SHARMA, PLOT NO. 42, GREEN PARK RESIDENCY,', 180, letterY + 135);
  ctx.fillText('SECTOR 15, INDIRAPURAM, GHAZIABAD, UTTAR PRADESH - 201014', 180, letterY + 170);

  // Barcode simulation
  ctx.fillStyle = '#000000';
  let bx = 180;
  for (let i = 0; i < 60; i++) {
    const barW = (i % 3 === 0) ? 6 : (i % 2 === 0 ? 3 : 2);
    ctx.fillRect(bx, letterY + 220, barW, 45);
    bx += barW + 4;
  }

  // Horizontal Scissor Cut Line
  const cutY = 2280;
  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(100, cutY);
  ctx.lineTo(A4_WIDTH_PX - 100, cutY);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✂ CUT HERE / यहाँ से काटें · CROP SECTION BELOW FOR LAMINATION', A4_WIDTH_PX / 2, cutY - 18);
  ctx.restore();

  // --- BOTTOM STRIP: FRONT & BACK CARDS ---
  // Coordinates match DOCUMENT_PRESETS[0]
  // Front: x: 0.048 (119px), y: 0.672 (2357px), w: 0.438 (1086px), h: 0.282 (989px) -> inside card is ~1012x638
  const frontX = Math.round(0.048 * A4_WIDTH_PX);
  const frontY = Math.round(0.672 * A4_HEIGHT_PX);
  const backX = Math.round(0.514 * A4_WIDTH_PX);
  const backY = Math.round(0.672 * A4_HEIGHT_PX);

  // Render Front Aadhaar Card
  drawSampleAadhaarFront(ctx, frontX + 36, frontY + 30, CR80_WIDTH_PX, CR80_HEIGHT_PX);

  // Render Back Aadhaar Card
  drawSampleAadhaarBack(ctx, backX + 36, backY + 30, CR80_WIDTH_PX, CR80_HEIGHT_PX);

  return canvas;
}

/**
 * Draws Front Side of Aadhaar Card.
 */
function drawSampleAadhaarFront(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  // Card base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Header band (Tricolor subtle wash)
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#fff7ed');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(1, '#f0fdf4');
  ctx.fillStyle = grad;
  ctx.fillRect(x + 2, y + 2, w - 4, 110);

  // Government Emblem & Title
  ctx.fillStyle = '#b91c1c';
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('भारत सरकार', x + 110, y + 42);
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('GOVERNMENT OF INDIA', x + 110, y + 74);

  // Avatar Photo Box
  const photoX = x + 40;
  const photoY = y + 130;
  const photoW = 220;
  const photoH = 270;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Stylized Avatar Silhouette
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(photoX + photoW / 2, photoY + 95, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(photoX + photoW / 2, photoY + 230, 75, 60, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Details
  const infoX = x + 300;
  let infoY = y + 155;

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('नाम / Name: RAJESH KUMAR SHARMA', infoX, infoY);
  infoY += 42;
  ctx.fillText('जन्म तिथि / DOB: 12/05/1990', infoX, infoY);
  infoY += 42;
  ctx.fillText('लिंग / Gender: पुरुष / MALE', infoX, infoY);

  // Hologram / Ghost Emblem
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + w - 120, y + 135, 80, 80);
  ctx.fillStyle = '#fef3c7';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UIDAI', x + w - 80, y + 180);

  // Aadhaar 12-Digit Number (Bottom Ribbon)
  const ribbonY = y + h - 145;
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x + 2, ribbonY, w - 4, 8);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 46px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('4829  1049  8201', x + w / 2, y + h - 75);

  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillStyle = '#b91c1c';
  ctx.fillText('मेरा आधार, मेरी पहचान', x + w / 2, y + h - 30);

  ctx.restore();
}

/**
 * Draws Back Side of Aadhaar Card.
 */
function drawSampleAadhaarBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  // Card base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x + 2, y + 2, w - 4, 80);
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('भारतीय विशिष्ट पहचान प्राधिकरण', x + 40, y + 36);
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Unique Identification Authority of India', x + 40, y + 62);

  // Address Section
  const addrX = x + 40;
  let addrY = y + 125;
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText('पता / Address:', addrX, addrY);
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  addrY += 32;
  ctx.fillText('आत्मज: रामेश्वर शर्मा, प्लॉट नं 42,', addrX, addrY);
  addrY += 28;
  ctx.fillText('ग्रीन पार्क रेजिडेंसी, सेक्टर 15,', addrX, addrY);
  addrY += 28;
  ctx.fillText('इंदिरापुरम, गाजियाबाद, उत्तर प्रदेश - 201014', addrX, addrY);
  addrY += 36;
  ctx.fillText('S/O: Rameshwar Sharma, Plot No 42,', addrX, addrY);
  addrY += 28;
  ctx.fillText('Green Park Residency, Sector 15,', addrX, addrY);
  addrY += 28;
  ctx.fillText('Indirapuram, Ghaziabad, UP - 201014', addrX, addrY);

  // Simulated Secure QR Code
  const qrX = x + w - 290;
  const qrY = y + 115;
  const qrSize = 250;
  drawSimulatedQrCode(ctx, qrX, qrY, qrSize);

  // Bottom Ribbon & Aadhaar Number
  const ribbonY = y + h - 120;
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x + 2, ribbonY, w - 4, 6);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('4829  1049  8201', x + w / 2, y + h - 60);

  ctx.font = '500 16px system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Help: 1947 · help@uidai.gov.in · www.uidai.gov.in', x + w / 2, y + h - 22);

  ctx.restore();
}

/**
 * Draws a simulated high-density QR code matrix for crystal-clear 300 DPI test.
 */
function drawSimulatedQrCode(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  const modules = 29;
  const modSize = size / modules;
  ctx.fillStyle = '#000000';

  // Deterministic pattern
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Finder patterns (top-left, top-right, bottom-left)
      const inTL = r < 7 && c < 7;
      const inTR = r < 7 && c >= modules - 7;
      const inBL = r >= modules - 7 && c < 7;

      if (inTL || inTR || inBL) {
        const localR = inBL ? r - (modules - 7) : r;
        const localC = inTR ? c - (modules - 7) : c;
        if (
          localR === 0 || localR === 6 || localC === 0 || localC === 6 ||
          (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4)
        ) {
          ctx.fillRect(x + c * modSize, y + r * modSize, modSize, modSize);
        }
      } else {
        // Pseudo-random data modules based on coordinate hash
        const val = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
        if ((val - Math.floor(val)) > 0.45) {
          ctx.fillRect(x + c * modSize, y + r * modSize, modSize, modSize);
        }
      }
    }
  }
  ctx.restore();
}

/**
 * Creates an angled mobile photograph with a wooden background to test
 * the auto-contour corner detection and 300 DPI homography deskewing engine.
 */
export function generateSampleAngledMobilePhoto(): { canvas: HTMLCanvasElement; trueQuad: Quadrilateral } {
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw realistic wooden desk surface
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Wood grain strokes
  ctx.strokeStyle = 'rgba(62, 39, 35, 0.4)';
  ctx.lineWidth = 18;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 80 + Math.sin(i) * 20);
    ctx.bezierCurveTo(600, i * 80 + 40, 1200, i * 80 - 30, 1800, i * 80 + 10);
    ctx.stroke();
  }

  // 2. Generate a source card rendered flat first
  const flatCard = document.createElement('canvas');
  flatCard.width = CR80_WIDTH_PX;
  flatCard.height = CR80_HEIGHT_PX;
  const fCtx = flatCard.getContext('2d')!;
  drawSampleAadhaarFront(fCtx, 0, 0, CR80_WIDTH_PX, CR80_HEIGHT_PX);

  // 3. Define an angled quadrilateral (skewed card on desk)
  const trueQuad: Quadrilateral = [
    { x: 340, y: 260 },   // Top-Left
    { x: 1420, y: 190 },  // Top-Right
    { x: 1530, y: 980 },  // Bottom-Right
    { x: 260, y: 1040 },  // Bottom-Left
  ];

  // Draw soft drop shadow under skewed card
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.filter = 'blur(16px)';
  ctx.beginPath();
  ctx.moveTo(trueQuad[0].x + 15, trueQuad[0].y + 25);
  ctx.lineTo(trueQuad[1].x + 15, trueQuad[1].y + 25);
  ctx.lineTo(trueQuad[2].x + 15, trueQuad[2].y + 25);
  ctx.lineTo(trueQuad[3].x + 15, trueQuad[3].y + 25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Render the card onto this quadrilateral using triangle warp
  // Using 2 triangles from flatCard to skewed quad
  const [p0, p1, p2, p3] = trueQuad;

  // Triangle 1: (0,0)->p0, (CR80_WIDTH_PX, 0)->p1, (0, CR80_HEIGHT_PX)->p3
  warpTriangleDirect(ctx, flatCard,
    p0.x, p0.y, p1.x, p1.y, p3.x, p3.y,
    0, 0, CR80_WIDTH_PX, 0, 0, CR80_HEIGHT_PX
  );

  // Triangle 2: (CR80_WIDTH_PX, CR80_HEIGHT_PX)->p2, (0, CR80_HEIGHT_PX)->p3, (CR80_WIDTH_PX, 0)->p1
  warpTriangleDirect(ctx, flatCard,
    p2.x, p2.y, p3.x, p3.y, p1.x, p1.y,
    CR80_WIDTH_PX, CR80_HEIGHT_PX, 0, CR80_HEIGHT_PX, CR80_WIDTH_PX, 0
  );

  // Add subtle camera vignette & glare
  const grad = ctx.createRadialGradient(900, 675, 400, 900, 675, 1100);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return { canvas, trueQuad };
}

function warpTriangleDirect(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  dx0: number, dy0: number, dx1: number, dy1: number, dx2: number, dy2: number,
  sx0: number, sy0: number, sx1: number, sy1: number, sx2: number, sy2: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();

  const deltaX1 = dx1 - dx0;
  const deltaY1 = dy1 - dy0;
  const deltaX2 = dx2 - dx0;
  const deltaY2 = dy2 - dy0;
  const det = deltaX1 * deltaY2 - deltaX2 * deltaY1;
  if (Math.abs(det) < 1e-7) {
    ctx.restore();
    return;
  }

  const sDeltaX1 = sx1 - sx0;
  const sDeltaY1 = sy1 - sy0;
  const sDeltaX2 = sx2 - sx0;
  const sDeltaY2 = sy2 - sy0;

  const a = (sDeltaX1 * deltaY2 - sDeltaX2 * deltaY1) / det;
  const b = (sDeltaY1 * deltaY2 - sDeltaY2 * deltaY1) / det;
  const c = (deltaX1 * sDeltaX2 - deltaX2 * sDeltaX1) / det;
  const d = (deltaX1 * sDeltaY2 - deltaX2 * sDeltaY1) / det;
  const e = sx0 - a * dx0 - c * dy0;
  const f = sy0 - b * dx0 - d * dy0;

  const idet = 1 / (a * d - b * c);
  ctx.transform(d * idet, -b * idet, -c * idet, a * idet, (c * f - d * e) * idet, (b * e - a * f) * idet);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
