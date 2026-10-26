const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('====================================');
    console.log('  Vite Frontend Server Verification');
    console.log('====================================');
    console.log('HTTP Status Code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Contains <div id="root">:', data.includes('<div id="root"></div>'));
    console.log('Contains /src/main.jsx script:', data.includes('/src/main.jsx'));
    console.log('Contains ROBOCARE title:', data.includes('ROBOCARE'));
    console.log('====================================');
    if (res.statusCode === 200 && data.includes('<div id="root"></div>')) {
      console.log('Frontend server is healthy and serving SPA application!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Failed to connect to Vite dev server:', err.message);
  process.exit(1);
});
