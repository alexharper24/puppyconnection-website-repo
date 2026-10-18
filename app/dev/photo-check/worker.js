// A one-route Worker for scoring the photo check against the test set (photo-check-eval.mjs).
// It runs under wrangler dev, where the AI binding always calls the real Workers AI on the
// Puppy Connection account. POST an image body with its content type and get the verdict back.
import { judgePhoto } from '../../lib/photocheck.js';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('POST an image', { status: 405 });
    const bytes = new Uint8Array(await request.arrayBuffer());
    return Response.json(await judgePhoto({ ...env, PHOTO_CHECK_MODE: 'ai' }, bytes, request.headers.get('content-type') || 'image/jpeg'));
  },
};
