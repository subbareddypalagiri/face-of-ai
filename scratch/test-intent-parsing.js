function parseWhatsAppIntent(userPrompt) {
  let contact = '';
  let message = '';

  // 1. Quoted message extraction: "message" or 'message' or “message”
  const quoteMatch = userPrompt.match(/["'“]([^"'“”]+)["'”]/);
  if (quoteMatch) {
    message = quoteMatch[1].trim();
  }

  // 2. Telugu pattern: "<Name> ki / ku whatsapp message ..."
  const teluguMatch = userPrompt.match(/^([A-Za-z0-9_+]+)\s+(?:ki|ku)\s+whatsapp/i);
  if (teluguMatch) {
    contact = teluguMatch[1].trim();
  }

  // 3. English "to <contact>"
  if (!contact) {
    const toMatch = userPrompt.match(/(?:to)\s+([A-Za-z0-9_+]+)/i);
    if (toMatch && !['whatsapp', 'message', 'msg'].includes(toMatch[1].toLowerCase())) {
      contact = toMatch[1].trim();
    }
  }

  // 4. "whatsapp <contact>" or "message <contact>"
  if (!contact) {
    const waMatch = userPrompt.match(/whatsapp\s+(?:message\s+)?(?:to\s+)?([A-Za-z0-9_+]+)/i);
    if (waMatch && !['message', 'msg', 'web', 'send'].includes(waMatch[1].toLowerCase())) {
      contact = waMatch[1].trim();
    }
  }

  // 5. Message extraction if not in quotes
  if (!message) {
    const sayingMatch = userPrompt.match(/(?:saying|that|ani|cheppu|text|body)[:\s]+(.+)$/i);
    if (sayingMatch) {
      message = sayingMatch[1].trim();
    } else {
      message = userPrompt.replace(/^.*?(?:send\s+)?whatsapp(?:\s+message)?(?:\s+to\s+\S+)?\s*/i, '').trim();
    }
  }

  if (!contact) contact = 'Nikki';
  if (!message) message = userPrompt;

  return { contact, message };
}

// Test cases
const cases = [
  'Send WhatsApp message to Nikki  "nidrapoyava"',
  'Send WhatsApp message to Nikki saying How are you?',
  'Nikki ki whatsapp message pettu "Hello buddy"',
  'Send whatsapp to +919876543210 "meeting at 5"',
  'whatsapp message to Jayanth that project is ready'
];

cases.forEach(c => {
  const parsed = parseWhatsAppIntent(c);
  console.log(`Prompt: "${c}" -> Contact: "${parsed.contact}", Message: "${parsed.message}"`);
});
