import './style.css'
import tgpu from 'typegpu';
import * as gen from 'abc-gen';
import * as plot from 'xyz-plot';

// common root for allocating resources
const root = await tgpu.init();

const terrainBuffer = await gen.generateHeightMap(root, { ... });
//    ^? TgpuBuffer<WgslArray<WgslArray<F32>>> & StorageFlag

// ERROR: Argument of type 'TgpuBuffer<WgslArray<WgslArray<F32>>>' is
// not assignable to parameter of type 'TgpuBuffer<WgslArray<F32>>>'
plot.array1d(root, terrainBuffer);

// SUCCESS!
plot.array2d(root, terrainBuffer);
```

We can pass typed values around without the need to copy anything back to
CPU-accessible memory! Let's see an example of how we can construct a type-safe
API:

```ts
import type { StorageFlag, TgpuBuffer, TgpuRoot } from 'typegpu';
import * as d from 'typegpu/data';

// We can define schemas, or functions that return schemas...
const HeightMap = (width: number, height: number) =>
  d.arrayOf(d.arrayOf(d.f32, height), width);

// ...then infer types from them
type HeightMap = ReturnType<typeof HeightMap>;

export async function generateHeightMap(
  root: TgpuRoot,
  opts: { width: number; height: number },
): Promise<TgpuBuffer<HeightMap> & StorageFlag> {
  const buffer = root
    .createBuffer(HeightMap(opts.width, opts.height))
    .$usage('storage');

  const rawBuffer = root.unwrap(buffer); // => GPUBuffer

  // Here we can do anything we would usually do with a
  // WebGPU buffer, like populating it in a compute shader.
  // `rawBuffer` is the WebGPU resource that is backing the
  // typed `buffer` object, meaning any changes to it will
  // be visible in both.

  return buffer;
}