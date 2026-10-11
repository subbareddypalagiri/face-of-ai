// scratch/test-wake-word.js — Test suite for Wake Word spotting regex
'use strict';

const assert = require('assert');

console.log('=== [UNIN TEST SUITE] Wake-Word Spotting & Ambient Detection ===\n');

const wakeWordRegex = /\b(?:hey\s*unin|unin|buddy|hey\s*buddy|namaste\s*unin|namaste\s*buddy|hi\s*unin|ok\s*unin)\b/i;

const positiveSamples = [
  'Hey UNIN',
  'hey unin',
  'unin build a 3d website',
  'Buddy look at my screen',
  'hey buddy open antigravity',
  'namaste unin',
  'Namaste buddy whats up',
  'hi unin can you help me',
  'ok unin start watchdog',
  'yo hey unin wake up'
];

const negativeSamples = [
  'random sentence without trigger',
  'unintentional word',
  'buddhist temple',
  'unity game engine',
  'hello world'
];

console.log('[1/2] Testing positive wake-word triggers...');
positiveSamples.forEach(pHrase => {
  const match = pHrase.match(wakeWordRegex);
  assert(match !== null, 'Expected ' + pHrase + ' to trigger wake-word spotter!');
  console.log('  -> Match spotted: "' + match[0] + '" in "' + pHrase + '"');
});
console.log('  -> All positive triggers passed!\n');

console.log('[2/2] Testing negative controls (zero false positives)...');
negativeSamples.forEach(phrase => {
  const match = phrase.match(wakeWordRegex);
  assert(match === null, 'Expected ' + phrase + ' NOT to trigger wake-word spotter');
});
console.log('  -> All negative controls passed (0 false positives)!\n');

console.log('=== ALL WAKE-WORD TESTS PASSED (100% hit rate) ===');
