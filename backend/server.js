try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not loaded, using Render environment variables');
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const config = require('./config');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
  pingInterval: 10000,
  pingTimeout: 20000,
});

io.on('connection', (socket) => {
<<<<<<< HEAD
  socket.emit('server:hello', { success: true, build: 'heng-charoen-v60-fuel-control', at: new Date().toISOString() });
=======
  socket.emit('server:hello', { success: true, build: 'heng-charoen-relayout-v1', at: new Date().toISOString() });
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
});
const uploadDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ITEM_TYPES = ['ดีเซล', 'น้ำมันเครื่อง', 'แอดบลู'];
const ITEM_TYPE_MAP = {
  diesel: 'ดีเซล',
  'ดีเซล': 'ดีเซล',
  'น้ำมันดีเซล': 'ดีเซล',
  engine_oil: 'น้ำมันเครื่อง',
  oil_engine: 'น้ำมันเครื่อง',
  motor_oil: 'น้ำมันเครื่อง',
  'น้ำมันเครื่อง': 'น้ำมันเครื่อง',
  adblue: 'แอดบลู',
  'แอดบลู': 'แอดบลู',
  'น้ำแอดบลู': 'แอดบลู',
};

<<<<<<< HEAD
const DEFAULT_STOCK_SETTINGS = {
  'ดีเซล': {
    tank_name: 'ถังดีเซลหลัก',
    capacity_liters: 1000,
    reorder_level_liters: 300,
    critical_level_liters: 100,
  },
  'น้ำมันเครื่อง': {
    tank_name: 'คลังน้ำมันเครื่อง',
    capacity_liters: 200,
    reorder_level_liters: 60,
    critical_level_liters: 20,
  },
  'แอดบลู': {
    tank_name: 'ถังแอดบลู',
    capacity_liters: 500,
    reorder_level_liters: 150,
    critical_level_liters: 50,
  },
};

=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
let mongoClient = null;
let mongoDb = null;

function nowIso() {
  return new Date().toISOString();
}

function today() {
<<<<<<< HEAD
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone || 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
=======
  return new Date().toISOString().slice(0, 10);
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
}

function jsonResponse(res, data, status = 200) {
  return res.status(status).json(data);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function oidOrNull(id) {
  if (id instanceof ObjectId) return id;
  const text = String(id || '').trim();
  if (!/^[a-f0-9]{24}$/i.test(text)) return null;
  try {
    return new ObjectId(text);
  } catch (_) {
    return null;
  }
}

function parseDateOrNull(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeDecimalText(value) {
  if (value === undefined || value === null || value === '') return '';
  let text = String(value)
    .replace(/[๐-๙]/g, (d) => '๐๑๒๓๔๕๖๗๘๙'.indexOf(d))
    .replace(/[−–—]/g, '-')
    .replace(/[٫．]/g, '.')
    .replace(/\s+/g, '')
    .trim();

  // มือถือบางรุ่นผู้ใช้กด : แทนจุดทศนิยม เช่น 100:20 ให้เป็น 100.20
  if (text.includes(':') && !text.includes('.') && !text.includes(',')) {
    const parts = text.split(':');
    if (parts.length === 2 && /^-?\d+$/.test(parts[0]) && /^\d{1,6}$/.test(parts[1])) {
      text = `${parts[0]}.${parts[1]}`;
    }
  }

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  if (hasComma && hasDot) {
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');
    if (lastComma > lastDot) text = text.replace(/\./g, '').replace(',', '.');
    else text = text.replace(/,/g, '');
  } else if (hasComma && !hasDot) {
    const parts = text.split(',');
    if (parts.length === 2) {
      const [whole, frac] = parts;
      // คอมม่าอาจเป็นทศนิยมจากมือถือ เช่น 100,20 หรือเป็นหลักพัน เช่น 8,325 / 10,800
      const isThousands = /^-?\d{1,3}$/.test(whole) && /^\d{3}$/.test(frac);
      const isDecimalComma = /^-?\d+$/.test(whole) && /^\d{1,2}$/.test(frac);
      text = isThousands ? `${whole}${frac}` : isDecimalComma ? `${whole}.${frac}` : text.replace(/,/g, '');
    } else {
      text = text.replace(/,/g, '');
    }
  }

  text = text.replace(/[^0-9.\-]/g, '');
  const minus = text.startsWith('-') ? '-' : '';
  text = minus + text.replace(/-/g, '');
  const firstDot = text.indexOf('.');
  if (firstDot !== -1) text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, '');
  return text;
}

function toNumber(value, defaultValue = 0) {
  const text = normalizeDecimalText(value);
  if (!text || text === '-' || text === '.') return defaultValue;
  const n = Number(text);
  return Number.isFinite(n) ? n : defaultValue;
}

function decimalPlaces(value) {
  const text = normalizeDecimalText(value);
  const dot = text.indexOf('.');
  return dot >= 0 ? Math.min(6, text.length - dot - 1) : 0;
}

function toScaledInteger(value, scale) {
  const text = normalizeDecimalText(value);
  if (!text || text === '-' || text === '.') return 0;
  const negative = text.startsWith('-');
  const clean = negative ? text.slice(1) : text;
  const [wholeRaw = '0', fracRaw = ''] = clean.split('.');
  const whole = wholeRaw || '0';
  const frac = (fracRaw + '0'.repeat(scale)).slice(0, scale);
  const result = Number(BigInt(whole || '0') * BigInt(10 ** scale) + BigInt(frac || '0'));
  return negative ? -result : result;
}

function preciseSubtract(afterValue, beforeValue, digits = 2) {
  const scale = Math.max(digits, decimalPlaces(afterValue), decimalPlaces(beforeValue));
  const afterInt = toScaledInteger(afterValue, scale);
  const beforeInt = toScaledInteger(beforeValue, scale);
  return round2((afterInt - beforeInt) / (10 ** scale));
}

function round2(value) {
  const n = toNumber(value, 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function hasDecimalPart(value) {
  const n = Math.abs(toNumber(value, 0));
  return Math.abs(n - Math.trunc(n)) > 0;
}

function pickBestLiterValue(...values) {
  const candidates = values.map((value) => round2(value)).filter((value) => Number.isFinite(value) && value > 0);
  if (!candidates.length) return 0;
  const decimalCandidate = candidates.find((value) => hasDecimalPart(value));
  return decimalCandidate || candidates[0];
}

function expectedAmountFromPrice(quantityLiters, priceBahtPerLiter) {
  const qty = toNumber(quantityLiters, 0);
  const price = toNumber(priceBahtPerLiter, 0);
  return qty > 0 && price > 0 ? round2(qty * price) : 0;
}

function correctAmountIfCommaBug(amountValue, quantityLiters, priceBahtPerLiter) {
  const amount = round2(amountValue);
  const expected = expectedAmountFromPrice(quantityLiters, priceBahtPerLiter);
  if (expected <= 0) return amount;
  // กันข้อมูลเก่าที่เคยถูกอ่านคอมม่าเป็นทศนิยม เช่น 8,325 -> 8.32
  if (!amount || (expected >= 1000 && amount < expected * 0.2)) return expected;
  return amount;
}

function cleanString(value, defaultValue = '') {
  if (value === undefined || value === null) return defaultValue;
  return String(value).trim();
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeRegex(text) {
  return new RegExp(escapeRegExp(text), 'i');
}

function realtimePayload(kind, action, data = {}) {
  return { kind, action, data, at: nowIso() };
}

function emitDataChanged(kind, action, data = {}) {
  const payload = realtimePayload(kind, action, data);
  try {
    io.emit(`${kind}:changed`, payload);
    io.emit('realtime:update', payload);
  } catch (err) {
    console.warn('Realtime emit skipped:', err.message);
  }
}

function normalizeItemType(value) {
  const key = cleanString(value).toLowerCase();
  return ITEM_TYPE_MAP[key] || ITEM_TYPE_MAP[cleanString(value)] || null;
}

function monthFromDate(value) {
  const date = parseDateOrNull(value) || today();
  return date.slice(0, 7);
}

function mongoToPlain(value) {
  if (!value) return value;
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => mongoToPlain(item));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === '_id') out.id = mongoToPlain(item);
      else out[key] = mongoToPlain(item);
    }
    return out;
  }
  return value;
}

function publicUser(user) {
  if (!user) return null;
  const out = mongoToPlain(user);
  delete out.password_hash;
  delete out.password;
  return out;
}

function parseCookieHeader(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  String(cookieHeader).split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const match = String(authHeader).match(/^Bearer\s+(.+)$/i);
  if (match) return match[1].trim();
  const xAccessToken = req.headers['x-access-token'];
  if (xAccessToken) return String(xAccessToken).trim();
  const cookies = parseCookieHeader(req.headers.cookie);
  if (cookies.token) return cookies.token;
  if (cookies.accessToken) return cookies.accessToken;
  if (req.query && req.query.token) return String(req.query.token).trim();
  return null;
}

function signUserToken(user) {
  const id = String(user.id || user._id || '');
  return jwt.sign(
    {
      sub: id,
      id,
      user_id: id,
      role: user.role || 'employee',
      username: user.username || '',
    },
    config.jwtSecret,
    { expiresIn: Number(config.jwtExpireSeconds || 60 * 60 * 24 * 7) },
  );
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('users').createIndex({ username: 1 }, { unique: true }),
    db.collection('deliveries').createIndex({ user_id: 1, work_date: -1 }),
    db.collection('deliveries').createIndex({ vehicle_id: 1 }),
    db.collection('deliveries').createIndex({ item_type: 1, fill_date: -1 }),
    db.collection('deliveries').createIndex({ 'jobs.origin_place': 1 }),
    db.collection('deliveries').createIndex({ 'jobs.destination_place': 1 }),
    db.collection('vehicles').createIndex({ user_id: 1, plate_no: 1 }),
    db.collection('notifications').createIndex({ delivery_id: 1, created_at: -1 }),
<<<<<<< HEAD
    db.collection('notifications').createIndex({ kind: 1, item_type: 1, is_read: 1, created_at: -1 }),
    db.collection('stocks').createIndex({ item_type: 1 }, { unique: true }),
    db.collection('stock_movements').createIndex({ item_type: 1, transaction_date: -1 }),
    db.collection('stock_audits').createIndex({ item_type: 1, audit_date: -1 }),
    db.collection('stock_audits').createIndex({ created_at: -1 }),
=======
    db.collection('stocks').createIndex({ item_type: 1 }, { unique: true }),
    db.collection('stock_movements').createIndex({ item_type: 1, transaction_date: -1 }),
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
    db.collection('uploaded_files').createIndex({ created_at: -1 }),
  ]);

  for (const itemType of ITEM_TYPES) {
<<<<<<< HEAD
    const defaults = DEFAULT_STOCK_SETTINGS[itemType] || DEFAULT_STOCK_SETTINGS['ดีเซล'];
=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
    await db.collection('stocks').updateOne(
      { item_type: itemType },
      {
        $setOnInsert: {
          item_type: itemType,
          balance_liters: 0,
<<<<<<< HEAD
          tank_name: defaults.tank_name,
          capacity_liters: defaults.capacity_liters,
          reorder_level_liters: defaults.reorder_level_liters,
          critical_level_liters: defaults.critical_level_liters,
          last_alert_status: 'ready',
=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
          created_at: nowIso(),
        },
        $set: { updated_at: nowIso() },
      },
      { upsert: true },
    );
<<<<<<< HEAD
    const missingFieldUpdates = [
      ['tank_name', defaults.tank_name],
      ['capacity_liters', defaults.capacity_liters],
      ['reorder_level_liters', defaults.reorder_level_liters],
      ['critical_level_liters', defaults.critical_level_liters],
      ['last_alert_status', 'ready'],
    ];
    for (const [field, value] of missingFieldUpdates) {
      await db.collection('stocks').updateOne(
        { item_type: itemType, [field]: { $exists: false } },
        { $set: { [field]: value, updated_at: nowIso() } },
      );
    }
=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  }
}

async function getDb() {
  if (mongoDb) return mongoDb;
  if (!config.mongodb.uri) throw new Error('MONGODB_URI is not set');
  mongoClient = new MongoClient(config.mongodb.uri, { serverSelectionTimeoutMS: 10000 });
  await mongoClient.connect();
  mongoDb = mongoClient.db(config.mongodb.db);
  await ensureIndexes(mongoDb);
  return mongoDb;
}

async function currentUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (_) {
    return null;
  }
  const possibleId = payload.sub || payload.id || payload.user_id || payload.uid;
  const oid = oidOrNull(possibleId);
  let user = null;
  if (oid) {
    user = await req.db.collection('users').findOne(
      { _id: oid, is_active: { $ne: 0 } },
      { projection: { password_hash: 0, password: 0 } },
    );
  }
  if (!user && payload.username) {
    user = await req.db.collection('users').findOne(
      { username: String(payload.username), is_active: { $ne: 0 } },
      { projection: { password_hash: 0, password: 0 } },
    );
  }
  return publicUser(user);
}

async function requireAuth(req, res, next) {
  const user = await currentUser(req);
  if (!user) return jsonResponse(res, { success: false, message: 'กรุณาเข้าสู่ระบบใหม่' }, 401);
  req.user = user;
  return next();
}

function requireOwner(req, res, next) {
  if ((req.user?.role || '') !== 'owner') return jsonResponse(res, { success: false, message: 'ไม่มีสิทธิ์สำหรับหน้านี้' }, 403);
  return next();
}

async function findUserPublic(db, id) {
  const oid = oidOrNull(id);
  if (!oid) return null;
  const user = await db.collection('users').findOne({ _id: oid }, { projection: { password_hash: 0, password: 0 } });
  return publicUser(user);
}

async function findVehiclePublic(db, id) {
  const oid = oidOrNull(id);
  if (!oid) return null;
  return mongoToPlain(await db.collection('vehicles').findOne({ _id: oid }));
}

async function resolveVehicleId(db, user, data) {
  if (data.vehicle_id) {
    const oid = oidOrNull(data.vehicle_id);
    if (!oid) return null;
    const filter = { _id: oid, is_active: { $ne: 0 } };
    if ((user.role || '') !== 'owner') filter.user_id = String(user.id);
    const vehicle = await db.collection('vehicles').findOne(filter, { projection: { _id: 1 } });
    return vehicle ? String(vehicle._id) : null;
  }

  const plate = cleanString(data.plate_no);
  if (!plate) return null;
  const ownerAssignedUser = (user.role || '') === 'owner' && data.user_id;
  const vehicleUserId = ownerAssignedUser ? String(data.user_id) : String(user.id);
  const vehicleNo = cleanString(data.vehicle_no) || null;
  const driverName = cleanString(data.driver_name) || ((user.role || '') === 'owner' ? null : (user.name || null));

  const existing = await db.collection('vehicles').findOne(
    { plate_no: plate, user_id: vehicleUserId, is_active: 1 },
    { sort: { created_at: -1 }, projection: { _id: 1 } },
  );
  if (existing) return String(existing._id);

  const result = await db.collection('vehicles').insertOne({
    user_id: vehicleUserId,
    plate_no: plate,
    vehicle_no: vehicleNo,
    driver_name: driverName,
    description: 'เพิ่มจากหน้าบันทึกงาน',
    is_active: 1,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  return String(result.insertedId);
}


async function fileUrlFromFile(db, file) {
  if (!file) return null;
  try {
    const fullPath = file.path;
    const buffer = fs.readFileSync(fullPath);
    // เก็บรูป/ไฟล์ไว้ใน MongoDB ด้วย เพื่อไม่ให้รูปหายเมื่อ Render restart หรือ redeploy
    // ถ้าไฟล์ใหญ่มากเกินไป จะ fallback เป็นไฟล์ในเครื่องตามปกติ
    const maxDbBytes = Math.max(Number(config.uploadDbMaxMb || 10), 2) * 1024 * 1024;
    if (buffer.length <= maxDbBytes) {
      const result = await db.collection('uploaded_files').insertOne({
        filename: file.originalname || file.filename,
        stored_filename: file.filename,
        content_type: file.mimetype || 'application/octet-stream',
        size_bytes: buffer.length,
        data: buffer,
        created_at: nowIso(),
      });
      return `/uploads/db/${String(result.insertedId)}`;
    }
  } catch (err) {
    console.warn('DB upload store skipped:', err.message);
  }
  return `/uploads/${file.filename}`;
}

function toPhotoArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

function uniqueList(items) {
  return [...new Set((items || []).filter(Boolean))];
}

async function appendUploadPhotos(db, files = {}, names = []) {
  const urls = [];
  for (const name of names) {
    const list = Array.isArray(files[name]) ? files[name] : [];
    for (const file of list) {
      const url = await fileUrlFromFile(db, file);
      if (url) urls.push(url);
    }
  }
  return urls;
}

async function extractPhotoFields(db, files = {}, existing = {}) {
  const categories = [
    { single: 'bill_photo', plural: 'bill_photos', aliases: ['bill_photo', 'bill_photos', 'receipt_photo', 'receipt_photos', 'photo'], existingSingles: ['bill_photo', 'receipt_photo'] },
    { single: 'document_photo', plural: 'document_photos', aliases: ['document_photo', 'document_photos'], existingSingles: ['document_photo'] },
    { single: 'oil_photo', plural: 'oil_photos', aliases: ['oil_photo', 'oil_photos'], existingSingles: ['oil_photo'] },
    { single: 'cargo_photo', plural: 'cargo_photos', aliases: ['cargo_photo', 'cargo_photos'], existingSingles: ['cargo_photo'] },
    { single: 'adblue_photo', plural: 'adblue_photos', aliases: ['adblue_photo', 'adblue_photos'], existingSingles: ['adblue_photo'] },
    { single: 'stock_photo', plural: 'stock_photos', aliases: ['stock_photo', 'stock_photos'], existingSingles: ['stock_photo'] },
  ];

  const photoFields = {};
  for (const category of categories) {
    const existingPhotos = [
      ...toPhotoArray(existing[category.plural]),
      ...category.existingSingles.flatMap((field) => toPhotoArray(existing[field])),
    ];
    const uploadedPhotos = await appendUploadPhotos(db, files, category.aliases);
    const allPhotos = uniqueList([...existingPhotos, ...uploadedPhotos]);
    photoFields[category.plural] = allPhotos;
    photoFields[category.single] = allPhotos[0] || '';
  }
  photoFields.receipt_photo = photoFields.bill_photo || '';
  return photoFields;
}


function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return null;
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

function deliveryJobHasContent(job = {}) {
  return Boolean(
    cleanString(job.cargo_name) ||
    cleanString(job.origin_place) ||
    cleanString(job.destination_place) ||
    cleanString(job.wage_payer) ||
    cleanString(job.note) ||
    parseDateOrNull(job.load_date) ||
    parseDateOrNull(job.unload_date) ||
    toNumber(job.distance_km, 0) > 0 ||
    toNumber(job.loading_weight_kg, 0) > 0 ||
    toNumber(job.unloading_weight_kg, 0) > 0 ||
    toNumber(job.cargo_stone_weight, 0) > 0 ||
    toNumber(job.cargo_sand_weight, 0) > 0 ||
    toNumber(job.trip_fee_baht, 0) > 0 ||
    toNumber(job.allowance_baht, 0) > 0 ||
    toNumber(job.other_income_baht, 0) > 0
  );
}

function legacyDeliveryJob(source = {}) {
  return {
    id: cleanString(source.job_id) || 'job_1',
    job_no: 1,
    cargo_name: cleanString(source.cargo_name),
    origin_place: cleanString(source.origin_place),
    destination_place: cleanString(source.destination_place),
    load_date: parseDateOrNull(source.load_date),
    unload_date: parseDateOrNull(source.unload_date),
    distance_km: round2(Math.max(0, toNumber(source.distance_km, 0))),
    loading_weight_kg: round2(Math.max(0, toNumber(source.loading_weight_kg, 0))),
    unloading_weight_kg: round2(Math.max(0, toNumber(source.unloading_weight_kg, 0))),
    cargo_stone_weight: round2(Math.max(0, toNumber(source.cargo_stone_weight, 0))),
    cargo_sand_weight: round2(Math.max(0, toNumber(source.cargo_sand_weight, 0))),
    trip_fee_baht: round2(Math.max(0, toNumber(source.trip_fee_baht, 0))),
    allowance_baht: round2(Math.max(0, toNumber(source.allowance_baht, 0))),
    other_income_baht: round2(Math.max(0, toNumber(source.other_income_baht, 0))),
    total_income_baht: round2(
      Math.max(0, toNumber(source.trip_fee_baht, 0)) +
      Math.max(0, toNumber(source.allowance_baht, 0)) +
      Math.max(0, toNumber(source.other_income_baht, 0)),
    ),
    wage_payer: cleanString(source.wage_payer),
    payment_status: cleanString(source.payment_status) || 'pending',
    note: cleanString(source.job_note),
  };
}

function normalizeDeliveryJobs(body = {}, existing = {}) {
  const submitted = parseJsonArray(body.jobs);
  const existingJobs = parseJsonArray(existing.jobs) || (Array.isArray(existing.jobs) ? existing.jobs : null);
  let rawJobs;

  if (submitted !== null) rawJobs = submitted;
  else if (existingJobs && existingJobs.length) rawJobs = existingJobs;
  else {
    const legacy = legacyDeliveryJob({ ...existing, ...body });
    rawJobs = deliveryJobHasContent(legacy) ? [legacy] : [];
  }

  return rawJobs
    .map((raw, index) => {
      const job = raw && typeof raw === 'object' ? raw : {};
      const tripFee = round2(Math.max(0, toNumber(job.trip_fee_baht, 0)));
      const allowance = round2(Math.max(0, toNumber(job.allowance_baht, 0)));
      const otherIncome = round2(Math.max(0, toNumber(job.other_income_baht, 0)));
      return {
        id: cleanString(job.id) || cleanString(job.client_id) || `job_${index + 1}`,
        job_no: index + 1,
        cargo_name: cleanString(job.cargo_name),
        origin_place: cleanString(job.origin_place),
        destination_place: cleanString(job.destination_place),
        load_date: parseDateOrNull(job.load_date),
        unload_date: parseDateOrNull(job.unload_date),
        distance_km: round2(Math.max(0, toNumber(job.distance_km, 0))),
        loading_weight_kg: round2(Math.max(0, toNumber(job.loading_weight_kg, 0))),
        unloading_weight_kg: round2(Math.max(0, toNumber(job.unloading_weight_kg, 0))),
        cargo_stone_weight: round2(Math.max(0, toNumber(job.cargo_stone_weight, 0))),
        cargo_sand_weight: round2(Math.max(0, toNumber(job.cargo_sand_weight, 0))),
        trip_fee_baht: tripFee,
        allowance_baht: allowance,
        other_income_baht: otherIncome,
        total_income_baht: round2(tripFee + allowance + otherIncome),
        wage_payer: cleanString(job.wage_payer),
        payment_status: cleanString(job.payment_status) || 'pending',
        note: cleanString(job.note || job.job_note),
      };
    })
    .filter(deliveryJobHasContent)
    .map((job, index) => ({ ...job, job_no: index + 1 }));
}

function summarizeDeliveryJobs(jobs = []) {
  const summary = jobs.reduce((acc, job) => {
    acc.distance_km += toNumber(job.distance_km, 0);
    acc.loading_weight_kg += toNumber(job.loading_weight_kg, 0);
    acc.unloading_weight_kg += toNumber(job.unloading_weight_kg, 0);
    acc.cargo_stone_weight += toNumber(job.cargo_stone_weight, 0);
    acc.cargo_sand_weight += toNumber(job.cargo_sand_weight, 0);
    acc.trip_fee_baht += toNumber(job.trip_fee_baht, 0);
    acc.allowance_baht += toNumber(job.allowance_baht, 0);
    acc.other_income_baht += toNumber(job.other_income_baht, 0);
    return acc;
  }, {
    distance_km: 0,
    loading_weight_kg: 0,
    unloading_weight_kg: 0,
    cargo_stone_weight: 0,
    cargo_sand_weight: 0,
    trip_fee_baht: 0,
    allowance_baht: 0,
    other_income_baht: 0,
  });
  Object.keys(summary).forEach((key) => { summary[key] = round2(summary[key]); });
  summary.total_income_baht = round2(summary.trip_fee_baht + summary.allowance_baht + summary.other_income_baht);
  summary.job_count = jobs.length;
  return summary;
}

async function normalizeDeliveryBody(db, body, files = {}, user, existing = {}) {
  const itemType = normalizeItemType(body.item_type || body.oil_type || existing.item_type || existing.oil_type);
  if (!itemType) {
    const err = new Error('เลือกประเภทให้ถูกต้อง: ดีเซล, น้ำมันเครื่อง, แอดบลู');
    err.status = 422;
    throw err;
  }

  const workDate = parseDateOrNull(body.work_date) || parseDateOrNull(body.created_date) || existing.work_date || today();
  const fillDate = parseDateOrNull(body.fill_date) || parseDateOrNull(body.fuel_date) || existing.fill_date || workDate;
  // v37: เลขหัวจ่ายก่อน/หลังเป็นเลขอ้างอิงเท่านั้น ไม่ใช้คำนวณจำนวนลิตรแล้ว
  const odometerBefore = Math.round(toNumber(body.station_meter_before || body.nozzle_meter_before || body.odometer_before, toNumber(existing.station_meter_before || existing.odometer_before, 0)));
  const odometerAfter = Math.round(toNumber(body.station_meter_after || body.nozzle_meter_after || body.odometer_after, toNumber(existing.station_meter_after || existing.odometer_after, 0)));
<<<<<<< HEAD
  const requestedQuantityLiters = round2(toNumber(
    body.actual_filled_liters || body.station_liters || body.quantity_liters || body.liters || body.adblue_liters,
    toNumber(existing.actual_filled_liters, toNumber(existing.quantity_liters, 0)),
  ));
=======
  const requestedQuantityLiters = round2(toNumber(body.station_liters || body.quantity_liters || body.liters || body.adblue_liters, toNumber(existing.quantity_liters, 0)));
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  const nozzleLiters = 0;
  const jobs = normalizeDeliveryJobs(body, existing);
  const jobsSummary = summarizeDeliveryJobs(jobs);
  const explicitDistance = toNumber(body.distance_km, toNumber(existing.distance_km, 0));
  // v58: หากรถคันเดียวมีหลายงาน ให้รวมระยะทางของทุกงานเป็นระยะทางหลักในการคำนวณน้ำมัน
  const distanceKm = jobsSummary.distance_km > 0
    ? jobsSummary.distance_km
    : (explicitDistance > 0 ? round2(explicitDistance) : 0);
  const firstJob = jobs[0] || {};
  const selectedVehicleId = body.vehicle_id || existing.vehicle_id || null;
  const selectedVehicle = selectedVehicleId ? await findVehiclePublic(db, selectedVehicleId) : null;
  const vehicleExpectedRate = toNumber(selectedVehicle?.fuel_efficiency_km_per_liter, 0);
  // v51: อัตราประจำรถต้องมาจากทะเบียนรถเป็นหลัก ไม่ให้ค่าที่ส่งมากับแต่ละเที่ยวเปลี่ยนมาตรฐานของรถ
  const existingExpectedRate = toNumber(existing.expected_fuel_efficiency_km_per_liter, 0);
  const legacyRequestedRate = toNumber(body.expected_fuel_efficiency_km_per_liter, 0);
  const expectedFuelEfficiency = round2(Math.max(
    0,
    vehicleExpectedRate > 0 ? vehicleExpectedRate : (existingExpectedRate > 0 ? existingExpectedRate : legacyRequestedRate),
  ));
  // v51: ดีเซลคำนวณจำนวนลิตรจากระยะทาง ÷ อัตราประจำรถ โดย backend คำนวณซ้ำเพื่อให้ข้อมูลและสต๊อกตรงกัน
  const recommendedFuelLiters = itemType === 'ดีเซล' && distanceKm > 0 && expectedFuelEfficiency > 0
    ? round2(distanceKm / expectedFuelEfficiency)
    : 0;
<<<<<<< HEAD
  // v60: ดีเซลยังคำนวณลิตรตามมาตรฐานจากระยะทาง แต่เก็บ “ลิตรเติมจริง” แยกเพื่อวิเคราะห์ส่วนต่าง
  // ถ้าพนักงานไม่กรอกลิตรจริง ระบบใช้ลิตรตามมาตรฐานเป็นค่าเริ่มต้น จึงไม่กระทบการทำงานเดิม
  const quantityLiters = requestedQuantityLiters > 0 ? requestedQuantityLiters : recommendedFuelLiters;
  const standardFuelLiters = itemType === 'ดีเซล' && recommendedFuelLiters > 0 ? recommendedFuelLiters : quantityLiters;
  const fuelVarianceLiters = itemType === 'ดีเซล' ? round2(quantityLiters - standardFuelLiters) : 0;
=======
  const quantityLiters = recommendedFuelLiters > 0 ? recommendedFuelLiters : requestedQuantityLiters;
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  const estimatedDistanceKm = itemType === 'ดีเซล' && quantityLiters > 0 && expectedFuelEfficiency > 0
    ? round2(quantityLiters * expectedFuelEfficiency)
    : 0;
  const priceBahtPerLiter = toNumber(body.price_baht_per_liter || body.price_per_liter, toNumber(existing.price_baht_per_liter || existing.price_per_liter, 0));
  const explicitAmount = toNumber(body.amount_baht, 0);
<<<<<<< HEAD
  const actualAmount = expectedAmountFromPrice(quantityLiters, priceBahtPerLiter);
  const standardAmount = expectedAmountFromPrice(standardFuelLiters, priceBahtPerLiter);
  const amountBaht = actualAmount > 0 ? actualAmount : correctAmountIfCommaBug(explicitAmount, quantityLiters, priceBahtPerLiter);
  const fuelEfficiency = distanceKm > 0 && quantityLiters > 0 ? round2(distanceKm / quantityLiters) : 0;
  const fuelVarianceBaht = round2(fuelVarianceLiters * priceBahtPerLiter);
  const costPerKm = distanceKm > 0 ? round2(amountBaht / distanceKm) : 0;
  const efficiencyStatus = fuelVarianceLiters > 0.01 ? 'over_standard' : fuelVarianceLiters < -0.01 ? 'under_standard' : 'on_standard';
=======
  const expectedAmount = expectedAmountFromPrice(quantityLiters, priceBahtPerLiter);
  // v51: จำนวนบาทใช้สูตร จำนวนลิตรตามเรท × ราคาน้ำมันลิตรละ เป็นหลัก
  const amountBaht = expectedAmount > 0 ? expectedAmount : correctAmountIfCommaBug(explicitAmount, quantityLiters, priceBahtPerLiter);
  const fuelEfficiency = distanceKm > 0 && quantityLiters > 0 ? round2(distanceKm / quantityLiters) : 0;
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c

  const photoFields = await extractPhotoFields(db, files, existing);
  const data = {
    user_id: (user.role || '') === 'owner' && body.user_id ? String(body.user_id) : String(user.id),
    vehicle_id: body.vehicle_id ? String(body.vehicle_id) : existing.vehicle_id || null,
    work_date: workDate,
    fill_date: fillDate,
    fill_time: cleanString(body.fill_time, existing.fill_time || ''),
    report_month: cleanString(body.report_month) || monthFromDate(fillDate),
    operation_type: cleanString(body.operation_type) || cleanString(body.stock_action) || existing.operation_type || 'ทำน้ำมันบรรทุก',
    item_type: itemType,
    oil_type: itemType,
    bill_no: cleanString(body.bill_no, existing.bill_no || body.oil_bill_no || ''),
    oil_bill_no: cleanString(body.oil_bill_no, existing.oil_bill_no || body.bill_no || ''),
    diesel_bill_no: cleanString(body.diesel_bill_no, existing.diesel_bill_no || ''),
    engine_oil_bill_no: cleanString(body.engine_oil_bill_no, existing.engine_oil_bill_no || ''),
    adblue_bill_no: cleanString(body.adblue_bill_no, existing.adblue_bill_no || ''),
    document_no: cleanString(body.document_no, existing.document_no || ''),
    work_bill_no: cleanString(body.work_bill_no, existing.work_bill_no || body.bill_no || ''),
    stone_bill_no: cleanString(body.stone_bill_no, existing.stone_bill_no || ''),
    sand_bill_no: cleanString(body.sand_bill_no, existing.sand_bill_no || ''),
    origin_place: cleanString(firstJob.origin_place, cleanString(body.origin_place, existing.origin_place || '')),
    destination_place: cleanString(firstJob.destination_place, cleanString(body.destination_place, existing.destination_place || '')),
    load_date: firstJob.load_date || parseDateOrNull(body.load_date) || existing.load_date || null,
    unload_date: firstJob.unload_date || parseDateOrNull(body.unload_date) || existing.unload_date || null,
    cargo_name: cleanString(firstJob.cargo_name, cleanString(body.cargo_name, existing.cargo_name || '')),
    loading_weight_kg: round2(toNumber(firstJob.loading_weight_kg, toNumber(body.loading_weight_kg, toNumber(existing.loading_weight_kg, 0)))),
    unloading_weight_kg: round2(toNumber(firstJob.unloading_weight_kg, toNumber(body.unloading_weight_kg, toNumber(existing.unloading_weight_kg, 0)))),
    cargo_stone_weight: jobs.length ? jobsSummary.cargo_stone_weight : toNumber(body.cargo_stone_weight, toNumber(existing.cargo_stone_weight, 0)),
    cargo_sand_weight: jobs.length ? jobsSummary.cargo_sand_weight : toNumber(body.cargo_sand_weight, toNumber(existing.cargo_sand_weight, 0)),
    quantity_liters: quantityLiters,
<<<<<<< HEAD
    actual_filled_liters: quantityLiters,
    standard_fuel_liters: standardFuelLiters,
    fuel_variance_liters: fuelVarianceLiters,
    fuel_variance_baht: fuelVarianceBaht,
    expected_fuel_cost_baht: standardAmount,
    actual_fuel_cost_baht: amountBaht,
    cost_per_km: costPerKm,
    efficiency_status: efficiencyStatus,
=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
    station_liters: quantityLiters,
    adblue_liters: itemType === 'แอดบลู' ? quantityLiters : toNumber(body.adblue_liters, toNumber(existing.adblue_liters, 0)),
    diesel_liters: itemType === 'ดีเซล' ? quantityLiters : toNumber(body.diesel_liters, toNumber(existing.diesel_liters, 0)),
    engine_oil_liters: itemType === 'น้ำมันเครื่อง' ? quantityLiters : toNumber(body.engine_oil_liters, toNumber(existing.engine_oil_liters, 0)),
    price_baht_per_liter: priceBahtPerLiter,
    amount_baht: amountBaht,
    distance_km: distanceKm,
    expected_fuel_efficiency_km_per_liter: expectedFuelEfficiency,
    estimated_distance_km: estimatedDistanceKm,
    recommended_fuel_liters: recommendedFuelLiters,
    calculation_mode: itemType === 'ดีเซล' ? 'distance_to_liters' : 'manual_liters',
    odometer_before: odometerBefore,
    odometer_after: odometerAfter,
    meter_distance_km: distanceKm,
    station_meter_before: odometerBefore,
    station_meter_after: odometerAfter,
    station_meter_delta_liters: nozzleLiters,
    nozzle_liters: nozzleLiters,
    // v51: จำนวนลิตร = ระยะทางที่กรอก ÷ อัตราประจำรถที่ดึงอัตโนมัติ
    fuel_used_liters: quantityLiters,
    fuel_efficiency_km_per_liter: fuelEfficiency,
    filler_name: cleanString(body.filler_name, existing.filler_name || ''),
    recorder_name: cleanString(body.recorder_name, existing.recorder_name || user.name || user.username || ''),
    driver_name_input: cleanString(body.driver_name, existing.driver_name_input || ''),
    trip_fee_baht: jobs.length ? jobsSummary.trip_fee_baht : round2(toNumber(body.trip_fee_baht, toNumber(existing.trip_fee_baht, 0))),
    allowance_baht: jobs.length ? jobsSummary.allowance_baht : round2(toNumber(body.allowance_baht, toNumber(existing.allowance_baht, 0))),
    other_income_baht: jobs.length ? jobsSummary.other_income_baht : round2(toNumber(body.other_income_baht, toNumber(existing.other_income_baht, 0))),
    total_income_baht: 0,
    wage_payer: cleanString(firstJob.wage_payer, cleanString(body.wage_payer, existing.wage_payer || '')),
    payment_status: jobs.length && jobs.every((job) => job.payment_status === 'paid') ? 'paid' : (cleanString(body.payment_status, existing.payment_status || 'pending') || 'pending'),
    note: cleanString(body.note, existing.note || ''),
    jobs,
    job_count: jobsSummary.job_count,
    total_job_distance_km: jobsSummary.distance_km,
    total_loading_weight_kg: jobsSummary.loading_weight_kg,
    total_unloading_weight_kg: jobsSummary.unloading_weight_kg,
    total_cargo_stone_weight: jobsSummary.cargo_stone_weight,
    total_cargo_sand_weight: jobsSummary.cargo_sand_weight,
    bill_photo: photoFields.bill_photo || '',
    receipt_photo: photoFields.bill_photo || '',
    bill_photos: photoFields.bill_photos || [],
    document_photo: photoFields.document_photo || '',
    document_photos: photoFields.document_photos || [],
    oil_photo: photoFields.oil_photo || '',
    oil_photos: photoFields.oil_photos || [],
    cargo_photo: photoFields.cargo_photo || '',
    cargo_photos: photoFields.cargo_photos || [],
    adblue_photo: photoFields.adblue_photo || '',
    adblue_photos: photoFields.adblue_photos || [],
    diesel_amount_baht: itemType === 'ดีเซล' ? amountBaht : toNumber(body.diesel_amount_baht, toNumber(existing.diesel_amount_baht, 0)),
    engine_oil_amount_baht: itemType === 'น้ำมันเครื่อง' ? amountBaht : toNumber(body.engine_oil_amount_baht, toNumber(existing.engine_oil_amount_baht, 0)),
    adblue_amount_baht: itemType === 'แอดบลู' ? amountBaht : toNumber(body.adblue_amount_baht, toNumber(existing.adblue_amount_baht, 0)),
    updated_at: nowIso(),
  };
  data.total_income_baht = jobs.length
    ? jobsSummary.total_income_baht
    : round2(
      toNumber(data.trip_fee_baht, 0) +
      toNumber(data.allowance_baht, 0) +
      toNumber(data.other_income_baht, 0),
    );
  return data;
}

async function createAutoNotifications(db, deliveryId, data) {
  const alerts = [];
  if (Number(data.quantity_liters || 0) >= 280) alerts.push(['ปริมาณสูงผิดปกติ', 'รายการนี้มีปริมาณตั้งแต่ 280 ลิตรขึ้นไป กรุณาตรวจสอบ', 'danger']);
<<<<<<< HEAD
  const varianceLiters = toNumber(data.fuel_variance_liters, 0);
  const standardLiters = Math.max(0, toNumber(data.standard_fuel_liters || data.recommended_fuel_liters, 0));
  if (varianceLiters > Math.max(5, standardLiters * 0.1)) {
    alerts.push(['เติมน้ำมันเกินมาตรฐาน', `เติมจริงเกินค่าคำนวณ ${round2(varianceLiters).toFixed(2)} ลิตร คิดเป็น ${round2(data.fuel_variance_baht).toFixed(2)} บาท`, 'warning']);
  }
=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  if ((data.payment_status || 'pending') === 'pending') alerts.push(['รายได้ยังรอจ่าย', 'รายการนี้ยังเป็นสถานะรอจ่าย', 'warning']);
  if (!data.bill_photo && !toPhotoArray(data.bill_photos).length) alerts.push(['ยังไม่แนบรูปบิล', 'รายการนี้ยังไม่มีรูปบิล', 'info']);
  if (!data.document_photo && !toPhotoArray(data.document_photos).length) alerts.push(['ยังไม่แนบรูปเอกสาร', 'รายการนี้ยังไม่มีรูปเอกสารประกอบ', 'info']);
  if (!alerts.length) return;
  await db.collection('notifications').insertMany(alerts.map((alert) => ({
    delivery_id: deliveryId,
    title: alert[0],
    message: alert[1],
    type: alert[2],
    is_read: 0,
    created_at: nowIso(),
  })));
}

<<<<<<< HEAD
function stockLevelInfo(stock = {}) {
  const itemType = normalizeItemType(stock.item_type) || cleanString(stock.item_type) || 'ดีเซล';
  const defaults = DEFAULT_STOCK_SETTINGS[itemType] || DEFAULT_STOCK_SETTINGS['ดีเซล'];
  const balance = round2(toNumber(stock.balance_liters, 0));
  const capacity = round2(Math.max(1, toNumber(stock.capacity_liters, defaults.capacity_liters)));
  const reorder = round2(Math.max(0, toNumber(stock.reorder_level_liters, defaults.reorder_level_liters)));
  const critical = round2(Math.max(0, Math.min(reorder, toNumber(stock.critical_level_liters, defaults.critical_level_liters))));
  let levelStatus = 'ready';
  let levelLabel = 'พร้อมให้บริการ';
  if (balance <= critical) {
    levelStatus = 'critical';
    levelLabel = 'วิกฤต ต้องเติมทันที';
  } else if (balance <= reorder) {
    levelStatus = 'low';
    levelLabel = 'ต่ำ ควรเตรียมเติม';
  }
  return {
    ...mongoToPlain(stock),
    item_type: itemType,
    tank_name: cleanString(stock.tank_name) || defaults.tank_name,
    balance_liters: balance,
    capacity_liters: capacity,
    reorder_level_liters: reorder,
    critical_level_liters: critical,
    available_percent: round2(Math.max(0, Math.min(100, (balance / capacity) * 100))),
    level_status: levelStatus,
    level_label: levelLabel,
    is_service_ready: levelStatus !== 'critical',
  };
}

async function evaluateStockLevel(db, itemType, { forceNotification = false } = {}) {
  const normalized = normalizeItemType(itemType);
  if (!normalized) return null;
  const stock = await db.collection('stocks').findOne({ item_type: normalized });
  if (!stock) return null;
  const info = stockLevelInfo(stock);
  const previousStatus = cleanString(stock.last_alert_status, 'ready');
  const statusChanged = previousStatus !== info.level_status;

  await db.collection('stocks').updateOne(
    { _id: stock._id },
    {
      $set: {
        level_status: info.level_status,
        level_label: info.level_label,
        available_percent: info.available_percent,
        last_alert_status: info.level_status,
        updated_at: nowIso(),
      },
    },
  );

  if (forceNotification || statusChanged) {
    let title = `สต๊อก ${normalized} พร้อมให้บริการ`;
    let message = `${info.tank_name} คงเหลือ ${info.balance_liters.toFixed(2)} ลิตร (${info.available_percent.toFixed(2)}%)`;
    let type = 'info';
    if (info.level_status === 'critical') {
      title = `สต๊อก ${normalized} วิกฤต`;
      message = `${info.tank_name} เหลือ ${info.balance_liters.toFixed(2)} ลิตร ต่ำกว่าจุดวิกฤต ${info.critical_level_liters.toFixed(2)} ลิตร กรุณาเติมทันที`;
      type = 'danger';
    } else if (info.level_status === 'low') {
      title = `สต๊อก ${normalized} ต่ำ`;
      message = `${info.tank_name} เหลือ ${info.balance_liters.toFixed(2)} ลิตร ถึงจุดสั่งเติม ${info.reorder_level_liters.toFixed(2)} ลิตร`;
      type = 'warning';
    } else if (previousStatus === 'low' || previousStatus === 'critical') {
      title = `สต๊อก ${normalized} กลับมาพร้อมใช้`;
      message = `${info.tank_name} คงเหลือ ${info.balance_liters.toFixed(2)} ลิตร ระบบกลับสู่สถานะพร้อมให้บริการ`;
      type = 'success';
    } else if (!forceNotification) {
      return info;
    }
    await db.collection('notifications').insertOne({
      kind: 'stock_level',
      item_type: normalized,
      title,
      message,
      type,
      is_read: 0,
      created_at: nowIso(),
    });
    emitDataChanged('notifications', 'create', { kind: 'stock_level', item_type: normalized });
  }
  return info;
}

=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
async function applyStockChange(db, { item_type, change_liters, transaction_type, ref_delivery_id = null, user_id = null, note = '', transaction_date = null, amount_baht = 0, bill_no = '', supplier_name = '', photo = '' }) {
  const itemType = normalizeItemType(item_type);
  const change = toNumber(change_liters, 0);
  if (!itemType || change === 0) return null;

  await db.collection('stocks').updateOne(
    { item_type: itemType },
    {
      $inc: { balance_liters: change },
      $set: { updated_at: nowIso() },
      $setOnInsert: { item_type: itemType, created_at: nowIso() },
    },
    { upsert: true },
  );

  const inserted = await db.collection('stock_movements').insertOne({
    item_type: itemType,
    transaction_type,
    quantity_liters: Math.abs(change),
    change_liters: change,
    amount_baht: toNumber(amount_baht, 0),
    bill_no: cleanString(bill_no),
    supplier_name: cleanString(supplier_name),
    photo: cleanString(photo),
    ref_delivery_id,
    user_id,
    note,
    transaction_date: parseDateOrNull(transaction_date) || today(),
    created_at: nowIso(),
  });
<<<<<<< HEAD
  const stockStatus = await evaluateStockLevel(db, itemType);
  return { movement_id: inserted.insertedId, stock: stockStatus };
=======
  return inserted.insertedId;
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
}

async function syncStockForDeliveryCreate(db, deliveryId, data, userId) {
  if (data.operation_type === 'เติมสต๊อก') return;
  const qty = toNumber(data.quantity_liters, 0);
  if (qty > 0) {
    await applyStockChange(db, {
      item_type: data.item_type,
      change_liters: -qty,
      transaction_type: 'ทำน้ำมันบรรทุก',
      ref_delivery_id: String(deliveryId),
      user_id: userId,
      note: `ใช้จากรายการงาน ${data.bill_no || ''}`.trim(),
      transaction_date: data.fill_date || data.work_date,
      amount_baht: data.amount_baht,
      bill_no: data.oil_bill_no || data.bill_no,
      photo: data.oil_photo || data.bill_photo,
    });
  }
}

async function syncStockForDeliveryUpdate(db, deliveryId, oldData, newData, userId) {
  const oldQty = toNumber(oldData.quantity_liters, 0);
  const newQty = toNumber(newData.quantity_liters, 0);
  const oldType = normalizeItemType(oldData.item_type || oldData.oil_type);
  const newType = normalizeItemType(newData.item_type || newData.oil_type);
  if (oldQty > 0 && oldType) {
    await applyStockChange(db, {
      item_type: oldType,
      change_liters: oldQty,
      transaction_type: 'ยกเลิกยอดเดิมก่อนแก้ไข',
      ref_delivery_id: String(deliveryId),
      user_id: userId,
      note: 'คืนสต๊อกจากรายการเดิมก่อนแก้ไข',
      transaction_date: newData.fill_date || newData.work_date,
    });
  }
  if (newQty > 0 && newType && newData.operation_type !== 'เติมสต๊อก') {
    await applyStockChange(db, {
      item_type: newType,
      change_liters: -newQty,
      transaction_type: 'ทำน้ำมันบรรทุก',
      ref_delivery_id: String(deliveryId),
      user_id: userId,
      note: 'หักสต๊อกหลังแก้ไขรายการ',
      transaction_date: newData.fill_date || newData.work_date,
      amount_baht: newData.amount_baht,
      bill_no: newData.oil_bill_no || newData.bill_no,
      photo: newData.oil_photo || newData.bill_photo,
    });
  }
}

async function syncStockForDeliveryDelete(db, delivery, userId) {
  const qty = toNumber(delivery.quantity_liters, 0);
  const itemType = normalizeItemType(delivery.item_type || delivery.oil_type);
  if (qty > 0 && itemType && delivery.operation_type !== 'เติมสต๊อก') {
    await applyStockChange(db, {
      item_type: itemType,
      change_liters: qty,
      transaction_type: 'คืนสต๊อกจากการลบรายการ',
      ref_delivery_id: String(delivery._id),
      user_id: userId,
      note: 'คืนสต๊อกเพราะลบรายการงาน',
      transaction_date: delivery.fill_date || delivery.work_date,
    });
  }
}

async function buildDeliveryFilter(db, user, query) {
  const filter = {};
  if ((user.role || '') !== 'owner') filter.user_id = String(user.id);
  if (query.from) {
    filter.work_date = filter.work_date || {};
    filter.work_date.$gte = parseDateOrNull(query.from) || String(query.from);
  }
  if (query.to) {
    filter.work_date = filter.work_date || {};
    filter.work_date.$lte = parseDateOrNull(query.to) || String(query.to);
  }
  if (query.item_type) {
    const itemType = normalizeItemType(query.item_type);
    if (itemType) filter.item_type = itemType;
  }
  if (query.q) {
    const q = cleanString(query.q);
    if (q) {
      const rx = safeRegex(q);
      const or = [
        { bill_no: rx },
        { oil_bill_no: rx },
        { adblue_bill_no: rx },
        { stone_bill_no: rx },
        { sand_bill_no: rx },
        { origin_place: rx },
        { destination_place: rx },
        { cargo_name: rx },
        { wage_payer: rx },
        { 'jobs.origin_place': rx },
        { 'jobs.destination_place': rx },
        { 'jobs.cargo_name': rx },
        { 'jobs.wage_payer': rx },
        { 'jobs.note': rx },
        { item_type: rx },
        { oil_type: rx },
        { plate_no: rx },
        { vehicle_no: rx },
        { driver_name: rx },
        { filler_name: rx },
        { recorder_name: rx },
        { driver_name_input: rx },
      ];
      const vehicleFilter = { is_active: 1, $or: [{ plate_no: rx }, { driver_name: rx }, { vehicle_no: rx }, { description: rx }] };
      if ((user.role || '') !== 'owner') vehicleFilter.user_id = String(user.id);
      const vehicles = await db.collection('vehicles').find(vehicleFilter, { projection: { _id: 1 } }).toArray();
      const vehicleIds = vehicles.map((v) => String(v._id));
      if (vehicleIds.length) or.push({ vehicle_id: { $in: vehicleIds } });
      filter.$or = or;
    }
  }
  return filter;
}

async function enrichDelivery(db, delivery) {
  const d = mongoToPlain(delivery);
  d.jobs = normalizeDeliveryJobs({}, d);
  const jobsSummary = summarizeDeliveryJobs(d.jobs);
  d.job_count = jobsSummary.job_count;
  d.total_job_distance_km = jobsSummary.distance_km;
  d.total_loading_weight_kg = jobsSummary.loading_weight_kg;
  d.total_unloading_weight_kg = jobsSummary.unloading_weight_kg;
  d.total_cargo_stone_weight = jobsSummary.cargo_stone_weight;
  d.total_cargo_sand_weight = jobsSummary.cargo_sand_weight;
  if (d.jobs.length) {
    const firstJob = d.jobs[0];
    d.origin_place = d.origin_place || firstJob.origin_place || '';
    d.destination_place = d.destination_place || firstJob.destination_place || '';
    d.cargo_name = d.cargo_name || firstJob.cargo_name || '';
    d.load_date = d.load_date || firstJob.load_date || null;
    d.unload_date = d.unload_date || firstJob.unload_date || null;
    d.loading_weight_kg = toNumber(d.loading_weight_kg, firstJob.loading_weight_kg || 0);
    d.unloading_weight_kg = toNumber(d.unloading_weight_kg, firstJob.unloading_weight_kg || 0);
    d.cargo_stone_weight = jobsSummary.cargo_stone_weight;
    d.cargo_sand_weight = jobsSummary.cargo_sand_weight;
    d.trip_fee_baht = jobsSummary.trip_fee_baht;
    d.allowance_baht = jobsSummary.allowance_baht;
    d.other_income_baht = jobsSummary.other_income_baht;
    d.total_income_baht = jobsSummary.total_income_baht;
    if (jobsSummary.distance_km > 0) d.distance_km = jobsSummary.distance_km;
  }
  const [employee, vehicle] = await Promise.all([
    d.user_id ? findUserPublic(db, d.user_id) : null,
    d.vehicle_id ? findVehiclePublic(db, d.vehicle_id) : null,
  ]);
  d.employee_name = employee?.name || null;
  d.employee_username = employee?.username || null;
  d.plate_no = vehicle?.plate_no || null;
  d.vehicle_no = vehicle?.vehicle_no || null;
  d.driver_name = vehicle?.driver_name || d.driver_name_input || null;
  d.vehicle_fuel_efficiency_km_per_liter = round2(Math.max(0, toNumber(vehicle?.fuel_efficiency_km_per_liter, 0)));
  const quantity = toNumber(d.quantity_liters, 0);
  const rawAmount = toNumber(d.amount_baht, 0);
  const price = toNumber(d.price_baht_per_liter || d.price_per_liter, 0);
  const amount = correctAmountIfCommaBug(rawAmount, quantity, price);
  d.amount_baht = amount;
  d.price_baht_per_liter = price > 0 ? round2(price) : (quantity > 0 ? round2(amount / quantity) : 0);
  d.price_per_liter = d.price_baht_per_liter;
  const distance = toNumber(d.distance_km, 0);
  const before = Math.round(toNumber(d.station_meter_before || d.odometer_before, 0));
  const after = Math.round(toNumber(d.station_meter_after || d.odometer_after, 0));
  d.station_meter_before = before;
  d.station_meter_after = after;
  d.station_meter_delta_liters = toNumber(d.station_meter_delta_liters, 0);
  d.nozzle_liters = toNumber(d.nozzle_liters, 0);
<<<<<<< HEAD
  d.quantity_liters = round2(d.actual_filled_liters || d.quantity_liters || d.station_liters || d.liters || 0);
  d.actual_filled_liters = d.quantity_liters;
=======
  d.quantity_liters = round2(d.quantity_liters || d.station_liters || d.liters || 0);
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  d.distance_km = distance;
  const expectedRate = round2(Math.max(0, toNumber(
    d.expected_fuel_efficiency_km_per_liter,
    d.vehicle_fuel_efficiency_km_per_liter || (distance > 0 && d.quantity_liters > 0 ? distance / d.quantity_liters : 0),
  )));
  d.expected_fuel_efficiency_km_per_liter = expectedRate;
  d.recommended_fuel_liters = distance > 0 && expectedRate > 0 ? round2(distance / expectedRate) : 0;
<<<<<<< HEAD
  d.standard_fuel_liters = d.item_type === 'ดีเซล' && d.recommended_fuel_liters > 0
    ? d.recommended_fuel_liters
    : round2(d.standard_fuel_liters || d.quantity_liters || 0);
  d.fuel_variance_liters = d.item_type === 'ดีเซล'
    ? round2(d.quantity_liters - d.standard_fuel_liters)
    : round2(d.fuel_variance_liters || 0);
  d.estimated_distance_km = d.quantity_liters > 0 && expectedRate > 0 ? round2(d.quantity_liters * expectedRate) : 0;
  d.fuel_efficiency_km_per_liter = distance > 0 && d.quantity_liters > 0 ? round2(distance / d.quantity_liters) : 0;
  d.expected_fuel_cost_baht = round2(d.standard_fuel_liters * d.price_baht_per_liter);
  d.actual_fuel_cost_baht = round2(d.amount_baht);
  d.fuel_variance_baht = round2(d.fuel_variance_liters * d.price_baht_per_liter);
  d.cost_per_km = distance > 0 ? round2(d.amount_baht / distance) : 0;
  d.efficiency_status = d.fuel_variance_liters > 0.01 ? 'over_standard' : d.fuel_variance_liters < -0.01 ? 'under_standard' : 'on_standard';
  d.calculation_mode = d.calculation_mode || (d.item_type === 'ดีเซล' && distance > 0 ? 'distance_to_liters' : 'manual_liters');
  d.decimal_fix_version = 'v60_fuel_control';
=======
  d.estimated_distance_km = d.quantity_liters > 0 && expectedRate > 0 ? round2(d.quantity_liters * expectedRate) : 0;
  d.fuel_efficiency_km_per_liter = distance > 0 && d.quantity_liters > 0 ? round2(distance / d.quantity_liters) : 0;
  d.calculation_mode = d.calculation_mode || (d.item_type === 'ดีเซล' && distance > 0 ? 'distance_to_liters' : 'manual_liters');
  d.decimal_fix_version = 'v58_multi_jobs';
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  return d;
}

function deliveryJobCount(row = {}) {
  const arrayCount = Array.isArray(row.jobs) ? row.jobs.length : 0;
  return Math.max(1, Math.round(toNumber(row.job_count, arrayCount || 1)));
}

function groupSum(rows, key, sumField, limit = 0) {
  const groups = new Map();
  for (const row of rows) {
    const name = cleanString(row[key]) || 'ไม่ระบุ';
    if (!groups.has(name)) groups.set(name, { name, value: 0, trips: 0 });
    const item = groups.get(name);
    item.value += toNumber(row[sumField], 0);
    item.trips += deliveryJobCount(row);
  }
  const out = Array.from(groups.values()).sort((a, b) => b.value - a.value);
  return limit > 0 ? out.slice(0, limit) : out;
}

// v58: กระจายปริมาณน้ำมันตามสัดส่วนระยะทางของแต่ละงาน เพื่อให้สรุปปลายทางหลายงานไม่ซ้ำยอดน้ำมัน
function groupJobSum(rows, key, sumField, limit = 0) {
  const groups = new Map();
  for (const row of rows) {
    const jobs = Array.isArray(row.jobs) && row.jobs.length ? row.jobs : [legacyDeliveryJob(row)];
    const validJobs = jobs.filter(deliveryJobHasContent);
    const totalDistance = validJobs.reduce((sum, job) => sum + Math.max(0, toNumber(job.distance_km, 0)), 0);
    const rowValue = Math.max(0, toNumber(row[sumField], 0));
    validJobs.forEach((job) => {
      const name = cleanString(job[key]) || 'ไม่ระบุ';
      if (!groups.has(name)) groups.set(name, { name, value: 0, trips: 0 });
      const item = groups.get(name);
      const share = totalDistance > 0
        ? Math.max(0, toNumber(job.distance_km, 0)) / totalDistance
        : 1 / Math.max(validJobs.length, 1);
      item.value += rowValue * share;
      item.trips += 1;
    });
  }
  const out = Array.from(groups.values())
    .map((item) => ({ ...item, value: round2(item.value) }))
    .sort((a, b) => b.value - a.value);
  return limit > 0 ? out.slice(0, limit) : out;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extByMime = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/pjpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'application/pdf': 'pdf' };
    const ext = extByMime[file.mimetype] || path.extname(file.originalname).replace('.', '') || 'jpg';
    const safe = crypto.randomBytes(6).toString('hex');
    cb(null, `${Date.now()}_${safe}.${ext}`);
  },
});

const uploadMaxMb = Math.max(Number(config.uploadMaxMb || 200), 50);
const upload = multer({
  storage,
  limits: {
    // รองรับไฟล์ใหญ่จากมือถือได้มากขึ้น และฝั่ง Frontend จะย่อรูปอัตโนมัติก่อนส่ง
    fileSize: uploadMaxMb * 1024 * 1024,
    files: 80,
  },
  fileFilter: (_req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
    const allowedMime = mime.startsWith('image/') || ['application/pdf', 'application/octet-stream'].includes(mime);
    const allowedExt = imageExts.includes(ext) || ext === '.pdf';
    if (!allowedMime || !allowedExt) return cb(new Error('รองรับเฉพาะไฟล์รูปภาพจากมือถือและ PDF'));
    return cb(null, true);
  },
});

function uploadFields(req, res, next) {
  return upload.fields([
  { name: 'photo', maxCount: 10 },
  { name: 'receipt_photo', maxCount: 10 },
  { name: 'bill_photo', maxCount: 10 },
  { name: 'bill_photos', maxCount: 10 },
  { name: 'document_photo', maxCount: 10 },
  { name: 'document_photos', maxCount: 10 },
  { name: 'oil_photo', maxCount: 10 },
  { name: 'oil_photos', maxCount: 10 },
  { name: 'cargo_photo', maxCount: 10 },
  { name: 'cargo_photos', maxCount: 10 },
  { name: 'adblue_photo', maxCount: 10 },
  { name: 'adblue_photos', maxCount: 10 },
  { name: 'stock_photo', maxCount: 10 },
  { name: 'stock_photos', maxCount: 10 },
  ])(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      err.status = 413;
      err.message = `ไฟล์ใหญ่เกินขนาดที่ระบบรับได้ต่อไฟล์ (${uploadMaxMb} MB) หากเป็นรูปจากมือถือ ระบบจะพยายามย่อก่อนส่งให้อัตโนมัติ กรุณาลองเลือก/ถ่ายรูปใหม่อีกครั้ง`;
    } else if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') {
      err.status = 413;
      err.message = 'จำนวนไฟล์แนบมากเกินไป กรุณาลดจำนวนรูปแล้วลองใหม่';
    } else if (!err.status) {
      err.status = 400;
    }
    return next(err);
  });
}


const loginAttempts = new Map();

function getClientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function loginRateLimit(req, res, next) {
  const key = `login:${getClientKey(req)}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 20;
  const current = loginAttempts.get(key) || { count: 0, resetAt: now + windowMs };
  if (current.resetAt < now) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  current.count += 1;
  loginAttempts.set(key, current);
  if (current.count > maxAttempts) {
    return jsonResponse(res, { success: false, message: 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่' }, 429);
  }
  return next();
}

function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
<<<<<<< HEAD
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
=======
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (config.corsAllowAll) return cb(null, true);
    if (config.corsAllowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'X-Access-Token'],
  exposedHeaders: ['Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204,
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));
app.use('/public/uploads', express.static(uploadDir));

// รองรับ frontend เก่าที่ยังยิงแบบ /index.php?route=/auth/login หรือ /index.php/auth/login
app.use((req, _res, next) => {
  if (req.query && req.query.route) {
    const route = '/' + String(req.query.route).replace(/^\/+/, '');
    const rest = { ...req.query };
    delete rest.route;
    const qs = new URLSearchParams(rest).toString();
    req.url = route + (qs ? `?${qs}` : '');
  } else if (req.url.startsWith('/index.php/')) {
    req.url = req.url.replace('/index.php', '') || '/';
  } else if (req.url === '/index.php') {
    req.url = '/';
  }
  next();
});

<<<<<<< HEAD
app.get('/ping', (req, res) => jsonResponse(res, { success: true, message: 'pong', build: 'heng-charoen-v60-fuel-control', time: nowIso() }));
=======
app.get('/ping', (req, res) => jsonResponse(res, { success: true, message: 'pong', build: 'heng-charoen-relayout-v1', time: nowIso() }));
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c

app.use(asyncHandler(async (req, _res, next) => {
  req.db = await getDb();
  next();
}));

app.get('/uploads/db/:id', asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return res.status(404).send('file not found');
  const file = await req.db.collection('uploaded_files').findOne({ _id: oid });
  if (!file || !file.data) return res.status(404).send('file not found');
  res.setHeader('Content-Type', file.content_type || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename || 'upload')}"`);
  res.send(Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data.buffer || file.data));
}));

const router = express.Router();

router.get('/', (_req, res) => jsonResponse(res, {
  success: true,
  name: 'Heng Charoen Phuetphon Fuel Management API',
<<<<<<< HEAD
  build: 'heng-charoen-v60-fuel-control',
  item_types: ITEM_TYPES,
  endpoints: ['/health', '/auth/login', '/auth/me', '/deliveries', '/dashboard/stats', '/stocks/status', '/stocks', '/reports/monthly', '/notifications', '/users', '/vehicles'],
=======
  build: 'heng-charoen-relayout-v1',
  item_types: ITEM_TYPES,
  endpoints: ['/health', '/auth/login', '/auth/me', '/deliveries', '/dashboard/stats', '/stocks', '/notifications', '/users', '/vehicles'],
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
}));

router.get('/health', asyncHandler(async (req, res) => {
  await req.db.command({ ping: 1 });
<<<<<<< HEAD
  jsonResponse(res, { success: true, message: 'Backend connected to MongoDB successfully', database: config.mongodb.db, build: 'heng-charoen-v60-fuel-control', time: nowIso() });
=======
  jsonResponse(res, { success: true, message: 'Backend connected to MongoDB successfully', database: config.mongodb.db, build: 'heng-charoen-relayout-v1', time: nowIso() });
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
}));

router.post('/auth/login', loginRateLimit, asyncHandler(async (req, res) => {
  const username = cleanString(req.body.username);
  const password = cleanString(req.body.password);
  const user = await req.db.collection('users').findOne({ username, is_active: { $ne: 0 } });
  if (!user) return jsonResponse(res, { success: false, message: 'ไม่พบผู้ใช้งาน' }, 401);
  const hash = user.password_hash || user.password || '';
  const ok = hash.startsWith('$2') ? await bcrypt.compare(password, hash) : password === hash;
  if (!ok) return jsonResponse(res, { success: false, message: 'รหัสผ่านผิดพลาด' }, 401);
  const publicData = publicUser(user);
  const token = signUserToken(publicData);
  jsonResponse(res, { success: true, token, user: publicData });
}));

router.get('/auth/me', requireAuth, (req, res) => jsonResponse(res, { success: true, user: req.user }));

router.get('/item-types', (_req, res) => jsonResponse(res, { success: true, data: ITEM_TYPES }));

router.get('/meta/fields', requireAuth, (_req, res) => jsonResponse(res, {
  success: true,
  data: {
<<<<<<< HEAD
    collections: ['users', 'vehicles', 'deliveries', 'stocks', 'stock_movements', 'stock_audits', 'notifications'],
=======
    collections: ['users', 'vehicles', 'deliveries', 'stocks', 'stock_movements', 'notifications'],
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
    item_types: ITEM_TYPES,
    delivery_labels: {
      work_date: 'ลงวันที่กำกับ', fill_date: 'วันที่เติม', fill_time: 'เวลาเติม', operation_type: 'ประเภทงาน', item_type: 'ประเภทน้ำมัน',
      plate_no: 'ทะเบียนรถ', vehicle_no: 'เบอร์รถ', driver_name: 'คนขับ', filler_name: 'ชื่อผู้เติม', recorder_name: 'ชื่อผู้กรอก',
      origin_place: 'จุดรับสินค้า / บ่อต้นทาง', destination_place: 'จุดลงงาน / ปลายทาง',
      load_date: 'วันที่บรรทุก', unload_date: 'วันที่ลงของ', cargo_name: 'ประเภทสินค้า / ชื่องาน', loading_weight_kg: 'น้ำหนักต้นทาง (กก.)', unloading_weight_kg: 'น้ำหนักปลายทาง (กก.)', cargo_stone_weight: 'น้ำหนักหิน', cargo_sand_weight: 'น้ำหนักไม้สับ',
      trip_fee_baht: 'ค่าเที่ยว', allowance_baht: 'เบี้ยเลี้ยง', other_income_baht: 'รายได้อื่น', total_income_baht: 'รวมรายได้', wage_payer: 'ผู้จ่ายค่าแรง', payment_status: 'สถานะรายได้',
<<<<<<< HEAD
      quantity_liters: 'จำนวนลิตรเติมจริง', actual_filled_liters: 'จำนวนลิตรเติมจริง', standard_fuel_liters: 'จำนวนลิตรมาตรฐาน', recommended_fuel_liters: 'จำนวนลิตรที่คำนวณจากระยะทาง', fuel_variance_liters: 'ส่วนต่างลิตรจริงเทียบมาตรฐาน', fuel_variance_baht: 'มูลค่าส่วนต่างน้ำมัน', calculation_mode: 'รูปแบบการคำนวณ', price_baht_per_liter: 'ราคาน้ำมันลิตรละ (บาท)', amount_baht: 'ค่าใช้จ่ายเติมจริง', expected_fuel_efficiency_km_per_liter: 'อัตราประจำรถ กม./ลิตร', estimated_distance_km: 'ระยะทางตรวจสอบจากลิตร', distance_km: 'ระยะทางที่กรอก', odometer_before: 'เลขหัวจ่ายก่อนเติม (อ้างอิง)', odometer_after: 'เลขหัวจ่ายหลังเติม (อ้างอิง)', fuel_efficiency_km_per_liter: 'อัตราที่คำนวณย้อนกลับ กม./ลิตร',
=======
      quantity_liters: 'จำนวนลิตรตามเรท', recommended_fuel_liters: 'จำนวนลิตรที่คำนวณจากระยะทาง', calculation_mode: 'รูปแบบการคำนวณ', price_baht_per_liter: 'ราคาน้ำมันลิตรละ (บาท)', amount_baht: 'ยอดเงินตามเรท', expected_fuel_efficiency_km_per_liter: 'อัตราประจำรถ กม./ลิตร', estimated_distance_km: 'ระยะทางตรวจสอบจากลิตร', distance_km: 'ระยะทางที่กรอก', odometer_before: 'เลขหัวจ่ายก่อนเติม (อ้างอิง)', odometer_after: 'เลขหัวจ่ายหลังเติม (อ้างอิง)', fuel_efficiency_km_per_liter: 'อัตราที่คำนวณย้อนกลับ กม./ลิตร',
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
      bill_photos: 'รูปบิลหลายรูป', document_photos: 'รูปเอกสารหลายรูป', oil_photos: 'รูปเกี่ยวกับน้ำมันหลายรูป', cargo_photos: 'รูปบรรทุกหลายรูป'
    }
  }
}));

router.get('/users', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const users = await req.db.collection('users').find({}, { projection: { password_hash: 0, password: 0 }, sort: { created_at: -1 } }).toArray();
  jsonResponse(res, { success: true, data: users.map(publicUser) });
}));

router.post('/users', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const username = cleanString(req.body.username);
  const password = cleanString(req.body.password);
  if (!username || !password) return jsonResponse(res, { success: false, message: 'กรอก username และ password' }, 422);
  const passwordHash = await bcrypt.hash(password, 10);
  const doc = {
    name: cleanString(req.body.name) || username,
    username,
    password_hash: passwordHash,
    role: ['owner', 'employee'].includes(req.body.role) ? req.body.role : 'employee',
    phone: cleanString(req.body.phone),
    is_active: 1,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  const result = await req.db.collection('users').insertOne(doc);
  emitDataChanged('users', 'create', { id: String(result.insertedId) });
  jsonResponse(res, { success: true, data: publicUser({ ...doc, _id: result.insertedId }) });
}));

router.put('/users/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสผู้ใช้ไม่ถูกต้อง' }, 400);
  const update = {
    name: cleanString(req.body.name),
    username: cleanString(req.body.username),
    role: ['owner', 'employee'].includes(req.body.role) ? req.body.role : 'employee',
    phone: cleanString(req.body.phone),
    is_active: req.body.is_active === 0 || req.body.is_active === '0' ? 0 : 1,
    updated_at: nowIso(),
  };
  Object.keys(update).forEach((key) => update[key] === '' && delete update[key]);
  if (cleanString(req.body.password)) update.password_hash = await bcrypt.hash(cleanString(req.body.password), 10);
  await req.db.collection('users').updateOne({ _id: oid }, { $set: update });
  const user = await findUserPublic(req.db, oid);
  emitDataChanged('users', 'update', { id: String(oid) });
  jsonResponse(res, { success: true, data: user });
}));

router.delete('/users/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสผู้ใช้ไม่ถูกต้อง' }, 400);
  await req.db.collection('users').updateOne({ _id: oid }, { $set: { is_active: 0, updated_at: nowIso() } });
  emitDataChanged('users', 'delete', { id: String(oid) });
  jsonResponse(res, { success: true });
}));

router.get('/vehicles/options', requireAuth, asyncHandler(async (req, res) => {
  const filter = { is_active: { $ne: 0 } };
  if ((req.user.role || '') !== 'owner') filter.user_id = String(req.user.id);
  const vehicles = await req.db.collection('vehicles').find(filter, {
    sort: { created_at: -1 },
    projection: { plate_no: 1, vehicle_no: 1, driver_name: 1, fuel_efficiency_km_per_liter: 1, user_id: 1 },
    limit: 200,
  }).toArray();
  jsonResponse(res, { success: true, data: vehicles.map(mongoToPlain) });
}));

router.get('/vehicles', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const filter = { is_active: { $ne: 0 } };
  const vehicles = await req.db.collection('vehicles').find(filter, { sort: { created_at: -1 } }).toArray();
  const enriched = await Promise.all(vehicles.map(async (vehicle) => {
    const v = mongoToPlain(vehicle);
    const employee = v.user_id ? await findUserPublic(req.db, v.user_id) : null;
    v.employee_name = employee?.name || null;
    return v;
  }));
  jsonResponse(res, { success: true, data: enriched });
}));

router.post('/vehicles', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const plateNo = cleanString(req.body.plate_no);
  if (!plateNo) return jsonResponse(res, { success: false, message: 'กรอกเลขทะเบียนรถ' }, 422);
  const userId = (req.user.role || '') === 'owner' && req.body.user_id ? String(req.body.user_id) : String(req.user.id);
  const doc = {
    user_id: userId,
    plate_no: plateNo,
    vehicle_no: cleanString(req.body.vehicle_no),
    driver_name: cleanString(req.body.driver_name),
    fuel_efficiency_km_per_liter: round2(Math.max(0, toNumber(req.body.fuel_efficiency_km_per_liter, 0))),
    description: cleanString(req.body.description),
    is_active: 1,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  const result = await req.db.collection('vehicles').insertOne(doc);
  emitDataChanged('vehicles', 'create', { id: String(result.insertedId) });
  jsonResponse(res, { success: true, data: mongoToPlain({ ...doc, _id: result.insertedId }) });
}));

router.put('/vehicles/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสรถไม่ถูกต้อง' }, 400);
  const filter = { _id: oid, is_active: { $ne: 0 } };
  if ((req.user.role || '') !== 'owner') filter.user_id = String(req.user.id);
  const update = {
    plate_no: cleanString(req.body.plate_no),
    vehicle_no: cleanString(req.body.vehicle_no),
    driver_name: cleanString(req.body.driver_name),
    fuel_efficiency_km_per_liter: round2(Math.max(0, toNumber(req.body.fuel_efficiency_km_per_liter, 0))),
    description: cleanString(req.body.description),
    updated_at: nowIso(),
  };
  if ((req.user.role || '') === 'owner' && req.body.user_id) update.user_id = String(req.body.user_id);
  Object.keys(update).forEach((key) => update[key] === '' && delete update[key]);
  await req.db.collection('vehicles').updateOne(filter, { $set: update });
  const vehicle = await findVehiclePublic(req.db, oid);
  emitDataChanged('vehicles', 'update', { id: String(oid) });
  jsonResponse(res, { success: true, data: vehicle });
}));

router.delete('/vehicles/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสรถไม่ถูกต้อง' }, 400);
  const filter = { _id: oid };
  if ((req.user.role || '') !== 'owner') filter.user_id = String(req.user.id);
  await req.db.collection('vehicles').updateOne(filter, { $set: { is_active: 0, updated_at: nowIso() } });
  emitDataChanged('vehicles', 'delete', { id: String(oid) });
  jsonResponse(res, { success: true });
}));

router.get('/deliveries', requireAuth, asyncHandler(async (req, res) => {
  const filter = await buildDeliveryFilter(req.db, req.user, req.query);
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
  const rows = await req.db.collection('deliveries').find(filter, { sort: { work_date: -1, created_at: -1 }, limit }).toArray();
  const data = await Promise.all(rows.map((row) => enrichDelivery(req.db, row)));
  jsonResponse(res, { success: true, data });
}));

router.post('/deliveries', requireAuth, uploadFields, asyncHandler(async (req, res) => {
  const data = await normalizeDeliveryBody(req.db, req.body, req.files, req.user);
  const vehicleId = await resolveVehicleId(req.db, req.user, req.body);
  if (!vehicleId) return jsonResponse(res, { success: false, message: 'กรอกทะเบียนรถหรือเลือกรถให้ถูกต้อง' }, 422);
  data.vehicle_id = vehicleId;
  data.created_at = nowIso();
  data.stock_synced = data.operation_type !== 'เติมสต๊อก';
  const result = await req.db.collection('deliveries').insertOne(data);
  if (data.stock_synced) await syncStockForDeliveryCreate(req.db, result.insertedId, data, String(req.user.id));
  await createAutoNotifications(req.db, String(result.insertedId), data);
  emitDataChanged('deliveries', 'create', { id: String(result.insertedId) });
  emitDataChanged('dashboard', 'refresh', { reason: 'delivery-create' });
  const delivery = await enrichDelivery(req.db, { ...data, _id: result.insertedId });
  jsonResponse(res, { success: true, data: delivery }, 201);
}));

router.get('/deliveries/:id', requireAuth, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสรายการไม่ถูกต้อง' }, 400);
  const filter = { _id: oid };
  if ((req.user.role || '') !== 'owner') filter.user_id = String(req.user.id);
  const delivery = await req.db.collection('deliveries').findOne(filter);
  if (!delivery) return jsonResponse(res, { success: false, message: 'ไม่พบรายการ' }, 404);
  jsonResponse(res, { success: true, data: await enrichDelivery(req.db, delivery) });
}));

router.put('/deliveries/:id', requireAuth, uploadFields, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสรายการไม่ถูกต้อง' }, 400);
  const filter = { _id: oid };
  if ((req.user.role || '') !== 'owner') filter.user_id = String(req.user.id);
  const existing = await req.db.collection('deliveries').findOne(filter);
  if (!existing) return jsonResponse(res, { success: false, message: 'ไม่พบรายการ' }, 404);
  const data = await normalizeDeliveryBody(req.db, req.body, req.files, req.user, existing);
  const vehicleId = await resolveVehicleId(req.db, req.user, { ...req.body, vehicle_id: req.body.vehicle_id || existing.vehicle_id });
  if (vehicleId) {
    data.vehicle_id = vehicleId;
  }
  data.stock_synced = existing.stock_synced === true || existing.stock_synced === 1;
  await req.db.collection('deliveries').updateOne(filter, { $set: data });
  if (data.stock_synced) await syncStockForDeliveryUpdate(req.db, oid, existing, data, String(req.user.id));
  emitDataChanged('deliveries', 'update', { id: String(oid) });
  emitDataChanged('dashboard', 'refresh', { reason: 'delivery-update' });
  const fresh = await req.db.collection('deliveries').findOne({ _id: oid });
  jsonResponse(res, { success: true, data: await enrichDelivery(req.db, fresh) });
}));


router.delete('/deliveries/:id', requireAuth, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสรายการไม่ถูกต้อง' }, 400);
  const filter = { _id: oid };
  if ((req.user.role || '') !== 'owner') filter.user_id = String(req.user.id);
  const existing = await req.db.collection('deliveries').findOne(filter);
  if (!existing) return jsonResponse(res, { success: false, message: 'ไม่พบรายการ' }, 404);
  await req.db.collection('deliveries').deleteOne(filter);
  if (existing.stock_synced === true || existing.stock_synced === 1) await syncStockForDeliveryDelete(req.db, existing, String(req.user.id));
  emitDataChanged('deliveries', 'delete', { id: String(oid) });
  emitDataChanged('dashboard', 'refresh', { reason: 'delivery-delete' });
  jsonResponse(res, { success: true });
}));

<<<<<<< HEAD
router.get('/stocks/status', requireAuth, asyncHandler(async (req, res) => {
  const rows = await req.db.collection('stocks').find({ item_type: { $in: ITEM_TYPES } }).toArray();
  const map = new Map(rows.map((row) => [row.item_type, row]));
  const data = ITEM_TYPES.map((itemType) => stockLevelInfo(map.get(itemType) || { item_type: itemType, balance_liters: 0 }));
  jsonResponse(res, { success: true, data, updated_at: nowIso() });
}));

router.get('/stocks', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const rows = await req.db.collection('stocks').find({ item_type: { $in: ITEM_TYPES } }).toArray();
  const map = new Map(rows.map((row) => [row.item_type, row]));
  const data = ITEM_TYPES.map((itemType) => stockLevelInfo(map.get(itemType) || { item_type: itemType, balance_liters: 0 }));
  jsonResponse(res, { success: true, data });
}));

router.put('/stocks/:itemType/settings', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const itemType = normalizeItemType(req.params.itemType);
  if (!itemType) return jsonResponse(res, { success: false, message: 'ไม่พบประเภทน้ำมัน' }, 404);
  const defaults = DEFAULT_STOCK_SETTINGS[itemType];
  const capacity = round2(Math.max(1, toNumber(req.body.capacity_liters, defaults.capacity_liters)));
  const reorder = round2(Math.max(0, Math.min(capacity, toNumber(req.body.reorder_level_liters, defaults.reorder_level_liters))));
  const critical = round2(Math.max(0, Math.min(reorder, toNumber(req.body.critical_level_liters, defaults.critical_level_liters))));
  await req.db.collection('stocks').updateOne(
    { item_type: itemType },
    {
      $set: {
        tank_name: cleanString(req.body.tank_name) || defaults.tank_name,
        capacity_liters: capacity,
        reorder_level_liters: reorder,
        critical_level_liters: critical,
        updated_at: nowIso(),
      },
      $setOnInsert: { balance_liters: 0, created_at: nowIso() },
    },
    { upsert: true },
  );
  const stock = await evaluateStockLevel(req.db, itemType, { forceNotification: false });
  emitDataChanged('stocks', 'settings', { item_type: itemType });
  emitDataChanged('dashboard', 'refresh', { reason: 'stock-settings' });
  jsonResponse(res, { success: true, data: stock });
}));

router.get('/stocks/audits', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const rows = await req.db.collection('stock_audits').find({}, { sort: { audit_date: -1, created_at: -1 }, limit: 200 }).toArray();
  jsonResponse(res, { success: true, data: rows.map(mongoToPlain) });
}));

router.post('/stocks/audit', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const itemType = normalizeItemType(req.body.item_type);
  if (!itemType) return jsonResponse(res, { success: false, message: 'เลือกประเภทน้ำมันให้ถูกต้อง' }, 422);
  const actualBalance = round2(Math.max(0, toNumber(req.body.actual_balance_liters, -1)));
  if (toNumber(req.body.actual_balance_liters, -1) < 0) return jsonResponse(res, { success: false, message: 'กรอกยอดตรวจนับจริงตั้งแต่ 0 ลิตรขึ้นไป' }, 422);
  const current = await req.db.collection('stocks').findOne({ item_type: itemType });
  const systemBalance = round2(toNumber(current?.balance_liters, 0));
  const variance = round2(actualBalance - systemBalance);
  const auditDoc = {
    item_type: itemType,
    tank_name: cleanString(current?.tank_name) || DEFAULT_STOCK_SETTINGS[itemType].tank_name,
    audit_date: parseDateOrNull(req.body.audit_date) || today(),
    system_balance_liters: systemBalance,
    actual_balance_liters: actualBalance,
    variance_liters: variance,
    note: cleanString(req.body.note),
    user_id: String(req.user.id),
    created_at: nowIso(),
  };
  const result = await req.db.collection('stock_audits').insertOne(auditDoc);
  if (variance !== 0) {
    await applyStockChange(req.db, {
      item_type: itemType,
      change_liters: variance,
      transaction_type: 'ตรวจนับสต๊อกจริง',
      user_id: String(req.user.id),
      note: `ปรับจาก ${systemBalance.toFixed(2)} เป็น ${actualBalance.toFixed(2)} ลิตร ${auditDoc.note}`.trim(),
      transaction_date: auditDoc.audit_date,
    });
    await req.db.collection('notifications').insertOne({
      kind: 'stock_audit',
      item_type: itemType,
      title: variance < 0 ? `พบสต๊อก ${itemType} ขาด` : `พบสต๊อก ${itemType} เกิน`,
      message: `ยอดระบบ ${systemBalance.toFixed(2)} ลิตร ตรวจจริง ${actualBalance.toFixed(2)} ลิตร ส่วนต่าง ${variance.toFixed(2)} ลิตร`,
      type: variance < 0 ? 'danger' : 'warning',
      is_read: 0,
      created_at: nowIso(),
    });
    emitDataChanged('notifications', 'create', { kind: 'stock_audit', item_type: itemType });
  }
  emitDataChanged('stocks', 'audit', { item_type: itemType, audit_id: String(result.insertedId) });
  emitDataChanged('dashboard', 'refresh', { reason: 'stock-audit' });
  emitDataChanged('reports', 'refresh', { reason: 'stock-audit' });
  jsonResponse(res, { success: true, data: mongoToPlain({ ...auditDoc, _id: result.insertedId }) });
}));

=======
router.get('/stocks', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const rows = await req.db.collection('stocks').find({ item_type: { $in: ITEM_TYPES } }).toArray();
  const map = new Map(rows.map((row) => [row.item_type, row]));
  const data = ITEM_TYPES.map((itemType) => mongoToPlain(map.get(itemType) || { item_type: itemType, balance_liters: 0 }));
  jsonResponse(res, { success: true, data });
}));

>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
router.get('/stocks/transactions', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 80), 1), 200);
  const [currentRows, legacyRows] = await Promise.all([
    req.db.collection('stock_movements').find({}, { sort: { created_at: -1 }, limit }).toArray(),
    req.db.collection('stock_transactions').find({}, { sort: { created_at: -1 }, limit: 30 }).toArray().catch(() => []),
  ]);
  const rows = [...currentRows, ...legacyRows]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, limit);
  jsonResponse(res, { success: true, data: rows.map(mongoToPlain) });
}));

router.post('/stocks/add', requireAuth, requireOwner, uploadFields, asyncHandler(async (req, res) => {
  const itemType = normalizeItemType(req.body.item_type || req.body.oil_type);
  if (!itemType) return jsonResponse(res, { success: false, message: 'เลือกประเภทให้ถูกต้อง: ดีเซล, น้ำมันเครื่อง, แอดบลู' }, 422);
  const qty = toNumber(req.body.quantity_liters || req.body.liters, 0);
  if (qty <= 0) return jsonResponse(res, { success: false, message: 'กรอกจำนวนลิตรให้มากกว่า 0' }, 422);
  const photos = await extractPhotoFields(req.db, req.files);
  await applyStockChange(req.db, {
    item_type: itemType,
    change_liters: qty,
    transaction_type: 'เติมสต๊อก',
    user_id: String(req.user.id),
    note: cleanString(req.body.note),
    transaction_date: req.body.transaction_date || req.body.fill_date || today(),
    amount_baht: req.body.amount_baht,
    bill_no: req.body.bill_no || req.body.oil_bill_no || req.body.adblue_bill_no,
    supplier_name: req.body.supplier_name,
    photo: photos.bill_photo || photos.oil_photo || photos.document_photo || photos.stock_photo || '',
  });
  const stock = await req.db.collection('stocks').findOne({ item_type: itemType });
  emitDataChanged('stocks', 'change', { item_type: itemType });
  emitDataChanged('dashboard', 'refresh', { reason: 'stock-change' });
  jsonResponse(res, { success: true, data: mongoToPlain(stock) });
}));

router.post('/stocks/adjust', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const itemType = normalizeItemType(req.body.item_type || req.body.oil_type);
  const qty = toNumber(req.body.change_liters, 0);
  if (!itemType || qty === 0) return jsonResponse(res, { success: false, message: 'เลือกประเภทและกรอกจำนวนปรับสต๊อก' }, 422);
  await applyStockChange(req.db, {
    item_type: itemType,
    change_liters: qty,
    transaction_type: 'ปรับสต๊อก',
    user_id: String(req.user.id),
    note: cleanString(req.body.note),
    transaction_date: req.body.transaction_date || today(),
  });
  const stock = await req.db.collection('stocks').findOne({ item_type: itemType });
  emitDataChanged('stocks', 'change', { item_type: itemType });
  emitDataChanged('dashboard', 'refresh', { reason: 'stock-change' });
  jsonResponse(res, { success: true, data: mongoToPlain(stock) });
}));

router.get('/dashboard/stats', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const filter = await buildDeliveryFilter(req.db, req.user, req.query);
  const rows = await req.db.collection('deliveries').find(filter, { sort: { work_date: -1, created_at: -1 }, limit: 2000 }).toArray();
  const enriched = await Promise.all(rows.map((row) => enrichDelivery(req.db, row)));
  const totalLiters = enriched.reduce((sum, row) => sum + toNumber(row.quantity_liters, 0), 0);
  const totalAmount = enriched.reduce((sum, row) => sum + toNumber(row.amount_baht, 0), 0);
  const totalDistance = enriched.reduce((sum, row) => sum + toNumber(row.distance_km, 0), 0);
<<<<<<< HEAD
  const totalStandardLiters = enriched.reduce((sum, row) => sum + toNumber(row.standard_fuel_liters || row.recommended_fuel_liters || row.quantity_liters, 0), 0);
  const totalFuelVarianceLiters = enriched.reduce((sum, row) => sum + toNumber(row.fuel_variance_liters, 0), 0);
  const overStandardLiters = enriched.reduce((sum, row) => sum + Math.max(0, toNumber(row.fuel_variance_liters, 0)), 0);
  const overStandardCost = enriched.reduce((sum, row) => sum + Math.max(0, toNumber(row.fuel_variance_baht, 0)), 0);
=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  const totalStoneWeight = enriched.reduce((sum, row) => sum + toNumber(row.cargo_stone_weight, 0), 0);
  const totalSandWeight = enriched.reduce((sum, row) => sum + toNumber(row.cargo_sand_weight, 0), 0);
  const stocks = await req.db.collection('stocks').find({ item_type: { $in: ITEM_TYPES } }).toArray();
  const unreadNotifications = await req.db.collection('notifications').countDocuments({ is_read: { $ne: 1 } });
  const byDayMap = new Map();
  for (const row of enriched) {
    const key = parseDateOrNull(row.fill_date || row.work_date) || 'ไม่ระบุ';
    if (!byDayMap.has(key)) byDayMap.set(key, { name: key, value: 0, trips: 0, amount: 0 });
    const item = byDayMap.get(key);
    item.value += toNumber(row.quantity_liters, 0);
    item.amount += toNumber(row.amount_baht, 0);
    item.trips += deliveryJobCount(row);
  }
  const byDay = Array.from(byDayMap.values()).sort((a, b) => String(a.name).localeCompare(String(b.name))).slice(-31);
  const byPlate = groupSum(enriched, 'plate_no', 'quantity_liters', 8);
  const byDriver = groupSum(enriched, 'driver_name', 'quantity_liters', 8);
  const byRecorder = groupSum(enriched, 'recorder_name', 'quantity_liters', 8);
<<<<<<< HEAD
  const lowStocks = stocks.map(stockLevelInfo).filter((stock) => stock.level_status !== 'ready');
=======
  const lowStocks = stocks.map(mongoToPlain).filter((stock) => toNumber(stock.balance_liters, 0) < 100);
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
  jsonResponse(res, {
    success: true,
    data: {
      total_trips: enriched.reduce((sum, row) => sum + deliveryJobCount(row), 0),
      total_records: enriched.length,
      total_liters: round2(totalLiters),
      total_amount: round2(totalAmount),
      avg_price_per_liter: totalLiters > 0 ? round2(totalAmount / totalLiters) : 0,
      total_distance_km: round2(totalDistance),
<<<<<<< HEAD
      total_standard_liters: round2(totalStandardLiters),
      total_fuel_variance_liters: round2(totalFuelVarianceLiters),
      over_standard_liters: round2(overStandardLiters),
      over_standard_cost_baht: round2(overStandardCost),
      cost_per_km: totalDistance > 0 ? round2(totalAmount / totalDistance) : 0,
=======
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
      avg_fuel_efficiency_km_per_liter: totalDistance > 0 && totalLiters > 0 ? round2(totalDistance / totalLiters) : 0,
      total_stone_weight: round2(totalStoneWeight),
      total_sand_weight: round2(totalSandWeight),
      unread_notifications: unreadNotifications,
      low_stock_count: lowStocks.length,
      by_item_type: groupSum(enriched, 'item_type', 'quantity_liters'),
      by_destination: groupJobSum(enriched, 'destination_place', 'quantity_liters', 8),
      by_day: byDay,
      by_plate: byPlate,
      by_driver: byDriver,
      by_recorder: byRecorder,
      latest: enriched.slice(0, 10),
<<<<<<< HEAD
      stocks: stocks.map(stockLevelInfo),
      low_stocks: stocks.map(stockLevelInfo).filter((stock) => stock.level_status !== 'ready'),
    },
  });
}));

router.get('/reports/monthly', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const requestedMonth = /^\d{4}-\d{2}$/.test(cleanString(req.query.month)) ? cleanString(req.query.month) : monthFromDate(today());
  const from = `${requestedMonth}-01`;
  const [year, month] = requestedMonth.split('-').map(Number);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const toExclusive = nextMonthDate.toISOString().slice(0, 10);
  const rows = await req.db.collection('deliveries').find({
    $or: [
      { report_month: requestedMonth },
      { fill_date: { $gte: from, $lt: toExclusive } },
      { work_date: { $gte: from, $lt: toExclusive } },
    ],
  }, { sort: { work_date: 1, created_at: 1 }, limit: 5000 }).toArray();
  const enriched = await Promise.all(rows.map((row) => enrichDelivery(req.db, row)));
  const movements = await req.db.collection('stock_movements').find({ transaction_date: { $gte: from, $lt: toExclusive } }).toArray();
  const audits = await req.db.collection('stock_audits').find({ audit_date: { $gte: from, $lt: toExclusive } }).toArray();

  const summary = enriched.reduce((acc, row) => {
    const actual = toNumber(row.quantity_liters, 0);
    const standard = toNumber(row.standard_fuel_liters || row.recommended_fuel_liters || row.quantity_liters, 0);
    const variance = toNumber(row.fuel_variance_liters, actual - standard);
    const amount = toNumber(row.amount_baht, 0);
    acc.records += 1;
    acc.trips += deliveryJobCount(row);
    acc.actual_liters += actual;
    acc.standard_liters += standard;
    acc.variance_liters += variance;
    acc.over_standard_liters += Math.max(0, variance);
    acc.saved_liters += Math.max(0, -variance);
    acc.fuel_cost_baht += amount;
    acc.standard_cost_baht += toNumber(row.expected_fuel_cost_baht, standard * toNumber(row.price_baht_per_liter, 0));
    acc.variance_cost_baht += toNumber(row.fuel_variance_baht, variance * toNumber(row.price_baht_per_liter, 0));
    acc.distance_km += toNumber(row.distance_km, 0);
    return acc;
  }, { records: 0, trips: 0, actual_liters: 0, standard_liters: 0, variance_liters: 0, over_standard_liters: 0, saved_liters: 0, fuel_cost_baht: 0, standard_cost_baht: 0, variance_cost_baht: 0, distance_km: 0 });
  Object.keys(summary).forEach((key) => { if (key !== 'records' && key !== 'trips') summary[key] = round2(summary[key]); });
  summary.avg_efficiency_km_per_liter = summary.actual_liters > 0 ? round2(summary.distance_km / summary.actual_liters) : 0;
  summary.cost_per_km = summary.distance_km > 0 ? round2(summary.fuel_cost_baht / summary.distance_km) : 0;
  summary.stock_in_liters = round2(movements.reduce((sum, row) => sum + Math.max(0, toNumber(row.change_liters, 0)), 0));
  summary.stock_out_liters = round2(movements.reduce((sum, row) => sum + Math.max(0, -toNumber(row.change_liters, 0)), 0));
  summary.audit_shortage_liters = round2(audits.reduce((sum, row) => sum + Math.max(0, -toNumber(row.variance_liters, 0)), 0));
  summary.audit_surplus_liters = round2(audits.reduce((sum, row) => sum + Math.max(0, toNumber(row.variance_liters, 0)), 0));

  function reportGroup(keyBuilder) {
    const map = new Map();
    for (const row of enriched) {
      const key = cleanString(keyBuilder(row)) || 'ไม่ระบุ';
      if (!map.has(key)) map.set(key, { name: key, records: 0, trips: 0, actual_liters: 0, standard_liters: 0, variance_liters: 0, fuel_cost_baht: 0, distance_km: 0 });
      const item = map.get(key);
      item.records += 1;
      item.trips += deliveryJobCount(row);
      item.actual_liters += toNumber(row.quantity_liters, 0);
      item.standard_liters += toNumber(row.standard_fuel_liters || row.recommended_fuel_liters || row.quantity_liters, 0);
      item.variance_liters += toNumber(row.fuel_variance_liters, 0);
      item.fuel_cost_baht += toNumber(row.amount_baht, 0);
      item.distance_km += toNumber(row.distance_km, 0);
    }
    return Array.from(map.values()).map((item) => ({
      ...item,
      actual_liters: round2(item.actual_liters),
      standard_liters: round2(item.standard_liters),
      variance_liters: round2(item.variance_liters),
      fuel_cost_baht: round2(item.fuel_cost_baht),
      distance_km: round2(item.distance_km),
      efficiency_km_per_liter: item.actual_liters > 0 ? round2(item.distance_km / item.actual_liters) : 0,
      cost_per_km: item.distance_km > 0 ? round2(item.fuel_cost_baht / item.distance_km) : 0,
    })).sort((a, b) => b.fuel_cost_baht - a.fuel_cost_baht);
  }

  const byDayMap = new Map();
  enriched.forEach((row) => {
    const day = parseDateOrNull(row.fill_date || row.work_date) || from;
    if (!byDayMap.has(day)) byDayMap.set(day, { date: day, actual_liters: 0, standard_liters: 0, variance_liters: 0, fuel_cost_baht: 0, distance_km: 0, records: 0 });
    const item = byDayMap.get(day);
    item.actual_liters += toNumber(row.quantity_liters, 0);
    item.standard_liters += toNumber(row.standard_fuel_liters || row.recommended_fuel_liters || row.quantity_liters, 0);
    item.variance_liters += toNumber(row.fuel_variance_liters, 0);
    item.fuel_cost_baht += toNumber(row.amount_baht, 0);
    item.distance_km += toNumber(row.distance_km, 0);
    item.records += 1;
  });
  const byDay = Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date)).map((item) => ({ ...item, actual_liters: round2(item.actual_liters), standard_liters: round2(item.standard_liters), variance_liters: round2(item.variance_liters), fuel_cost_baht: round2(item.fuel_cost_baht), distance_km: round2(item.distance_km) }));

  jsonResponse(res, {
    success: true,
    data: {
      month: requestedMonth,
      period: { from, to_exclusive: toExclusive },
      generated_at: nowIso(),
      summary,
      by_item_type: reportGroup((row) => row.item_type),
      by_vehicle: reportGroup((row) => row.plate_no || row.vehicle_no),
      by_employee: reportGroup((row) => row.employee_name || row.recorder_name),
      by_day: byDay,
      stock_audits: audits.map(mongoToPlain),
      latest_records: enriched.slice(-20).reverse(),
=======
      stocks: stocks.map(mongoToPlain),
      low_stocks: lowStocks,
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
    },
  });
}));

router.get('/notifications', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const rows = await req.db.collection('notifications').find({}, { sort: { created_at: -1 }, limit: 80 }).toArray();
  jsonResponse(res, { success: true, data: rows.map(mongoToPlain) });
}));

router.patch('/notifications/:id/read', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const oid = oidOrNull(req.params.id);
  if (!oid) return jsonResponse(res, { success: false, message: 'รหัสแจ้งเตือนไม่ถูกต้อง' }, 400);
  await req.db.collection('notifications').updateOne({ _id: oid }, { $set: { is_read: 1, updated_at: nowIso() } });
  emitDataChanged('notifications', 'read', { id: String(oid) });
  jsonResponse(res, { success: true });
}));

app.use('/', router);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  jsonResponse(res, { success: false, message: err.message || 'เกิดข้อผิดพลาดในระบบ' }, status);
});

httpServer.listen(config.port, () => {
<<<<<<< HEAD
  console.log(`Heng Charoen Phuetphon Fuel Management API fuel-control-v60 running on port ${config.port}`);
=======
  console.log(`Heng Charoen Phuetphon Fuel Management API exact-decimal-v21 running on port ${config.port}`);
>>>>>>> 2682bc12b481495e61c8f3ca5682056a2fa7765c
});
