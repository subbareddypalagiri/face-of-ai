// memory-core.js — Persistent Long-Term Memory Engine for Project AURA
const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, 'memory.json');
const NOTES_FILE = path.join(__dirname, 'notes.json');

const DEFAULT_MEMORY = {
  user: {
    name: 'Buddy',
    preferredLanguage: 'auto',
    role: 'Creator / Developer',
    favoriteVibe: 'High Energy & Productive'
  },
  projects: [
    {
      name: 'Project AURA / Face of AI',
      description: 'Autonomous 3D Embodied AI Desktop Companion with Neural Voice, Vision, and Stunts',
      lastWorked: new Date().toISOString()
    }
  ],
  learnings: [
    'User loves natural Telugu (Mohan) and Indian English voices',
    'User values fast, proactive AI responses with full body gestures',
    'User likes energetic celebration stunts when tasks are completed'
  ],
  sessionStats: {
    totalSessions: 1,
    tasksCompleted: 0,
    totalFocusMinutes: 0,
    lastActive: new Date().toISOString()
  },
  contacts: {}
};

function initMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(DEFAULT_MEMORY, null, 2), 'utf8');
      return DEFAULT_MEMORY;
    }
    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return { ...DEFAULT_MEMORY, ...parsed };
  } catch (err) {
    console.error('[MemoryCore] Error loading memory.json, using defaults:', err);
    return DEFAULT_MEMORY;
  }
}

let activeMemory = initMemory();

function saveMemory() {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(activeMemory, null, 2), 'utf8');
  } catch (err) {
    console.error('[MemoryCore] Failed to persist memory.json:', err);
  }
}

function getMemory() {
  return activeMemory;
}

function updateMemory(updates) {
  try {
    if (!updates || typeof updates !== 'object') return activeMemory;

    if (updates.user) {
      activeMemory.user = { ...activeMemory.user, ...updates.user };
    }
    if (updates.projects && Array.isArray(updates.projects)) {
      activeMemory.projects = updates.projects;
    }
    if (updates.learnings && Array.isArray(updates.learnings)) {
      activeMemory.learnings = Array.from(new Set([...activeMemory.learnings, ...updates.learnings]));
    }
    if (updates.sessionStats) {
      activeMemory.sessionStats = { ...activeMemory.sessionStats, ...updates.sessionStats };
    }

    saveMemory();
    return activeMemory;
  } catch (err) {
    console.error('[MemoryCore] Update error:', err);
    return activeMemory;
  }
}

function recordSessionStart() {
  activeMemory.sessionStats.totalSessions = (activeMemory.sessionStats.totalSessions || 0) + 1;
  activeMemory.sessionStats.lastActive = new Date().toISOString();
  saveMemory();
}

function recordTaskCompletion() {
  activeMemory.sessionStats.tasksCompleted = (activeMemory.sessionStats.tasksCompleted || 0) + 1;
  saveMemory();
  return activeMemory.sessionStats.tasksCompleted;
}

function getNotes() {
  try {
    if (!fs.existsSync(NOTES_FILE)) return [];
    return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
  } catch (e) { return []; }
}

function saveNote(text) {
  try {
    const notes = getNotes();
    const newNote = {
      id: Date.now().toString(),
      text: text.trim(),
      created: new Date().toISOString()
    };
    notes.unshift(newNote);
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes.slice(0, 50), null, 2), 'utf8');
    return { success: true, note: newNote };
  } catch (err) {
    console.error('[MemoryCore] Save note error:', err);
    return { success: false, error: err.message };
  }
}

function recordActivity(task, category, details) {
  if (!activeMemory.timeline) activeMemory.timeline = [];
  const event = {
    timestamp: new Date().toISOString(),
    task: task || 'General Workspace',
    category: category || 'work',
    details: details || ''
  };
  activeMemory.timeline.unshift(event);
  if (activeMemory.timeline.length > 100) {
    activeMemory.timeline = activeMemory.timeline.slice(0, 100);
  }
  saveMemory();
  return event;
}

function getTimeline(limit = 20) {
  if (!activeMemory.timeline) activeMemory.timeline = [];
  return activeMemory.timeline.slice(0, limit);
}

// ── Gamification & Productivity XP System ─────────────────
const TITLES = [
  'Rookie Cadet',
  'Junior Companion',
  'Cyber Specialist',
  'Productivity Ninja',
  'Code Centurion',
  'Terminal Champion',
  'Quantum Architect',
  'AI Archon'
];

function initGamification() {
  if (!activeMemory.gamification) {
    activeMemory.gamification = {
      xp: 0,
      level: 1,
      title: TITLES[0],
      streakDays: 1,
      lastStreakDate: new Date().toISOString().slice(0, 10),
      achievements: ['First Steps']
    };
    saveMemory();
  }
}

function updateDailyStreak() {
  initGamification();
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = activeMemory.gamification.lastStreakDate;
  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastDate === yesterday) {
      activeMemory.gamification.streakDays = (activeMemory.gamification.streakDays || 1) + 1;
    } else {
      activeMemory.gamification.streakDays = 1;
    }
    activeMemory.gamification.lastStreakDate = today;
    saveMemory();
  }
  return activeMemory.gamification.streakDays;
}

function addXP(points, reason = '') {
  initGamification();
  const currentXP = activeMemory.gamification.xp || 0;
  const currentLevel = activeMemory.gamification.level || 1;
  const newXP = currentXP + points;
  
  const newLevel = Math.min(TITLES.length, Math.floor(newXP / 250) + 1);
  const leveledUp = newLevel > currentLevel;
  
  activeMemory.gamification.xp = newXP;
  activeMemory.gamification.level = newLevel;
  activeMemory.gamification.title = TITLES[newLevel - 1] || TITLES[TITLES.length - 1];

  const currentLevelXP = newXP % 250;
  const neededXP = 250;

  if (newLevel >= 5 && !activeMemory.gamification.achievements.includes('Cyber Overlord')) {
    activeMemory.gamification.achievements.push('Cyber Overlord');
  }
  if ((activeMemory.sessionStats?.tasksCompleted || 0) >= 3 && !activeMemory.gamification.achievements.includes('Bug Hunter')) {
    activeMemory.gamification.achievements.push('Bug Hunter');
  }

  saveMemory();

  return {
    xp: newXP,
    level: newLevel,
    title: activeMemory.gamification.title,
    currentLevelXP,
    neededXP,
    pointsAdded: points,
    reason,
    leveledUp,
    achievements: activeMemory.gamification.achievements,
    streakDays: activeMemory.gamification.streakDays
  };
}

function getXPStats() {
  initGamification();
  updateDailyStreak();
  const xp = activeMemory.gamification.xp || 0;
  const level = activeMemory.gamification.level || 1;
  return {
    xp,
    level,
    title: activeMemory.gamification.title || TITLES[0],
    currentLevelXP: xp % 250,
    neededXP: 250,
    streakDays: activeMemory.gamification.streakDays || 1,
    achievements: activeMemory.gamification.achievements || ['First Steps']
  };
}

function saveContact(nameOrObj, phoneArg, notesArg = '') {
  let name = nameOrObj;
  let phone = phoneArg;
  let notes = notesArg;

  if (typeof nameOrObj === 'object' && nameOrObj !== null) {
    name = nameOrObj.name || nameOrObj.contact;
    phone = nameOrObj.phone || nameOrObj.phoneNumber;
    notes = nameOrObj.notes || '';
  }

  if (!name || typeof name !== 'string' || !name.trim()) return { success: false, error: 'Name is required' };
  if (!activeMemory.contacts) activeMemory.contacts = {};
  
  const cleanKey = name.trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
  
  activeMemory.contacts[cleanKey] = {
    name: name.trim(),
    phone: cleanPhone,
    notes: notes || '',
    updatedAt: new Date().toISOString()
  };
  saveMemory();
  return { success: true, contact: activeMemory.contacts[cleanKey] };
}

function getContact(query) {
  if (!query || !query.trim()) return null;
  if (!activeMemory.contacts) activeMemory.contacts = {};
  
  const q = query.trim().toLowerCase();
  // Exact match
  if (activeMemory.contacts[q]) return activeMemory.contacts[q];
  
  // Partial match
  for (const [key, val] of Object.entries(activeMemory.contacts)) {
    if (key.includes(q) || q.includes(key) || (val.name && val.name.toLowerCase().includes(q))) {
      return val;
    }
  }
  return null;
}

function listContacts() {
  if (!activeMemory.contacts) activeMemory.contacts = {};
  return activeMemory.contacts;
}

module.exports = {
  getMemory,
  updateMemory,
  recordSessionStart,
  recordTaskCompletion,
  recordActivity,
  getTimeline,
  getNotes,
  saveNote,
  saveContact,
  getContact,
  listContacts,
  addXP,
  getXPStats,
  updateDailyStreak
};
