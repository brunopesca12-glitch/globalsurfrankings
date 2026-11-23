/** Insert `incoming` so it becomes 1-based `place`. Existing ids keep their order and shift down. */
export function stackAfterInsert(ids: readonly string[], incoming: string, place: number): string[] | null {
  if (!Number.isInteger(place) || place < 1 || place > ids.length + 1) return null;
  if (ids.includes(incoming)) return null;
  return [...ids.slice(0, place - 1), incoming, ...ids.slice(place - 1)];
}

export function confirmPlaceCopy(place: number, stackLength: number): string {
  if (stackLength === 0) return "Set this wave as #1?";
  if (place > stackLength) return `Place this wave at #${place}?`;
  return `Place this wave at #${place}? The current #${place} moves to #${place + 1}.`;
}
