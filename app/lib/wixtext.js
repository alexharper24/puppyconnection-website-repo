// Wix form residue in imported puppy descriptions (launch workplan A10).
//
// Some Wix listings carry their Add Puppy form fields run together at the start of the
// description, for example:
//   Mom's information weight: 8 pounds color: Dad's information weight: 6 pounds color:
//   Puppy's color - black with white markings Introducing a beautiful litter of Poodle puppies ...
// wixResidue() splits that run from the breeder's own prose. The prose is returned exactly as
// written after the run, never reworded. The values found go to their fields: the parents'
// weights to the litter and the puppy's color to the puppy. The parents' colors have no field of
// their own, so they are kept as one short line for the litter, in the form's own words. An empty
// label such as "color:" with nothing after it is dropped.

const PARENT = /(Mom|Mother|Dam|Dad|Father|Sire)['’]?s information\s*:?/gi;
const START = /^\s*(?:(?:Mom|Mother|Dam|Dad|Father|Sire)['’]?s information|Puppy['’]?s colou?r)/i;

/** True when a description starts with the Wix label run. */
export const hasWixResidue = (text) => START.test(String(text || ''));

const num = (s) => { const n = Number(s); return Number.isFinite(n) && n > 0 ? n : null; };

/**
 * Split one description. Returns null when it does not start with the label run, otherwise
 * { prose, mom: { weight, color }, dad: { weight, color }, puppyColor }.
 */
export function wixResidue(text) {
  const s = String(text || '');
  if (!hasWixResidue(s)) return null;
  // The puppy's color closes the run. It is the words after "Puppy's color -" up to the first
  // capitalized word after them, which starts the prose ("- Merle Bella is ..." gives Merle).
  const pc = s.match(/Puppy['’]?s colou?r\s*[-:–]\s*(\S+(?:\s+[a-z][^\s]*)*)\s*/);
  const runEnd = pc ? pc.index + pc[0].length : s.length;
  const run = s.slice(0, pc ? pc.index : runEnd);
  const out = { prose: s.slice(runEnd).trim(), mom: {}, dad: {}, puppyColor: pc ? pc[1].trim() : null };
  const parts = run.split(PARENT);
  // split() with a capture group gives [before, who, segment, who, segment, ...].
  for (let i = 1; i < parts.length; i += 2) {
    const who = /^(Mom|Mother|Dam)$/i.test(parts[i]) ? out.mom : out.dad;
    const seg = parts[i + 1] || '';
    const w = seg.match(/weight\s*:\s*([\d.]+)/i);
    if (w) who.weight = num(w[1]);
    const c = seg.match(/colou?r\s*:\s*(.*)$/is);
    const color = c ? c[1].replace(/\s+/g, ' ').trim() : '';
    if (color) who.color = color;
  }
  return out;
}

/** The parents' colors as one line for the litter, or null when the form left them empty. */
export function parentColorLine(r) {
  const bits = [r.mom.color ? `Mom's color: ${r.mom.color}.` : '', r.dad.color ? `Dad's color: ${r.dad.color}.` : ''].filter(Boolean);
  return bits.length ? bits.join(' ') : null;
}

/**
 * Clean one harvested Wix listing in place, before the seed or the import writes it. The prose
 * becomes the description, and a value the form held fills its field only where that is empty.
 */
export function cleanListing(l) {
  const r = wixResidue(l.description);
  if (!r) return l;
  l.description = r.prose || null;
  if (!l.mom_weight && r.mom.weight) l.mom_weight = `${r.mom.weight} lbs`;
  if (!l.dad_weight && r.dad.weight) l.dad_weight = `${r.dad.weight} lbs`;
  // The puppy's color from the form, kept apart from any color the listing already carried.
  l.form_color = r.puppyColor || null;
  l.parent_colors = parentColorLine(r);
  return l;
}
