async function test() {
  try {
    const loginRes = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@sochiot.com', password: '12345678' })
    });
    console.log('Login status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login result:', loginData.user);
    const token = loginData.token;

    if (token) {
      // 1. Fetch devices
      const devRes = await fetch('http://localhost:5173/api/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Devices status:', devRes.status);
      const devData = await devRes.json();
      console.log('Devices count:', devData?.data?.length || (Array.isArray(devData) ? devData.length : devData));

      // 2. Fetch templates
      const tmplRes = await fetch('http://localhost:5173/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Templates status:', tmplRes.status);
      const tmplData = await tmplRes.json();
      console.log('Templates:', JSON.stringify(tmplData, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
