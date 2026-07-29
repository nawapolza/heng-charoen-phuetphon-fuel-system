# เฮงเจริญพืชผล — Fuel & Transport Management

ระบบจัดการน้ำมัน รถ คนขับ สต๊อก พนักงาน และรายการย้อนหลัง ออกแบบใหม่ทั้งโครงสร้างหน้าจอ โดยยังใช้ API และความสามารถเดิมครบถ้วน

## จุดเด่นของชุดนี้

- Re-layout ใหม่เป็น Top Navigation บนคอมพิวเตอร์ และ Bottom Navigation บนมือถือ
- ธีมเขียวพืชผล + สีทอง ดูสบายตาและแยกจากระบบเดิมอย่างชัดเจน
- ฟอร์มบันทึกงานจัดกลุ่มเป็นขั้นตอน พร้อมสรุปตัวเลขอัตโนมัติ
- รองรับมือถือ แท็บเล็ต และคอมพิวเตอร์
- ระบบสิทธิ์ Owner / Employee, Realtime, รูปแนบ, ใบสรุป PNG และสต๊อกยังอยู่ครบ
- Backend เดิมใช้ MongoDB และ API ชุดเดิม เพื่อไม่กระทบข้อมูลเดิม

## เริ่มใช้งาน

```bash
npm run install:all
npm run dev:backend
npm run dev:frontend
```

ตั้งค่าไฟล์ `.env` ตามตัวอย่างใน `backend/.env.example` และ `frontend/.env.example`

## Build Frontend

```bash
cd frontend
npm ci --no-audit --no-fund
npm run build
```

## Render

- Frontend Root Directory: `frontend`
- Build Command: `npm ci --no-audit --no-fund && node ./node_modules/vite/bin/vite.js build`
- Publish Directory: `dist`
- Backend Root Directory: `backend`
- Start Command: `npm start`
