export function generateHeightMap(size: readonly [number, number]): number[][] {
  return Array.from(
    { length: size[0] },
    () =>
      Array.from(
        { length: size[1] },
        () => Math.random(),
      ),
  );
}
