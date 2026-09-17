# คู่มือการกู้คืน Object Storage ขัดข้อง (Object Storage Outage Runbook)

## รหัสสถานการณ์: DR-SOP-03
- **Severity**: SEV2 (Degraded Operations - Documents & Attachments)
- **Target RTO**: 30 นาที
- **Target RPO**: 60 นาที
- **ผู้รับผิดชอบ**: Infrastructure SRE Engineer

---

## ผลกระทบต่อระบบงาน
- ข้อมูล Core CRUD (ตารางกะ, ลงเวลา, บัญชี, พนักงาน) ยังคงทำงานได้ปกติ 100%
- การแนบภาพถ่ายหน้างาน, ใบเสร็จ, สัญญา หรือภาพถ่ายเหตุฉุกเฉิน QHSE จะถูกพักไว้ชั่วคราวใน Local Client Cache

---

## ขั้นตอนการกู้คืน
1. ตรวจสอบสถานะ MinIO / S3 Service:
   ```bash
   docker ps | grep minio
   docker logs minio --tail 50
   ```
2. หาก Container ค้าง ให้สั่ง Restart:
   ```bash
   docker compose restart minio
   ```
3. หาก Storage Volume เสียหาย ให้กู้คืนจาก Secondary Remote Bucket:
   ```bash
   aws s3 sync s3://smartjeff-secondary-storage/ /data/minio/
   ```
4. ตรวจสอบการเขียนอ่านผ่าน Synthetic Health Probe:
   ```bash
   curl http://localhost:3000/api/platform/health | jq '.dependencies.objectStorage'
   ```
