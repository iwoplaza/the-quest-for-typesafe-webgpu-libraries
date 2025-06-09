import tgpu from "typegpu";
import { initXyz as initXyz2, type Options } from "./v3.ts";

export async function initXyz(options: Options) {
  const root = await tgpu.init();

  return initXyz2(root, options);
}
