// expressions.js — Advanced VRM + Mixamo Retargeting & Emotional Expressiveness Engine

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Mixamo bone → VRM humanoid bone name
export const MIXAMO_TO_VRM = {
  'mixamorig:Hips':             'hips',
  'mixamorig:Spine':            'spine',
  'mixamorig:Spine1':           'chest',
  'mixamorig:Spine2':           'upperChest',
  'mixamorig:Neck':             'neck',
  'mixamorig:Head':             'head',
  'mixamorig:LeftShoulder':     'leftShoulder',
  'mixamorig:LeftArm':          'leftUpperArm',
  'mixamorig:LeftForeArm':      'leftLowerArm',
  'mixamorig:LeftHand':         'leftHand',
  'mixamorig:RightShoulder':    'rightShoulder',
  'mixamorig:RightArm':         'rightUpperArm',
  'mixamorig:RightForeArm':     'rightLowerArm',
  'mixamorig:RightHand':        'rightHand',
  'mixamorig:LeftUpLeg':        'leftUpperLeg',
  'mixamorig:LeftLeg':          'leftLowerLeg',
  'mixamorig:LeftFoot':         'leftFoot',
  'mixamorig:LeftToeBase':      'leftToes',
  'mixamorig:RightUpLeg':       'rightUpperLeg',
  'mixamorig:RightLeg':         'rightLowerLeg',
  'mixamorig:RightFoot':        'rightFoot',
  'mixamorig:RightToeBase':     'rightToes',
};

/**
 * Retargets a Mixamo AnimationClip to a VRM model's humanoid skeleton
 */
export function retargetMixamoClip(clip, vrm, THREE) {
  THREE = THREE || window._THREE;
  if (!THREE || !vrm?.humanoid) {
    console.warn('[retarget] No THREE or humanoid found');
    return clip;
  }

  const nameToNode = {};
  vrm.scene.traverse(obj => {
    if (obj.name) nameToNode[obj.name] = obj;
  });

  const newTracks = [];
  let mapped = 0;

  for (const track of clip.tracks) {
    const dotIdx = track.name.lastIndexOf('.');
    if (dotIdx === -1) continue;

    let boneName = track.name.slice(0, dotIdx);
    const propName = track.name.slice(dotIdx + 1);

    if (!boneName.includes(':') && boneName.startsWith('mixamorig')) {
      boneName = 'mixamorig:' + boneName.slice('mixamorig'.length);
    }

    const vrmBoneName = MIXAMO_TO_VRM[boneName];
    if (!vrmBoneName) continue;

    const boneNode = vrm.humanoid.getNormalizedBoneNode(vrmBoneName);
    if (!boneNode) continue;

    const targetName = boneNode.name + '.' + propName;

    let newTrack;
    if (propName === 'quaternion') {
      newTrack = new THREE.QuaternionKeyframeTrack(
        targetName,
        Array.from(track.times),
        Array.from(track.values)
      );
    } else if (propName === 'position' && vrmBoneName === 'hips') {
      const vals = new Float32Array(track.values.length);
      for (let i = 0; i < track.values.length; i++) vals[i] = track.values[i] * 0.01;
      newTrack = new THREE.VectorKeyframeTrack(
        targetName,
        Array.from(track.times),
        vals
      );
    } else {
      continue;
    }

    newTracks.push(newTrack);
    mapped++;
  }

  if (newTracks.length === 0) {
    return clip;
  }

  return new THREE.AnimationClip(clip.name, clip.duration, newTracks);
}

export class AvatarExpressions {
  constructor() {
    this.blinkTimer = 0;
    this.nextBlinkTime = 1.5 + Math.random() * 3;
    this.isBlinking = false;
    this.blinkProgress = 0;

    this.targetExpressions  = { happy: 0.1, sad: 0, angry: 0, relaxed: 0.0, surprised: 0, neutral: 1.0 };
    this.currentExpressions = { happy: 0.1, sad: 0, angry: 0, relaxed: 0.0, surprised: 0, neutral: 1.0 };

    this.activeGesture = 'neutral';
    this.isSinging = false;
    this.singingBeat = 0;

    this.lipAA = 0; 
    this.lipEE = 0; 
    this.lipOH = 0;
    this.lipIH = 0;
    this.lipOU = 0;

    this.vowelType = 0; 
    this.vowelTimer = 0;
    this.headTilt = 0; 
    this.headTiltTarget = 0;
    this.weightShift = 0; 
    this.weightTarget = 0;
    this.breathePhase = 0;

    this.mixamoActive = false;
    this.mixamoBlend  = 0;
    this.bones = {};
    this.lastVRM = null;
    this.initialHipsY = null;
  }

  handleAutoBlink(vrm, delta) {
    if (!vrm?.expressionManager) return;
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
      this.isBlinking = true; 
      this.blinkProgress = 0;
      this.blinkTimer = 0; 
      this.nextBlinkTime = 2 + Math.random() * 4;
    }
    if (this.isBlinking) {
      this.blinkProgress += delta * 10;
      const raw = this.blinkProgress < 1 ? this.blinkProgress : Math.max(0, 2 - this.blinkProgress);
      try { vrm.expressionManager.setValue('blink', clamp(easeInOut(clamp(raw, 0, 1)), 0, 1)); } catch(e){}
      if (this.blinkProgress >= 2) {
        this.isBlinking = false;
        try { vrm.expressionManager.setValue('blink', 0); } catch(e){}
      }
    }
  }

  _updateExpressions(vrm, delta) {
    if (!vrm?.expressionManager) return;
    for (const k in this.currentExpressions) {
      this.currentExpressions[k] = lerp(this.currentExpressions[k], this.targetExpressions[k] || 0, delta * 3.0);
      try { vrm.expressionManager.setValue(k, clamp(this.currentExpressions[k], 0, 1)); } catch(e){}
    }
  }

  handleLipSync(vrm, isSpeaking, elapsed, delta) {
    if (!vrm?.expressionManager) return;
    
    if (!isSpeaking && !this.isSinging) {
      this.lipAA = lerp(this.lipAA, 0, delta * 10);
      this.lipEE = lerp(this.lipEE, 0, delta * 10);
      this.lipOH = lerp(this.lipOH, 0, delta * 10);
      this.lipIH = lerp(this.lipIH, 0, delta * 10);
      this.lipOU = lerp(this.lipOU, 0, delta * 10);
    } else if (this.isSinging) {
      // Melodic, wide musical mouth shapes
      this.singingBeat += delta * 6;
      const wave = Math.sin(this.singingBeat) * 0.5 + 0.5;
      const open = 0.4 + wave * 0.5;
      this.lipAA = lerp(this.lipAA, open, delta * 14);
      this.lipOH = lerp(this.lipOH, (1 - wave) * 0.6, delta * 14);
      this.lipEE = lerp(this.lipEE, wave * 0.4, delta * 14);
    } else {
      // Conversational speaking
      this.vowelTimer += delta;
      if (this.vowelTimer >= 0.10 + Math.random() * 0.07) {
        this.vowelType = Math.floor(Math.random() * 4); 
        this.vowelTimer = 0;
      }
      const p = Math.sin(elapsed * 15) * 0.45 + Math.cos(elapsed * 8) * 0.25 + 0.35;
      const open = clamp(p, 0, 0.85);

      const tAA = this.vowelType === 0 ? open : open * 0.15;
      const tEE = this.vowelType === 1 ? open * 0.65 : 0;
      const tOH = this.vowelType === 2 ? open * 0.8 : 0;
      const tIH = this.vowelType === 3 ? open * 0.5 : 0;

      const s = delta * 20;
      this.lipAA = lerp(this.lipAA, tAA, s);
      this.lipEE = lerp(this.lipEE, tEE, s);
      this.lipOH = lerp(this.lipOH, tOH, s);
      this.lipIH = lerp(this.lipIH, tIH, s);
    }

    try { vrm.expressionManager.setValue('aa', clamp(this.lipAA, 0, 1)); } catch(e){}
    try { vrm.expressionManager.setValue('ee', clamp(this.lipEE, 0, 1)); } catch(e){}
    try { vrm.expressionManager.setValue('oh', clamp(this.lipOH, 0, 1)); } catch(e){}
    try { vrm.expressionManager.setValue('ih', clamp(this.lipIH, 0, 1)); } catch(e){}
  }

  _handleIdleBody(vrm, isSpeaking, elapsed, delta) {
    if (!vrm?.humanoid) return;

    if (this.lastVRM !== vrm) {
      this.lastVRM = vrm;
      const names = [
        'hips', 'spine', 'chest', 'upperChest', 'neck', 'head',
        'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand',
        'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg'
      ];
      this.bones = {};
      for (const n of names) this.bones[n] = vrm.humanoid.getNormalizedBoneNode(n);
      this.initialHipsY = this.bones.hips?.position.y ?? 0;
    }

    this.mixamoBlend = this.mixamoActive
      ? Math.min(this.mixamoBlend + delta * 5, 1)
      : Math.max(this.mixamoBlend - delta * 5, 0);

    // If external animation clip (dance/walk) is 100% active, let mixer handle it
    if (this.mixamoBlend >= 0.99) return;

    const pw = 1 - this.mixamoBlend;
    const bs = delta * 6 * pw;
    if (bs <= 0) return;

    this.breathePhase += delta;
    const breathe = Math.sin(this.breathePhase * 1.4) * 0.015;
    
    if (Math.random() < 0.003) this.weightTarget = (Math.random() - 0.5) * 0.025;
    this.weightShift = lerp(this.weightShift, this.weightTarget, delta * 0.8);
    
    this.headTiltTarget = Math.sin(elapsed * 0.4) * 0.02 + Math.sin(elapsed * 0.7) * 0.015;
    this.headTilt = lerp(this.headTilt, this.headTiltTarget, delta * 2.0);

    const b = this.bones;
    const al = (bone, prop, val) => { if(bone) bone.rotation[prop] = lerp(bone.rotation[prop], val, bs); };

    // Spine & posture breathing
    if (b.hips) {
      b.hips.position.y = lerp(b.hips.position.y, this.initialHipsY, bs);
      al(b.hips, 'z', this.weightShift * 0.3);
    }
    al(b.spine, 'x', breathe); 
    al(b.spine, 'z', this.weightShift * 0.2);
    al(b.chest, 'x', breathe * 0.5);
    al(b.head, 'x', 0); 
    al(b.head, 'y', Math.sin(elapsed * 1.1) * 0.015); 
    al(b.head, 'z', this.headTilt);

    // ── Perfect Natural Standing Arm Angles (VRM Normalized Space) ──
    // In this VRM model:
    // LeftUpperArm: Z = +1.15 to +1.25 rad brings arm down from T-pose to body side
    // RightUpperArm: Z = -1.15 to -1.25 rad brings arm down from T-pose to body side
    if (this.isSinging) {
      // Singing: Right hand holds imaginary mic, left hand gestures gently
      const sway = Math.sin(elapsed * 3.0) * 0.08;
      al(b.leftUpperArm, 'z', 0.7 + sway);
      al(b.leftUpperArm, 'x', 0.2);
      al(b.leftLowerArm, 'x', 0.4);

      al(b.rightUpperArm, 'z', -0.5);
      al(b.rightUpperArm, 'x', -0.4);
      al(b.rightLowerArm, 'x', -0.7);
    } else if (!isSpeaking) {
      // Rest / Idle Standing Pose: Arms comfortably hanging down along body
      al(b.leftUpperArm, 'x', 0.05);
      al(b.leftUpperArm, 'y', 0.02);
      al(b.leftUpperArm, 'z', 1.18); // Downward resting angle along hip

      al(b.rightUpperArm, 'x', 0.05);
      al(b.rightUpperArm, 'y', -0.02);
      al(b.rightUpperArm, 'z', -1.18); // Downward resting angle along hip

      al(b.leftLowerArm, 'x', 0.08);
      al(b.leftLowerArm, 'y', 0.05);
      al(b.leftLowerArm, 'z', 0.0);

      al(b.rightLowerArm, 'x', 0.08);
      al(b.rightLowerArm, 'y', -0.05);
      al(b.rightLowerArm, 'z', 0.0);
    } else {
      // Conversational speaking: Subtle expressive hand motions
      const tw1 = Math.sin(elapsed * 3.0) * 0.08;
      const tw2 = Math.cos(elapsed * 2.2) * 0.06;

      if (this.activeGesture === 'greeting') {
        al(b.leftUpperArm, 'z', 1.18);
        al(b.rightUpperArm, 'z', -0.4);
        al(b.rightUpperArm, 'x', -0.4);
        al(b.rightLowerArm, 'x', -0.6 + Math.sin(elapsed * 8) * 0.2);
      } else if (this.activeGesture === 'thinking') {
        al(b.leftUpperArm, 'z', 1.18);
        al(b.rightUpperArm, 'z', -0.5);
        al(b.rightUpperArm, 'x', -0.6);
        al(b.rightLowerArm, 'x', -0.8);
      } else {
        // Natural talking gestures
        al(b.leftUpperArm, 'z', 1.05 + tw1);
        al(b.leftUpperArm, 'x', 0.15);
        al(b.leftLowerArm, 'x', 0.25 + tw2);

        al(b.rightUpperArm, 'z', -1.05 - tw2);
        al(b.rightUpperArm, 'x', 0.15);
        al(b.rightLowerArm, 'x', 0.25 - tw1);
      }
    }
  }

  setMixamoActive(active) { 
    this.mixamoActive = active; 
  }

  setSinging(isSinging) {
    this.isSinging = isSinging;
    if (isSinging) {
      this.targetExpressions.happy = 0.7;
      this.targetExpressions.relaxed = 0.0;
    }
  }

  analyzeTextAndSetMood(vrm, text) {
    if (!vrm?.expressionManager) return;
    const t = (text || '').toLowerCase();
    Object.keys(this.targetExpressions).forEach(k => this.targetExpressions[k] = 0);

    if (t.match(/sorry|error|fail|wrong|sad|miss|cry|bad/)) {
      this.targetExpressions.sad = 0.7;
    } else if (t.match(/wow|amazing|omg|shock|incredible|unbelievable|cool/)) {
      this.targetExpressions.surprised = 0.8;
      this.activeGesture = 'excited';
    } else if (t.match(/hello|hi |hey|great|happy|super|yay|dance|fun|laugh/)) {
      this.targetExpressions.happy = 0.85;
    } else if (t.match(/angry|frustrat|stop|enough|annoy/)) {
      this.targetExpressions.angry = 0.6;
    } else {
      this.targetExpressions.happy = 0.1;
    }

    if (t.match(/hello|hi |hey|welcome|start/))        this.activeGesture = 'greeting';
    else if (t.match(/think|hmm|wonder|question|idea/)) this.activeGesture = 'thinking';
    else if (t.match(/super|wow|amaz|yay|cheer|dance/)) this.activeGesture = 'celebrating';
    else                                                this.activeGesture = 'neutral';
  }

  resetMood(vrm) {
    Object.keys(this.targetExpressions).forEach(k => this.targetExpressions[k] = 0);
    this.targetExpressions.happy = 0.1; 
    this.activeGesture = 'neutral';
    this.isSinging = false;
  }

  update(vrm, isSpeaking, elapsed, delta) {
    if (!vrm) return;
    this.handleAutoBlink(vrm, delta);
    this.handleLipSync(vrm, isSpeaking, elapsed, delta);
    this._updateExpressions(vrm, delta);
    this._handleIdleBody(vrm, isSpeaking, elapsed, delta);
  }

  handleLocomotionAndGestures(vrm, state, isSpeaking, elapsed, delta) {
    this._handleIdleBody(vrm, isSpeaking, elapsed, delta);
  }
}