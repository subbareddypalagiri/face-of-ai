// src/renderer/avatar/AvatarEngine.js — Universal 3D Avatar Engine for UNIN via TalkingHead.js
'use strict';

import * as THREE from 'three';
import { TalkingHead } from 'talkinghead';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

// Master Retarget Profiles for Standard & Repo Avatars:
// Calibrates A-Pose to strict T-Pose & locks hip height to 1.037m ground baseline.
const AVATAR_RETARGET_PROFILES = {
  'brunette-t.glb': {
    scaleToHipsLevel: 1.037
  },
  'brunette.glb': {
    LeftArm: { rz: -0.62 },
    RightArm: { rz: 0.62 },
    scaleToHipsLevel: 1.037
  },
  'avaturn.glb': {
    LeftArm: { rz: -0.65 },
    RightArm: { rz: 0.65 },
    scaleToHipsLevel: 1.037
  },
  'avatarsdk.glb': {
    LeftArm: { rz: -0.60 },
    RightArm: { rz: 0.60 },
    scaleToHipsLevel: 1.037
  },
  'vroid.glb': {
    LeftArm: { rz: -0.55 },
    RightArm: { rz: 0.55 },
    scaleToHipsLevel: 1.037
  },
  'mpfb.glb': {
    LeftArm: { rz: -0.60 },
    RightArm: { rz: 0.60 },
    scaleToHipsLevel: 1.037
  }
};

export class AvatarEngine {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('canvas-container');
    this.head = null;
    this.currentAvatar = null;
    this.currentAvatarUrl = localStorage.getItem('aura_selected_avatar') || 'brunette.glb';
    this.currentVRM = null;
    this.isVRMMode = false;

    // VRM Fallback renderer & scene (active only when .vrm file is explicitly selected)
    this.vrmScene = null;
    this.vrmCamera = null;
    this.vrmRenderer = null;
    this.vrmClock = new THREE.Clock();
    this.vrmMixer = null;
    this.vrmHeadBone = null;
    this.vrmWaving = false;
    this.vrmWaveTime = 0;
    this.vrmBlinkTimer = 0;
    this.vrmBlinkInterval = 3.5;
    this.vrmIsBlinking = false;
    this.vrmBlinkProgress = 0;

    // Scale & Offset state
    this.targetAvatarScale = Math.min(2.2, Math.max(0.4, parseFloat(localStorage.getItem('aura_avatar_scale') || '1.0')));
    this.avatarYOffset = parseFloat(localStorage.getItem('aura_avatar_y_offset') || '0');
    this.baseModelScale = 1.0;
    this.currentMood = 'neutral';
    this.isSpeaking = false;

    // Mouse tracking state
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.currentMouseX = 0;
    this.currentMouseY = 0;

    // Wardrobe hooks (for Hero avatar)
    this.heroSuitMesh = null;
    this.heroTieMesh = null;
    this.heroShirtMesh = null;

    // Comprehensive Animation Registry for Full-Body Locomotion & Breakdance Packs
    this.animationMap = {
      // Core Life & Gestures
      'wave': { gesture: 'handup', duration: 3.5 },
      'hi': { gesture: 'handup', duration: 3.5 },
      'hello': { gesture: 'handup', duration: 3.5 },
      'thinking': { emoji: '🤔', mood: 'neutral' },
      'happy': { emoji: '😊', mood: 'happy' },
      'smile': { emoji: '🙂', mood: 'happy' },
      'laugh': { emoji: '😂', mood: 'happy' },
      'cool': { emoji: '😎', mood: 'neutral' },
      'love': { emoji: '🥰', mood: 'love' },
      'sad': { emoji: '🥺', mood: 'sad' },
      'angry': { emoji: '😠', mood: 'angry' },
      'sleep': { emoji: '😴', mood: 'sleep' },
      'shrug': { gesture: 'shrug', duration: 3 },
      'ok': { gesture: 'ok', duration: 2 },
      'thumbsup': { gesture: 'thumbup', duration: 2.5 },
      'thumbup': { gesture: 'thumbup', duration: 2.5 },
      'thumbdown': { gesture: 'thumbdown', duration: 2.5 },
      'index': { gesture: 'index', duration: 2.5 },

      // Breakdance Pack (Full Mixamo Retargeting)
      'breakdance': { file: 'Breakdance Pack/breakdance 1990.fbx', duration: 8 },
      'dance': { file: 'Breakdance Pack/breakdance 1990.fbx', duration: 8 },
      'breakdance1990': { file: 'Breakdance Pack/breakdance 1990.fbx', duration: 8 },
      'footwork': { file: 'Breakdance Pack/breakdance footwork 1.fbx', duration: 6 },
      'freeze': { file: 'Breakdance Pack/breakdance footwork to freeze.fbx', duration: 6 },
      'ending': { file: 'Breakdance Pack/breakdance ending 1.fbx', duration: 5 },
      'flair': { file: 'Breakdance Pack/flair.fbx', duration: 6 },
      'swipes': { file: 'Breakdance Pack/breakdance swipes.fbx', duration: 6 },
      'uprock': { file: 'Breakdance Pack/breakdance uprock.fbx', duration: 6 },
      'crossleg': { file: 'Breakdance Pack/crossleg freeze.fbx', duration: 5 },

      // Locomotion Pack
      'walk': { file: 'Locomotion Pack/walking.fbx', duration: 6 },
      'run': { file: 'Locomotion Pack/running.fbx', duration: 6 },
      'jump': { file: 'Locomotion Pack/jump.fbx', duration: 3.5 },
      'strafe_left': { file: 'Locomotion Pack/left strafe.fbx', duration: 4 },
      'strafe_right': { file: 'Locomotion Pack/right strafe.fbx', duration: 4 },
      'turn_left': { file: 'Locomotion Pack/left turn.fbx', duration: 3.5 },
      'turn_right': { file: 'Locomotion Pack/right turn.fbx', duration: 3.5 },

      // Signature Solo Moves
      'moonwalk': { file: 'Moonwalk.fbx', duration: 6 },
      'flip': { file: 'Stylish Flip.fbx', duration: 4.5 },
      'sword': { file: 'Stylish Flip.fbx', duration: 4.5 },
      'slash': { file: 'Stylish Flip.fbx', duration: 4.5 },
      'punch': { file: 'talking.fbx', duration: 3.5 },
      'talking': { file: 'talking.fbx', duration: 5 },
      'kick': { file: 'Swing To Land.fbx', duration: 4 },
      'swing': { file: 'Swing To Land.fbx', duration: 4 },
      'roll': { file: 'Locomotion Pack/jump.fbx', duration: 3.5 },
      'idle': { stop: true }
    };

    this._initEngine();
    this._setupEventListeners();
  }

  /**
   * Initializes TalkingHead 3D character engine with transparent WebGL context
   */
  _initEngine() {
    if (!this.container) return;
    this.container.innerHTML = '';

    try {
      this.head = new TalkingHead(this.container, {
        cameraView: 'full',
        avatarMood: 'neutral',
        lipsyncModules: ['en'],
        cameraZoomEnable: true,
        cameraPanEnable: false,
        cameraRotateEnable: true,
        modelFPS: 60,
        modelPixelRatio: Math.min(window.devicePixelRatio || 1, 2)
      });

      console.log('[AvatarEngine] TalkingHead.js 3D character engine initialized successfully ✓');
    } catch (err) {
      console.error('[AvatarEngine] Failed to initialize TalkingHead instance:', err);
    }
  }

  /**
   * Universal Plug-and-Play Avatar Loader:
   * Supports TalkingHead models, Ready Player Me, Avaturn, AvatarSDK, VRoid, and Mixamo GLBs
   */
  async loadAvatar(url, options = {}) {
    if (!url) return;
    this.currentAvatarUrl = url;
    localStorage.setItem('aura_selected_avatar', url);

    if (url.endsWith('.vrm')) {
      return this.loadVRMAvatar(url);
    }

    // GLB / TalkingHead Mode
    this.isVRMMode = false;
    if (this.vrmRenderer && this.vrmRenderer.domElement) {
      this.vrmRenderer.domElement.style.display = 'none';
    }

    if (!this.head) {
      this._initEngine();
    }

    if (this.head && this.head.renderer && this.head.renderer.domElement) {
      this.head.renderer.domElement.style.display = 'block';
    }

    try {
      console.log(`[AvatarEngine] Loading Universal 3D Avatar into TalkingHead: "${url}"...`);
      const bodyForm = options.body || (url.includes('brunette') || url.includes('heroine') || url.includes('avatar5') ? 'F' : 'M');

      // Look up pre-calibrated retargeting profile for this avatar
      const filename = url.split('/').pop().split('?')[0];
      const retargetConfig = options.retarget || AVATAR_RETARGET_PROFILES[filename] || null;

      const avatarPayload = {
        url: url,
        body: bodyForm,
        avatarMood: this.currentMood || 'neutral',
        lipsyncLang: 'en'
      };

      if (retargetConfig) {
        avatarPayload.retarget = retargetConfig;
        console.log(`[AvatarEngine] Applied Retargeting Profile for "${filename}" (A-to-T calibration + Hips Height Lock) ✓`);
      }

      await this.head.showAvatar(avatarPayload, (progress) => {
        if (typeof options.onProgress === 'function') options.onProgress(progress);
      });

      this.currentAvatar = this.head.armature;
      this._hookModelFeatures(this.head.armature, url);
      this._applyFraming();
      console.log(`[AvatarEngine] Avatar "${url}" ready with phoneme lip-sync & FBX retargeting ✓`);
      return { success: true, url };
    } catch (err) {
      console.error(`[AvatarEngine] Error loading "${url}" in TalkingHead:`, err);
      // Fallback: If URL failed, try brunette.glb
      if (url !== 'brunette.glb') {
        return this.loadAvatar('brunette.glb', options);
      }
    }
  }

  /**
   * Convenience loader for Hero avatar
   */
  loadHeroAvatar(url = 'hero.glb') {
    return this.loadAvatar(url, { body: 'M' });
  }

  /**
   * VRM Legacy Loader: Preserves backwards compatibility for .vrm avatars
   */
  loadVRMAvatar(url = 'avatar.vrm') {
    this.isVRMMode = true;
    this.currentAvatarUrl = url;
    localStorage.setItem('aura_selected_avatar', url);

    if (this.head) {
      this.head.stop();
      if (this.head.renderer && this.head.renderer.domElement) {
        this.head.renderer.domElement.style.display = 'none';
      }
    }

    if (!this.vrmRenderer) {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      this.vrmScene = new THREE.Scene();
      this.vrmCamera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      this.vrmCamera.position.set(0, 0.05, 2.45);

      this.vrmRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.vrmRenderer.setSize(width, height);
      this.vrmRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(this.vrmRenderer.domElement);

      const amb = new THREE.AmbientLight(0xfff5ea, 1.4);
      this.vrmScene.add(amb);
      const dir = new THREE.DirectionalLight(0xffecd2, 1.8);
      dir.position.set(2, 4, 3);
      this.vrmScene.add(dir);

      this._startVRMLoop();
    } else {
      if (this.vrmRenderer.domElement) {
        this.vrmRenderer.domElement.style.display = 'block';
      }
      this._startVRMLoop();
    }

    const loader = new GLTFLoader();
    loader.register(parser => new VRMLoaderPlugin(parser));

    loader.load(url, (gltf) => {
      if (this.currentVRM) {
        this.vrmScene.remove(this.currentVRM.scene);
      }
      const vrm = gltf.userData.vrm;
      this.currentVRM = vrm;
      this.currentAvatar = vrm.scene;
      vrm.scene.rotation.y = Math.PI;
      vrm.scene.position.set(0, -0.85 + this.avatarYOffset, 0);
      vrm.scene.scale.setScalar(this.targetAvatarScale);
      this.vrmHeadBone = vrm.humanoid ? vrm.humanoid.getNormalizedBoneNode('head') : null;
      this.vrmScene.add(vrm.scene);
      console.log(`[AvatarEngine] VRM Avatar "${url}" loaded ✓`);
    }, undefined, (err) => {
      console.warn('[AvatarEngine] VRM load error, falling back to TalkingHead Brunette:', err);
      this.loadAvatar('brunette.glb');
    });
  }

  _startVRMLoop() {
    const vowels = ['aa', 'ee', 'oh'];
    let vTimer = 0;
    let vIdx = 0;

    const animate = () => {
      if (!this.isVRMMode) return;
      requestAnimationFrame(animate);
      const delta = Math.min(this.vrmClock.getDelta(), 0.1);

      if (this.currentVRM) this.currentVRM.update(delta);

      // Mouse tracking
      this.currentMouseX += (this.targetMouseX - this.currentMouseX) * 0.08;
      this.currentMouseY += (this.targetMouseY - this.currentMouseY) * 0.08;
      if (this.vrmHeadBone) {
        this.vrmHeadBone.rotation.y = this.currentMouseX * 0.38;
        this.vrmHeadBone.rotation.x = -this.currentMouseY * 0.28;
      }

      // VRM Lip-Sync
      if (this.currentVRM && this.currentVRM.expressionManager) {
        if (this.isSpeaking) {
          vTimer += delta;
          if (vTimer > 0.12) {
            vTimer = 0;
            vIdx = (vIdx + 1) % vowels.length;
          }
          const vowelName = vowels[vIdx];
          const mouthOpen = 0.35 + Math.sin(Date.now() * 0.018) * 0.35;
          vowels.forEach(v => {
            try { this.currentVRM.expressionManager.setValue(v, v === vowelName ? mouthOpen : 0); } catch(e){}
          });
        } else {
          vowels.forEach(v => {
            try { this.currentVRM.expressionManager.setValue(v, 0); } catch(e){}
          });
        }
      }

      this.vrmRenderer.render(this.vrmScene, this.vrmCamera);
    };

    animate();
  }

  /**
   * Hooks material meshes for suit/wardrobe customization (Hero avatar)
   */
  _hookModelFeatures(armature, url) {
    if (!armature) return;
    this.heroSuitMesh = null;
    this.heroTieMesh = null;
    this.heroShirtMesh = null;

    armature.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        const name = (o.name || '').toLowerCase();
        if (name.includes('suit') || name.includes('jacket') || name.includes('coat')) this.heroSuitMesh = o;
        if (name.includes('tie')) this.heroTieMesh = o;
        if (name.includes('shirt')) this.heroShirtMesh = o;
      }
    });

    const suit = localStorage.getItem('aura_suit_color');
    const tie = localStorage.getItem('aura_tie_color');
    const shirt = localStorage.getItem('aura_shirt_color');
    if (suit && tie && shirt) {
      this.syncSuitColors(suit, tie, shirt);
    }
  }

  /**
   * Applies framing, zoom, and vertical anchor
   */
  _applyFraming() {
    if (this.head && this.head.camera && !this.isVRMMode) {
      // In TalkingHead, full-body camera framing is native
      // Camera distance and Y-offset are tuned via setView offsets
      this.head.setView('full', {
        cameraDistance: (1.0 - this.targetAvatarScale) * 1.8,
        cameraY: this.avatarYOffset
      });
    }
    if (this.isVRMMode && this.currentVRM) {
      this.currentVRM.scene.position.set(0, -0.85 + this.avatarYOffset, 0);
      this.currentVRM.scene.scale.setScalar(this.targetAvatarScale);
    }
  }

  setScale(scale) {
    this.targetAvatarScale = Math.min(2.2, Math.max(0.4, parseFloat(scale) || 1.0));
    localStorage.setItem('aura_avatar_scale', this.targetAvatarScale.toString());
    this._applyFraming();
  }

  setYOffset(offset) {
    this.avatarYOffset = Math.max(-0.8, Math.min(0.6, parseFloat(offset) || 0));
    localStorage.setItem('aura_avatar_y_offset', this.avatarYOffset.toString());
    this._applyFraming();
  }

  syncSuitColors(suitHex, tieHex, shirtHex) {
    if (this.heroSuitMesh && this.heroSuitMesh.material) this.heroSuitMesh.material.color.set(suitHex);
    if (this.heroTieMesh && this.heroTieMesh.material) this.heroTieMesh.material.color.set(tieHex);
    if (this.heroShirtMesh && this.heroShirtMesh.material) this.heroShirtMesh.material.color.set(shirtHex);
  }

  /**
   * Dispatches Actions, Gestures, Breakdance, and Mixamo FBX Animations
   */
  async dispatchAction(actionName) {
    if (!actionName) return;
    const act = actionName.toLowerCase().trim();

    // 1. Check animation map
    const mapped = this.animationMap[act];
    if (mapped) {
      if (mapped.stop) {
        this.head?.stopAnimation();
        this.head?.stopGesture();
        return;
      }
      if (mapped.emoji) {
        this.head?.speakEmoji(mapped.emoji);
        if (mapped.mood) this.head?.setMood(mapped.mood);
        return;
      }
      if (mapped.gesture) {
        this.head?.playGesture(mapped.gesture, mapped.duration || 3);
        return;
      }
      if (mapped.file) {
        try {
          console.log(`[AvatarEngine] Triggering Mixamo FBX Animation: "${mapped.file}" (${mapped.duration}s)...`);
          const animUrl = encodeURI(mapped.file);
          await this.head?.playAnimation(animUrl, null, mapped.duration || 6);
          return;
        } catch (e) {
          console.warn(`[AvatarEngine] FBX animation notice for "${mapped.file}":`, e);
        }
      }
    }

    // 2. Direct Emoji Support (e.g. 😊, 🤔, 😎, 😂, 👋, 👍)
    if (/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}]/u.test(actionName)) {
      this.head?.speakEmoji(actionName);
      return;
    }

    // 3. Mood Support
    const moods = ['neutral', 'happy', 'angry', 'sad', 'fear', 'disgust', 'love', 'sleep'];
    if (moods.includes(act)) {
      this.setMood(act);
      return;
    }

    // 4. Default gesture fallback
    this.head?.playGesture('handup', 2.5);
  }

  setMood(mood) {
    this.currentMood = mood;
    if (this.head) {
      try { this.head.setMood(mood); } catch(e){}
    }
  }

  /**
   * Synchronizes Speech Lip-Sync State with Phoneme Articulation
   */
  setSpeaking(speaking, text = '') {
    this.isSpeaking = !!speaking;

    if (this.head) {
      if (this.isSpeaking) {
        if (text && text.trim().length > 0) {
          try {
            // Articulate speech with true phonemes (avatarMute: true lets VoiceEngine play audio cleanly)
            this.head.speakText(text.trim(), { avatarMute: true, avatarMood: this.currentMood });
          } catch(e) {
            console.warn('[AvatarEngine] speakText notice:', e);
          }
        } else {
          this.head.speakEmoji('🙂');
        }
      } else {
        this.head.speakBreak(200);
      }
    }
  }

  _setupEventListeners() {
    window.addEventListener('resize', () => {
      if (this.head && this.head.onResize) {
        try { this.head.onResize(); } catch(e){}
      }
      if (this.vrmRenderer && this.vrmCamera && this.container) {
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;
        this.vrmCamera.aspect = w / h;
        this.vrmCamera.updateProjectionMatrix();
        this.vrmRenderer.setSize(w, h);
      }
    });

    // Mouse Gaze Tracking
    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
      if (this.head && this.head.lookAt) {
        this.head.lookAt(e.clientX, e.clientY, 400);
      }
    });

    // Global Mouse position from Electron
    if (window.electronDesktopAPI && window.electronDesktopAPI.onGlobalMouseMove) {
      window.electronDesktopAPI.onGlobalMouseMove((pos) => {
        if (pos && this.head && this.head.lookAt) {
          const screenW = window.screen.width || 1920;
          const screenH = window.screen.height || 1080;
          const px = (pos.x / 1.5 + 0.5) * screenW;
          const py = (pos.y / 1.2 + 0.5) * screenH;
          this.head.lookAt(px, py, 400);
        }
      });
    }

    // Live mouse wheel zoom
    if (this.container) {
      this.container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const newScale = Math.min(Math.max(this.targetAvatarScale + delta, 0.4), 2.2);
        this.setScale(newScale);

        const inputScale = document.getElementById('inputAvatarScale');
        if (inputScale) inputScale.value = newScale.toFixed(2);
        const disp = document.getElementById('scaleValueDisplay');
        if (disp) disp.innerText = Math.round(newScale * 100) + '%';
        if (window.flashScaleHUD) window.flashScaleHUD(newScale);
      }, { passive: false });
    }
  }
}
