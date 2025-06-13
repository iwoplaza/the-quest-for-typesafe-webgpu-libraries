import { TgpuRoot } from 'typegpu';
import { generateHeightMap as generateHeightMapGPU } from './v3.ts';

export async function generateHeightMap(root: TgpuRoot, size: readonly [number, number]): Promise<number[][]> {
  const genStart = performance.now();
  const buffer = generateHeightMapGPU(root, size);
  root['~unstable'].flush();
  await root.device.queue.onSubmittedWorkDone();
  performance.measure('🫐 generating', { start: genStart });

  const downloadStart = performance.now();
  const result = await buffer.read();
  performance.measure('🫐 download', { start: downloadStart });
  buffer.destroy();

  return result;
}
