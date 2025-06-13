import tgpu from "typegpu";
import { arrayOf, vec3f } from "typegpu/data";
import { generateHeightMap } from "abc-gen/v3";
import { initXyz } from "xyz-plot";
import { getCanvas, dispatch2d, type VersionOptions } from "./helpers.ts";
tgpu;

export default async function main({ root, size }: VersionOptions) {
  const SIZE = 2 ** size;

  const xyz = await initXyz(root, { target: getCanvas(), pointSize: 16 / size**4 });

  const genStart = performance.now();
  const terrain = generateHeightMap(root, [SIZE, SIZE]).as("readonly");
  await root.device.queue.onSubmittedWorkDone();
  performance.measure('🫐 generating', { start: genStart });
  //    ^?

  const pointsBuffer = root.createBuffer(arrayOf(vec3f, SIZE * SIZE)).$usage(
    "storage",
  );
  const points = pointsBuffer.as("mutable");

  const s = 1 / (SIZE - 1);

  const transformStart = performance.now();
  dispatch2d(root, [SIZE, SIZE], (x, y) => {
    "kernel";
    const height = terrain.value[x][y];
    let point = vec3f(x, height, y);
    // -1 to 1
    point = vec3f(point.x * s - 0.5, point.y, point.z * s - 0.5);
    // Scaling up
    point = vec3f(point.x * 25, point.y * 0.01, point.z * 25);
    points.value[y * SIZE + x] = point;
  });
  root["~unstable"].flush();
  await root.device.queue.onSubmittedWorkDone();
  performance.measure('🫐 transform', { start: transformStart });

  await xyz.plot3d(pointsBuffer);

  // Cleanup function
  return () => {
    xyz.destroy();
  };
}
