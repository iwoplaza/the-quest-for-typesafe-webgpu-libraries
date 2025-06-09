import { generateHeightMap } from "abc-gen";
import { initXyz } from "xyz-plot";

const SIZE = 2048;
const terrain = await generateHeightMap([SIZE, SIZE]);
//    ^?

const transformStart = performance.now();

const s = 1 / (SIZE - 1);
const points = Array.from({ length: SIZE * SIZE }, (_, idx) => {
  const x = idx % SIZE;
  const z = Math.floor(idx / SIZE);
  const y = terrain[x][z];
  // -1 to 1
  const norm = [(x * s - 0.5), (y * s), (z * s - 0.5)];
  // Scaling up
  return norm.map(x => x * 25) as [number, number, number];
});

const transformEnd = performance.now();
console.log(`Transform took ${transformEnd - transformStart}ms`);

const xyz = await initXyz({ target: getCanvas(), pointSize: 0.001 });
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
