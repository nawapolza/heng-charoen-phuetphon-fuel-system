import { Crosshair, ExternalLink, LoaderCircle, MapPin, Navigation, Route, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { alertError } from '../utils/alerts.js';
import { number } from '../utils/format.js';

function googleDirectionsUrl(origin, destination) {
  if (!origin || !destination) return '#';
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${destination.lat},${destination.lon}&travelmode=driving`;
}

function PointPicker({ title, point, onPick, allowGps = false }) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (query.trim().length < 2) return;
    setBusy(true);
    try { const result = await api.searchPlaces(query); setRows(result.data || []); }
    catch (error) { alertError(error, 'ค้นหาสถานที่ไม่สำเร็จ'); }
    finally { setBusy(false); }
  }

  function useGps() {
    if (!navigator.geolocation) return alertError(new Error('อุปกรณ์นี้ไม่รองรับ GPS'), 'ใช้ GPS ไม่ได้');
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try { const result = await api.reversePlace(coords.latitude, coords.longitude); onPick(result.data); setQuery(result.data.name); setRows([]); }
      catch (error) { alertError(error, 'อ่านตำแหน่ง GPS ไม่สำเร็จ'); }
      finally { setBusy(false); }
    }, (error) => { setBusy(false); alertError(error, 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์'); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  return <div className="route-point-picker">
    <div className="route-point-title"><span><MapPin size={17} /></span><div><strong>{title}</strong><small>{point ? `${number(point.lat, 5)}, ${number(point.lon, 5)}` : 'ค้นหาแล้วเลือกจากรายการ'}</small></div></div>
    <div className="route-search-row"><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())} placeholder="ชื่อบริษัท อำเภอ จังหวัด หรือที่อยู่" /><button type="button" className="btn-soft" onClick={search} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}</button>{allowGps && <button type="button" className="btn-soft route-gps-button" onClick={useGps} disabled={busy} title="ใช้ GPS ปัจจุบัน"><Crosshair size={17} /></button>}</div>
    {rows.length > 0 && <div className="route-search-results">{rows.map((row) => <button type="button" key={row.id} onClick={() => { onPick(row); setQuery(row.name); setRows([]); }}><MapPin size={15} /><span>{row.name}</span></button>)}</div>}
    {point && <div className="route-selected"><ShieldCheck size={15} /><span>{point.name}</span></div>}
  </div>;
}

export default function RouteDistancePlanner({ onDistance }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState(false);
  const mapUrl = useMemo(() => {
    const point = route && origin && destination ? { lat: (origin.lat + destination.lat) / 2, lon: (origin.lon + destination.lon) / 2 } : origin || destination;
    return point ? `https://www.openstreetmap.org/export/embed.html?bbox=${point.lon - 0.12}%2C${point.lat - 0.08}%2C${point.lon + 0.12}%2C${point.lat + 0.08}&layer=mapnik&marker=${point.lat}%2C${point.lon}` : '';
  }, [origin, destination, route]);

  async function calculate() {
    if (!origin || !destination) return alertError(new Error('กรุณาเลือกต้นทางและปลายทางให้ครบ'), 'ข้อมูลเส้นทางไม่ครบ');
    setBusy(true);
    try { const result = await api.calculateRoute(origin.lat, origin.lon, destination.lat, destination.lon); setRoute(result.data); onDistance(result.data.distance_km); }
    catch (error) { alertError(error, 'คำนวณเส้นทางไม่สำเร็จ'); }
    finally { setBusy(false); }
  }

  return <section className="route-planner-card">
    <div className="route-planner-head"><div><span><Navigation size={21} /></span><div><h2>GPS ตรวจสอบระยะทาง</h2><p>ค้นหาต้นทาง–ปลายทาง แล้วคำนวณกิโลเมตรตามเส้นทางรถยนต์</p></div></div><b>ROUTE VERIFIED</b></div>
    <div className="route-planner-body"><div className="route-pickers"><PointPicker title="ต้นทาง" point={origin} onPick={(p) => { setOrigin(p); setRoute(null); }} allowGps /><PointPicker title="ปลายทาง" point={destination} onPick={(p) => { setDestination(p); setRoute(null); }} /><button type="button" className="route-calculate-button" onClick={calculate} disabled={busy || !origin || !destination}>{busy ? <LoaderCircle className="spin" size={19} /> : <Route size={19} />} คำนวณระยะทางและค่าน้ำมัน</button>{route && <div className="route-proof"><div><small>ระยะทางตามถนน</small><strong>{number(route.distance_km, 2)} <span>กม.</span></strong></div><div><small>เวลาโดยประมาณ</small><strong>{Math.floor(route.duration_minutes / 60) ? `${Math.floor(route.duration_minutes / 60)} ชม. ` : ''}{route.duration_minutes % 60} นาที</strong></div><a href={googleDirectionsUrl(origin, destination)} target="_blank" rel="noreferrer"><ExternalLink size={16} /> เปิดตรวจสอบใน Google Maps</a><p>คำนวณเมื่อ {new Date(route.calculated_at).toLocaleString('th-TH')} · {route.provider}</p></div>}</div><div className="route-map-panel">{mapUrl ? <iframe title="แผนที่เส้นทาง" src={mapUrl} loading="lazy" /> : <div><Navigation size={36} /><strong>แผนที่เส้นทาง</strong><span>เลือกต้นทางและปลายทางเพื่อเริ่มคำนวณ</span></div>}</div></div>
  </section>;
}
