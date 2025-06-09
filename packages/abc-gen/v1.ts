import tgpu from 'typegpu';
import { generateHeightMap as generateHeightMapGPU } from './v2.ts';

export async function generateHeightMap(size: readonly [number, number]): Promise<number[][]> {
  const root = await tgpu.init();
  const genStart = performance.now();
  const buffer = generateHeightMapGPU(root, size);
  await root.device.queue.onSubmittedWorkDone();
  const genEnd = performance.now();

  const downloadStart = performance.now();
  const result = await buffer.read();
  const downloadEnd = performance.now();

  console.log(`Gen took ${genEnd - genStart}ms`);
  console.log(`Download took ${downloadEnd - downloadStart}`);

  return result;
}
