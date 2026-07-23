#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.pdf', 'application/pdf'],
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitFor(check, label, timeout = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const value = await check();
    if (value) return value;
    await delay(40);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

class CdpSession {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(url);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      let relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (!relativePath || relativePath.endsWith('/')) relativePath += 'index.html';
      const normalizedPath = normalize(relativePath);
      assert(!normalizedPath.startsWith('..'), 'Request escaped repository root');
      const filePath = join(repoRoot, normalizedPath);
      const fileStats = await stat(filePath);
      assert(fileStats.isFile(), 'Requested path is not a file');
      response.writeHead(200, {
        'content-type': mimeTypes.get(extname(filePath)) || 'application/octet-stream',
      });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || 'Browser evaluation failed');
  }
  return result.result.value;
}

async function press(cdp, key, { shift = false } = {}) {
  const keyData = {
    Tab: { code: 'Tab', windowsVirtualKeyCode: 9 },
    Enter: { code: 'Enter', windowsVirtualKeyCode: 13 },
    ' ': { code: 'Space', windowsVirtualKeyCode: 32 },
    Escape: { code: 'Escape', windowsVirtualKeyCode: 27 },
    ArrowDown: { code: 'ArrowDown', windowsVirtualKeyCode: 40 },
    ArrowUp: { code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  }[key];
  const modifiers = shift ? 8 : 0;
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, modifiers, ...keyData });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, modifiers, ...keyData });
  await delay(40);
}

async function click(cdp, selector) {
  const point = await evaluate(cdp, `(() => {
    const rectangle = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
    return { x: rectangle.left + rectangle.width / 2, y: rectangle.top + rectangle.height / 2 };
  })()`);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await delay(40);
}

async function setViewport(cdp, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(40);
}

async function navigate(cdp, url) {
  await cdp.send('Page.navigate', { url });
  await waitFor(
    () => evaluate(cdp, 'document.readyState === "complete"'),
    `page load for ${url}`,
  );
}

const pickerStateExpression = `(() => ({
  hidden: document.querySelector('#language-menu').hidden,
  expanded: document.querySelector('#language-current').getAttribute('aria-expanded'),
  activeText: document.activeElement.textContent.trim(),
  activeClass: document.activeElement.className,
  tabIndexes: [...document.querySelectorAll('.language-option')].map(option => option.tabIndex),
  selected: [...document.querySelectorAll('.language-option')].map(option => option.getAttribute('aria-selected')),
  disabled: [...document.querySelectorAll('.language-option')].map(option => option.getAttribute('aria-disabled')),
  deskText: document.querySelector('.desk').textContent,
  url: location.href
}))()`;

async function openFromTrigger(cdp) {
  await press(cdp, 'ArrowDown');
  const state = await evaluate(cdp, pickerStateExpression);
  assert(!state.hidden && state.expanded === 'true', 'ArrowDown must open the picker');
  assert(state.activeText === 'English', 'Opening must focus selected English');
  assert(JSON.stringify(state.tabIndexes) === JSON.stringify([0, -1, -1, -1, -1]), 'Open picker must start with English as the sole roving tab stop');
  return state;
}

async function runPickerBehavior(cdp, homeUrl) {
  await setViewport(cdp, 1024, 768);
  await navigate(cdp, homeUrl);

  const triggerPoint = await evaluate(cdp, `(() => {
    const rectangle = document.querySelector('.language-current').getBoundingClientRect();
    return { x: rectangle.left + rectangle.width / 2, y: rectangle.top + rectangle.height / 2 };
  })()`);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...triggerPoint });
  const hoverStyle = await evaluate(cdp, `(() => {
    const trigger = document.querySelector('.language-current');
    const style = getComputedStyle(trigger);
    return {
      hovered: trigger.matches(':hover'),
      color: style.color,
      background: style.backgroundColor,
    };
  })()`);
  assert(hoverStyle.hovered && hoverStyle.color === 'rgb(255, 255, 255)' && hoverStyle.background === 'rgb(31, 91, 143)', 'Trigger hover styling must be explicit and visible');
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });

  await press(cdp, 'Tab');
  assert(await evaluate(cdp, 'document.activeElement.matches(".work-link")'), 'First Tab must focus work link');
  await press(cdp, 'Tab');
  assert(await evaluate(cdp, 'document.activeElement.matches(".language-current")'), 'Second Tab must focus language trigger');
  const focusStyle = await evaluate(cdp, `(() => {
    const trigger = document.querySelector('.language-current');
    const style = getComputedStyle(trigger);
    return {
      focusVisible: trigger.matches(':focus-visible'),
      color: style.color,
      background: style.backgroundColor,
      outlineWidth: style.outlineWidth,
    };
  })()`);
  assert(focusStyle.focusVisible && focusStyle.outlineWidth === '2px', 'Trigger keyboard focus must have an explicit visible outline');

  const baseline = await openFromTrigger(cdp);
  const expandedStyle = await evaluate(cdp, `(() => {
    const triggerStyle = getComputedStyle(document.querySelector('.language-current'));
    const optionStyle = getComputedStyle(document.querySelector('.language-en'));
    return {
      color: triggerStyle.color,
      background: triggerStyle.backgroundColor,
      optionFontFamily: optionStyle.fontFamily,
    };
  })()`);
  assert(expandedStyle.color === 'rgb(255, 255, 255)' && expandedStyle.background === 'rgb(31, 91, 143)', 'Expanded trigger styling must remain visible');
  assert(expandedStyle.optionFontFamily.includes('Inter'), 'Picker buttons must inherit the site sans font stack');
  await press(cdp, 'ArrowDown');
  let state = await evaluate(cdp, pickerStateExpression);
  assert(state.activeText === '日本語', 'ArrowDown must include the disabled Japanese option');
  assert(JSON.stringify(state.tabIndexes) === JSON.stringify([-1, 0, -1, -1, -1]), 'Roving tabindex must follow focus onto disabled options');
  assert(await evaluate(cdp, 'getComputedStyle(document.activeElement).outlineWidth === "2px"'), 'Disabled options must retain a visible focus indicator');

  await press(cdp, 'Enter');
  state = await evaluate(cdp, pickerStateExpression);
  assert(!state.hidden && state.activeText === '日本語', 'Enter on a disabled option must be inert');
  assert(state.deskText === baseline.deskText && state.url === baseline.url, 'Disabled Enter must not change page content or URL');

  await press(cdp, ' ');
  state = await evaluate(cdp, pickerStateExpression);
  assert(!state.hidden && state.activeText === '日本語', 'Space on a disabled option must be inert');

  await click(cdp, '.language-ja');
  state = await evaluate(cdp, pickerStateExpression);
  assert(!state.hidden && state.activeText === '日本語', 'Click on a disabled option must be inert');
  assert(JSON.stringify(state.selected) === JSON.stringify(['true', 'false', 'false', 'false', 'false']), 'Disabled choices must not change selection');

  for (const label of ['Español', 'Português (Brasil)', 'Deutsch', 'English']) {
    await press(cdp, 'ArrowDown');
    assert((await evaluate(cdp, pickerStateExpression)).activeText === label, `ArrowDown must focus ${label}`);
  }
  await press(cdp, 'ArrowUp');
  assert((await evaluate(cdp, pickerStateExpression)).activeText === 'Deutsch', 'ArrowUp must wrap to disabled Deutsch');

  await press(cdp, 'Escape');
  state = await evaluate(cdp, pickerStateExpression);
  assert(state.hidden && state.expanded === 'false' && state.activeClass === 'language-current', 'Escape must close and restore trigger focus');
  assert(JSON.stringify(state.tabIndexes) === JSON.stringify([0, -1, -1, -1, -1]), 'Close must reset roving tabindex to selected English');

  await openFromTrigger(cdp);
  await press(cdp, 'Enter');
  state = await evaluate(cdp, pickerStateExpression);
  assert(
    state.hidden && state.deskText === baseline.deskText && state.url === baseline.url,
    `Enter on English must close without changing content: ${JSON.stringify(state)}`,
  );

  await openFromTrigger(cdp);
  await press(cdp, ' ');
  state = await evaluate(cdp, pickerStateExpression);
  assert(state.hidden && state.deskText === baseline.deskText && state.url === baseline.url, 'Space on English must close without changing content');

  await openFromTrigger(cdp);
  await click(cdp, '.language-en');
  state = await evaluate(cdp, pickerStateExpression);
  assert(state.hidden && state.deskText === baseline.deskText && state.url === baseline.url, 'Click on English must close without changing content');

  await openFromTrigger(cdp);
  await press(cdp, 'Tab');
  state = await evaluate(cdp, pickerStateExpression);
  assert(state.hidden && state.activeClass.includes('desk-item--one'), 'Tab must exit forward and close the picker');

  await press(cdp, 'Tab', { shift: true });
  assert(await evaluate(cdp, 'document.activeElement.matches(".language-current")'), 'Shift+Tab from first desk item must return to trigger');
  await openFromTrigger(cdp);
  await press(cdp, 'Tab', { shift: true });
  state = await evaluate(cdp, pickerStateExpression);
  assert(state.hidden && state.activeClass === 'work-link', 'Shift+Tab must exit backward and close the picker');

  await press(cdp, 'Tab');
  await openFromTrigger(cdp);
  await evaluate(cdp, 'document.querySelector(".desk-item--two").focus()');
  await delay(40);
  state = await evaluate(cdp, pickerStateExpression);
  assert(state.hidden && state.activeClass.includes('desk-item--two'), 'Moving focus outside the picker must close it');

  return {
    arrows: ['English', '日本語', 'Español', 'Português (Brasil)', 'Deutsch'],
    disabledInputs: ['Enter', 'Space', 'click'],
    englishInputs: ['Enter', 'Space', 'click'],
    exits: ['Tab', 'Shift+Tab', 'Escape', 'focusout'],
    triggerStyles: { hover: hoverStyle, focus: focusStyle, expanded: expandedStyle },
  };
}

async function measureViewport(cdp, homeUrl, workUrl, width, height) {
  await setViewport(cdp, width, height);
  await navigate(cdp, homeUrl);
  await evaluate(cdp, 'document.querySelector("#language-current").click()');
  const home = await evaluate(cdp, `(() => {
    const heights = selector => [...document.querySelectorAll(selector)].map(element => element.getBoundingClientRect().height);
    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      workLink: heights('.work-link'),
      trigger: heights('.language-current'),
      options: heights('.language-option'),
    };
  })()`);
  const homeTargets = [...home.workLink, ...home.trigger, ...home.options];
  assert(homeTargets.every(value => value >= 44), `${width}px homepage picker/work targets must be at least 44px high`);
  assert(home.scrollWidth === home.width, `${width}px homepage must not overflow horizontally`);

  await navigate(cdp, workUrl);
  const work = await evaluate(cdp, `(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    back: document.querySelector('.back').getBoundingClientRect().height,
    workEntryCount: document.querySelectorAll('.work-entry').length,
  }))()`);
  assert(work.back >= 44, `${width}px work-page back target must be at least 44px high`);
  assert(work.scrollWidth === work.width, `${width}px work page must not overflow horizontally`);
  assert(work.workEntryCount === 6, `${width}px work page must retain exactly six entries`);

  return { width, home, work };
}

async function measureDesktop(cdp, homeUrl) {
  await setViewport(cdp, 1024, 768);
  await navigate(cdp, homeUrl);
  const result = await evaluate(cdp, `(() => {
    const rectangles = [...document.querySelectorAll('.desk-item')].map(element => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    });
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      count: rectangles.length,
      overlaps: rectangles.flatMap((first, index) => rectangles.slice(index + 1).map(second => overlap(first, second))),
    };
  })()`);
  assert(result.count === 3, 'Desktop spot-check must retain exactly three personal links');
  assert(result.overlaps.every(value => !value), 'Desktop spot-check must have no item overlap');
  assert(result.scrollWidth === result.width, 'Desktop spot-check must have no horizontal overflow');
  return result;
}

let server;
let chrome;
let cdp;
let profileDirectory;

try {
  await stat(chromePath);
  server = await startServer();
  const address = server.address();
  const homeUrl = `http://127.0.0.1:${address.port}/`;
  const workUrl = `${homeUrl}work/`;

  profileDirectory = await mkdtemp(join(tmpdir(), 'blank-desk-chrome-'));
  chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDirectory}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const devToolsFile = join(profileDirectory, 'DevToolsActivePort');
  const [debuggingPort] = (await waitFor(async () => {
    try {
      return (await readFile(devToolsFile, 'utf8')).trim().split('\n');
    } catch {
      return null;
    }
  }, 'Chrome DevTools endpoint')).slice(0, 1);

  const target = await (await fetch(`http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(homeUrl)}`, {
    method: 'PUT',
  })).json();
  cdp = new CdpSession(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const behavior = await runPickerBehavior(cdp, homeUrl);
  const mobile390 = await measureViewport(cdp, homeUrl, workUrl, 390, 844);
  const mobile320 = await measureViewport(cdp, homeUrl, workUrl, 320, 720);
  const desktop1024 = await measureDesktop(cdp, homeUrl);

  console.log('Browser interaction checks passed.');
  console.log(`Behavior evidence: ${JSON.stringify(behavior)}`);
  console.log(`390px viewport evidence: ${JSON.stringify(mobile390)}`);
  console.log(`320px viewport evidence: ${JSON.stringify(mobile320)}`);
  console.log(`1024px desktop evidence: ${JSON.stringify(desktop1024)}`);
} finally {
  if (cdp) cdp.close();
  if (chrome && chrome.exitCode === null) {
    const exited = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill('SIGTERM');
    await Promise.race([exited, delay(2_000)]);
  }
  if (server) await new Promise(resolve => server.close(resolve));
  if (profileDirectory) {
    await rm(profileDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
