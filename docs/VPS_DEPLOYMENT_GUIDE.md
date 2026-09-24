# คู่มือการนำระบบ SmartJeff Enterprise ขึ้น VPS Server (Production Deployment Guide)

เอกสารนี้รวบรวมขั้นตอนและคำสั่งทั้งหมดในการติดตั้งและ Deploy ระบบ **SmartJeff Enterprise** ขึ้นบนเครื่อง VPS Server (Ubuntu 22.04 / 24.04 LTS หรือ Linux ทุกรุ่น) ให้พร้อมใช้งานจริงในสภาพแวดล้อม Production

---

## 1. สเปกเครื่อง VPS ที่แนะนำ (Minimum Requirements)

| รายการ | ขั้นต่ำ (Minimum) | แนะนำ (Recommended) |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 2 GB (เปิด Swap 2-4GB) | 4 GB - 8 GB |
| **Storage** | 25 GB SSD/NVMe | 50 GB+ SSD/NVMe |
| **OS** | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS (64-bit) |
| **Network** | Static Public IPv4 | Static Public IPv4 + Domain Name |

> [!TIP]
> สำหรับเครื่อง VPS ที่มี RAM 2GB แนะนำให้สร้าง Swap Memory 2GB-4GB เพื่อป้องกันหน่วยความจำเต็มระหว่างการ Build หรือรันแอปพลิเคชัน:
> ```bash
> sudo fallocate -l 4G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

---

## 2. วิธีที่ 1: ติดตั้งผ่าน Docker Compose (แนะนำสูงสุด - รวดเร็ว ปลอดภัย และเสถียร)

วิธีนี้เหมาะที่สุดเพราะระบบได้เตรียมไฟล์ `Dockerfile`, `docker-compose.prod.yml`, และ `nginx` คอนฟิกแยก Container สำหรับ App (Next.js 14 Standalone), Database (MySQL 8), Cache (Redis 7), และ Web Server (Nginx) ไว้อย่างสมบูรณ์

### ขั้นตอนที่ 1: ติดตั้ง Docker & Docker Compose บน VPS
```bash
# อัปเดตแพ็กเกจระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Docker อัตโนมัติด้วย Official Script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# อนุญาตให้ user ปัจจุบันใช้งาน docker โดยไม่ต้องใส่ sudo
sudo usermod -aG docker $USER
newgrp docker

# ตรวจสอบการติดตั้ง
docker --version
docker compose version
```

### ขั้นตอนที่ 2: Clone โค้ดโปรเจกต์ลงบน VPS
```bash
cd /var/www
git clone https://github.com/pharmacisttom/smartjeff.git
cd smartjeff
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables (`.env`)
คัดลอกไฟล์ต้นแบบสำหรับ Production และแก้ไขรหัสผ่านจริง:
```bash
cp .env.production.example .env
nano .env
```

**ตัวแปรสำคัญที่ต้องตั้งค่าใน `.env`:**
```ini
APP_URL="https://smartjeff.yourdomain.com"
NEXTAUTH_URL="https://smartjeff.yourdomain.com"

# รหัสผ่าน MySQL ประจำ Container
MYSQL_ROOT_PASSWORD="ตั้งรหัสผ่าน_ROOT_ยากๆ_ที่นี่"
MYSQL_DATABASE="smartjeff"
MYSQL_USER="smartjeff"
MYSQL_PASSWORD="ตั้งรหัสผ่าน_APP_ที่นี่"

# Secret Key (สร้างด้วยคำสั่ง: openssl rand -base64 64)
AUTH_SECRET="ใส่_RANDOM_STRING_ความยาว_64_ตัวอักษร"
DLP_HMAC_SECRET="ใส่_KEY_สำหรับเข้ารหัสล็อกป้องกันการดัดแปลง_64_ตัวอักษร"

# รหัสผ่าน Redis
REDIS_PASSWORD="ตั้งรหัสผ่าน_REDIS_ที่นี่"
```

### ขั้นตอนที่ 4: สั่งรัน Deployment Script อัตโนมัติในคลิกเดียว
```bash
chmod +x scripts/deploy.sh scripts/backup-db.sh
./scripts/deploy.sh docker
```
*สคริปต์จะทำการ:*
1. สร้าง Docker Image แบบ Multi-Stage Standalone (ขนาดเล็ก ทำงานเร็ว)
2. รัน Containers: `smartjeff-mysql`, `smartjeff-redis`, `smartjeff-app`, `smartjeff-nginx`
3. เชื่อมต่อฐานข้อมูลและรัน Migration (`prisma db push`)
4. โหลด Master Data พนักงานจริง 152 คน, ไซต์งานลูกค้า 36 แห่ง, และสิทธิ์ J2K อัตโนมัติ (`prisma/seed.ts`)

---

## 3. วิธีที่ 2: ติดตั้งแบบ Native (Node.js 20 + PM2 + MySQL 8 + Nginx)

สำหรับผู้ที่ต้องการรันตรงบนเซิร์ฟเวอร์โดยไม่ใช้ Docker:

### ขั้นตอนที่ 1: ติดตั้ง Node.js 20, MySQL 8, Redis, และ Nginx
```bash
sudo apt update
sudo apt install -y curl git nginx mysql-server redis-server certbot python3-certbot-nginx

# ติดตั้ง Node.js 20 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ติดตั้ง PM2 Process Manager
sudo npm install -g pm2
```

### ขั้นตอนที่ 2: ตั้งค่าฐานข้อมูล MySQL บน VPS
```bash
sudo mysql
```
รันคำสั่ง SQL ด้านล่าง:
```sql
CREATE DATABASE smartjeff CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smartjeff'@'localhost' IDENTIFIED WITH mysql_native_password BY 'รหัสผ่านฐานข้อมูล_ที่ต้องการ';
GRANT ALL PRIVILEGES ON smartjeff.* TO 'smartjeff'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### ขั้นตอนที่ 3: Deploy โปรเจกต์ด้วย PM2
```bash
cd /var/www/smartjeff
cp .env.production.example .env
nano .env  # แก้ไข DATABASE_URL ให้ชี้ไปที่ 127.0.0.1:3306

chmod +x scripts/deploy.sh
./scripts/deploy.sh pm2
```

### ขั้นตอนที่ 4: ตั้งค่า PM2 ให้เปิดทำงานอัตโนมัติเมื่อรีสตาร์ทเซิร์ฟเวอร์
```bash
pm2 startup systemd
# รันคำสั่งที่ PM2 แนะนำบนหน้าจอ จากนั้นบันทึก:
pm2 save
```

---

## 4. การตั้งค่า Domain Name & ใบรับรองความปลอดภัยฟรี (SSL / HTTPS)

### หากใช้ Nginx บนโฮสต์ (Certbot):
```bash
sudo certbot --nginx -d smartjeff.yourdomain.com
```
Certbot จะทำการขอใบรับรองจาก Let's Encrypt และคอนฟิก HTTPS พร้อมรีไดเรกต์ HTTP -> HTTPS ให้อัตโนมัติ 100%

---

## 5. การตั้งค่าระบบสำรองข้อมูลฐานข้อมูลอัตโนมัติ (Automated Daily Backups)

ระบบมีสคริปต์ `scripts/backup-db.sh` พร้อมทำงาน สามารถตั้งค่าให้สำรองข้อมูลลงใน `/var/backups/smartjeff` ทุกคืนเวลา 04:00 น. ผ่าน Crontab:

```bash
sudo crontab -e
```
เพิ่มบรรทัดด้านล่าง:
```cron
0 4 * * * /var/www/smartjeff/scripts/backup-db.sh >> /var/log/smartjeff-backup.log 2>&1
```
*ระบบจะบีบอัดไฟล์ `.sql.gz` และลบไฟล์สำรองที่เก่าเกิน 30 วันทิ้งอัตโนมัติเพื่อประหยัดพื้นที่ฮาร์ดดิสก์*

---

## 6. คำสั่งดูแลระบบที่ใช้งานบ่อย (Cheat Sheet)

```bash
# ดูสถานะ Containers (กรณีใช้ Docker)
docker compose -f docker-compose.prod.yml ps

# ดู Log ของ Application แบบ Real-time
docker compose -f docker-compose.prod.yml logs -f app
# หรือ (กรณีใช้ PM2)
pm2 logs smartjeff

# รีสตาร์ทระบบ
docker compose -f docker-compose.prod.yml restart
# หรือ (กรณีใช้ PM2)
pm2 restart smartjeff

# ตรวจสอบสุขภาพระบบ (Healthcheck & DLP Audit)
curl http://localhost:3000/api/security/dlp/status

# อัปเดตโค้ดเวอร์ชันใหม่จาก Git ในอนาคต
git pull origin master
./scripts/deploy.sh docker  # หรือ ./scripts/deploy.sh pm2
```

---

## 7. ข้อมูลบัญชีผู้ดูแลระบบเริ่มต้น (Default Accounts)

- **Super Administrator**: `admin@j2k.co.th` / `panithan@j2k.co.th` (รหัสผ่าน: `Smartjeff2026`)
- **ฝ่ายการเงิน/เงินเดือน**: `121095@j2k.co.th` (น.ส.ยุพดี วะโร)
- **ผู้จัดการทั่วไป**: `120001@j2k.co.th` (นางเนตรนภา อินทร์ผลเล็ก)
- **พนักงานและหัวหน้างาน**: `<รหัสพนักงาน>@j2k.co.th` (รหัสผ่าน: `Smartjeff2026`)
- **ลิงก์หน้าตรวจสอบความปลอดภัย**: `/admin/security/dlp`
- **ลิงก์หน้าออกเอกสารส่งตัว**: `/admin/dispatch`
- **ลิงก์หน้าสรุปเวลาทำงาน**: `/admin/attendance`
- **ลิงก์หน้าระบบเงินเดือน**: `/admin/payroll`
