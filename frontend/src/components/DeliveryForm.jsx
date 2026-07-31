import { Banknote, CalendarDays, Camera, CheckCircle2, ChevronDown, ClipboardList, Clock3, Droplets, FileText, Gauge, PackageCheck, RotateCcw, Save, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, uploadUrl } from '../api.js';
import CaptureReceiptModal from './CaptureReceiptModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { alertError, confirmAction, toastInfo } from '../utils/alerts.js';
import { ITEM_TYPES, currentTime, money, number, parseDecimal, roundDecimal, today } from '../utils/format.js';

const DRAFT_VERSION = 'oilops_delivery_draft_v52_close_job_summary';
const DEVICE_KEY = 'oilops_device_id_v13';
const DEVICE_RECORDER_KEY = 'oilops_device_recorder_name_v22';
const IMAGE_UPLOAD_MAX_WIDTH = 1800;
const IMAGE_UPLOAD_MAX_HEIGHT = 1800;
const IMAGE_UPLOAD_QUALITY = 0.82;
const IMAGE_COMPRESS_MIN_BYTES = 900 * 1024;

const blank = {
  work_date: today(),
  fill_date: today(),
  fill_time: currentTime(),
  operation_type: 'ทำน้ำมันบรรทุก',
  item_type: 'ดีเซล',
  plate_no: '',
  vehicle_no: '',
  driver_name: '',
  filler_name: '',
  recorder_name: '',
  odometer_before: '',
  odometer_after: '',
  distance_km: '',
  expected_fuel_efficiency_km_per_liter: '',
  estimated_distance_km: '',
  recommended_fuel_liters: '',
  calculation_mode: 'distance_to_liters',
  quantity_liters: '',
  price_baht_per_liter: '',
  amount_baht: '',
  origin_place: '',
  destination_place: '',
  load_date: '',
  unload_date: '',
  cargo_name: '',
  loading_weight_kg: '',
  unloading_weight_kg: '',
  cargo_stone_weight: '',
  cargo_sand_weight: '',
  trip_fee_baht: '',
  allowance_baht: '',
  other_income_baht: '',
  total_income_baht: '',
  wage_payer: '',
  payment_status: 'pending',
  note: '',
};

const emptyBillFields = {
  bill_no: '',
  oil_bill_no: '',
  work_bill_no: '',
  document_no: '',
  stone_bill_no: '',
  sand_bill_no: '',
  diesel_bill_no: '',
  engine_oil_bill_no: '',
  adblue_bill_no: '',
};

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `device_${crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch (_) {
    return 'device_local';
  }
}

function getDeviceRecorderName(user) {
  try {
    const saved = localStorage.getItem(DEVICE_RECORDER_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {}
  return user?.name || user?.username || '';
}

function saveDeviceRecorderName(value) {
  try {
    const clean = String(value || '').trim();
    if (clean) localStorage.setItem(DEVICE_RECORDER_KEY, clean);
  } catch (_) {}
}

function hasDraftData(data = {}) {
  return Boolean(
    data.plate_no ||
    data.driver_name ||
    data.quantity_liters ||
    data.amount_baht ||
    data.distance_km ||
    data.expected_fuel_efficiency_km_per_liter ||
    data.odometer_before ||
    data.odometer_after ||
    data.origin_place ||
    data.destination_place ||
    data.loading_weight_kg ||
    data.unloading_weight_kg ||
    data.trip_fee_baht ||
    data.allowance_baht ||
    data.other_income_baht ||
    data.note,
  );
}

function formatSavedTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  } catch (_) {
    return '';
  }
}

function formatFileSize(bytes = 0) {
  const n = Number(bytes || 0);
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}


function isLikelyImageFile(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  return type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(name);
}

function isLikelyPdfFile(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  return type.includes('pdf') || /\.pdf$/i.test(name);
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('อ่านไฟล์รูปภาพนี้ไม่ได้ กรุณาเลือกเป็น JPG/PNG หรือถ่ายรูปใหม่'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function compressImageFile(file) {
  if (!file || !isLikelyImageFile(file)) return file;
  if (file.type === 'image/gif') return file;

  let image;
  try {
    image = await loadImageElement(file);
  } catch (error) {
    // ถ้าเป็น HEIC/ไฟล์แปลกที่ browser อ่านไม่ได้ ให้ส่งไฟล์เดิมไปก่อน
    // Backend เพิ่ม limit ไว้สูงขึ้นแล้ว แต่ถ้า platform รับไม่ได้จะแจ้ง error ที่เข้าใจง่าย
    return file;
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) return file;

  const scale = Math.min(1, IMAGE_UPLOAD_MAX_WIDTH / width, IMAGE_UPLOAD_MAX_HEIGHT / height);
  if (scale >= 1 && file.size <= IMAGE_COMPRESS_MIN_BYTES) return file;

  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(canvas, 'image/jpeg', IMAGE_UPLOAD_QUALITY);
  if (!blob) return file;
  if (blob.size >= file.size && file.size <= 20 * 1024 * 1024) return file;

  const baseName = String(file.name || 'photo').replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

async function prepareUploadFile(file) {
  if (!file) return file;
  if (isLikelyImageFile(file)) return compressImageFile(file);
  return file;
}


function decimalNumber(value, defaultValue = 0) {
  return parseDecimal(value, defaultValue);
}

function roundMoneyLike(value, digits = 2) {
  return roundDecimal(value, digits);
}

export default function DeliveryForm({ initialData = null, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState(null);
  const [draftInfo, setDraftInfo] = useState({ restored: false, savedAt: '', deviceId: '' });
  const formReadyRef = useRef(false);

  const draftKey = useMemo(() => {
    const deviceId = getDeviceId();
    const userKey = user?.id || user?.username || 'shared-user';
    return `${DRAFT_VERSION}:${deviceId}:${userKey}`;
  }, [user?.id, user?.username]);


  const effectiveDistance = useMemo(() => {
    // v51: ระยะทางเป็นข้อมูลหลักที่พนักงานกรอก เพื่อคำนวณจำนวนลิตรตามเรทประจำรถ
    return Math.max(0, roundMoneyLike(decimalNumber(form.distance_km, 0), 2));
  }, [form.distance_km]);

  const expectedFuelEfficiency = useMemo(() => {
    return Math.max(0, roundMoneyLike(decimalNumber(form.expected_fuel_efficiency_km_per_liter, 0), 2));
  }, [form.expected_fuel_efficiency_km_per_liter]);

  const selectedVehicle = useMemo(() => {
    const plate = String(form.plate_no || '').trim().toLowerCase();
    return vehicles.find((vehicle) => (
      (form.vehicle_id && String(vehicle.id) === String(form.vehicle_id)) ||
      (plate && String(vehicle.plate_no || '').trim().toLowerCase() === plate)
    )) || null;
  }, [vehicles, form.vehicle_id, form.plate_no]);

  const recommendedFuelLiters = useMemo(() => {
    if (form.item_type !== 'ดีเซล') return 0;
    return effectiveDistance > 0 && expectedFuelEfficiency > 0
      ? Math.max(0, roundMoneyLike(effectiveDistance / expectedFuelEfficiency, 2))
      : 0;
  }, [effectiveDistance, expectedFuelEfficiency, form.item_type]);

  const effectiveLiters = useMemo(() => {
    // ดีเซลใช้จำนวนลิตรที่คำนวณจาก ระยะทาง ÷ อัตราประจำรถ เป็นหลัก
    // รายการเก่าที่ยังไม่มีระยะทาง และน้ำมันชนิดอื่น ยังคงอ่านค่าจำนวนลิตรเดิมได้
    if (form.item_type === 'ดีเซล' && recommendedFuelLiters > 0) return recommendedFuelLiters;
    return Math.max(0, roundMoneyLike(decimalNumber(form.quantity_liters, 0), 2));
  }, [form.item_type, form.quantity_liters, recommendedFuelLiters]);

  const estimatedDistance = useMemo(() => {
    if (form.item_type !== 'ดีเซล') return 0;
    return effectiveLiters > 0 && expectedFuelEfficiency > 0
      ? Math.max(0, roundMoneyLike(effectiveLiters * expectedFuelEfficiency, 2))
      : 0;
  }, [effectiveLiters, expectedFuelEfficiency, form.item_type]);

  const billTotal = useMemo(() => {
    const price = decimalNumber(form.price_baht_per_liter, 0);
    return effectiveLiters > 0 && price > 0 ? roundMoneyLike(effectiveLiters * price, 2) : 0;
  }, [effectiveLiters, form.price_baht_per_liter]);

  const avgPrice = useMemo(() => {
    const amount = decimalNumber(form.amount_baht, 0);
    return effectiveLiters > 0 && amount > 0 ? roundMoneyLike(amount / effectiveLiters, 2) : 0;
  }, [effectiveLiters, form.amount_baht]);

  const fuelEfficiency = useMemo(() => {
    return effectiveDistance > 0 && effectiveLiters > 0 ? roundMoneyLike(effectiveDistance / effectiveLiters, 2) : 0;
  }, [effectiveDistance, effectiveLiters]);

  const totalIncome = useMemo(() => {
    return roundMoneyLike(
      decimalNumber(form.trip_fee_baht, 0) +
      decimalNumber(form.allowance_baht, 0) +
      decimalNumber(form.other_income_baht, 0),
      2,
    );
  }, [form.trip_fee_baht, form.allowance_baht, form.other_income_baht]);

  useEffect(() => {
    formReadyRef.current = false;
    const fallbackPrice = initialData?.price_baht_per_liter || initialData?.price_per_liter || '';
    const base = initialData
      ? {
          ...blank,
          ...initialData,
          ...emptyBillFields,
          plate_no: initialData.plate_no || '',
          vehicle_no: initialData.vehicle_no || '',
          driver_name: initialData.driver_name || initialData.driver_name_input || '',
          price_baht_per_liter: fallbackPrice,
          odometer_before: initialData.station_meter_before || initialData.odometer_before || '',
          odometer_after: initialData.station_meter_after || initialData.odometer_after || '',
          distance_km: initialData.distance_km || '',
          expected_fuel_efficiency_km_per_liter:
            initialData.expected_fuel_efficiency_km_per_liter ||
            initialData.vehicle_fuel_efficiency_km_per_liter ||
            initialData.fuel_efficiency_km_per_liter ||
            '',
          estimated_distance_km: initialData.estimated_distance_km || '',
          recommended_fuel_liters: initialData.recommended_fuel_liters || '',
          calculation_mode: initialData.calculation_mode || 'distance_to_liters',
        }
      : { ...blank, recorder_name: getDeviceRecorderName(user) };

    if (!initialData?.id) {
      try {
        const raw = localStorage.getItem(draftKey);
        const draft = raw ? JSON.parse(raw) : null;
        if (draft?.form && hasDraftData(draft.form)) {
          setForm({ ...base, ...draft.form, recorder_name: draft.form.recorder_name || base.recorder_name });
          setDraftInfo({ restored: true, savedAt: draft.savedAt || '', deviceId: getDeviceId().slice(-8) });
          setFiles({});
          setTimeout(() => toastSuccess('กู้ข้อมูลร่างของเครื่องนี้ให้แล้ว'), 250);
          formReadyRef.current = true;
          return;
        }
      } catch (_) {
        // ถ้าข้อมูลร่างเสีย ให้เริ่มฟอร์มใหม่โดยไม่ทำให้ระบบพัง
      }
    }

    setForm(base);
    setFiles({});
    setDraftInfo({ restored: false, savedAt: '', deviceId: getDeviceId().slice(-8) });
    setTimeout(() => { formReadyRef.current = true; }, 0);
  }, [initialData, draftKey, user?.name, user?.username]);

  useEffect(() => {
    api.vehicleOptions?.().then((res) => setVehicles(res.data || [])).catch(() => setVehicles([]));
  }, []);

  useEffect(() => {
    if (initialData?.id || !vehicles.length || !form.plate_no) return;
    const plate = String(form.plate_no || '').trim().toLowerCase();
    const found = vehicles.find((vehicle) => String(vehicle.plate_no || '').trim().toLowerCase() === plate);
    if (!found) return;
    const vehicleRate = found.fuel_efficiency_km_per_liter || '';
    setForm((old) => {
      const nextRate = vehicleRate ? String(vehicleRate) : '';
      if (
        String(old.vehicle_id || '') === String(found.id || '') &&
        String(old.expected_fuel_efficiency_km_per_liter || '') === nextRate
      ) return old;
      return {
        ...old,
        vehicle_id: found.id || '',
        vehicle_no: found.vehicle_no || old.vehicle_no || '',
        driver_name: found.driver_name || old.driver_name || '',
        expected_fuel_efficiency_km_per_liter: nextRate,
      };
    });
  }, [vehicles, form.plate_no, initialData?.id]);

  useEffect(() => {
    if (initialData?.id || !formReadyRef.current) return;
    if (!hasDraftData(form)) return;
    const timer = window.setTimeout(() => {
      try {
        const savedAt = new Date().toISOString();
        localStorage.setItem(draftKey, JSON.stringify({ form, savedAt }));
        setDraftInfo((old) => ({ ...old, savedAt, deviceId: getDeviceId().slice(-8) }));
      } catch (_) {
        // localStorage เต็มหรือปิดไว้ ไม่ต้องหยุดการใช้งานหลัก
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, draftKey, initialData?.id]);

  useEffect(() => {
    const hasData = hasDraftData(form);
    function beforeUnload(event) {
      if (!hasData || initialData?.id) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [form, initialData?.id]);

  function setField(key, value) {
    if (key === 'recorder_name') saveDeviceRecorderName(value);
    setForm((old) => ({ ...old, [key]: value }));
  }

  function pickVehicle(plate) {
    const normalizedPlate = String(plate || '').trim().toLowerCase();
    const found = vehicles.find((vehicle) => String(vehicle.plate_no || '').trim().toLowerCase() === normalizedPlate);
    setForm((old) => ({
      ...old,
      plate_no: plate,
      vehicle_id: found?.id || '',
      vehicle_no: found?.vehicle_no || old.vehicle_no || '',
      driver_name: found?.driver_name || old.driver_name || '',
      // อัตราวิ่งถูกตั้งแยกตามรถแต่ละคัน เจ้าหน้าที่ไม่ต้องกรอกซ้ำในทุกเที่ยว
      expected_fuel_efficiency_km_per_liter: found?.fuel_efficiency_km_per_liter || '',
    }));
  }


  async function clearDraft() {
    const ok = await confirmAction('ล้างข้อมูลร่างของเครื่องนี้?', 'ล้างเฉพาะข้อมูลที่ยังไม่กดบันทึกบนเครื่องนี้เท่านั้น รายการที่บันทึกแล้วจะไม่หาย');
    if (!ok) return;
    try { localStorage.removeItem(draftKey); } catch (_) {}
    setForm({ ...blank, work_date: today(), fill_date: today(), fill_time: currentTime(), recorder_name: getDeviceRecorderName(user) });
    setFiles({});
    setDraftInfo((old) => ({ ...old, restored: false, savedAt: '' }));
    toastSuccess('ล้างข้อมูลร่างแล้ว');
  }

  async function buildFormData() {
    const fd = new FormData();
    Object.entries({ ...form, ...emptyBillFields }).forEach(([key, value]) => fd.append(key, value ?? ''));
    fd.set('distance_km', effectiveDistance ? String(effectiveDistance) : '');
    fd.set('expected_fuel_efficiency_km_per_liter', expectedFuelEfficiency ? String(expectedFuelEfficiency) : '');
    fd.set('estimated_distance_km', estimatedDistance ? String(estimatedDistance) : '');
    fd.set('recommended_fuel_liters', recommendedFuelLiters ? String(recommendedFuelLiters) : '');
    fd.set('calculation_mode', form.item_type === 'ดีเซล' ? 'distance_to_liters' : 'manual_liters');
    fd.set('nozzle_liters', '');
    fd.set('station_meter_delta_liters', '');
    fd.set('station_liters', effectiveLiters ? String(effectiveLiters) : '');
    fd.set('liters', effectiveLiters ? String(effectiveLiters) : '');
    fd.set('quantity_liters', effectiveLiters ? String(effectiveLiters) : '');
    fd.set('price_baht_per_liter', form.price_baht_per_liter || '');
    fd.set('amount_baht', billTotal ? String(billTotal) : '');
    fd.set('total_income_baht', totalIncome ? String(totalIncome) : '0');

    for (const [key, selected] of Object.entries(files)) {
      const list = Array.isArray(selected) ? selected : selected ? [selected] : [];
      for (const file of list) {
        const uploadFile = await prepareUploadFile(file);
        fd.append(key, uploadFile);
      }
    }
    return fd;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.work_date) return alertError('กรุณาเลือกวันที่ลงรายการ');
    if (!form.plate_no) return alertError('กรุณากรอกทะเบียนรถ');
    if (form.item_type === 'ดีเซล' && (!effectiveDistance || effectiveDistance <= 0)) return alertError('กรุณากรอกระยะทางที่ต้องวิ่ง');
    if (form.item_type !== 'ดีเซล' && (!effectiveLiters || effectiveLiters <= 0)) return alertError('กรุณากรอกจำนวนลิตร');
    if (!decimalNumber(form.price_baht_per_liter, 0)) return alertError('กรุณากรอกราคาน้ำมันลิตรละ');
    if (form.item_type === 'ดีเซล' && (!expectedFuelEfficiency || expectedFuelEfficiency <= 0)) {
      return alertError('รถคันนี้ยังไม่ได้ตั้งอัตราประจำรถ กรุณาให้เจ้าของระบบตั้งครั้งเดียวที่เมนู “รถและคนขับ” แล้วกลับมาเลือกทะเบียนรถอีกครั้ง');
    }

    if (effectiveLiters >= 280) {
      const ok = await confirmAction('ปริมาณลิตรสูงกว่าปกติ', `รายการนี้ ${number(effectiveLiters, 2)} ลิตร ต้องการบันทึกต่อใช่ไหม`);
      if (!ok) return;
    }
    if (expectedFuelEfficiency > 0 && (expectedFuelEfficiency < 0.5 || expectedFuelEfficiency > 8)) {
      const ok = await confirmAction('ตรวจสอบอัตราประจำรถ กม./ลิตร', `ตั้งค่าไว้ ${number(expectedFuelEfficiency, 2)} กม./ลิตร เมื่อกรอกระยะทาง ${number(effectiveDistance, 2)} กม. ระบบคำนวณน้ำมันได้ ${number(effectiveLiters, 2)} ลิตร ต้องการบันทึกต่อใช่ไหม`);
      if (!ok) return;
    }
    if (fuelEfficiency > 0 && (fuelEfficiency < 0.5 || fuelEfficiency > 8)) {
      const ok = await confirmAction('ตรวจสอบอัตราสิ้นเปลืองจริง กม./ลิตร', `จากระยะทางจริง ระบบคำนวณได้ ${number(fuelEfficiency, 2)} กม./ลิตร ต้องการบันทึกต่อใช่ไหม`);
      if (!ok) return;
    }

    const selectedFileCount = Object.values(files || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
    setLoading(true);
    try {
      if (selectedFileCount > 0) toastInfo('กำลังปรับขนาดรูปภาพก่อนอัปโหลด...');
      saveDeviceRecorderName(form.recorder_name);
      const fd = await buildFormData();
      const savedRes = initialData?.id ? await api.updateDelivery(initialData.id, fd) : await api.createDelivery(fd);
      const savedDelivery = savedRes?.data || null;
      try { localStorage.removeItem(draftKey); } catch (_) {}
      if (!initialData?.id) setForm({ ...blank, work_date: today(), fill_date: today(), fill_time: currentTime(), recorder_name: getDeviceRecorderName(user) });
      setFiles({});
      setDraftInfo((old) => ({ ...old, restored: false, savedAt: '' }));
      if (savedDelivery) {
        setSavedReceipt(savedDelivery);
      }
    } catch (err) {
      alertError(err, 'บันทึกรายการไม่ได้');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mobile-form-card app-form-card overflow-hidden">
        <header className="app-form-hero">
          <div className="form-hero-copy">
            <div className="form-hero-brand">
              <div className="capture-header-logo">
                <img src="/logo-heng.png" alt="เฮงเจริญพืชผล" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="form-hero-eyebrow"><ShieldCheck size={14} /> บันทึกร่างอัตโนมัติ</div>
                <h2>{initialData?.id ? 'แก้ไขรายการน้ำมัน' : 'บันทึกงานน้ำมัน'}</h2>
                <p>ฟอร์มงานขนส่งที่จัดลำดับใหม่ให้กรอกง่าย อ่านชัด และใช้งานบนมือถือได้สะดวก</p>
              </div>
            </div>
          </div>

          <div className="form-hero-summary" aria-label="สรุปข้อมูลที่กรอก">
            <Metric label="ระยะทางที่กรอก" value={effectiveDistance ? `${number(effectiveDistance, 2)} กม.` : '-'} />
            <Metric label="ลิตรตามเรท" value={effectiveLiters ? `${number(effectiveLiters, 2)} ลิตร` : '-'} />
            <Metric label="ราคาต่อลิตร" value={decimalNumber(form.price_baht_per_liter, 0) ? `${number(form.price_baht_per_liter, 2)} บาท` : '-'} />
            <Metric label="อัตราประจำรถ" value={expectedFuelEfficiency ? `${number(expectedFuelEfficiency, 2)} กม./ลิตร` : 'ยังไม่ตั้งค่า'} strong />
          </div>
        </header>

        <div className="form-progress-strip" aria-label="ขั้นตอนการกรอกข้อมูล">
          <ProgressItem no="01" icon={ClipboardList} label="รถและคนขับ" />
          <ProgressItem no="02" icon={Droplets} label="น้ำมันและราคา" />
          <ProgressItem no="03" icon={Clock3} label="วันและงาน" />
          <ProgressItem no="04" icon={PackageCheck} label="สรุปปิดงาน" />
          <ProgressItem no="05" icon={Camera} label="รูปภาพแนบ" />
        </div>

        <div className="app-form-body">
          <DraftNotice draftInfo={draftInfo} files={files} onClear={clearDraft} editing={Boolean(initialData?.id)} />

          <div className="form-content-stack">
            <Section no="1" icon={ClipboardList} title="รถและผู้ปฏิบัติงาน" subtitle="ข้อมูลหลักสำหรับระบุรถ คนขับ และผู้บันทึก">
              <Field className="field-featured" required label="ทะเบียนรถ" hint="ตัวอย่าง 70-0024" value={form.plate_no} onChange={pickVehicle} placeholder="กรอกหรือเลือกทะเบียนรถ" listId="vehicle-list" />
              <datalist id="vehicle-list">{vehicles.map((v) => <option key={v.id} value={v.plate_no}>{v.driver_name || v.vehicle_no || ''}</option>)}</datalist>
              <Field className="field-featured" label="คนขับ" hint="ชื่อที่จะแสดงในใบสรุป" value={form.driver_name} onChange={(v) => setField('driver_name', v)} placeholder="กรอกชื่อคนขับ" />
              <Field label="เบอร์รถ" hint="ไม่บังคับ" value={form.vehicle_no} onChange={(v) => setField('vehicle_no', v)} placeholder="เช่น 12" />
              <Select label="ประเภทน้ำมัน" hint="เลือกชนิดน้ำมัน" value={form.item_type} onChange={(v) => setField('item_type', v)} options={ITEM_TYPES} />
              <Select label="ประเภทงาน" hint="เลือกประเภทงาน" value={form.operation_type} onChange={(v) => setField('operation_type', v)} options={['ทำน้ำมันบรรทุก', 'เช็คเติมสต๊อก']} />
              <Field label="ชื่อผู้เติม" hint="ไม่บังคับ" value={form.filler_name} onChange={(v) => setField('filler_name', v)} placeholder="กรอกชื่อผู้เติม" />
              <Field className="field-wide" label="ชื่อผู้กรอก / เครื่องนี้" hint="ระบบจะจำชื่อแยกตามอุปกรณ์" value={form.recorder_name} onChange={(v) => setField('recorder_name', v)} placeholder="กรอกชื่อผู้บันทึก" />
            </Section>

            <Section no="2" icon={Droplets} title="ระยะทาง เรทน้ำมัน และราคา" subtitle="กรอกระยะทาง ระบบจะหารด้วยอัตราประจำรถและคำนวณจำนวนลิตรให้อัตโนมัติ">
              {form.item_type === 'ดีเซล' ? (
                <Field className="field-featured" required type="number" step="0.01" label="ระยะทางที่ต้องวิ่ง" hint="เช่น 669 กิโลเมตร" value={form.distance_km} onChange={(v) => setField('distance_km', v)} suffix="กม." />
              ) : (
                <Field required type="number" step="0.01" label="จำนวนลิตร" hint="กรอกจำนวนลิตรตามจริง" value={form.quantity_liters} onChange={(v) => setField('quantity_liters', v)} suffix="ลิตร" />
              )}
              <ReadOnlyField
                className={`vehicle-rate-auto ${expectedFuelEfficiency > 0 ? 'is-ready' : 'is-missing'}`}
                label="อัตราประจำรถ (ระบบเลือกให้อัตโนมัติ)"
                hint={expectedFuelEfficiency > 0
                  ? `ดึงจากทะเบียน ${selectedVehicle?.plate_no || form.plate_no || '-'} — ใช้สูตร ระยะทาง ÷ ${number(expectedFuelEfficiency, 2)}`
                  : 'ยังไม่ได้ตั้งค่า เจ้าของระบบตั้งครั้งเดียวที่เมนู รถและคนขับ เช่น รถหนัก 2.90 หรือรถคันอื่น 3.20 กม./ลิตร'}
                value={expectedFuelEfficiency > 0 ? `${number(expectedFuelEfficiency, 2)} กม./ลิตร` : 'ยังไม่ตั้งอัตราประจำรถ'}
              />
              <ReadOnlyField
                className="field-featured distance-result-auto"
                label={form.item_type === 'ดีเซล' ? 'จำนวนลิตรตามเรทน้ำมัน' : 'จำนวนลิตร'}
                hint={form.item_type === 'ดีเซล' ? 'ระยะทาง ÷ อัตราประจำรถ' : 'ใช้จำนวนลิตรที่กรอก'}
                value={effectiveLiters ? `${number(effectiveLiters, 2)} ลิตร` : form.item_type === 'ดีเซล' ? 'เลือกทะเบียนรถและกรอกระยะทาง' : 'กรอกจำนวนลิตร'}
              />
              <Field required type="number" step="0.01" label="ราคาน้ำมันต่อลิตร" hint="หน่วยบาท" value={form.price_baht_per_liter} onChange={(v) => setField('price_baht_per_liter', v)} suffix="บาท" />
              <ReadOnlyField label="ยอดรวมตามเรท" hint="จำนวนลิตรตามเรท × ราคาต่อลิตร" value={billTotal ? money(billTotal) : 'รอกรอกระยะทาง เรท และราคา'} />
              <Field type="number" step="1" label="หัวจ่ายก่อนเติม" hint="เลขอ้างอิง" value={form.odometer_before} onChange={(v) => setField('odometer_before', v)} />
              <Field type="number" step="1" label="หัวจ่ายหลังเติม" hint="เลขอ้างอิง" value={form.odometer_after} onChange={(v) => setField('odometer_after', v)} />
              <CalcCard billTotal={billTotal} pricePerLiter={form.price_baht_per_liter} fuelEfficiency={fuelEfficiency} expectedFuelEfficiency={expectedFuelEfficiency} effectiveLiters={effectiveLiters} effectiveDistance={effectiveDistance} estimatedDistance={estimatedDistance} />
            </Section>

            <Section no="3" icon={Clock3} title="วัน เวลา และรายละเอียดงาน" subtitle="จัดกลุ่มตามลำดับเหตุการณ์ เพื่อให้ตรวจสอบข้อมูลได้ง่าย">
              <SmartDateField required label="ลงวันที่" hint="วันที่ของรายการ" value={form.work_date} onChange={(v) => { setField('work_date', v); if (!form.fill_date) setField('fill_date', v); }} />
              <SmartDateField label="วันที่เติม" hint="ตามบิลหรือวันที่เติมจริง" value={form.fill_date} onChange={(v) => setField('fill_date', v)} />
              <SmartTimeField label="เวลาเติม" hint="ตามบิลหรือหน้างาน" value={form.fill_time} onChange={(v) => setField('fill_time', v)} />
              <SmartDateField label="วันที่บรรทุก" hint="ไม่บังคับ" value={form.load_date} onChange={(v) => setField('load_date', v)} optional />
              <SmartDateField label="วันที่ลงของ" hint="ไม่บังคับ" value={form.unload_date} onChange={(v) => setField('unload_date', v)} optional />
            </Section>

            <Section no="4" icon={PackageCheck} title="สรุปปิดงานและรายได้" subtitle="กรอกจุดรับสินค้า จุดลงงาน น้ำหนัก และรายได้ เพื่อให้ใบสรุปเด้งขึ้นครบแบบตัวอย่าง">
              <Field className="field-wide field-featured" label="ประเภทสินค้า / ชื่องาน" hint="เช่น ทราย หิน หรือไม้สับ" value={form.cargo_name} onChange={(v) => setField('cargo_name', v)} placeholder="กรอกประเภทสินค้า" />
              <Field className="field-wide" label="จุดรับสินค้า / บ่อต้นทาง" hint="จะแสดงในสรุปน้ำหนักสินค้า" value={form.origin_place} onChange={(v) => setField('origin_place', v)} placeholder="เช่น บ่อทราย SMC" />
              <Field type="number" step="0.01" label="น้ำหนักต้นทาง" hint="น้ำหนักจากจุดรับสินค้า" value={form.loading_weight_kg} onChange={(v) => setField('loading_weight_kg', v)} suffix="กิโลกรัม" />
              <Field className="field-wide" label="จุดลงงาน / ปลายทาง" hint="สถานที่ส่งและลงสินค้า" value={form.destination_place} onChange={(v) => setField('destination_place', v)} placeholder="เช่น โออาร์ซี บางเสาธง" />
              <Field type="number" step="0.01" label="น้ำหนักปลายทาง" hint="น้ำหนักจากจุดลงงาน" value={form.unloading_weight_kg} onChange={(v) => setField('unloading_weight_kg', v)} suffix="กิโลกรัม" />
              <Field type="number" step="0.01" label="น้ำหนักหิน (ข้อมูลเดิม)" hint="เว้นว่างได้" value={form.cargo_stone_weight} onChange={(v) => setField('cargo_stone_weight', v)} suffix="ตัน" />
              <Field type="number" step="0.01" label="น้ำหนักไม้สับ (ข้อมูลเดิม)" hint="เว้นว่างได้" value={form.cargo_sand_weight} onChange={(v) => setField('cargo_sand_weight', v)} suffix="ตัน" />

              <div className="field-wide rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3 md:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Banknote size={19} /></div>
                  <div>
                    <p className="text-sm font-black text-emerald-950">รายได้เที่ยวนี้</p>
                    <p className="text-[11px] font-bold text-emerald-700">ระบบรวมรายได้ให้อัตโนมัติ</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field type="number" step="0.01" label="ค่าเที่ยว" hint="รายได้หลักของเที่ยวงาน" value={form.trip_fee_baht} onChange={(v) => setField('trip_fee_baht', v)} suffix="บาท" />
                  <Field type="number" step="0.01" label="เบี้ยเลี้ยง" hint="ค่าอาหารหรือเบี้ยเลี้ยง" value={form.allowance_baht} onChange={(v) => setField('allowance_baht', v)} suffix="บาท" />
                  <Field type="number" step="0.01" label="รายได้อื่น" hint="เว้นว่างได้" value={form.other_income_baht} onChange={(v) => setField('other_income_baht', v)} suffix="บาท" />
                  <ReadOnlyField className="distance-result-auto" label="รวมรายได้" hint="ค่าเที่ยว + เบี้ยเลี้ยง + รายได้อื่น" value={money(totalIncome)} />
                  <Field label="ผู้จ่ายค่าแรง" hint="กรอกเมื่อมีข้อมูล" value={form.wage_payer} onChange={(v) => setField('wage_payer', v)} />
                  <Select label="สถานะรายได้" hint="สถานะสำหรับเจ้าของกิจการ" value={form.payment_status} onChange={(v) => setField('payment_status', v)} options={[["pending", 'รอจ่าย / ไม่ระบุ'], ["paid", 'จ่ายแล้ว']]} />
                </div>
              </div>
            </Section>

            <Section no="5" icon={Camera} title="เอกสารและรูปภาพแนบ" subtitle="เลือกรูปจากคลังหรือถ่ายใหม่ แยกตามหมวดเพื่อค้นหาง่าย">
              <FileField label="รูปบิล" name="bill_photo" files={files} setFiles={setFiles} existing={initialData?.bill_photos || initialData?.bill_photo || initialData?.receipt_photo} />
              <FileField label="รูปเอกสาร" name="document_photo" files={files} setFiles={setFiles} existing={initialData?.document_photos || initialData?.document_photo} />
              <FileField label="รูปน้ำมัน / แอดบลู" name="oil_photo" files={files} setFiles={setFiles} existing={[...toExistingArray(initialData?.oil_photos || initialData?.oil_photo), ...toExistingArray(initialData?.adblue_photos || initialData?.adblue_photo)]} />
              <FileField label="รูปบรรทุก" name="cargo_photo" files={files} setFiles={setFiles} existing={initialData?.cargo_photos || initialData?.cargo_photo} />
            </Section>

            <details className="group section-card supplemental-section overflow-hidden">
              <summary className="section-head cursor-pointer select-none">
                <div className="section-icon"><CheckCircle2 size={18} /></div>
                <div className="min-w-0 flex-1">
                  <p className="section-kicker">ข้อมูลเพิ่มเติม</p>
                  <h3>หมายเหตุเพิ่มเติม</h3>
                  <p className="section-subtitle">เปิดกรอกเมื่อมีรายละเอียดนอกเหนือจากสรุปปิดงาน</p>
                </div>
                <ChevronDown size={20} className="section-chevron shrink-0 transition group-open:rotate-180" />
              </summary>
              <div className="field-grid smart-form-grid supplemental-grid">
                <label className="form-field field-wide">
                  <span className="form-field-label label">หมายเหตุ</span>
                  <textarea className="input min-h-[110px] resize-y" value={form.note} onChange={(e) => setField('note', e.target.value)} placeholder="รายละเอียดเพิ่มเติม เช่น เหตุผลที่ยอดลิตรสูงผิดปกติ" />
                  <p className="form-field-hint hint">เว้นว่างได้เมื่อไม่มีรายละเอียดเพิ่มเติม</p>
                </label>
              </div>
            </details>

            <div className="heng-form-submitbar">
              <div className="submitbar-copy">
                <p>ตรวจสอบข้อมูลก่อนบันทึก</p>
                <span>หลังบันทึก ระบบจะเด้งใบสรุปปิดงาน น้ำหนักสินค้า รายได้ และรายละเอียดน้ำมันให้อัตโนมัติ</span>
              </div>
              <button disabled={loading} className="btn-primary submit-primary">
                <Save size={18} /> {loading ? 'กำลังบันทึก...' : initialData?.id ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
              </button>
            </div>
          </div>
        </div>
      </form>
      <CaptureReceiptModal row={savedReceipt} onClose={() => { const completed = savedReceipt; setSavedReceipt(null); onSaved?.(completed); }} />
    </>
  );
}

function ProgressItem({ no, label, icon: Icon }) {
  return (
    <div className="form-progress-item">
      <span className="form-progress-number">{no}</span>
      <span className="form-progress-icon"><Icon size={16} /></span>
      <span className="form-progress-label">{label}</span>
    </div>
  );
}

function DraftNotice({ draftInfo, files, onClear, editing }) {
  if (editing) return null;
  const fileCount = Object.values(files || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  if (!draftInfo.savedAt && fileCount <= 0) return null;
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs font-bold leading-5 text-blue-950">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck size={16} className="shrink-0 text-blue-700" />
          <p className="min-w-0 truncate">บันทึกร่างอัตโนมัติ{draftInfo.savedAt ? ` · ${formatSavedTime(draftInfo.savedAt)}` : ''}{fileCount > 0 ? ` · รูปที่เลือก ${fileCount} ไฟล์` : ''}</p>
        </div>
        {draftInfo.savedAt && <button type="button" onClick={onClear} className="shrink-0 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">ล้าง</button>}
      </div>
    </div>
  );
}

function Section({ no, title, subtitle, icon: Icon, children }) {
  return (
    <section className="section-card form-section-card">
      <div className="section-head">
        <div className="section-icon">{Icon ? <Icon size={19} /> : no}</div>
        <div className="min-w-0 flex-1">
          <p className="section-kicker">ขั้นตอน {no}</p>
          <h3>{title}</h3>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="field-grid smart-form-grid section-fields">{children}</div>
    </section>
  );
}


function dateOffset(days = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function SmartDateField({ label, value, onChange, required = false, hint = '', optional = false, className = '' }) {
  const chips = [
    { label: 'วันนี้', value: dateOffset(0) },
    { label: 'เมื่อวาน', value: dateOffset(-1) },
  ];
  return (
    <label className={`form-field smart-date-field ${className}`.trim()}>
      <span className="form-field-label label">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="smart-date-box">
        <span className="smart-date-icon"><CalendarDays size={18} /></span>
        <input
          required={required}
          type="date"
          className="smart-date-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
      </div>
      <div className="smart-date-actions">
        {chips.map((chip) => (
          <button key={chip.label} type="button" className={`smart-date-chip ${value === chip.value ? 'is-active' : ''}`} onClick={() => onChange(chip.value)}>
            {chip.label}
          </button>
        ))}
        {optional && value && <button type="button" className="smart-date-chip is-clear" onClick={() => onChange('')}>ล้าง</button>}
      </div>
      {hint && <p className="form-field-hint hint">{hint}</p>}
    </label>
  );
}

function SmartTimeField({ label, value, onChange, required = false, hint = '', className = '' }) {
  return (
    <label className={`form-field smart-date-field ${className}`.trim()}>
      <span className="form-field-label label">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="smart-date-box smart-time-box">
        <span className="smart-date-icon"><Clock3 size={18} /></span>
        <input
          required={required}
          type="time"
          className="smart-date-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
      </div>
      <div className="smart-date-actions">
        <button type="button" className="smart-date-chip" onClick={() => onChange(currentTime())}>เวลาตอนนี้</button>
        {value && <button type="button" className="smart-date-chip is-clear" onClick={() => onChange('')}>ล้าง</button>}
      </div>
      {hint && <p className="form-field-hint hint">{hint}</p>}
    </label>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', suffix = '', required = false, hint = '', listId = '', step = '', className = '' }) {
  const isNumber = type === 'number';
  return (
    <label className={`form-field ${className}`.trim()}>
      <span className="form-field-label label">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="form-field-input-wrap relative">
        <input
          required={required}
          type={isNumber ? 'text' : type}
          inputMode={isNumber ? 'decimal' : undefined}
          pattern={isNumber ? '[0-9๐-๙.,:\-]*' : undefined}
          step={isNumber ? (step || '0.01') : undefined}
          autoComplete="off"
          className={`input ${suffix ? 'pr-20' : ''}`}
          value={value || ''}
          placeholder={placeholder}
          list={listId || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="field-suffix pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">{suffix}</span>}
      </div>
      {hint && <p className="form-field-hint hint">{hint}</p>}
    </label>
  );
}

function ReadOnlyField({ label, value, hint = '', className = '' }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <span className="form-field-label label">{label}</span>
      <div className="readonly-value">
        {value || '-'}
      </div>
      {hint && <p className="form-field-hint hint">{hint}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options, hint = '', className = '' }) {
  const normalized = options.map((item) => Array.isArray(item) ? { value: item[0], label: item[1] } : { value: item, label: item });
  return (
    <label className={`form-field ${className}`.trim()}>
      <span className="form-field-label label">{label}</span>
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {normalized.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      {hint && <p className="form-field-hint hint">{hint}</p>}
    </label>
  );
}

function CalcCard({ billTotal, pricePerLiter, fuelEfficiency, expectedFuelEfficiency, effectiveLiters, effectiveDistance, estimatedDistance }) {
  return (
    <div className="col-span-2 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 p-4 text-sm font-bold text-blue-950 md:col-span-2 xl:col-span-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm"><Gauge size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="font-black">สรุปคำนวณเรทน้ำมันอัตโนมัติ</p>
          <p className="mt-1 text-xs leading-5 text-blue-800/70">สูตรอัตโนมัติ = ระยะทาง ÷ อัตราประจำรถ (กม./ลิตร)</p>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-5">
            <MiniCalc label="ระยะทางที่กรอก" value={effectiveDistance ? `${number(effectiveDistance, 2)} กม.` : '-'} />
            <MiniCalc label="อัตราประจำรถ" value={expectedFuelEfficiency ? `${number(expectedFuelEfficiency, 2)} กม./ลิตร` : 'ยังไม่ตั้งค่า'} strong />
            <MiniCalc label="ลิตรตามเรท" value={effectiveLiters ? `${number(effectiveLiters, 2)} ลิตร` : '-'} strong highlight />
            <MiniCalc label="จำนวนบาท" value={billTotal ? money(billTotal) : '-'} />
            <MiniCalc label="ตรวจสูตร" value={fuelEfficiency ? `${number(fuelEfficiency, 2)} กม./ลิตร` : estimatedDistance ? `${number(estimatedDistance, 2)} กม.` : '-'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, strong = false }) {
  return <div className="rounded-2xl bg-white/85 p-3 shadow-sm ring-1 ring-white/70"><p className="text-[11px] font-black text-slate-400">{label}</p><p className={`${strong ? 'text-blue-700' : 'text-slate-950'} mt-1 truncate text-sm font-black md:text-base`}>{value}</p></div>;
}

function MiniCalc({ label, value, strong = false, highlight = false }) {
  return (
    <div className={`rounded-2xl p-3 ${highlight ? 'border border-blue-100 bg-blue-50' : 'bg-white/85'}`}>
      <p className={`text-[11px] font-black ${highlight ? 'text-blue-700' : 'text-blue-500/80'}`}>{label}</p>
      <p className={`mt-1 ${strong ? 'text-lg' : 'text-sm'} font-black ${highlight ? 'text-blue-950' : 'text-blue-950'}`}>{value}</p>
    </div>
  );
}

function toExistingArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

function FileField({ label, hint = '', name, files, setFiles, existing }) {
  const [pickerKey, setPickerKey] = useState(0);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const selected = files[name] || [];
  const existingList = toExistingArray(existing);

  function mergePickedFiles(pickedFiles = []) {
    const picked = Array.from(pickedFiles || []).filter(Boolean);
    if (!picked.length) return;
    setFiles((old) => {
      const current = Array.isArray(old[name]) ? old[name] : [];
      const merged = [...current];
      picked.forEach((file) => {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        const exists = merged.some((item) => `${item.name}_${item.size}_${item.lastModified}` === key);
        if (!exists) merged.push(file);
      });
      return { ...old, [name]: merged };
    });
  }

  function onSelect(e) {
    const picked = Array.from(e.target.files || []);
    mergePickedFiles(picked);
    // reset หลังอ่านค่าแล้วเท่านั้น เพื่อให้ Samsung/Android บางรุ่นไม่ทำไฟล์หายตอนกลับจากคลังรูป
    window.setTimeout(() => {
      if (e.target) e.target.value = '';
      setPickerKey((key) => key + 1);
    }, 80);
  }

  function openPicker(ref) {
    try {
      ref.current?.click?.();
    } catch (_) {
      toastInfo('แตะปุ่มอีกครั้งเพื่อเลือกรูป');
    }
  }

  function clearSelected() {
    setFiles((old) => ({ ...old, [name]: [] }));
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
    setPickerKey((key) => key + 1);
  }

  function removeSelected(index) {
    setFiles((old) => {
      const current = Array.isArray(old[name]) ? old[name] : [];
      return { ...old, [name]: current.filter((_, i) => i !== index) };
    });
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
    setPickerKey((key) => key + 1);
  }

  return (
    <div className="file-picker-card">
      <input
        key={`${name}_gallery_${pickerKey}`}
        ref={galleryRef}
        className="sr-only"
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,.pdf"
        multiple
        onChange={onSelect}
      />
      <input
        key={`${name}_camera_${pickerKey}`}
        ref={cameraRef}
        className="sr-only"
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
        capture="environment"
        onChange={onSelect}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="label text-[12px] md:text-[13px]">{label}</span>
          {hint && <p className="hint mt-1">{hint}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${selected.length > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
          {selected.length > 0 ? `${selected.length} ไฟล์` : 'ว่าง'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => openPicker(galleryRef)} className="min-h-[72px] rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/45 p-3 text-center shadow-sm transition active:scale-[.98]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Camera size={18} /></div>
          <p className="mt-2 text-xs font-black text-slate-900">เลือกรูป</p>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">จากคลัง</p>
        </button>
        <button type="button" onClick={() => openPicker(cameraRef)} className="min-h-[72px] rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/45 p-3 text-center shadow-sm transition active:scale-[.98]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Camera size={18} /></div>
          <p className="mt-2 text-xs font-black text-slate-900">ถ่ายรูป</p>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">กล้องมือถือ</p>
        </button>
        {selected.length > 0 && (
          <button type="button" onClick={clearSelected} className="btn-soft col-span-2 w-full text-xs">
            <RotateCcw size={14} /> เลือกใหม่
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {selected.length > 0 && (
          <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50/80 p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-2 text-xs font-black text-blue-900">
                <CheckCircle2 size={16} className="shrink-0" /> เลือกแล้ว {selected.length} ไฟล์ รอกดบันทึก
              </p>
              <button type="button" onClick={clearSelected} className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
                ล้างทั้งหมด
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {selected.map((file, index) => (
                <SelectedFilePreview
                  key={`${file.name}_${file.size}_${file.lastModified}_${index}`}
                  file={file}
                  index={index}
                  onRemove={() => removeSelected(index)}
                />
              ))}
            </div>
          </div>
        )}
        {existingList.length > 0 && (
          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <p className="mb-2 text-[11px] font-black text-slate-400">ไฟล์เดิม {existingList.length} ไฟล์</p>
            <div className="flex flex-wrap gap-2">
              {existingList.slice(0, 10).map((path, index) => (
                <a key={`${path}-${index}`} href={uploadUrl(path)} target="_blank" rel="noreferrer" className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                  <img src={uploadUrl(path)} alt={`${label} ${index + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isImageFile(file) {
  return isLikelyImageFile(file);
}

function isPdfFile(file) {
  return isLikelyPdfFile(file);
}

function SelectedFilePreview({ file, index, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file || !isImageFile(file)) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const title = String(file?.name || `ไฟล์ที่ ${index + 1}`);
  const typeText = isImageFile(file) ? 'รูปภาพ' : isPdfFile(file) ? 'PDF' : 'ไฟล์';

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-blue-100">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition group-hover:bg-red-600"
        aria-label={`ลบ ${title}`}
      >
        <X size={14} />
      </button>
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        {previewUrl ? (
          <img src={previewUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-blue-50 text-blue-700">
            {isPdfFile(file) ? <FileText size={26} /> : <Camera size={26} />}
            <span className="text-[10px] font-black uppercase tracking-wide">{typeText}</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="line-clamp-2 min-h-[2rem] break-all text-[11px] font-black leading-4 text-slate-800">{title}</p>
        <p className="mt-1 text-[10px] font-bold text-slate-400">{formatFileSize(file?.size || 0)}</p>
      </div>
    </div>
  );
}
