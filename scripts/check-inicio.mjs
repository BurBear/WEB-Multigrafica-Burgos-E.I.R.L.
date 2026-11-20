// State checks for the real process initializer. Not a browser rendering test.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/inicio.js', 'utf8');
const initializer = source.slice(source.indexOf('  function initProcess()'), source.indexOf('  function revealPhotos()'));
assert.ok(initializer.includes('function initProcess()'));
class Element {
  constructor(id = '') { this.id = id; this.attrs = {}; this.listeners = {}; this.hidden = false; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }
  click() { this.listeners.click(); }
  key(key) { let prevented = false; this.listeners.keydown({ key, preventDefault() { prevented = true; } }); return prevented; }
}
function setup({ reduced = false, fail = false, deferred = false, broken = false, observe = false } = {}) {
  const controls = new Element(); controls.hidden = true;
  const tabs = [0, 1, 2].map(i => new Element(`tab-${i}`));
  const pending = [];
  const images = [], preloadObservers = [];
  const panels = [0, 1, 2].map(i => {
    const panel = new Element(`panel-${i}`);
    const image = { complete: false, naturalWidth: 800, decode: () => broken ? Promise.reject(new Error('Missing image')) : deferred ? new Promise(resolve => { pending[i] = resolve; }) : Promise.resolve() };
    images.push(image);
    const heading = { id: `heading-${i}` };
    panel.querySelector = selector => selector === 'figure > img' ? image : selector === 'h3' ? heading : new Element();
    return panel;
  });
  const root = new Element();
  root.querySelector = () => controls;
  root.querySelectorAll = selector => selector === '[data-process-tab]' ? tabs : panels;
  if (fail) tabs[1].addEventListener = () => { throw new Error('Simulated enhancement failure'); };
  let animations = 0;
  class PreloadObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; preloadObservers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  vm.runInNewContext(initializer + '\ninitProcess();', {
    document: { querySelector: () => root },
    window: observe ? { IntersectionObserver: PreloadObserver } : {},
    IntersectionObserver: PreloadObserver,
    motion: { matches: reduced }, clearGhosts() {}, ghosts: new Set(),
    animate() { if (!reduced) animations++; return null; }
  });
  return { controls, tabs, panels, root, pending, images, preloadObservers, animations: () => animations };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const state = setup();
assert.equal(state.controls.hidden, false);
assert.deepEqual(state.panels.map(panel => panel.hidden), [false, true, true]);
assert.deepEqual(state.tabs.map(tab => tab.tabIndex), [0, -1, -1]);
state.tabs[1].click(); await settle();
assert.deepEqual(state.panels.map(panel => panel.hidden), [true, false, true]);
assert.equal(state.tabs[1].attrs['aria-selected'], 'true');
state.tabs[1].key('End'); await settle();
assert.equal(state.panels[2].hidden, false); assert.equal(state.tabs[2].focused, true);
state.tabs[2].key('ArrowRight'); await settle();
assert.equal(state.panels[0].hidden, false);
state.tabs[0].key('ArrowLeft'); await settle();
assert.equal(state.panels[2].hidden, false);
state.tabs[2].key('Home'); await settle();
assert.equal(state.panels[0].hidden, false);
assert.equal(state.tabs[0].key('Tab'), false, 'Do not trap normal Tab navigation');
const reduced = setup({ reduced: true }); reduced.tabs[2].click(); await settle();
assert.equal(reduced.panels[2].hidden, false); assert.equal(reduced.animations(), 0);
const failed = setup({ fail: true });
assert.equal(failed.controls.hidden, true);
assert.ok(failed.panels.every(panel => !panel.hidden));
assert.ok(failed.panels.every(panel => !panel.attrs.role));
// Decode is deliberately delayed: no empty panel, stale result or mismatched ARIA.
const racing = setup({ deferred: true });
racing.tabs[1].click();
assert.equal(racing.panels[0].hidden, false);
assert.equal(racing.tabs[0].attrs['aria-selected'], 'true');
assert.equal(racing.root.attrs['aria-busy'], 'true');
racing.tabs[2].click();
racing.pending[2](); await settle();
assert.equal(racing.panels[2].hidden, false);
racing.pending[1](); await settle();
assert.equal(racing.panels[2].hidden, false, 'Stale decode must not win');
assert.equal(racing.tabs[2].attrs['aria-selected'], 'true');
assert.equal(racing.root.attrs['aria-busy'], 'false');
const canceled = setup({ deferred: true });
canceled.tabs[1].click(); canceled.tabs[0].click();
canceled.pending[1](); await settle();
assert.equal(canceled.panels[0].hidden, false, 'Returning to the displayed image cancels pending changes');
const brokenImage = setup({ broken: true });
brokenImage.tabs[1].click(); await settle();
assert.equal(brokenImage.panels[0].hidden, false);
assert.equal(brokenImage.tabs[0].attrs['aria-selected'], 'true');
assert.equal(brokenImage.root.attrs['aria-busy'], 'false');
assert.equal(state.controls.attrs['aria-orientation'], 'vertical');
const preloading = setup({ observe: true });
assert.ok(preloading.images.every(image => !image.loading), 'No process preload during initial hero rendering');
assert.equal(preloading.preloadObservers.length, 1);
const preloadObserver = preloading.preloadObservers[0];
assert.equal(preloadObserver.options.rootMargin, '400px 0px');
preloadObserver.callback([{ isIntersecting: false }]);
assert.ok(preloading.images.every(image => !image.loading));
preloadObserver.callback([{ isIntersecting: true }]); await settle();
assert.ok(preloading.images.every(image => image.loading === 'eager'));
assert.equal(preloadObserver.disconnected, true);
console.log('PASS: slow decoding preserves the displayed panel; rapid selections ignore stale results; failed images retain the previous photograph and ARIA selection.');
console.log('PASS: process preload starts only near the section and disconnects after warming the three images.');
const measure = source.slice(source.indexOf('  function measureHeader()'), source.indexOf('  function enterHero()'));
let headerHeight = 84;
let measured;
let resized;
vm.runInNewContext(measure + '\nmeasureHeader();', {
  document: {
    getElementById: () => ({ getBoundingClientRect: () => ({ height: headerHeight }) }),
    body: { style: { setProperty(name, value) { assert.equal(name, '--home-header-height'); measured = value; } } }
  },
  window: { ResizeObserver: true },
  ResizeObserver: class { constructor(callback) { resized = callback; } observe() {} }
});
assert.equal(measured, '84px');
headerHeight = 74; resized(); assert.equal(measured, '74px');
const animator = source.slice(source.indexOf('  function animate('), source.indexOf('  function clearGhosts()'));
let animationResult;
vm.runInNewContext(animator + '\nresult(animate(element, []));', {
  motion: { matches: false }, running: new Set(), result(value) { animationResult = value; },
  element: { animate() { throw new Error('Simulated WAAPI failure'); } }
});
assert.equal(animationResult, null, 'Animation failure must not prevent the base content from rendering');
console.log('PASS: real process initializer: initial selection, click, arrow wrapping, Home/End, focus, normal Tab, reduced motion and readable fallback after failure.');
console.log('PASS: real header measurement updates after resize; animation API failure degrades without a hidden-content state.');

// Exercise the actual reveal controllers with deterministic intersection events.
const reveals = source.slice(source.indexOf('  function revealPhotos()'), source.indexOf('  const stopMotion'));
function checkReveals(reduced = false) {
  const observers = [], calls = [];
  const node = (heading = false) => ({
    dataset: {}, hasAttribute: () => heading,
    querySelector: () => ({}), parentElement: { querySelector: () => ({}) }
  });
  const photos = Array.from({ length: 3 }, () => node());
  const frames = Array.from({ length: 3 }, () => node());
  const items = Array.from({ length: 6 }, () => node());
  const heading = node(true);
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    intersect() { this.callback([...this.targets].map(target => ({ target, isIntersecting: true }))); }
  }
  vm.runInNewContext(reveals + '\nrevealPhotos(); revealDetails(); revealSectors();', {
    motion: { matches: reduced }, window: { IntersectionObserver: Observer }, IntersectionObserver: Observer,
    document: {
      querySelectorAll: () => photos,
      querySelector: selector => selector === '[data-home-details]' ? {
        querySelectorAll: () => frames, querySelector: () => heading
      } : { querySelectorAll: () => items }
    },
    animate(element, frames, options) { calls.push({ element, frames, options }); }
  });
  if (reduced) { assert.equal(observers.length, 0); assert.equal(calls.length, 0); return; }
  assert.deepEqual(observers.map(observer => observer.targets.size), [3, 4, 6]);
  const targets = observers.flatMap(observer => [...observer.targets]);
  assert.equal(new Set(targets).size, targets.length, 'Reveal controllers must not share targets');
  observers.forEach(observer => observer.intersect());
  const firstCount = calls.length;
  observers.forEach(observer => observer.intersect());
  assert.equal(calls.length, firstCount, 'Entrances must unobserve and never loop on re-entry');
  const masks = calls.filter(call => frames.includes(call.element));
  assert.equal(masks.length, 3);
  assert.ok(masks.every(call => call.options.duration >= 650 && call.options.duration <= 850));
  assert.ok(masks.every(call => call.frames[0].clipPath && !call.frames[0].transform), 'Editorial masks must not move the photo frames');
  assert.deepEqual(masks.map(call => call.options.delay), [0, 80, 160]);
}
checkReveals(); checkReveals(true);
console.log('PASS: disjoint reveal targets, one-shot entrances, staggered editorial masks (650–850 ms), and no reveal observers in reduced motion.');
