import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

if (!ELEVEN_API_KEY) {
  console.warn('لم يتم ضبط ELEVENLABS_API_KEY في ملف .env');
}

app.get('/api/voices', async (req, res) => {
  try {
    const r = await fetch(`${ELEVEN_BASE}/voices`, {
      headers: { 'xi-api-key': ELEVEN_API_KEY }
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText || 'فشل جلب الأصوات' });
    }
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tts', async (req, res) => {
  const { text, voice_id, model_id } = req.body || {};
  if (!text || !voice_id) {
    return res.status(400).json({ error: 'النص ومعرّف الصوت (voice_id) مطلوبان' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'النص طويل جدًا (الحد الأقصى 5000 حرف)' });
  }
  try {
    const r = await fetch(`${ELEVEN_BASE}/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: model_id || 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText || 'فشل توليد الصوت' });
    }
    const buffer = Buffer.from(await r.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: Boolean(ELEVEN_API_KEY) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`نُطق يعمل على http://localhost:${PORT}`);
});
