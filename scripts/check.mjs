// Read-only checks for the buildless site. Run: node scripts/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

for (const script of ['js/main.js', 'js/validacion.js', 'js/inicio.js']) {
  execFileSync(process.execPath, ['--check', script], { stdio: 'pipe' });
}
const pages = ['index.html', 'nosotros.html', 'productos.html', 'servicios.html', 'cotizacion.html', 'gracias.html'];
const contents = new Map(pages.map(file => [file, fs.readFileSync(file, 'utf8')]));
// Valid UTF-8 alone does not catch characters already replaced by ASCII '?'.
function checkSpanishText(file, source) {
  const readable = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  const labels = [...source.matchAll(/\b(?:alt|aria-label|title|placeholder)="([^"]*)"/g)].map(match => match[1]);
  const text = [readable, ...labels].join('\n');
  assert.ok(!/[\p{L}]\?[\p{L}]/u.test(text), `${file}: a letter was replaced by '?' in readable text`);
  assert.ok(!/\uFFFD|\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2\u20AC/.test(text), `${file}: corrupted text encoding`);
}
for (const file of [...pages, 'css/style.css', 'css/inicio.css', 'js/main.js', 'js/validacion.js', 'js/inicio.js']) {
  const source = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
  assert.ok(!source.includes('\uFFFD'), `${file}: replacement character found`);
  if (file.endsWith('.html')) {
    assert.ok(/<meta charset="UTF-8"\s*\/?\s*>/i.test(source), `${file}: UTF-8 declaration required`);
    checkSpanishText(file, source);
  }
}
// Guard against the actual regression while permitting query strings and punctuation.
assert.throws(() => checkSpanishText('regression fixture', '<h2>M?s de 20 a?os</h2>'));
checkSpanishText('valid fixture', '<a href="cotizacion.html?producto=Agenda">\u00bfCotizamos?</a>');
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
for (const id of ['inicio', 'nosotros', 'porque-mb', 'productos', 'servicios', 'sectores', 'clientes', 'cotizacion']) {
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
// Home prototype: protect the approved media and isolate its visual changes.
const home = contents.get('index.html');
for (const text of ['La calidad est\u00e1 en', 'De la idea', 'Preprensa', 'cat\u00e1logo', 'conversaci\u00f3n']) {
  assert.ok(home.includes(text), `Home: expected Spanish text missing: ${text}`);
}
assert.ok(home.includes('css/inicio.css?v='));
for (const [page, content] of contents) {
  if (page !== 'index.html') assert.ok(!content.includes('css/inicio.css'), `${page}: home styles must stay isolated`);
  if (page !== 'index.html') assert.ok(!content.includes('js/inicio.js'), `${page}: home controller must stay isolated`);
}
const homeCSS = fs.readFileSync('css/inicio.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
for (const [, selector] of homeCSS.matchAll(/([^{}]+)\{/g)) {
  if (selector.trim().startsWith('@media')) continue;
  for (const part of selector.split(/,(?![^()]*\))/)) assert.ok(part.trim().startsWith('body[data-page="inicio"] '), `Unscoped home selector: ${part}`);
}
const homeHero = home.match(/<section id="inicio"[\s\S]*?<\/section>/)[0];
assert.ok(!/data-reveal|data-stagger/.test(homeHero), 'Hero copy must remain visible from the first render');
const sectionIDs = [...home.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(sectionIDs, ['inicio', 'presentacion', 'soluciones', 'destacados', 'sectores']);
assert.equal((home.match(/class="sector-item"/g) || []).length, 6);
const details = home.match(/<section id="presentacion"[\s\S]*?<\/section>/)[0];
assert.deepEqual([...details.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => match[1]), ['Materiales', 'Color', 'Acabados']);
assert.equal((details.match(/data-detail-media/g) || []).length, 3);
assert.ok(!/data-reveal|data-stagger|provisional|preprensa-800/.test(details), 'Details use their own animation and no public placeholder notice or old machinery');
assert.ok(!details.includes('Papeles que transmiten'), 'Removed details paragraph must stay removed');
const sectors = home.match(/<section id="sectores"[\s\S]*?<\/section>/)[0];
assert.ok(sectors.includes('data-home-sectors'));
assert.ok(!sectors.includes('data-stagger'), 'Sector articles have only their dedicated reveal owner');
assert.equal((sectors.match(/class="home-sector-rule"/g) || []).length, 6);
assert.ok(details.includes('data-detail-heading'));
assert.ok(!details.includes('<svg'), 'Details must show the selected photographs instead of illustrations');
assert.ok(!details.includes('home-detail-number'), 'Secondary numbering must not return');
const detailPhotos = [...details.matchAll(/<img\b[^>]+>/g)].map(match => match[0]);
assert.equal(detailPhotos.length, 3);
for (const [index, slug] of ['materiales', 'color', 'acabados'].entries()) {
  const tag = detailPhotos[index];
  const base = `img/inicio/detalles/${slug}`;
  assert.ok(tag.includes(`src="${base}.webp"`));
  assert.ok(tag.includes(`srcset="${base}-560.webp 560w, ${base}.webp 1122w"`));
  assert.ok(tag.includes('loading="lazy"') && tag.includes('width="1122" height="1402"'));
  assert.deepEqual(imageSize(`${base}-560.webp`), [560, 700]);
  assert.deepEqual(imageSize(`${base}.webp`), [1122, 1402]);
}
assert.ok(contents.get('nosotros.html').includes('M\u00e1s de 20 a\u00f1os'), 'Company history remains in Nosotros');
assert.equal((home.match(/class="home-feature(?: home-feature-main)?"/g) || []).length, 3);
assert.ok(home.includes('js/inicio.js?v='));
assert.equal((homeHero.match(/data-hero-line/g) || []).length, 3);
assert.ok(!/homeHeroHidden|hero-pending/.test(homeCSS));
assert.ok(homeCSS.includes('100dvh - var(--home-header-height'));
const processSection = home.match(/<section id="soluciones"[\s\S]*?<\/section>/)[0];
assert.equal((processSection.match(/data-process-tab\b/g) || []).length, 3);
assert.equal((processSection.match(/data-process-panel\b/g) || []).length, 3);
assert.deepEqual([...processSection.matchAll(/<strong>([^<]+)<\/strong>/g)].map(match => match[1]), ['Preprensa', 'Prensa', 'Postprensa']);
assert.ok(!/home-process-caption|home-process-intro|home-process-note|Cada detalle cuenta/.test(processSection), 'Process layout must contain only photos, stage choices and actions');
assert.ok(processSection.includes('src="img/inicio/proceso/preprensa.webp"'));
assert.ok(!/<article[^>]*\bhidden\b/.test(processSection), 'No-JS process panels must remain visible');
assert.equal((processSection.match(/data-process-controls[^>]*\bhidden/g) || []).length, 1);
const homeMain = home.match(/<main\b[\s\S]*?<\/main>/)[0];
const pageImages = [...homeMain.matchAll(/<img[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
assert.equal(pageImages.length, new Set(pageImages).size, 'Do not repeat photo sources across Home sections');
const featured = home.match(/<section id="destacados"[\s\S]*?<\/section>/)[0];
const featuredNames = [...featured.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => match[1]);
assert.deepEqual(featuredNames, ['Agendas corporativas', 'Folder corporativo', 'Calendarios de escritorio']);
for (const name of ['Agendas corporativas', 'Folder corporativo', 'Calendario de escritorio']) {
  assert.ok(catalog.includes(`class="product-tile-name">${name}<`), `${name}: must exist in the catalog`);
}
assert.equal((featured.match(/<a class="home-feature" href="productos.html"/g) || []).length, 3);
assert.equal((featured.match(/class="home-feature-arrow"/g) || []).length, 3);
assert.equal((featured.match(/data-home-photo/g) || []).length, 3);
assert.ok(!/<a class="home-feature"[^>]*data-reveal/.test(featured), 'Only the home photo controller owns featured-card reveals');
assert.ok(!featured.includes('home-feature-main'), 'Featured products must have equal visual priority');
assert.ok(!/home-feature-caption\s*>\s*\.ui-icon|home-feature:nth-child|home-feature-main/.test(homeCSS), 'Old circular-arrow or stagger rules must be removed');
assert.ok(/\.home-feature-image\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/.test(homeCSS), 'Featured photo frames must be 4:5');
const featuredPlan = fs.readFileSync('img/inicio/destacados/README.md', 'utf8');
for (const expected of ['agenda-editorial.webp', 'folder-editorial.webp', 'calendario-editorial.webp']) assert.ok(featuredPlan.includes(expected));
assert.ok(!featuredPlan.includes('empaque-editorial.webp'));
assert.ok(!featured.includes('home-featured-note'), 'Selected presentation photos replace the provisional notice');
const featuredImages = [...featured.matchAll(/<img\b[^>]+>/g)].map(match => match[0]);
for (const [index, slug] of ['agenda', 'folder', 'calendario'].entries()) {
  const tag = featuredImages[index];
  const base = `img/inicio/destacados/${slug}-editorial`;
  assert.ok(tag.includes(`src="${base}.webp"`));
  assert.ok(tag.includes(`srcset="${base}-560.webp 560w, ${base}.webp 1122w"`));
  assert.ok(tag.includes('loading="lazy"') && tag.includes('width="1122" height="1402"'));
  assert.deepEqual(imageSize(`${base}-560.webp`), [560, 700]);
  const [width, height] = imageSize(`${base}.webp`);
  assert.ok(Math.abs(width / height - 4 / 5) < .001, `${base}: preserve the 4:5 presentation ratio`);
}
for (const [asset, expected] of [
  ['video/hero-inicio.mp4', 'aa461e4bbfb2a534209794d09efe51b7d1d1daafd86ec01a66d67aa811d90c9a'],
  ['video/hero-poster-20261119.webp', 'd7116067f7629a8a4dd98c436f896018e530143be28b54e47c056231f333bf07']
]) assert.equal(createHash('sha256').update(fs.readFileSync(asset)).digest('hex'), expected, `${asset}: Phase 1 media changed`);
console.log('PASS: JavaScript syntax, local assets and srcset, actual PNG/WebP formats and dimensions, anchors, 16 products, 48 gallery images, unchanged form contract, 34 logos, canonical URLs and sitemap.');
console.log('PASS: isolated home CSS, always-visible hero copy, six sectors, three catalog highlights and unchanged optimized hero media.');
console.log('PASS: strict UTF-8 and Spanish readable text/labels; damaged-word regression rejected without rejecting URL queries.');

assert.ok(!contents.get('nosotros.html').includes('id="procesos"'), 'Removed Nosotros process section must not return');
assert.ok(fs.readFileSync('js/main.js', 'utf8').includes("procesos: 'index.html#soluciones'"), 'Legacy process links must lead to the remaining Home process section');

// Resource URLs currently live literally in HTML/CSS/JS (including modal links,
// lazy video sources, social metadata and responsive candidates).
const runtimeReferences = [...contents.values(), ...['css/style.css', 'css/inicio.css', 'js/main.js', 'js/inicio.js', 'js/validacion.js'].map(file => fs.readFileSync(file, 'utf8'))].join('\n');
function checkReferencedAssets(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) checkReferencedAssets(file);
    else if (!file.endsWith('.md')) assert.ok(runtimeReferences.includes(file.split(path.sep).join('/')), `${file}: unused published resource; archive it outside the project`);
  }
}
checkReferencedAssets('img');
checkReferencedAssets('video');
assert.ok(!fs.readFileSync('js/main.js', 'utf8').includes('function initProcesses()'), 'Removed Nosotros process initializer must not return');
console.log('PASS: every published image/video resource has a current reference; removed legacy process code is absent.');
