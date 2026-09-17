# คู่มือการกู้คืนฐานข้อมูลเสียหาย (Database Loss & Corruption Runbook)

## รหัสสถานการณ์: DR-SOP-01
- **Severity**: SEV1 (Critical Outage)
- **Target RTO**: 45 นาที
- **Target RPO**: 15 นาที
- **ผู้รับผิดชอบ**: Database Reliability Engineer (DBRE) / SRE Commander

---

## ขั้นตอนการปฏิบัติการกู้คืน (Step-by-Step Recovery Procedure)

### ขั้นตอนที่ 1: ประกาศระงับการแก้ไขและสลับเป็น Maintenance Mode
เพื่อป้องกันไม่ให้มีการเขียนข้อมูลใหม่ทับซ้อนในระหว่างระบบผิดปกติ:
```bash
curl -X POST http://localhost:3000/api/platform/maintenance \
  -H "Content-Type: application/json" \
  -d '{"mode": "MAINTENANCE", "reason": "Emergency Database Restoration in progress"}'
```

### ขั้นตอนที่ 2: หยุดการทำงานของ Workers เพื่อระงับการดึงคิว
```bash
pm2 stop smartjeff-worker
pm2 stop smartjeff-scheduler
```

### ขั้นตอนที่ 3: บันทึก Snapshot สภาพแวดล้อมปัจจุบัน (Forensic State Preservation)
```bash
mkdir -p /var/log/smartjeff/forensics
pg_dump "${DATABASE_URL}" > /var/log/smartjeff/forensics/corrupt_state_$(date +%s).sql || true
```

### ขั้นตอนที่ 4: ค้นหาชุดสำรองข้อมูลล่าสุดที่ผ่านการ Verify แล้ว
ตรวจสอบรายการ Backup ล่าสุดที่มีสถานะ `VERIFIED` จาก Dashboard หรือ S3 Remote Bucket:
```bash
aws s3 ls s3://smartjeff-enterprise-backups/database/ | sort | tail -n 5
aws s3 cp s3://smartjeff-enterprise-backups/database/latest-verified.dump.enc /tmp/restore_target.enc
```

### ขั้นตอนที่ 5: ถอดรหัสไฟล์สำรองข้อมูล (AES-256)
```bash
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in /tmp/restore_target.enc \
  -out /tmp/restore_target.sql.gz \
  -pass env:BACKUP_ENCRYPTION_KEY
```

### ขั้นตอนที่ 6: ดำเนินการ Restore เข้าสู่ Production ด้วยคำสั่งที่ปลอดภัย
```bash
./scripts/platform/restore-db.sh \
  --file /tmp/restore_target.sql.gz \
  --target production \
  --confirm RESTORE_PRODUCTION_OVERWRITE_CONFIRMED
```

### ขั้นตอนที่ 7: ตรวจสอบความถูกต้องและ Referential Integrity
```bash
npx prisma db pull
npm test -- __tests__/platform/
```

### ขั้นตอนที่ 8: เริ่มระบบใหม่และยกเลิก Maintenance Mode
```bash
pm2 start smartjeff-worker
pm2 start smartjeff-scheduler
curl -X POST http://localhost:3000/api/platform/maintenance \
  -H "Content-Type: application/json" \
  -d '{"mode": "NORMAL"}'
```
