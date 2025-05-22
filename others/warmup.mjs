import http from 'http';

const endpoints = [
  'http://localhost:3000/',
  'http://localhost:3000/g',
  'http://localhost:3000/a'
];

function httpGet(url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve({ url, statusCode: res.statusCode });
      });
    });

    req.on('error', (e) => {
      resolve({ url, error: e.message });
    });

    req.setTimeout(timeout, () => {
      req.abort();
      resolve({ url, error: 'Timeout' });
    });
  });
}

async function warm(retries = 2) {
  const results = await Promise.all(endpoints.map(async (url) => {
    for (let i = 0; i <= retries; i++) {
      const res = await httpGet(url);
      if (!res.error) {
        console.log(`[WARMUP] ${url} → ${res.statusCode}`);
        return res;
      } else {
        console.warn(`[WARMUP] ${url} attempt ${i + 1} failed: ${res.error}`);
      }
    }
    return { url, error: `Failed after ${retries + 1} attempts` };
  }));

  const failed = results.filter(r => r.error);
  if (failed.length) {
    console.warn(`[WARMUP] Some endpoints failed to warm:`, failed);
  } else {
    console.log('[WARMUP] All endpoints warmed successfully');
  }
}

async function periodicWarmup(intervalMs = 5 * 60 * 1000) {
  while (true) {
    await warm();
    console.log('[WARMUP] Cycle done');
    await new Promise(res => setTimeout(res, intervalMs));
  }
}

setTimeout(() => periodicWarmup(), 2000);