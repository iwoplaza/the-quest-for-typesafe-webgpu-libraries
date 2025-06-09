import { generateHeightMap } from "abc-gen";
import { initXyzPlot } from "xyz-plot";

const SIZE = 2048;
const terrain = await generateHeightMap([SIZE, SIZE]);
//    ^?

console.log(terrain);

const s = 1 / (SIZE-1);
const scale = 25;
const points = terrain.flatMap((col, x) =>
  col.map((y, z) => [(x * s - 0.5) * scale, (y * s) * scale, (z * s - 0.5) * scale] as const)
);

const xyz = await initXyzPlot({ target: getCanvas(), pointSize: 0.001 });
xyz.plot3d(points);

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
