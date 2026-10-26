const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('  ROBOCARE - End-to-End API & ML Verification Suite');
  console.log('========================================================');

  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${name} ${extra}`);
    } else {
      console.error(`  [FAIL] ${name} ${extra}`);
    }
  }

  // 1. Health check
  const healthRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  assert('Health Check', healthRes.status === 200 && healthRes.data.status === 'online');

  // 2. Admin Login
  const adminLoginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@robocare.com', password: 'Admin@123' }
  );
  assert('Admin Login', adminLoginRes.status === 200 && adminLoginRes.data.success);
  const token = adminLoginRes.data.token;

  // 3. Manager & Technician Login
  const techLoginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'technician@robocare.com', password: 'Admin@123' }
  );
  assert('Technician Login', techLoginRes.status === 200 && techLoginRes.data.user.role === 'TECHNICIAN');

  // 4. GET /api/auth/me
  const meRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Current User Profile (Auth/Me)', meRes.status === 200 && meRes.data.user.email === 'admin@robocare.com');

  // 4b. PUT /api/auth/profile
  const updateProfileRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/profile',
      method: 'PUT',
      headers: { Authorization: `Bearer ${techLoginRes.data.token}`, 'Content-Type': 'application/json' },
    },
    { name: 'Maintenance Engineer', department: 'Robotics Fleet Operations' }
  );
  assert(
    'Update Profile Settings (PUT /api/auth/profile)',
    updateProfileRes.status === 200 && updateProfileRes.data.user.name === 'Maintenance Engineer'
  );

  // 5. GET /api/robots
  const robotsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/robots',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Fetch Fleet Robots', robotsRes.status === 200 && robotsRes.data.count >= 15, `(${robotsRes.data.count} robots)`);

  // 6. GET /api/robots/:id
  const singleRobotRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/robots/RBT-001',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    'Fetch Robot Details with Components & Logs',
    singleRobotRes.status === 200 && singleRobotRes.data.data.robotId === 'RBT-001'
  );

  // 7. Live ML PREDICTION INFERENCE: POST /api/predictions/analyze/RBT-001
  const mlPredictRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/predictions/analyze/RBT-001',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  assert(
    'Live TensorFlow.js ML Inference (POST /api/predictions/analyze/RBT-001)',
    mlPredictRes.status === 200 &&
      mlPredictRes.data.success &&
      typeof mlPredictRes.data.failureProbability === 'number' &&
      mlPredictRes.data.riskLevel &&
      mlPredictRes.data.recommendation,
    `[Prob: ${mlPredictRes.data.failurePercentage}%, Risk: ${mlPredictRes.data.riskLevel}, Health: ${mlPredictRes.data.healthScore}%]`
  );

  // 8. GET /api/predictions
  const predictionsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/predictions',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Fetch Predictions History', predictionsRes.status === 200 && predictionsRes.data.count > 0);

  // 9. GET /api/components
  const componentsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/components',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Fetch Components', componentsRes.status === 200 && componentsRes.data.count > 0);

  // 10. GET /api/errors
  const errorsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/errors',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Fetch Error Logs', errorsRes.status === 200 && errorsRes.data.count > 0);

  // 11. GET /api/maintenance
  const maintenanceRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/maintenance',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Fetch Maintenance Records', maintenanceRes.status === 200 && maintenanceRes.data.count > 0);

  // 12. GET /api/notifications
  const notificationsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Fetch Notification Alerts', notificationsRes.status === 200 && Array.isArray(notificationsRes.data.data));

  // 13. GET /api/analytics/dashboard
  const dashAnalyticsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    'Consolidated Dashboard Analytics API',
    dashAnalyticsRes.status === 200 &&
      dashAnalyticsRes.data.data.kpis &&
      dashAnalyticsRes.data.data.riskDistribution
  );

  // 14. GET /api/analytics/trends
  const trendsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/trends',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Analytics Trends & MTBF API', trendsRes.status === 200 && trendsRes.data.data.summary);

  console.log('========================================================');
  console.log(`  Tests Completed: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch((e) => {
  console.error('Test script failed:', e);
  process.exit(1);
});
