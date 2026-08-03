import { AlertTriangle, Boxes, CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Loading from '../components/Loading.jsx';
import { useRealtime } from '../hooks/useRealtime.js';
import { alertError, toastInfo } from '../utils/alerts.js';
import { datetime, number } from '../utils/format.js';

export default function StockStatusPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.stockStatus();
      setStocks(res.data || []);
      setUpdatedAt(res.updated_at || new Date().toISOString());
    } catch (err) {
      if (!silent) alertError(err, 'โหลดสถานะสต๊อกไม่ได้');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const { connected } = useRealtime((payload) => {
    if (payload?.kind === 'stocks') load(true);
  }, true);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (loading) return <Loading />;

  return (
    <div className="page-shell stock-status-page">
      <div className="page-orbit">
        <span className="page-orbit-code">04 / STOCK STATUS</span>
        <div>
          <h1 className="page-title">สถานะน้ำมันพร้อมจ่าย</h1>
          <p className="page-subtitle">พนักงานดูยอดคงเหลือและความพร้อมของแต่ละถังได้ แต่ไม่มีสิทธิ์เติม ปรับ หรือตั้งค่าสต๊อก</p>
        </div>
        <span className={`page-orbit-signal ${connected ? '' : 'is-offline'}`}>{connected ? 'REALTIME' : 'AUTO REFRESH'}</span>
      </div>

      <div className="stock-status-toolbar card-clean">
        <div>{connected ? <Wifi size={18} /> : <WifiOff size={18} />}<span>{connected ? 'เชื่อมต่อข้อมูลแบบเรียลไทม์' : 'ระบบจะอัปเดตทุก 20 วินาที'}</span></div>
        <div><span>ล่าสุด {datetime(updatedAt)}</span><button className="btn-soft" onClick={async () => { await load(true); toastInfo('อัปเดตสถานะแล้ว'); }}><RefreshCw size={16} /> รีเฟรช</button></div>
      </div>

      <section className="stock-status-grid">
        {stocks.map((stock) => {
          const status = stock.level_status || 'ready';
          const Icon = status === 'ready' ? CheckCircle2 : AlertTriangle;
          return (
            <article key={stock.item_type} className={`stock-level-card is-${status}`}>
              <header>
                <span><Icon size={23} /></span>
                <div><p>{stock.tank_name || stock.item_type}</p><small>{stock.item_type}</small></div>
              </header>
              <strong>{number(stock.balance_liters, 2)} <small>ลิตร</small></strong>
              <div className="stock-level-track"><i style={{ width: `${Math.max(0, Math.min(100, Number(stock.available_percent || 0)))}%` }} /></div>
              <div className="stock-level-scale"><span>0</span><span>{number(stock.capacity_liters, 0)} ลิตร</span></div>
              <footer>
                <div><span>สถานะ</span><strong>{stock.level_label}</strong></div>
                <div><span>จุดสั่งเติม</span><strong>{number(stock.reorder_level_liters, 2)} ลิตร</strong></div>
                <div><span>จุดวิกฤต</span><strong>{number(stock.critical_level_liters, 2)} ลิตร</strong></div>
              </footer>
            </article>
          );
        })}
      </section>

      <div className="stock-readonly-notice"><Boxes size={20} /><div><strong>สิทธิ์พนักงาน: ดูอย่างเดียว</strong><p>การเติมสต๊อก ตรวจนับจริง ปรับยอด และกำหนดระดับแจ้งเตือน ทำได้เฉพาะบัญชีเจ้าของกิจการ</p></div></div>
    </div>
  );
}
