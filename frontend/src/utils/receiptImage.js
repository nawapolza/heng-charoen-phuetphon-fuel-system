import { date, money, number, parseDecimal, roundDecimal } from './format.js';

function safeText(value, fallback = '-') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function litersValue(row = {}) {
  return roundDecimal(row.quantity_liters || row.station_liters || row.liters || 0, 2);
}

function priceValue(row = {}) {
  return parseDecimal(row.price_baht_per_liter || row.price_per_liter, 0);
}

function amountValue(row = {}) {
  const liters = litersValue(row);
  const price = priceValue(row);
  if (liters > 0 && price > 0) return roundDecimal(liters * price, 2);
  return parseDecimal(row.amount_baht, 0);
}

function fuelRateValue(row = {}) {
  const saved = parseDecimal(row.fuel_efficiency_km_per_liter, 0);
  if (saved > 0) return saved;
  const distance = parseDecimal(row.distance_km, 0);
  const liters = litersValue(row);
  return distance > 0 && liters > 0 ? roundDecimal(distance / liters, 2) : 0;
}

function incomeValue(row = {}, key) {
  return Math.max(0, roundDecimal(parseDecimal(row[key], 0), 2));
}

function totalIncomeValue(row = {}) {
  const calculated = incomeValue(row, 'trip_fee_baht') + incomeValue(row, 'allowance_baht') + incomeValue(row, 'other_income_baht');
  return calculated > 0 ? roundDecimal(calculated, 2) : incomeValue(row, 'total_income_baht');
}

function kgText(value) {
  const kg = parseDecimal(value, 0);
  return kg > 0 ? `${number(kg, Number.isInteger(kg) ? 0 : 2)} กิโลกรัม` : '-';
}

function fillDateText(row = {}) {
  return `${date(row.fill_date || row.work_date)}${row.fill_time ? ` เวลา ${row.fill_time}` : ''}`;
}

function routePlace(value, fallback = '-') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function routeSummaryText(row = {}) {
  return `${routePlace(row.origin_place, 'ไม่ระบุจุดขึ้นงาน')} → ${routePlace(row.destination_place, 'ไม่ระบุจุดลงงาน')}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawText(ctx, text, x, y, maxWidth, opts = {}) {
  const { size = 34, weight = 800, color = '#0f172a', align = 'left', lineHeight = 1.25 } = opts;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  const raw = String(text || '-');
  const words = raw.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !current) current = test;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  const maxLines = opts.maxLines || 3;
  const lh = size * lineHeight;
  lines.slice(0, maxLines).forEach((line, i) => ctx.fillText(line, x, y + i * lh, maxWidth));
  return y + Math.min(lines.length, maxLines) * lh;
}

function drawPill(ctx, x, y, text, bg, color, w = 156) {
  ctx.fillStyle = bg;
  roundedRect(ctx, x, y, w, 54, 27);
  ctx.fill();
  drawText(ctx, text, x + 22, y + 14, w - 44, { size: 23, weight: 900, color, maxLines: 1 });
}

function drawRouteBar(ctx, x, y, w, row = {}) {
  const origin = routePlace(row.origin_place, 'ไม่ระบุจุดขึ้นงาน');
  const destination = routePlace(row.destination_place, 'ไม่ระบุจุดลงงาน');
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  roundedRect(ctx, x, y, w, 160, 34);
  ctx.fill();
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPill(ctx, x + 24, y + 20, 'เส้นทางงาน', '#eff6ff', '#1d4ed8', 150);
  drawText(ctx, `${origin} → ${destination}`, x + 24, y + 78, w - 48, { size: 29, weight: 950, color: '#0f172a', maxLines: 1, lineHeight: 1.1 });
  drawText(ctx, `ขึ้นงาน: ${origin}`, x + 24, y + 116, w / 2 - 36, { size: 20, weight: 900, color: '#1d4ed8', maxLines: 1 });
  drawText(ctx, `ลงงาน: ${destination}`, x + w / 2, y + 116, w / 2 - 24, { size: 20, weight: 900, color: '#047857', maxLines: 1 });
}

function drawSectionTitle(ctx, x, y, title, subtitle, accent = '#2563eb') {
  ctx.fillStyle = accent;
  roundedRect(ctx, x, y + 1, 12, 66, 6);
  ctx.fill();
  drawText(ctx, title, x + 30, y, 500, { size: 38, weight: 950, color: '#0f172a', maxLines: 1 });
  drawText(ctx, subtitle, x + 30, y + 46, 720, { size: 23, weight: 800, color: '#64748b', maxLines: 1 });
}

function drawSummaryCard(ctx, x, y, w, h, label, value, tone = 'slate') {
  const tones = {
    slate: ['#f8fafc', '#e2e8f0', '#0f172a', '#64748b'],
    blue: ['#eff6ff', '#bfdbfe', '#1e3a8a', '#3b82f6'],
    green: ['#ecfdf5', '#a7f3d0', '#064e3b', '#10b981'],
  };
  const [bg, border, color, labelColor] = tones[tone] || tones.slate;
  ctx.shadowColor = 'rgba(15,23,42,.05)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = bg;
  roundedRect(ctx, x, y, w, h, 30);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, x + 26, y + 22, w - 52, { size: 24, weight: 900, color: labelColor, maxLines: 1 });
  drawText(ctx, value, x + 26, y + 62, w - 52, { size: 34, weight: 950, color, maxLines: 2, lineHeight: 1.12 });
}

function drawMiniCard(ctx, x, y, w, h, label, value) {
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, x, y, w, h, 26);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, x + 22, y + 18, w - 44, { size: 23, weight: 900, color: '#94a3b8', maxLines: 1 });
  drawText(ctx, value, x + 22, y + 54, w - 44, { size: 31, weight: 950, color: '#0f172a', maxLines: 1 });
}

function drawClosingRow(ctx, x, y, w, prefix, label, value) {
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, x, y, w, 104, 24);
  ctx.fill();
  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = prefix === 'ลงงาน' ? '#d1fae5' : '#dbeafe';
  roundedRect(ctx, x + 18, y + 21, 96, 62, 20);
  ctx.fill();
  drawText(ctx, prefix, x + 32, y + 37, 70, { size: 21, weight: 950, color: prefix === 'ลงงาน' ? '#047857' : '#1d4ed8', maxLines: 1 });
  drawText(ctx, label, x + 132, y + 17, 468, { size: 28, weight: 950, color: '#1e293b', maxLines: 2, lineHeight: 1.08 });
  drawText(ctx, value, x + w - 34, y + 33, 240, { size: 28, weight: 950, color: '#0f172a', align: 'right', maxLines: 1 });
}

function drawIncomeRow(ctx, x, y, w, label, value, total = false) {
  ctx.fillStyle = total ? '#bbf7d0' : '#ffffff';
  roundedRect(ctx, x, y, w, total ? 92 : 76, 22);
  ctx.fill();
  if (!total) {
    ctx.strokeStyle = '#d1fae5';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  drawText(ctx, label, x + 24, y + (total ? 25 : 20), 430, { size: total ? 30 : 27, weight: 950, color: total ? '#064e3b' : '#334155', maxLines: 1 });
  drawText(ctx, `${number(value, 2)} บาท`, x + w - 24, y + (total ? 23 : 19), 300, { size: total ? 32 : 29, weight: 950, color: total ? '#064e3b' : '#0f172a', align: 'right', maxLines: 1 });
}

export async function createReceiptImageBlob(row = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 2920;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#eaf3ff');
  bg.addColorStop(0.48, '#f8fafc');
  bg.addColorStop(1, '#ecfdf5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, 42, 42, 996, 2836, 58);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.stroke();

  const header = ctx.createLinearGradient(42, 42, 1038, 440);
  header.addColorStop(0, '#ffffff');
  header.addColorStop(1, '#dbeafe');
  ctx.fillStyle = header;
  roundedRect(ctx, 42, 42, 996, 540, 58);
  ctx.fill();

  try {
    const logo = await loadImage('/logo-heng.png');
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, 90, 94, 150, 150, 34);
    ctx.fill();
    ctx.shadowColor = 'rgba(15,23,42,.18)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.drawImage(logo, 106, 110, 118, 118);
    ctx.shadowColor = 'transparent';
  } catch (_) {
    ctx.fillStyle = '#0b63ce';
    roundedRect(ctx, 90, 94, 150, 150, 34);
    ctx.fill();
    drawText(ctx, 'HENG', 108, 145, 120, { size: 38, weight: 950, color: '#fff', maxLines: 1 });
  }

  drawText(ctx, 'HENG CHAROEN PHUETPHON', 280, 92, 460, { size: 28, weight: 950, color: '#0b63ce', maxLines: 1 });
  drawText(ctx, 'สรุปปิดงาน', 280, 138, 560, { size: 66, weight: 950, color: '#020617', maxLines: 1 });
  drawText(ctx, 'น้ำหนักสินค้า รายได้ และรายละเอียดน้ำมัน', 280, 220, 600, { size: 27, weight: 850, color: '#64748b', maxLines: 1 });
  drawPill(ctx, 802, 94, 'บันทึกแล้ว', '#d1fae5', '#047857', 178);

  const plate = safeText(row.plate_no, '-');
  const driver = safeText(row.driver_name || row.driver_name_input, '-');
  drawText(ctx, plate, 90, 326, 520, { size: 76, weight: 950, color: '#020617', maxLines: 1 });
  drawPill(ctx, 418, 344, safeText(row.item_type, '-'), '#dbeafe', '#1d4ed8', 130);
  drawPill(ctx, 580, 344, safeText(row.operation_type, 'ทำน้ำมันบรรทุก'), '#e0f2fe', '#0369a1', 255);
  drawText(ctx, `คนขับ: ${driver}`, 90, 442, 880, { size: 32, weight: 900, color: '#334155', maxLines: 1 });
  drawRouteBar(ctx, 90, 504, 900, row);

  let y = 684;
  drawSectionTitle(ctx, 90, y, 'สรุปขึ้นงาน / ลงงาน', `${safeText(row.cargo_name, 'รายละเอียดเที่ยวงาน')} · ${routeSummaryText(row)}`, '#0284c7');
  y += 92;
  ctx.fillStyle = '#f0f9ff';
  roundedRect(ctx, 90, y, 900, 270, 38);
  ctx.fill();
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawClosingRow(ctx, 116, y + 22, 848, 'ขึ้นงาน', safeText(row.origin_place, 'จุดรับสินค้า / บ่อต้นทาง'), kgText(row.loading_weight_kg));
  drawClosingRow(ctx, 116, y + 144, 848, 'ลงงาน', safeText(row.destination_place, 'จุดลงงาน / ปลายทาง'), kgText(row.unloading_weight_kg));

  y += 310;
  drawSectionTitle(ctx, 90, y, 'รายได้เที่ยวนี้', 'ระบบคำนวณรวมให้อัตโนมัติ', '#059669');
  y += 92;
  ctx.fillStyle = '#ecfdf5';
  roundedRect(ctx, 90, y, 900, 372, 38);
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 2;
  ctx.stroke();
  const tripFee = incomeValue(row, 'trip_fee_baht');
  const allowance = incomeValue(row, 'allowance_baht');
  const otherIncome = incomeValue(row, 'other_income_baht');
  const totalIncome = totalIncomeValue(row);
  drawIncomeRow(ctx, 116, y + 22, 848, 'ค่าเที่ยว', tripFee);
  drawIncomeRow(ctx, 116, y + 110, 848, 'เบี้ยเลี้ยง', allowance);
  drawIncomeRow(ctx, 116, y + 198, 848, 'รายได้อื่น', otherIncome);
  drawIncomeRow(ctx, 116, y + 286, 848, 'รวมรายได้', totalIncome, true);

  y += 416;
  drawSectionTitle(ctx, 90, y, 'รายละเอียดน้ำมัน', 'ข้อมูลที่ใช้คำนวณและตรวจสอบเที่ยวงาน', '#2563eb');
  y += 92;

  const liters = litersValue(row);
  const price = priceValue(row);
  const amount = amountValue(row);
  const distance = parseDecimal(row.distance_km, 0);
  const rate = fuelRateValue(row);
  const before = safeText(row.station_meter_before || row.odometer_before, '-');
  const after = safeText(row.station_meter_after || row.odometer_after, '-');
  const recorder = safeText(row.recorder_name || row.employee_name, '-');

  const colW = 438;
  const gap = 24;
  const cardH = 134;
  const x1 = 90;
  const x2 = x1 + colW + gap;
  drawSummaryCard(ctx, x1, y, colW, cardH, 'วันที่/เวลาเติม', fillDateText(row));
  drawSummaryCard(ctx, x2, y, colW, cardH, 'จำนวนลิตรตามเรท', liters ? `${number(liters, 2)} ลิตร` : '-', 'blue');
  y += cardH + gap;
  drawSummaryCard(ctx, x1, y, colW, cardH, 'ยอดเงินตามเรท', money(amount), 'blue');
  drawSummaryCard(ctx, x2, y, colW, cardH, 'ราคาน้ำมันลิตรละ', price ? `${number(price, 2)} บาท` : '-', 'green');
  y += cardH + gap;
  drawSummaryCard(ctx, x1, y, colW, cardH, 'ระยะทางที่กรอก', distance ? `${number(distance, 2)} กม.` : '-');
  drawSummaryCard(ctx, x2, y, colW, cardH, 'อัตราประจำรถ', rate ? `${number(rate, 2)} กม./ลิตร` : '-', 'green');

  y += cardH + 34;
  ctx.fillStyle = '#f8fafc';
  roundedRect(ctx, 90, y, 900, 302, 38);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawMiniCard(ctx, 116, y + 28, 414, 108, 'หัวจ่ายก่อน', before);
  drawMiniCard(ctx, 550, y + 28, 414, 108, 'หัวจ่ายหลัง', after);
  drawMiniCard(ctx, 116, y + 164, 414, 108, 'จำนวนลิตรตามเรท', liters ? `${number(liters, 2)} ลิตร` : '-');
  drawMiniCard(ctx, 550, y + 164, 414, 108, 'ผู้กรอก', recorder);

  const photoCount = [
    row.bill_photos, row.bill_photo, row.receipt_photo,
    row.document_photos, row.document_photo,
    row.oil_photos, row.oil_photo,
    row.cargo_photos, row.cargo_photo,
    row.adblue_photos, row.adblue_photo,
  ].flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).length;
  y += 332;
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, 90, y, 900, 128, 34);
  ctx.fill();
  ctx.strokeStyle = '#e5e7eb';
  ctx.stroke();
  drawText(ctx, 'รูปภาพแนบ', 122, y + 24, 380, { size: 31, weight: 950, color: '#0f172a', maxLines: 1 });
  drawText(ctx, `แนบทั้งหมด ${photoCount} ไฟล์`, 122, y + 70, 420, { size: 25, weight: 850, color: '#64748b', maxLines: 1 });
  drawPill(ctx, 758, y + 37, `${photoCount} ไฟล์`, '#dbeafe', '#1d4ed8', 190);

  drawText(ctx, 'สร้างจากระบบจัดการน้ำมัน เฮงเจริญพืชผล', 90, 2782, 620, { size: 25, weight: 850, color: '#64748b', maxLines: 1 });
  drawText(ctx, new Date().toLocaleString('th-TH'), 90, 2820, 620, { size: 22, weight: 700, color: '#94a3b8', maxLines: 1 });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('สร้างรูปสรุปปิดงานไม่สำเร็จ'));
    }, 'image/png', 0.95);
  });
}

function receiptFileName(row = {}) {
  return `สรุปปิดงาน_${safeText(row.plate_no, 'receipt')}_${Date.now()}.png`.replace(/[\\/:*?"<>|\s]+/g, '-');
}

function isiOSLike() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.position = 'fixed';
  a.style.left = '-9999px';
  a.style.top = '0';
  document.body.appendChild(a);
  a.click();


  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 6500);
}

export async function createReceiptImageFile(row = {}) {
  const blob = await createReceiptImageBlob(row);
  const fileName = receiptFileName(row);
  try {
    return new File([blob], fileName, { type: 'image/png', lastModified: Date.now() });
  } catch (_) {
    blob.name = fileName;
    return blob;
  }
}

export async function saveReceiptImageToDevice(row = {}, options = {}) {
  const { preferShare = false, allowFilePicker = false } = options;
  const file = await createReceiptImageFile(row);
  const fileName = file.name || receiptFileName(row);

  if (preferShare && navigator?.canShare?.({ files: [file] }) && navigator?.share) {
    await navigator.share({ title: 'สรุปปิดงาน เฮงเจริญพืชผล', text: 'สรุปปิดงาน น้ำหนักสินค้า รายได้ และรายละเอียดน้ำมัน', files: [file] });
    return { file, fileName, method: 'share' };
  }

  if (allowFilePicker && window?.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();
    return { file, fileName, method: 'file-picker' };
  }

  triggerDownload(file, fileName);
  return { file, fileName, method: 'download' };
}

export async function downloadReceiptImage(row = {}) {
  return saveReceiptImageToDevice(row, { preferShare: false, allowFilePicker: false });
}
