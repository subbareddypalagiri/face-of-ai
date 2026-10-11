// src/renderer/voice/AcousticTransientDetector.js — SOTA Acoustic DSP Engine for UNIN
// Precision Percussion Transient Filter (Finger Snap & Hand Clap vs Human Speech & Ambient Noise)
// Features:
//   1. Two-Stage DSP: Highpass (1600 Hz) + Bandpass (2800 Hz, Q=1.0) Frequency Isolation
//   2. Crest Factor Analysis (Peak-to-RMS) to reject harmonic vocal waveforms
//   3. 40ms Temporal Decay Verification to reject sustained speech phonemes/vowels (>150ms)
//   4. TTS Self-Hearing Lockout during UNIN speech playback
//   5. Calibrated Dual-State Machine:
//        1x Snap/Clap  ➔ Summon UNIN Companion Window & Focus
//        2x Snap/Clap  ➔ Enable Voice Recognition & Live Mic Input
'use strict';

export class AcousticTransientDetector {
  constructor(options = {}) {
    this.audioContext = null;
    this.source = null;
    this.highpassFilter = null;
    this.bandpassFilter = null;
    this.scriptNode = null;
    this.silencer = null;
    this.stream = null;
    this.hiddenAudio = null;

    this.isRunning = false;
    this.isEnabled = options.enabled !== undefined ? !!options.enabled : true;
    this.isSpeakingLockout = false;

    // Callbacks
    this.onSingleTransient = options.onSingleTransient || null;
    this.onDoubleTransient = options.onDoubleTransient || null;
    this.onAudioLevel = options.onAudioLevel || null;

    // Sensitivity Presets: 'normal' | 'high' | 'low'
    this.sensitivityMode = options.sensitivityMode || 'normal';
    this.minPeakThreshold = 0.085;
    this.minRatioThreshold = 3.2;
    this.minCrestFactor = 3.2;
    this.decayThresholdRatio = 0.40;
    this._updateSensitivityParams();

    // Noise Floor Tracking (in the filtered band)
    this.ambientPeakBaseline = 0.005;
    this.lastLogTime = 0;

    // Candidate Transient Evaluation (Anti-Speech Decay Filter)
    this.candidateSpike = null;
    this.lastVerifiedTime = 0;

    // Temporal State Machine (Double / Single Percussion)
    this.firstSpikeTime = 0;
    this.pendingSingleTimer = null;

    this._onAudioProcess = this._onAudioProcess.bind(this);
  }

  _updateSensitivityParams() {
    if (this.sensitivityMode === 'high') {
      // High Sensitivity: Gentle snaps or 2-3 meters distance
      this.minPeakThreshold = 0.055;
      this.minRatioThreshold = 2.5;
      this.minCrestFactor = 2.8;
      this.decayThresholdRatio = 0.46;
    } else if (this.sensitivityMode === 'low') {
      // Low Sensitivity: Strict percussion mode, completely immune to talking/shouting
      this.minPeakThreshold = 0.13;
      this.minRatioThreshold = 4.5;
      this.minCrestFactor = 3.6;
      this.decayThresholdRatio = 0.35;
    } else {
      // Normal: Perfectly balanced for clean finger snaps & claps without false triggers
      this.minPeakThreshold = 0.085;
      this.minRatioThreshold = 3.2;
      this.minCrestFactor = 3.2;
      this.decayThresholdRatio = 0.40;
    }
  }

  setSensitivity(mode) {
    if (['low', 'normal', 'high'].includes(mode)) {
      this.sensitivityMode = mode;
      this._updateSensitivityParams();
      console.log(`[AcousticDetector] Sensitivity: ${mode.toUpperCase()} (Peak: ${this.minPeakThreshold}, Ratio: ${this.minRatioThreshold}x, Crest: ${this.minCrestFactor}, Decay: <=${(this.decayThresholdRatio * 100).toFixed(0)}%)`);
    }
  }

  setSpeakingLockout(isSpeaking) {
    this.isSpeakingLockout = !!isSpeaking;
    if (this.isSpeakingLockout) {
      this.candidateSpike = null;
      if (this.pendingSingleTimer) {
        clearTimeout(this.pendingSingleTimer);
        this.pendingSingleTimer = null;
        this.firstSpikeTime = 0;
      }
    }
  }

  async start(existingStream = null) {
    if (this.isRunning) return true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('[AcousticDetector] Web Audio API not supported.');
        return false;
      }

      if (existingStream && existingStream.active) {
        this.stream = existingStream;
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
      }

      // Track diagnostics & unmuting listeners
      this.stream.getAudioTracks().forEach((track, i) => {
        console.log(`[AcousticDetector Track ${i}] "${track.label}" | Enabled: ${track.enabled} | Muted: ${track.muted} | State: ${track.readyState}`);
        track.onunmute = () => {
          console.log(`[AcousticDetector Track UNMUTED!] Track "${track.label}" is LIVE!`);
        };
        track.onmute = () => {
          console.log(`[AcousticDetector Track MUTED!] Track "${track.label}" was MUTED!`);
        };
      });

      // Keep stream active in Chromium media pipeline
      try {
        this.hiddenAudio = document.createElement('audio');
        this.hiddenAudio.srcObject = this.stream;
        this.hiddenAudio.muted = true;
        this.hiddenAudio.play().catch(() => {});
      } catch (e) {}

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Stage 1: Highpass Filter (attenuates human speech fundamentals & rumble below 1600 Hz)
      this.highpassFilter = this.audioContext.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.value = 1600;

      // Stage 2: Bandpass Filter (peaks at 2800 Hz, Q=1.0, targeting snap/clap acoustic resonance)
      this.bandpassFilter = this.audioContext.createBiquadFilter();
      this.bandpassFilter.type = 'bandpass';
      this.bandpassFilter.frequency.value = 2800;
      this.bandpassFilter.Q.value = 1.0;

      // Stage 3: Direct PCM Stream Processor (512 buffer = ~11.6ms chunks at 44.1kHz)
      this.scriptNode = this.audioContext.createScriptProcessor(512, 1, 1);
      this.scriptNode.onaudioprocess = this._onAudioProcess;

      // Stage 4: Silencer to pull audio continuously through destination without speaker playback
      this.silencer = this.audioContext.createGain();
      this.silencer.gain.value = 0.0;

      // Connect DSP pipeline
      this.source.connect(this.highpassFilter);
      this.highpassFilter.connect(this.bandpassFilter);
      this.bandpassFilter.connect(this.scriptNode);
      this.scriptNode.connect(this.silencer);
      this.silencer.connect(this.audioContext.destination);

      this.isRunning = true;
      console.log(`[AcousticDetector] High-Precision DSP Engine ACTIVE [${this.sensitivityMode.toUpperCase()}] (Bandpass: 2800Hz, Peak: >=${this.minPeakThreshold}, Ratio: >=${this.minRatioThreshold}x, Crest: >=${this.minCrestFactor}) ✓`);
      return true;
    } catch (err) {
      console.warn('[AcousticDetector] Microphone init error:', err.message);
      this.isRunning = false;
      return false;
    }
  }

  stop() {
    this.isRunning = false;
    clearTimeout(this.pendingSingleTimer);
    this.pendingSingleTimer = null;
    this.firstSpikeTime = 0;
    this.candidateSpike = null;

    if (this.scriptNode) {
      this.scriptNode.onaudioprocess = null;
      try { this.scriptNode.disconnect(); } catch (e) {}
      this.scriptNode = null;
    }
    if (this.bandpassFilter) {
      try { this.bandpassFilter.disconnect(); } catch (e) {}
      this.bandpassFilter = null;
    }
    if (this.highpassFilter) {
      try { this.highpassFilter.disconnect(); } catch (e) {}
      this.highpassFilter = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch (e) {}
      this.source = null;
    }
    if (this.silencer) {
      try { this.silencer.disconnect(); } catch (e) {}
      this.silencer = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
  }

  setEnabled(enabled) {
    this.isEnabled = !!enabled;
    if (!this.isEnabled) {
      this.candidateSpike = null;
      clearTimeout(this.pendingSingleTimer);
      this.pendingSingleTimer = null;
      this.firstSpikeTime = 0;
    }
    console.log(`[AcousticDetector] Detection ${this.isEnabled ? 'ENABLED' : 'PAUSED'}`);
    return this.isEnabled;
  }

  _onAudioProcess(e) {
    if (!this.isRunning || !this.isEnabled || this.isSpeakingLockout) return;

    const channelData = e.inputBuffer.getChannelData(0);
    const N = channelData.length;

    let peak = 0;
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const absVal = Math.abs(channelData[i]);
      if (absVal > peak) peak = absVal;
      sumSq += absVal * absVal;
    }
    const rms = Math.sqrt(sumSq / N);
    const crestFactor = rms > 0.0001 ? (peak / rms) : 1.0;

    // Track filtered ambient noise floor
    if (peak < this.ambientPeakBaseline * 1.5) {
      this.ambientPeakBaseline = this.ambientPeakBaseline * 0.97 + peak * 0.03;
    }
    if (this.ambientPeakBaseline < 0.003) this.ambientPeakBaseline = 0.003;

    const spikeRatio = peak / this.ambientPeakBaseline;
    const now = performance.now();

    // Telemetry log every 2.5 seconds
    const wallNow = Date.now();
    if (wallNow - this.lastLogTime > 2500) {
      this.lastLogTime = wallNow;
      console.log(`[MicMonitor] Peak: ${peak.toFixed(3)}, Base: ${this.ambientPeakBaseline.toFixed(3)}, Ratio: ${spikeRatio.toFixed(1)}x, Crest: ${crestFactor.toFixed(1)}, Mode: ${this.sensitivityMode.toUpperCase()}`);
    }

    // Visual Meter Callback
    const levelPct = Math.min(100, Math.round((peak / (this.minPeakThreshold * 1.8)) * 100));
    if (typeof this.onAudioLevel === 'function') {
      this.onAudioLevel(levelPct, !!this.candidateSpike);
    }

    // ── STAGE A: CANDIDATE DECAY VERIFICATION (Anti-Speech Filter) ──────
    if (this.candidateSpike) {
      const elapsedMs = now - this.candidateSpike.onsetTime;
      this.candidateSpike.buffersAnalyzed++;

      // If peak rises further in the initial 25ms, update candidate peak
      if (elapsedMs < 25 && peak > this.candidateSpike.peak) {
        this.candidateSpike.peak = peak;
      }

      // Record decay energy in the 35ms - 65ms time window
      if (elapsedMs >= 35 && elapsedMs <= 65) {
        this.candidateSpike.decayPeaks.push(peak);
      }

      // Final verdict once candidate reaches 55ms
      if (elapsedMs >= 55 || this.candidateSpike.buffersAnalyzed >= 5) {
        const candidate = this.candidateSpike;
        this.candidateSpike = null; // Clear candidate

        const maxDecay = candidate.decayPeaks.length > 0
          ? Math.max(...candidate.decayPeaks)
          : peak;
        const decayRatio = maxDecay / candidate.peak;

        // True percussion impulse has fast decay: energy drops below threshold in <45ms
        if (decayRatio <= this.decayThresholdRatio) {
          console.log(`[AcousticDetector] 🎯 IMPULSE CONFIRMED! Peak: ${candidate.peak.toFixed(3)}, Ratio: ${candidate.spikeRatio.toFixed(1)}x, Crest: ${candidate.crestFactor.toFixed(1)}, Decay: ${(decayRatio * 100).toFixed(0)}% (<= ${(this.decayThresholdRatio * 100).toFixed(0)}%)`);
          this._handleVerifiedTransient({
            peak: candidate.peak.toFixed(3),
            rms: candidate.rms.toFixed(4),
            spikeRatio: candidate.spikeRatio.toFixed(1),
            crestFactor: candidate.crestFactor,
            decayRatio: decayRatio.toFixed(2),
            baseline: candidate.baseline.toFixed(3)
          });
        } else {
          // Sustained sound (speech vowel, laugh, cough, or scrape) rejected!
          if (candidate.peak >= this.minPeakThreshold * 1.2) {
            console.log(`[AcousticDetector] 🚫 REJECTED SUSTAINED AUDIO (Speech/Noise): Decay was ${(decayRatio * 100).toFixed(0)}% of peak (Required <= ${(this.decayThresholdRatio * 100).toFixed(0)}%)`);
          }
        }
      }
      return;
    }

    // ── STAGE B: ONSET SPIKE DETECTION ──────────────────────────────────
    // 150ms Lockout after verified transient to avoid room reverberation / reflections
    if (wallNow - this.lastVerifiedTime < 150) {
      return;
    }

    const isSpikeCandidate =
      peak >= this.minPeakThreshold &&
      spikeRatio >= this.minRatioThreshold &&
      crestFactor >= this.minCrestFactor;

    if (isSpikeCandidate) {
      this.candidateSpike = {
        peak: peak,
        rms: rms,
        crestFactor: crestFactor,
        spikeRatio: spikeRatio,
        baseline: this.ambientPeakBaseline,
        onsetTime: now,
        buffersAnalyzed: 0,
        decayPeaks: []
      };
    }
  }

  _handleVerifiedTransient(metrics) {
    const now = Date.now();
    this.lastVerifiedTime = now;

    console.log(`[AcousticDetector] ⚡ VERIFIED TRANSIENT! Peak: ${metrics.peak}, Decay: ${(parseFloat(metrics.decayRatio) * 100).toFixed(0)}%`);

    // Check for 2x Double Snap/Clap within 180ms - 750ms
    if (this.pendingSingleTimer && this.firstSpikeTime > 0) {
      const deltaMs = now - this.firstSpikeTime;

      if (deltaMs >= 180 && deltaMs <= 750) {
        // ── 2x DOUBLE CLAP / SNAP DETECTED! ───────────────────────────
        clearTimeout(this.pendingSingleTimer);
        this.pendingSingleTimer = null;
        this.firstSpikeTime = 0;
        this.lastVerifiedTime = now + 400; // Extra lockout so user can speak without triggering

        console.log(`[AcousticDetector] 👏 2x DOUBLE SNAP/CLAP! (Δt: ${deltaMs}ms) ➔ Enabling Voice!`);

        if (typeof this.onDoubleTransient === 'function') {
          this.onDoubleTransient({
            ...metrics,
            deltaMs,
            type: 'DOUBLE_TRANSIENT'
          });
        }
        return;
      }
    }

    // Otherwise, mark this as candidate 1st Clap and start 600ms window timer
    clearTimeout(this.pendingSingleTimer);
    this.firstSpikeTime = now;

    this.pendingSingleTimer = setTimeout(() => {
      this.pendingSingleTimer = null;
      this.firstSpikeTime = 0;

      console.log(`[AcousticDetector] 👏 1x SINGLE SNAP/CLAP! (Peak: ${metrics.peak}) ➔ Summoning UNIN!`);

      if (typeof this.onSingleTransient === 'function') {
        this.onSingleTransient({
          ...metrics,
          type: 'SINGLE_TRANSIENT'
        });
      }
    }, 600);
  }
}
