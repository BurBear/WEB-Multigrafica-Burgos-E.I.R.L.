// Read-only checks for the buildless site. Run: node scripts/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

for (const script of ['js/main.js', 'js/validacion.js']) {
  execFileSync(process.execPath, ['--check', script], { stdio: 'pipe' });
}
const pages = ['index.html', 'nosotros.html', 'productos.html', 'servicios.html', 'cotizacion.html', 'gracias.html'];
const contents = new Map(pages.map(file => [file, fs.readFileSync(file, 'utf8')]));
const localTarget = (ref, page = 'index.html') => path.resolve('.' + decodeURIComponent(new URL(ref, `https://local.test/${page}`).pathname));

function imageSize(file) {
  const bytes = fs.readFileSync(file);
  if (path.extname(file).toLowerCase() === '.png') {
    assert.ok(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${file}: invalid PNG signature`);
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  }
  if (path.extname(file).toLowerCase() !== '.webp') return null;
  assert.ok(bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', `${file}: extension says WebP but bytes do not`);
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const payload = offset + 8;
    assert.ok(payload + length <= bytes.length, `${file}: truncated WebP chunk`);
    if (type === 'VP8X') return [1 + bytes.readUIntLE(payload + 4, 3), 1 + bytes.readUIntLE(payload + 7, 3)];
    if (type === 'VP8 ') return [bytes.readUInt16LE(payload + 6) & 0x3fff, bytes.readUInt16LE(payload + 8) & 0x3fff];
    if (type === 'VP8L') {
      const packed = bytes.readUInt32LE(payload + 1);
      return [(packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1];
    }
    offset = payload + length + (length % 2);
  }
  assert.fail(`${file}: missing WebP image dimensions`);
}

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate IDs`);
  for (const match of html.matchAll(/(?:src|data-src|href|poster)="([^"]+)"/g)) {
    const ref = match[1];
    if (ref.startsWith('#')) { assert.ok(ids.includes(ref.slice(1)), `${file}: missing anchor ${ref}`); continue; }
    if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
    const url = new URL(ref.replaceAll('&amp;', '&'), `https://local.test/${file}`);
    const target = path.resolve('.' + decodeURIComponent(url.pathname));
    assert.ok(fs.existsSync(target), `${file}: missing ${ref}`);
    if (url.hash && url.pathname.endsWith('.html')) {
      assert.ok(fs.readFileSync(target, 'utf8').includes(`id="${url.hash.slice(1)}"`), `${file}: missing cross-page anchor ${ref}`);
    }
  }
  for (const [, candidates] of html.matchAll(/(?:imagesrcset|srcset)="([^"]+)"/g)) {
    for (const candidate of candidates.split(',')) {
      const [ref, descriptor] = candidate.trim().split(/\s+/);
      const target = localTarget(ref, file);
      assert.ok(fs.existsSync(target), `${file}: missing srcset image ${ref}`);
      const dimensions = imageSize(target);
      if (dimensions && /^\d+w$/.test(descriptor)) assert.equal(dimensions[0], Number(descriptor.slice(0, -1)), `${file}: wrong srcset width for ${ref}`);
    }
  }
  for (const [, tag] of html.matchAll(/(<img\b[^>]+>)/g)) {
    assert.ok(/\bwidth=/.test(tag) && /\bheight=/.test(tag), `${file}: image dimensions required`);
    assert.ok(/\balt=/.test(tag), `${file}: image alt required`);
    const source = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (source && !/^(https?:|data:)/.test(source)) {
      const dimensions = imageSize(localTarget(source, file));
      if (dimensions) assert.deepEqual(dimensions, [Number(tag.match(/\bwidth="(\d+)"/)[1]), Number(tag.match(/\bheight="(\d+)"/)[1])], `${file}: declared image dimensions differ from the actual file`);
    }
  }
  assert.ok(html.includes('css/style.css?v='), `${file}: CSS must be versioned`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: one primary heading`);
  assert.ok(!/gsap|ScrollTrigger/.test(html), `${file}: animations must not require a CDN`);
  if (file !== 'gracias.html') {
    const expectedURL = `https://www.multigraficaburgos.pe/${file === 'index.html' ? '' : file}`;
    assert.ok(html.includes(`rel="canonical" href="${expectedURL}"`), `${file}: canonical must use the selected www domain`);
    assert.ok(html.includes(`property="og:url" content="${expectedURL}"`), `${file}: Open Graph URL must match canonical`);
    const nav = html.match(/<nav id="desktopNav"[\s\S]*?<\/nav>/)[0];
    for (const target of pages.slice(0, 5)) assert.ok(nav.includes(`href="${target}"`), `${file}: missing page navigation`);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1);
  }
}
const html = [...contents.values()].join('\n');
const catalog = contents.get('productos.html');
const catalogIds = [...catalog.matchAll(/data-product-index="(\d+)"/g)].map(match => match[1]);
assert.equal(catalogIds.length, 16, 'Expected 16 products');
assert.equal(new Set(catalogIds).size, 16, 'Product IDs must be unique');
for (const [, slug] of html.matchAll(/data-product-slug="([^"]+)"/g)) {
  for (const image of [2, 3, 4]) assert.ok(fs.existsSync(`img/productos/${slug}-${image}.webp`), `Missing gallery image ${slug}-${image}`);
}
for (const id of ['inicio', 'nosotros', 'porque-mb', 'productos', 'servicios', 'procesos', 'sectores', 'clientes', 'cotizacion']) {
  assert.ok(html.includes(`id="${id}"`), `Original anchor ${id} must remain`);
}
const form = contents.get('cotizacion.html').match(/<form id="formCotizacion"[\s\S]*?<\/form>/)?.[0];
assert.ok(form?.includes('action="https://formsubmit.co/ventasmultigraficaburgos@gmail.com"'));
assert.ok(form.includes('method="POST"'));
assert.deepEqual([...form.matchAll(/\bname="([^"]+)"/g)].map(match => match[1]), ['nombre', 'celular', 'correo', 'empresa', 'ruc', 'servicio', 'mensaje', '_captcha', '_next']);
assert.ok(form.includes('https://www.multigraficaburgos.pe/gracias.html'));
assert.equal((html.match(/class="client-logo"/g) || []).length, 34);
for (const [file, content] of contents) {
  const videos = [...content.matchAll(/<video\b[^>]*>/g)];
  assert.ok(videos.length <= 1, `${file}: at most one background video`);
  for (const [tag] of videos) assert.ok(/preload="none"/.test(tag), `${file}: video must not preload before initialization`);
}
assert.ok(!/\bautoplay\b/.test(html));
assert.ok(!/src="video\/(preprensa|prensa|postprensa|fondo)\.mp4"/.test(html));
assert.ok(!/src="img\/clientes\/[^" ]+\.png"/.test(html));
assert.ok(fs.readFileSync('gracias.html', 'utf8').includes('name="robots" content="noindex"'));
const sitemapURLs = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(sitemapURLs, pages.slice(0, 5).map(file => `https://www.multigraficaburgos.pe/${file === 'index.html' ? '' : file}`), 'Sitemap must contain the five public canonical pages');
assert.ok(fs.readFileSync('robots.txt', 'utf8').includes('Sitemap: https://www.multigraficaburgos.pe/sitemap.xml'));
console.log('PASS: JavaScript syntax, local assets and srcset, actual PNG/WebP formats and dimensions, anchors, 16 products, 48 gallery images, unchanged form contract, 34 logos, canonical URLs and sitemap.');
