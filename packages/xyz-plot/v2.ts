import tgpu from "typegpu";
import { initXyz as initXyz2, type Options } from "./v3.ts";

export async function initXyz(device: GPUDevice, options: Options) {
  const root = await tgpu.initFromDevice({ device });

  return initXyz2(root, options);
}
