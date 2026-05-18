// content.js - Crystal Clear Frame Layer & Dynamic Web Scraper Bridge

console.log("LS01 Clean Frame Overlay Mounting...");

const oldRoot = document.getElementById('avatar-companion-pure-root');
if (oldRoot) oldRoot.remove();

const container = document.createElement('div');
container.id = 'avatar-companion-pure-root';
container.style.position = 'fixed';
container.style.bottom = '20px';
container.style.right = '20px';
container.style.width = '360px';
container.style.height = '520px';
container.style.zIndex = '9999999';
container.style.pointerEvents = 'none'; 
container.style.background = 'transparent';

const iframe = document.createElement('iframe');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';
iframe.style.setProperty('background', 'transparent', 'important');
iframe.style.setProperty('background-color', 'transparent', 'important');
iframe.style.pointerEvents = 'auto';     
iframe.setAttribute('allowtransparency', 'true');

iframe.src = chrome.runtime.getURL('widget.html');
container.appendChild(iframe);
document.body.appendChild(container);

// NATIVE SCREEN SCRAPER LOGIC BOUNDS
const observer = new MutationObserver(() => {
  const chatgptTurns = document.querySelectorAll('.agent-turn .markdown');
  const geminiTurns = document.querySelectorAll('.model-response-text');

  let rawText = "";
  if (chatgptTurns.length > 0) {
    rawText = chatgptTurns[chatgptTurns.length - 1].innerText;
  } else if (geminiTurns.length > 0) {
    rawText = geminiTurns[geminiTurns.length - 1].innerText;
  }

  if (rawText && window.lastCapturedText !== rawText) {
    window.lastCapturedText = rawText;
    
    iframe.contentWindow.postMessage({
      type: 'NATIVE_PAGE_RESPONSE',
      text: rawText
    }, '*');
  }
});

observer.observe(document.body, { childList: true, subtree: true });