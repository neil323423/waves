import express from 'express';
import axios from 'axios';
import http from 'http';

const router = express.Router();
const httpAgent = new http.Agent({ keepAlive: true });

const authAxios = axios.create({
  baseURL: 'https://puter.com',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'https://puter.com',
    'Referer': 'https://puter.com/app/editor',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
  },
  httpAgent
});

const apiAxios = axios.create({
  baseURL: 'https://api.puter.com',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  httpAgent
});

let puterJwtToken = null;
const TOKEN_REFRESH_INTERVAL = 12 * 60 * 60 * 1000;

async function generateJwtToken() {
  try {
    const response = await authAxios.post('/signup', {
      referrer: '/app/editor',
      is_temp: true
    });
    if (response.data && response.data.token) {
      puterJwtToken = response.data.token;
      console.log('JWT token generated successfully.');
    } else {
      console.error('No token received', response.data);
    }
  } catch (error) {
    console.error('JWT generation error:', error.response ? error.response.data : error.message);
  }
}

generateJwtToken();
setInterval(generateJwtToken, TOKEN_REFRESH_INTERVAL);

async function usePuterAPI(userMessages, model) {
  const requestData = {
    interface: 'puter-chat-completion',
    driver: 'claude',
    test_mode: false,
    method: 'complete',
    args: {
      messages: userMessages.length === 0 ? [{ content: 'Hello' }] : userMessages,
      model
    }
  };
  try {
    const response = await apiAxios.post('/drivers/call', requestData, {
      headers: {
        'Authorization': `Bearer ${puterJwtToken}`,
        'Origin': 'https://docs.puter.com',
        'Referer': 'https://docs.puter.com/'
      },
      responseType: 'stream'
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

async function processPuterStream(stream) {
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    stream.on('data', (chunk) => {
      fullResponse += chunk.toString();
    });
    stream.on('end', () => {
      try {
        const rawData = JSON.parse(fullResponse);
        resolve({
          model: rawData.result.message.model,
          content: rawData.result.message.content[0].text,
          usage: rawData.result.usage
        });
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

router.post('/v1/ai/completions', async (req, res) => {
  try {
    if (!puterJwtToken) {
      await generateJwtToken();
      if (!puterJwtToken) {
        return res.status(500).json({ error: 'Failed to authenticate with Puter API' });
      }
    }
    const systemPrompt = {
      role: 'system',
      content: 'You are an assistant, you need to make sure you provide the smartest, fast, and brief answers. Think before responding.'
    };
    let userMessages = [];
    let model = 'claude-3-5-sonnet-20241022';
    const streamMode = req.body && req.body.stream === true;
    if (req.body && Array.isArray(req.body.messages)) {
      userMessages = req.body.messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }));
      if (!userMessages.some((msg) => msg.role === 'system')) {
        userMessages.unshift(systemPrompt);
      }
    } else {
      userMessages = [systemPrompt];
    }
    if (req.body && req.body.model) {
      if (req.body.model === 'claude3.7') {
        model = 'claude-3-7-sonnet-latest';
      } else if (req.body.model === 'claude3.5') {
        model = 'claude-3-5-sonnet-20241022';
      }
    }
    try {
      const stream = await usePuterAPI(userMessages, model);
      if (streamMode) {
        const result = await processPuterStream(stream);
        return res.json(result);
      }
      let fullResponse = '';
      stream.on('data', (chunk) => {
        fullResponse += chunk.toString();
      });
      stream.on('end', () => {
        try {
          const rawData = JSON.parse(fullResponse);
          const simplifiedResponse = {
            model: rawData.result.message.model,
            content: rawData.result.message.content[0].text,
            usage: rawData.result.usage
          };
          res.json(simplifiedResponse);
        } catch (err) {
          res.status(500).json({ error: 'Failed to parse response', message: err.message });
        }
      });
      stream.on('error', (err) => {
        res.status(500).json({ error: 'Stream error: ' + err.message });
      });
    } catch (apiErr) {
      res.status(500).json({ error: 'API error: ' + apiErr.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

export default router;