const key = process.env.GEMINI_API_KEY || '';
const prompt = 'open whatsapp and send a message to nikki';
const systemPrompt = `You are UNIN, the embodied 3D AI desktop companion.
* RULE 4 - WHATSAPP & DIRECT MESSAGING (CRITICAL):
  - When the user asks to send a WhatsApp message or open WhatsApp for a contact (e.g. "open whatsapp and send a message to nikki"):
  - NEVER reply with plain text asking "what message should I send?" without executing the tool!
  - If the user did NOT specify a message body, DEFAULT the message to "Hi!" and set "autoSend": false.
  - IMMEDIATELY call "send_whatsapp_message" with:
    { "contact": "Nikki", "message": "Hi!", "autoSend": false }

== REACT MULTI-STEP REASONING LOOP ==
Respond strictly in valid JSON:
{
  "thought": "reasoning",
  "tool_call": {
    "name": "send_whatsapp_message",
    "params": { "contact": "Nikki", "message": "Hi!", "autoSend": false }
  },
  "speech": "spoken text",
  "action": "wave",
  "emotion": "happy",
  "is_final": false
}`;

async function test() {
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: 'application/json' }
  };
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.error) {
    console.error('ERROR:', data.error);
  } else {
    console.log('RESPONSE:', data.candidates[0].content.parts[0].text);
  }
}
test();
