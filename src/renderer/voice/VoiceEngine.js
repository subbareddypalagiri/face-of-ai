// src/renderer/voice/VoiceEngine.js — Production Voice Recognition & Neural TTS Engine for UNIN
'use strict';

import { AuraAudio } from '../ui/UIManager.js';

export const EDGE_VOICES = [
  { id: 'te-IN-MohanNeural', name: 'Telugu - Mohan (Natural)' },
  { id: 'te-IN-ShrutiNeural', name: 'Telugu - Shruti (Melodious)' },
  { id: 'en-IN-NeerjaNeural', name: 'Indian English - Neerja' },
  { id: 'en-IN-PrabhatNeural', name: 'Indian English - Prabhat' },
  { id: 'en-US-AriaNeural', name: 'US English - Aria' },
  { id: 'en-US-GuyNeural', name: 'US English - Guy' }
];

/**
 * Normalizes acoustic and semantic phonetic slips across Indian English, Telugu, and Tenglish
 */
export function normalizeVoicePhonetics(rawTranscript) {
  if (!rawTranscript) return '';
  return rawTranscript.trim()
    // Core Identity
    .replace(/\b(?:union|onion|you\s*nin|you\s*mean|you\s*need|u\s*nin|u\s*mean)\b/gi, 'UNIN')
    // Antigravity & Development Tools
    .replace(/\b(?:anti\s*gravity|integriti|and\s*the\s*gravity|anti\s*grad|anti\s*grav)\b/gi, 'Antigravity')
    .replace(/\b(?:vs\s*code|v\s*s\s*code|we\s*s\s*code|visual\s*studio\s*code)\b/gi, 'VSCode')
    // 3D, WebGL & Blender
    .replace(/\b(?:3gs|3ds|three\s*chase|three\s*days|three\s*js|3\s*js)\b/gi, 'Three.js')
    .replace(/\b(?:blender|calendar|blenda|plender)\b/gi, 'Blender')
    .replace(/\b(?:web\s*gl|web\s*jail)\b/gi, 'WebGL')
    // Common Projects
    .replace(/\b(?:the\s*essay|d\s*s\s*a|ds\s*a)\b/gi, 'DSA')
    .replace(/\b(?:yama\s*ai|yama\s*a\s*i)\b/gi, 'Yama-ai')
    .replace(/\b(?:face\s*of\s*me|face\s*of\s*ai)\b/gi, 'face of me')
    // Common Apps
    .replace(/\b(?:what's\s*up|what\s*app|whats\s*app|wat\s*sap|vatsap)\b/gi, 'WhatsApp')
    .replace(/\b(?:u\s*tube|you\s*tube)\b/gi, 'YouTube')
    .replace(/\b(?:google\s*chrome|crome|krome)\b/gi, 'Chrome')
    .replace(/\b(?:get\s*hub|kit\s*hub|git\s*hub)\b/gi, 'GitHub')
    // Modal & Dialog Actions
    .replace(/\b(?:a\s*law|hello\s*click|a\s*long\s*click)\b/gi, 'allow')
    .replace(/\b(?:proceed\s*click|perceived\s*click)\b/gi, 'proceed')
    // Tenglish verbs & suffixes
    .replace(/\b(?:open\s*chase\s*the|open\s*chase|open\s*chey\s*see)\b/gi, 'open chesi')
    .replace(/\b(?:bill\s*change|bill\s*chey|build\s*j)\b/gi, 'build chey')
    .replace(/\b(?:close\s*chase\s*the|close\s*chase)\b/gi, 'close chesi')
    .replace(/\b(?:terminal\s*law|terminal\s*low)\b/gi, 'terminal lo')
    .replace(/\b(?:blender\s*love|blender\s*law)\b/gi, 'blender lo')
    .replace(/\b(?:what's\s*up\s*love|whatsapp\s*love)\b/gi, 'WhatsApp lo')
    .replace(/\b(?:antigravity\s*love|antigravity\s*law)\b/gi, 'Antigravity lo')
    .replace(/\b(?:three\.?js\s*love|three\.?js\s*law)\b/gi, 'Three.js lo')
    .replace(/\b(?:chrome\s*love|chrome\s*law)\b/gi, 'Chrome lo')
    .replace(/\b(?:screen\s*to\s*do|screen\s*choodu)\b/gi, 'screen chudu')
    .replace(/\b(?:badi|baddi|budie|baddy)\b/gi, 'buddy')
    .replace(/\b(?:jayant|jayan)\b/gi, 'Jayanth');
}

export class VoiceEngine {
  constructor(options = {}) {
    this.audioPlayer = new Audio();
    this.isSpeaking = false;
    this.isListeningActive = false;
    this.isHandsFreeActive = false;
    this.isWakeWordActive = false;
    this.activeRecognition = null;
    this.wakeWordRecognition = null;
    this.wakeWordRestartTimer = null;
    this.silenceTimer = null;
    this.consecutiveErrors = 0;
    this.onRecognizedCallback = options.onRecognized || null;
    this.onInterimCallback = options.onInterim || null;
    this.onStateChangeCallback = options.onStateChange || null;
    this.onWakeWordCallback = options.onWakeWord || null;
    this.wakeWordRegex = /(?:\b(?:hey\s*unin|unin|buddy|hey\s*buddy|namaste\s*unin|namaste\s*buddy|hi\s*unin|ok\s*unin|hi\s*buddy|hello\s*buddy|hey\s*badi|badi|hey\s*baddi|baddi|hey\s*bud|bud|oye\s*buddy|o\s*buddy|hey\s*body|body|hay\s*buddy|hay\s*badi)\b|బడ్డీ|హే\s*బడ్డీ|బడి|హే\s*బడి|యునిన్|హే\s*యునిన్)/i;

    // SOTA Neural Ear & Hardware Audio State
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isNeuralRecording = false;
    this.audioContext = null;
    this.analyser = null;
    this.micSource = null;
    this.audioLevelCheckTimer = null;

    this._setupAudioListeners();
  }

  _setupAudioListeners() {
    this.audioPlayer.onplay = () => { this.isSpeaking = true; this._notifyState(); };
    this.audioPlayer.onpause = () => { this.isSpeaking = false; this._notifyState(); };
  }

  interruptSpeaking() {
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    this.isSpeaking = false;
    this._notifyState();
  }

  _notifyState() {
    if (typeof this.onStateChangeCallback === 'function') {
      this.onStateChangeCallback({
        isSpeaking: this.isSpeaking,
        text: this.isSpeaking ? (this.lastSpokenText || '') : '',
        isListening: this.isListeningActive,
        isHandsFree: this.isHandsFreeActive,
        isWakeWord: this.isWakeWordActive
      });
    }
  }

  speak(text, emotion = 'happy', onComplete = null) {
    return this.speakDialogue(text, emotion, onComplete);
  }

  getSelectedVoiceId() {
    return localStorage.getItem('aura_edge_voice') || 'te-IN-MohanNeural';
  }

  setVoice(voiceId) {
    localStorage.setItem('aura_edge_voice', voiceId);
  }

  getSTTLanguage() {
    return localStorage.getItem('aura_stt_lang') || 'te-IN';
  }

  setSTTLanguage(lang) {
    localStorage.setItem('aura_stt_lang', lang);
  }

  cycleSTTLanguage() {
    const langs = ['en-IN', 'te-IN', 'en-US'];
    const current = this.getSTTLanguage();
    const nextIdx = (langs.indexOf(current) + 1) % langs.length;
    const next = langs[nextIdx];
    this.setSTTLanguage(next);
    return next;
  }

  toggleHandsFree() {
    this.setHandsFree(!this.isHandsFreeActive);
    return this.isHandsFreeActive;
  }

  setHandsFree(active) {
    this.isHandsFreeActive = !!active;
    this._notifyState();
    if (this.isHandsFreeActive && !this.isListeningActive && !this.isSpeaking) {
      this.startListening();
    }
  }

  enableWakeWord(enable) {
    this.isWakeWordActive = !!enable;
    localStorage.setItem('unin_wake_word_enabled', this.isWakeWordActive ? 'true' : 'false');
    this._notifyState();
    if (this.isWakeWordActive) {
      if (!this.isListeningActive && !this.isSpeaking) {
        this._startWakeWordListener();
      }
    } else {
      this._stopWakeWordListener();
    }
    return this.isWakeWordActive;
  }

  handleNativeWakeWord(keyword = 'buddy') {
    if (!this.isWakeWordActive || this.isSpeaking || this.isListeningActive) return;
    console.log('[VoiceEngine] Native Windows Wake Word Spotted:', keyword);
    AuraAudio.playNeural();
    if (typeof this.onWakeWordCallback === 'function') {
      this.onWakeWordCallback(keyword, '');
    }
  }

  _startWakeWordListener() {
    if (!this.isWakeWordActive || this.isSpeaking || this.isListeningActive) return;

    this._stopWakeWordListener();

    try {
      const SpeechRec = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (!SpeechRec) {
        console.warn('[VoiceEngine] Web Speech API not available for Wake Word listening.');
        return;
      }

      const rec = new SpeechRec();
      this.wakeWordRecognition = rec;
      rec.continuous = true;
      rec.interimResults = true;
      // en-IN acoustic model reliably spots Indian accented "Buddy" and "UNIN" as well as code-mixed speech
      rec.lang = 'en-IN';

      rec.onresult = (e) => {
        if (!this.isWakeWordActive || this.isSpeaking || this.isListeningActive) return;

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const transcript = (e.results[i][0].transcript || '').trim();
          const match = transcript.match(this.wakeWordRegex);
          if (match) {
            const detectedWord = match[0];
            // Extract any trailing command spoken in the same breath (e.g., "Hey buddy open Chrome")
            const trailingCommand = transcript.slice(match.index + match[0].length).replace(/^[,.\s]+/, '').trim();
            console.log('[VoiceEngine] Wake Word Spotting Match:', detectedWord, 'Trailing Command:', trailingCommand, 'in:', transcript);

            this._stopWakeWordListener();
            AuraAudio.playNeural();

            if (typeof this.onWakeWordCallback === 'function') {
              this.onWakeWordCallback(detectedWord, trailingCommand);
            } else {
              if (trailingCommand && trailingCommand.length > 2) {
                if (typeof this.onRecognizedCallback === 'function') {
                  this.onRecognizedCallback(trailingCommand);
                }
              } else {
                setTimeout(() => {
                  this.startListening();
                }, 300);
              }
            }
            break;
          }
        }
      };

      rec.onerror = (err) => {
        if (err.error === 'no-speech' || err.error === 'aborted') return;
        if (err.error === 'network') {
          // Electron environment without Google API keys; Native Windows SAPI engine handles wake words seamlessly
          return;
        }
        console.warn('[VoiceEngine WakeWord Error]:', err.error);
        this._scheduleWakeWordRestart(1500);
      };

      rec.onend = () => {
        this.wakeWordRecognition = null;
        if (this.isWakeWordActive && !this.isSpeaking && !this.isListeningActive) {
          this._scheduleWakeWordRestart(600);
        }
      };

      rec.start();
    } catch (e) {
      console.warn('[VoiceEngine WakeWord Exception]:', e);
      this._scheduleWakeWordRestart(2000);
    }
  }

  _stopWakeWordListener() {
    clearTimeout(this.wakeWordRestartTimer);
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.abort();
      } catch (e) {}
      this.wakeWordRecognition = null;
    }
  }

  _scheduleWakeWordRestart(delayMs = 600) {
    clearTimeout(this.wakeWordRestartTimer);
    this.wakeWordRestartTimer = setTimeout(() => {
      if (this.isWakeWordActive && !this.isSpeaking && !this.isListeningActive) {
        this._startWakeWordListener();
      }
    }, delayMs);
  }

  async speakDialogue(text, emotion = 'happy', onComplete = null) {
    if (!text) {
      if (onComplete) onComplete();
      return;
    }

    const clean = text.replace(/[\u{1F600}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '').trim();
    if (!clean) {
      if (onComplete) onComplete();
      return;
    }

    this.lastSpokenText = clean;

    // Temporarily pause wake word listener to avoid audio loopback
    this._stopWakeWordListener();

    const finishSpeech = () => {
      this.isSpeaking = false;
      this.lastSpokenText = '';
      this._notifyState();
      if (onComplete) onComplete();
      if (this.isWakeWordActive && !this.isListeningActive) {
        this._scheduleWakeWordRestart(500);
      }
    };

    try {
      if (window.electronDesktopAPI && window.electronDesktopAPI.synthesizeEdgeTTS) {
        const voiceId = this.getSelectedVoiceId();
        const res = await window.electronDesktopAPI.synthesizeEdgeTTS(clean, voiceId);
        if (res && res.success && res.audioData) {
          this.audioPlayer.src = res.audioData;
          this.isSpeaking = true;
          this._notifyState();

          this.audioPlayer.onerror = finishSpeech;
          this.audioPlayer.onended = finishSpeech;
          await this.audioPlayer.play();
          return;
        }
      }
    } catch (err) {
      console.warn('[VoiceEngine] EdgeTTS synthesis error, falling back to Web Speech:', err);
    }

    // Fallback to Web Speech Synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.onstart = () => { this.isSpeaking = true; this._notifyState(); };
      u.onend = finishSpeech;
      u.onerror = finishSpeech;
      window.speechSynthesis.speak(u);
    } else {
      finishSpeech();
    }
  }

  async startListening() {
    // 1. Instant Barge-In: If UNIN is talking, immediately interrupt and silence
    if (this.isSpeaking) {
      this.interruptSpeaking();
    }

    // Pause ambient wake-word recognition during active input capture
    this._stopWakeWordListener();

    if (this.isListeningActive) {
      await this.stopListeningAndSubmit();
      return;
    }

    this.isListeningActive = true;
    this._notifyState();
    AuraAudio.playNeural();

    // 2. Start Hardware Mic Recording for Gemini 2.5 Neural Ear
    await this._startNeuralAudioRecording();

    // 3. Start auxiliary Web Speech for real-time interim preview
    this._startAuxiliarySpeechRecognition();
  }

  async _startNeuralAudioRecording() {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (!this.mediaStream || !this.mediaStream.active) {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        this.audioChunks = [];
        const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
          ? 'audio/webm;codecs=opus'
          : ((typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')) ? 'audio/webm' : 'audio/mp4');

        this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };
        this.mediaRecorder.start(100);
        this.isNeuralRecording = true;

        this._setupBargeInAudioMonitor(this.mediaStream);
      }
    } catch (err) {
      console.warn('[VoiceEngine] MediaRecorder microphone init skipped:', err);
      this.isNeuralRecording = false;
    }
  }

  _setupBargeInAudioMonitor(stream) {
    try {
      const AudioCtx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
      if (!AudioCtx) return;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.micSource = this.audioContext.createMediaStreamSource(stream);
      this.micSource.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      clearInterval(this.audioLevelCheckTimer);
      this.audioLevelCheckTimer = setInterval(() => {
        if (!this.isListeningActive && !this.isSpeaking) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;

        // If audio energy > 25 while UNIN is speaking, barge-in!
        if (avg > 25 && this.isSpeaking) {
          console.log('[VoiceEngine Barge-In] Spoken interruption detected! Stopping speech.');
          this.interruptSpeaking();
        }
      }, 100);
    } catch (e) {
      console.warn('[VoiceEngine] Barge-In monitor setup skipped:', e);
    }
  }

  _startAuxiliarySpeechRecognition() {
    try {
      if (this.activeRecognition) {
        try { this.activeRecognition.abort(); } catch(e){}
        this.activeRecognition = null;
      }

      const SpeechRec = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (!SpeechRec) {
        console.warn('[VoiceEngine] Web Speech API is not supported in this client. Relying purely on Neural Ear.');
        return;
      }

      const rec = new SpeechRec();
      this.activeRecognition = rec;

      let accumulatedFinal = '';
      let lastInterim = '';

      const sttLang = this.getSTTLanguage();
      rec.lang = sttLang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 5;

      rec.onresult = (e) => {
        this.consecutiveErrors = 0;
        let interimText = '';
        const technicalKeywords = ['antigravity', 'three.js', 'blender', 'unin', 'whatsapp', 'vscode', 'dsa', 'github', 'allow', 'proceed', 'build', 'create', 'switch'];

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          let bestTranscript = e.results[i][0].transcript;

          if (e.results[i].length > 1) {
            for (let a = 1; a < e.results[i].length; a++) {
              const alt = (e.results[i][a].transcript || '').toLowerCase();
              if (technicalKeywords.some(kw => alt.includes(kw))) {
                bestTranscript = e.results[i][a].transcript;
                break;
              }
            }
          }

          if (e.results[i].isFinal) {
            accumulatedFinal += ' ' + bestTranscript;
          } else {
            interimText += bestTranscript;
          }
        }

        lastInterim = interimText;
        const liveView = (accumulatedFinal + ' ' + interimText).trim();

        if (liveView && typeof this.onInterimCallback === 'function') {
          this.onInterimCallback(liveView);
        }

        const debounceMs = liveView.length < 25 ? 1500 : 1300;
        clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          if (this.isListeningActive) {
            this.stopListeningAndSubmit(accumulatedFinal + ' ' + lastInterim);
          }
        }, debounceMs);
      };

      rec.onerror = (err) => {
        if (err.error === 'no-speech' || err.error === 'aborted') return;
        console.warn('[VoiceEngine WebSpeech Notice]:', err.error);
        this.consecutiveErrors++;
      };

      rec.onend = () => {
        // Handled through Neural Ear stopListeningAndSubmit
      };

      rec.start();
    } catch (err) {
      console.warn('[VoiceEngine WebSpeech Exception]:', err);
    }
  }

  async stopListeningAndSubmit(fallbackTranscript = '') {
    clearTimeout(this.silenceTimer);
    clearInterval(this.audioLevelCheckTimer);

    if (this.activeRecognition) {
      try { this.activeRecognition.stop(); } catch (e) {}
    }

    // 1. Process Hardware Audio Buffer with Gemini 2.5 Flash Neural Ear
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        await new Promise((resolve) => {
          this.mediaRecorder.onstop = resolve;
          this.mediaRecorder.stop();
        });

        if (this.audioChunks.length > 0) {
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          this.audioChunks = [];

          if (audioBlob.size > 1500) {
            const base64Audio = await this._blobToBase64(audioBlob);
            const neuralResult = await this.transcribeWithGeminiAudio(base64Audio, mimeType);
            if (neuralResult && (neuralResult.normalized_prompt || neuralResult.transcript)) {
              const finalPrompt = neuralResult.normalized_prompt || neuralResult.transcript;
              console.log('[VoiceEngine Neural Ear] Verified Intent:', finalPrompt);
              if (typeof this.onRecognizedCallback === 'function') {
                this.onRecognizedCallback(finalPrompt, neuralResult);
              }
              this.isListeningActive = false;
              this._notifyState();
              this._handlePostRecognitionRestart();
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[VoiceEngine Neural Ear Fallback]:', err);
      }
    }

    // 2. Fallback to Web Speech transcript if Neural Ear was unavailable
    this.isListeningActive = false;
    this._notifyState();

    const remaining = (fallbackTranscript || '').trim();
    if (remaining) {
      const normalized = normalizeVoicePhonetics(remaining);
      if (typeof this.onRecognizedCallback === 'function') {
        this.onRecognizedCallback(normalized);
      }
    }

    this._handlePostRecognitionRestart();
  }

  async transcribeWithGeminiAudio(base64Audio, mimeType = 'audio/webm') {
    const apiKey = (typeof localStorage !== 'undefined') && localStorage.getItem('gemini_companion_key');
    if (!apiKey) return null;

    const cleanMime = mimeType.split(';')[0];
    const prompt = `You are UNIN's ultra-high-fidelity Acoustic Neural Ear.
The audio contains natural voice from the user speaking Indian English, Telugu, or code-mixed Tenglish (Telugu + English).
Transcribe what the user said with high phonetic fidelity.
Reconstruct the user's intent into a clean, structured desktop command.
Common keywords in this environment: Antigravity, VSCode, YouTube, Blender, Three.js, WhatsApp, GitHub, download, build, open, schedule.
Return ONLY a valid JSON object matching this schema:
{
  "transcript": "<verbatim words spoken>",
  "normalized_prompt": "<clean, executable desktop instruction>",
  "intent": "<app_launch | build_project | download_media | system_query | chat>",
  "language": "<en | te | tenglish>"
}`;

    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: cleanMime, data: base64Audio } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      if (data.error) {
        console.warn('[Gemini Neural Ear API Error]:', data.error);
        return null;
      }

      const text = data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text;
      if (!text) return null;
      return JSON.parse(text);
    } catch (e) {
      console.warn('[Gemini Neural Ear Request Exception]:', e);
      return null;
    }
  }

  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  _handlePostRecognitionRestart() {
    this.activeRecognition = null;
    if (this.isHandsFreeActive && !this.isSpeaking) {
      setTimeout(() => {
        if (this.isHandsFreeActive && !this.isSpeaking) this.startListening();
      }, 800);
    } else if (this.isWakeWordActive && !this.isSpeaking) {
      this._scheduleWakeWordRestart(600);
    }
  }
}
