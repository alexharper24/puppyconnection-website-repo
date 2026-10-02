// Checks for the open test portal (DEV_MODE hosted-open), where there is no password:
// one browser must not see another's mail, or open another breeder's practice checkout.
//
//   PORTAL=https://portal.puppyconnection.workers.dev node app/dev/open-portal-check.mjs

import { Client } from './e2e.mjs';

const PORTAL = process.env.PORTAL || 'http://localhost:8787';
let failures = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) failures += 1; };

const stamp = Date.now().toString(36);
const alice = new Client(PORTAL);
const bob = new Client(PORTAL);
const aEmail = `e2e-open-a-${stamp}@breeders.test`;

check('the portal opens with no password', (await bob.get('/')).status === 200);
await alice.post('/auth/start', { email: aEmail, business_name: 'Open check A' });
const aMail = (await alice.get('/dev/mail.json')).data;
check("the sign-up browser sees its own sign-in link", Array.isArray(aMail) && aMail.some((m) => m.to_addr === aEmail && m.link));
const bMail = (await bob.get('/dev/mail.json')).data;
check("a different browser sees none of it", Array.isArray(bMail) && !bMail.some((m) => m.to_addr === aEmail), JSON.stringify(bMail).slice(0, 120));
const bAsk = (await bob.get(`/dev/mail.json?to=${encodeURIComponent(aEmail)}`)).data;
check('asking for that address by name does not help', Array.isArray(bAsk) && bAsk.length === 0);
const bPage = await bob.get('/dev/mail');
check('the mailbox page shows the other browser nothing', !String(bPage.data).includes(aEmail));
const anon = await fetch(`${PORTAL}/sim/checkout/cs_sim_does_not_exist`);
check('a practice checkout is not reachable without its breeder', anon.status === 404);

console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
