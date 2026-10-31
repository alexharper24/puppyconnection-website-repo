// The HTML part of every email (Alex 2026-10-25). Design B from dev/email-options.html, the warm
// brand band: a charcoal header with the white logo and tagline over a gold line, a cream body, a
// gold button with charcoal text and a charcoal footer with the contact lines. Design C's short
// opening line in Amber's voice and its sign-off are added to the emails breeders get. Notices to
// Puppy Connection's own people (ops_alert, a new sign-up waiting, a listing report) stay plain.
//
// The words are not written twice. Each template's plain text in lib/mail.js stays the `text`
// part exactly as it was, and the HTML is built from that same text: paragraphs stay paragraphs,
// a line that is only a web address becomes the button (the first one) or a link, and indented
// lines become a list. Every value is escaped on the way in.
//
// The logo loads from the public site by its full address, SITE_ORIGIN + /img/brand/logo-white.png,
// so it works on staging now and on puppy-connection.com at cutover. EMAIL_LOGO_URL overrides it.
// It is never inlined as a data URI, because many mail clients block those.

const SITE = 'Puppy Connection';
const TAGLINE = 'Where puppies find their people.';
const SIGNATURE = 'The Puppy Connection team';
const AUTOMATIC = 'This is an automatic message from the breeder portal.';
// The signOff() lib/mail.js appends to every text part. The HTML shows it in the footer instead.
const TEXT_SIGNOFF = `\n\n${SITE}\n${AUTOMATIC}`;
const LOGO_PATH = '/img/brand/logo-white.png'; // 1851 x 897
const DEFAULT_SITE = 'https://www.puppy-connection.com';

export const CONTACT = {
  email: 'info@puppy-connection.com',
  phone: '(574) 221-0326',
  tel: '+15742210326',
  facebook: 'https://www.facebook.com/puppyconnectionUSA',
  instagram: 'https://www.instagram.com/puppy_connection_in/',
};

// The colors of design B, every pair checked for WCAG AA in dev/email-options.html. The band is the sage green of the site's header and footer (Amber, 2026-10-30): cream text 5.5:1, gold 5.2:1.
const C = { band: '#4a5a4b', gold: '#f7d57f', cream: '#f5f2ea', ink: '#262626', body: '#414141', muted: '#6f6a60', olive: '#7c6b40', creamText: '#e6deca' };
const SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";
const SANS = "'Barlow','Segoe UI',Helvetica,Arial,sans-serif";

/**
 * What the HTML adds to each template. `opener` is design C's first line, draft wording for Amber
 * to rewrite. `staff` marks a notice to Puppy Connection's own people, which gets no opener and no
 * sign-off. `button` is the label of the button made from the email's own link. `heading` and
 * `preheader` default to the subject and the first paragraph.
 */
export const TEMPLATE_HTML = {
  signup_verify: { opener: 'Hi, and thank you for signing up with us.', button: 'Confirm your email' },
  password_reset: { opener: 'Hi there, here is the link you asked for.', button: 'Set your password',
    preheader: () => 'The link works once and stops working after 1 hour.' },
  invitation: { opener: 'Hi, and welcome. We are so glad you are joining us.', button: 'Choose your password',
    heading: (d) => `You are invited to manage ${d.kennels && d.kennels.length > 1 ? `${d.kennels.length} kennels` : d.business}`,
    preheader: (d) => `Choose your password to sign in. The link works for ${d.days} days.` },
  member_added: { opener: 'Hi, and welcome. We are glad to have you with us.', button: 'Choose your password',
    heading: (d) => `You can now sign in to ${d.business}`,
    preheader: (d) => `Choose your password to sign in. The link works for ${d.days} days.` },
  kennel_added: { opener: 'Hi, and welcome to another kennel.', button: 'Add this kennel',
    heading: (d) => `You can now manage ${d.business}`,
    preheader: (d) => `Confirm with your current password to add it. The link works for ${d.days} days.` },
  kennel_access: { opener: 'Hi, here is some good news about your account.', button: 'Open the breeder portal',
    heading: (d) => `You can now manage ${d.kennels && d.kennels.length > 1 ? `${d.kennels.length} kennels` : d.business}`,
    preheader: () => 'There is nothing to confirm. Choose the kennel next time you sign in.' },
  contact_changed: { opener: 'Hi, we wanted to let you know about a change to your account.', button: 'Open the breeder portal' },
  profile_submitted: { staff: true, button: 'Review the profile' },
  approved: { opener: 'Hi, we are so happy to share this news with you.', button: 'Open the breeder portal' },
  declined: { opener: 'Hi, we wanted to write to you personally about your application.' },
  suspended: { opener: 'Hi, here is an update on your account.' },
  reinstated: { opener: 'Hi, we are glad to have you back.', button: 'Open the breeder portal' },
  listings_live: { opener: 'Hi, congratulations on your new listings.', button: 'Open the breeder portal' },
  expiring_soon: { opener: 'Hi, here is a quick reminder about your listings.', button: 'Renew in the breeder portal' },
  expired: { opener: 'Hi, here is a quick update on your listings.', button: 'Renew in the breeder portal' },
  listing_refunded: { opener: 'Hi, here is an update about your listing payment.', button: 'Open the breeder portal' },
  photo_reminder: { opener: 'Hi, families love seeing how your puppies look today.', button: 'Open the breeder portal' },
  listing_offline: { opener: 'Hi, here is an update on your listings and how to bring them back.', button: 'Open the breeder portal' },
  listing_removed: { opener: 'Hi, here is an update on your listings and how to list them again.', button: 'Open the breeder portal' },
  photo_hold: { opener: 'Hi, we need a little help with your puppy photos.', button: 'Add a photo' },
  photo_sent_back: { opener: 'Hi, we need a little help with one of your photos.', button: 'Open the breeder portal' },
  listing_report: { staff: true, button: 'Open the report' },
  ops_alert: { staff: true },
};

export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** The full https address of the white logo, from the site this deployment serves. */
export function emailLogoUrl(env = {}) {
  if (env.EMAIL_LOGO_URL) return String(env.EMAIL_LOGO_URL);
  const site = String(env.SITE_ORIGIN || '').replace(/\/+$/, '') || DEFAULT_SITE;
  return site + LOGO_PATH;
}

// ---------- text to blocks ----------

const URL_RE = /https?:\/\/[^\s<>"']+/g;
const ONLY_URL = /^https?:\/\/[^\s<>"']+$/;

// A web address with any trailing sentence punctuation left outside the link.
function splitUrl(u) {
  const m = /[.,;:!?)]+$/.exec(u);
  return m ? [u.slice(0, -m[0].length), m[0]] : [u, ''];
}

/** Escape a line of text and turn each web address in it into a link. */
function linkify(line, linkColor) {
  let out = '';
  let last = 0;
  for (const m of String(line).matchAll(URL_RE)) {
    const [url, tail] = splitUrl(m[0]);
    out += esc(line.slice(last, m.index)) + `<a href="${esc(url)}" style="color:${linkColor};text-decoration:underline;word-break:break-all;">${esc(url)}</a>` + esc(tail);
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last));
}

/**
 * Split plain text into blocks: { kind: 'p', lines }, { kind: 'list', lines: [{ indent, text }] }
 * and { kind: 'url', url }. A blank line ends a paragraph, as it does in the text part.
 */
export function textBlocks(text) {
  const blocks = [];
  for (const para of String(text).replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    let cur = null;
    const flush = () => { if (cur) blocks.push(cur); cur = null; };
    for (const raw of para.split('\n')) {
      if (!raw.trim()) continue;
      const line = raw.replace(/\s+$/, '');
      if (ONLY_URL.test(line.trim())) { flush(); blocks.push({ kind: 'url', url: line.trim() }); continue; }
      const indent = /^\s*/.exec(line)[0].length;
      const kind = indent >= 2 ? 'list' : 'p';
      if (!cur || cur.kind !== kind) { flush(); cur = { kind, lines: [] }; }
      cur.lines.push(kind === 'list' ? { indent, text: line.trim() } : line);
    }
    flush();
  }
  return blocks;
}

// ---------- the pieces of design B ----------

function head(title) {
  return '<!doctype html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head>'
    + '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">'
    + `<title>${esc(title)}</title>`
    + '<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">'
    + `<style>body{margin:0;padding:0;background:${C.band}}a{text-decoration:underline}`
    + '@media only screen and (max-width:480px){.pad{padding-left:22px!important;padding-right:22px!important}.h1{font-size:25px!important;line-height:32px!important}.btn-t{width:100%!important}.btn-a{display:block!important;text-align:center!important}.outer{padding:0!important}}</style>'
    + `</head><body style="margin:0;padding:0;background:${C.band};">`;
}

function preheader(text) {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;">${esc(text)}</div>`;
}

// A padding-based bulletproof button. The color sits on the cell, so it shows with images off.
function button(text, href) {
  return '<table role="presentation" class="btn-t" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0;">'
    + `<tr><td align="center" bgcolor="${C.gold}" style="background:${C.gold};border-radius:4px;mso-padding-alt:17px 40px;">`
    + `<a class="btn-a" href="${esc(href)}" style="display:inline-block;padding:17px 40px;font-family:${SANS};font-size:18px;line-height:22px;font-weight:700;letter-spacing:0.04em;color:${C.ink};text-decoration:none;border-radius:4px;">${esc(text)}</a>`
    + '</td></tr></table>';
}

const P = `margin:0 0 18px;font-family:${SANS};font-size:17px;line-height:27px;color:${C.body};`;

function block(b) {
  if (b.kind === 'p') return `<p style="${P}">${b.lines.map((l) => linkify(l, C.olive)).join('<br>')}</p>`;
  if (b.kind === 'list') {
    const base = Math.min(...b.lines.map((l) => l.indent));
    return `<p style="${P}">${b.lines.map((l) => (l.indent > base
      ? `<span style="display:inline-block;padding-left:18px;">${linkify(l.text, C.olive)}</span>`
      : `<strong style="color:${C.ink};">${linkify(l.text, C.olive)}</strong>`)).join('<br>')}</p>`;
  }
  return `<p style="${P}"><a href="${esc(b.url)}" style="color:${C.olive};text-decoration:underline;word-break:break-all;">${esc(b.url)}</a></p>`;
}

function fallback(link) {
  return `<p style="margin:0 0 18px;font-family:${SANS};font-size:14px;line-height:21px;color:${C.muted};">If the button does not work, copy this link into your browser:<br>`
    + `<a href="${esc(link)}" style="color:${C.olive};word-break:break-all;">${esc(link)}</a></p>`;
}

function logo(src) {
  return `<img src="${esc(src)}" width="200" height="97" alt="${SITE}" `
    + `style="display:block;border:0;outline:none;width:200px;max-width:100%;height:auto;font-family:${SERIF};font-size:24px;line-height:30px;font-weight:600;color:#ffffff;">`;
}

function contactLines() {
  const s = `margin:0 0 6px;font-family:${SANS};font-size:14px;line-height:21px;color:${C.creamText};text-align:center;`;
  const a = `style="color:${C.gold};text-decoration:underline;"`;
  return `<p style="${s}"><a href="mailto:${CONTACT.email}" ${a}>${CONTACT.email}</a> &nbsp;&middot;&nbsp; <a href="tel:${CONTACT.tel}" ${a}>${CONTACT.phone}</a></p>`
    + `<p style="${s}margin-bottom:12px;"><a href="${CONTACT.facebook}" ${a}>Facebook</a> &nbsp;&middot;&nbsp; <a href="${CONTACT.instagram}" ${a}>Instagram</a></p>`;
}

/**
 * The footer. A portal email says it is automatic. A list email carries the mailing address when
 * one is set (CAN-SPAM, and a send cannot start without it), the reason line and the unsubscribe link.
 */
function footer(list) {
  const s = `margin:0 0 6px;font-family:${SANS};font-size:14px;line-height:21px;color:${C.creamText};text-align:center;`;
  let out = `<p style="${s}font-weight:700;">${SITE}</p>`;
  if (!list) return out + `<p style="${s}margin-bottom:12px;">${AUTOMATIC}</p>` + contactLines();
  if (list.address) out += `<p style="${s}margin-bottom:12px;">${String(list.address).split(/\r?\n/).map(esc).join('<br>')}</p>`;
  out += contactLines();
  return out + `<p style="${s}margin-bottom:0;">${esc(list.why)} To stop getting them, <a href="${esc(list.unsub)}" style="color:${C.gold};text-decoration:underline;">unsubscribe here</a>.</p>`;
}

/** First paragraph as plain text, cut at a word near 140 characters, for the preheader. */
function firstWords(blocks) {
  const p = blocks.find((b) => b.kind === 'p');
  const t = p ? p.lines.join(' ').replace(/\s+/g, ' ').trim() : '';
  if (t.length <= 140) return t;
  return `${t.slice(0, 140).replace(/\s+\S*$/, '')}...`;
}

/**
 * The whole email. blocks come from textBlocks. The first 'url' block becomes the button when a
 * button label is given, and the fallback link under the sign-off repeats it.
 */
export function layout({ subject, heading, preheader: pre, opener, blocks, buttonLabel, signature, list, logoUrl }) {
  let primary = null;
  const body = blocks.map((b) => {
    if (b.kind === 'url' && buttonLabel && !primary) {
      primary = b.url;
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:8px 0 26px;">${button(buttonLabel, b.url)}</td></tr></table>`;
    }
    return block(b);
  }).join('');
  const cream = `bgcolor="${C.cream}" class="pad" style="background:${C.cream};`;
  return head(subject) + preheader(pre || firstWords(blocks))
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.band}" style="background:${C.band};"><tr><td class="outer" align="center" style="padding:0;">`
    + '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">'
    + `<tr><td align="center" bgcolor="${C.band}" style="background:${C.band};padding:30px 24px 26px;">${logo(logoUrl)}`
    + `<p style="margin:12px 0 0;font-family:${SERIF};font-style:italic;font-size:15px;line-height:22px;color:${C.creamText};">${TAGLINE}</p></td></tr>`
    + `<tr><td bgcolor="${C.gold}" style="background:${C.gold};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>`
    // One cream cell holds the whole body, so no seam can show between rows.
    + `<tr><td ${cream}padding:40px 48px 30px;">`
    + `<h1 class="h1" style="margin:0 0 20px;font-family:${SERIF};font-size:28px;line-height:36px;font-weight:600;color:${C.ink};">${esc(heading || subject)}</h1>`
    + (opener ? `<p style="margin:0 0 18px;font-family:${SERIF};font-style:italic;font-size:21px;line-height:30px;color:${C.ink};">${esc(opener)}</p>` : '')
    + body
    + (signature ? `<p style="margin:6px 0 24px;font-family:${SERIF};font-style:italic;font-size:19px;line-height:27px;color:${C.ink};">${SIGNATURE}</p>` : '')
    + (primary ? fallback(primary) : '')
    + '</td></tr>'
    + `<tr><td bgcolor="${C.band}" class="pad" style="background:${C.band};padding:28px 48px 32px;">${footer(list)}</td></tr>`
    + '</table></td></tr></table></body></html>';
}

/** The HTML part for one of lib/mail.js's TEMPLATES, built from its own text part. */
export function templateHtml(env, template, msg, data = {}) {
  const cfg = TEMPLATE_HTML[template] || { staff: true };
  const text = msg.text.endsWith(TEXT_SIGNOFF) ? msg.text.slice(0, -TEXT_SIGNOFF.length) : msg.text;
  return layout({
    subject: msg.subject,
    heading: cfg.heading ? cfg.heading(data) : msg.subject,
    preheader: cfg.preheader ? cfg.preheader(data) : '',
    opener: cfg.staff ? '' : cfg.opener,
    blocks: textBlocks(text),
    buttonLabel: cfg.button,
    signature: !cfg.staff,
    logoUrl: emailLogoUrl(env),
  });
}

// A campaign author's own greeting, such as "Hi friends, we have some happy news to share.", is
// shown in design C's opening style. Nothing is added when the email does not start with one.
const GREETING = /^(hi|hello|hey|dear|good (morning|afternoon|evening)|greetings)\b/i;

/** The button label for a web address on its own line in a list email. */
function visitLabel(url) {
  try { return `Visit ${new URL(url).hostname.replace(/^www\./, '')}`; } catch { return 'Open the link'; }
}

/** The HTML part of a mailing-list email. address is empty when none is set, and is then left out. */
export function campaignHtml({ subject, body, address, why, unsub, logoUrl }) {
  const blocks = textBlocks(body);
  let opener = '';
  const first = blocks[0];
  if (first && first.kind === 'p' && first.lines.length === 1 && first.lines[0].length <= 120 && GREETING.test(first.lines[0].trim())) {
    opener = first.lines[0].trim();
    blocks.shift();
  }
  const firstUrl = blocks.find((b) => b.kind === 'url');
  return layout({
    subject,
    heading: subject,
    opener,
    blocks,
    buttonLabel: firstUrl ? visitLabel(firstUrl.url) : '',
    signature: false,
    list: { address, why, unsub },
    logoUrl: logoUrl || emailLogoUrl({}),
  });
}
