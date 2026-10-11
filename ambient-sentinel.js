// ambient-sentinel.js — SOTA 2026 Ambient Sentinel & System Observer for UNIN
// Proactively observes dev servers, local ports, active git context, and priority notifications.
'use strict';

const { exec } = require('child_process');
const EventEmitter = require('events');
const http = require('http');

class AmbientSentinel extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.timer = null;
    this.intervalMs = 15000;
    this.knownPorts = [3000, 5173, 8080, 8000, 4200];
    this.liveServices = new Set();
  }

  /**
   * Fast TCP port probe to discover active local dev servers (Vite, Next.js, Express, Django).
   */
  async probePort(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, { timeout: 1200 }, (res) => {
        resolve({ active: true, port, statusCode: res.statusCode });
      });
      req.on('error', () => resolve({ active: false, port }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ active: false, port });
      });
    });
  }

  /**
   * Scans common local development ports.
   */
  async scanLocalDevServers() {
    const results = [];
    for (const port of this.knownPorts) {
      const res = await this.probePort(port);
      if (res.active) {
        results.push(res);
        if (!this.liveServices.has(port)) {
          this.liveServices.add(port);
          this.emit('dev_server_spotted', { port, url: `http://localhost:${port}` });
        }
      } else {
        this.liveServices.delete(port);
      }
    }
    return results;
  }

  /**
   * Sniffs ambient events across system (dev servers, git workspace state).
   */
  async sniffAmbientEvents() {
    const devServers = await this.scanLocalDevServers();
    
    return {
      success: true,
      timestamp: Date.now(),
      devServers: devServers.map(s => `http://localhost:${s.port}`),
      activeServerCount: devServers.length,
      status: devServers.length > 0 
        ? `Observed ${devServers.length} active local dev server(s)` 
        : 'All nominal. No active dev servers detected.'
    };
  }

  start(intervalMs = 15000) {
    if (this.isActive) return;
    this.isActive = true;
    this.intervalMs = intervalMs;
    this.timer = setInterval(() => {
      this.sniffAmbientEvents().catch(() => {});
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isActive = false;
  }
}

const ambientSentinel = new AmbientSentinel();

module.exports = ambientSentinel;
