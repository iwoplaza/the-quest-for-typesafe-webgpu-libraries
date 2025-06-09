import tgpu from "typegpu";
import { arrayOf, builtin, vec3f } from "typegpu/data";
import { generateHeightMap } from "abc-gen/v2";
import { initXyz } from "xyz-plot/v2";

const root = await tgpu.init();

const SIZE = 2048;
const terrain = generateHeightMap(root, [SIZE, SIZE]);
const terrainReadonly = terrain.as('readonly');
//    ^?

const pointsBuffer = root.createBuffer(arrayOf(vec3f, SIZE * SIZE)).$usage('storage');
const points = pointsBuffer.as('mutable');
const transformShader = tgpu['~unstable'].computeFn({
  workgroupSize: [1, 1],
  in: { id: builtin.globalInvocationId },
})(({ id }) => {
  const idx = id.y * SIZE + id.x;
  points.value[idx] = vec3f(id.x, terrainReadonly.value[id.x][id.y], id.y);
});

root["~unstable"]
  .withCompute(transformShader)
  .createPipeline()
  .dispatchWorkgroups(SIZE, SIZE);

const xyz = await initXyz(root, { target: getCanvas(), pointSize: 0.001 });
xyz.plot3d(pointsBuffer);

// Helpers

function getCanvas() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const devicePixelRatio = window.devicePixelRatio;
  const width = window.innerWidth * devicePixelRatio;
  const height = window.innerHeight * devicePixelRatio;
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
