// test-voice-normalizer.js — Verifies UNIN SOTA Acoustic Phonetic Normalizer
const testPhrases = [
  { raw: "union open chey", expected: "UNIN open chey" },
  { raw: "and the gravity open chase the 3d website build chey", expectedContains: ["Antigravity", "open chesi", "build chey"] },
  { raw: "the essay project switch chey", expectedContains: ["DSA"] },
  { raw: "blender love character build chey", expectedContains: ["Blender lo", "build chey"] },
  { raw: "three chase lo 3d portfolio build chey", expectedContains: ["Three.js", "build chey"] },
  { raw: "a law click chey", expectedContains: ["allow"] },
  { raw: "terminal law command run chey", expectedContains: ["terminal lo"] },
  { raw: "what's up love message pettu", expectedContains: ["WhatsApp"] },
  { raw: "screen to do", expectedContains: ["screen chudu"] }
];

function normalizeVoice(raw) {
  return raw.trim()
    .replace(/\b(?:union|onion|you\s*nin|you\s*mean|you\s*need|u\s*nin|u\s*mean)\b/gi, 'UNIN')
    .replace(/\b(?:anti\s*gravity|integriti|and\s*the\s*gravity|anti\s*grad|anti\s*grav)\b/gi, 'Antigravity')
    .replace(/\b(?:vs\s*code|v\s*s\s*code|we\s*s\s*code|visual\s*studio\s*code)\b/gi, 'VSCode')
    .replace(/\b(?:3gs|3ds|three\s*chase|three\s*days|three\s*js|3\s*js)\b/gi, 'Three.js')
    .replace(/\b(?:blender|calendar|blenda|plender)\b/gi, 'Blender')
    .replace(/\b(?:web\s*gl|web\s*jail)\b/gi, 'WebGL')
    .replace(/\b(?:the\s*essay|d\s*s\s*a|ds\s*a)\b/gi, 'DSA')
    .replace(/\b(?:yama\s*ai|yama\s*a\s*i)\b/gi, 'Yama-ai')
    .replace(/\b(?:face\s*of\s*me|face\s*of\s*ai)\b/gi, 'face of me')
    .replace(/\b(?:what's\s*up|what\s*app|whats\s*app|wat\s*sap|vatsap)\b/gi, 'WhatsApp')
    .replace(/\b(?:u\s*tube|you\s*tube)\b/gi, 'YouTube')
    .replace(/\b(?:google\s*chrome|crome|krome)\b/gi, 'Chrome')
    .replace(/\b(?:get\s*hub|kit\s*hub|git\s*hub)\b/gi, 'GitHub')
    .replace(/\b(?:a\s*law|hello\s*click|a\s*long\s*click)\b/gi, 'allow')
    .replace(/\b(?:proceed\s*click|perceived\s*click)\b/gi, 'proceed')
    .replace(/\b(?:open\s*chase\s*the|open\s*chase|open\s*chey\s*see)\b/gi, 'open chesi')
    .replace(/\b(?:bill\s*change|bill\s*chey|build\s*j)\b/gi, 'build chey')
    .replace(/\b(?:close\s*chase\s*the|close\s*chase)\b/gi, 'close chesi')
    .replace(/\b(?:terminal\s*law|terminal\s*low)\b/gi, 'terminal lo')
    .replace(/\b(?:blender\s*love|blender\s*law)\b/gi, 'blender lo')
    .replace(/\b(?:love)\b/gi, 'lo')
    .replace(/\b(?:screen\s*to\s*do|screen\s*choodu)\b/gi, 'screen chudu')
    .replace(/\b(?:jayant|jayan)\b/gi, 'Jayanth');
}

console.log("=== RUNNING ACOUSTIC PHONETIC NORMALIZER TESTS ===");
let allPassed = true;
for (const t of testPhrases) {
  const res = normalizeVoice(t.raw);
  console.log(`[Input]: "${t.raw}" -> [Normalized]: "${res}"`);
  if (t.expected && res.toLowerCase() !== t.expected.toLowerCase()) {
    console.error(`FAILED: Expected "${t.expected}" but got "${res}"`);
    allPassed = false;
  }
  if (t.expectedContains) {
    for (const c of t.expectedContains) {
      if (!res.toLowerCase().includes(c.toLowerCase())) {
        console.error(`FAILED: Expected to contain "${c}" in "${res}"`);
        allPassed = false;
      }
    }
  }
}

if (allPassed) {
  console.log(">>> ALL ACOUSTIC NORMALIZER TESTS PASSED 100%! <<<");
} else {
  process.exit(1);
}
