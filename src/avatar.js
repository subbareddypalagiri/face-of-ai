// src/avatar.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName, VRMHumanBoneName } from '@pixiv/three-vrm';

if (window.__vrmAvatarRunning) {
  console.log('[VRM Avatar] Already running — skipping.');
} else {
  window.__vrmAvatarRunning = true;
  initVRMAvatar();
}

function initVRMAvatar() {
  const canvas = document.getElementById('vrm-avatar-overlay-canvas');
  if (!canvas) return;

  const modelUrl = canvas.getAttribute('data-vrm-url');
  if (!modelUrl) return;

  const W = 280; const H = 420;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias:         true,
    alpha:             true,   
    premultipliedAlpha: false,  
  });

  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);  

  const scene = new THREE.Scene();
  scene.background = null; 

  const camera = new THREE.PerspectiveCamera(24, window.innerWidth / window.innerHeight, 0.1, 20);
  camera.position.set(0, 1.35, 2.2);
  camera.lookAt(0, 1.2, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.4);
  keyLight.position.set(1.5, 2.5, 2);
  scene.add(keyLight);

  let mouseNDX = 0; let mouseNDY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseNDX =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouseNDY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  let currentVRM = null; let blinkTimer = 0; let blinkInterval = 3.5; let isBlinking = false; let blinkT = 0;
  let smoothYaw = 0; let smoothPitch = 0;

  const loader = new GLTFLoader();
  loader.register(parser => new VRMLoaderPlugin(parser));

  loader.load(modelUrl, (gltf) => {
    const vrm = gltf.userData.vrm;
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);

    const metaVersion = vrm.meta?.metaVersion ?? vrm.meta?.version ?? '1';
    if (metaVersion === '0' || Number(metaVersion) < 1) { VRMUtils.rotateVRM0(vrm); }

    scene.add(vrm.scene);
    currentVRM = vrm;
    console.log('[VRM Avatar] ✓ Model loaded safely!');
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    if (currentVRM) {
      const humanoid = currentVRM.humanoid;
      const expressionManager = currentVRM.expressionManager;
      const lookAt = currentVRM.lookAt;

      const breathe = Math.sin(elapsed * 1.1) * 0.018;
      const spine = humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine);
      if (spine) spine.rotation.x = breathe;

      if (lookAt) {
        smoothYaw   += (-mouseNDX * 20 - smoothYaw)   * 0.06;
        smoothPitch += (mouseNDY * 12 - smoothPitch)  * 0.06;
        lookAt.yaw   = smoothYaw; lookAt.pitch = smoothPitch;
      }

      blinkTimer += delta;
      if (!isBlinking && blinkTimer >= blinkInterval) { isBlinking = true; blinkT = 0; blinkTimer = 0; }
      if (isBlinking && expressionManager) {
        blinkT += delta * 9;
        const half = blinkT * 2;
        const blink = half < 1 ? half : Math.max(0, 2 - half);
        expressionManager.setValue(VRMExpressionPresetName.Blink, blink);
        if (blinkT >= 1.0) { isBlinking = false; expressionManager.setValue(VRMExpressionPresetName.Blink, 0); }
      }
      currentVRM.update(delta);
    }
    renderer.render(scene, camera);
  }
  animate();
}