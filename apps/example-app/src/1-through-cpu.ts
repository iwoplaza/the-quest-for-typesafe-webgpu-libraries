import { generateHeightMap } from "abc-gen";
import { initXyz } from "xyzplot";
import { getCanvas, type VersionOptions } from "./helpers.ts";

export default async function main({ root, size }: VersionOptions) {
  const SIZE = 2 ** size;
  const xyz = await initXyz(root, { target: getCanvas(), pointSize: 16/size**4 });

  const terrain = await generateHeightMap(root, [SIZE, SIZE]);
  //    ^?

  const transformStart = performance.now();

  const s = 1 / (SIZE - 1);
  const points = Array.from({ length: SIZE * SIZE }, (_, idx) => {
    const x = idx % SIZE;
    const z = Math.floor(idx / SIZE);
    const y = terrain[x][z];
    // -1 to 1
    const norm = [x * s - 0.5, y, z * s - 0.5];
    // Scaling up
    return [norm[0] * 25, norm[1] * 0.01, norm[2] * 25] as const;
  });

  performance.measure('🫐 transform', { start: transformStart });

  await xyz.plot3d(points);

  // Cleanup function
  return () => {
    xyz.destroy();
  };
}
