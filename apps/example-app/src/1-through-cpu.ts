import { generateHeightMap } from "abc-gen";
import { initXyz } from "xyz-plot";
import { getCanvas } from "./helpers.ts";

const SIZE = 2048;

export default async function main() {
  const xyz = await initXyz({ target: getCanvas(), pointSize: 0.001 });

  const terrain = await generateHeightMap([SIZE, SIZE]);
  //    ^?

  const transformStart = performance.now();

  const s = 1 / (SIZE - 1);
  const points = Array.from({ length: SIZE * SIZE }, (_, idx) => {
    const x = idx % SIZE;
    const z = Math.floor(idx / SIZE);
    const y = terrain[x][z];
    // -1 to 1
    const norm = [x * s - 0.5, y * s, z * s - 0.5];
    // Scaling up
    return norm.map((x) => x * 25) as [number, number, number];
  });

  performance.measure('🫐 transform', { start: transformStart });

  await xyz.plot3d(points);

  // Nothing to cleanup
  return () => {};
}
