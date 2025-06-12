import tgpu from "typegpu";
import { arrayOf, vec3f } from "typegpu/data";
import { generateHeightMap } from "abc-gen/v3";
import { initXyz } from "xyz-plot/v3";
import { mul } from "typegpu/std";
import { getCanvas, dispatch2d } from "./helpers.ts";

export default async function main() {
  const SIZE = 2048;

  const root = await tgpu.init();
  const xyz = await initXyz(root, { target: getCanvas(), pointSize: 0.001 });

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

  dispatch2d(root, [SIZE, SIZE], (x, y) => {
    "kernel";
    const height = terrain.value[x][y];
    let point = vec3f(x, height, y);
    point = vec3f(point.x * s - 0.5, point.y * s, point.z * s - 0.5);
    point = mul(point, 25);
    points.value[y * SIZE + x] = point;
  });















  root["~unstable"].flush();
  await root.device.queue.onSubmittedWorkDone();
  // performance.measure('🫐 transform', { start: transformStart });

  await xyz.plot3d(pointsBuffer);

  // Cleanup function
  return () => {
    root.destroy();
  };
}
