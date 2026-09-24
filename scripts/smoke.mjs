/**
 * Real-browser smoke test (Puppeteer + headless Chrome).
 *
 * Run against a local server:
 *   npm run build && npm run preview &   (or `npm run dev`)
 *   node scripts/smoke.mjs [baseUrl]     (default http://localhost:4173)
 *
 * Covers the checks that jsdom cannot: real mobile layout (no horizontal
 * scroll), service worker registration, offline behaviour, timer controls and
 * persistence across a reload. Screenshots land in .smoke/.
 *
 * This script is a developer tool, not part of the shipped app.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = '.smoke';
mkdirSync(OUT, { recursive: true });

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const MOBILE = { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}

async function acceptDisclaimer(page) {
  await page.waitForSelector('label');
  await page.evaluate(() => {
    const checkbox = document.querySelector('input[type="checkbox"]');
    checkbox?.click();
  });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Продолжить'),
    );
    return button && !button.disabled;
  });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Продолжить'),
    );
    button?.click();
  });
  await page.waitForSelector('main h2');
}

async function clickByText(page, text, selector = 'button') {
  const handle = await page.waitForFunction(
    (needle, sel) =>
      [...document.querySelectorAll(sel)].find((el) => el.textContent?.includes(needle)) ?? null,
    { timeout: 5000 },
    text,
    selector,
  );
  await handle.asElement().click();
}

/** After a reload the gate is already accepted, so this is a no-op then. */
async function acceptDisclaimerIfNeeded(page) {
  const gate = await page.evaluate(() => document.body.innerText.includes('не лечит грыжу'));
  if (gate) await acceptDisclaimer(page);
  await page.waitForSelector('main h2');
}

async function hasText(page, text) {
  return page.evaluate((needle) => document.body.innerText.includes(needle), text);
}

async function overflowInfo(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
}

/**
 * Every check gets its own incognito context, so localStorage/IndexedDB and the
 * service worker start empty — otherwise an accepted disclaimer or a red flag
 * from a previous check would leak into the next one.
 */
async function newPage(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(MOBILE);
  page.on('pageerror', (error) => console.log('  pageerror:', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('  console.error:', message.text());
  });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  return page;
}

async function closePage(page) {
  await page.browserContext().close();
}

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  // ── 1. Mobile layout, disclaimer gate, dashboard ─────────────────────────
  const page = await newPage(browser);

  const gateVisible = await hasText(page, 'не лечит грыжу');
  record('медицинское предупреждение показывается до упражнений', gateVisible);

  const disabledBefore = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Продолжить'),
    );
    return button?.disabled ?? null;
  });
  record('кнопка «Продолжить» заблокирована до подтверждения', disabledBefore === true);

  await acceptDisclaimer(page);
  const dashHeading = await hasText(page, 'Сегодняшняя программа');
  record('дашборд открывается после подтверждения', dashHeading);

  const startBtn = await hasText(page, 'Начать тренировку');
  record('кнопка «Начать тренировку» доступна без тревожных симптомов', startBtn);

  const info = await overflowInfo(page);
  record(
    'нет горизонтального скролла на 360 px (дашборд)',
    info.scrollWidth <= info.clientWidth + 1,
    `scrollWidth=${info.scrollWidth} clientWidth=${info.clientWidth}`,
  );
  await shot(page, '01-dashboard');

  // ── 2. Service worker + offline ─────────────────────────────────────────
  const swRegistered = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration('/');
    return Boolean(reg?.active ?? reg?.installing ?? reg?.waiting);
  });
  record('Service Worker зарегистрирован', swRegistered);

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return response.ok ? response.json() : null;
  });
  record(
    'манифест PWA валиден (standalone + иконки 192/512)',
    Boolean(
      manifest &&
        manifest.display === 'standalone' &&
        manifest.icons.some((i) => i.sizes === '192x192') &&
        manifest.icons.some((i) => i.sizes === '512x512'),
    ),
    `display=${manifest?.display} icons=${manifest?.icons?.length}`,
  );

  // Warm the cache, then go offline and reload.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'networkidle0' });
  const offlineOk = await hasText(page, 'Сегодняшняя программа');
  record('приложение работает офлайн после первой загрузки', offlineOk);
  await shot(page, '02-offline');
  await page.setOfflineMode(false);

  // ── 3. Exercise card: source + access date ──────────────────────────────
  await clickByText(page, 'Библиотека');
  const libraryOk = await hasText(page, 'Мягкая разминка');
  record('библиотека открывается по категориям', libraryOk);

  await clickByText(page, 'Техника и источник');
  const sourceOk = (await hasText(page, 'Дата проверки источника')) && (await hasText(page, 'nhs.uk'));
  record('в карточке есть источник со ссылкой и датой проверки', sourceOk);

  const libOverflow = await overflowInfo(page);
  record(
    'нет горизонтального скролла (библиотека)',
    libOverflow.scrollWidth <= libOverflow.clientWidth + 1,
    `scrollWidth=${libOverflow.scrollWidth} clientWidth=${libOverflow.clientWidth}`,
  );
  await shot(page, '03-library');
  await closePage(page);

  // ── 4. Timer: start / pause / reset / next set ──────────────────────────
  const timer = await newPage(browser);
  await acceptDisclaimer(timer);
  await clickByText(timer, 'Таймер');

  const initialClock = await timer.$eval('[role="timer"] p', (el) => el.textContent?.trim());
  await clickByText(timer, 'Начать');
  await new Promise((resolve) => setTimeout(resolve, 1400));
  const runningClock = await timer.$eval('[role="timer"] p', (el) => el.textContent?.trim());
  record(
    'таймер идёт после нажатия «Начать»',
    runningClock !== initialClock,
    `${initialClock} → ${runningClock}`,
  );

  await clickByText(timer, 'Пауза');
  const pausedClock = await timer.$eval('[role="timer"] p', (el) => el.textContent?.trim());
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const afterPauseClock = await timer.$eval('[role="timer"] p', (el) => el.textContent?.trim());
  record(
    'пауза останавливает отсчёт',
    pausedClock === afterPauseClock,
    `${pausedClock} / ${afterPauseClock}`,
  );

  const resumeLabel = await timer.evaluate(() =>
    [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('Продолжить')),
  );
  record('после паузы появляется «Продолжить»', resumeLabel);

  await clickByText(timer, 'Следующий подход');
  const restShown = await hasText(timer, 'отдых перед следующим подходом');
  const completedAfterSkip = await timer.evaluate(
    () => document.querySelectorAll('.bg-teal-400.h-3').length,
  );
  record(
    '«Следующий подход» завершает удержание и открывает отдых',
    restShown && completedAfterSkip === 1,
    `отдых=${restShown}, завершено подходов=${completedAfterSkip}`,
  );

  await clickByText(timer, 'Следующий подход');
  const setAfterRest = await timer.evaluate(() => document.body.innerText.match(/Подход\s*(\d+)/)?.[1]);
  record('после отдыха счётчик переходит к подходу 2', setAfterRest === '2', `подход=${setAfterRest}`);

  await clickByText(timer, 'Сброс');
  const resetClock = await timer.$eval('[role="timer"] p', (el) => el.textContent?.trim());
  const resetSet = await timer.evaluate(() => document.body.innerText.match(/Подход\s*(\d+)/)?.[1]);
  record(
    '«Сброс» возвращает таймер в исходное состояние',
    resetClock === initialClock && resetSet === '1',
    `${resetClock} / подход ${resetSet}`,
  );
  await shot(timer, '04-timer');

  const controls = await timer.evaluate(() => {
    const buttons = [...document.querySelectorAll('main button')];
    return buttons.filter((b) => b.getBoundingClientRect().height < 44).map((b) => b.textContent);
  });
  record('все кнопки соответствуют минимальной цели 44 px', controls.length === 0, controls.join(' | '));
  await closePage(timer);

  // ── 5. Diary entry persists across a reload ─────────────────────────────
  const diary = await newPage(browser);
  await acceptDisclaimer(diary);
  await clickByText(diary, 'Дневник');
  await diary.evaluate(() => {
    const range = document.querySelector('input[type="range"]');
    if (range) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(range, '6');
      range.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await clickByText(diary, 'Сохранить запись');
  await new Promise((resolve) => setTimeout(resolve, 600));
  // The app keeps its route in memory, so a reload lands on the dashboard —
  // that is expected; what matters is that the record survived.
  await diary.reload({ waitUntil: 'networkidle0' });
  await acceptDisclaimerIfNeeded(diary);
  await clickByText(diary, 'Дневник');
  const persisted = await hasText(diary, 'боль 6/10');
  const storedKeys = await diary.evaluate(
    () =>
      new Promise((resolve) => {
        const request = indexedDB.open('lumbar-rehab');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('kv', 'readonly');
          const all = tx.objectStore('kv').getAllKeys();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => resolve([]);
        };
        request.onerror = () => resolve([]);
      }),
  );
  record(
    'запись дневника сохраняется в IndexedDB и переживает перезагрузку',
    persisted && storedKeys.includes('app-data'),
    `ключи IndexedDB=${JSON.stringify(storedKeys)}`,
  );
  await shot(diary, '05-diary');
  await closePage(diary);

  // ── 6. Red-flag interlock ───────────────────────────────────────────────
  const flags = await newPage(browser);
  await flags.evaluate(() => {
    const checkbox = document.querySelector('input[type="checkbox"]');
    checkbox?.click();
  });
  const flagBoxes = await flags.$$('input[type="checkbox"]');
  // Second checkbox is the first red-flag item in the gate checklist.
  await flagBoxes[1].click();
  await flags.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Сохранить'),
    );
    button?.click();
  });
  await flags.waitForSelector('[role="alert"]');
  const alertShown = await hasText(flags, 'Остановитесь и обратитесь за медицинской помощью');
  const startHidden = !(await hasText(flags, 'Начать тренировку'));
  record('при тревожном симптоме показывается предупреждение', alertShown);
  record('при тревожном симптоме тренировка не предлагается', startHidden);
  await shot(flags, '06-red-flags');
  await closePage(flags);

  // ── 7. Notifications unavailable → honest in-app notice ─────────────────
  const notes = await newPage(browser);
  await acceptDisclaimer(notes);
  await clickByText(notes, 'Ещё');
  await clickByText(notes, 'Напоминания');
  const limitsShown = await hasText(notes, 'Ограничения PWA-уведомлений');
  record('раздел напоминаний честно описывает ограничения платформ', limitsShown);
  await shot(notes, '07-reminders');
  await closePage(notes);

  // ── 8. Inversion module gated by doctor approval ────────────────────────
  const inversion = await newPage(browser);
  await acceptDisclaimer(inversion);
  await clickByText(inversion, 'Ещё');
  await clickByText(inversion, 'Инверсионный стол');
  const gated = await hasText(inversion, 'Врач разрешил мне использовать инверсионный стол');
  const noAngle = !(await inversion.evaluate(() => /угол\s*\d+/i.test(document.body.innerText)));
  record('чек-лист инверсии требует разрешения врача', gated);
  record('приложение не задаёт угол наклона', noAngle);
  await shot(inversion, '08-inversion');
  await closePage(inversion);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} проверок пройдено`);
if (failed.length) {
  console.log('Не пройдено:');
  for (const item of failed) console.log(`  - ${item.name} ${item.detail}`);
  process.exit(1);
}
