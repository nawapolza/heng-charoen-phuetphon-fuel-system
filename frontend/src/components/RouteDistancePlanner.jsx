import { Crosshair, ExternalLink, LoaderCircle, MapPin, Navigation, Route, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

function RouteMap({ origin, destination, route }) {
  const mapNode = useRef(null);
  const mapInstance = useRef(null);
  const routeLayer = useRef(null);
  useEffect(() => {
    if (!mapNode.current || !window.L || mapInstance.current) return undefined;
    const L = window.L;
    const map = L.map(mapNode.current, { zoomControl: true, attributionControl: true }).setView([13.2, 101.2], 6);
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri' });
    const labels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Labels © Esri', pane: 'overlayPane' });
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' });
    satellite.addTo(map); labels.addTo(map);
    L.control.layers({ 'ดาวเทียม': satellite, 'แผนที่ถนน': streets }, { 'ชื่อสถานที่': labels }, { position: 'topright' }).addTo(map);
    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 50);
    return () => { map.remove(); mapInstance.current = null; };
  }, []);
  useEffect(() => {
    const L = window.L;
    const map = mapInstance.current;
    if (!L || !map) return;
    if (routeLayer.current) routeLayer.current.remove();
    map.closePopup();
    const group = L.featureGroup().addTo(map);
    routeLayer.current = group;
    const pin = (kind, label) => L.divIcon({ className: '', html: `<div class="route-map-pin is-${kind}"><span>${label}</span></div>`, iconSize: [34, 42], iconAnchor: [17, 39] });
    if (origin) L.marker([origin.lat, origin.lon], { icon: pin('origin', 'A'), title: 'ต้นทาง' }).bindTooltip('ต้นทาง', { direction: 'top' }).addTo(group);
    if (destination) L.marker([destination.lat, destination.lon], { icon: pin('destination', 'B'), title: 'ปลายทาง' }).bindTooltip('ปลายทาง', { direction: 'top' }).addTo(group);
    const line = (route?.geometry || []).map(([lon, lat]) => [lat, lon]);
    if (line.length > 1) {
      L.polyline(line, { color: '#0b1027', weight: 10, opacity: .8, lineJoin: 'round', lineCap: 'round' }).addTo(group);
      L.polyline(line, { color: '#3228ff', weight: 6, opacity: 1, lineJoin: 'round', lineCap: 'round' }).addTo(group);
      const middle = line[Math.floor(line.length / 2)];
      L.popup({ closeButton: false, autoClose: false, closeOnClick: false, className: 'route-summary-popup', offset: [0, -4] }).setLatLng(middle).setContent(`<div><b>🚚 ${number(route.distance_km, 2)} กม.</b><span>ประมาณ ${route.duration_minutes} นาที</span></div>`).openOn(map);
    }
    if (group.getLayers().length) map.fitBounds(group.getBounds(), { padding: [42, 42], maxZoom: 16 });
    setTimeout(() => map.invalidateSize(), 40);
  }, [origin, destination, route]);
  if (!window.L) return <div className="route-map-unavailable"><Navigation size={34} /><strong>กำลังโหลดแผนที่ดาวเทียม…</strong><span>หากไม่แสดง กรุณาตรวจสอบอินเทอร์เน็ต</span></div>;
  return <div ref={mapNode} className="route-live-map" aria-label="แผนที่ดาวเทียมและเส้นทางรถยนต์" />;
}

export default function RouteDistancePlanner({ onDistance }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState(false);
  async function calculate() {
    if (!origin || !destination) return alertError(new Error('กรุณาเลือกต้นทางและปลายทางให้ครบ'), 'ข้อมูลเส้นทางไม่ครบ');
    setBusy(true);
    try { const result = await api.calculateRoute(origin.lat, origin.lon, destination.lat, destination.lon); setRoute(result.data); onDistance(result.data.distance_km); }
    catch (error) { alertError(error, 'คำนวณเส้นทางไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  return <section className="route-planner-card">
    <div className="route-planner-head"><div><span><Navigation size={21} /></span><div><h2>GPS ตรวจสอบระยะทาง</h2><p>ค้นหาต้นทาง–ปลายทาง แล้วคำนวณกิโลเมตรตามเส้นทางรถยนต์</p></div></div><b>ROUTE VERIFIED</b></div>
    <div className="route-planner-body"><div className="route-pickers"><PointPicker title="ต้นทาง" point={origin} onPick={(p) => { setOrigin(p); setRoute(null); }} allowGps /><PointPicker title="ปลายทาง" point={destination} onPick={(p) => { setDestination(p); setRoute(null); }} /><button type="button" className="route-calculate-button" onClick={calculate} disabled={busy || !origin || !destination}>{busy ? <LoaderCircle className="spin" size={19} /> : <Route size={19} />} คำนวณระยะทางและค่าน้ำมัน</button>{route && <div className="route-proof"><div><small>ระยะทางตามถนน</small><strong>{number(route.distance_km, 2)} <span>กม.</span></strong></div><div><small>เวลาโดยประมาณ</small><strong>{Math.floor(route.duration_minutes / 60) ? `${Math.floor(route.duration_minutes / 60)} ชม. ` : ''}{route.duration_minutes % 60} นาที</strong></div><a href={googleDirectionsUrl(origin, destination)} target="_blank" rel="noreferrer"><ExternalLink size={16} /> เปิดตรวจสอบใน Google Maps</a><p>คำนวณเมื่อ {new Date(route.calculated_at).toLocaleString('th-TH')} · {route.provider}</p></div>}</div><div className="route-map-panel"><RouteMap origin={origin} destination={destination} route={route} /></div></div>
  </section>;
}
