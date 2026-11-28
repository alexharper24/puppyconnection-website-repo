---
title: Photo check tuning
date: 2026-11-27
status: proposed, not applied
model: "@cf/meta/llama-4-scout-17b-16e-instruct"
test_sets:
  fp23: "23 production photos held as sent back, all judged good by Alex's reviewer (should pass)"
  sample_good: "84 photos from the 2026-10-17 sample marked pass or fix (should pass)"
  sample_bad: "16 photos from the same sample marked flag (8) or reject (8) (should be sent back)"
  input: "640 px long edge, WebP quality 82, matching the portal's card copy"
harness: "scratchpad ptune folder (throwaway Worker under wrangler dev, run.mjs, cands.js), not in the repo"
approaches:
  - id: A0
    what: current PHOTO_PROMPT as shipped
    fp23_sent_back: 12
    sample_good_sent_back: 3
    sample_bad_caught: 9
    rejects_caught: 6
  - id: A0C
    what: current prompt, then a yes/no facts question only when the first answer is send_back, keeping only confirmed reasons
    runs: 3
    fp23_sent_back: [0, 0, 0]
    sample_good_sent_back: [0, 0, 0]
    sample_bad_caught: [7, 7, 7]
    rejects_caught: [5, 5, 5]
  - id: A1
    what: person reason removed, people explicitly allowed
    fp23_sent_back: 1
    sample_good_sent_back: 2
    sample_bad_caught: 5
    rejects_caught: 4
  - id: A1C
    what: A1 plus the confirm step
    fp23_sent_back: 0
    sample_good_sent_back: 0
    sample_bad_caught: 5
    rejects_caught: 4
  - id: A2
    what: A1 plus tightened hidden, blurry, dark and watermark wording
    fp23_sent_back: 0
    sample_good_sent_back: 0
    sample_bad_caught: 4
    rejects_caught: 3
  - id: A2C
    what: A2 plus the confirm step
    fp23_sent_back: 0
    sample_good_sent_back: 0
    sample_bad_caught: 4
    rejects_caught: 3
  - id: F
    what: facts question alone, one call, reasons mapped straight from the answers
    fp23_sent_back: 1
    sample_good_sent_back: 4
    sample_bad_caught: 9
    rejects_caught: 6
recommendation:
  approach: A0C
  why: "the only approach with zero false send-backs on both good sets in three runs out of three that still catches 7 of 16 problem photos"
  exports_changed: none removed; adds PHOTO_FACTS_PROMPT, confirmReasons
  breeder_text_changed: false
---

# Photo check tuning, November 27, 2026

## What was measured

Every approach ran at temperature 0 against the same 123 photos, which were resized the way the portal makes its card copy. The 23 production send-backs are known false positives, the sample's 84 pass and fix photos should pass, and its 16 flag and reject photos should go back to the breeder.

| Approach | Good photos sent back (of 23 production) | Good photos sent back (of 84 sample) | Problem photos caught (of 16) | Rejects caught (of 8) |
|---|---|---|---|---|
| Current prompt | 12 | 3 | 9 | 6 |
| **Current prompt plus confirm step (3 runs)** | **0, 0, 0** | **0, 0, 0** | **7, 7, 7** | **5, 5, 5** |
| Person reason removed | 1 | 2 | 5 | 4 |
| Person removed plus confirm | 0 | 0 | 5 | 4 |
| Person removed, wording tightened | 0 | 0 | 4 | 3 |
| Tightened plus confirm | 0 | 0 | 4 | 3 |
| Facts question alone | 1 | 4 | 9 | 6 |

All counts are measured. The current prompt sent back 12 of the 23 here and production sent back all 23, because the first answer moves from run to run even at temperature 0 (12, 15, 15 and 14 of the 23 across four runs). The confirm step removed every one of them in all three runs.

## Why the confirm step wins

The first question tends to answer "send back" whenever a person or a blanket is in the photo. A second question that asks only plain facts (can you see the face, is the puppy sharp, does text sit on the puppy) does not show that bias, and it answered "face visible, sharp" on all 23 production photos. A reason stays only when a fact backs it, so "person" now sends a photo back only when the person also hides the puppy's face (sample photos 54 and 71 are still caught that way).

Removing the person reason or tightening the wording also cleared the false send-backs, but each lost real problems, and those approaches caught 4 or 5 of the 16 rather than 7. The facts question on its own catches the most but flags 4 good sample photos as blurry or watermarked, because it has no list of what is acceptable.

## What the recommended approach gives up

Compared with the current prompt, two sample photos are no longer sent back.

- Photo 82 (reject) shows a person filling half the frame with the puppy's face turned into them in a dark room. The facts question answered that the face was visible, so the person reason was dropped.
- Photo 80 (flag) shows what looks like an adult dog with a person. Whether a dog is grown is not checked, so this was not a real catch.

Both approaches miss rejects 59 (small puppy behind a large toy) and 64 (small puppy with its back turned among toys). Of the other missed flags, photo 84 is the Puppy Connection logo on a grown dog, which the current rules allow. The rest are 31 (small phone photo), 41 (small puppy with a hand reaching in), 48 (a person walking) and 94 (face pointed down).

## Cost

The confirm call runs only on photos the first question would send back. In production that was about 70 of about 1,200 uploads this month, so it adds about 6% more model calls (an estimate from those counts). The facts answer uses up to 120 output tokens. The image is sent again, so each confirm call costs about the same as the first call, which the October runs measured at about 1,200 input tokens.

## Replacement code for lib/photocheck.js

`PHOTO_MODEL`, `PHOTO_REASONS`, `PHOTO_PROMPT`, `SCHEMA`, `photoCheckMode`, `base64` and `readVerdict` stay exactly as they are, so the breeder-facing text and the `/person takes up much of the photo/` assertion in `dev/launch-features-test.mjs` are unchanged. Sim mode is unchanged, so the `x-sim-photo-check` tests behave as before. Paste the block below in place of the current `judgePhoto` function. Everything below `judgePhoto` stays as it is.

If the confirm call fails or returns an unreadable answer, the first answer stands, which is how the check behaves today.

```js
// The confirm step (tuning of 2026-11-27, docs/photo-check-tuning-2026-11-27.md). The first
// question over-calls send_back when a person, a blanket or a plant is in the photo, so a
// send_back is checked against plain yes/no facts about the same photo, and only reasons a fact
// backs are kept. A photo whose reasons are all unconfirmed passes.
export const PHOTO_FACTS_PROMPT = `Look at the puppy (or dog) in this photo and answer each question with true or false.

- dog_visible: Is there a puppy or dog in the photo?
- face_visible: Can you see the puppy's face, meaning at least its eyes or its nose?
- puppy_sharp: Is the puppy itself in focus, sharp enough to see its eyes and coat?
- text_on_puppy: Does a watermark or large text lie on top of the puppy itself?
- too_dark: Is the photo so dark that you can barely see the puppy?
- puppy_tiny: Is the puppy so small in the photo that you cannot see what it looks like?
- pixelated: Is the whole photo pixelated, very grainy or a low resolution screenshot?

Answer with JSON only.`;

const FACT_KEYS = ['dog_visible', 'face_visible', 'puppy_sharp', 'text_on_puppy', 'too_dark', 'puppy_tiny', 'pixelated'];
const FACTS_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(FACT_KEYS.map((k) => [k, { type: 'boolean' }])),
  required: FACT_KEYS,
};

// The fact that confirms each reason. A person counts only when the puppy's face cannot be seen.
const CONFIRMS = {
  hidden: (f) => f.face_visible === false || f.dog_visible === false,
  turned_away: (f) => f.face_visible === false,
  face_down: (f) => f.face_visible === false,
  person: (f) => f.face_visible === false,
  too_small: (f) => f.puppy_tiny === true || f.dog_visible === false,
  blurry: (f) => f.puppy_sharp === false,
  dark: (f) => f.too_dark === true,
  low_quality: (f) => f.pixelated === true,
  watermark: (f) => f.text_on_puppy === true,
};

function readFacts(response) {
  let o = response;
  if (typeof o === 'string') {
    const m = o.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { o = JSON.parse(m[0]); } catch { return null; }
  }
  if (!o || typeof o !== 'object' || !FACT_KEYS.some((k) => typeof o[k] === 'boolean')) return null;
  return o;
}

/** Keep only the reasons the facts confirm. Exported so a test can check the mapping without the model. */
export function confirmReasons(reasons, facts) {
  return (reasons || []).filter((r) => CONFIRMS[r] && CONFIRMS[r](facts));
}

function addUsage(a, b) {
  if (!a || !b) return a || b;
  return { ...a, prompt_tokens: (a.prompt_tokens || 0) + (b.prompt_tokens || 0), completion_tokens: (a.completion_tokens || 0) + (b.completion_tokens || 0), total_tokens: (a.total_tokens || 0) + (b.total_tokens || 0) };
}

/**
 * Judge one photo. bytes is the image (the 640 px card copy where there is one, which costs
 * fewer tokens). A send_back is checked by a second, yes/no question before it stands.
 * Returns { verdict, reasons, judged, usage, ms }, plus first and facts when the confirm step ran.
 */
export async function judgePhoto(env, bytes, contentType = 'image/jpeg', { sim } = {}) {
  const mode = photoCheckMode(env);
  if (mode === 'off') return { verdict: 'pass', reasons: [], judged: false };
  if (mode === 'sim') {
    const reasons = String(sim || '').split(',').map((r) => r.trim()).filter((r) => PHOTO_REASONS[r]);
    return { verdict: reasons.length ? 'send_back' : 'pass', reasons, judged: true, model: 'sim' };
  }
  const started = Date.now();
  const model = env.PHOTO_MODEL || PHOTO_MODEL;
  const image = { type: 'image_url', image_url: { url: `data:${contentType};base64,${base64(bytes)}` } };
  const ask = (text, schema, maxTokens) => env.AI.run(model, {
    messages: [{ role: 'user', content: [{ type: 'text', text }, image] }],
    response_format: { type: 'json_schema', json_schema: schema },
    max_tokens: maxTokens,
    temperature: 0,
  });
  try {
    const out = await ask(PHOTO_PROMPT, SCHEMA, 60);
    const v = readVerdict(out && out.response);
    if (!v) return { verdict: 'pass', reasons: [], judged: false, error: 'unreadable answer', usage: out && out.usage, ms: Date.now() - started };
    if (v.verdict === 'pass') return { ...v, judged: true, model, usage: out.usage, ms: Date.now() - started };
    // The confirm step. A failed or unreadable second answer leaves the first answer standing.
    let facts = null, usage = out.usage;
    try {
      const out2 = await ask(PHOTO_FACTS_PROMPT, FACTS_SCHEMA, 120);
      usage = addUsage(usage, out2 && out2.usage);
      facts = readFacts(out2 && out2.response);
    } catch { facts = null; }
    if (!facts) return { ...v, judged: true, model, usage, confirmed: false, ms: Date.now() - started };
    const reasons = confirmReasons(v.reasons, facts);
    return {
      verdict: reasons.length ? 'send_back' : 'pass',
      reasons,
      first: v,
      facts,
      judged: true,
      model,
      usage,
      ms: Date.now() - started,
    };
  } catch (e) {
    return { verdict: 'pass', reasons: [], judged: false, error: String(e.message || e).slice(0, 200), ms: Date.now() - started };
  }
}
```

The callers read only `verdict`, `reasons`, `judged`, `usage` and `error`, so the extra `first` and `facts` fields change nothing for them. `checkPhoto` stores `v.reasons` as before.

## Test to add

The test below needs no model. It checks the mapping that cleared the 23 false positives and kept photos 54 and 71.

```js
import { confirmReasons } from '../lib/photocheck.js';
const clear = { dog_visible: true, face_visible: true, puppy_sharp: true, text_on_puppy: false, too_dark: false, puppy_tiny: false, pixelated: false };
console.assert(confirmReasons(['person'], clear).length === 0, 'person with a visible face passes');
console.assert(confirmReasons(['hidden'], clear).length === 0, 'plant in a corner passes');
console.assert(confirmReasons(['blurry'], clear).length === 0, 'sharp running puppy passes');
console.assert(confirmReasons(['watermark'], clear).length === 0, 'brand on a bed passes');
console.assert(confirmReasons(['person'], { ...clear, face_visible: false }).join() === 'person', 'person hiding the face is sent back');
console.assert(confirmReasons(['blurry', 'too_small'], { ...clear, puppy_sharp: false }).join() === 'blurry', 'only confirmed reasons are kept');
```

## Notes

- Sample labels date from October 17, 2026. Photo 80 (grown dog) and photo 84 (Puppy Connection logo on a grown dog) are labeled flag but the current rules allow both, so the real problem count in the sample is 14 rather than 16.
- `dev/photo-check/eval.mjs` imports `judgePhoto`, so it scores the confirm step with no change. It still fetches the sample from Wix as JPEG and does not include the 23 production photos.
