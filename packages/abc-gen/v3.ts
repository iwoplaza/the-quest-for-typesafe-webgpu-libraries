import tgpu from "typegpu";
import type { StorageFlag, TgpuBuffer, TgpuRoot } from "typegpu";
import * as d from "typegpu/data";
import * as std from 'typegpu/std';
import { perlin2d } from "@typegpu/noise";

const Result = (n: number) => d.arrayOf(d.f32, n);

const layout = tgpu.bindGroupLayout({
  result: { storage: Result, access: "mutable" },
  size: { uniform: d.vec2u },
});

const mainCompute = tgpu["~unstable"].computeFn({
  workgroupSize: [1, 1],
  in: { gid: d.builtin.globalInvocationId },
})(({ gid }) => {
  const uv = std.div(d.vec2f(d.vec2u(gid.x, gid.y)), d.f32(layout.$.size.x));
  const o1 = perlin2d.sample(std.mul(20, uv)) * 50;
  const o2 = perlin2d.sample(std.mul(200, uv)) * 5;
  layout.$.result[gid.x + gid.y * layout.$.size.x] = o1 + o2;
});

const f32Array2d = (x: number, y: number) => d.arrayOf(d.arrayOf(d.f32, y), x);

export function generateHeightMap(
  root: TgpuRoot,
  size: readonly [number, number],
): TgpuBuffer<d.WgslArray<d.WgslArray<d.F32>>> & StorageFlag {
  const buffer = root
    .createBuffer(Result(size[0] * size[1]))
    .$usage("storage");
  const sizeBuffer = root.createBuffer(d.vec2u, d.vec2u(...size)).$usage('uniform');

  const group = root.createBindGroup(layout, {
    result: buffer,
    size: sizeBuffer,
  });

  root["~unstable"]
    .withCompute(mainCompute)
    .createPipeline()
    .with(layout, group)
    .dispatchWorkgroups(size[0], size[1]);

  // Reinterpreting the buffer as a 2d array
  const buffer2d = root
    .createBuffer(f32Array2d(size[0], size[1]), root.unwrap(buffer))
    .$usage('storage');

  return buffer2d;
}
