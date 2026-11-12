// A small Chrome DevTools Protocol driver for the mobile review (2026-11-11). It starts headless
// Chrome with its own profile, so cookies set by one page (the portal session that Manage as this
// breeder opens) carry to the next. Node 24 has WebSocket built in, so nothing is installed.
//
//   const b = await launch();  const p = await b.page();
//   await p.viewport(390, 844); await p.goto('http://localhost:8788/#/breeders');
//   await p.eval('document.title'); await p.shot('out.png');  await b.close();

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333, profile } = {}) {
  const dir = profile || fs.mkdtempSync(path.join(os.tmpdir(), 'pc-mr-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'],
  { stdio: 'ignore' });
  let version;
  for (let i = 0; i < 50 && !version; i++) {
    await sleep(200);
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { /* not up yet */ }
  }
  if (!version) throw new Error('Chrome did not start');
  return {
    async page() {
      const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
      return openPage(t.webSocketDebuggerUrl);
    },
    async close() { proc.kill(); await sleep(300); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* locked */ } },
  };
}

async function openPage(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const waiting = new Map();
  const listeners = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && waiting.has(msg.id)) {
      const { r, j } = waiting.get(msg.id); waiting.delete(msg.id);
      if (msg.error) j(new Error(msg.error.message)); else r(msg.result);
    } else if (msg.method) listeners.forEach((f) => f(msg));
  };
  const send = (method, params = {}) => new Promise((r, j) => { const n = ++id; waiting.set(n, { r, j }); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const errors = [];
  listeners.push((m) => { if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
  let w = 390, h = 844;
  const page = {
    errors,
    send,
    async viewport(width, height = 844) {
      w = width; h = height;
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
      await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768 });
    },
    async goto(url, settle = 900) {
      const loaded = new Promise((r) => { const f = (m) => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(f), 1); r(); } }; listeners.push(f); });
      await send('Page.navigate', { url });
      await Promise.race([loaded, sleep(8000)]);
      await sleep(settle);
    },
    async eval(expression) {
      const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression.includes('return') ? expression : `return (${expression})`}})()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async wait(ms) { await sleep(ms); },
    /** A screenshot of the viewport, or of the whole page when full is true (capped at 6000px). */
    async shot(file, { full = false } = {}) {
      let clip;
      if (full) {
        const height = await page.eval('Math.min(6000, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))');
        await send('Emulation.setDeviceMetricsOverride', { width: w, height, deviceScaleFactor: 1, mobile: w < 768 });
        await sleep(300);
        clip = { x: 0, y: 0, width: w, height, scale: 1 };
      }
      const { data } = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      if (full) await page.viewport(w, h);
    },
    close() { ws.close(); },
  };
  return page;
}
