// meta-ai-router.js — SOTA 2026 Meta-AI Prompt Router & Frontier Model Mesh for UNIN
// Directs and orchestrates other AI systems (Claude, v0, Perplexity, ChatGPT, Blender) with SOTA prompts.
'use strict';

const { exec } = require('child_process');
const { shell } = require('electron');

const FRONTIER_DOMAINS = {
  UI_FRONTEND: {
    name: 'v0.dev / Bolt.new',
    url: 'https://v0.dev',
    rationale: 'World-class interactive React, Next.js, and Tailwind UI generation with instant live preview.',
    keywords: ['ui', 'frontend', 'react', 'nextjs', 'tailwind', 'component', 'dashboard', 'landing page', 'css', 'ui design', 'web design', 'wireframe', 'mockup', 'website', 'portfolio', 'web site', 'site', 'web app', 'html', 'threejs', 'spline', 'webgl']
  },
  DEEP_ARCHITECTURE: {
    name: 'Claude 3.7 Sonnet',
    url: 'https://claude.ai/new',
    rationale: 'Industry #1 frontier reasoning for deep systems architecture, complex refactoring, and AST manipulation.',
    keywords: ['architecture', 'refactor', 'system design', 'backend', 'distributed', 'algorithm', 'concurrency', 'type safety', 'database', 'microservices']
  },
  DEEP_RESEARCH: {
    name: 'Perplexity / DeepResearch',
    url: 'https://www.perplexity.ai',
    rationale: 'Real-time multi-source academic citation, cross-checking, and up-to-date market verification.',
    keywords: ['research', 'paper', 'citation', 'compare', 'news', 'benchmark', 'analysis', 'stats', 'market']
  },
  PROCEDURAL_3D: {
    name: 'Spline 3D Web Engine',
    url: 'https://spline.design',
    rationale: 'Interactive 3D web design, WebGL procedural models and real-time 3D animation.',
    keywords: ['3d model', 'blender', 'mesh', 'render 3d', 'character animation', 'rigging', 'texture map', 'glb model']
  },
  IMAGE_GENERATION: {
    name: 'Midjourney / Flux',
    url: 'https://www.midjourney.com',
    rationale: 'State-of-the-art photorealistic visual asset, concept art, and brand rendering.',
    keywords: ['image', 'photo', 'art', 'logo', 'drawing', 'render image', 'avatar art', 'wallpaper']
  }
};

/**
 * Classifies a user task and identifies the absolute best frontier AI in the world for that task.
 */
function classifyOptimalFrontierModel(taskIntent) {
  const low = (taskIntent || '').toLowerCase();
  
  // If the intent contains web/portfolio/app/site/frontend keywords,
  // it is a UI/Frontend application (even if it mentions "3D")
  const isWebIntent = /(?:website|portfolio|web\s*site|landing\s*page|web\s*app|dashboard|frontend|react|nextjs|threejs|webgl|html)/i.test(low);

  let bestDomain = isWebIntent ? 'UI_FRONTEND' : 'DEEP_ARCHITECTURE';
  let bestScore = 0;

  for (const [key, domain] of Object.entries(FRONTIER_DOMAINS)) {
    // If it's a website or portfolio, never misclassify it as PROCEDURAL_3D
    if (isWebIntent && key === 'PROCEDURAL_3D') continue;

    let score = 0;
    for (const kw of domain.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(low)) {
        // Specific longer keyword phrases carry much higher score
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestDomain = key;
    }
  }

  return {
    domain: bestDomain,
    ...FRONTIER_DOMAINS[bestDomain]
  };
}

const fs = require('fs');
const path = require('path');

const os = require('os');

function getVenarRegistry() {
  try {
    const regPath = path.join(os.homedir(), '.venar', 'registry.json');
    if (fs.existsSync(regPath)) {
      return JSON.parse(fs.readFileSync(regPath, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function matchVenarSkills(userIntent, topN = 3) {
  const reg = getVenarRegistry();
  if (!reg || !Array.isArray(reg.skills)) return [];

  const query = (userIntent || '').toLowerCase();
  const qWords = query.split(/\s+/).filter(w => w.length > 2);

  const scored = reg.skills.map(s => {
    let score = 0;
    const text = ((s.name || '') + ' ' + (s.desc || '') + ' ' + (s.category || '') + ' ' + (s.prompt || '')).toLowerCase();
    for (const w of qWords) {
      if (text.includes(w)) score += 5;
    }
    if (query.includes('3d') && text.includes('3d')) score += 12;
    if (query.includes('website') && (text.includes('web') || text.includes('ui') || text.includes('design'))) score += 10;
    if (query.includes('portfolio') && (text.includes('portfolio') || text.includes('spatial') || text.includes('ui/ux'))) score += 10;
    if (query.includes('build') || query.includes('create') || query.includes('code')) {
      if (text.includes('prototype') || text.includes('architecture') || text.includes('design')) score += 4;
    }
    return { skill: s, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(item => item.skill);
}

function getGeminiConfig() {
  try {
    const cfgPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(cfgPath)) {
      return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    }
  } catch (e) {}
  return null;
}

async function callGeminiFast(prompt, systemInstruction, timeoutMs = 7000) {
  const cfg = getGeminiConfig();
  if (!cfg || !cfg.gemini_key) return null;

  // Primary model and fast-lite fallback
  const modelsToTry = [cfg.gemini_model || 'gemini-2.5-flash-lite', 'gemini-2.5-flash-lite'];

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini_key}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    };
    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);
      const data = await res.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
    } catch (e) {
      clearTimeout(timer);
    }
  }
  return null;
}

/**
 * 2026 SOTA Dynamic Metaprompt Architect.
 * Synthesizes a bespoke, engine-native specification for the target tool on-the-fly,
 * powered by VENAR's 50 Skills Matrix with Zero Quota Reliance.
 */
async function synthesizeDynamicMetaPrompt(rawIntent, targetModel = 'Claude') {
  const clean = (rawIntent || '').trim();
  if (!clean) return '';

  const systemInstruction = `You are a World-Class Principal Prompt Architect in 2026.
Transform the user's intent into the highest-performance, domain-native specification for target tool '${targetModel}'.
Rules:
1. For Code/Architecture (Claude 3.7, Codex, Antigravity): Output strict architecture, folder structure, zero placeholders, typed interfaces, and test criteria.
2. For Frontend/UI (v0.dev, Bolt.new): Output Next.js 15, Tailwind v4, Framer Motion, shadcn/ui components, responsive layout, and bento-grid tokens.
3. For Music/Audio (Suno, Udio, ElevenLabs): Output [Style, BPM, Musical Key, Mood, Stem instrumentation, Lyrics structure tags].
4. For 3D/VFX (Blender, Unreal, Spline): Output quad topology, polycount budget, rigging hierarchy, PBR materials, and export formats.
5. For Deep Research (Perplexity, Consensus): Output multi-angle search queries, peer-reviewed constraints, and statistical verification.
Return ONLY the finalized prompt ready to be pasted. No conversational meta-commentary.`;

  try {
    const aiPrompt = await callGeminiFast(`User Intent: "${clean}"\nTarget Tool: "${targetModel}"`, systemInstruction, 5500);
    if (aiPrompt && aiPrompt.length > 50) {
      return aiPrompt;
    }
  } catch (e) {}

  // 2. Offline VENAR 50-Skills Domain Synthesis (100% Guaranteed FAANG Tier)
  const matchedSkills = matchVenarSkills(clean, 3);
  if (matchedSkills.length > 0) {
    const skillDirectives = matchedSkills.map(s => {
      return `### [ACTIVATED VENAR SKILL: ${s.name.toUpperCase()} (Rank #${s.rank || 1})]\n${s.prompt || s.desc}`;
    }).join('\n\n');

    return `[2026 FAANG PRODUCTION SPECIFICATION FOR ${targetModel.toUpperCase()}]
USER OBJECTIVE: "${clean}"
TARGET WORKSPACE: ${targetModel}

================================================================================
ENGINEERING & ARCHITECTURAL BLUEPRINT (Synthesized from VENAR 50-Skills Matrix)
================================================================================
${skillDirectives}

================================================================================
CRITICAL PRODUCTION DIRECTIVES:
1. ZERO PLACEHOLDERS: Implement all components, logic, and shaders completely. No "TODOs", "// implement here", or ellipses.
2. PRODUCTION EXCELLENCE: Complete, executable code with defensive error boundaries, fluid responsiveness, and high-performance WebGL.
3. DESIGN RIGOR: Dark-mode luxury palette, silky smooth micro-interactions, and accessible typography.
Begin generation immediately with full implementation:`.trim();
  }

  // 3. Resilient Structural Fallback
  return `[2026 SOTA SPECIFICATION FOR ${targetModel.toUpperCase()}]
USER OBJECTIVE: "${clean}"
TARGET WORKSPACE: ${targetModel}

TECHNICAL SPECIFICATIONS:
- ARCHITECTURE: Production-ready modular implementation with zero slop and zero placeholders.
- DEFENSIVE PROGRAMMING: Comprehensive error handling, resilience, and edge case coverage.
- PERFORMANCE: High-performance rendering, memory lifecycle cleanup, and optimized hot paths.
Deliver the complete, executable source code directly:`.trim();
}

/**
 * Backward compatibility alias for synchronous callers
 */
function compileSotaPrompt(rawIntent, targetModel = 'Claude') {
  const clean = (rawIntent || '').trim();
  return `[SYSTEM: PRO-TIER FAANG SPECIFICATION FOR ${targetModel.toUpperCase()}]
ROLE: Principal Systems Architect
USER INTENT: "${clean}"
TECHNICAL SPECIFICATIONS:
- ARCHITECTURE: Production-ready modular implementation with zero slop.
- DEFENSIVE PROGRAMMING: Comprehensive error handling, resilience, and edge case coverage.
- PERFORMANCE: Deterministic cleanup and optimized hot paths.`.trim();
}

/**
 * 2026 Dynamic Zero-Shot Tool & Sector Discovery.
 * Given arbitrary user intent, discovers the top 3-4 world champion tools on-the-fly.
 */
async function synthesizeDynamicToolOptions(userIntent) {
  const clean = (userIntent || '').trim();
  const low = clean.toLowerCase();

  // If the intent is related to websites, portfolios, 3D web, UI, or apps,
  // directly return our curated 2026 SOTA Frontier AI Engines!
  const isWebOr3DIntent = /(?:website|portfolio|web\s*site|landing\s*page|web\s*app|dashboard|frontend|react|nextjs|threejs|webgl|html|3d|render|shader|spline|ui|design)/i.test(low);

  if (isWebOr3DIntent) {
    return [
      {
        key: 'claude',
        name: 'Claude 3.7 Sonnet',
        url: 'https://claude.ai/new',
        icon: '🚀',
        badge: 'Free Tier · World #1',
        description: '3D Shaders, OKLCH Palettes & Full Architecture',
        isRecommended: true
      },
      {
        key: 'v0',
        name: 'v0.dev by Vercel',
        url: 'https://v0.dev',
        icon: '⚡',
        badge: 'Free UI Tier',
        description: 'React, Next.js & Tailwind Components',
        isRecommended: false
      },
      {
        key: 'spline',
        name: 'Spline 3D Canvas',
        url: 'https://spline.design',
        icon: '🎨',
        badge: '100% Free 3D Web',
        description: 'Interactive 3D Visual Physics & Particles',
        isRecommended: false
      },
      {
        key: 'antigravity',
        name: 'Google Antigravity IDE',
        url: 'antigravity:',
        icon: '🌌',
        badge: 'Local Free Engine',
        description: 'Multi-File Local Three.js Project',
        isRecommended: false
      }
    ];
  }

  const systemInstruction = `You are the Universal Tech Intelligence Router in 2026.
Given a user's task intent, discover the TOP 3-4 WORLD-CLASS tools or AI engines (both desktop apps and web platforms) that excel at this exact task.
Return a STRICT JSON array matching this schema:
[
  {
    "key": "unique_slug",
    "name": "Tool Display Name",
    "url": "https://direct-url.com or app_protocol",
    "icon": "relevant emoji icon",
    "badge": "Top Pick / Industry Standard / SOTA Engine / World #1",
    "description": "One concise line explaining why it is the champion for this task",
    "isRecommended": boolean
  }
]
Output ONLY valid JSON. Exactly 3 or 4 items.`;

  try {
    const aiTools = await callGeminiFast(`User Task Intent: "${clean}"`, systemInstruction, 5000);
    if (aiTools) {
      const fence = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
      let jsonText = aiTools;
      if (jsonText.includes(fence)) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (match) jsonText = match[1].trim();
      }
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 4);
      }
    }
  } catch (e) {}

  // Fallback default frontier tools if offline (strictly Free-first verified)
  return [
    {
      key: 'claude',
      name: 'Claude 3.7 Sonnet',
      url: 'https://claude.ai/new',
      icon: '🚀',
      badge: 'Free Tier · World #1',
      description: 'Deep Architecture & Systems Refactoring',
      isRecommended: true
    },
    {
      key: 'v0',
      name: 'v0.dev by Vercel',
      url: 'https://v0.dev',
      icon: '⚡',
      badge: 'Free UI Tier',
      description: 'React, Next.js & Tailwind Components',
      isRecommended: false
    },
    {
      key: 'chatgpt',
      name: 'ChatGPT / OpenAI Codex',
      url: 'https://chatgpt.com',
      icon: '💡',
      badge: 'Free Tier · OpenAI',
      description: 'GPT-4o, o3-mini Reasoning & Algorithms',
      isRecommended: false
    },
    {
      key: 'antigravity',
      name: 'Google Antigravity IDE',
      url: 'antigravity:',
      icon: '🌌',
      badge: 'Local Free Engine',
      description: 'Local Multi-File Engine & Terminal',
      isRecommended: false
    }
  ];
}

async function routeMetaAiTask(taskIntent, options = {}) {
  let optimal = null;

  if (options.preferredAI) {
    const pref = options.preferredAI.toLowerCase();
    if (pref.includes('claude')) {
      optimal = { name: 'Claude 3.7 Sonnet', url: 'https://claude.ai/new', rationale: 'Industry #1 frontier reasoning for deep systems architecture and refactoring.' };
    } else if (pref.includes('v0')) {
      optimal = { name: 'v0.dev / Bolt.new', url: 'https://v0.dev', rationale: 'World-class interactive React & Tailwind UI generation with instant live preview.' };
    } else if (pref.includes('chatgpt') || pref.includes('openai') || pref.includes('codex')) {
      optimal = { name: 'ChatGPT / OpenAI Codex', url: 'https://chatgpt.com', rationale: 'Advanced reasoning, algorithmic coding and general intelligence.' };
    } else if (pref.includes('perplexity')) {
      optimal = { name: 'Perplexity AI', url: 'https://www.perplexity.ai', rationale: 'Real-time multi-source academic citation and market research.' };
    } else if (pref.includes('bolt')) {
      optimal = { name: 'Bolt.new Sandbox', url: 'https://bolt.new', rationale: 'In-browser fullstack container sandbox.' };
    }
  }

  if (!optimal && options.targetUrl) {
    optimal = { name: options.name || options.preferredAI || 'Web Workspace', url: options.targetUrl, rationale: 'User-specified target workspace.' };
  }

  if (!optimal) {
    optimal = classifyOptimalFrontierModel(taskIntent);
  }

  // SOTA 2026 Clean Intent Dispatch (Zero 3000-char Prompt Dumping, 100% Dynamic Domain!)
  let compiledPrompt = taskIntent;
  if (optimal.name.toLowerCase().includes('claude') || optimal.name.toLowerCase().includes('v0')) {
    const low = (taskIntent || '').toLowerCase();
    let subject = 'luxury 3D modern portfolio and web experience';
    
    if (/gym|fitness|workout|trainer|bodybuilding/i.test(low)) {
      subject = 'luxury 3D gym & fitness portfolio website for a gym owner/trainer';
    } else if (/ai|engineer|developer|software|coding/i.test(low)) {
      subject = 'luxury 3D portfolio website for an AI engineer / developer';
    } else if (/doctor|medical|clinic|hospital/i.test(low)) {
      subject = 'modern luxury 3D medical & clinic showcase website';
    } else if (/restaurant|cafe|food|bakery/i.test(low)) {
      subject = 'luxury 3D culinary & restaurant experience website';
    } else if (/ecommerce|shop|store|product/i.test(low)) {
      subject = 'high-converting luxury 3D product showcase & e-commerce landing page';
    } else if (/agency|studio|design/i.test(low)) {
      subject = 'award-winning 3D creative design agency portfolio website';
    } else {
      const stripped = (taskIntent || '')
        .replace(/^(?:nenu|unin|buddy|oka|chey|build chey|kavali|cheyamann|cheyandi)\s+/gi, '')
        .replace(/\s+(?:chey|kavali|buddy|ani|anta)$/gi, '')
        .trim();
      if (stripped.length > 4) {
        subject = `${stripped} with interactive 3D visual experience`;
      }
    }

    const has3D = /3d|three|webgl|shader|vortex|particle/i.test(low);
    const visualDetails = has3D
      ? 'procedural Three.js 3D visual canvas, interactive dynamic Bento grid, and OKLCH obsidian dark mode'
      : 'fluid responsive layout, crisp typography, and sleek modern micro-interactions';

    compiledPrompt = `Build a ${subject} with ${visualDetails}.`;
  } else {
    compiledPrompt = await synthesizeDynamicMetaPrompt(taskIntent, optimal.name);
  }
  const autoOpen = options.autoOpen !== false;

  console.log(`[MetaAIRouter] Dispatching to ${optimal.name} [${optimal.url}] for intent: "${taskIntent}"`);

  if (autoOpen && optimal.url && optimal.url.startsWith('http')) {
    try {
      if (shell && typeof shell.openExternal === 'function') {
        shell.openExternal(optimal.url).catch(() => {
          exec(`start "" "${optimal.url}"`);
        });
      } else {
        exec(`start "" "${optimal.url}"`);
      }
    } catch (e) {
      exec(`start "" "${optimal.url}"`);
    }
  }

  return {
    success: true,
    taskIntent,
    optimalAI: optimal.name,
    rationale: optimal.rationale,
    targetUrl: optimal.url,
    compiledPrompt,
    status: `Task routed to ${optimal.name}. SOTA specification dynamically synthesized and launched.`
  };
}

module.exports = {
  classifyOptimalFrontierModel,
  compileSotaPrompt,
  synthesizeDynamicMetaPrompt,
  synthesizeDynamicToolOptions,
  routeMetaAiTask
};

