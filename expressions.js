// expressions.js - Masterclass Locomotion State Machine with Advanced Phonetic Lip Sync & Dynamic Contextual Gestures

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

export class AvatarExpressions {
  constructor() {
    this.blinkTimer = 0;
    this.nextBlinkTime = 2 + Math.random() * 3; 
    this.currentMood = 'neutral';
    this.activeGesture = 'neutral'; // 🔥 UPGRADE: Tracks the current body gesture state
    this.initialHipsY = null; 
    this.lastVRM = null;      
    
    this.speechNoiseTime = 0;
    this.currentVowelType = 0;
    this.vowelSwitchTimer = 0;
  }

  // 1. Fluid Phonetic Vowel Lip-Sync Upgrade
  handleLipSync(vrm, isSpeaking, elapsedTime, delta) {
    if (!vrm || !vrm.expressionManager || vrm.scene.userData?.isPlaceholder) return;
    
    if (!isSpeaking) {
      vrm.expressionManager.setValue('aa', 0.0);
      vrm.expressionManager.setValue('ee', 0.0);
      vrm.expressionManager.setValue('oh', 0.0);
      this.speechNoiseTime = 0;
      return;
    }

    this.speechNoiseTime += delta;
    const primaryWave   = Math.sin(elapsedTime * 16.0); 
    const secondaryWave = Math.cos(elapsedTime * 8.5);  
    const microJitter   = Math.sin(elapsedTime * 32.0) * 0.12; 

    let rawMouthOpen = (primaryWave * 0.5 + secondaryWave * 0.3 + 0.3) + microJitter;
    let mouthOpen = Math.min(Math.max(rawMouthOpen, 0.0), 0.75); 

    this.vowelSwitchTimer += delta;
    if (this.vowelSwitchTimer >= 0.14) {
      this.currentVowelType = Math.floor(Math.random() * 3);
      this.vowelSwitchTimer = 0;
    }

    vrm.expressionManager.setValue('aa', 0.0);
    vrm.expressionManager.setValue('ee', 0.0);
    vrm.expressionManager.setValue('oh', 0.0);

    if (this.currentVowelType === 0) {
      vrm.expressionManager.setValue('aa', mouthOpen);
    } else if (this.currentVowelType === 1) {
      vrm.expressionManager.setValue('ee', mouthOpen * 0.5);
      vrm.expressionManager.setValue('aa', mouthOpen * 0.15); 
    } else {
      vrm.expressionManager.setValue('oh', mouthOpen * 0.7);
      vrm.expressionManager.setValue('aa', mouthOpen * 0.2);
    }
  }

  // 2. Adaptive Automatic Eye Blinking
  handleAutoBlink(vrm, delta) {
    if (!vrm || !vrm.expressionManager || vrm.scene.userData?.isPlaceholder) return;
    this.blinkTimer += delta;
    if (this.blinkTimer >= this.nextBlinkTime) {
      vrm.expressionManager.setValue('blink', 1.0);
      if (this.blinkTimer >= this.nextBlinkTime + 0.12) {
        vrm.expressionManager.setValue('blink', 0.0);
        this.blinkTimer = 0;
        this.nextBlinkTime = 2.5 + Math.random() * 4; 
      }
    }
  }

  // 3. Procedural State Machine (Now with CONTEXTUAL GESTURES!)
  handleLocomotionAndGestures(vrm, state, isSpeaking, elapsedTime, delta) {
    if (!vrm || !vrm.humanoid || vrm.scene.userData?.isPlaceholder) return;

    const bones = {
      hips: vrm.humanoid.getNormalizedBoneNode('hips'),
      spine: vrm.humanoid.getNormalizedBoneNode('spine'),
      neck: vrm.humanoid.getNormalizedBoneNode('neck'),
      head: vrm.humanoid.getNormalizedBoneNode('head'),
      leftUpperArm: vrm.humanoid.getNormalizedBoneNode('leftUpperArm'),
      rightUpperArm: vrm.humanoid.getNormalizedBoneNode('rightUpperArm'),
      leftLowerArm: vrm.humanoid.getNormalizedBoneNode('leftLowerArm'),
      rightLowerArm: vrm.humanoid.getNormalizedBoneNode('rightLowerArm'),
      leftUpperLeg: vrm.humanoid.getNormalizedBoneNode('leftUpperLeg'),
      rightUpperLeg: vrm.humanoid.getNormalizedBoneNode('rightUpperLeg'),
      leftLowerLeg: vrm.humanoid.getNormalizedBoneNode('leftLowerLeg'),
      rightLowerLeg: vrm.humanoid.getNormalizedBoneNode('rightLowerLeg')
    };

    if (this.lastVRM !== vrm) {
      this.lastVRM = vrm;
      this.initialHipsY = bones.hips ? bones.hips.position.y : null;
    }

    const t = Math.min(delta * 5.0, 1.0);

    let target = {
      hipsY: 0.0, hipsRotationZ: 0.0,
      spineX: 0.0, spineZ: 0.0,
      headX: 0.0, headY: 0.0, headZ: 0.0, // Added headZ for tilting
      lArmX: 0.0, lArmZ: 1.1, lArmLowerY: 0.0, lArmLowerZ: 0.0,
      rArmX: 0.0, rArmZ: -1.1, rArmLowerY: 0.0, rArmLowerZ: 0.0,
      lLegX: 0.0, lLegLowerX: 0.0,
      rLegX: 0.0, rLegLowerX: 0.0
    };

    const waveFast  = Math.sin(elapsedTime * 5.5);
    const cosFast   = Math.cos(elapsedTime * 5.5);
    const waveRun   = Math.sin(elapsedTime * 8.5);
    const cosRun    = Math.cos(elapsedTime * 8.5);
    const slowBreathe = Math.sin(elapsedTime * 1.8);
    const slowSway    = Math.cos(elapsedTime * 0.9);

    // BASE LOCOMOTION
    if (state === 'walk') {
      target.hipsY = Math.abs(waveFast) * 0.04 - 0.02; 
      target.hipsRotationZ = cosFast * 0.03;          
      target.spineX = 0.04;                           

      target.lLegX = waveFast * 0.38;
      target.rLegX = -waveFast * 0.38;
      target.lLegLowerX = (cosFast > 0 ? cosFast * 0.25 : 0.0);
      target.rLegLowerX = (cosFast < 0 ? -cosFast * 0.25 : 0.0);

      target.lArmX = -waveFast * 0.35 + 0.1;
      target.lArmZ = 0.2;
      target.rArmX = waveFast * 0.35 + 0.1;
      target.rArmZ = -0.2;

    } else if (state === 'run') {
      target.hipsY = Math.abs(waveRun) * 0.09 - 0.06; 
      target.hipsRotationZ = cosRun * 0.06;
      target.spineX = 0.16; 

      target.lLegX = waveRun * 0.65;
      target.rLegX = -waveRun * 0.65;
      target.lLegLowerX = (cosRun > 0 ? cosRun * 0.55 : 0.0);
      target.rLegLowerX = (cosRun < 0 ? -cosRun * 0.55 : 0.0);

      target.lArmX = -waveRun * 0.6 - 0.2;
      target.lArmZ = 0.3;
      target.lArmLowerY = 0.8; 
      target.rArmX = waveRun * 0.6 - 0.2;
      target.rArmZ = -0.3;
      target.rArmLowerY = -0.8;

    } else {
      target.spineX = slowBreathe * 0.02;
      target.spineZ = slowSway * 0.01;
      target.headY = slowSway * 0.03;
      target.lArmZ = 1.1;
      target.rArmZ = -1.1;
    }

    // 🔥 DYNAMIC GESTURE OVERRIDES WHEN SPEAKING
    if (isSpeaking) {
      const talkWave1 = Math.sin(elapsedTime * 4.0);
      const talkWave2 = Math.cos(elapsedTime * 2.3);

      if (this.activeGesture === 'greeting') {
        // Wave right hand enthusiastically
        target.rArmX = lerp(target.rArmX, -0.2, 0.8);
        target.rArmZ = lerp(target.rArmZ, -1.2 + Math.sin(elapsedTime * 12.0) * 0.3, 0.8);
        target.rArmLowerZ = lerp(target.rArmLowerZ, -0.5, 0.8);
        target.headX = Math.abs(talkWave1) * 0.05;
        
      } else if (this.activeGesture === 'thinking') {
        // Hand to chin, head tilted, looking thoughtful
        target.rArmX = lerp(target.rArmX, -1.2, 0.8);
        target.rArmZ = lerp(target.rArmZ, -0.2, 0.8);
        target.rArmLowerZ = lerp(target.rArmLowerZ, -1.5, 0.8); // Fold arm sharply
        target.rArmLowerY = lerp(target.rArmLowerY, -0.5, 0.8);
        target.headZ = lerp(target.headZ, 0.15, 0.8); // Tilt head
        target.headX = lerp(target.headX, 0.05, 0.8);
        
      } else if (this.activeGesture === 'celebrating') {
        // Both hands thrown up in joy/excitement
        target.lArmX = lerp(target.lArmX, -0.5, 0.8);
        target.lArmZ = lerp(target.lArmZ, 1.4 + talkWave1 * 0.1, 0.8);
        target.rArmX = lerp(target.rArmX, -0.5, 0.8);
        target.rArmZ = lerp(target.rArmZ, -1.4 + talkWave2 * 0.1, 0.8);
        target.spineX = lerp(target.spineX, -0.05, 0.8); // Lean back slightly
        target.headX = lerp(target.headX, -0.1, 0.8);    // Look up slightly
        
      } else {
        // Standard explaining/talking (Your original smooth logic)
        target.lArmX = lerp(target.lArmX, -0.2 + talkWave1 * 0.15, 0.7);
        target.lArmZ = lerp(target.lArmZ, 0.6 + talkWave2 * 0.1, 0.7);
        target.lArmLowerY = lerp(target.lArmLowerY, 0.5 + talkWave1 * 0.2, 0.7);

        target.rArmX = lerp(target.rArmX, -0.2 + talkWave2 * 0.15, 0.7);
        target.rArmZ = lerp(target.rArmZ, -0.6 - talkWave1 * 0.1, 0.7);
        target.rArmLowerY = lerp(target.rArmLowerY, -0.5 - talkWave2 * 0.2, 0.7);

        target.headX = Math.abs(talkWave1) * 0.06;
      }
    }

    // APPLY CALCULATED POSITIONS TO BONES
    if (bones.hips && this.initialHipsY !== null) {
      bones.hips.position.y = lerp(bones.hips.position.y, this.initialHipsY + target.hipsY, t);
      bones.hips.rotation.z = lerp(bones.hips.rotation.z, target.hipsRotationZ, t);
    }
    if (bones.spine) {
      bones.spine.rotation.x = lerp(bones.spine.rotation.x, target.spineX, t);
      bones.spine.rotation.z = lerp(bones.spine.rotation.z, target.spineZ, t);
    }
    if (bones.neck)  bones.neck.rotation.y  = lerp(bones.neck.rotation.y, target.headY, t);
    if (bones.head) {
      bones.head.rotation.x  = lerp(bones.head.rotation.x, target.headX, t);
      bones.head.rotation.z  = lerp(bones.head.rotation.z, target.headZ, t);
    }

    if (bones.leftUpperArm)  bones.leftUpperArm.rotation.x  = lerp(bones.leftUpperArm.rotation.x, target.lArmX, t);
    if (bones.leftUpperArm)  bones.leftUpperArm.rotation.z  = lerp(bones.leftUpperArm.rotation.z, target.lArmZ, t);
    if (bones.leftLowerArm) {
      bones.leftLowerArm.rotation.y  = lerp(bones.leftLowerArm.rotation.y, target.lArmLowerY, t);
      bones.leftLowerArm.rotation.z  = lerp(bones.leftLowerArm.rotation.z, target.lArmLowerZ, t);
    }

    if (bones.rightUpperArm) bones.rightUpperArm.rotation.x = lerp(bones.rightUpperArm.rotation.x, target.rArmX, t);
    if (bones.rightUpperArm) bones.rightUpperArm.rotation.z = lerp(bones.rightUpperArm.rotation.z, target.rArmZ, t);
    if (bones.rightLowerArm) {
      bones.rightLowerArm.rotation.y = lerp(bones.rightLowerArm.rotation.y, target.rArmLowerY, t);
      bones.rightLowerArm.rotation.z = lerp(bones.rightLowerArm.rotation.z, target.rArmLowerZ, t);
    }

    if (bones.leftUpperLeg)  bones.leftUpperLeg.rotation.x  = lerp(bones.leftUpperLeg.rotation.x, target.lLegX, t);
    if (bones.leftLowerLeg)  bones.leftLowerLeg.rotation.x  = lerp(bones.leftLowerLeg.rotation.x, target.lLegLowerX, t);
    if (bones.rightUpperLeg) bones.rightUpperLeg.rotation.x = lerp(bones.rightUpperLeg.rotation.x, target.rLegX, t);
    if (bones.rightLowerLeg) bones.rightLowerLeg.rotation.x = lerp(bones.rightLowerLeg.rotation.x, target.rLegLowerX, t);
  }

  // 4. Automatic Mood & Gesture Detector (Upgraded Context Analyzer)
  analyzeTextAndSetMood(vrm, text) {
    if (!vrm || !vrm.expressionManager || vrm.scene.userData?.isPlaceholder) return;
    const lowerText = text.toLowerCase();
    
    // Reset all facial expressions first
    const standardMoods = ['happy', 'sad', 'angry', 'relaxed', 'surprised'];
    standardMoods.forEach(m => vrm.expressionManager.setValue(m, 0.0));

    // Determine facial mood
    if (lowerText.includes('sorry') || lowerText.includes('error') || lowerText.includes('failed')) {
      vrm.expressionManager.setValue('sad', 0.7);
      this.currentMood = 'sad';
    } else if (lowerText.includes('wow') || lowerText.includes('amazing') || lowerText.includes('what')) {
      vrm.expressionManager.setValue('surprised', 0.6);
      this.currentMood = 'surprised';
    } else if (lowerText.includes('hello') || lowerText.includes('ready') || lowerText.includes('happy') || lowerText.includes('super')) {
      vrm.expressionManager.setValue('happy', 0.8);
      this.currentMood = 'happy';
    } else {
      vrm.expressionManager.setValue('relaxed', 0.5);
      this.currentMood = 'relaxed';
    }

    // 🔥 Determine Body Gesture Intent based on Keywords
    if (lowerText.includes('hello') || lowerText.includes('hi ') || lowerText.includes('welcome')) {
      this.activeGesture = 'greeting';
    } else if (lowerText.includes('solve') || lowerText.includes('think') || lowerText.includes('hmm') || lowerText.includes('question')) {
      this.activeGesture = 'thinking';
    } else if (lowerText.includes('super') || lowerText.includes('wow') || lowerText.includes('amazing') || lowerText.includes('hurray')) {
      this.activeGesture = 'celebrating';
    } else if (lowerText.includes('code') || lowerText.includes('step') || lowerText.includes('easy') || lowerText.includes('first')) {
      this.activeGesture = 'explaining';
    } else {
      this.activeGesture = 'neutral'; // Defaults to normal talking hands
    }
  }

  resetMood(vrm) {
    if (!vrm || !vrm.expressionManager) return;
    const standardMoods = ['happy', 'sad', 'angry', 'relaxed', 'surprised'];
    standardMoods.forEach(m => vrm.expressionManager.setValue(m, 0.0));
    vrm.expressionManager.setValue('relaxed', 0.3); 
    this.activeGesture = 'neutral'; // Reset hands to normal when done speaking
  }
}