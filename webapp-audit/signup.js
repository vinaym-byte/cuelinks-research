// Test signup on cuelinks.com with a disposable inbox and made-up "QA Test" details.
// Usage: CUELINKS_TEST_PHONE=<10 digits> node signup.js [--desktop|--mobile]
// Without CUELINKS_TEST_PHONE it fills the form and stops before submitting.
// Output in runs/<id>/: screenshots, state.json (logged-in session), account.json.
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');
const { createInbox, waitForMail } = require('./tempmail');

const mobile = process.argv.includes('--mobile');
// Accepts +91 / spaces; the form wants the bare 10-digit number
const phone = process.env.CUELINKS_TEST_PHONE?.replace(/\D/g, '').slice(-10);
const id = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}-${mobile ? 'mobile' : 'desktop'}`;
const dir = path.join(__dirname, 'runs', id);
fs.mkdirSync(dir, { recursive: true });
let step = 0;
const shot = (page, name) => page.screenshot({ path: path.join(dir, `${String(++step).padStart(2, '0')}-${name}.png`), fullPage: true });

(async () => {
  const inbox = await createInbox();
  const account = {
    first_name: 'QA',
    last_name: `Test${String(Date.now()).slice(-4)}`,
    email: inbox.address,
    password: `Qa!${Math.random().toString(36).slice(2, 10)}9`,
    company_name: 'QA Test - please delete',
    source_url: 'https://www.paritycube.com/qa-test',
  };
  fs.writeFileSync(path.join(dir, 'account.json'), JSON.stringify({ ...account, mailToken: inbox.token }, null, 2));
  console.log('inbox', inbox.address);

  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? devices['Pixel 7'] : { viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('https://www.cuelinks.com/signup', { waitUntil: 'networkidle' });
  await page.getByText('Continue with Email').click();
  await page.fill('input[name=first_name]', account.first_name);
  await page.fill('input[name=last_name]', account.last_name);
  await page.fill('input[name=email]', account.email);
  await page.fill('input[name=password]', account.password);
  await page.fill('input[name=company_name]', account.company_name);
  await page.fill('input[name="[channels_attributes][0][source_url]"]', account.source_url);
  if (phone) await page.fill('input[name=mobile_number]', phone);
  await page.mouse.click(5, 5); // blur so floating labels settle
  await page.waitForTimeout(1000);
  const values = await page.$$eval('form input:not([type=hidden])', els => els.filter(e => e.offsetParent).map(e => `${e.name || e.placeholder}=${e.type === 'password' ? '***' : e.value}`));
  console.log('fields', values);
  await shot(page, 'form-filled');

  if (!phone) {
    console.log('CUELINKS_TEST_PHONE not set: stopped before submitting.');
    return browser.close();
  }

  await page.getByRole('button', { name: /sign up/i }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  await shot(page, 'after-submit');
  console.log('url after submit', page.url());
  const errors = await page.locator('.error, .invalid-feedback, .alert, [class*=error]').allInnerTexts();
  if (errors.filter(e => e.trim()).length) console.log('form errors', errors.filter(e => e.trim()));

  const mails = await waitForMail(inbox.token, { timeoutMs: 90000 });
  for (const m of mails) {
    console.log('mail:', m.from.address, '|', m.subject);
    const links = (m.html?.join('') || m.text || '').match(/https?:\/\/[^\s"'<>]+/g) || [];
    fs.writeFileSync(path.join(dir, `mail-${m.id}.txt`), `${m.subject}\n\n${m.text}\n\nLINKS:\n${links.join('\n')}`);
  }

  await ctx.storageState({ path: path.join(dir, 'state.json') });
  await browser.close();
  console.log('run dir', dir);
})();
