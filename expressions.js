// expressions.js — Human-Like Avatar + Mixamo Animation Support

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeInOut = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

export class AvatarExpressions {
  constructor() {
    // Blink
    this.blinkTimer = 0;
    this.nextBlinkTime = 1.5 + Math.random() * 3;
    this.isBlinking = false;
    this.blinkProgress = 0;

    // Emotion memory (smooth lerp)
    this.targetExpressions  = { happy:0, sad:0, angry:0, relaxed:0.3, surprised:0 };
    this.currentExpressions = { happy:0, sad:0, angry:0, relaxed:0.3, surprised:0 };

    // Gesture
    this.activeGesture = 'neutral';

    // Lip sync
    this.lipAA = 0; this.lipEE = 0; this.lipOH = 0;
    this.vowelType = 0; this.vowelTimer = 0;

    // Idle fidget
    this.fidgetTimer = 0; this.nextFidget = 4 + Math.random()*5;
    this.fidgetType = 'none'; this.fidgetProg = 0;
    this.headTilt = 0; this.headTiltTarget = 0;
    this.weightShift = 0; this.weightTarget = 0;

    // Dance
    this.danceMode = 'none';
    this.danceTime = 0;
    this.danceBlend = 0;

    // 🔑 Mixamo mode — when FBX animation plays, stop procedural bones
    this.mixamoMode = false;
    this.mixamoBlend = 0; // 0=procedural, 1=mixamo

    // Bone cache
    this.bones = {};
    this.lastVRM = null;
    this.initialHipsY = null;
  }

  // ── Blink (natural double-blink) ──────────────────────────
  handleAutoBlink(vrm, delta) {
    if (!vrm?.expressionManager) return;
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
      this.isBlinking = true; this.blinkProgress = 0;
      this.blinkTimer = 0; this.nextBlinkTime = 2 + Math.random()*4;
    }
    if (this.isBlinking) {
      this.blinkProgress += delta * 10;
      const raw = this.blinkProgress < 1 ? this.blinkProgress : Math.max(0, 2 - this.blinkProgress);
      try { vrm.expressionManager.setValue('blink', clamp(easeInOut(clamp(raw,0,1)),0,1)); } catch(e){}
      if (this.blinkProgress >= 2) {
        this.isBlinking = false;
        try { vrm.expressionManager.setValue('blink', 0); } catch(e){}
      }
    }
  }

  // ── Smooth expression lerp ────────────────────────────────
  _updateExpressions(vrm, delta) {
    if (!vrm?.expressionManager) return;
    for (const k in this.currentExpressions) {
      this.currentExpressions[k] = lerp(this.currentExpressions[k], this.targetExpressions[k], delta*2.5);
      try { vrm.expressionManager.setValue(k, clamp(this.currentExpressions[k],0,1)); } catch(e){}
    }
  }

  // ── Lip Sync ──────────────────────────────────────────────
  handleLipSync(vrm, isSpeaking, elapsed, delta) {
    if (!vrm?.expressionManager) return;
    if (!isSpeaking) {
      this.lipAA = lerp(this.lipAA, 0, delta*8);
      this.lipEE = lerp(this.lipEE, 0, delta*8);
      this.lipOH = lerp(this.lipOH, 0, delta*8);
    } else {
      this.vowelTimer += delta;
      if (this.vowelTimer >= 0.12 + Math.random()*0.06) {
        this.vowelType = Math.floor(Math.random()*3); this.vowelTimer = 0;
      }
      const p = Math.sin(elapsed*14)*0.45 + Math.cos(elapsed*7)*0.25 + 0.3;
      const open = clamp(p, 0, 0.8);
      const tAA = this.vowelType===0 ? open : this.vowelType===1 ? open*0.15 : open*0.2;
      const tEE = this.vowelType===1 ? open*0.55 : 0;
      const tOH = this.vowelType===2 ? open*0.72 : 0;
      const s = delta*18;
      this.lipAA = lerp(this.lipAA, tAA, s);
      this.lipEE = lerp(this.lipEE, tEE, s);
      this.lipOH = lerp(this.lipOH, tOH, s);
    }
    try { vrm.expressionManager.setValue('aa', clamp(this.lipAA,0,1)); } catch(e){}
    try { vrm.expressionManager.setValue('ee', clamp(this.lipEE,0,1)); } catch(e){}
    try { vrm.expressionManager.setValue('oh', clamp(this.lipOH,0,1)); } catch(e){}
  }

  // ── Dance targets ─────────────────────────────────────────
  _getDanceTargets(elapsed) {
    const t = this.danceTime;
    const bps = 128/60;
    const beat = Math.sin(t*bps*Math.PI*2);
    const beat2= Math.sin(t*bps*Math.PI*4);
    const half = Math.sin(t*bps*Math.PI);
    let d = this._defaultBones();

    if (this.danceMode==='pop') {
      d.hipsY=-Math.abs(beat)*0.07-0.04; d.hipsZ=beat*0.05; d.spineX=beat*0.05; d.spineZ=half*0.04;
      d.headZ=-half*0.09; d.headY=beat*0.06;
      d.lArmX=-half*0.4-0.1; d.lArmZ=0.4+beat*0.3; d.lArmLowerY=half*0.6;
      d.rArmX=half*0.4-0.1;  d.rArmZ=-0.4-beat*0.3; d.rArmLowerY=-half*0.6;
      d.lLegX=beat>0?beat*0.1:0; d.rLegX=beat<0?-beat*0.1:0;
    } else if (this.danceMode==='hiphop') {
      const b=Math.abs(beat);
      d.hipsY=-b*0.06; d.hipsZ=half*0.09; d.spineZ=-half*0.07;
      d.headY=half*0.12; d.headZ=beat*0.05;
      d.lArmX=beat2*0.25; d.lArmZ=0.7+half*0.3; d.lArmLowerY=beat*0.9;
      d.rArmX=-beat2*0.25; d.rArmZ=-0.7-half*0.3; d.rArmLowerY=-beat*0.9;
      d.lLegX=b*0.08; d.rLegX=b*0.08; d.lLegLowerX=b*0.06; d.rLegLowerX=b*0.06;
    } else if (this.danceMode==='wave') {
      const s=Math.sin(t*1.2), m=Math.sin(t*2.1);
      d.hipsY=s*0.04; d.hipsZ=m*0.03; d.spineX=s*0.04; d.spineZ=m*0.05;
      d.headZ=s*0.06; d.headX=m*0.04;
      d.lArmX=s*0.3; d.lArmZ=0.6+m*0.4; d.lArmLowerZ=m*0.5;
      d.rArmX=-s*0.3; d.rArmZ=-0.6-m*0.4; d.rArmLowerZ=-m*0.5;
    } else if (this.danceMode==='idol') {
      const c=Math.sin(t*3), c2=Math.cos(t*2);
      d.hipsY=Math.abs(c)*0.05-0.02; d.hipsZ=c2*0.05; d.spineX=c*0.03;
      d.headZ=-c2*0.10; d.headX=Math.abs(c)*0.05;
      d.lArmZ=0.8+Math.abs(c)*0.3; d.lArmX=c*0.2; d.lArmLowerY=c*0.4;
      d.rArmZ=-0.8-Math.abs(c)*0.3; d.rArmX=-c*0.2; d.rArmLowerY=-c*0.4;
      d.lLegX=c>0?c*0.06:0; d.rLegX=c<0?-c*0.06:0;
    }
    return d;
  }

  _defaultBones() {
    return { hipsY:0,hipsZ:0, spineX:0,spineZ:0, chestX:0,
      neckX:0,neckY:0,neckZ:0, headX:0,headY:0,headZ:0,
      lArmX:0,lArmZ:1.1,lArmLowerY:0,lArmLowerZ:0,
      rArmX:0,rArmZ:-1.1,rArmLowerY:0,rArmLowerZ:0,
      lLegX:0,lLegZ:0,lLegLowerX:0, rLegX:0,rLegZ:0,rLegLowerX:0 };
  }

  // ── Procedural body (idle / gesture / dance) ──────────────
  handleLocomotionAndGestures(vrm, state, isSpeaking, elapsed, delta) {
    if (!vrm?.humanoid) return;

    // Cache bones
    if (this.lastVRM !== vrm) {
      this.lastVRM = vrm;
      const names = ['hips','spine','chest','neck','head',
        'leftUpperArm','rightUpperArm','leftLowerArm','rightLowerArm',
        'leftUpperLeg','rightUpperLeg','leftLowerLeg','rightLowerLeg'];
      this.bones = {};
      for (const n of names) this.bones[n] = vrm.humanoid.getNormalizedBoneNode(n);
      this.initialHipsY = this.bones.hips?.position.y ?? 0;
    }

    // Dance blend
    if (this.danceMode !== 'none') {
      this.danceTime += delta;
      this.danceBlend = Math.min(this.danceBlend + delta*2, 1);
    } else {
      this.danceBlend = Math.max(this.danceBlend - delta*3, 0);
    }

    // Mixamo blend — skip procedural bones when mixamo plays
    this.mixamoBlend = this.mixamoMode
      ? Math.min(this.mixamoBlend + delta*4, 1)
      : Math.max(this.mixamoBlend - delta*4, 0);

    // If fully in mixamo mode, skip ALL procedural bone work
    if (this.mixamoBlend >= 0.99) return;

    // ── Idle targets ──
    const slow = Math.sin(elapsed*1.4), sway = Math.cos(elapsed*0.7);
    const breathe = Math.sin(elapsed*0.9)*0.015;
    if (Math.random()<0.002) this.weightTarget=(Math.random()-0.5)*0.04;
    this.weightShift = lerp(this.weightShift, this.weightTarget, delta*0.8);
    this.headTiltTarget = Math.sin(elapsed*0.3)*0.015 + Math.sin(elapsed*0.7)*0.01;
    this.headTilt = lerp(this.headTilt, this.headTiltTarget, delta*1.2);

    let tgt = this._defaultBones();
    tgt.spineX = breathe; tgt.spineZ = this.weightShift;
    tgt.hipsZ  = this.weightShift*0.5;
    tgt.headZ  = this.headTilt + sway*0.008;
    tgt.headY  = slow*0.01;

    // Speaking gesture overrides
    if (isSpeaking && this.danceMode==='none') {
      const tw1=Math.sin(elapsed*3.5), tw2=Math.cos(elapsed*2.0);
      if (this.activeGesture==='greeting') {
        tgt.rArmX=-0.2; tgt.rArmZ=-1.3+Math.sin(elapsed*11)*0.25; tgt.rArmLowerZ=-0.4;
      } else if (this.activeGesture==='thinking') {
        tgt.rArmX=-1.1; tgt.rArmZ=-0.2; tgt.rArmLowerZ=-1.4; tgt.rArmLowerY=-0.4;
        tgt.headZ=0.14; tgt.headX=0.06;
      } else if (this.activeGesture==='celebrating') {
        tgt.lArmX=-0.5+tw1*0.08; tgt.lArmZ=1.4+tw2*0.1;
        tgt.rArmX=-0.5+tw2*0.08; tgt.rArmZ=-1.4-tw1*0.1;
        tgt.spineX=-0.06; tgt.headX=-0.08;
      } else {
        tgt.lArmX=-0.15+tw1*0.18; tgt.lArmZ=0.55+tw2*0.12; tgt.lArmLowerY=0.45+tw1*0.22;
        tgt.rArmX=-0.15+tw2*0.18; tgt.rArmZ=-0.55-tw1*0.12; tgt.rArmLowerY=-0.45-tw2*0.22;
        tgt.headX=Math.abs(tw1)*0.04;
      }
    }

    // Dance blend
    if (this.danceBlend > 0) {
      const dt = this._getDanceTargets(elapsed);
      for (const k in tgt) tgt[k] = lerp(tgt[k]??0, dt[k]??0, this.danceBlend);
    }

    // Mixamo partial blend (fade procedural OUT as mixamo fades IN)
    const procWeight = 1 - this.mixamoBlend;
    const bs = delta * 6 * procWeight;
    if (bs <= 0) return;

    const b = this.bones;
    const al = (bone, prop, val) => { if(bone) bone.rotation[prop]=lerp(bone.rotation[prop], val, bs); };

    if (b.hips && this.initialHipsY!==null) {
      b.hips.position.y = lerp(b.hips.position.y, this.initialHipsY+(tgt.hipsY??0), bs);
      al(b.hips,'z',tgt.hipsZ??0);
    }
    al(b.spine,'x',tgt.spineX??0); al(b.spine,'z',tgt.spineZ??0);
    al(b.chest,'x',tgt.chestX??0);
    al(b.neck,'x',tgt.neckX??0); al(b.neck,'y',tgt.neckY??0); al(b.neck,'z',tgt.neckZ??0);
    al(b.head,'x',tgt.headX??0); al(b.head,'y',tgt.headY??0); al(b.head,'z',tgt.headZ??0);
    al(b.leftUpperArm,'x',tgt.lArmX??0);  al(b.leftUpperArm,'z',tgt.lArmZ??1.1);
    al(b.leftLowerArm,'y',tgt.lArmLowerY??0); al(b.leftLowerArm,'z',tgt.lArmLowerZ??0);
    al(b.rightUpperArm,'x',tgt.rArmX??0); al(b.rightUpperArm,'z',tgt.rArmZ??-1.1);
    al(b.rightLowerArm,'y',tgt.rArmLowerY??0); al(b.rightLowerArm,'z',tgt.rArmLowerZ??0);
    al(b.leftUpperLeg,'x',tgt.lLegX??0);  al(b.leftLowerLeg,'x',tgt.lLegLowerX??0);
    al(b.rightUpperLeg,'x',tgt.rLegX??0); al(b.rightLowerLeg,'x',tgt.rLegLowerX??0);
  }

  // ── Mood analyzer ─────────────────────────────────────────
  analyzeTextAndSetMood(vrm, text) {
    if (!vrm?.expressionManager) return;
    const t = text.toLowerCase();
    Object.keys(this.targetExpressions).forEach(k => this.targetExpressions[k]=0);
    if (t.match(/sorry|error|fail|wrong|sad|miss|cry/))           { this.targetExpressions.sad=0.65; }
    else if (t.match(/wow|amazing|omg|what!|shock|incredib/))     { this.targetExpressions.surprised=0.7; }
    else if (t.match(/hello|hi |hey|great|happy|super|yay|love/)) { this.targetExpressions.happy=0.8; }
    else if (t.match(/angry|frustrat|stop|enough|worst/))         { this.targetExpressions.angry=0.5; }
    else                                                           { this.targetExpressions.relaxed=0.4; }

    if (t.match(/hello|hi |hey|welcome/))           this.activeGesture='greeting';
    else if (t.match(/think|hmm|question|wonder/))  this.activeGesture='thinking';
    else if (t.match(/super|wow|amaz|hurray|yay/))  this.activeGesture='celebrating';
    else if (t.match(/code|step|first|second/))     this.activeGesture='explaining';
    else                                             this.activeGesture='neutral';
  }

  setDanceMode(mode) { this.danceMode=mode; this.danceTime=0; this.danceBlend=0; }

  resetMood(vrm) {
    Object.keys(this.targetExpressions).forEach(k => this.targetExpressions[k]=0);
    this.targetExpressions.relaxed=0.3; this.activeGesture='neutral';
  }

  // ── Master update tick ────────────────────────────────────
  update(vrm, isSpeaking, elapsed, delta) {
    if (!vrm) return;
    this.handleAutoBlink(vrm, delta);
    this.handleLipSync(vrm, isSpeaking, elapsed, delta);
    this._updateExpressions(vrm, delta);
    this.handleLocomotionAndGestures(vrm, 'idle', isSpeaking, elapsed, delta);
  }
}