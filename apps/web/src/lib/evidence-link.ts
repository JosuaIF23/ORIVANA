/**
 * Deep link into the document viewer that highlights one passage
 * (PRD §8.2: from a citation, matrix cell, claim, or decision).
 * `back` is where the banner's "Back" link returns to.
 */
export function evidenceHref(e: { source_id: string; page: number; chunk_id: string; char_start: number; char_end: number }, back?: { href: string; label: string }): string {
  const params = new URLSearchParams({ page: String(e.page), hl: `${e.chunk_id}:${e.char_start}:${e.char_end}` });
  if (back) {
    params.set('back', back.href);
    params.set('label', back.label);
  }
  return `/knowledge/sources/${e.source_id}?${params.toString()}`;
}

/** Parses `hl` and `back` from the viewer URL. Only internal paths are accepted for `back`. */
export function parseEvidenceParams(params: URLSearchParams) {
  const [chunk_id, start, end] = (params.get('hl') ?? '').split(':');
  const highlight = chunk_id && start && end ? { chunk_id, char_start: Number(start), char_end: Number(end) } : null;
  const backHref = params.get('back');
  const back = backHref && backHref.startsWith('/') && !backHref.startsWith('//') ? { href: backHref, label: params.get('label') ?? 'the previous page' } : null;
  return { highlight, back };
}
