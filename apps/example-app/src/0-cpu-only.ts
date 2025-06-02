import "./style.css";
import { generateHeightMap } from "abc-gen";
import { initXyzPlot } from "xyz-plot";

// const terrain = generateHeightMap([4096, 4096]);
//    ^?

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const xyz = await initXyzPlot({ target: canvas });

xyz.plot3d([[0, 0, 0]]);
