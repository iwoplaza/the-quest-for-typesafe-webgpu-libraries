import tgpu from 'typegpu';
import { generateHeightMap as generateHeightMapGPU } from './gpu.ts';

export async function generateHeightMap(size: readonly [number, number]): Promise<number[][]> {
  const root = await tgpu.init();
  return generateHeightMapGPU(root, size).read();
}
