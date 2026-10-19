// The focus rule (lib/focus.js) and the R2 crop position in the generator agree with what the
// 2026-10-18 framing review approved. node app/dev/focus-test.mjs
import assert from 'node:assert/strict';
import { dogFocus, findFocus } from '../lib/focus.js';

const box = (xmin, ymin, xmax, ymax, label = 'dog', score = 0.99) => ({ label, score, box: { xmin, ymin, xmax, ymax } });
let n = 0;
const ok = (name, f) => { f(); n += 1; console.log(`ok ${n} ${name}`); };

ok('no dog gives no point', () => assert.equal(dogFocus([box(0, 0, 10, 10, 'cat')], 100, 100), null));
ok('a weak dog is ignored', () => assert.equal(dogFocus([box(0, 0, 10, 10, 'dog', 0.5)], 100, 100), null));
ok('a tall box leans up toward the face', () => assert.deepEqual(dogFocus([box(200, 100, 400, 500)], 640, 640), { fx: 0.469, fy: 0.356 }));
ok('a wide box sits nearer its middle', () => assert.deepEqual(dogFocus([box(100, 300, 500, 500)], 640, 640), { fx: 0.469, fy: 0.609 }));
ok('two puppies side by side stay in one point', () => assert.equal(dogFocus([box(0, 200, 200, 400), box(440, 200, 640, 400)], 640, 640).fx, 0.5));
ok('a small dog far behind does not pull the point', () => assert.equal(dogFocus([box(0, 0, 300, 300), box(600, 600, 620, 620)], 640, 640).fx, 0.234));
ok('a box past the edge is clipped', () => assert.equal(dogFocus([box(-5, 0, 320, 640)], 640, 640).fx, 0.25));
ok('a dog filling the frame sits just above the middle', () => assert.deepEqual(dogFocus([box(0, 0, 640, 480)], 640, 480), { fx: 0.5, fy: 0.45 }));

const calls = [];
const fakeAI = { run: async (model, input) => { calls.push([model, input.image.length]); return [box(100, 50, 300, 300)]; } };
// A 1x1 PNG is enough for its header size.
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
assert.equal(await findFocus({}, png), null); n += 1; console.log(`ok ${n} no AI binding gives no point`);
assert.ok(await findFocus({ AI: fakeAI }, png)); n += 1; console.log(`ok ${n} the detector is called with the image`);
assert.equal(calls[0][0], '@cf/facebook/detr-resnet-50');
assert.equal(await findFocus({ AI: { run: async () => { throw new Error('quota'); } } }, png), null); n += 1; console.log(`ok ${n} a failed call gives no point`);
console.log(`${n} focus checks passed`);
