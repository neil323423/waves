import express from 'express';
import path from 'path';

const router = express.Router();
const __dirname = process.cwd();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

export default router;
