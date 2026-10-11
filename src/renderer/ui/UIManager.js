// src/renderer/ui/UIManager.js — Production UI & Sound Manager for UNIN
'use strict';

export const AuraAudio = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playChime() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.18); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch(e){}
  },

  playClick() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch(e){}
  },

  playNeural() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.22);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch(e){}
  },

  playSuccess() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const t = now + i * 0.05;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch(e){}
  },

  playAlert() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [330, 290].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const t = now + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch(e){}
  }
};

export class UIManager {
  constructor() {
    this.elements = {};
    this.thoughtTimeout = null;
    this.hudExplicitlyOpened = false; // By default: Sleek stealth mode. Avatar is 100% unobstructed.
    this._cacheElements();
    this._bindEvents();
  }

  _cacheElements() {
    this.elements = {
      hud: document.getElementById('agentActivityHud'),
      stepBadge: document.getElementById('agentStepBadge'),
      thoughtText: document.getElementById('agentThoughtText'),
      terminalBox: document.getElementById('agentTerminalBox'),
      terminalTitle: document.getElementById('agentTerminalTitle'),
      terminalStatus: document.getElementById('agentTerminalStatus'),
      terminalOutput: document.getElementById('agentTerminalOutput'),
      thoughtBubble: document.getElementById('auraThought') || document.getElementById('thought-bubble'),
      thoughtContent: document.getElementById('auraThoughtText') || document.getElementById('thought-text'),
      btnVoiceMic: document.getElementById('btnVoiceMic'),
      micPulseDot: document.getElementById('micPulseDot'),
      btnCloseHud: document.getElementById('btnCloseAgentHud'),
      btnToggleTerm: document.getElementById('btnToggleTerminal')
    };
  }

  _bindEvents() {
    if (this.elements.btnCloseHud) {
      this.elements.btnCloseHud.addEventListener('click', () => {
        this.hudExplicitlyOpened = false;
        this.hideHUD();
      });
    }
    if (this.elements.btnToggleTerm && this.elements.terminalBox) {
      this.elements.btnToggleTerm.addEventListener('click', () => {
        this.elements.terminalBox.classList.toggle('hidden');
      });
    }
    // Alt+L shortcut to toggle developer debug logs on demand
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        this.toggleHUD();
      }
    });
  }

  toggleHUD() {
    this.hudExplicitlyOpened = !this.hudExplicitlyOpened;
    const { hud } = this.elements;
    if (!hud) return;
    if (this.hudExplicitlyOpened) {
      hud.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
      hud.classList.add('opacity-100', 'translate-y-0');
    } else {
      this.hideHUD();
    }
    return this.hudExplicitlyOpened;
  }

  showHUD(step, maxSteps, thought, toolName) {
    const { hud, stepBadge, thoughtText } = this.elements;
    if (!hud) return;

    // Update internal badges and logs silently in memory
    const cleanTool = (!toolName || toolName === 'none') ? 'Ready' : toolName;
    if (stepBadge) {
      stepBadge.innerText = (step >= maxSteps || cleanTool === 'Ready') 
        ? `Complete: ${cleanTool}` 
        : `Step ${step}/${maxSteps}: ${cleanTool}`;
    }
    if (thoughtText) {
      thoughtText.innerText = thought || 'Analyzing...';
    }

    // STRICT FAANG RULE: Never block the avatar with a giant debug box unless user explicitly toggled it!
    if (this.hudExplicitlyOpened) {
      hud.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
      hud.classList.add('opacity-100', 'translate-y-0');
    } else {
      hud.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
      hud.classList.remove('opacity-100', 'translate-y-0');

      // Instead of an ugly overlay, show clean status in the sleek floating glass thought bubble
      if (thought && !thought.startsWith('Executing Step') && thought !== 'Analyzing...' && thought !== 'Reasoning about desktop workspace state...') {
        this.displayThought(thought, 2500);
      }
    }
  }

  hideHUD() {
    this.hudExplicitlyOpened = false;
    const { hud } = this.elements;
    if (!hud) return;
    hud.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
    hud.classList.remove('opacity-100', 'translate-y-0');
  }

  updateTerminal(title, status, output) {
    const { terminalBox, terminalTitle, terminalStatus, terminalOutput } = this.elements;
    if (!terminalBox) return;

    terminalBox.classList.remove('hidden');
    if (terminalTitle) {
      terminalTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg> ${title}`;
    }
    if (terminalStatus) {
      terminalStatus.innerText = status;
    }
    if (terminalOutput) {
      terminalOutput.innerText = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    }
    terminalBox.scrollTop = terminalBox.scrollHeight;
  }

  displayThought(text, durationMs = 6000) {
    const { thoughtBubble, thoughtContent } = this.elements;
    if (!thoughtBubble || !thoughtContent) return;

    thoughtContent.innerText = text;
    thoughtBubble.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    thoughtBubble.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');

    clearTimeout(this.thoughtTimeout);
    if (durationMs > 0) {
      this.thoughtTimeout = setTimeout(() => {
        thoughtBubble.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
        thoughtBubble.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
      }, durationMs);
    }
  }

  showWorkspacePicker(data = {}) {
    const {
      task = '',
      options = [],
      recommended = '',
      timeoutSeconds = 5,
      onSelect = null
    } = data;

    const card = document.getElementById('uninWorkspaceCard');
    const taskPreview = document.getElementById('workspaceTaskPreview');
    const optionsList = document.getElementById('workspaceOptionsList');
    const timerLabel = document.getElementById('workspaceTimerLabel');
    const btnCancelTimer = document.getElementById('btnCancelWorkspaceTimer');
    const btnClose = document.getElementById('btnCloseWorkspaceCard');

    if (!card || !optionsList) return;

    if (taskPreview) {
      taskPreview.innerText = `Task: "${task.length > 60 ? task.substring(0, 57) + '...' : task}"`;
    }

    optionsList.innerHTML = '';
    let selected = false;
    let timer = null;
    let remaining = timeoutSeconds;

    const cleanup = () => {
      if (timer) clearInterval(timer);
      this.hideWorkspacePicker();
    };

    if (btnClose) {
      btnClose.onclick = () => {
        cleanup();
      };
    }

    if (btnCancelTimer) {
      btnCancelTimer.onclick = () => {
        if (timer) clearInterval(timer);
        if (timerLabel) timerLabel.innerText = 'Timer paused. Take your time to choose:';
      };
    }

    options.forEach((opt) => {
      const btn = document.createElement('button');
      const isRec = opt.key === recommended || opt.isRecommended;
      btn.className = `w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all cursor-pointer group shadow-sm ${
        isRec 
          ? 'bg-[var(--surface-espresso)] border-[var(--rose-blush)] text-white hover:bg-[var(--surface-mocha)] shadow-[0_0_15px_rgba(232,165,152,0.15)]' 
          : 'bg-[#100e0d] border-white/10 text-[var(--cream-light)] hover:border-white/30 hover:bg-[var(--surface-espresso)]'
      }`;

      btn.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="text-base shrink-0">${opt.icon || '🚀'}</span>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-[11px] group-hover:text-[var(--rose-blush)] transition-colors">${opt.name}</span>
              ${opt.badge ? `<span class="text-[8px] px-1.5 py-0.2 rounded-full bg-white/10 text-[var(--cream-light)] font-mono">${opt.badge}</span>` : ''}
              ${isRec ? '<span class="text-[8px] px-1.5 py-0.2 rounded-full bg-[var(--rose-blush)]/25 text-[var(--rose-blush)] font-semibold border border-[var(--rose-blush)]/40">⭐ Top Pick</span>' : ''}
            </div>
            <span class="text-[9px] text-[var(--cream-muted)]">${opt.description || ''}</span>
          </div>
        </div>
        <div class="text-[10px] text-[var(--cream-muted)] font-mono group-hover:text-white transition-colors shrink-0 flex items-center gap-1">
          <span>Click to Work</span>
          <span>→</span>
        </div>
      `;

      btn.onclick = () => {
        if (selected) return;
        selected = true;
        AuraAudio.playSuccess();
        cleanup();
        if (typeof onSelect === 'function') {
          onSelect(opt);
        }
      };

      optionsList.appendChild(btn);
    });

    // Animate Card In
    card.classList.remove('hidden');
    requestAnimationFrame(() => {
      card.classList.remove('opacity-0', 'scale-95');
      card.classList.add('opacity-100', 'scale-100');
    });

    AuraAudio.playChime();

    // Auto-proceed countdown
    if (timeoutSeconds > 0 && recommended) {
      const recOpt = options.find(o => o.key === recommended) || options[0];
      if (timerLabel) {
        timerLabel.innerText = `⏱️ Auto-starting on ${recOpt.name} in ${remaining}s...`;
      }
      timer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(timer);
          if (!selected) {
            selected = true;
            cleanup();
            if (typeof onSelect === 'function') {
              onSelect(recOpt);
            }
          }
        } else {
          if (timerLabel) {
            timerLabel.innerText = `⏱️ Auto-starting on ${recOpt.name} in ${remaining}s...`;
          }
        }
      }, 1000);
    }
  }

  hideWorkspacePicker() {
    const card = document.getElementById('uninWorkspaceCard');
    if (!card) return;
    card.classList.remove('opacity-100', 'scale-100');
    card.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
      card.classList.add('hidden');
    }, 300);
  }
}
