import "./style.css";
import { generateHeightMap } from "abc-gen";
import { initXyzPlot } from "xyz-plot";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const xyz = await initXyzPlot({ target: canvas });

const size = 10;
// const terrain = generateHeightMap([4096, 4096]);
const terrain = generateHeightMap([size, size]);
//    ^?

const points = terrain.flatMap((col, x) =>
  col.map((y, z) => [x / (size-1) - 0.5, y / (size-1), z / (size-1) - 0.5] as [number, number, number])
);

xyz.plot3d(points);
