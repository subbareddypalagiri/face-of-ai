const https = require('https');
const apiKey = process.env.GEMINI_API_KEY || '';
const model = 'gemini-3.5-flash-lite';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

const payload = {
  contents: [
    { role: 'user', parts: [{ text: 'UNIN start visual watchdog' }] },
    { role: 'model', parts: [{ text: JSON.stringify({
        thought: 'Activating visual watchdog sentinel',
        tool_call: { name: 'start_visual_watchdog', params: { intervalMs: 4000 } },
        speech: 'Starting visual watchdog now.',
        action: 'none',
        emotion: 'happy',
        is_final: false
      }) }] },
    { role: 'user', parts: [{ text: '[Observation for start_visual_watchdog]: {\ success\:true,\active\:true,\intervalMs\:4000,\message\:\UNIN Visual Watchdog Sentinel ACTIVATED\}' }] }
  ],
  systemInstruction: { parts: [{ text: 'Respond in JSON with thought, speech, tool_call { name, params }, action, emotion, is_final: true.' }] },
  generationConfig: { responseMimeType: 'application/json' }
};

const data = JSON.stringify(payload);
const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
  });
});
req.write(data);
req.end();
