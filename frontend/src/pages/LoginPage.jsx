import { CheckCircle2, Eye, EyeOff, Leaf, LockKeyhole, ShieldCheck, Truck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { alertError, toastSuccess } from '../utils/alerts.js';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toastSuccess('เข้าสู่ระบบสำเร็จ');
    } catch (err) {
      alertError(err, 'เข้าสู่ระบบไม่ได้');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="heng-login-page">
      <div className="heng-login-orb heng-login-orb-one" />
      <div className="heng-login-orb heng-login-orb-two" />

      <div className="heng-login-shell">
        <section className="heng-login-story">
          <div>
            <div className="flex items-center gap-3">
              <div className="login-logo-card">
                <img src="/logo-heng.svg" alt="เฮงเจริญพืชผล" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">HENG CHAROEN PHUETPHON</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white">เฮงเจริญพืชผล</h1>
              </div>
            </div>

            <h2 className="mt-12 max-w-lg text-4xl font-black leading-tight text-white lg:text-5xl">ระบบจัดการงานน้ำมันที่มองง่าย ใช้งานไว และพร้อมทุกหน้างาน</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-emerald-100/80">บันทึกน้ำมัน รถ คนขับ สต๊อก และรายการย้อนหลังในหน้าจอเดียว รองรับทั้งโทรศัพท์ แท็บเล็ต และคอมพิวเตอร์</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StoryPoint icon={Truck} label="งานรถครบ" />
            <StoryPoint icon={Leaf} label="ธีมสบายตา" />
            <StoryPoint icon={ShieldCheck} label="แยกสิทธิ์ผู้ใช้" />
          </div>
        </section>

        <section className="heng-login-form-panel">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-emerald-50 ring-1 ring-emerald-100 md:hidden">
                <img src="/logo-heng.svg" alt="เฮงเจริญพืชผล" className="h-14 w-14 object-contain" />
              </div>
              <span className="heng-kicker">ระบบสำหรับพนักงานและเจ้าของกิจการ</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-stone-950">ยินดีต้อนรับกลับ</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-stone-500">เข้าสู่ระบบเพื่อเริ่มบันทึกและตรวจสอบข้อมูลของเฮงเจริญพืชผล</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="label">ชื่อผู้ใช้</span>
                <div className="input-icon-wrap mt-1.5">
                  <span className="input-icon-left"><UserRound size={19} /></span>
                  <input
                    className="input input-has-left-icon"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="กรอกชื่อผู้ใช้"
                    autoComplete="username"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="label">รหัสผ่าน</span>
                <div className="input-icon-wrap mt-1.5">
                  <span className="input-icon-left"><LockKeyhole size={19} /></span>
                  <input
                    className="input input-has-left-icon input-has-right-icon"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="input-icon-right-button"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </label>

              <button disabled={loading} className="btn-primary w-full text-base">
                {loading ? 'กำลังตรวจสอบข้อมูล...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={18} />
                <div>
                  <p className="text-sm font-black text-emerald-950">พร้อมใช้งานบนทุกขนาดหน้าจอ</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-emerald-800/70">ระบบจะแสดงเฉพาะเมนูที่บัญชีของคุณได้รับอนุญาต</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StoryPoint({ icon: Icon, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur">
      <Icon size={20} className="text-amber-300" />
      <p className="mt-3 text-sm font-black text-white">{label}</p>
    </div>
  );
}
