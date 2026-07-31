import { Banknote, Camera, CheckCircle2, Download, FileText, Gauge, MapPin, PackageCheck, Route, X } from 'lucide-react';
import { useState } from 'react';
import { uploadUrl } from '../api.js';
import { date, money, number, parseDecimal, roundDecimal } from '../utils/format.js';
import { saveReceiptImageToDevice } from '../utils/receiptImage.js';
import { alertSuccess, toastInfo } from '../utils/alerts.js';

function asArray(...values) {
  const out = [];
  values.forEach((value) => {
    if (!value) return;
    if (Array.isArray(value)) value.forEach((item) => item && out.push(item));
    else out.push(value);
  });
  return [...new Set(out.filter(Boolean))];
}

function photosFor(row, pluralKey, singleKey, aliasKey = '') {
  return asArray(row?.[pluralKey], row?.[singleKey], aliasKey ? row?.[aliasKey] : null);
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function isPdf(path = '') {
  return String(path).toLowerCase().split('?')[0].endsWith('.pdf');
}

function litersValue(row) {
  return roundDecimal(row?.quantity_liters || row?.station_liters || row?.liters || row?.nozzle_liters || row?.station_meter_delta_liters || 0, 2);
}

function efficiencyValue(row) {
  const saved = parseDecimal(row?.fuel_efficiency_km_per_liter, 0);
  if (saved > 0) return saved;
  const distance = parseDecimal(row?.distance_km, 0);
  const liters = litersValue(row);
  return distance > 0 && liters > 0 ? roundDecimal(distance / liters, 2) : 0;
}

function priceText(row) {
  const price = parseDecimal(row?.price_baht_per_liter || row?.price_per_liter, 0);
  return price > 0 ? `${number(price, 2)} บาท` : '-';
}

function displayAmountValue(row) {
  const stored = parseDecimal(row?.amount_baht, 0);
  const price = parseDecimal(row?.price_baht_per_liter || row?.price_per_liter, 0);
  const liters = litersValue(row);
  const expected = price > 0 && liters > 0 ? roundDecimal(price * liters, 2) : 0;
  return expected > 0 ? expected : stored;
}

function incomeValue(row, key) {
  return Math.max(0, roundDecimal(parseDecimal(row?.[key], 0), 2));
}

function totalIncomeValue(row) {
  const calculated = incomeValue(row, 'trip_fee_baht') + incomeValue(row, 'allowance_baht') + incomeValue(row, 'other_income_baht');
  return calculated > 0 ? roundDecimal(calculated, 2) : incomeValue(row, 'total_income_baht');
}

function kgText(value) {
  const kg = parseDecimal(value, 0);
  return kg > 0 ? `${number(kg, Number.isInteger(kg) ? 0 : 2)} กิโลกรัม` : '-';
}

function meterText(value) {
  if (value === undefined || value === null || value === '') return '-';
  const n = parseDecimal(value, NaN);
  if (!Number.isFinite(n)) return String(value);
  return number(n, 0);
}

function routePlace(value, fallback) {
  return hasValue(value) ? value : fallback;
}

function routeSummaryText(row) {
  return `${routePlace(row?.origin_place, 'ไม่ระบุจุดขึ้นงาน')} → ${routePlace(row?.destination_place, 'ไม่ระบุจุดลงงาน')}`;
}

export default function CaptureReceiptModal({ row, onClose }) {
  const [savingImage, setSavingImage] = useState(false);
  if (!row) return null;

  const fillDateText = `${date(row.fill_date || row.work_date)}${row.fill_time ? ` เวลา ${row.fill_time}` : ''}`;
  const liters = litersValue(row);
  const distance = parseDecimal(row.distance_km, 0);
  const fuelRate = efficiencyValue(row);
  const before = hasValue(row?.station_meter_before) ? row.station_meter_before : row?.odometer_before;
  const after = hasValue(row?.station_meter_after) ? row.station_meter_after : row?.odometer_after;
  const tripFee = incomeValue(row, 'trip_fee_baht');
  const allowance = incomeValue(row, 'allowance_baht');
  const otherIncome = incomeValue(row, 'other_income_baht');
  const totalIncome = totalIncomeValue(row);
  const routeSummary = routeSummaryText(row);
  const photos = asArray(
    photosFor(row, 'bill_photos', 'bill_photo', 'receipt_photo'),
    photosFor(row, 'document_photos', 'document_photo'),
    photosFor(row, 'oil_photos', 'oil_photo'),
    photosFor(row, 'cargo_photos', 'cargo_photo'),
    photosFor(row, 'adblue_photos', 'adblue_photo'),
  );

  async function saveReceiptImage() {
    try {
      setSavingImage(true);
      await saveReceiptImageToDevice(row, { preferShare: false, allowFilePicker: false });
      await alertSuccess('บันทึกรูปภาพเรียบร้อย', 'ระบบส่งไฟล์ PNG ไปยังเครื่องแล้ว หากไม่พบในแกลเลอรี ให้ดูในโฟลเดอร์ดาวน์โหลดของเครื่อง');
    } catch (_) {
      toastInfo('หากมือถือไม่ดาวน์โหลด ให้กดบันทึกรูปอีกครั้งหรือเปิดด้วยเบราว์เซอร์หลัก');
    } finally {
      setSavingImage(false);
    }
  }

  return (
    <div className="capture-modal fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="capture-modal-panel flex max-h-[96vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[2rem] bg-slate-100 p-3 shadow-2xl sm:p-4">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2 px-1 print:hidden">
          <div className="flex min-w-0 items-center gap-2 text-slate-700">
            <CheckCircle2 className="shrink-0 text-emerald-300" size={22} />
            <div className="min-w-0">
              <p className="text-sm font-black">บันทึกสำเร็จ — เปิดสรุปปิดงานแล้ว</p>
              <p className="text-[11px] font-bold text-slate-500">ตรวจสอบน้ำหนัก รายได้ และรายละเอียดน้ำมันได้ทันที</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={saveReceiptImage} disabled={savingImage} className="hidden items-center gap-1.5 rounded-2xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-blue-600/20 sm:inline-flex">
              <Download size={16} /> {savingImage ? 'กำลังบันทึก...' : 'บันทึกรูป'}
            </button>
            <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-lg" aria-label="ปิดใบสรุป">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[1.75rem]">
          <article className="capture-receipt overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,.16)]">
            <div className="bg-gradient-to-br from-white via-sky-50 to-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
                  <img src="/logo-heng.png" alt="เฮงเจริญพืชผล" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[.2em] text-blue-700">เฮงเจริญพืชผล</p>
                  <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">สรุปปิดงาน</h2>
                  <p className="mt-1 text-xs font-bold text-slate-500">น้ำหนักสินค้า รายได้ และข้อมูลน้ำมันครบในหน้าเดียว</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">บันทึกแล้ว</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <h3 className="mr-1 text-3xl font-black tracking-tight text-slate-950">{row.plate_no || '-'}</h3>
                <span className="badge-blue">{row.item_type || '-'}</span>
                {row.operation_type && <span className="badge-blue">{row.operation_type}</span>}
              </div>
              <p className="mt-2 text-sm font-black text-slate-600">คนขับ: <span className="text-slate-950">{row.driver_name || row.driver_name_input || '-'}</span></p>
              <div className="mt-3 rounded-[1.4rem] border border-blue-100 bg-white/85 p-3 shadow-sm ring-1 ring-blue-50">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-blue-700">เส้นทางงาน</span>
                  <p className="min-w-0 flex-1 break-words text-sm font-black text-slate-800">{routeSummary}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <RouteBadge mode="origin" value={row.origin_place} />
                  <RouteBadge mode="destination" value={row.destination_place} />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-3 sm:p-4">
              <section className="overflow-hidden rounded-[1.45rem] border border-sky-100 bg-sky-50/80 shadow-sm">
                <div className="flex items-center gap-2 border-b border-sky-100 bg-white/80 px-4 py-3">
                  <PackageCheck size={18} className="text-sky-700" />
                  <div>
                    <p className="text-sm font-black text-slate-900">สรุปขึ้นงาน / ลงงาน</p>
                    <p className="text-[11px] font-bold text-slate-500">{row.cargo_name || 'รายละเอียดเที่ยวงาน'} · {routeSummary}</p>
                  </div>
                </div>
                <div className="divide-y divide-sky-100 px-3 py-1">
                  <ClosingRow icon={MapPin} prefix="ขึ้นงาน" label={row.origin_place || 'จุดรับสินค้า / บ่อต้นทาง'} value={kgText(row.loading_weight_kg)} />
                  <ClosingRow icon={MapPin} prefix="ลงงาน" label={row.destination_place || 'จุดลงงาน / ปลายทาง'} value={kgText(row.unloading_weight_kg)} />
                </div>
              </section>

              <section className="overflow-hidden rounded-[1.45rem] border border-emerald-100 bg-emerald-50/70 shadow-sm">
                <div className="flex items-center gap-2 border-b border-emerald-100 bg-white/80 px-4 py-3">
                  <Banknote size={18} className="text-emerald-700" />
                  <div>
                    <p className="text-sm font-black text-slate-900">รายได้</p>
                    <p className="text-[11px] font-bold text-slate-500">คำนวณรวมให้อัตโนมัติ</p>
                  </div>
                </div>
                <div className="space-y-1 px-3 py-2">
                  <IncomeRow label="ค่าเที่ยว" value={tripFee} />
                  <IncomeRow label="เบี้ยเลี้ยง" value={allowance} />
                  {otherIncome > 0 && <IncomeRow label="รายได้อื่น" value={otherIncome} />}
                  <IncomeRow label="รวมรายได้" value={totalIncome} total />
                </div>
              </section>

              <div className="flex items-center gap-2 px-1 pt-1">
                <DropletTitle />
                <div>
                  <p className="text-sm font-black text-slate-900">รายละเอียดน้ำมัน</p>
                  <p className="text-[11px] font-bold text-slate-400">ข้อมูลที่ใช้คำนวณและตรวจสอบเที่ยวงาน</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <CaptureBox label="วันที่/เวลาเติม" value={fillDateText} />
                <CaptureBox label="จำนวนลิตรตามเรท" value={liters ? `${number(liters, 2)} ลิตร` : '-'} tone="blue" />
                <CaptureBox label="ยอดเงินตามเรท" value={money(displayAmountValue(row))} tone="blue" />
                <CaptureBox label="ราคาน้ำมันลิตรละ" value={priceText(row)} tone="blue" />
                <CaptureBox label="ระยะทางที่กรอก" value={distance ? `${number(distance, 2)} กม.` : '-'} />
                <CaptureBox label="อัตราประจำรถ" value={fuelRate ? `${number(fuelRate, 2)} กม./ลิตร` : '-'} tone="blue" />
              </div>

              <div className="rounded-[1.35rem] border border-slate-100 bg-slate-50 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <MiniCheck icon={Gauge} label="หัวจ่ายก่อน" value={meterText(before)} />
                  <MiniCheck icon={Gauge} label="หัวจ่ายหลัง" value={meterText(after)} />
                  <MiniCheck icon={Route} label="จำนวนลิตรตามเรท" value={liters ? `${number(liters, 2)} ลิตร` : '-'} />
                  <MiniCheck icon={Camera} label="รูปแนบ" value={`${photos.length} ไฟล์`} />
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-100 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-800">รูปภาพแนบ</p>
                  <p className="text-[11px] font-bold text-slate-400">แสดง 4 รูปแรก</p>
                </div>
                {photos.length ? (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.slice(0, 4).map((path, index) => <CaptureThumb key={`${path}-${index}`} path={path} index={index} />)}
                  </div>
                ) : (
                  <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs font-bold text-slate-300">ไม่มีรูปแนบ</div>
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-[1.35rem] border border-blue-100 bg-blue-50/70 p-3 text-xs font-bold leading-5 text-blue-900 print:hidden">
                <div className="flex items-start gap-2"><Download size={16} className="mt-0.5 shrink-0" /> กดปุ่มด้านล่างเพื่อบันทึกใบสรุปปิดงานเป็น PNG ลงเครื่อง</div>
                <button type="button" onClick={saveReceiptImage} disabled={savingImage} className="btn-primary mt-1 w-full">
                  <Download size={18} /> {savingImage ? 'กำลังสร้างรูป...' : 'บันทึก PNG เข้าเครื่อง'}
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function DropletTitle() {
  return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white"><Route size={17} /></div>;
}

function RouteBadge({ mode = 'origin', value }) {
  const isDestination = mode === 'destination';
  const label = isDestination ? 'ลงงาน' : 'ขึ้นงาน';
  const fallback = isDestination ? 'ไม่ระบุจุดลงงาน' : 'ไม่ระบุจุดขึ้นงาน';
  const tone = isDestination ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : 'bg-blue-50 text-blue-800 ring-blue-100';
  const valueText = hasValue(value) ? value : fallback;
  return (
    <div className={`rounded-2xl px-3 py-2.5 ring-1 ${tone}`}>
      <p className="text-[11px] font-black uppercase tracking-[.14em]">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-5">{valueText}</p>
    </div>
  );
}

function ClosingRow({ icon: Icon, prefix = '', label, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-100"><Icon size={16} /></div>
      <div className="min-w-0 flex-1">
        {prefix && <p className="text-[11px] font-black uppercase tracking-[.14em] text-sky-700">{prefix}</p>}
        <p className="break-words text-sm font-black text-slate-800">{label}</p>
      </div>
      <p className="shrink-0 text-right text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function IncomeRow({ label, value, total = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 ${total ? 'bg-emerald-200/70 text-emerald-950' : 'bg-white/75 text-slate-800'}`}>
      <p className={`${total ? 'text-sm' : 'text-[13px]'} font-black`}>{label}</p>
      <p className={`${total ? 'text-base' : 'text-sm'} font-black`}>{number(value, 2)} บาท</p>
    </div>
  );
}

function CaptureBox({ label, value, tone = 'slate' }) {
  const cls = {
    slate: 'border-slate-100 bg-slate-50 text-slate-950',
    blue: 'border-blue-100 bg-blue-50 text-blue-950',
  }[tone] || 'border-slate-100 bg-slate-50 text-slate-950';
  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <p className="text-[11px] font-black text-slate-400">{label}</p>
      <p className="mt-1 break-words text-[15px] font-black leading-5">{value || '-'}</p>
    </div>
  );
}

function MiniCheck({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
      <Icon size={16} className="shrink-0 text-blue-600" />
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black text-slate-400">{label}</p>
        <p className="truncate text-sm font-black text-slate-900">{value || '-'}</p>
      </div>
    </div>
  );
}

function CaptureThumb({ path, index }) {
  const href = uploadUrl(path);
  if (isPdf(path)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <FileText size={22} />
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className="relative block aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
      <img src={href} alt={`รูปแนบ ${index + 1}`} className="h-full w-full object-cover" />
      <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-black text-white">{index + 1}</span>
    </a>
  );
}
