// browser-agent.js — Aura's Autonomous Browser Action Engine
// Uses Playwright + CDP to control any open browser tab
'use strict';
let chromium = null;
try {
  const pw = require('playwright');
  chromium = pw.chromium;
} catch (err) {
  console.warn('[BrowserAgent] Playwright not found or disabled:', err.message);
}
const path = require('path');
const fs = require('fs');

const USER_DATA_DIR = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || 'C:\\Users\\subba', 'UNIN_Browser_Profile');

let browser = null;
let context = null;
let activePage = null;

async function setupAdShield(ctx) {
  if (!ctx || ctx.__unin_ad_shield_ready) return;
  ctx.__unin_ad_shield_ready = true;
  try {
    await ctx.addInitScript(() => {
      if (window.__unin_ad_shield_installed) return;
      window.__unin_ad_shield_installed = true;
      const skipSelectors = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-skip-ad-button',
        '[id^="skip-button:"] button',
        '.ytp-ad-skip-button-container button',
        'button.ytp-ad-skip-button-modern',
        '.ytp-ad-overlay-close-button',
        '[aria-label*="Skip ad" i]',
        '[aria-label*="Skip" i]'
      ];
      let wasMutedByShield = false;

      function runAdShield() {
        try {
          const isAd = !!document.querySelector('.ad-showing, .ad-interrupting, ytd-action-companion-ad-renderer');
          const video = document.querySelector('video');

          if (isAd || (video && video.duration && video.duration <= 60 && document.querySelector('.ytp-ad-player-overlay'))) {
            if (video) {
              if (!video.muted) {
                video.muted = true;
                wasMutedByShield = true;
              }
              video.playbackRate = 16.0;
              if (video.duration && !isNaN(video.duration) && video.currentTime < video.duration - 0.2) {
                video.currentTime = video.duration - 0.1;
              }
            }
            for (const sel of skipSelectors) {
              const btns = document.querySelectorAll(sel);
              for (const b of btns) {
                if (b && typeof b.click === 'function') b.click();
              }
            }
          } else {
            if (video && wasMutedByShield) {
              video.muted = false;
              wasMutedByShield = false;
              video.playbackRate = 1.0;
            }
          }

          const adElements = document.querySelectorAll('#player-ads, .ytp-ad-module:not(:empty), ytd-ad-slot-renderer, #masthead-ad, .ytd-banner-promo-renderer, ytd-in-feed-ad-layout-renderer');
          for (const el of adElements) {
            if (el.style.display !== 'none') el.style.display = 'none';
          }
        } catch (e) {}
      }

      setInterval(runAdShield, 100);
      const observer = new MutationObserver(runAdShield);
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        });
      }
    });
  } catch (e) {}
}

async function ensureBrowser() {
  if (!chromium) {
    throw new Error('Playwright chromium engine is not available.');
  }
  if (!context || (context.pages && context.pages().length === 0 && (!browser || !browser.isConnected()))) {
    const launchArgs = [
      '--start-maximized',
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
      '--test-type',
      '--hide-crash-restore-bubble',
      '--disable-session-crashed-bubble',
      '--disable-infobars',
      '--no-default-browser-check'
    ];
    try {
      if (!fs.existsSync(USER_DATA_DIR)) {
        fs.mkdirSync(USER_DATA_DIR, { recursive: true });
      }
      context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        channel: 'chrome',  // use installed Chrome if available, fallback to Chromium
        args: launchArgs,
        ignoreDefaultArgs: ['--enable-automation'],
        viewport: null,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      });
      await setupAdShield(context);
      const pages = context.pages();
      activePage = pages.length > 0 ? pages[0] : await context.newPage();
      browser = context.browser ? context.browser() : null;
    } catch (persistentErr) {
      console.warn('[BrowserAgent] Persistent context launch warning (falling back to standard):', persistentErr.message);
      browser = await chromium.launch({
        headless: false,
        channel: 'chrome',
        args: launchArgs,
        ignoreDefaultArgs: ['--enable-automation'],
      });
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: null,
      });
      await setupAdShield(context);
      activePage = await context.newPage();
    }
  }
  return { browser, context, activePage };
}

async function getPage() {
  const { activePage: p } = await ensureBrowser();
  return p;
}

/**
 * Finds an already opened tab with YouTube in the browser context.
 * If found, brings it to front and reuses it without opening a new tab or reloading.
 */
async function getYouTubePage() {
  const { context } = await ensureBrowser();
  if (context) {
    const pages = context.pages();
    for (const p of pages) {
      if (p.url().includes('youtube.com')) {
        await p.bringToFront().catch(() => {});
        activePage = p;
        return p;
      }
    }
  }
  return await getPage();
}

// ── Core Browser Actions ─────────────────────────────────────

async function navigateTo(url) {
  const page = await getPage();
  if (!url.startsWith('http')) url = 'https://' + url;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return { success: true, url: page.url(), title: await page.title() };
}

async function searchYouTube(query) {
  const page = await getYouTubePage();
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  // Click first real video result
  await page.waitForSelector('ytd-video-renderer a#video-title', { timeout: 8000 });
  await page.click('ytd-video-renderer a#video-title');
  await page.waitForTimeout(2000);
  return { success: true, title: await page.title() };
}

async function clickElement(selector) {
  const page = await getPage();
  await page.waitForSelector(selector, { timeout: 5000 });
  await page.click(selector);
  return { success: true };
}

async function youtubePlayPause() {
  const page = await getYouTubePage();
  const url = page.url();
  if (!url.includes('youtube.com')) return { success: false, reason: 'Not on YouTube' };
  // Click on video player to play/pause
  await page.keyboard.press('k');
  return { success: true, action: 'play_pause_toggled' };
}

async function youtubeSkipAd() {
  const page = await getYouTubePage();
  const url = page.url();
  if (!url.includes('youtube.com')) return { success: false, reason: 'Not on YouTube' };
  try {
    const res = await page.evaluate(() => {
      const video = document.querySelector('video');
      const skip = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, [id^="skip-button:"] button, .ytp-skip-ad-button');
      const isAd = !!document.querySelector('.ad-showing, .ad-interrupting');
      if (video && (isAd || skip)) {
        video.muted = true;
        video.playbackRate = 16.0;
        if (video.duration) video.currentTime = video.duration;
      }
      if (skip) skip.click();
      return { skipped: !!skip, accelerated: true };
    });
    return { success: true, action: 'ad_accelerated_and_skipped', details: res };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

async function youtubeNextVideo() {
  const page = await getPage();
  const url = page.url();
  if (!url.includes('youtube.com')) return { success: false };
  await page.keyboard.press('Shift+n');
  return { success: true, action: 'next_video' };
}

async function youtubeVolumeUp() {
  const page = await getPage();
  await page.keyboard.press('ArrowUp');
  return { success: true };
}

async function youtubeVolumeDown() {
  const page = await getPage();
  await page.keyboard.press('ArrowDown');
  return { success: true };
}

async function youtubeFullscreen() {
  const page = await getPage();
  await page.keyboard.press('f');
  return { success: true };
}

async function searchGoogle(query) {
  const page = await getPage();
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return { success: true, title: await page.title() };
}

async function clickFirstResult() {
  const page = await getPage();
  await page.waitForSelector('h3', { timeout: 5000 });
  await page.click('h3');
  await page.waitForTimeout(1500);
  return { success: true, url: page.url(), title: await page.title() };
}

async function typeText(text) {
  const page = await getPage();
  await page.keyboard.type(text, { delay: 40 });
  return { success: true };
}

async function pressEnter() {
  const page = await getPage();
  await page.keyboard.press('Enter');
  return { success: true };
}

async function scrollDown() {
  const page = await getPage();
  await page.keyboard.press('Space');
  return { success: true };
}

async function scrollUp() {
  const page = await getPage();
  await page.keyboard.press('Shift+Space');
  return { success: true };
}

async function readPageContent() {
  const page = await getPage();
  const url = page.url();
  const title = await page.title();
  // Extract visible text content (limit to 2000 chars for AI)
  const content = await page.evaluate(() => {
    const body = document.body;
    const cloneNode = body.cloneNode(true);
    // Remove scripts, styles, iframes
    cloneNode.querySelectorAll('script, style, iframe, nav, footer, header').forEach(el => el.remove());
    return cloneNode.innerText?.trim().substring(0, 2500) || '';
  });
  return { success: true, url, title, content };
}

async function getCurrentPageInfo() {
  const page = await getPage();
  return {
    success: true,
    url: page.url(),
    title: await page.title(),
  };
}

async function closeBrowser() {
  if (context) {
    await context.close().catch(() => {});
    context = null;
    activePage = null;
  }
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
  return { success: true };
}

// ── Dispatcher: Gemini routes here ──────────────────────────
async function executeAction(action, params = {}) {
  try {
    switch (action) {
      case 'navigate':         return await navigateTo(params.url || params.query || '');
      case 'search_youtube':   return await searchYouTube(params.query || '');
      case 'search_google':    return await searchGoogle(params.query || '');
      case 'click_first':      return await clickFirstResult();
      case 'click':            return await clickElement(params.selector || '');
      case 'type':             return await typeText(params.text || '');
      case 'press_enter':      return await pressEnter();
      case 'scroll_down':      return await scrollDown();
      case 'scroll_up':        return await scrollUp();
      case 'yt_play_pause':    return await youtubePlayPause();
      case 'yt_skip_ad':       return await youtubeSkipAd();
      case 'yt_next':          return await youtubeNextVideo();
      case 'yt_volume_up':     return await youtubeVolumeUp();
      case 'yt_volume_down':   return await youtubeVolumeDown();
      case 'yt_fullscreen':    return await youtubeFullscreen();
      case 'read_page':        return await readPageContent();
      case 'get_page_info':    return await getCurrentPageInfo();
      case 'close_browser':    return await closeBrowser();
      default:
        return { success: false, reason: `Unknown action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { executeAction, ensureBrowser, getPage, getYouTubePage };
