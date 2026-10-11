// native-wake-word.js — 100% Offline Win32 / SAPI Speech Recognition for UNIN
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');
const logger = require('./src/shared/Logger');

class NativeWakeWordEngine extends EventEmitter {
  constructor() {
    super();
    this.psProcess = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const scriptPath = path.join(__dirname, 'bin', 'wake-word-listener.ps1');

    try {
      this.psProcess = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
      ], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.psProcess.stdout.on('data', (chunk) => {
        const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          try {
            if (line.startsWith('{') && line.endsWith('}')) {
              const data = JSON.parse(line);
              if (data.event === 'ready') {
                logger.info('NativeWakeWord', 'Native Windows wake-word listener is ARMED and listening (100% offline).');
                this.emit('ready');
              } else if (data.event === 'wake_word') {
                logger.info('NativeWakeWord', `Wake word spotted: "${data.word}" (Confidence: ${data.confidence})`);
                this.emit('wake_word', data.word, data.confidence);
              } else if (data.event === 'error') {
                logger.warn('NativeWakeWord', `Audio device warning: ${data.message}`);
                this.emit('error', data.message);
              }
            }
          } catch (e) {}
        }
      });

      this.psProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) logger.warn('NativeWakeWord', msg);
      });

      this.psProcess.on('close', (code) => {
        logger.info('NativeWakeWord', `Process exited with code ${code}`);
        this.isRunning = false;
        this.psProcess = null;
      });
    } catch (err) {
      logger.error('NativeWakeWord', `Failed to spawn: ${err.message}`);
      this.isRunning = false;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.psProcess) {
      try { this.psProcess.kill(); } catch (e) {}
      this.psProcess = null;
    }
  }
}

module.exports = new NativeWakeWordEngine();
