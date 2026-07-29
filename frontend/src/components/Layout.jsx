import {
  Bell,
  Boxes,
  Car,
  ChevronDown,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  ShieldCheck,
  Sprout,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { confirmAction } from '../utils/alerts.js';

const navBase = [
  { key: 'dashboard', label: 'ภาพรวมกิจการ', short: 'ภาพรวม', icon: Gauge, ownerOnly: true },
  { key: 'quick', label: 'บันทึกงานน้ำมัน', short: 'บันทึก', icon: ClipboardList },
  { key: 'deliveries', label: 'รายการย้อนหลัง', short: 'รายการ', icon: ClipboardList },
  { key: 'stocks', label: 'คลังและสต๊อก', short: 'สต๊อก', icon: Boxes, ownerOnly: true },
  { key: 'vehicles', label: 'รถและคนขับ', short: 'รถ', icon: Car, ownerOnly: true },
  { key: 'users', label: 'พนักงาน', short: 'พนักงาน', icon: Users, ownerOnly: true },
  { key: 'notifications', label: 'แจ้งเตือน', short: 'แจ้งเตือน', icon: Bell, ownerOnly: true },
];

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia('(max-width: 900px)').matches));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => {
      const touchTablet = navigator.maxTouchPoints > 1 && window.innerWidth <= 1100;
      setIsMobile(media.matches || touchTablet);
    };
    update();
    if (media.addEventListener) media.addEventListener('change', update);
    else media.addListener?.(update);
    window.addEventListener('resize', update, { passive: true });
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', update);
      else media.removeListener?.(update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return isMobile;
}

export default function Layout({ page, setPage, children }) {
  const { user, logout, isOwner } = useAuth();
  const isMobile = useMobileViewport();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuCloseRef = useRef(null);
  const navItems = useMemo(() => navBase.filter((item) => !item.ownerOnly || isOwner), [isOwner]);
  const currentItem = navItems.find((item) => item.key === page) || navItems[0];

  const primaryMobileItems = useMemo(() => {
    const primaryKeys = isOwner ? ['dashboard', 'quick', 'deliveries'] : ['quick', 'deliveries'];
    return primaryKeys.map((key) => navItems.find((item) => item.key === key)).filter(Boolean);
  }, [isOwner, navItems]);

  useEffect(() => {
    document.documentElement.dataset.device = isMobile ? 'mobile' : 'desktop';
  }, [isMobile]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => menuCloseRef.current?.focus());
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      previousActiveElement?.focus?.();
    };
  }, [menuOpen]);

  async function doLogout() {
    const ok = await confirmAction('ออกจากระบบ?', 'ต้องการออกจากระบบเฮงเจริญพืชผลตอนนี้ใช่ไหม');
    if (ok) logout();
  }

  function go(key) {
    setPage(key);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-frame min-h-screen">
      {isMobile && <header className="heng-mobile-header">
        <div className="mobile-header-inner">
          <button className="mobile-brand-button" onClick={() => go(isOwner ? 'dashboard' : 'quick')} aria-label="ไปหน้าแรก">
            <div className="brand-logo-mobile">
              <img src="/logo-heng.svg" alt="เฮงเจริญพืชผล" className="h-full w-full object-contain" />
            </div>
            <div className="mobile-header-copy">
              <p className="mobile-header-kicker">เฮงเจริญพืชผล</p>
              <h1>{currentItem?.label || 'ระบบจัดการงานน้ำมัน'}</h1>
            </div>
          </button>
          <button className="mobile-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนูทั้งหมด" aria-expanded={menuOpen}>
            <Menu size={20} />
            <span>เมนู</span>
          </button>
        </div>
      </header>}

      {!isMobile && <header className="heng-desktop-header sticky top-0 z-40">
        <div className="heng-desktop-header-main">
          <button className="heng-brand-lockup" onClick={() => go(isOwner ? 'dashboard' : 'quick')}>
            <div className="brand-logo-desktop">
              <img src="/logo-heng.svg" alt="เฮงเจริญพืชผล" className="h-full w-full object-contain" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-amber-700">HENG CHAROEN PHUETPHON</p>
              <h1 className="text-xl font-black tracking-tight text-stone-950">เฮงเจริญพืชผล</h1>
              <p className="text-xs font-bold text-stone-500">ระบบจัดการน้ำมัน รถ และงานขนส่ง</p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className="heng-user-chip">
              <div className="heng-user-avatar"><Sprout size={18} /></div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-black text-stone-900">{user?.name || user?.username}</p>
                <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-700"><ShieldCheck size={11} /> {isOwner ? 'เจ้าของกิจการ' : 'พนักงาน'}</p>
              </div>
              <ChevronDown size={16} className="text-stone-400" />
            </div>
            <button onClick={doLogout} className="heng-icon-button heng-icon-button-danger" title="ออกจากระบบ"><LogOut size={19} /></button>
          </div>
        </div>

        <nav className="heng-desktop-nav" aria-label="เมนูหลัก">
          <div className="heng-desktop-nav-inner">
            {navItems.map((item) => <NavButton key={item.key} item={item} active={page === item.key} onClick={() => go(item.key)} desktop />)}
          </div>
        </nav>
      </header>}

      <main className="app-main">{children}</main>

      {isMobile && <nav className="mobile-bottom-nav" aria-label="เมนูหลักบนมือถือ">
        <div className="mobile-bottom-grid" style={{ '--mobile-nav-count': primaryMobileItems.length + 1 }}>
          {primaryMobileItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={`mobile-bottom-item ${page === item.key ? 'mobile-bottom-item-active' : 'mobile-bottom-item-normal'}`}
                aria-current={page === item.key ? 'page' : undefined}
              >
                <Icon size={21} />
                <span>{item.short}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className={`mobile-bottom-item ${!primaryMobileItems.some((item) => item.key === page) ? 'mobile-bottom-item-active' : 'mobile-bottom-item-normal'}`}
            aria-expanded={menuOpen}
          >
            <Menu size={21} />
            <span>เมนูอื่น</span>
          </button>
        </div>
      </nav>}

      {isMobile && menuOpen && (
        <div className="mobile-menu-layer" role="presentation">
          <button className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />
          <section className="mobile-menu-sheet" role="dialog" aria-modal="true" aria-label="เมนูทั้งหมด">
            <div className="mobile-sheet-handle" />
            <div className="mobile-menu-sheet-head">
              <div className="mobile-sheet-user">
                <div className="mobile-sheet-avatar"><Sprout size={20} /></div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-stone-950">{user?.name || user?.username}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-black text-emerald-700"><ShieldCheck size={13} /> {isOwner ? 'เจ้าของกิจการ' : 'พนักงาน'}</p>
                </div>
              </div>
              <button ref={menuCloseRef} className="mobile-sheet-close" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู"><X size={21} /></button>
            </div>

            <p className="mobile-menu-section-label">เมนูทั้งหมด</p>
            <div className="mobile-menu-grid">
              {navItems.map((item) => <NavButton key={item.key} item={item} active={page === item.key} onClick={() => go(item.key)} />)}
            </div>
            <button onClick={doLogout} className="mobile-logout-button"><LogOut size={19} /> ออกจากระบบ</button>
          </section>
        </div>
      )}
    </div>
  );
}

function NavButton({ item, active, onClick, desktop = false }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`${desktop ? 'heng-desktop-nav-button' : 'heng-nav-button'} ${active ? 'is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="heng-nav-icon"><Icon size={18} /></span>
      <span className="truncate">{item.label}</span>
    </button>
  );
}
