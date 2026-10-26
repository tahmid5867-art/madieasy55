import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleAIAssistant, handleScanInvoice, handleStockForecast } from './api/aiHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Endpoints
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { prompt, context, language } = req.body;
    const result = await handleAIAssistant(prompt, context, language);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/scan-invoice', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    const result = await handleScanInvoice(image, mimeType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/forecast', async (req, res) => {
  try {
    const { inventory, sales, language } = req.body;
    const result = await handleStockForecast(inventory, sales, language);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static build files in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`MediEasy pharmacy server running on port ${port}`);
});
