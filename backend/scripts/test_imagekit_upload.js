const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API = process.env.API_URL || 'http://localhost:5000/api';

async function run() {
  try {
    // 1x1 PNG base64
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const buf = Buffer.from(base64, 'base64');
    const filePath = path.join(__dirname, 'sample.png');
    fs.writeFileSync(filePath, buf);
    console.log('Wrote sample image to', filePath);

    // Register or login
    const email = 'ci-test@example.com';
    const password = 'Password123!';

    let token = null;
    try {
      const reg = await axios.post(`${API}/auth/register`, { email, password });
      token = reg.data.token;
      console.log('Registered admin, token:', token ? 'RECEIVED' : 'NO');
    } catch (err) {
      console.log('Register failed (maybe exists):', err.response && err.response.data ? err.response.data.message : err.message);
      // Try login
      const login = await axios.post(`${API}/auth/login`, { email, password });
      token = login.data.token;
      console.log('Logged in, token:', token ? 'RECEIVED' : 'NO');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Create test
    const testRes = await axios.post(`${API}/tests`, { name: 'CI Test', date: new Date().toISOString().slice(0,10) }, { headers });
    const test = testRes.data.data;
    console.log('Created test:', test._id);

    // Create student
    const stuRes = await axios.post(`${API}/students`, { name: 'CI Student', rollNo: `CI-1-${Date.now()}` }, { headers });
    const student = stuRes.data.data;
    console.log('Created student:', student._id);

    // Create result
    const resRes = await axios.post(`${API}/results`, { studentId: student._id, testId: test._id, marks: 88 }, { headers });
    const result = resRes.data.data;
    console.log('Created result:', result._id);

    // Upload file
    const form = new FormData();
    form.append('images', fs.createReadStream(filePath));

    const uploadRes = await axios.post(`${API}/results/${result._id}/uploads`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Upload response:', uploadRes.data);
  } catch (err) {
    console.error('Test script error:', err.response && err.response.data ? err.response.data : err.message);
    process.exitCode = 1;
  }
}

run();
