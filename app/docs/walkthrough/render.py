"""Render the breeder walkthrough (index.html, with the portal's walkthrough.css and .js) to an MP4, frame by frame.

    python app/docs/walkthrough/render.py                 # 1920x1080, breeder-walkthrough.mp4
    python app/docs/walkthrough/render.py --phone         # 1080x1920, the phone layout
    python app/docs/walkthrough/render.py out.mp4 --fps 60

The page plays in headless Chromium on Playwright's fake clock, and each frame advances the clock
by one frame and moves every CSS animation and transition to the same moment, so the video is
exact however slow the machine is. Frames go as JPEGs to the ffmpeg that ships with
imageio-ffmpeg (pip install imageio-ffmpeg), which encodes H.264. The video shows only the
screen, the progress bar and the caption, without the page heading and the controls.
"""
import argparse
import pathlib
import subprocess

import imageio_ffmpeg
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
PUBLIC = HERE.parents[1] / 'portal' / 'public'   # walkthrough.css and walkthrough.js, shared with the portal
ORIGIN = 'http://walkthrough.local'

# The skeleton the Artifact host wraps around index.html.
HEAD = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<style>:root{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>')

FRAME_CSS = {
    'desk': """
      .page > header, .wt-steps, .wt-ctrl, .wt-note { display: none !important; }
      .page { max-width: 1500px !important; padding: 34px 0 0 !important; gap: 0 !important; }
      .wt { gap: 18px !important; }
      .wt-cap { font-size: 32px !important; min-height: 0 !important; max-width: none !important; text-align: center; }
      .wt-bar { height: 6px; }
    """,
    'phone': """
      .page > header, .wt-steps, .wt-ctrl, .wt-note { display: none !important; }
      .page { padding: 16px 16px 0 !important; gap: 0 !important; }
      .wt { gap: 12px !important; }
      .wt-cap { font-size: 19px !important; text-align: center; max-width: none !important; }
    """,
}

# Smooth scrolling is not a CSS animation, so the fake clock would not move it. Run it on timers.
SMOOTH_SCROLL = """
(() => {
  const plain = Element.prototype.scrollTo;
  Element.prototype.scrollTo = function (o) {
    if (!o || o.behavior !== 'smooth') return plain.apply(this, arguments);
    const el = this, from = el.scrollTop, to = o.top, t0 = performance.now(), d = 420;
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / d), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      el.scrollTop = from + (to - from) * e;
      if (k < 1) setTimeout(step, 16);
    })();
  };
})();
"""

# Pause every animation the first time it is seen, then set it to the fake clock's time.
SYNC = """() => {
  const now = performance.now();
  for (const a of document.getAnimations()) {
    if (a.__t0 === undefined) { a.__t0 = now; a.pause(); }
    a.currentTime = now - a.__t0;
  }
  return document.querySelector('[data-wt="play"]').textContent;
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out', nargs='?')
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--phone', action='store_true')
    args = ap.parse_args()
    mode = 'phone' if args.phone else 'desk'
    out = pathlib.Path(args.out or HERE / ('breeder-walkthrough' + ('-phone' if args.phone else '') + '.mp4'))
    # The phone layout needs a player under 620px wide, so it renders small and scales up.
    viewport, scale = ({'width': 432, 'height': 768}, 2.5) if args.phone else ({'width': 1920, 'height': 1080}, 1)

    page_html = HEAD + (HERE / 'index.html').read_text(encoding='utf-8').replace('</style>', FRAME_CSS[mode] + '</style>', 1)
    ffmpeg = subprocess.Popen(
        [imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(args.fps),
         '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
         '-movflags', '+faststart', str(out)],
        stdin=subprocess.PIPE)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=viewport, device_scale_factor=scale, reduced_motion='no-preference')
        page.route(ORIGIN + '/index.html', lambda r: r.fulfill(body=page_html, content_type='text/html; charset=utf-8'))
        page.route(ORIGIN + '/walkthrough.css', lambda r: r.fulfill(path=str(PUBLIC / 'walkthrough.css'), content_type='text/css'))
        page.route(ORIGIN + '/walkthrough.js', lambda r: r.fulfill(path=str(PUBLIC / 'walkthrough.js'), content_type='text/javascript'))
        page.route(ORIGIN + '/logo-white.webp', lambda r: r.fulfill(path=str(HERE / 'logo-white.webp'), content_type='image/webp'))
        # An installed clock still follows real time until it is paused.
        page.clock.install(time=1793534400000)
        page.clock.pause_at(1793534401000)
        page.add_init_script(SMOOTH_SCROLL)
        page.goto(ORIGIN + '/index.html', wait_until='networkidle')
        page.evaluate('document.fonts.ready.then(() => true)')

        frames, done, ended = 0, 0, None
        while True:
            target = round((frames + 1) * 1000 / args.fps)
            page.clock.run_for(target - done)
            done = target
            state = page.evaluate(SYNC)
            ffmpeg.stdin.write(page.screenshot(type='jpeg', quality=92))
            frames += 1
            if state == 'Replay' and ended is None:
                ended = frames
            if ended is not None and frames - ended >= args.fps * 2:
                break
            if frames % (args.fps * 10) == 0:
                print(f'{frames / args.fps:.0f}s rendered', flush=True)
            if frames > args.fps * 600:
                raise SystemExit('The walkthrough did not reach its end within ten minutes of video.')
        browser.close()

    ffmpeg.stdin.close()
    ffmpeg.wait()
    print(f'{out} written, {frames} frames, {frames / args.fps:.1f}s at {args.fps} fps')


if __name__ == '__main__':
    main()
