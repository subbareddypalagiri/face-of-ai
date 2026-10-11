// skill-hunter.js — Autonomous Skill Hunter, MCP Connector & Market-Grade Prompt Enhancer Engine
'use strict';

const https = require('https');
const http = require('http');

/**
 * Standard registry of battle-tested MCP servers, specialized libraries, and developer skills.
 */
const KNOWN_MCP_AND_SKILL_CATALOG = [
  {
    keywords: ['scrape', 'crawl', 'browser', 'web page', 'html', 'extract data'],
    name: 'Puppeteer / Playwright Web Agent MCP',
    package: '@modelcontextprotocol/server-puppeteer',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    recommendedPromptSkills: [
      'Use headless browser automation to navigate dynamic JS pages.',
      'Always wait for network idle and specific DOM selectors before extracting data.',
      'Implement exponential backoff retry for network errors and bot-detection fallbacks.'
    ]
  },
  {
    keywords: ['database', 'postgres', 'sql', 'query', 'supabase', 'schema'],
    name: 'PostgreSQL Database MCP',
    package: '@modelcontextprotocol/server-postgres',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    recommendedPromptSkills: [
      'Inspect schema and foreign keys before executing queries.',
      'Use parameterized queries to avoid SQL injection.',
      'Wrap multi-table modifications in atomic transactions.'
    ]
  },
  {
    keywords: ['file', 'folder', 'filesystem', 'directory', 'disk', 'read file', 'write file'],
    name: 'Local Filesystem Access MCP',
    package: '@modelcontextprotocol/server-filesystem',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    recommendedPromptSkills: [
      'Always verify file path existence before read/write operations.',
      'Preserve existing comments, licenses, and architecture conventions.',
      'Validate JSON/YAML schemas prior to saving state.'
    ]
  },
  {
    keywords: ['search', 'google', 'web search', 'latest', 'news', 'research'],
    name: 'Brave / DuckDuckGo Search MCP',
    package: '@modelcontextprotocol/server-brave-search',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    recommendedPromptSkills: [
      'Prioritize official documentation, GitHub repositories, and release changelogs.',
      'Cross-verify API versions to ensure no deprecated methods are used.'
    ]
  },
  {
    keywords: ['telegram', 'bot', 'message bot', 'alert', 'notification'],
    name: 'Telegram Bot API Connector',
    package: 'telegraf',
    docs: 'https://telegraf.js.org',
    recommendedPromptSkills: [
      'Initialize bot with Polling or Webhook mode based on deployment context.',
      'Store BOT_TOKEN securely in environment variables.',
      'Handle graceful shutdown via SIGINT/SIGTERM handlers.'
    ]
  },
  {
    keywords: ['video', 'movie', 'frame', 'render', 'audio', 'concatenate', 'ffmpeg'],
    name: 'FFmpeg Media Pipeline Engine',
    package: 'fluent-ffmpeg',
    docs: 'https://ffmpeg.org/documentation.html',
    recommendedPromptSkills: [
      'Extract exact last frame using `ffmpeg -sseof -1 -i input.mp4 -update 1 last_frame.png`.',
      'Maintain constant frame rate (CFR) and identical aspect ratios across stitched segments.',
      'Normalize audio loudness using loudnorm filter for cinematic audio balance.'
    ]
  },
  {
    keywords: ['whatsapp', 'wa', 'chat', 'direct message'],
    name: 'WhatsApp Business / Web Protocol Connector',
    package: 'whatsapp-web.js',
    docs: 'https://wppconnect.io',
    recommendedPromptSkills: [
      'Sanitize phone numbers to E.164 format (+CountryCodePhoneNumber).',
      'Include human-like typing cadences to avoid trigger-happy rate limits.'
    ]
  },
  {
    keywords: ['react', 'next', 'frontend', 'ui', 'tailwind', 'component'],
    name: 'Modern Full-Stack React / Next.js Framework Skills',
    package: 'next',
    docs: 'https://nextjs.org/docs',
    recommendedPromptSkills: [
      'Enforce strict TypeScript typings with zero `any` declarations.',
      'Use Server Components for data fetching and Client Components only for interactivity.',
      'Follow Apple HIG / FAANG-tier micro-interactions and responsive fluid layouts.'
    ]
  },
  {
    keywords: ['python', 'ai', 'data', 'pandas', 'numpy', 'machine learning'],
    name: 'Python Scientific & Machine Learning Stack',
    package: 'numpy pandas scikit-learn',
    docs: 'https://docs.python.org/3/',
    recommendedPromptSkills: [
      'Isolate dependencies in a dedicated virtual environment (`venv`).',
      'Use type hints (`from typing import ...`) for all function signatures.',
      'Vectorize calculations instead of iterative row-by-row loops.'
    ]
  },
  {
    keywords: ['3d', 'three', 'webgl', 'three.js', 'threejs', 'canvas', 'shader', 'theme', 'themes', '21.dev', 'concept', 'animation', 'spline', 'lucide', 'framer'],
    name: 'Three.js & 21.dev SOTA 3D Interactive Web Experience',
    package: 'three @types/three @react-three/fiber @react-three/drei lucide-react framer-motion',
    docs: 'https://threejs.org/docs/',
    recommendedPromptSkills: [
      'Initialize high-performance WebGL / Three.js canvas with antialiasing, cinematic ambient lighting, and interactive orbit/pointer controls.',
      'Adopt 21.dev trending aesthetics: dark mode glassmorphism (backdrop-blur-xl), neon gradient accents, and micro-physics.',
      'Implement smooth 60fps requestAnimationFrame render loops with responsive resize handling (window.innerWidth / window.innerHeight).',
      'Architect modular scene graph: Camera, Ambient/Directional Lights, Meshes with PBR Standard/Physical materials, and post-processing bloom.',
      'Ensure zero layout shift with preloaded textures and clean fallback states for mobile and desktop viewports.'
    ]
  }
];

/**
 * Real-time web knowledge lookup for cutting-edge libraries and prompt patterns.
 */
async function queryOnlineRegistry(query) {
  return new Promise((resolve) => {
    try {
      const q = encodeURIComponent(query);
      const url = `https://registry.npmjs.org/-/v1/search?text=${q}&size=3`;
      https.get(url, { headers: { 'User-Agent': 'Aura-Skill-Hunter/2.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const packages = (parsed.objects || []).map(obj => ({
              name: obj.package.name,
              description: obj.package.description,
              version: obj.package.version,
              links: obj.package.links
            }));
            resolve(packages);
          } catch(e) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    } catch(e) {
      resolve([]);
    }
  });
}

/**
 * Discover best skills, MCP servers, and connectors based on user's raw intent.
 */
async function discoverBestSkillsAndMCPs(taskIntent) {
  const cleanIntent = (taskIntent || '').toLowerCase();
  const matched = [];

  // Match catalog entries
  KNOWN_MCP_AND_SKILL_CATALOG.forEach(entry => {
    const isMatch = entry.keywords.some(kw => cleanIntent.includes(kw));
    if (isMatch) {
      matched.push(entry);
    }
  });

  // Query live registry if few matches
  let onlinePackages = [];
  if (matched.length === 0) {
    const keywords = cleanIntent.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).slice(0, 3).join(' ');
    if (keywords) {
      onlinePackages = await queryOnlineRegistry(keywords);
    }
  }

  return {
    success: true,
    intent: taskIntent,
    catalogMatches: matched,
    onlineMatches: onlinePackages,
    primaryConnector: matched[0] || (onlinePackages[0] ? { name: onlinePackages[0].name, package: onlinePackages[0].name } : null)
  };
}

/**
 * Market-Grade Prompt Enhancer:
 * Elevates raw user speech/input into a battle-tested, SOTA engineering prompt.
 */
function enhanceWithMarketStandards(rawPrompt, domain = 'software', discoveredSkills = null) {
  const clean = (rawPrompt || '').trim();
  if (!clean) return '';

  const skillsList = discoveredSkills?.catalogMatches || [];
  const skillGuidelines = [];
  skillsList.forEach(s => {
    if (s.recommendedPromptSkills) {
      skillGuidelines.push(...s.recommendedPromptSkills);
    }
  });

  const mcpNames = skillsList.map(s => s.name).join(', ') || 'Standard OS Execution & Modern Libraries';

  // Build SOTA Multi-Section Prompt
  const masterPrompt = [
    `# OBJECTIVE & HIGH-LEVEL GOAL`,
    `You are tasked with executing the following mission with senior FAANG-tier engineering excellence:`,
    `"${clean}"`,
    ``,
    `# ARCHITECTURAL REQUIREMENTS & CONSTRAINTS`,
    `- Implement a complete, modular, and production-grade solution. Zero placeholder code, zero "TODOs", and zero omitted files.`,
    `- Follow clean code architecture with strict separation of concerns, robust error handling, and structured logging.`,
    `- Prioritize maximum runtime performance, resilience against unexpected API or user failures, and self-healing error recovery.`,
    ``,
    `# DISCOVERED SKILLS & RECOMMENDED PATTERNS`,
    `- Active Connectors & Tooling: ${mcpNames}`,
    ...(skillGuidelines.length > 0 
      ? skillGuidelines.map(g => `- Rule: ${g}`)
      : [
          `- Follow official documentation conventions and modern language idioms.`,
          `- Validate all inputs and edge cases thoroughly prior to execution.`
        ]),
    ``,
    `# EXECUTION & VERIFICATION DIRECTIVE`,
    `1. Analyze current workspace and environment constraints.`,
    `2. Scaffold or modify the code directly with complete implementations.`,
    `3. Test and verify runtime behavior to guarantee 0 errors.`,
    `4. Deliver clean, operational output ready for immediate deployment.`
  ].join('\n');

  return masterPrompt;
}

/**
 * End-to-end Autonomous Skill Hunting & Prompt Elevation Pipeline
 */
async function autonomousSkillPipeline(rawUserIntent, domain = 'software') {
  console.log(`[SkillHunter] Hunting skills for intent: "${rawUserIntent}"`);
  
  // 1. Discover skills & MCPs
  const discovery = await discoverBestSkillsAndMCPs(rawUserIntent);
  
  // 2. Compile master engineered prompt
  const enhancedPrompt = enhanceWithMarketStandards(rawUserIntent, domain, discovery);

  return {
    success: true,
    rawIntent: rawUserIntent,
    enhancedPrompt: enhancedPrompt,
    skillsDiscovered: discovery.catalogMatches.map(m => m.name),
    recommendedPackage: discovery.primaryConnector?.package || 'None required',
    summary: `Synthesized with ${discovery.catalogMatches.length} specialized skill sets & modern engineering directives.`
  };
}

module.exports = {
  discoverBestSkillsAndMCPs,
  enhanceWithMarketStandards,
  autonomousSkillPipeline
};
