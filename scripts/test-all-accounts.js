const testAccounts = [
  'admin@j2k.co.th',
  'panithan@j2k.co.th',
  '121095@j2k.co.th',
  '120001@j2k.co.th',
  '120886@j2k.co.th',
  'chuleeporn@j2k.co.th',
  '120150@j2k.co.th',
  '120116@j2k.co.th',
  '210993@j2k.co.th',
  '210993',
];

async function run() {
  console.log('Testing authentication against localhost:3000...\n');
  for (const acc of testAccounts) {
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: acc, password: 'Smartjeff2026', humanToken: 'dev-human-token-ok' }),
      });
      const data = await res.json();
      const cookie = res.headers.get('set-cookie');
      
      let sessionStatus = 'N/A';
      let sessionRole = null;
      let sessionName = null;
      if (cookie) {
        const tokenMatch = cookie.match(/sj_token=([^;]+)/);
        if (tokenMatch) {
          const sRes = await fetch('http://localhost:3000/api/auth/session', {
            headers: { cookie: 'sj_token=' + tokenMatch[1] },
          });
          sessionStatus = sRes.status;
          const sData = await sRes.json();
          sessionRole = sData.user?.role;
          sessionName = sData.user?.name;
        }
      }

      console.log(
        res.status === 200 && sessionStatus === 200 ? '✅ PASS' : '❌ FAIL',
        acc.padEnd(22),
        '| Role:', (data.user?.role || '').padEnd(11),
        '| Redirect:', (data.redirectTo || '').padEnd(18),
        '| Name:', sessionName
      );
    } catch (e) {
      console.error('❌ ERROR', acc, e.message);
    }
  }
}

run();
