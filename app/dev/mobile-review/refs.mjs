// Capture the reference pages for the mobile review design options (2026-11-11).
//   node app/dev/mobile-review/refs.mjs <out-dir>
import path from 'node:path';
import { launch } from './cdp.mjs';

const OUT = path.resolve(process.argv[2] || 'refs');
const REFS = [
  ['stripe-appstore', 'https://apps.apple.com/us/app/stripe-dashboard/id978516833', 1280],
  ['square-dashboard-appstore', 'https://apps.apple.com/us/app/square-dashboard-for-pos/id992958748', 1280],
  ['shopify-appstore', 'https://apps.apple.com/us/app/shopify-your-ecommerce-store/id371294472', 1280],
  ['square-pos-appstore', 'https://apps.apple.com/us/app/square-point-of-sale-pos/id335393788', 1280],
  ['shopify-table', 'https://shopify.dev/docs/api/app-home/web-components/layout-and-structure/table', 390],
  ['square-row', 'https://square.github.io/dashboard-addons-docs/ui-components/row', 1280],
  ['square-button-group', 'https://square.github.io/dashboard-addons-docs/ui-components/button-group', 1280],
];
const b = await launch({ port: 9334 });
const p = await b.page();
for (const [id, url, w] of REFS) {
  try {
    await p.viewport(w, 1000);
    await p.goto(url, 3500);
    // App Store pages: bring the iPhone screenshot shelf into view
    const y = await p.eval(`const s = document.querySelector('[class*=screenshot], .we-screenshot-viewer, picture'); if (s) { s.scrollIntoView(); return scrollY } return 0`);
    await p.wait(1500);
    await p.shot(path.join(OUT, `${id}.png`));
    console.log(id, 'ok', y);
  } catch (e) { console.log(id, 'ERROR', e.message); }
}
await b.close();
