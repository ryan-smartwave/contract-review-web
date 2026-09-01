export type Segment<T> = string | { item: T };

/** Split text on each item's anchor. Pass items sorted longest-anchor-first
 *  so a shorter anchor can't split inside a longer one. */
export function segment<T>(
  text: string,
  items: T[],
  anchor: (item: T) => string,
): Segment<T>[] {
  let segments: Segment<T>[] = [text];
  for (const item of items) {
    const needle = anchor(item);
    segments = segments.flatMap((seg) => {
      if (typeof seg !== 'string' || !seg.includes(needle)) return [seg];
      const [before, ...rest] = seg.split(needle);
      return [before, { item }, rest.join(needle)];
    });
  }
  return segments;
}
