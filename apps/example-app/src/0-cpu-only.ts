import "./style.css";
import { generateHeightMap } from "abc-gen";
import { initXyzPlot } from "xyz-plot";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const xyz = await initXyzPlot({ target: canvas });

const size = [10, 10] as const;
// const terrain = generateHeightMap([4096, 4096]);
const terrain = generateHeightMap(size);
//    ^?

const points = terrain.flatMap((col, x) =>
  col.map((y, z) => [x - size[0]/2, y, z - size[1]/2] as [number, number, number])
);

xyz.plot3d(points);
