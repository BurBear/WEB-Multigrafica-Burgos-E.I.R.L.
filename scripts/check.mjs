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
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate IDs`);
  for (const match of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
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
      assert.ok(fs.existsSync(candidate.trim().split(/\s+/)[0]), `${file}: missing srcset image`);
    }
  }
  for (const [, tag] of html.matchAll(/(<img\b[^>]+>)/g)) {
    assert.ok(/\bwidth=/.test(tag) && /\bheight=/.test(tag), `${file}: image dimensions required`);
    assert.ok(/\balt=/.test(tag), `${file}: image alt required`);
  }
  assert.ok(html.includes('css/style.css?v='), `${file}: CSS must be versioned`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: one primary heading`);
  assert.ok(!/gsap|ScrollTrigger/.test(html), `${file}: animations must not require a CDN`);
  if (file !== 'gracias.html') {
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
assert.equal((html.match(/<video\b/g) || []).length, 1);
assert.ok(/<video[^>]+preload="none"/.test(html));
assert.ok(!/\bautoplay\b/.test(html));
assert.ok(!/src="video\/(preprensa|prensa|postprensa|fondo)\.mp4"/.test(html));
assert.ok(!/src="img\/clientes\/[^" ]+\.png"/.test(html));
assert.ok(fs.readFileSync('gracias.html', 'utf8').includes('name="robots" content="noindex"'));
console.log('PASS: JavaScript syntax, local assets, anchors, unique product IDs, 48 gallery images, dimensions, form contract, 34 logos, versioning and on-demand video.');
