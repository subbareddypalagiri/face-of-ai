// scratch/test-transient-detector.js — Comprehensive Test for Acoustic DSP Transient Detection
const assert = require('assert');

console.log('--- 1. Testing Sample-Rate Agnostic Binning ---');
function getBins(sampleRate, fftSize) {
  const hzPerBin = sampleRate / fftSize;
  const binLowEnd = Math.floor(1000 / hzPerBin);
  const binMidEnd = Math.floor(3000 / hzPerBin);
  const binHighEnd = Math.min(fftSize / 2 - 1, Math.floor(8500 / hzPerBin));
  return { hzPerBin, binLowEnd, binMidEnd, binHighEnd };
}

const bins44100 = getBins(44100, 1024);
console.log('44100Hz Bins:', bins44100);
assert(bins44100.binLowEnd > 15 && bins44100.binLowEnd < 30);
assert(bins44100.binMidEnd > 60 && bins44100.binMidEnd < 80);
assert(bins44100.binHighEnd > 180 && bins44100.binHighEnd < 210);

const bins48000 = getBins(48000, 1024);
console.log('48000Hz Bins:', bins48000);
assert(bins48000.binLowEnd > 15 && bins48000.binLowEnd < 30);

console.log('--- 2. Testing Crest Factor & Spectral Ratio for Impulse vs Sine Wave ---');
// Impulse signal (representing snap/clap transient): 1 sharp peak, low energy elsewhere
const impulseSignal = new Float32Array(1024);
impulseSignal[10] = 0.95;
impulseSignal[11] = -0.72;
impulseSignal[12] = 0.45;
impulseSignal[13] = -0.21;
for (let i = 14; i < 1024; i++) impulseSignal[i] = (Math.random() - 0.5) * 0.005;

let impSumSq = 0, impPeak = 0;
for (let i = 0; i < 1024; i++) {
  const val = Math.abs(impulseSignal[i]);
  if (val > impPeak) impPeak = val;
  impSumSq += val * val;
}
const impRms = Math.sqrt(impSumSq / 1024);
const impCrest = impPeak / (impRms + 1e-6);
console.log(`Impulse Peak: ${impPeak.toFixed(3)}, RMS: ${impRms.toFixed(4)}, Crest Factor: ${impCrest.toFixed(2)}`);
assert(impCrest > 5.0, 'Impulse crest factor must be > 5.0');

// Sine wave signal (representing vowel vocalization): smooth sinusoidal wave
const sineSignal = new Float32Array(1024);
for (let i = 0; i < 1024; i++) sineSignal[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / 44100);
let sineSumSq = 0, sinePeak = 0;
for (let i = 0; i < 1024; i++) {
  const val = Math.abs(sineSignal[i]);
  if (val > sinePeak) sinePeak = val;
  sineSumSq += val * val;
}
const sineRms = Math.sqrt(sineSumSq / 1024);
const sineCrest = sinePeak / (sineRms + 1e-6);
console.log(`Sine Peak: ${sinePeak.toFixed(3)}, RMS: ${sineRms.toFixed(4)}, Crest Factor: ${sineCrest.toFixed(2)}`);
assert(sineCrest < 2.0, 'Sine wave crest factor must be < 2.0');

console.log('--- 3. Testing Temporal State Machine (Single vs Double Transient) ---');
class MockStateMachine {
  constructor() {
    this.events = [];
    this.lastConfirmedTime = 0;
    this.firstTransientTime = 0;
    this.pendingSingleTimer = null;
  }

  handleTransient(simulatedTime) {
    const now = simulatedTime;
    if (now - this.lastConfirmedTime < 160) {
      // Debounce reflection
      return;
    }

    if (this.pendingSingleTimer && this.firstTransientTime > 0) {
      const deltaMs = now - this.firstTransientTime;
      if (deltaMs >= 180 && deltaMs <= 750) {
        clearTimeout(this.pendingSingleTimer);
        this.pendingSingleTimer = null;
        this.firstTransientTime = 0;
        this.lastConfirmedTime = now;
        this.events.push({ type: 'DOUBLE', deltaMs });
        return;
      }
    }

    clearTimeout(this.pendingSingleTimer);
    this.firstTransientTime = now;
    this.lastConfirmedTime = now;
    this.pendingSingleTimer = setTimeout(() => {
      this.pendingSingleTimer = null;
      this.firstTransientTime = 0;
      this.events.push({ type: 'SINGLE' });
    }, 620);
  }
}

const sm = new MockStateMachine();

// Test A: Single snap at t=0
console.log('Testing Single Snap...');
sm.handleTransient(1000);
setTimeout(() => {
  assert.strictEqual(sm.events.length, 1);
  assert.strictEqual(sm.events[0].type, 'SINGLE');
  console.log('✓ Single Snap Event Fired Correctly');

  // Test B: Double snap at t=2000 and t=2350 (interval: 350ms)
  console.log('Testing Double Snap (interval 350ms)...');
  sm.events = [];
  sm.handleTransient(2000);
  sm.handleTransient(2350);

  setTimeout(() => {
    assert.strictEqual(sm.events.length, 1);
    assert.strictEqual(sm.events[0].type, 'DOUBLE');
    assert.strictEqual(sm.events[0].deltaMs, 350);
    console.log('✓ Double Snap Event Fired Correctly without triggering Single!');
    console.log('🎉 ALL ACOUSTIC TRANSIENT DSP UNIT TESTS PASSED!');
  }, 700);
}, 700);
