export default function Loading({ text = 'กำลังเชื่อมข้อมูล...' }) {
  return (
    <div className="nova-loading-wrap">
      <div className="nova-loading">
        <div className="nova-loading-radar"><i /><b /><span><img src="/logo-heng.png" alt="เฮงเจริญพืชผล" /></span></div>
        <p>{text}</p>
        <small>HENG LIVE DATA ENGINE</small>
      </div>
    </div>
  );
}
