import tgpu from 'typegpu';
import { generateHeightMap as generateHeightMapGPU } from './v3.ts';

export async function generateHeightMap(device: GPUDevice, size: readonly [number, number]): Promise<GPUBuffer> {
  const root = tgpu.initFromDevice({ device });
  const genStart = performance.now();
  const buffer = generateHeightMapGPU(root, size);
  root['~unstable'].flush();
  await root.device.queue.onSubmittedWorkDone();
  const genEnd = performance.now();

  console.log(`Gen took ${genEnd - genStart}ms`);
  return root.unwrap(buffer);
}
