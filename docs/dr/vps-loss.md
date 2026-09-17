# คู่มือการกู้คืนกรณีเครื่องแม่ข่ายล่มทั้งหมด (VPS Loss & Infrastructure Reconstruction Runbook)

## รหัสสถานการณ์: DR-SOP-02
- **Severity**: SEV1 (Total Infrastructure Loss)
- **Target RTO**: 60 นาที
- **Target RPO**: 15 นาที
- **ผู้รับผิดชอบ**: Lead DevOps Architect & Enterprise SRE Commander

---

## สรุปลำดับขั้นตอนภาพรวม (Macro Recovery Flow)
```
[1. Provision New Ubuntu VPS]
       ↓
[2. Hardening & Dependencies Setup (Node 20, Postgres, Redis, PM2, Nginx)]
       ↓
[3. Clone Git Repository (master / latest release tag)]
       ↓
[4. Restore Vault / Secret Environment (.env)]
       ↓
[5. Pull & Restore Latest Encrypted DB Backup from Offsite S3]
       ↓
[6. Sync Object Storage (MinIO / S3 Buckets)]
       ↓
[7. Start Application Services via PM2]
       ↓
[8. Run Automated Health Diagnostics & Re-route DNS]
```

---

## รายละเอียดคำสั่งในการสร้างระบบใหม่ทีละขั้นตอน

### 1. Provision Ubuntu 22.04 / 24.04 LTS VPS
ตั้งค่าเครื่องใหม่จาก Cloud Provider (DigitalOcean, AWS, Hetzner หรือผู้ให้บริการในไทย) พร้อมกำหนด UFW Firewall:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. ติดตั้ง Dependencies พื้นฐาน
```bash
apt update && apt upgrade -y
apt install -y curl git build-essential nginx postgresql redis-server openssl fail2ban

# ติดตั้ง Node.js 20 LTS & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

### 3. Clone ซอร์สโค้ดของ SmartJeff
```bash
git clone https://github.com/pharmacisttom/smartjeff.git /var/www/smartjeff
cd /var/www/smartjeff
npm ci
```

### 4. กู้คืน Secret Configuration จาก Secret Manager / Secure Vault
```bash
# ดึง .env จาก AWS Secrets Manager หรือ HashiCorp Vault
aws secretsmanager get-secret-value --secret-id smartjeff/production/env --query SecretString --output text > .env
chmod 600 .env
```

### 5. กู้คืนฐานข้อมูล PostgreSQL จาก Offsite S3
```bash
aws s3 cp s3://smartjeff-enterprise-backups/database/latest.dump.enc /tmp/backup.enc
openssl enc -d -aes-256-cbc -pbkdf2 -in /tmp/backup.enc -out /tmp/backup.sql.gz -pass env:BACKUP_ENCRYPTION_KEY
gunzip -c /tmp/backup.sql.gz | psql "${DATABASE_URL}"
npx prisma generate
```

### 6. ซิงก์ไฟล์เอกสารสัญญาและภาพถ่ายหลักฐาน (Object Storage Sync)
```bash
aws s3 sync s3://smartjeff-enterprise-backups/storage/ /var/data/smartjeff-storage/
```

### 7. เริ่มต้นแอปพลิเคชันผ่าน PM2
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. รันสคริปต์ตรวจสอบความพร้อมใช้งาน (Health Validation)
```bash
./scripts/platform/health-check.sh
```
เมื่อผลการทดสอบผ่าน 100% จึงสลับ DNS A-Record (Cloudflare / NS) มายัง IP ของเครื่องแม่ข่ายใหม่
