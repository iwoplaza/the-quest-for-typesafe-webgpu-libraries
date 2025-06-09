```ts
type TgpuBuffer<T> = {
  repr: T:
  buffer: GPUBuffer;
};

const buffer = device.createBuffer(...);
const typedBuffer = { buffer } as TgpuBuffer<number[][]>;
const anotherTypedBuffer = { buffer } as TgpuBuffer<number[][]>;
```

```ts
import { arrayOf, f32 } from "typegpu/data";

const buffer = root.createBuffer(arrayOf(f32, 128));
//    ^? TgpuBuffer<WgslArray<F32>>

// Serialize and deserialize automatically
buffer.write([1, 2, 3]);
const values = await buffer.read();

const rawBuffer = root.unwrap(aBuffer);
//    ^? GPUBuffer
```

```js
// before
const gridSizeUniform = root.createUniform(d.u32, 32);

const coordsToIndex = tgpu.fn([d.i32, d.i32], d.i32)((x, y) => {
  return x + y * gridSizeUniform.value;
});

// after
const gridSizeUniform = root.createUniform(d.u32, 32);

const coordsToIndex = tgpu.fn([d.u32, d.u32], d.u32)(tgpu.__assignAst(
  (x, y) => {
    return x + y * gridSizeUniform.value;
  },
  {
    params: [{ type: "i", name: "x" }, { type: "i", name: "y" }],
    body: [0, [[10, [1, "x", "+", [1, "y", "*", [7, "gridSizeUniform", "value"]]]]]],
    externalNames: ["gridSizeUniform"]
  }, { gridSizeUniform }
))
```