const fs = require('fs');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

async function callGemini(prompt, systemInstruction) {
  const apiKey = cfg.gemini_key;
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.candidates && data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  throw new Error(JSON.stringify(data));
}

async function run() {
  console.log('Testing SOTA Dynamic Metaprompt Synthesis...');
  const prompt = await callGemini(
    'User Intent: Create a cyberpunk EDM track with heavy bass',
    'You are a 2026 Principal Prompt Architect. Target tool is Suno AI. Generate the optimal, engine-native prompt using modern Suno syntax [Style, BPM, Key, Lyrics structure]. Output only the prompt.'
  );
  console.log('\n--- Synthesized Suno Prompt ---\n', prompt);

  console.log('\nTesting Dynamic Tool Discovery...');
  const tools = await callGemini(
    'User Intent: Rig a 3D character model and export to game engine',
    'Return a valid JSON array of the top 3 world-class tools in 2026 for this exact intent. Schema: [{"name": string, "url": string, "icon": string, "badge": string, "description": string}]. Return ONLY JSON.'
  );
  console.log('\n--- Discovered Tools JSON ---\n', tools);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
