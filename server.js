const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ── Static files serve (HTML, VRM, FBX, JS అన్నీ) ──────────
app.use(express.static(__dirname));

// ── FBX Auto-Scanner API ────────────────────────────────────
// app.html ఇది call చేస్తుంది → folder లో అన్ని FBX files list ఇస్తుంది
function scanFBX(dir, baseDir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      scanFBX(fullPath, baseDir, results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.fbx')) {
      // Browser కి relative path ఇవ్వాలి
      const relativePath = fullPath.replace(baseDir + path.sep, '').replace(/\\/g, '/');
      const name = entry.name.replace('.fbx','').replace(/_/g,' ');
      results.push({ name, path: relativePath });
    }
  }
  return results;
}

app.get('/api/animations', (req, res) => {
  try {
    const list = scanFBX(__dirname, __dirname);
    res.json(list);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── MongoDB (chat history persistence) ──────────────────────
const mongoURI = process.env.MONGODB_URI || "";
if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log('🔥 MongoDB Connected!'))
    .catch(err  => console.warn('⚠️  MongoDB skip:', err.message));
} else {
  console.log('ℹ️  MongoDB URI not configured (set MONGODB_URI in .env). Skipping DB connection.');
}

const Chat = mongoose.model('Chat', new mongoose.Schema({
  sessionId: String, title: String, history: Array
}));

app.post('/api/chats', async (req, res) => {
  await Chat.findOneAndUpdate(
    { sessionId: req.body.sessionId },
    { title: req.body.title, history: req.body.history },
    { upsert: true, new: true }
  );
  res.json({ success: true });
});

app.get('/api/chats', async (req, res) => {
  const chats = await Chat.find().sort({ _id: -1 });
  res.json(chats);
});

// ── Start ───────────────────────────────────────────────────
app.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Server: http://0.0.0.0:3000 (External Access Enabled)');
  console.log('🎬 Open:   http://localhost:3000/app.html');
});