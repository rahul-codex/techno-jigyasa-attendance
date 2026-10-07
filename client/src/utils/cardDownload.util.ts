import type { StudentUser } from '../types/auth.types';

/**
 * Downloads a single QR code image directly.
 */
export const downloadSingleQr = (qrDataUrl: string, erpId: string) => {
  const link = document.createElement('a');
  link.href = qrDataUrl;
  link.download = `techno-jigyasa-qr-${erpId.toLowerCase()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Helper to load an image into an HTMLImageElement asynchronously.
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
};

/**
 * Generates and downloads a high-resolution, print-ready Techno Jigyasa Club Digital ID Card.
 */
export const downloadStudentIdCard = async (
  student: StudentUser,
  qrDataUrl: string
) => {
  const width = 800;
  const height = 1200;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Card Background: Deep slate gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#0f172a');
  bgGradient.addColorStop(0.5, '#090d16');
  bgGradient.addColorStop(1, '#020617');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative Top Glowing Ribbon & Header
  const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
  headerGradient.addColorStop(0, '#4f46e5');
  headerGradient.addColorStop(0.5, '#6366f1');
  headerGradient.addColorStop(1, '#06b6d4');
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, width, 16);

  // Subtle Outer Border
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // 3. Header Branding
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TECHNO JIGYASA CLUB', width / 2, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 32px Inter, system-ui, sans-serif';
  ctx.fillText('SMART ATTENDANCE PASS', width / 2, 115);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 16px Inter, system-ui, sans-serif';
  ctx.fillText('Official Club Identity & Verification Card', width / 2, 145);

  // Divider
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 170);
  ctx.lineTo(width - 80, 170);
  ctx.stroke();

  // 4. Student Profile Photo
  const photoSize = 180;
  const photoX = width / 2 - photoSize / 2;
  const photoY = 200;

  // Outer circular glow ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(width / 2, photoY + photoSize / 2, photoSize / 2 + 6, 0, Math.PI * 2);
  ctx.fillStyle = '#4f46e5';
  ctx.fill();

  // Inner circle clip for photo
  ctx.beginPath();
  ctx.arc(width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
  ctx.clip();

  if (student.profileImage) {
    try {
      const photoImg = await loadImage(`http://localhost:5000${student.profileImage}`);
      ctx.drawImage(photoImg, photoX, photoY, photoSize, photoSize);
    } catch {
      // Fallback if image fails to load
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(photoX, photoY, photoSize, photoSize);
      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 64px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(student.name?.charAt(0).toUpperCase() || 'S', width / 2, photoY + 115);
    }
  } else {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(photoX, photoY, photoSize, photoSize);
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 64px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(student.name?.charAt(0).toUpperCase() || 'S', width / 2, photoY + 115);
  }
  ctx.restore();

  // 5. Student Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(student.name || 'Student Name', width / 2, 435);

  // ERP ID Badge
  const erpText = `ERP ID: ${student.erpId}`;
  ctx.font = 'bold 20px monospace';
  const erpWidth = ctx.measureText(erpText).width + 36;
  const erpY = 465;

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(width / 2 - erpWidth / 2, erpY, erpWidth, 38, 10);
  ctx.fill();
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.fillText(erpText, width / 2, erpY + 26);

  // 6. Department & Section Info Bar
  const deptY = 535;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  const deptStr = `${student.department || 'BCA'}  •  Section ${student.section || 'A'}`;
  ctx.fillText(deptStr, width / 2, deptY);

  // Version indicator
  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px monospace';
  ctx.fillText(`Pass Security Version: v${student.qrTokenVersion}`, width / 2, deptY + 30);

  // 7. QR Code Box & Rendering
  const qrBoxSize = 340;
  const qrBoxX = width / 2 - qrBoxSize / 2;
  const qrBoxY = 600;

  // White rounded container for maximum scanner contrast
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
  ctx.fill();

  // Draw QR code image onto canvas
  try {
    const qrImg = await loadImage(qrDataUrl);
    const qrPadding = 20;
    ctx.drawImage(
      qrImg,
      qrBoxX + qrPadding,
      qrBoxY + qrPadding,
      qrBoxSize - qrPadding * 2,
      qrBoxSize - qrPadding * 2
    );
  } catch (err) {
    console.error('Could not render QR code on canvas:', err);
  }

  // 8. Security & Instructions
  const instructY = 990;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 17px Inter, system-ui, sans-serif';
  ctx.fillText('Scan by authorized club administrator only.', width / 2, instructY);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px Inter, system-ui, sans-serif';
  ctx.fillText('Tamper-evident cryptographically signed digital token.', width / 2, instructY + 28);

  // 9. Card Footer
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, height - 70, width, 70);

  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText('TECHNO JIGYASA CLUB  •  SMART ATTENDANCE SYSTEM', width / 2, height - 32);

  // 10. Trigger Download
  const cardDataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = cardDataUrl;
  link.download = `techno-jigyasa-card-${student.erpId.toLowerCase()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
