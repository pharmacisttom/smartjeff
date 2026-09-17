# คู่มือการกู้คืนเมื่อ Deployment ล้มเหลว (Deployment Failure & Rollback Runbook)

## รหัสสถานการณ์: DR-SOP-04
- **Severity**: SEV2 (Broken Release / High 5xx Error Rate)
- **Target RTO**: 10 นาที
- **ผู้รับผิดชอบ**: DevOps On-Call / Release Engineer

---

## 1. เกณฑ์การตัดสินใจ Rollback (Rollback Triggers)
สั่ง Rollback ทันทีหากเข้าเงื่อนไขใดเงื่อนไขหนึ่งต่อไปนี้ภายใน 10 นาทีหลัง Deploy:
1. อัตรา Error HTTP 5xx สูงเกิน 2.0%
2. Liveness หรือ Readiness Probe (`/api/health/ready`) ล้มเหลวเกิน 3 ครั้งติดต่อกัน
3. Worker Process เกิด Crash Loop หรือ Restart ถี่เกิน 5 ครั้ง

---

## 2. ขั้นตอนการ Rollback อย่างปลอดภัย (Human-Controlled Rollback)

### ขั้นตอนที่ 1: สลับ Git ไปยัง Commit เสถียรล่าสุด
```bash
git log -n 5 --oneline
# ตัวอย่าง Rollback ไปยัง Commit ก่อนหน้า
git checkout <LAST_STABLE_COMMIT_HASH>
```

### ขั้นตอนที่ 2: ติดตั้ง Dependencies และ Build
```bash
npm ci
npm run build
```

### ขั้นตอนที่ 3: Restart แอปพลิเคชันแบบ Zero-Downtime ด้วย PM2 Reload
```bash
pm2 reload ecosystem.config.js --update-env
```

### ขั้นตอนที่ 4: ตรวจสอบสถานะการทำงานของเวอร์ชันที่ Rollback
```bash
curl -s http://localhost:3000/api/version
./scripts/platform/health-check.sh
```

### ขั้นตอนที่ 5: บันทึกประวัติการ Rollback เข้าระบบ
```bash
curl -X POST http://localhost:3000/api/platform/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "version": "rollback-target",
    "gitCommit": "<LAST_STABLE_COMMIT_HASH>",
    "deployedBy": "sre-commander",
    "releaseNotes": "Emergency Rollback due to HTTP 5xx spike"
  }'
```
