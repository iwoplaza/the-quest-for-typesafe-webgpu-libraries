import { generateHeightMap } from "abc-gen/gpu";
import { initXyzPlot } from "xyz-plot/gpu";

const SIZE = 2048;
const terrain = await generateHeightMap(root, [SIZE, SIZE]);
const terrainReadonly = terrain.as('readonly');
//    ^?

const pointsMutable = root.createMutable(arrayOf(vec3f));
const transformShader = tgpu.computeFn({
  in: { id: builtin.globalInvocationId },
})(({ id }) => {
  const idx = id.y * SIZE + id.x;
  pointsMutable.value[idx] = terrainReadonly.value[id.x][id.y];
});

root
  .withCompute(transformShader)
  .createPipeline()
  .dispatchWorkgroups([SIZE, SIZE]);

const xyz = await initXyzPlot(root, { target: getCanvas() });
xyz.plot3d(pointsMutable);

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
