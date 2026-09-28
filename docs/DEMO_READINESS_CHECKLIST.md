# SmartOP Demo Readiness Checklist

- [ ] Login works
- [ ] Admin account works
- [ ] Executive account works
- [ ] HR account works
- [ ] Coordinator account works
- [ ] Supervisor account works
- [ ] Employee account works
- [ ] Role permissions correct
- [ ] Dashboard has demo data
- [ ] Attendance demo works
- [ ] Leave demo works
- [ ] Payroll demo works
- [ ] Activation PIN demo works
- [ ] MFA optional works
- [ ] Audit Log works
- [ ] Mobile responsive at 320, 375, 430 and 768 px
- [ ] Desktop responsive at 1024 and 1440 px
- [ ] No 404 on presentation routes
- [ ] No 500 or redirect loop
- [ ] Lint, TypeScript, tests and build pass
- [ ] PM2 `smartop` online from `/var/www/smartop`
- [ ] PM2 runs `.next/standalone/server.js` on port 3001
- [ ] Demo database is healthy and ends with `_demo`
- [ ] Backup available
- [ ] Demo reset script works
- [ ] Email, LINE, Telegram and payments show `[DEMO]` mock results

## Reset sequence

```bash
npm run demo:reset
npm run demo:seed
npm run demo:reset-passwords
```

Never run these commands unless both demo guards pass.
