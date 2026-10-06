// CSV for the admin's report downloads (plan P3.7), built on the server.
//
// A cell that starts with = + - @ (or a tab or carriage return) is read as a formula by Excel,
// Sheets and LibreOffice, so a breeder who names a puppy "=HYPERLINK(...)" could otherwise put a
// live formula in Amber's spreadsheet. Every such text cell gets a leading apostrophe, which
// the spreadsheet shows as plain text. Numbers are written as numbers.

const RISKY = /^[=+\-@\t\r]/;

export function csvCell(v) {
  if (v == null) return '';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  let s = String(v);
  if (RISKY.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s) || s !== s.trim()) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header, rows) {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** A CSV download. The byte order mark lets Excel read names with accents correctly. */
export function csvResponse(name, header, rows) {
  return new Response(`﻿${toCsv(header, rows)}`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${name}"`,
      'cache-control': 'private, no-store',
    },
  });
}
