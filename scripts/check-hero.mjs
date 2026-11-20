// Optional, dependency-free state tests. These do not replace browser/media-policy QA.
// Run from the project root: node scripts/check-hero.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/main.js', 'utf8');
const start = source.indexOf('  function initHeroVideo() {');
const end = source.indexOf('  function initAnimations()', start);
assert.ok(start >= 0 && end > start, 'Hero initializer must be available for state tests');
const initializer = source.slice(start, end);

class Events {
  listeners = new Map();
  addEventListener(name, callback, options = {}) {
    this.listeners.set(name, [...(this.listeners.get(name) || []), { callback, once: options.once }]);
  }
  emit(name) {
    for (const item of [...(this.listeners.get(name) || [])]) {
      if (item.once) this.listeners.set(name, this.listeners.get(name).filter(listener => listener !== item));
      item.callback();
    }
  }
}

function setup({ posterReady = true, reduced = false, blocked = false, observer = true, hidden = false } = {}) {
  const poster = Object.assign(new Events(), { complete: posterReady });
  const toggle = Object.assign(new Events(), { hidden: true, textContent: 'Pausar video' });
  const video = Object.assign(new Events(), {
    paused: true, hidden: true, muted: false, plays: 0,
    dataset: { src: 'video/hero-inicio.mp4?v=20261119-1' }
  });
  video.getAttribute = name => video[name] || null;
  video.closest = () => ({});
  video.play = () => {
    video.plays++;
    if (blocked) return Promise.reject(new Error('Browser blocked playback'));
    video.paused = false;
    video.emit('play');
    return Promise.resolve();
  };
  video.pause = () => {
    if (!video.paused) { video.paused = true; video.emit('pause'); }
  };
  const motion = Object.assign(new Events(), { matches: reduced });
  const document = Object.assign(new Events(), { hidden });
  document.getElementById = id => id === 'heroVideo' ? video : toggle;
  document.querySelector = () => poster;
  let intersection;
  class Observer {
    constructor(callback) { intersection = callback; }
    observe() {}
  }
  const window = observer ? { IntersectionObserver: Observer } : {};
  vm.runInNewContext(initializer + '\ninitHeroVideo();', { window, document, motion, IntersectionObserver: Observer });
  return { poster, toggle, video, motion, document, intersect: visible => intersection?.([{ isIntersecting: visible }]) };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
let count = 0;
async function check(name, run) { await run(); count++; console.log(`PASS: ${name}`); }

await check('no media request before the first visibility result', async () => {
  const state = setup();
  assert.equal(state.video.plays, 0);
  assert.equal(state.video.src, undefined);
  state.intersect(false);
  assert.equal(state.video.src, undefined);
  state.intersect(true); await settle();
  assert.equal(state.video.plays, 1);
  assert.equal(state.video.muted, true);
  assert.equal(state.video.hidden, false);
  state.intersect(true); await settle();
  assert.equal(state.video.plays, 1, 'already-playing media must not restart');
});

await check('poster completes before video source is assigned', async () => {
  const state = setup({ posterReady: false });
  state.intersect(true);
  assert.equal(state.video.src, undefined);
  state.poster.emit('load'); await settle();
  assert.equal(state.video.src, state.video.dataset.src);
  assert.equal(state.video.plays, 1);
});

await check('a poster error does not block the video fallback', async () => {
  const state = setup({ posterReady: false });
  state.intersect(true); state.poster.emit('error'); await settle();
  assert.equal(state.video.plays, 1);
});

await check('manual pause persists across scroll and visibility changes', async () => {
  const state = setup(); state.intersect(true); await settle();
  state.toggle.emit('click');
  assert.equal(state.video.paused, true);
  assert.equal(state.toggle.textContent, 'Reanudar video');
  state.intersect(false); state.intersect(true);
  state.document.hidden = true; state.document.emit('visibilitychange');
  state.document.hidden = false; state.document.emit('visibilitychange');
  assert.equal(state.video.plays, 1);
  state.toggle.emit('click'); await settle();
  assert.equal(state.video.plays, 2);
});

await check('finished video reveals the still and never repeats', async () => {
  const state = setup(); state.intersect(true); await settle();
  state.video.emit('ended');
  assert.equal(state.video.hidden, true);
  assert.equal(state.toggle.hidden, true);
  state.intersect(false); state.intersect(true); state.document.emit('visibilitychange');
  await settle(); assert.equal(state.video.plays, 1);
});

await check('media errors and blocked playback leave a static background', async () => {
  const error = setup(); error.intersect(true); await settle(); error.video.emit('error');
  assert.equal(error.video.hidden, true); assert.equal(error.toggle.hidden, true);
  const blocked = setup({ blocked: true }); blocked.intersect(true); await settle();
  assert.equal(blocked.video.hidden, true); assert.equal(blocked.toggle.hidden, true);
  blocked.intersect(true); await settle(); assert.equal(blocked.video.plays, 1);
});

await check('reduced motion prevents the initial video request', async () => {
  const state = setup({ reduced: true }); state.intersect(true); await settle();
  assert.equal(state.video.src, undefined); assert.equal(state.video.plays, 0);
  assert.equal(state.toggle.hidden, true);
});

await check('enabling reduced motion stops playback and keeps the still', async () => {
  const state = setup(); state.intersect(true); await settle();
  state.motion.matches = true; state.motion.emit('change');
  assert.equal(state.video.hidden, true); assert.equal(state.video.paused, true);
  state.motion.matches = false; state.intersect(true); await settle();
  assert.equal(state.video.plays, 1);
});

await check('poster gating works without IntersectionObserver', async () => {
  const state = setup({ observer: false, posterReady: false });
  assert.equal(state.video.src, undefined);
  state.poster.emit('load'); await settle(); assert.equal(state.video.plays, 1);
});

await check('a hidden document waits before requesting the video', async () => {
  const state = setup({ hidden: true }); state.intersect(true);
  assert.equal(state.video.src, undefined);
  state.document.hidden = false; state.document.emit('visibilitychange');
  await settle(); assert.equal(state.video.plays, 1);
});

console.log(`PASS: ${count} hero state checks; no browser or email requests were made.`);
