// src/main/tools/astraTools.js — SOTA GPT-6 Astra-Level Engines for UNIN
'use strict';

const path = require('path');
const logger = require('../../shared/Logger');

const contextCortex = require('../../../context-cortex');
const jitToolGenesis = require('../../../jit-tool-genesis');
const metaAiRouter = require('../../../meta-ai-router');
const ambientSentinel = require('../../../ambient-sentinel');

function registerAstraTools(registry, dependencies = {}) {
  const {
    goalEngine,
    swarmOrchestrator,
    visualWatchdog,
    blenderLiveBridge
  } = dependencies;

  // 1. Autonomous Goal Engine (Task DAG + Self-Healing)
  registry.register('execute_autonomous_goal', {
    description: 'Deconstructs goals into task DAG, executes steps, and repairs errors until 0 errors remain',
    validator: (params) => {
      if (!params || (!params.goal && !params.goalText && !params.prompt && !params.task)) {
        return { valid: false, error: 'Goal description is required.' };
      }
      return { valid: true };
    },
    timeoutMs: 120000,
    handler: async (params) => {
      const goal = params.goal || params.goalText || params.prompt || params.task || '';
      return await goalEngine.executeGoal(goal, params);
    }
  });

  // 2. Multi-Agent Swarm Orchestrator (Architect, Coder, Reviewer, QA)
  registry.register('execute_swarm_task', {
    description: 'Coordinates 4 specialized sub-agents with adversarial review and consensus certification',
    validator: (params) => {
      if (!params || (!params.task && !params.taskDescription && !params.prompt && !params.goal)) {
        return { valid: false, error: 'Swarm task specification is required.' };
      }
      return { valid: true };
    },
    timeoutMs: 120000,
    handler: async (params) => {
      const task = params.task || params.taskDescription || params.prompt || params.goal || '';
      return await swarmOrchestrator.executeSwarmTask(task, params);
    }
  });

  // 3. Continuous Visual Watchdog & Spatial Grounding Sentinel
  registry.register('start_visual_watchdog', {
    description: 'Activates real-time desktop screen sentinel for error anomaly detection and auto-allow triggers',
    handler: async (params) => {
      const interval = params?.intervalMs || params?.interval || 4000;
      return visualWatchdog.start(interval, params?.options || params || {});
    }
  });

  registry.register('stop_visual_watchdog', {
    description: 'Deactivates the continuous background screen sentinel',
    handler: async () => {
      return visualWatchdog.stop();
    }
  });

  registry.register('inspect_screen_spatial', {
    description: 'Computes bounding coordinates and click target for UI element category',
    handler: async (params) => {
      const category = params?.elementCategory || params?.category || 'full_viewport';
      const res = params?.screenResolution || { width: 1920, height: 1080 };
      return {
        success: true,
        grounding: visualWatchdog.groundSpatialElement(category, res)
      };
    }
  });

  // 4. Blender 3D Procedural Engine
  registry.register('execute_blender_script', {
    description: 'Executes Python bpy scripts directly inside Blender 3D',
    handler: async (params) => {
      const pythonCode = params?.pythonCode || params?.code || params?.script || '';
      return await blenderLiveBridge.executeBlenderScript(pythonCode, params || {});
    }
  });

  registry.register('generate_3d_model', {
    description: 'Generates procedural 3D GLB model in Blender from concept',
    handler: async (params) => {
      const concept = params?.concept || params?.prompt || 'cyber_monolith';
      const userProfile = process.env.USERPROFILE || 'C:\\Users\\subba';
      const outPath = params?.outputPath || path.join(userProfile, 'Downloads', `model_${Date.now()}.glb`);
      return await blenderLiveBridge.generateProcedural3DModel(concept, outPath);
    }
  });

  registry.register('generate_rigged_character', {
    description: 'Generates procedural skeletal armature, skinning weights, and keyframed loop in Blender',
    handler: async (params) => {
      const charName = params?.name || params?.characterName || 'UNIN_Hero';
      const userProfile = process.env.USERPROFILE || 'C:\\Users\\subba';
      const outPath = params?.outputPath || path.join(userProfile, 'Downloads', `${charName}_${Date.now()}.glb`);
      return await blenderLiveBridge.generateRiggedAnimatedCharacter(charName, outPath, params || {});
    }
  });

  // 4b. SOTA Astra-6 Live 3D Copilot Engine (Zero-Latency Delta Sequencer + High-Poly Procedural Geometry)
  const { BlenderAstraEngine } = require('./blenderAstraEngine');
  const astraEngineInstance = new BlenderAstraEngine();

  const handleAstra3D = async (params) => {
    const prompt = params?.prompt || params?.concept || params?.intent || '';
    const opts = Object.assign({}, params?.options || {}, params || {});
    delete opts.prompt;
    delete opts.concept;
    delete opts.intent;
    return await astraEngineInstance.executeAstraIntent(prompt, opts);
  };

  registry.register('execute_astra_3d', {
    description: 'FAANG/Google Astra-6 Live 3D Engine for Blender: creates high-poly procedural scenes (nature/forest, supercars, characters, environments) in real-time viewport with PBR shaders and cinematic lighting',
    handler: handleAstra3D
  });

  registry.register('blender_astra_3d_copilot', {
    description: 'FAANG/Google Astra-6 Live 3D Copilot for Blender: creates, edits, and mutates living 3D scenes in Blender 5.1 with COMPOSITE_DELTA planning',
    handler: handleAstra3D
  });

  // 4c. Live Blender Agent Runtime Tools (Phase 3E)
  registry.register('blender_agent_command', {
    description: 'Enqueues real-time interactive command or prompt to Live Blender Agent Runtime with event streaming',
    handler: async (params) => {
      const prompt = params?.prompt || params?.command || '';
      const priority = params?.priority || undefined;
      return astraEngineInstance.enqueueLiveTask({ prompt, priority, options: params?.options || params || {} });
    }
  });

  registry.register('blender_agent_cancel', {
    description: 'Safely cancels active or pending Blender task at atomic boundary, preserving living world state',
    handler: async (params) => {
      const taskId = params?.taskId || null;
      const reason = params?.reason || 'User cancelled';
      return astraEngineInstance.cancelActiveTask(taskId, reason);
    }
  });

  registry.register('blender_agent_interrupt', {
    description: 'Interrupts active task at atomic boundary and immediately replans with new user prompt',
    handler: async (params) => {
      const newPrompt = params?.prompt || params?.newPrompt || '';
      return await astraEngineInstance.interruptAndReplan(newPrompt, params?.options || {});
    }
  });

  registry.register('blender_agent_status', {
    description: 'Queries status, queue depth, quality state, and measured FPS from Live Blender Agent Runtime',
    handler: async () => {
      return astraEngineInstance.getLiveRuntimeStatus();
    }
  });

  // 5. JIT Tool Genesis Engine (Infinite 10,000,000+ Tasks on the fly)
  registry.register('execute_jit_task', {
    description: 'Synthesizes and executes on-the-fly code (Node.js, Python, PowerShell) for any arbitrary task',
    validator: (params) => {
      if (!params || (!params.code && !params.scriptCode && !params.script)) {
        return { valid: false, error: 'Parameter "code" is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const code = params.code || params.scriptCode || params.script || '';
      const runtime = params.runtime || 'node';
      return await jitToolGenesis.executeJitTask(code, runtime, params.options || {});
    }
  });

  // 6. Active Context & Browser Tab Sniffer
  registry.register('get_active_context', {
    description: 'Sniffs active window, process name, and active browser tab URL/title without copy-pasting',
    handler: async () => {
      return await contextCortex.getActiveContext();
    }
  });

  // 7. High-Speed Media Pipeline & YouTube Downloader
  registry.register('download_media', {
    description: '1-Click high-speed video and audio downloader (YouTube, media streams) into Downloads folder',
    handler: async (params) => {
      let targetUrl = params?.url || params?.mediaUrl || params?.query || '';
      if (!targetUrl) {
        const sniffed = await contextCortex.sniffActiveBrowserUrl();
        if (sniffed.success && sniffed.url) {
          targetUrl = sniffed.url;
        } else if (sniffed.query) {
          targetUrl = sniffed.query;
        }
      }
      return await jitToolGenesis.downloadMedia(targetUrl, params || {});
    }
  });

  // 8. Meta-AI Prompt Router & Frontier Model Mesh
  registry.register('route_meta_ai', {
    description: 'Classifies task to best frontier AI (v0, Claude 3.7, Perplexity, Midjourney) and compiles SOTA prompt',
    validator: (params) => {
      if (!params || (!params.task && !params.intent && !params.prompt)) {
        return { valid: false, error: 'Parameter "task" or "intent" is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const intent = params.task || params.intent || params.prompt || '';
      return await metaAiRouter.routeMetaAiTask(intent, params);
    }
  });

  // 9. Ambient Sentinel & Dev Server Observer
  registry.register('sniff_ambient_events', {
    description: 'Observes local development servers, port status, and system alerts',
    handler: async () => {
      return await ambientSentinel.sniffAmbientEvents();
    }
  });
}

module.exports = { registerAstraTools };
