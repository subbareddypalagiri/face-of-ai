// src/shared/Logger.js — Production-Grade Structured Logger for UNIN
'use strict';

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(options = {}) {
    this.name = options.name || 'UNIN';
    this.minLevel = LOG_LEVELS[options.minLevel] !== undefined ? LOG_LEVELS[options.minLevel] : LOG_LEVELS.INFO;
    this.logFile = options.logFile || path.resolve(__dirname, '../../logs/unin.log');
    this._ensureLogDirectory();
  }

  _ensureLogDirectory() {
    try {
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      // Benign fallback if filesystem restricted
    }
  }

  _format(level, message, meta) {
    const timestamp = new Date().toISOString();
    let metaStr = '';
    if (meta !== undefined && meta !== null) {
      if (meta instanceof Error) {
        metaStr = ` | ${meta.stack || meta.message}`;
      } else if (typeof meta === 'object') {
        try {
          metaStr = ` | ${JSON.stringify(meta)}`;
        } catch (e) {
          metaStr = ` | [Circular/Unserializable Meta]`;
        }
      } else {
        metaStr = ` | ${meta}`;
      }
    }
    return `[${timestamp}] [${level}] [${this.name}] ${message}${metaStr}`;
  }

  _write(level, message, meta) {
    const formatted = this._format(level, message, meta);

    // Console output
    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Append to file asynchronously
    try {
      fs.appendFile(this.logFile, formatted + '\n', 'utf8', () => {});
    } catch (e) {}
  }

  debug(message, meta) {
    if (this.minLevel <= LOG_LEVELS.DEBUG) this._write('DEBUG', message, meta);
  }

  info(message, meta) {
    if (this.minLevel <= LOG_LEVELS.INFO) this._write('INFO', message, meta);
  }

  warn(message, meta) {
    if (this.minLevel <= LOG_LEVELS.WARN) this._write('WARN', message, meta);
  }

  error(message, meta) {
    if (this.minLevel <= LOG_LEVELS.ERROR) this._write('ERROR', message, meta);
  }
}

module.exports = new Logger();
module.exports.Logger = Logger;
module.exports.LOG_LEVELS = LOG_LEVELS;
