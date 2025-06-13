import tgpu, { type TgpuRoot } from "typegpu";
import { builtin, u32 } from "typegpu/data";

export interface VersionOptions {
  root: TgpuRoot;
  size: number;
}

export function dispatch2d(root: TgpuRoot, size: readonly [number, number], callback: (x: number, y: number) => void): void {
  const wrappedCallback = tgpu["~unstable"].fn([u32, u32])(callback);

  const mainCompute = tgpu["~unstable"].computeFn({
    workgroupSize: [1, 1],
    in: { id: builtin.globalInvocationId },
  })(({ id }) => {
    // TODO: Early return for overshooting workgroup threads (if workgroup size > 1)
    wrappedCallback(id.x, id.y);
  });

  root["~unstable"]
    .withCompute(mainCompute)
    .createPipeline()
    .dispatchWorkgroups(size[0], size[1]);
}

export function getCanvas() {
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
