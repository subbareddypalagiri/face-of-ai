// src/main/tools/astra/core/UnifiedAILayer.js — Central Production AI Layer for Autonomous 3D Subsystem
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../../../../shared/Logger');

class UnifiedAILayer {
  constructor(options = {}) {
    this.configPath = options.configPath || path.resolve(__dirname, '../../../../../config.json');
    this.defaultModel = 'gemini-2.5-flash-lite';
    this.fallbackModels = ['gemini-2.5-flash', 'gemini-flash-latest'];
    this.timeoutMs = options.timeoutMs || 30000;
  }

  getConfig() {
    let cfg = {};
    try {
      if (fs.existsSync(this.configPath)) {
        cfg = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (e) {
      logger.warn(`[UnifiedAILayer] Could not read config from ${this.configPath}: ${e.message}`);
    }
    if (!cfg.gemini_key && (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY)) {
      cfg.gemini_key = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
    }
    return cfg;
  }

  /**
   * Cleans raw AI markdown output into parseable JSON
   */
  sanitizeJsonString(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let text = raw.trim();

    // Strip markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      text = fenceMatch[1].trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    // Handle common trailing commas in JSON
    text = text.replace(/,\s*([\]}])/g, '$1');

    return text;
  }

  /**
   * Synthesizes structured JSON with candidate model failover and JSON auto-repair
   */
  async synthesizeJson(systemPrompt, userPrompt, schemaValidator = null) {
    const cfg = this.getConfig();
    if (!cfg || !cfg.gemini_key) {
      logger.warn('[UnifiedAILayer] Gemini API key not found in config.json.');
      return { success: false, error: 'NO_API_KEY', fallback: true };
    }

    const candidateModels = [
      cfg.gemini_model || this.defaultModel,
      ...this.fallbackModels
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError = null;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini_key}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const reqBody = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json',
            maxOutputTokens: 8192
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Empty text content from Gemini candidate.');

        const cleanedJson = this.sanitizeJsonString(rawText);
        let parsed = null;

        try {
          parsed = JSON.parse(cleanedJson);
        } catch (jsonErr) {
          logger.warn(`[UnifiedAILayer] Model ${model} JSON parse warning: ${jsonErr.message}. Attempting bracket salvage...`);
          const bracketMatch = cleanedJson.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (bracketMatch) {
            parsed = JSON.parse(bracketMatch[1]);
          } else {
            throw jsonErr;
          }
        }

        if (schemaValidator && typeof schemaValidator === 'function') {
          const validation = schemaValidator(parsed);
          if (!validation.valid) {
            throw new Error(`Schema validation failed: ${validation.reason || 'Invalid structure'}`);
          }
        }

        return {
          success: true,
          data: parsed,
          model,
          rawTokens: rawText.length
        };
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        logger.warn(`[UnifiedAILayer] Model ${model} failed (${err.message}), trying next candidate...`);
      }
    }

    const isQuota = lastError && /429|resource_exhausted|quota/i.test(lastError.message);
    return {
      success: false,
      error: lastError ? lastError.message : 'All models failed',
      aiQuotaExceeded: !!isQuota,
      fallback: true
    };
  }

  /**
   * Synthesizes raw text or code blocks
   */
  async synthesizeCode(systemPrompt, userPrompt) {
    const cfg = this.getConfig();
    if (!cfg || !cfg.gemini_key) {
      return { success: false, error: 'NO_API_KEY', fallback: true };
    }

    const model = cfg.gemini_model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini_key}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { text: userPrompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
        }),
        signal: controller.signal
      });

      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let code = rawText;
      const match = rawText.match(/```(?:python|py)?([\s\S]*?)```/i);
      if (match) code = match[1].trim();

      return { success: true, code, model };
    } catch (err) {
      clearTimeout(timer);
      const isQuota = /429|resource_exhausted|quota/i.test(err.message);
      return { success: false, error: err.message, aiQuotaExceeded: !!isQuota, fallback: true };
    }
  }

  /**
   * Synthesizes structured JSON from multimodal image + text prompt
   *
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {Buffer|string} imageInput - Buffer or base64 string
   * @param {string} [mimeType='image/png']
   * @param {Function} [schemaValidator=null]
   * @returns {Promise<Object>}
   */
  async synthesizeMultimodal(systemPrompt, userPrompt, imageInput, mimeType = 'image/png', schemaValidator = null) {
    const cfg = this.getConfig();
    if (!cfg || !cfg.gemini_key) {
      logger.warn('[UnifiedAILayer] Gemini API key not found for multimodal synthesis.');
      return { success: false, error: 'NO_API_KEY', fallback: true };
    }

    if (!imageInput) {
      return { success: false, error: 'NO_IMAGE_INPUT', fallback: true };
    }

    const base64Data = Buffer.isBuffer(imageInput)
      ? imageInput.toString('base64')
      : (typeof imageInput === 'string' && imageInput.includes('base64,')
        ? imageInput.split('base64,')[1]
        : imageInput);

    const candidateModels = [
      cfg.gemini_model || 'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-flash-latest'
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError = null;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini_key}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const reqBody = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                { text: userPrompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            maxOutputTokens: 8192
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Empty text content from Gemini multimodal candidate.');

        const cleanedJson = this.sanitizeJsonString(rawText);
        let parsed = null;

        try {
          parsed = JSON.parse(cleanedJson);
        } catch (jsonErr) {
          logger.warn(`[UnifiedAILayer] Multimodal ${model} JSON parse warning: ${jsonErr.message}. Attempting bracket salvage...`);
          const bracketMatch = cleanedJson.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (bracketMatch) {
            parsed = JSON.parse(bracketMatch[1]);
          } else {
            throw jsonErr;
          }
        }

        if (schemaValidator && typeof schemaValidator === 'function') {
          const validation = schemaValidator(parsed);
          if (!validation.valid) {
            throw new Error(`Multimodal schema validation failed: ${validation.reason || 'Invalid structure'}`);
          }
        }

        return {
          success: true,
          data: parsed,
          model,
          rawTokens: rawText.length
        };
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        logger.warn(`[UnifiedAILayer] Multimodal model ${model} failed (${err.message}), trying next candidate...`);
      }
    }

    const isQuota = lastError && /429|resource_exhausted|quota/i.test(lastError.message);
    return {
      success: false,
      error: lastError ? lastError.message : 'All multimodal models failed',
      aiQuotaExceeded: !!isQuota,
      fallback: true
    };
  }
}

module.exports = { UnifiedAILayer };
