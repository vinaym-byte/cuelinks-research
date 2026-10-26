// Walk the post-signup journey for a run made by signup.js: confirm the email, log in,
// then visit every page the logged-in nav links to.
// Usage: node journey.js <runs/dir> [--mobile]
// Output in the same dir: j-NN-*.png screenshots and journey.json (urls, titles, console errors, failed requests).
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const dir = path.resolve(process.argv[2] || '');
const mobile = process.argv.includes('--mobile') || dir.endsWith('-mobile');
const account = JSON.parse(fs.readFileSync(path.join(dir, 'account.json'), 'utf8'));
const mail = fs.readdirSync(dir).filter(f => f.startsWith('mail-')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const confirmUrl = (mail.match(/https:\/\/www\.cuelinks\.com\/users\/confirmation\?confirmation_token=[\w-]+/) || [])[0];
let step = 0;
const log = { pages: [], console: [], failed: [] };
const shot = (page, name) => page.screenshot({ path: path.join(dir, `j-${String(++step).padStart(2, '0')}-${name}.png`), fullPage: true });

async function visit(page, url, name) {
  const t = Date.now();
  const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => ({ status: () => e.message.split('\n')[0] }));
  await page.waitForTimeout(1500);
  const entry = { name, url, final: page.url(), status: res?.status?.(), ms: Date.now() - t, title: await page.title(), h1: (await page.locator('h1, h2').first().innerText().catch(() => '')).trim().slice(0, 120) };
  log.pages.push(entry);
  console.log(`${name}: ${entry.status} ${entry.final} (${entry.ms}ms) "${entry.title}"`);
  await shot(page, name);
  return entry;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? devices['Pixel 7'] : { viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  page.on('console', m => m.type() === 'error' && log.console.push({ url: page.url(), text: m.text().slice(0, 300) }));
  page.on('response', r => r.status() >= 400 && log.failed.push({ page: page.url(), url: r.url().slice(0, 200), status: r.status() }));

  if (confirmUrl) await visit(page, confirmUrl, 'confirm');
  else console.log('no confirmation link found in mail-*.txt');

  // Confirmation usually lands on the login form; log in unless it already signed us in
  if (!confirmUrl || /sign_in|login/.test(page.url()) || await page.locator('input[type=password]').count()) {
    if (!(await page.locator('input[type=password]').count())) await visit(page, 'https://www.cuelinks.com/login', 'login-page');
    await page.fill('input[type=email], input[name*=email]', account.email);
    await page.fill('input[type=password]', account.password);
    await page.locator('form').filter({ has: page.locator('input[type=password]') }).locator('button[type=submit], input[type=submit]').first().click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
    log.pages.push({ name: 'after-login', final: page.url(), title: await page.title() });
    console.log('after login:', page.url());
    await shot(page, 'after-login');
  }

  // Cloudflare's interactive "Verify you are human" page: don't try to get past it, just record it
  if ((await page.title()) === 'Just a moment...') {
    log.blocked = `Cloudflare challenge at ${page.url()}`;
    console.log(log.blocked, '- stopping; logged-in pages need a manual pass or a Cloudflare allowlist');
  }

  // Same-site links from the logged-in shell (nav, sidebar, header menus)
  const home = page.url();
  const links = log.blocked ? [] : [...new Set(await page.$$eval('a[href]', as => as.map(a => a.href)))]
    .filter(h => h.startsWith('https://www.cuelinks.com/') && !/logout|sign_out|#$|\.(pdf|png|jpg)$/i.test(h) && h !== home)
    .slice(0, 30);
  fs.writeFileSync(path.join(dir, 'journey-links.txt'), links.join('\n'));
  for (const href of links) {
    const name = new URL(href).pathname.replace(/^\/|\/$/g, '').replace(/\W+/g, '_').slice(0, 40) || 'root';
    await visit(page, href, name);
  }

  await ctx.storageState({ path: path.join(dir, 'state.json') });
  fs.writeFileSync(path.join(dir, 'journey.json'), JSON.stringify(log, null, 2));
  await browser.close();
  console.log(`console errors: ${log.console.length}, failed requests: ${log.failed.length}`);
})();
