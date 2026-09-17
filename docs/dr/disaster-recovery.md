# แผนการกู้คืนระบบจากภัยพิบัติ (SmartJeff Enterprise Disaster Recovery Plan)

## 1. วิสัยทัศน์และเป้าหมาย (Vision & Principles)
ระบบ SmartJeff Enterprise ได้รับการออกแบบภายใต้หลักการความมั่นคงปลอดภัยและความต่อเนื่องทางธุรกิจ:
- **Backup is useless until restore is tested**: การสำรองข้อมูลจะไม่มีความหมายจนกว่าจะได้ทดสอบการกู้คืนจริง
- **Fail gracefully**: เมื่อระบบใดล่ม (เช่น Redis หรือ Notification Gateways) ฟังก์ชันหลักด้านการลงเวลาและการเงินต้องทำงานต่อได้
- **Human-controlled Disaster Recovery**: การกู้คืนระบบระดับ Production จะต้องตัดสินใจและควบคุมโดยมนุษย์ (SRE Commander) เสมอ AI Copilot เป็นผู้ช่วยวินิจฉัยและแนะนำ Runbook เท่านั้น

---

## 2. เป้าหมาย RPO และ RTO (Recovery Objectives)

| ลำดับความสำคัญ | ระบบงาน (Service) | Criticality | Target RPO (สูญหายได้สูงสุด) | Target RTO (เวลากู้คืนสูงสุด) | กลยุทธ์การกู้คืน |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **#1** | **Identity & Authentication** | CRITICAL | 15 นาที | 30 นาที | กู้คืน Schema สิทธิ์, บังคับ Re-login |
| **#2** | **PostgreSQL Database** | CRITICAL | 15 นาที | 45 นาที | Restore จาก S3 Offsite Encrypted Dump |
| **#3** | **Core Operations & Workforce** | CRITICAL | 30 นาที | 60 นาที | ฟื้นฟูกะและไซต์งาน, ซิงก์ Offline PWA |
| **#4** | **Finance, Billing & Ledger** | CRITICAL | 15 นาที | 60 นาที | ล็อกการเบิกจ่ายชั่วคราว, ตรวจสอบสมดุลบัญชี |
| **#5** | **BullMQ Workers & Queues** | HIGH | 60 นาที | 15 นาที | กู้คืนคิวจาก Outbox Table ใน Database |
| **#6** | **External Gateways (LINE/Mail)** | MEDIUM | 120 นาที | 15 นาที | ปล่อย Retry Queue เมื่อ Gateway พร้อม |
| **#7** | **Analytics Data Mart** | LOW | 24 ชั่วโมง | 240 นาที | Rebuild จากฐานข้อมูลหลักแบบ Asynchronous |

---

## 3. ผังการบัญชาการเหตุการณ์ (Incident Command Hierarchy)
- **Incident Commander (SRE Lead)**: มีอำนาจตัดสินใจสูงสุดในการประกาศโหมดฉุกเฉิน (Maintenance Mode)
- **Operations Lead**: ประสานงานกับไซต์งานและแจ้งสถานะการใช้ Offline Mode แก่พนักงาน
- **Database Reliability Engineer (DBRE)**: รับผิดชอบการถอดรหัสและ Restore ฐานข้อมูล
- **Communications Officer**: แจ้งเตือนลูกค้าและคู่ค้าตาม SLA

---

## 4. ดัชนีคู่มือปฏิบัติการกู้คืน (Runbook Index)
1. [การกู้คืนฐานข้อมูลเสียหาย (Database Loss)](database-loss.md)
2. [การกู้คืนกรณีเครื่องแม่ข่ายล่มทั้งหมด (VPS Loss)](vps-loss.md)
3. [การกู้คืน Object Storage ขัดข้อง (Storage Loss)](storage-loss.md)
4. [การกู้คืนเมื่อ Deployment ล้มเหลว (Deployment Failure)](deployment-failure.md)
