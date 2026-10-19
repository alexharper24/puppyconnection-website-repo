// A one-route Worker that finds where the dog sits in a photo, for the photo framing work
// (dev/photo-focus/eval.mjs). It runs under wrangler dev, where the AI binding calls the real
// Workers AI on the Puppy Connection account. POST image bytes and get the detector's boxes back.
// The detector says only where a dog is, never which puppy or breed it is.
const FOCUS_MODEL = '@cf/facebook/detr-resnet-50';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('POST an image', { status: 405 });
    const bytes = new Uint8Array(await request.arrayBuffer());
    const t = Date.now();
    try {
      const out = await env.AI.run(FOCUS_MODEL, { image: [...bytes] });
      return Response.json({ ms: Date.now() - t, boxes: out });
    } catch (e) {
      return Response.json({ ms: Date.now() - t, error: String(e && e.message || e) }, { status: 502 });
    }
  },
};
