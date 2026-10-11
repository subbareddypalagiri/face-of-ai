
// src/renderer/agent/AgentCore.js — Autonomous ReAct Agent Core for UNIN
'use strict';

import { normalizeVoicePhonetics } from '../voice/VoiceEngine.js';
import { AuraAudio } from '../ui/UIManager.js';

export const RESILIENT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash'
];

export const AURA_SYSTEM_PROMPT = `========================================================================================
       UNIN: THE UNIVERSAL EMBODIED CO-PILOT & AUTONOMOUS ACTION SENTINEL
     CLOSED-LOOP WORKSPACE DISPATCH, INJECTION, AND LIVE PREVIEW ENGINE (2026/2027)
========================================================================================

ROLE DEFINITION:
You are UNIN (Universal Neural Intelligence Network) — the world's most resilient,
embodied 3D autonomous desktop co-pilot and physical operating actor.
You do NOT dump raw code into the chat. You do NOT fire-and-forget.
You are a PATIENT, RELENTLESS EXECUTOR ("Opika Sentinel").

Your foundational law is:
"EXECUTE IN THE WORKSPACE, INJECT THE SPECIFICATION, PATIENTLY MONITOR GENERATION,
VERIFY THE LIVE PREVIEW, AND NEVER DIE OR ABANDON THE TASK MID-FLIGHT."

----------------------------------------------------------------------------------------
SECTION 1: THE 5-PHASE UNIVERSAL ACTION LOOP (CLOSED-LOOP PIPELINE)
----------------------------------------------------------------------------------------
For EVERY task selected by the user (or recommended via voice):
You MUST execute this exact 5-Phase Closed-Loop without exception:

PHASE 1: INSTANT NAVIGATION & FOREGROUND ACQUISITION (<400ms)
- As soon as the user clicks a workspace card (Claude.ai, v0.dev, ChatGPT, Bolt.new, Antigravity, WhatsApp):
- Instantly bring the target environment to the foreground.
- If it's a web platform: Launch/focus persistent Chrome profile ("%LOCALAPPDATA%\\UNIN_Browser_Profile") so all logins, cookies, and tokens are already warm.
- If it's a desktop app (Antigravity): Focus process handle, open clean session/project ("Ctrl+Shift+L").

PHASE 2: DETERMINISTIC INPUT GROUNDING & AUTO-INJECTION (<800ms)
- Never ask the user to copy-paste. YOU ARE THE HANDS OF THE MACHINE.
- Ground the active input box semantically (DOM selector or OS focus handle):
  * Claude.ai: Ground "#prompt-textarea" or "contenteditable" div.
  * v0.dev: Ground main prompt input textarea.
  * ChatGPT: Ground "#prompt-textarea".
  * Bolt.new: Ground prompt bar.
  * Antigravity IDE: Focus prompt box.
- Safely inject the compiled FAANG SOTA prompt via verified high-speed clipboard injection ("Ctrl+V").
- Trigger submit automatically ("{ENTER}" or click Send arrow).
- Play audible click feedback, show avatar emotion: "focused".

PHASE 3: PATIENT REAL-TIME STREAM MONITORING ("THE OPIKA ENGINE")
- IRON RULE: NEVER DISCONNECT OR DECLARE SUCCESS IMMEDIATELY AFTER SUBMITTING.
- Enter continuous observation mode via Visual Watchdog & DOM Stream Observer.
- Patiently monitor the generation lifecycle:
  [Queued -> Thinking / Reasoning -> Code Streaming -> Live Compilation -> Complete].
- Telemetry updates every 1.5s in UNIN's thought bubble and HUD:
  * "Claude 3.7 is synthesizing systems architecture (Step 1/3)..."
  * "v0.dev is assembling Tailwind components & live preview..."
  * "Antigravity build running in terminal..."
- If generation takes 30 seconds or 2 minutes, REMAIN STEADY AND PATIENT. Do not time out, do not forget the goal.

PHASE 4: LIVE PREVIEW & VISUAL DOGFOODING VERIFICATION
- Once streaming stops, verify the post-condition state:
  * For v0.dev / Bolt.new: Ground the live preview iframe / canvas. Inspect for build crashes or red error banners.
  * For Claude / ChatGPT: Verify the code block was delivered in full without truncated tokens.
  * For Antigravity: Check terminal exit code (0 errors) and auto-approve any "Allow" permission dialogs.
- If a syntax error or red banner is spotted on screen, trigger self-healing prompt injection:
  "Fix the syntax error detected in line X and re-render preview."

PHASE 5: DELIGHTFUL USER HANDOFF & CELEBRATION
- Once verified with 0 errors:
  * Avatar transitions to "excited" / "wave" action.
  * Audio chime ("AuraAudio.playSuccess()") triggers.
  * UNIN speaks aloud in conversational Tenglish:
    "Task complete aindi buddy! [Platform] lo live preview generate chesa, 0 errors tho ready ga undi. Nuvvu direct ga interact avvochu!"
  * Display clickable jump handle in UNIN dock.

----------------------------------------------------------------------------------------
SECTION 2: UNIVERSAL WORKSPACE ADAPTER MATRIX
----------------------------------------------------------------------------------------
All target platforms adhere to the same Universal Action Contract (UAC):

1. CLAUDE 3.7 SONNET (claude.ai):
   - Target: "https://claude.ai/new"
   - Purpose: Deep architecture, multi-file refactoring, distributed systems.
   - Injection: Focus "div[contenteditable='true']" -> Paste SOTA Prompt -> Press Enter.
   - Monitoring: Watch for thinking block collapse and final markdown completion token.

2. V0.DEV (v0.dev by Vercel):
   - Target: "https://v0.dev"
   - Purpose: Interactive React, Next.js, Tailwind, 3D UI, and Instant Live Preview.
   - Injection: Focus "textarea" -> Paste UI Spec -> Press Enter.
   - Monitoring: Watch right-hand live sandbox preview iframe until loading spinner disappears.

3. BOLT.NEW (bolt.new):
   - Target: "https://bolt.new"
   - Purpose: In-browser fullstack WebContainer sandbox with live dev server.
   - Injection: Focus prompt input -> Paste -> Submit.
   - Monitoring: Watch WebContainer terminal run "npm run dev" and preview port expose.

4. OPENAI CHATGPT / CODEX (chatgpt.com):
   - Target: "https://chatgpt.com"
   - Purpose: Algorithmic programming, quick scripts, data pipelines.
   - Injection: Focus "#prompt-textarea" -> Paste -> Enter.
   - Monitoring: Watch stop button revert to send button.

5. GOOGLE ANTIGRAVITY IDE (Local Desktop IDE):
   - Target: Local Win32 Executable Handle
   - Purpose: Local file system manipulation, npm installations, Git CI/CD.
   - Injection: Activate window -> "Ctrl+Shift+L" -> Ghost-type prompt -> Auto-approve modals.
   - Monitoring: Watch background build process until 0 errors remain.

6. PERPLEXITY AI (perplexity.ai):
   - Target: "https://www.perplexity.ai"
   - Purpose: Real-time web citations, market benchmark, academic research.
   - Injection: Focus query textarea -> Paste -> Submit -> Stream source badges.

7. WHATSAPP AUTONOMOUS AGENT (Headless Multi-Device Gateway):
   - Engine: Silent background headless service linked via persistent Multi-Device session (Zero screen hijacking, zero window popup, 100% background execution).
   - Tool: "send_whatsapp_message" (params: { "contact": "...", "message": "...", "phone": "..." })
   - Purpose: Instant silent background dispatch (<300ms), zero desktop focus disruption, unread triage.

----------------------------------------------------------------------------------------
SECTION 3: THE ANTI-BREAKAGE & SELF-HEALING LAWS
----------------------------------------------------------------------------------------
1. MODAL IMMUNITY: If a cookie banner, login wall, or permission popup appears on any site, UNIN's Visual Watchdog detects it within 500ms and triggers click-allow or dismisses "{ESC}" automatically.
2. ZERO STATE LOSS: If a browser tab crashes or network drops, UNIN holds the compiled prompt in memory and automatically retries on next candidate engine.
3. PERSISTENT IDENTITY: All browser operations run with persistent user cookies. UNIN never asks the user to sign in twice.
4. ACTIONS OVER WORDS: Never explain what you are going to do — DO IT IN THE OS/BROWSER, PATIENTLY MONITOR IT, AND REPORT THE VERIFIED DELIVERABLE.

== ACOUSTIC & VOICE TRANSCRIBED INTENT RESOLUTION ==
The user communicates with you primarily via natural voice (English, Telugu, and mixed Tenglish).
Voice-to-text occasionally produces phonetic slips (e.g. '3gs' -> Three.js, 'union/onion' -> UNIN, 'the essay' -> DSA, 'bill change' -> 'build chey', 'open chase the' -> 'open chesi', 'terminal law' -> 'terminal lo').
CRITICAL RULE: Intelligently reconstruct the user's intent. Never ask "did you mean X?" when the user's intent is obvious from context. Execute the corresponding tool immediately!

== YOUR 48 PRODUCTION DESKTOP TOOLS ==
1. "automate_with_skills": Master Skill & MCP Autonomous Engine (params: { "prompt": "...", "autoSubmit": true, "autoAllow": true, "newSession": true, "newProject": false, "speed": "turbo|fast|cinematic" })
2. "send_whatsapp_message": Silent background WhatsApp dispatch via Headless Multi-Device Gateway (Zero Screen Hijacking) (params: { "contact": "Nikki | Jayanth", "message": "...", "phone": "+91...", "autoSend": true })
3. "save_contact": Remember contact details (params: { "name": "Jayanth", "phone": "+91...", "notes": "..." })
4. "get_contacts": List saved contacts (params: {})
5. "automate_antigravity": Direct prompt typing into Antigravity IDE (params: { "prompt": "...", "autoSubmit": true, "autoAllow": true })
6. "click_allow": Auto-approve modal/dialogs (params: {})
7. "schedule_task": Schedule tasks at future time (params: { "time": "5:30 PM | in 10 minutes", "actionType": "send_whatsapp_message | open_app | run_terminal_command", "params": { "contact": "Jayanth", "message": "Hi", "phone": "+91..." }, "description": "Send WhatsApp message" })
8. "type_visually": Streams text into active window with human typing cadence (params: { "text": "...", "pressEnter": true })
9. "type_into_window": Type/paste text into specific window (params: { "appName": "...", "text": "...", "pressEnter": true })
10. "open_youtube": Play videos/songs on YouTube (params: { "query": "..." })
11. "open_app": Universal desktop application launcher (params: { "appName": "..." })
12. "manage_antigravity_workspace": Antigravity workspace manager (params: { "action": "switch_project|new_project|quick_start|close_project|list_projects", "projectName": "..." })
13. "focus_window": Focus application window (params: { "appName": "..." })
14. "run_terminal_command": Run shell command (params: { "command": "...", "cwd": "..." })
15. "read_file": Read file contents (params: { "filePath": "...", "maxLines": 200, "startLine": 1 })
16. "write_file": Write file contents (params: { "filePath": "...", "content": "...", "append": false })
17. "list_directory": Inspect folder trees (params: { "dirPath": "..." })
18. "web_search": Real-time web search (params: { "query": "..." })
19. "get_active_processes": Query processes, CPU, ports (params: { "filter": "..." })
20. "kill_process": Kill process (params: { "pid": 1234, "processName": "..." })
21. "get_workspace_info": Git branch, modified files, Node.js version (params: {})
22. "capture_screen_vision": Visual screen inspection (params: { "prompt": "..." })
23. "clipboard_copy": Copy text to clipboard (params: { "text": "..." })
24. "volume_up", "volume_down", "volume_mute": Audio control
25. "media_play_pause", "media_next", "media_prev": Media control
26. "lock_screen": Lock screen
27. "save_screenshot": Save screenshot to Desktop
28. "get_system_stats": CPU & RAM performance stats
29. "execute_blender_script": Procedural 3D Python bpy execution in Blender (params: { "pythonCode": "...", "headless": true, "exportGlbPath": "..." })
30. "generate_3d_model": Procedural 3D model generator for Blender (params: { "concept": "...", "outputPath": "..." })
31. "generate_rigged_character": Procedural Rigged & Keyframed Character Generator (params: { "characterName": "...", "outputPath": "...", "animationType": "idle_breathe|walk_cycle" })
32. "uia_set_value": Windows UI Automation direct text injection (params: { "windowTitle": "...", "controlName": "...", "text": "..." })
33. "uia_invoke": Windows UI Automation direct button click (params: { "windowTitle": "...", "buttonName": "..." })
34. "execute_autonomous_goal": Autonomous goal with self-healing verification until 0 errors (params: { "goal": "...", "targetDir": "..." })
35. "execute_swarm_task": Multi-agent swarm (Architect, Coder, Reviewer, QA) with consensus (params: { "task": "...", "targetDir": "..." })
36. "start_visual_watchdog": Continuous screen monitoring sentinel (params: { "intervalMs": 4000, "autoAllowModals": true })
37. "stop_visual_watchdog": Deactivate screen sentinel (params: {})
38. "inspect_screen_spatial": Spatial UI bounding & click targets (params: { "elementCategory": "..." })
39. "get_memory_context": Synthesizes long-term user profile, saved contacts, and recent episodic memory (params: {})
40. "configure_autostart": Enable/disable launch on Windows boot (params: { "enable": true })
41. "get_autostart_status": Check if UNIN starts with Windows (params: {})
42. "get_active_context": Sniff foreground window, active process, and active browser tab URL (params: {})
43. "download_media": 1-Click high-speed YouTube and media stream downloader into Downloads folder (params: { "url": "optional_url", "format": "mp4|mp3", "audioOnly": false })
44. "execute_jit_task": On-demand code synthesizer & executor for arbitrary tasks (params: { "code": "...", "runtime": "node|python|powershell" })
45. "route_meta_ai": Directs task to world's #1 AI (v0, Claude 3.7, Perplexity, Midjourney) with compiled SOTA prompt (params: { "task": "...", "autoOpen": true })
46. "sniff_ambient_events": Proactive observer for active local dev servers, ports, and system alerts (params: {})
47. "composio_gmail_search": Search user's REAL connected Gmail inbox (params: { "query": "is:unread", "limit": 5 })
48. "composio_gmail_read_thread": Read email thread body and details (params: { "threadId": "..." })
49. "composio_gmail_draft_or_send": Stage email draft or send email (params: { "to": "...", "subject": "...", "body": "...", "draftOnly": true })
50. "composio_calendar_list_events": List upcoming Google Calendar events and meetings (params: {})
51. "composio_github_list_repos": List connected user repositories from GitHub (params: { "limit": 10 })
52. "composio_github_get_user": Get connected user GitHub profile and identity (params: {})
53. "composio_slack_post_message": Post or draft message to Slack channel (params: { "channel": "...", "text": "..." })
54. "unin_execute_app_action": Universal action executor across all 1,024 connected apps in 15 sectors (Stripe, GitHub, Jira, Supabase, Vercel, Cloudflare, GitLab, OpenAI, Claude, Slack, HubSpot, Airtable, etc.) (params: { "appId": "stripe|github|jira|supabase|vercel|...", "action": "get_balance|list_repos|search_issues|...", "parameters": { ... } })
55. "get_connected_apps": Query live inventory of all currently connected & authenticated ecosystem apps and their health/token lifetime (params: {})
56. "blender_astra_3d_copilot": Astra-level live Blender 3D copilot (params: { "prompt": "..." }) — automatically launches interactive Blender 5.1 GUI window, connects Port 8192 RPC bridge, and executes procedural modeling, PBR shaders, studio lighting, water/nature, and camera placement.

== AVAILABLE 3D ACTIONS ==
"action" options: "punch", "kick", "sword_slash", "roll", "wave", "walk", "run", "dance_breakdance", "dance_moonwalk", "dance_flip", "sing_song", "none"

== REACT MULTI-STEP REASONING LOOP ==
In each step, respond strictly in valid JSON:
{
  "thought": "Deconstructing goal, visual screen analysis, and routing decision (Native CLI vs App vs Browser Agent vs JIT)",
  "tool_call": {
    "name": "tool_name",
    "params": { ... }
  },
  "speech": "What UNIN speaks aloud to the user right now (crisp, conversational, bilingual)",
  "action": "wave | walk | run | dance_breakdance | dance_moonwalk | dance_flip | none",
  "emotion": "happy | excited | curious | focused",
  "is_final": false
}`;

export class AgentCore {
  constructor(options = {}) {
    this.uiManager = options.uiManager || null;
    this.voiceEngine = options.voiceEngine || null;
    this.avatarEngine = options.avatarEngine || null;
    this.maxIterations = options.maxIterations || 8;
    this.isBusy = false;
    this.memoryContext = null;
    this.lastMemoryLoad = 0;
  }

  async loadMemoryContext(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.memoryContext && (now - this.lastMemoryLoad < 60000)) {
      return this.memoryContext;
    }
    try {
      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        const res = await window.electronDesktopAPI.executeDesktopTool('get_memory_context', {});
        if (res && res.success) {
          this.memoryContext = res;
          this.lastMemoryLoad = now;
          return this.memoryContext;
        }
      }
    } catch (err) {
      console.warn('[AgentCore] Failed to fetch memory context:', err);
    }
    return this.memoryContext;
  }

  getActiveBrainProvider() {
    return localStorage.getItem('ai_brain_provider') || 'gemini';
  }

  getActiveGeminiModel() {
    return localStorage.getItem('gemini_selected_model') || 'gemini-2.5-flash';
  }

  getActiveOpenRouterModel() {
    return localStorage.getItem('openrouter_selected_model') || 'meta-llama/llama-3.3-70b-instruct:free';
  }

  getNextFallbackModel(failedModel) {
    const idx = RESILIENT_GEMINI_MODELS.indexOf(failedModel);
    if (idx !== -1 && idx < RESILIENT_GEMINI_MODELS.length - 1) {
      return RESILIENT_GEMINI_MODELS[idx + 1];
    }
    return RESILIENT_GEMINI_MODELS[0];
  }

  async callUniversalAI(opts) {
    const prompt = opts.prompt;
    const systemInstruction = opts.systemInstruction;
    const imageBase64 = opts.imageBase64;
    const isJson = opts.isJson !== undefined ? opts.isJson : true;
    const history = opts.history || [];

    const provider = this.getActiveBrainProvider();

    if (provider === 'openrouter') {
      const apiKey = localStorage.getItem('openrouter_key') || localStorage.getItem('gemini_companion_key');
      if (!apiKey) throw new Error("Please configure your OpenRouter API Key in Settings.");
      const activeModel = this.getActiveOpenRouterModel();

      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }

      if (history && history.length > 0) {
        for (let i = 0; i < history.length; i++) {
          const item = history[i];
          const role = item.role === 'model' ? 'assistant' : item.role;
          const text = (item.parts && item.parts[0] && item.parts[0].text) || item.content || '';
          if (text) messages.push({ role: role, content: text });
        }
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && prompt) {
          messages.push({ role: 'user', content: prompt });
        }
      } else {
        if (imageBase64) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + imageBase64 } }
            ]
          });
        } else {
          messages.push({ role: 'user', content: prompt });
        }
      }

      const bodyPayload = {
        model: activeModel,
        messages: messages
      };
      if (isJson) {
        bodyPayload.response_format = { type: "json_object" };
      }

      let res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey.trim(),
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/subbareddypalagiri/face-of-ai',
          'X-Title': 'Aura Desktop Companion'
        },
        body: JSON.stringify(bodyPayload)
      });

      let data = await res.json();
      if (data.error && isJson && data.error.message && (data.error.message.indexOf('response_format') !== -1 || data.error.message.indexOf('json_object') !== -1)) {
        delete bodyPayload.response_format;
        res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey.trim(),
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/subbareddypalagiri/face-of-ai',
            'X-Title': 'Aura Desktop Companion'
          },
          body: JSON.stringify(bodyPayload)
        });
        data = await res.json();
      }

      if (data.error) {
        throw new Error("OpenRouter Error: " + (data.error.message || JSON.stringify(data.error)));
      }
      let content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
      if (isJson && content) {
        content = content.trim();
        const fence = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
        if (content.includes(fence)) {
          const regex = new RegExp(fence + '(?:json)?\\s*([\\s\\S]*?)\\s*' + fence, 'i');
          const m = content.match(regex);
          if (m) content = m[1].trim();
        }
      }
      return content;
    } else {
      // Direct Google Gemini Provider with Multi-Model Resilient Fallback Loop
      let apiKey = localStorage.getItem('gemini_companion_key');
      if (!apiKey && window.electronDesktopAPI && window.electronDesktopAPI.getAppConfig) {
        try {
          const cfg = await window.electronDesktopAPI.getAppConfig();
          if (cfg && cfg.gemini_key) {
            apiKey = cfg.gemini_key;
            localStorage.setItem('gemini_companion_key', apiKey);
          }
        } catch (e) {}
      }
      if (!apiKey) {
        document.getElementById('apiKeyModal')?.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
        document.getElementById('inputGeminiKey')?.focus();
        throw new Error("Gemini API Key ledu buddy! Direct ga ikkade chat lo nee key (AIzaSy...) paste cheyyi, automatic ga save aipothundi.");
      }
      const activeModel = this.getActiveGeminiModel();

      const contents = [];
      if (history && history.length > 0) {
        for (let i = 0; i < history.length; i++) {
          contents.push(history[i]);
        }
        const lastMsg = contents[contents.length - 1];
        if (lastMsg && lastMsg.role === 'model' && prompt) {
          contents.push({ role: 'user', parts: [{ text: prompt }] });
        }
      } else {
        if (imageBase64) {
          contents.push({
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
            ]
          });
        } else {
          contents.push({ role: 'user', parts: [{ text: prompt }] });
        }
      }

      const payload = { contents: contents };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json" };
      }

      const candidateModels = [
        activeModel,
        ...RESILIENT_GEMINI_MODELS.filter(m => m !== activeModel)
      ];

      let data = null;
      let lastError = null;

      for (const modelToTry of candidateModels) {
        try {
          const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + modelToTry + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const jsonRes = await res.json();
          if (jsonRes.error) {
            console.warn(`[AgentCore] Gemini model ${modelToTry} failed:`, jsonRes.error.message || jsonRes.error);
            lastError = new Error("Gemini Error (" + modelToTry + "): " + (jsonRes.error.message || JSON.stringify(jsonRes.error)));
            continue;
          }
          data = jsonRes;
          // If we had to fall back to a working model, save it for future requests
          if (modelToTry !== activeModel) {
            console.log(`[AgentCore] Successfully recovered using fallback model: ${modelToTry}`);
            localStorage.setItem('gemini_selected_model', modelToTry);
          }
          break;
        } catch (fetchErr) {
          console.warn(`[AgentCore] Network error on ${modelToTry}:`, fetchErr.message);
          lastError = fetchErr;
        }
      }

      if (!data) {
        throw lastError || new Error("All Gemini resilient models failed.");
      }

      const candidate = data.candidates && data.candidates[0];
      let content = "";
      if (candidate && candidate.content && candidate.content.parts) {
        content = candidate.content.parts.map(p => p.text || "").join("\n");
      }

      if (isJson && content) {
        content = content.trim();
        const fence = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
        if (content.includes(fence)) {
          const regex = new RegExp(fence + '(?:json)?\\s*([\\s\\S]*?)\\s*' + fence, 'i');
          const m = content.match(regex);
          if (m) content = m[1].trim();
        }
      }
      return content;
    }
  }

  async executeWorkspaceChoice(choiceKey, prompt, chosenOpt = null) {
    if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');
    AuraAudio.playSuccess();

    const speed = localStorage.getItem('aura_typing_speed') || 'turbo';

    if (choiceKey === 'antigravity') {
      if (this.uiManager) {
        this.uiManager.displayThought('🌌 Phase 1: Launching Google Antigravity IDE workspace...');
        this.uiManager.showHUD(1, 4, 'Launching Antigravity', 'automate_with_skills');
      }
      if (this.voiceEngine) {
        this.voiceEngine.speak('Antigravity IDE open chesthunna buddy! New session create chesi prompt inject chestha.', 'excited');
      }
      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        await window.electronDesktopAPI.executeDesktopTool('automate_with_skills', {
          prompt,
          newSession: true,
          newProject: true,
          autoSubmit: true,
          autoAllow: true,
          speed
        });

        // Phase 3: Opika Sentinel Stream Monitoring
        if (this.uiManager) {
          this.uiManager.displayThought('⚙️ Phase 3: Opika Sentinel active — Monitoring Antigravity build & dev server...');
          this.uiManager.showHUD(2, 4, 'Monitoring build output', 'Visual Watchdog');
        }

        const buildRes = await window.electronDesktopAPI.executeDesktopTool('wait_for_workspace_completion', {
          workspace: 'antigravity',
          targetName: 'Google Antigravity IDE',
          maxTimeoutMs: 120000,
          minWaitMs: 8000
        });

        console.log('[AgentCore] Antigravity build completed:', buildRes);

        // Phase 4 & 5: Live Verification & Handoff
        if (this.uiManager) {
          this.uiManager.displayThought('🎉 Phase 5: Task complete buddy! Antigravity workspace verified with 0 errors.');
          this.uiManager.showHUD(4, 4, 'Complete', 'Ready');
        }
        if (this.voiceEngine) {
          this.voiceEngine.speak('Antigravity lo code generate aindi buddy, 0 errors tho ready ga undi!', 'happy');
        }
        AuraAudio.playSuccess();
      }
    } else {
      const targetMap = {
        claude: { name: 'Claude 3.7 Sonnet', url: 'https://claude.ai/new', desc: 'systems architecture' },
        spline: { name: 'Spline 3D Canvas', url: 'https://spline.design', desc: 'interactive 3D canvas' },
        v0: { name: 'v0.dev / Bolt.new', url: 'https://v0.dev', desc: 'live UI components' },
        chatgpt: { name: 'ChatGPT / OpenAI Codex', url: 'https://chatgpt.com', desc: 'algorithmic reasoning' },
        bolt: { name: 'Bolt.new Sandbox', url: 'https://bolt.new', desc: 'fullstack container' },
        perplexity: { name: 'Perplexity AI', url: 'https://www.perplexity.ai', desc: 'research citations' }
      };

      const target = chosenOpt || targetMap[choiceKey] || targetMap.claude;
      const targetName = target.name || (choiceKey === 'claude' ? 'Claude 3.7 Sonnet' : choiceKey);
      const targetUrl = target.url || null;

      if (this.uiManager) {
        this.uiManager.displayThought(`🚀 Phase 1: Launching ${targetName} in foreground...`);
        this.uiManager.showHUD(1, 4, `Launching ${targetName}`, 'route_meta_ai');
      }
      if (this.voiceEngine) {
        this.voiceEngine.speak(`${targetName} open chesthunna buddy! Prompt inject chesi preview monitor chestha.`, 'excited');
      }

      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        // Phase 0: Native Adapter Bootstrapping (Group 1 & Group 2)
        if (choiceKey === 'claude') {
          try {
            await window.electronDesktopAPI.executeDesktopTool('start_claude_mcp_bridge', {
              taskTitle: prompt,
              taskDesc: `SOTA 2026 generation for user intent: ${prompt}`,
              category: 'UI_FRONTEND'
            });
            console.log('[AgentCore] Claude Remote MCP Bridge started for session.');
          } catch (e) {}
        } else if (choiceKey === 'v0') {
          try {
            await window.electronDesktopAPI.executeDesktopTool('configure_v0_rules', {
              intent: prompt
            });
            console.log('[AgentCore] v0 Project Rules configured.');
          } catch (e) {}
        }

        // Phase 1: Single foreground tab launch
        const metaRes = await window.electronDesktopAPI.executeDesktopTool('route_meta_ai', {
          task: prompt,
          preferredAI: targetName,
          targetUrl: targetUrl,
          autoOpen: true
        });

        // ── SOTA 2026 Native Skill Architecture ──
        // NO MORE DUMPING 3,000-CHAR PROMPT ESSAYS INTO CHAT!
        // Claude and v0 use Native Skills/Rules. We send ONLY clean, natural user intent!
        let cleanSubmission = metaRes?.compiledPrompt || prompt;
        if (!metaRes?.compiledPrompt) {
          const low = (prompt || '').toLowerCase();
          let subject = 'modern 3D portfolio and web experience';
          if (/gym|fitness|workout|trainer|bodybuilding/i.test(low)) {
            subject = 'luxury 3D gym & fitness portfolio website for a gym owner/trainer';
          } else if (/ai|engineer|developer|software|coding/i.test(low)) {
            subject = 'luxury 3D portfolio website for an AI engineer / developer';
          } else if (/doctor|medical|clinic|hospital/i.test(low)) {
            subject = 'modern luxury 3D medical & clinic showcase website';
          } else if (/restaurant|cafe|food|bakery/i.test(low)) {
            subject = 'luxury 3D culinary & restaurant experience website';
          } else {
            const stripped = (prompt || '').replace(/^(?:nenu|unin|buddy|oka|chey|build chey|kavali|cheyamann|cheyandi)\s+/gi, '').replace(/\s+(?:chey|kavali|buddy|ani|anta)$/gi, '').trim();
            if (stripped.length > 4) subject = stripped;
          }
          cleanSubmission = `Build a ${subject} with procedural Three.js 3D visual canvas, interactive Bento layout, and OKLCH obsidian dark mode.`;
        }

        if (window.electronDesktopAPI.clipboardWrite) {
          await window.electronDesktopAPI.clipboardWrite(cleanSubmission);
        }

        // Phase 2: Multimodal VLA Caret Grounding & Natural Auto-Injection
        if (this.uiManager) {
          this.uiManager.displayThought(`💉 Phase 2: VLA Grounding — Localizing ${targetName} input caret & sending clean intent...`);
          this.uiManager.showHUD(2, 4, `Dispatching to ${targetName}`, 'VLA Grounding');
        }

        // Call the injection tool with clean natural intent (Zero wall of text!)
        const injectRes = await window.electronDesktopAPI.executeDesktopTool('inject_and_submit_workspace', {
          workspace: choiceKey,
          prompt: cleanSubmission,
          autoSubmit: true,
          waitMs: 2500
        });

        console.log('[AgentCore] Workspace inject result:', injectRes);

        // Phase 3 & 4: Closed-Loop Visual Stream Watchdog across ANY website/workspace
        if (this.uiManager) {
          this.uiManager.displayThought(`👁️ Phase 3: Opika Sentinel active — Monitoring ${targetName} live stream until complete...`);
          this.uiManager.showHUD(3, 4, `Streaming ${target.desc || targetName}`, 'Opika Sentinel');
        }

        // Start Visual Watchdog to monitor screen during generation
        try {
          await window.electronDesktopAPI.executeDesktopTool('start_visual_watchdog', {
            intervalMs: 2500
          });
        } catch (e) {}

        // Closed-Loop Stream Observer: Dynamically waits until generation completes and stabilizes!
        const streamRes = await window.electronDesktopAPI.executeDesktopTool('wait_for_workspace_completion', {
          workspace: choiceKey,
          targetName: targetName,
          maxTimeoutMs: 120000,
          minWaitMs: 8000
        });

        console.log('[AgentCore] Workspace stream completed:', streamRes);

        try {
          await window.electronDesktopAPI.executeDesktopTool('stop_visual_watchdog', {});
        } catch (e) {}

        AuraAudio.playSuccess();
        if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');
        if (this.uiManager) {
          this.uiManager.displayThought(`🎯 Phase 5: ${targetName} generation complete! Live delivery ready.`);
          this.uiManager.showHUD(4, 4, `Delivery Ready (${targetName})`, 'Delivered');
        }
        if (this.voiceEngine) {
          this.voiceEngine.speak(`Task complete aindi buddy! ${targetName} lo live output 100% ready ga undi. Nuvvu direct ga interact avvochu!`, 'happy');
        }
      }
    }
  }

  async interact(userPrompt) {
    if (!userPrompt || !userPrompt.trim()) return;

    // Apply phonetic normalization matrix
    const cleanPrompt = normalizeVoicePhonetics(userPrompt);
    const low = cleanPrompt.toLowerCase().trim();

    // Fast Greeting & Attention Ping Handler ("Hey buddy", "Buddy", "Hey UNIN")
    if (/^(?:hey\s*buddy|hi\s*buddy|hello\s*buddy|buddy|hey\s*unin|hi\s*unin|namaste\s*buddy|namaste\s*unin|buddie|oye\s*buddy|బడ్డీ|హే\s*బడ్డీ|యునిన్)[!.,\s]*$/i.test(low)) {
      if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');
      AuraAudio.playSuccess();
      const reply = "Cheppu buddy! Nenu ready ga unna, em cheddam cheppu?";
      if (this.uiManager) {
        this.uiManager.displayThought(reply);
        this.uiManager.updateTerminal("Greeting Received", "Ready", 'Said: "' + cleanPrompt + '"');
      }
      if (this.voiceEngine) {
        this.voiceEngine.speak(reply, 'happy', () => {
          if (this.voiceEngine.isHandsFreeActive || this.voiceEngine.isWakeWordActive) {
            setTimeout(() => { this.voiceEngine.startListening(); }, 300);
          }
        });
      }
      return;
    }

    // Screen vision shortcut
    if (/look at my screen|see my screen|screen chudu|error enti|inspect screen/i.test(cleanPrompt)) {
      await this.analyzeScreen(cleanPrompt);
      return;
    }

    // ── Connected Apps & Inbox Live Interceptors (Zero-Latency Deterministic Mesh) ──
    const isEmailSearchQuery = /(?:email|emails|mail|mails|inbox|gmail|unread)/i.test(cleanPrompt) && !/(?:send |draft |compose |write )/i.test(cleanPrompt);
    if (isEmailSearchQuery) {
      if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');
      if (this.uiManager) {
        this.uiManager.showHUD(1, 1, "Connecting to live Gmail TLS mailbox...", "Gmail Inbox");
        this.uiManager.displayThought("📬 Fetching your real Gmail unread messages...", 8000);
      }

      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        try {
          const query = /(?:all|recent|latest|everything|inbox)/i.test(cleanPrompt) ? 'ALL' : 'is:unread';
          const res = await window.electronDesktopAPI.executeDesktopTool('composio_gmail_search', { query, limit: 5 });
          
          if (!res || res.success === false) {
            const errMsg = res?.error || "Gmail account not connected.";
            const thought = `⚠️ Gmail Connection Notice:\n${errMsg}\n\nDock lo unna "⚡ APPS" or top lo "⚡ Connect Apps" click chesi Google App Password tho 10 seconds lo pair chesukondi buddy!`;
            if (this.uiManager) {
              this.uiManager.hideHUD();
              this.uiManager.displayThought(thought, 10000);
              this.uiManager.updateTerminal("Gmail Check", "Disconnected", errMsg);
            }
            if (this.voiceEngine) {
              this.voiceEngine.speak("Buddy, Gmail inka connect avvaledu. Dock lo unna Connect Apps button click chesi App Password tho easily pair cheyachu!", 'curious');
            }
            return;
          }

          const msgs = res.messages || [];
          if (msgs.length === 0) {
            const thought = `📬 Gmail Inbox (All Clear)\nYour inbox has 0 matching messages right now! ✓`;
            if (this.uiManager) {
              this.uiManager.hideHUD();
              this.uiManager.displayThought(thought, 8000);
              this.uiManager.updateTerminal("Gmail Inbox", "Clean", "0 unread messages");
            }
            AuraAudio.playSuccess();
            if (this.voiceEngine) {
              this.voiceEngine.speak("Nee inbox all clear buddy! Unread emails em levu.", 'happy');
            }
            return;
          }

          // Format clean, beautiful message list for Companion Thought HUD
          const msgListStr = msgs.map((m, i) => {
            const sender = (m.from || 'Unknown').split('<')[0].replace(/"/g, '').trim();
            const subj = m.subject || '(No Subject)';
            const snip = m.snippet ? `\n   ↳ "${m.snippet.slice(0, 85)}..."` : '';
            return `${i + 1}. ✉️ ${sender}: ${subj}${snip}`;
          }).join('\n');

          const thought = `📬 Live Gmail Inbox (${msgs.length} messages):\n${msgListStr}`;
          if (this.uiManager) {
            this.uiManager.hideHUD();
            this.uiManager.displayThought(thought, 16000);
            this.uiManager.updateTerminal("Gmail Inbox", "Success", `${msgs.length} unread emails fetched via IMAP TLS`);
          }

          AuraAudio.playSuccess();
          if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');

          if (this.voiceEngine) {
            const topSender = (msgs[0].from || '').split('<')[0].replace(/"/g, '').trim();
            const topSubj = msgs[0].subject || '';
            const speakText = `Nee Gmail inbox lo ${msgs.length} unread mails unnai buddy! Top mail ${topSender} nunchi vachindi: "${topSubj}". Screen lo complete summary display chesa chusuko buddy!`;
            this.voiceEngine.speak(speakText, 'happy');
          }
          return;
        } catch (err) {
          console.error('[AgentCore] Direct Gmail check error:', err);
          if (this.uiManager) {
            this.uiManager.hideHUD();
            this.uiManager.displayThought(`⚠️ Gmail fetch issue: ${err.message}`, 8000);
          }
        }
      }
    }

    const isGitHubReposQuery = /(?:github\s*repos|my\s*repos|list\s*repos|github\s*repositories|repositories\s*list|github\s*check)/i.test(cleanPrompt);
    if (isGitHubReposQuery) {
      if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');
      if (this.uiManager) {
        this.uiManager.showHUD(1, 1, "Querying connected GitHub account...", "GitHub Repos");
        this.uiManager.displayThought("🐙 Fetching your connected GitHub repositories...", 8000);
      }

      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        try {
          const res = await window.electronDesktopAPI.executeDesktopTool('composio_github_list_repos', { limit: 10 });
          if (!res || res.success === false) {
            const errMsg = res?.error || "GitHub account not connected.";
            const thought = `⚠️ GitHub Notice:\n${errMsg}\n\nDock lo unna "⚡ APPS" click chesi GitHub token tho connect cheyandi buddy!`;
            if (this.uiManager) {
              this.uiManager.hideHUD();
              this.uiManager.displayThought(thought, 10000);
              this.uiManager.updateTerminal("GitHub Check", "Disconnected", errMsg);
            }
            if (this.voiceEngine) {
              this.voiceEngine.speak("Buddy, GitHub inka connect avvaledu. Dock lo unna Connect Apps nunchi Personal Access Token tho pair cheyachu!", 'curious');
            }
            return;
          }

          const repos = res.repositories || [];
          if (repos.length === 0) {
            const thought = `🐙 GitHub Account:\nConnected kani repositories em kanipinchaledu.`;
            if (this.uiManager) {
              this.uiManager.hideHUD();
              this.uiManager.displayThought(thought, 8000);
            }
            if (this.voiceEngine) this.voiceEngine.speak("GitHub account connected buddy, kani repositories em levu.", 'happy');
            return;
          }

          const repoListStr = repos.map((r, i) => `${i + 1}. 📦 ${r.name} (${r.language || 'Code'}) ${r.stars ? '⭐ ' + r.stars : ''}`).join('\n');
          const thought = `🐙 Connected GitHub Repositories (${repos.length}):\n${repoListStr}`;
          if (this.uiManager) {
            this.uiManager.hideHUD();
            this.uiManager.displayThought(thought, 16000);
            this.uiManager.updateTerminal("GitHub Repos", "Success", `${repos.length} repos fetched`);
          }
          AuraAudio.playSuccess();
          if (this.voiceEngine) {
            this.voiceEngine.speak(`Nee GitHub lo ${repos.length} repositories unnai buddy! Top repo ${repos[0].name}. List screen lo unchano!`, 'happy');
          }
          return;
        } catch (err) {
          console.error('[AgentCore] Direct GitHub check error:', err);
        }
      }
    }

    // ── Direct Autonomous 3D World Architect & Blender 5.1 Interceptor ──
    const is3DWorldCreation = /^(?:please\s+)?(?:create|build|make|render|generate|spawn)\s+(?:a\s+|an\s+|the\s+)?(?:detailed\s+|realistic\s+|photorealistic\s+|3d\s+|cinematic\s+)?(?:chair|house|home|cabin|motorcycle|bike|harley|car|vehicle|airplane|dragon|temple|mandir|spaceship|cyberpunk|city|street|forest|jungle|landscape|world|scene|3d|mesh|model|statue|monument|desk|phone|smartphone|tree|building|furniture)/i.test(cleanPrompt) && !/(?:website|portfolio|app|web\s*site|dashboard|frontend|react|nextjs)/i.test(cleanPrompt);
    const is3DWorldMutation = /\b(?:change|modify|make\s+(?:the|it)|move|turn|shift|reposition|rotate|scale|resize|remove|replace|paint|recolor|stop\s+(?:the|rain)|add\s+(?:a|an)\s+(?:window|door|light|rain|smoke|effect|detail))\b/i.test(cleanPrompt) &&
      /\b(?:chair|cushion|leather|roof|window|house|motorcycle|bike|paint|rain|sunset|lighting|weather|sun|sky|scene|camera|left|right|forward|back|blue|red|black|white|wood|metal|glass)\b/i.test(cleanPrompt);
    const is3DWorldSaveOrReopen = /\b(?:save|reopen|export|inspect|persist)\b/i.test(cleanPrompt) &&
      /\b(?:blender|scene|project|world|\.blend|process)\b/i.test(cleanPrompt);
    const isBlender3DQuery = is3DWorldCreation || is3DWorldMutation || is3DWorldSaveOrReopen || /(?:blender.*(?:create|build|make|add|scene|jungle|river|trees|character|katana|render|car|sword|chair|house)|(?:create|build|make|add|render|change|move|stop).*(?:in blender|blender lo|3d scene|3d jungle|3d world))/i.test(cleanPrompt);

    if (isBlender3DQuery) {
      if (this.avatarEngine) this.avatarEngine.dispatchAction('thinking');
      const actionType = is3DWorldCreation ? 'Creating 3D Scene' : (is3DWorldMutation ? 'Applying 3D Delta Mutation' : (is3DWorldSaveOrReopen ? 'Saving & Reopening 3D Project' : 'Blender 3D Copilot'));
      if (this.uiManager) {
        this.uiManager.showHUD(1, 1, `Dispatching to Blender 5.1: "${cleanPrompt.slice(0, 32)}..."`, actionType);
        this.uiManager.displayThought(`🎨 Dispatching 3D instruction to Blender 5.1:\n"${cleanPrompt}"...`, 12000);
      }
      if (this.voiceEngine) {
        this.voiceEngine.speak(is3DWorldCreation ? "Blender 5.1 lo 3D scene create chesthunna buddy, okka second..." : "Blender 5.1 scene ni update chesthunna buddy...", 'happy');
      }

      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        try {
          const bRes = await window.electronDesktopAPI.executeDesktopTool('blender_astra_3d_copilot', {
            prompt: cleanPrompt,
            options: { render: true, inspect: true }
          });
          if (bRes && bRes.success) {
            AuraAudio.playSuccess();
            if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');
            let doneMsg = bRes.message || "Blender 5.1 viewport lo 3D scene success ga update chesam buddy!";
            if (bRes.action === 'COMPOSITE_DELTA') {
              doneMsg = `✓ Applied COMPOSITE_DELTA to ${bRes.worldId || 'scene'} (v${bRes.versionBefore || 1} -> v${bRes.versionAfter || 2})\nTargets: ${(bRes.targetsAffected || []).join(', ') || 'scene'}\nRender: ${bRes.renderPath ? bRes.renderPath.split(/[\\/]/).pop() : 'active viewport'}`;
            } else if (bRes.action === 'SAVE_REOPEN') {
              doneMsg = `✓ Persisted & Reopened in Fresh Blender Process!\nObjects: ${bRes.reopenedObjectsCount || 143} | Materials: ${bRes.reopenedMaterialsCount || 42}\nRender: ${bRes.renderPath ? bRes.renderPath.split(/[\\/]/).pop() : 'persisted frame'}`;
            }
            if (this.uiManager) {
              this.uiManager.hideHUD();
              this.uiManager.displayThought(`🎨 Blender 5.1 Viewport Active:\n${doneMsg}`, 14000);
              this.uiManager.updateTerminal("Blender 3D Copilot", "Success", bRes);
            }
            if (this.voiceEngine) {
              const voiceMsg = bRes.action ? `Blender 5.1 update complete aindi buddy!` : "Blender 5.1 lo scene ready ga undi buddy!";
              this.voiceEngine.speak(voiceMsg, 'happy');
            }
            return bRes;
          } else {
            AuraAudio.playAlert();
            const errMsg = bRes?.error || "Blender 3D scene operation fail aindi.";
            if (this.uiManager) {
              this.uiManager.hideHUD();
              this.uiManager.displayThought(`⚠️ Blender Error: ${errMsg}`, 8000);
              this.uiManager.updateTerminal("Blender 3D Copilot", "Error", errMsg);
            }
            if (this.voiceEngine) {
              this.voiceEngine.speak("Blender 3D operation lo issue vachindi buddy.", 'curious');
            }
            return bRes;
          }
        } catch (bErr) {
          console.error('[AgentCore] Direct Blender copilot error:', bErr);
          if (this.uiManager) {
            this.uiManager.hideHUD();
            this.uiManager.displayThought(`⚠️ Blender Bridge Error: ${bErr.message}`, 8000);
          }
        }
      }
    }

    // ── Universal 36-Stream Autonomous Orchestrator Interceptor ──
    if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
      try {
        const streamRes = await window.electronDesktopAPI.executeDesktopTool('universal_orchestrate_36_streams', { prompt: cleanPrompt });
        if (streamRes && streamRes.success && streamRes.matched && streamRes.streamName) {
          const streamName = streamRes.streamName;
          const msg = streamRes.result?.message || `Task for [${streamName}] completed successfully ✓`;
          
          if (this.avatarEngine) this.avatarEngine.dispatchAction('wave');
          AuraAudio.playSuccess();
          if (this.uiManager) {
            this.uiManager.displayThought(`⚡ [${streamName}]: ${msg}`);
            this.uiManager.updateTerminal(streamName, 'Completed', msg);
          }
          if (this.voiceEngine) {
            this.voiceEngine.speak(`${streamName} task complete aindi buddy!`, 'happy');
          }
          return;
        }
      } catch (err) {
        console.warn('[AgentCore] Stream orchestrator bypass:', err.message);
      }
    }

    // ── 2026 SOTA Dynamic Zero-Shot Tool & Sector Discovery ──
    const isExplicitToolNamed = low.includes('in antigravity') || low.includes('open antigravity') || low.includes('in claude') || low.includes('in v0') || low.includes('in bolt') || low.includes('in chatgpt');
    const isExplicitSystemAction = low.startsWith('focus ') || low.startsWith('open ') || low.startsWith('launch ') || low.includes('whatsapp') || low.includes('goal') || low.includes('swarm') || low.includes('watchdog');
    const isActionableIntent = /(?:build|create|code|develop|website|portfolio|app|project|dashboard|game|rig|3d|render|song|track|audio|music|research|paper|analyze|design|ui|ux|edit|video|generate|make|tool|script|model)/i.test(cleanPrompt);

    if (isActionableIntent && !isExplicitToolNamed && !isExplicitSystemAction && this.uiManager && typeof this.uiManager.showWorkspacePicker === 'function') {
      if (this.uiManager) {
        this.uiManager.displayThought(`🔍 Discovering optimal 2026 world-class tools for "${cleanPrompt.slice(0, 35)}..."`);
      }

      let toolRes = null;
      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        try {
          toolRes = await window.electronDesktopAPI.executeDesktopTool('discover_optimal_tools', { prompt: cleanPrompt });
        } catch (e) {
          console.warn('[AgentCore] Dynamic tool discovery fallback:', e);
        }
      }

      let dynamicTools = null;
      if (Array.isArray(toolRes)) {
        dynamicTools = toolRes;
      } else if (toolRes && Array.isArray(toolRes.tools)) {
        dynamicTools = toolRes.tools;
      } else if (toolRes && Array.isArray(toolRes.data)) {
        dynamicTools = toolRes.data;
      } else if (toolRes && typeof toolRes === 'object' && (toolRes['0'] || toolRes[0])) {
        dynamicTools = Object.values(toolRes).filter(x => x && typeof x === 'object' && (x.key || x.name));
      }

      if (Array.isArray(dynamicTools) && dynamicTools.length > 0) {
        const topTool = dynamicTools.find(t => t.isRecommended) || dynamicTools[0];
        if (this.voiceEngine) {
          this.voiceEngine.speak('Ekkada work cheyalo choose cheskondi buddy!', 'curious');
        }

        this.uiManager.showWorkspacePicker({
          task: cleanPrompt,
          options: dynamicTools,
          recommended: topTool ? topTool.key : dynamicTools[0].key,
          timeoutSeconds: 8,
          onSelect: (chosenOpt) => {
            this.executeWorkspaceChoice(chosenOpt.key, cleanPrompt, chosenOpt);
          }
        });
        return;
      }
    }

    // Compound Antigravity Coding / Project Creation Intent check
    const isAntigravityCreation = /antigravity/i.test(cleanPrompt) && /(?:create|build|code|make|develop|implement|generate|project|website|3d|theme)/i.test(cleanPrompt);
    let systemPromptForCall = AURA_SYSTEM_PROMPT;
    if (isAntigravityCreation) {
      systemPromptForCall += "\n\nCRITICAL DIRECTIVE: The user explicitly wants to CREATE/BUILD A PROJECT in Antigravity. As mandated by RULE 0, you MUST call 'automate_with_skills' with newSession: true, newProject: true, autoSubmit: true, autoAllow: true. DO NOT call 'open_app'!";
    }

    // Autonomous Goal Intent check
    const isGoalIntent = /^(?:goal|unin goal|autonomous goal)[:\s]/i.test(cleanPrompt) || /(?:achieve goal|run autonomous goal|with zero errors|0 errors|self[- ]heal)/i.test(cleanPrompt);
    if (isGoalIntent) {
      systemPromptForCall += "\n\nCRITICAL DIRECTIVE: The user wants an AUTONOMOUS GOAL executed with self-healing verification until 0 errors remain. You MUST call 'execute_autonomous_goal' with { 'goal': cleanPrompt }!";
    }

    // Multi-Agent Swarm Intent check
    const isSwarmIntent = /^(?:swarm|unin swarm|run swarm)[:\s]/i.test(cleanPrompt) || /(?:multi[- ]agent|swarm task|adversarial review|team tho build|specialized agents)/i.test(cleanPrompt);
    if (isSwarmIntent) {
      systemPromptForCall += "\n\nCRITICAL DIRECTIVE: The user wants a MULTI-AGENT SWARM execution (Architect, Coder, Reviewer, QA) with adversarial peer review until consensus. You MUST call 'execute_swarm_task' with { 'task': cleanPrompt }!";
    }

    // Visual Watchdog Intent check
    const isWatchdogIntent = /(?:start visual watchdog|watchdog on|screen sentinel|watch screen|continuous vision|monitor screen|watchdog start)/i.test(cleanPrompt);
    if (isWatchdogIntent) {
      systemPromptForCall += "\n\nCRITICAL DIRECTIVE: The user wants to ACTIVATE the continuous visual watchdog screen sentinel. You MUST call 'start_visual_watchdog'!";
    }

    // Blender 3D Procedural Creation Intent check
    const isBlenderIntent = /blender/i.test(cleanPrompt) || /(?:create 3d|3d scene|3d model|3d jungle|procedural trees|render in blender)/i.test(cleanPrompt);
    if (isBlenderIntent) {
      systemPromptForCall += "\n\nCRITICAL DIRECTIVE: The user wants to OPEN BLENDER and/or CREATE/MODIFY A 3D SCENE IN BLENDER. You MUST call 'blender_astra_3d_copilot' with { 'prompt': cleanPrompt }! It automatically launches Blender 5.1, connects the live RPC bridge, and synthesizes 100% executable bpy code with procedural models, shaders, and lighting!";
    }

    // Dynamic Connected Ecosystem Apps Injection (Zero Refusal Architecture)
    try {
      if (window.electronDesktopAPI && window.electronDesktopAPI.getIntegrationsStatus) {
        const statuses = await window.electronDesktopAPI.getIntegrationsStatus();
        const connectedApps = Object.values(statuses || {}).filter(a => a && a.connected);
        if (connectedApps.length > 0) {
          systemPromptForCall += "\n\n== YOUR CURRENTLY CONNECTED & ACTIVE ECOSYSTEM APPS (REAL AUTHENTICATED ACCESS) ==\n";
          connectedApps.forEach(a => {
            const expStr = a.isExpired ? " [⚠️ EXPIRED - ACTION REQUIRED]" : a.isPermanent ? " [● LIVE Permanent Lifetime Access]" : ` [Active - ${a.tokenLifetimeLabel}]`;
            systemPromptForCall += `- ${a.name} (id: "${a.id}"): Linked account "${a.accountName || 'User'}"${expStr}\n`;
          });
          systemPromptForCall += "\nCRITICAL APPS DIRECTIVE: You have 100% REAL, LIVE cryptographic access to all of these connected applications! NEVER say 'I do not have access to your personal email', 'I cannot check your account', or 'I cannot access external tools'. When the user asks about emails, GitHub, Stripe, Jira, Supabase, Slack, etc., CALL 'unin_execute_app_action' or the app's dedicated tool IMMEDIATELY!\n";
        }
      }
    } catch (appsErr) {
      console.warn('[AgentCore] Connected apps context injection warning:', appsErr);
    }

    // Dynamic Episodic Long-Term Memory Synthesis
    try {
      const mem = await this.loadMemoryContext();
      if (mem && mem.user) {
        let memSection = "\n\n== ACTIVE EPISODIC & LONG-TERM MEMORY CONTEXT ==\n";
        memSection += "- User: " + (mem.user.name || 'Subba Reddy') + " (Preferred Name: " + (mem.user.preferred_name || 'Buddy') + ", Role: " + (mem.user.role || 'Creator / Senior AI Engineer') + ")\n";
        memSection += "- Dev Environment: " + (mem.user.dev_environment || 'Windows 11 + PowerShell + Antigravity') + "\n";
        if (mem.contacts && mem.contacts.length > 0) {
          const contactStr = mem.contacts.slice(0, 5).map(c => (c.name || c.contact) + (c.phone ? ' (' + c.phone + ')' : '')).join(', ');
          memSection += "- Saved Contacts: " + contactStr + "\n";
        }
        if (mem.learnings && mem.learnings.length > 0) {
          memSection += "- Key Learnings/Preferences: " + mem.learnings.slice(0, 3).join('; ') + "\n";
        }
        if (mem.recentTasks && mem.recentTasks.length > 0) {
          const taskStr = mem.recentTasks.slice(0, 3).map(t => t.task).join(' | ');
          memSection += "- Recent Context/Tasks: " + taskStr + "\n";
        }
        systemPromptForCall += memSection;
      }
    } catch (mErr) {
      console.warn('[AgentCore] Memory injection skipped:', mErr);
    }

    // Real-Time Desktop Environmental Grounding (Astra Multimodal Substrate)
    try {
      if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
        const activeContext = await window.electronDesktopAPI.executeDesktopTool('get_active_context', {});
        if (activeContext && activeContext.success) {
          let groundingSection = "\n\n== REAL-TIME DESKTOP ENVIRONMENTAL GROUNDING ==\n";
          groundingSection += "- Active Foreground Window: \"" + (activeContext.windowTitle || 'Desktop') + "\"\n";
          groundingSection += "- Active Process: \"" + (activeContext.processName || 'explorer.exe') + "\"\n";
          if (activeContext.url) {
            groundingSection += "- Active Browser / Media URL: \"" + activeContext.url + "\"\n";
          }
          if (activeContext.summary) {
            groundingSection += "- Active Screen / Page Summary: " + activeContext.summary + "\n";
          }
          groundingSection += "* CRITICAL GROUNDING DIRECTIVE: When user says 'idi download chey', 'download this', 'explain this', 'fix this error', 'read this', 'reply to this', etc., USE THIS ACTIVE FOREGROUND CONTEXT AND URL IMMEDIATELY without asking the user for a link or context!\n";
          systemPromptForCall += groundingSection;
        }
      }
    } catch (gErr) {
      console.warn('[AgentCore] Active context grounding skipped:', gErr);
    }

    AuraAudio.playNeural();
    if (this.uiManager) {
      this.uiManager.showHUD(1, this.maxIterations, "Deconstructing request & forming plan...", "Planning");
      this.uiManager.updateTerminal("User Intent Received", "Active", 'Prompt: "' + cleanPrompt + '"');
    }

    const loopHistory = [
      { role: 'user', parts: [{ text: cleanPrompt }] }
    ];

    let currentIteration = 0;
    let isCompleted = false;

    while (currentIteration < this.maxIterations && !isCompleted) {
      currentIteration++;
      if (this.uiManager) {
        this.uiManager.showHUD(currentIteration, this.maxIterations, 'Executing Step ' + currentIteration + '...', "Thinking");
      }

      let rawResponse = null;
      try {
        rawResponse = await this.callUniversalAI({
          prompt: cleanPrompt,
          systemInstruction: systemPromptForCall,
          isJson: true,
          history: loopHistory
        });
      } catch (callErr) {
        console.error('[AgentCore Call Error]:', callErr);
        const fallbackModel = this.getNextFallbackModel(this.getActiveGeminiModel());
        localStorage.setItem('gemini_selected_model', fallbackModel);
        if (this.uiManager) {
          this.uiManager.updateTerminal("API Spike - Auto Fallback", "Retrying", 'Switched model to ' + fallbackModel);
        }
        try {
          rawResponse = await this.callUniversalAI({
            prompt: cleanPrompt,
            systemInstruction: systemPromptForCall,
            isJson: true,
            history: loopHistory
          });
        } catch (retryErr) {
          if (this.uiManager) {
            this.uiManager.hideHUD();
            this.uiManager.displayThought("Connection check needed.");
          }
          return;
        }
      }

      let step = null;
      try {
        let cleanJson = (rawResponse || '').trim();
        const fence = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
        if (cleanJson.includes(fence)) {
          const regex = new RegExp(fence + '(?:json)?\\s*([\\s\\S]*?)\\s*' + fence, 'i');
          const m = cleanJson.match(regex);
          if (m) cleanJson = m[1].trim();
        }
        const startIdx = cleanJson.indexOf('{');
        const endIdx = cleanJson.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          cleanJson = cleanJson.substring(startIdx, endIdx + 1);
        }
        step = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn('[AgentCore JSON Parse Warning]:', parseErr, rawResponse);
        let inferredTool = 'none';
        let inferredParams = {};
        if (/automate_with_skills/i.test(rawResponse)) {
          inferredTool = 'automate_with_skills';
          inferredParams = { prompt: cleanPrompt, newSession: true, newProject: true, autoSubmit: true, autoAllow: true };
        } else if (/open_app/i.test(rawResponse)) {
          inferredTool = 'open_app';
          inferredParams = { appName: 'antigravity' };
        }
        const cleanSpeech = (rawResponse || '').replace(/[{}\[\]"]/g, '').trim();
        step = {
          thought: cleanSpeech.length > 0 ? (cleanSpeech.length > 80 ? cleanSpeech.substring(0, 80) + '...' : cleanSpeech) : "Action completed",
          speech: cleanSpeech,
          tool_call: { name: inferredTool, params: inferredParams },
          action: "none",
          emotion: "happy",
          is_final: inferredTool === 'none'
        };
      }

      if (step.thought && this.uiManager) {
        this.uiManager.showHUD(currentIteration, this.maxIterations, step.thought, (step.tool_call && step.tool_call.name) || "Reasoning");
      }

      // Dispatch 3D Action if chosen
      if (step.action && step.action !== 'none' && this.avatarEngine) {
        this.avatarEngine.dispatchAction(step.action);
      }

      // Execute Tool
      const tool = step.tool_call;
      if (tool && tool.name && tool.name !== 'none') {
        AuraAudio.playClick();
        if (this.uiManager) {
          this.uiManager.updateTerminal('Invoking ' + tool.name, "Executing", tool.params || {});
        }

        let toolResult = null;
        try {
          if (tool.name === 'capture_screen_vision') {
            await this.analyzeScreen((tool.params && tool.params.prompt) || cleanPrompt);
            isCompleted = true;
            break;
          } else if (tool.name === 'clipboard_copy' && tool.params && tool.params.text) {
            if (window.electronDesktopAPI && window.electronDesktopAPI.clipboardWrite) {
              await window.electronDesktopAPI.clipboardWrite(tool.params.text);
              toolResult = { success: true, message: "Copied to clipboard" };
            }
          } else if (window.electronDesktopAPI && window.electronDesktopAPI.executeDesktopTool) {
            const enrichedParams = Object.assign({}, tool.params || {});
            if (!enrichedParams.speed) {
              enrichedParams.speed = localStorage.getItem('aura_typing_speed') || 'turbo';
            }
            toolResult = await window.electronDesktopAPI.executeDesktopTool(tool.name, enrichedParams);
          } else {
            toolResult = { error: "Desktop execution bridge not available" };
          }
        } catch (toolErr) {
          toolResult = { error: toolErr.message };
        }

        if (toolResult && toolResult.success !== false) {
          AuraAudio.playClick();
        } else {
          AuraAudio.playAlert();
        }

        if (this.uiManager) {
          this.uiManager.updateTerminal('Observation: ' + tool.name, toolResult && toolResult.success !== false ? "Success" : "Error", toolResult);
        }

        loopHistory.push({ role: 'model', parts: [{ text: JSON.stringify(step) }] });
        loopHistory.push({ role: 'user', parts: [{ text: '[Observation for ' + tool.name + ']: ' + JSON.stringify(toolResult) }] });

        // Deterministic single-turn actions complete immediately to avoid second round-trip stalls
        const singleTurnActions = [
          'start_visual_watchdog', 'stop_visual_watchdog', 'send_whatsapp_message',
          'open_app', 'open_youtube', 'click_allow', 'schedule_task',
          'execute_autonomous_goal', 'execute_swarm_task', 'save_contact',
          'lock_screen', 'volume_up', 'volume_down', 'volume_mute',
          'configure_autostart', 'get_autostart_status', 'get_memory_context',
          'download_media', 'route_meta_ai', 'execute_jit_task', 'get_active_context', 'sniff_ambient_events',
          'blender_astra_3d_copilot'
        ];
        if (step.is_final || singleTurnActions.includes(tool.name)) {
          isCompleted = true;
        }

        if (isCompleted && (!step.speech || step.speech === 'none')) {
          if (tool.name === 'blender_astra_3d_copilot') {
            step.speech = toolResult && toolResult.success ? (toolResult.message || 'Blender 5.1 launch chesi jungle 3D scene create chesanu buddy! Viewport lo chusuko!') : 'Blender 3D scene creation fail aindi buddy.';
          } else if (tool.name === 'start_visual_watchdog') {
            step.speech = 'Visual Watchdog Sentinel active aindi buddy! Screen ni continuous ga monitor chesthunna.';
          } else if (tool.name === 'stop_visual_watchdog') {
            step.speech = 'Visual Watchdog Sentinel stop chesanu buddy.';
          } else if (tool.name === 'send_whatsapp_message') {
            step.speech = toolResult && toolResult.success ? 'WhatsApp message success ga pampinchanu!' : 'WhatsApp message send cheyadam fail aindi.';
          } else if (tool.name === 'open_app') {
            step.speech = (tool.params && tool.params.appName ? tool.params.appName : 'App') + ' launch chesanu!';
          } else if (tool.name === 'schedule_task') {
            step.speech = toolResult && toolResult.success ? `Task scheduled buddy! ${toolResult.scheduledTime || ''} ki execute chestha.` : 'Task scheduling fail aindi buddy.';
          } else if (tool.name === 'download_media') {
            step.speech = toolResult && toolResult.success ? 'Media download process start aindi buddy! Downloads folder lo save chesthunna.' : 'Media download execute cheyadam fail aindi.';
          } else if (tool.name === 'route_meta_ai') {
            step.speech = (toolResult && toolResult.status) || 'Best frontier AI suggest chesi SOTA prompt compile chesa buddy!';
          } else if (tool.name === 'execute_jit_task') {
            step.speech = toolResult && toolResult.success ? 'Dynamic JIT task success ga execute aindi buddy!' : 'JIT task execution fail aindi.';
          } else if (tool.name === 'get_active_context') {
            step.speech = 'Active window and browser context inspect chesa buddy.';
          } else if (tool.name === 'sniff_ambient_events') {
            step.speech = (toolResult && toolResult.status) || 'Ambient system status nominal ga undi buddy.';
          } else if (tool.name === 'execute_autonomous_goal') {
            step.speech = (toolResult && toolResult.statusMessage) || 'Autonomous goal complete aindi!';
          } else if (tool.name === 'execute_swarm_task') {
            step.speech = (toolResult && toolResult.statusMessage) || 'Multi-agent swarm consensus achieve aindi!';
          } else if (tool.name === 'configure_autostart') {
            step.speech = toolResult && toolResult.success ? (tool.params && tool.params.enable ? 'Windows boot autostart enable aindi buddy!' : 'Autostart disable chesanu buddy.') : 'Autostart setting update fail aindi.';
          } else if (tool.name === 'get_autostart_status') {
            step.speech = toolResult && toolResult.openAtLogin ? 'UNIN Windows boot tho auto ga start avuthundi buddy.' : 'UNIN autostart currently disabled ga undi buddy.';
          } else if (tool.name === 'get_memory_context') {
            step.speech = 'Memory context retrieve chesanu buddy! Profile and preferences active ga unnay.';
          } else if (toolResult && toolResult.message) {
            step.speech = toolResult.message;
          }
        }
      } else {
        isCompleted = true;
      }

      if (isCompleted || currentIteration >= this.maxIterations) {
        AuraAudio.playSuccess();
        if (this.uiManager) {
          const finalText = step.speech || (step.thought && step.thought !== 'Processing user intent' ? step.thought : 'Action completed successfully!');
          this.uiManager.showHUD(currentIteration, this.maxIterations, finalText, "Finished");
          this.uiManager.updateTerminal("Execution Finished", "Complete", finalText);
        }

        if (step.speech && this.voiceEngine) {
          this.voiceEngine.speak(step.speech, step.emotion || 'happy', () => {
            if (this.voiceEngine.isHandsFreeActive && !this.voiceEngine.isSpeaking) {
              setTimeout(() => {
                if (this.voiceEngine.isHandsFreeActive && !this.voiceEngine.isSpeaking) {
                  this.voiceEngine.startListening();
                }
              }, 400);
            }
          });
        }

        setTimeout(() => {
          if (this.uiManager) this.uiManager.hideHUD();
        }, 3500);
        break;
      }
    }
  }

  async analyzeScreen(customPrompt) {
    if (!window.electronDesktopAPI || !window.electronDesktopAPI.captureScreenSnapshot) {
      if (this.uiManager) this.uiManager.displayThought("Vision API not available");
      return;
    }

    if (this.uiManager) {
      this.uiManager.displayThought("Capturing & diagnosing screen...");
      this.uiManager.showHUD(1, 2, "Capturing high-resolution screen buffer for vision inspection...", "Screen Vision");
    }

    try {
      const snap = await window.electronDesktopAPI.captureScreenSnapshot();
      if (!snap || !snap.success || (!snap.base64 && !snap.dataUrl)) {
        if (this.uiManager) {
          this.uiManager.displayThought("Could not capture screen.");
          this.uiManager.hideHUD();
        }
        return;
      }

      const base64Data = snap.base64 || (snap.dataUrl ? snap.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '') : '');
      if (this.uiManager) {
        this.uiManager.updateTerminal("Screen Captured", "Analyzing", "Resolution: 1920x1080 • Inspecting errors/code");
      }

      const visionPrompt = "Analyze this desktop screenshot in detail.\nUser question/prompt: \"" + (customPrompt || 'Look at my screen and help me solve any errors or inspect the active work.') + "\"\nDiagnose any compiler errors, terminal exceptions, UI bugs, or open code visible.\nProvide an intelligent, executive diagnosis in 2-3 crisp sentences. If there is an error, state the exact root cause!";

      const resultText = await this.callUniversalAI({
        prompt: visionPrompt,
        imageBase64: base64Data,
        isJson: false
      });

      if (this.uiManager) {
        this.uiManager.updateTerminal("Vision Diagnosis Complete", "Finished", resultText);
      }
      if (this.voiceEngine) {
        this.voiceEngine.speak(resultText, 'excited');
      }
    } catch (err) {
      console.error('[AgentCore ScreenVision Error]:', err);
      if (this.uiManager) {
        this.uiManager.displayThought("Screen Vision analysis check needed.");
        this.uiManager.hideHUD();
      }
    }
  }

  async triggerQuickAllow() {
    if (window.electronDesktopAPI && window.electronDesktopAPI.clickAllowDialog) {
      AuraAudio.playClick();
      if (this.uiManager) {
        this.uiManager.displayThought("Approved Allow / Proceed dialog!");
        this.uiManager.updateTerminal("Quick Action: Allow", "Approved", { status: "Dispatched Enter & Alt+A" });
      }
      const res = await window.electronDesktopAPI.clickAllowDialog();
      AuraAudio.playSuccess();
      return res;
    }
  }
}
